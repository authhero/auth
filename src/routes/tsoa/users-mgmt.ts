import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Post,
  Tags,
  Path,
  Header,
  SuccessResponse,
  Body,
  Delete,
  Put,
  Security,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { ConflictError, NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { User } from "../../types/sql/User";
import { headers } from "../../constants";
import { FilterSchema } from "../../types/Filter";
import { executeQuery } from "../../helpers/sql";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2")
@Tags("management-api")
// TODO - check with NPM lib auth0/node @ https://github.com/sesamyab/auth0-management-api-demo/ - that this can create the correct token
// ALSO - are we checking these scopes? read:users update:users create:users delete:users
@Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("users")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Header("range") rangeRequest?: string,
    @Query("filter") filterQuerystring?: string,
  ): Promise<User[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);

    let query = db.selectFrom("users").where("users.tenantId", "=", tenantId);

    // TODO - check this still actually works using auth0/node on the demo repo https://github.com/sesamyab/auth0-management-api-demo
    if (filterQuerystring) {
      const filter = FilterSchema.parse(JSON.parse(filterQuerystring));

      if (filter.q) {
        query = query.where((eb) =>
          eb.or([
            eb("name", "like", `%${filter.q}%`),
            eb("email", "like", `%${filter.q}%`),
          ]),
        );
      }
    }

    const { data, range } = await executeQuery(query, rangeRequest);

    if (range) {
      this.setHeader(headers.contentRange, range);
    }

    return data.map((user) => ({
      ...user,
      tags: JSON.parse(user.tags || "[]"),
    }));
  }

  @Get("users/{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    return user.getProfile.query();
  }

  @Delete("users/{userId}")
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
      .where("users.tenantId", "=", tenantId)
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

  @Get("users-by-email")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") userEmail: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.email", "=", userEmail)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    return user.getProfile.query();
  }

  @Post("users")
  @SuccessResponse(201, "Created")
  public async postUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Body()
    user: Omit<User, "tenantId" | "createdAt" | "modifiedAt" | "id"> &
      Partial<Pick<User, "createdAt" | "modifiedAt" | "id">>,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const userInstance = env.userFactory.getInstanceByName(
      getId(tenantId, user.email),
    );

    return userInstance.createUser.mutate({
      ...user,
      connections: [],
      tenantId,
    });
  }

  @Put("users")
  public async putUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Body()
    user: Omit<User, "tenantId" | "createdAt" | "modifiedAt"> &
      Partial<Pick<User, "createdAt" | "modifiedAt">>,
  ): Promise<Profile> {
    const { ctx } = request;

    const userInstance = ctx.env.userFactory.getInstanceByName(
      getId(tenantId, user.email),
    );

    // I'm assuming that patchProfile isn't actually tested...
    // is it even what we want here? let's see...
    const result: Profile = await userInstance.patchProfile.mutate({
      ...user,
      tenantId,
    });
    return result;
  }

  @Post("users/{userId}/identities")
  public async linkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path("userId") userId: string,
    @Body() body: LinkBodyParams,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(env);
    const currentDbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .select(["users.email"])
      .executeTakeFirst();

    if (!currentDbUser) {
      throw new NotFoundError("Current user not found");
    }

    const linkedDbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", body.link_with)
      .select(["users.email"])
      .executeTakeFirst();

    if (!linkedDbUser) {
      throw new NotFoundError("Linked user not found");
    }

    const currentUser = env.userFactory.getInstanceByName(
      getId(tenantId, currentDbUser.email),
    );

    const linkedUser = env.userFactory.getInstanceByName(
      getId(tenantId, linkedDbUser.email),
    );

    // Link the child account
    await linkedUser.linkToUser.mutate({
      tenantId,
      email: linkedDbUser.email,
      linkWithEmail: currentDbUser.email,
    });

    // Link the parent account
    return currentUser.linkWithUser.mutate({
      tenantId,
      email: currentDbUser.email,
      linkWithEmail: linkedDbUser.email,
    });
  }
}
