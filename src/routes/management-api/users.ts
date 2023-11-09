import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Post,
  Patch,
  Tags,
  Header,
  SuccessResponse,
  Delete,
  Security,
  Path,
  Body,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import {
  UserResponse,
  PostUsersBody,
  // naming is start to get odd here. I suppose we want auth0 types that mirror the mgmt api
  // and then we want internal types... which are defined on our interfaces... TBD
  GetUserResponseWithTotals,
} from "../../types/auth0/UserResponse";
import { SqlCreateUser } from "../../types";
import { HTTPException } from "hono/http-exception";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2/users")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    // Auth0
    @Query() page = 0,
    @Query() per_page = 20,
    @Query() include_totals = false,
    @Query() sort?: string,
    @Query() connection?: string,
    @Query() fields?: string,
    @Query() include_fields?: boolean,
    @Query() q?: string,
    @Query() search_engine?: "v1" | "v2" | "v3",
  ): Promise<UserResponse[] | GetUserResponseWithTotals> {
    const { env } = request.ctx;

    const result = await env.data.users.list(tenantId, {
      page,
      per_page,
      include_totals,
      // TODO - sorting!
      // sort: parseSort(sort),
      q,
    });

    const users: UserResponse[] = result.users.map((user) => {
      const { tags, ...userTrimmed } = user;

      return {
        ...userTrimmed,
        user_id: user.id,
        logins_count: 0,
        last_ip: "",
        last_login: "",
        identities: [],
      };
    });

    if (include_totals) {
      // ah but don't we need to actually provide the totals here?
      // this "as" is going to hide issues
      const res: GetUserResponseWithTotals = {
        users,
        length: result.length,
        start: result.start,
        limit: result.limit,
      };

      return res;
    }

    return users;
  }

  @Get("{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    const db = getDb(env);
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError();
    }

    const { tags, ...userTrimmed } = user;

    return {
      ...userTrimmed,
      // TODO: add missing properties to conform to auth0
      logins_count: 0,
      last_ip: "",
      last_login: "",
      identities: [],
      user_id: user.id,
    };
  }

  @Delete("{userId}")
  @SuccessResponse(200, "Delete")
  public async deleteUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.id", "=", userId)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    return user.delete.mutate();
  }

  @Post("")
  @SuccessResponse(201, "Created")
  /**
   * Create a new user.
   */
  public async postUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Body()
    user: PostUsersBody,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    const { email } = user;

    if (!email) {
      throw new HTTPException(400, { message: "Email is required" });
    }

    const sqlCreateUser: SqlCreateUser = {
      ...user,
      tenant_id: tenantId,
      email,
    };

    const data = await env.data.users.create(tenantId, sqlCreateUser);

    this.setStatus(201);
    const userResponse: UserResponse = {
      ...data,
      user_id: data.id,
      logins_count: 0,
      last_ip: "",
      last_login: "",
      identities: [],
    };

    return userResponse;
  }

  @Patch("{userId}")
  public async patchUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path("userId") userId: string,
    @Body()
    user: PostUsersBody,
  ): Promise<Profile> {
    const { ctx } = request;

    const { email } = user;

    // this is how our system works... doesn't match auth0 though
    // but if our Id for the DO requires an email... it is
    if (!email) {
      throw new Error("Email is required");
    }

    const userInstance = ctx.env.userFactory.getInstanceByName(
      getId(tenantId, email),
    );

    const result: Profile = await userInstance.patchProfile.mutate({
      ...user,
      tenant_id: tenantId,
      email,
    });
    const { tenant_id, id } = result;
    await ctx.env.data.logs.create({
      category: "update",
      message: "User profile",
      tenant_id,
      user_id: id,
    });
    return result;
  }

  @Post("{userId}/identities")
  public async linkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path("userId") userId: string,
    @Body() body: LinkBodyParams,
  ): Promise<Profile> {
    throw new Error("Not implemented");

    // const { env } = request.ctx;

    // const db = getDb(env);
    // const currentDbUser = await db
    //   .selectFrom("users")
    //   .where("users.tenant_id", "=", tenantId)
    //   .where("users.id", "=", userId)
    //   .select(["users.email"])
    //   .executeTakeFirst();

    // if (!currentDbUser) {
    //   throw new NotFoundError("Current user not found");
    // }

    // const linkedDbUser = await db
    //   .selectFrom("users")
    //   .where("users.tenant_id", "=", tenantId)
    //   .where("users.id", "=", body.link_with)
    //   .select(["users.email"])
    //   .executeTakeFirst();

    // if (!linkedDbUser) {
    //   throw new NotFoundError("Linked user not found");
    // }

    // const currentUser = env.userFactory.getInstanceByName(
    //   getId(tenantId, currentDbUser.email),
    // );

    // const linkedUser = env.userFactory.getInstanceByName(
    //   getId(tenantId, linkedDbUser.email),
    // );

    // // Link the child account
    // await linkedUser.linkToUser.mutate({
    //   tenantId,
    //   email: linkedDbUser.email,
    //   linkWithEmail: currentDbUser.email,
    // });
    // const linkedUserProfile = await linkedUser.getProfile.query();
    // const currentUserProfile = await currentUser.getProfile.query();

    // await env.data.logs.create({
    //   category: "link",
    //   message: `Linked to ${currentUserProfile.email}`,
    //   tenant_id: linkedUserProfile.tenant_id,
    //   user_id: linkedUserProfile.id,
    // });

    // // Link the parent account
    // const returnUser = currentUser.linkWithUser.mutate({
    //   tenantId,
    //   email: currentDbUser.email,
    //   linkWithEmail: linkedDbUser.email,
    // });
    // await env.data.logs.create({
    //   category: "link",
    //   message: `Added ${linkedUserProfile.email} as linked user`,
    //   tenant_id: currentUserProfile.tenant_id,
    //   user_id: currentUserProfile.id,
    // });
    // return returnUser;
  }
}
