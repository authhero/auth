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
import { RequestWithContext } from "../../types/RequestWithContext";
import { Profile } from "../../types";
import {
  UserResponse,
  PostUsersBody,
  GetUserResponseWithTotals,
} from "../../types/auth0/UserResponse";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";

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
      const identities = [];

      return {
        ...user,
        user_id: user.id,
        logins_count: 0,
        last_ip: "",
        last_login: "",
        identities,
        // some fields copied from previous adapter/planetscale/list mapping
        // TODO: store this field in sql
        email_verified: true,
        username: user.email,
        phone_number: "",
        phone_verified: false,
      };
    });

    if (include_totals) {
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

  @Get("{user_id}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("user_id") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    const user = await env.data.users.get(tenantId, userId);

    if (!user) {
      throw new HTTPException(404);
    }

    const { id, ...userWithoutId } = user;

    return {
      // TODO: Default value. Patch all users to have this value
      logins_count: 0,
      ...userWithoutId,
      identities: [],
      user_id: user.id,
    };
  }

  @Delete("{user_id}")
  @SuccessResponse(200, "Delete")
  public async deleteUser(
    @Request() request: RequestWithContext,
    @Path("user_id") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const result = await env.data.users.remove(tenantId, userId);

    if (!result) {
      throw new HTTPException(404);
    }

    return "OK";
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

    const data = await env.data.users.create(tenantId, {
      email,
      id: `email|${nanoid()}`,
      tenant_id: tenantId,
      name: email,
      provider: "email",
      connection: "email",
      email_verified: false,
      last_ip: "",
      login_count: 0,
      is_social: false,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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

  @Patch("{user_id}")
  public async patchUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenant_id: string,
    @Path("user_id") user_id: string,
    @Body()
    user: PostUsersBody,
  ): Promise<boolean> {
    const { env } = request.ctx;

    const results = await env.data.users.update(tenant_id, user_id, user);

    await env.data.logs.create({
      category: "update",
      message: "User profile",
      tenant_id,
      user_id,
    });

    return results;
  }

  @Post("{user_id}/identities")
  public async linkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path("user_id") userId: string,
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
