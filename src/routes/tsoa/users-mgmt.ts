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
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { User } from "../../types/sql/User";
import { headers } from "../../constants";
import { FilterSchema } from "../../types/Filter";
import { executeQuery } from "../../helpers/sql";

@Route("api/v2")
@Tags("management-api")
// TODO - need security!
// @Security("oauth2managementApi", [""])
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
}
