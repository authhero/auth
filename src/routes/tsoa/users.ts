import {
  Controller,
  Get,
  Patch,
  Post,
  Request,
  Route,
  SuccessResponse,
  Tags,
  Body,
  Path,
  Security,
  Header,
  Put,
  Delete,
  Query,
} from "@tsoa/runtime";
import { User } from "../../types/sql/User";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NoUserFoundError, NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";
import { FilterSchema } from "../../types/Filter";

@Route("tenants/{tenantId}/users")
@Security("oauth2managementApi", [""])
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") rangeRequest?: string,
    @Query("filter") filterQuerystring?: string,
  ): Promise<User[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);

    let query = db.selectFrom("users").where("users.tenantId", "=", tenantId);

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

  @Get("{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("userId") userId: string,
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

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

    // Fetch the user from durable object
    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    return user.getProfile.query();
  }

  @Patch("{userId}")
  public async updateUser(
    @Request() request: RequestWithContext,
    @Body()
    body: Partial<
      Omit<Profile, "id" | "created_at" | "modified_at" | "tenantId">
    > & {
      password?: string;
    },
    @Path("userId") userId: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(request.ctx.env);
    const user = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .select("email")
      .executeTakeFirst();

    if (!user) {
      throw new NoUserFoundError();
    }

    const doId = `${tenantId}|${user.email}`;
    const userInstance = env.userFactory.getInstanceByName(doId);

    if (body.password) {
      await userInstance.setPassword.mutate(body.password);
    }

    return userInstance.getProfile.query();
  }

  @Put("{userId}")
  public async putUser(
    @Request() request: RequestWithContext,
    @Body()
    body: Omit<Profile, "id" | "created_at" | "modified_at" | "tenantId">,
    @Path("userId") userId: string,
    @Path("tenantId") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const doId = `${tenantId}|${body.email}`;
    const userInstance = env.userFactory.getInstanceByName(doId);

    return userInstance.patchProfile.mutate({
      ...body,
      tenantId,
    });
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    user: Omit<
      User,
      "tenantId" | "created_at" | "modified_at" | "id" | "tags"
    > &
      Partial<Pick<User, "created_at" | "modified_at" | "id" | "tags">>,
  ): Promise<Profile> {
    const { ctx } = request;

    const doId = `${tenantId}|${user.email}`;
    const userInstance = ctx.env.userFactory.getInstanceByName(doId);

    const result: Profile = await userInstance.createUser.mutate({
      ...user,
      connections: [],
      tenantId,
    });
    return result;
  }

  @Delete("{userId}")
  @SuccessResponse(200, "Delete")
  public async deleteUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("userId") userId: string,
  ) {
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

    try {
      // Fetch the user from durable object
      const user = env.userFactory.getInstanceByName(
        getId(tenantId, dbUser.email),
      );

      await user.delete.mutate();
    } catch (err: any) {
      if (err.message === "Not Found") {
        // If a user is cleared in DO but still available in sql. Should never happen
        await db
          .deleteFrom("users")
          .where("users.tenantId", "=", tenantId)
          .where("users.id", "=", userId)
          .execute();
      } else {
        throw err;
      }
    }

    return "OK";
  }
}
