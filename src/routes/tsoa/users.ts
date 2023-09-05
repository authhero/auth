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

@Route("tenants/{tenantId}/users")
@Security("oauth2managementApi", [""])
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") rangeRequest?: string,
  ): Promise<User[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);

    const query = db.selectFrom("users").where("users.tenantId", "=", tenantId);

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
      Omit<Profile, "id" | "createdAt" | "modifiedAt" | "tenantId">
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
    body: Omit<Profile, "id" | "createdAt" | "modifiedAt" | "tenantId">,
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
    user: Omit<User, "tenantId" | "createdAt" | "modifiedAt" | "id"> &
      Partial<Pick<User, "createdAt" | "modifiedAt" | "id">>,
  ): Promise<Profile> {
    const { ctx } = request;

    const doId = `${tenantId}|${user.email}`;
    const userInstance = ctx.env.userFactory.getInstanceByName(doId);

    const result: Profile = await userInstance.patchProfile.mutate({
      ...user,
      connections: [],
      tenantId,
    });
    return result;
  }

  @Delete("{userId}")
  @SuccessResponse(201, "Created")
  public async deleteUser(
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

    return user.delete.mutate();
  }
}
