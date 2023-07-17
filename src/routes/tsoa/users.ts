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
} from "@tsoa/runtime";
import { User } from "../../types/sql/User";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  NoUserFoundError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors";
import { getId } from "../../models";
import { Env, Profile } from "../../types";
import { Context } from "cloudworker-router";

async function checkAccess(ctx: Context<Env>, tenantId: string, id: string) {
  const db = getDb(ctx.env);

  const user = await db
    .selectFrom("users")
    .innerJoin("tenants", "tenants.id", "users.tenantId")
    .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
    .where("admin_users.id", "=", ctx.state.user.sub)
    .where("tenants.id", "=", tenantId)
    .where("users.id", "=", id)
    .select("users.id")
    .executeTakeFirst();

  if (!user) {
    // Application not found. Could be that the user has no access
    throw new NotFoundError();
  }
}

@Route("tenants/{tenantId}/users")
@Security("oauth2", [])
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string
  ): Promise<User[]> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const users = await db
      .selectFrom("users")
      .innerJoin("tenants", "tenants.id", "users.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .selectAll("users")
      .execute();

    return users;
  }

  @Get("{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Path("userId") userId: string
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .innerJoin("tenants", "tenants.id", "users.tenantId")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .where("users.id", "=", userId)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    // Fetch the user from durable object
    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email)
    );

    return user.getProfile.query();
  }

  @Patch("{userId}")
  public async updateUser(
    @Request() request: RequestWithContext,
    @Body()
    body: Partial<Omit<User, "id" | "createdAt" | "modifiedAt">> & {
      password?: string;
    },
    @Path("userId") userId: string,
    @Path("tenantId") tenantId: string
  ): Promise<Profile> {
    const { env } = request.ctx;

    await checkAccess(request.ctx, tenantId, userId);

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

  @Post("")
  @SuccessResponse(201, "Created")
  public async postUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    user: Omit<User, "tenantId" | "createdAt" | "modifiedAt" | "id"> &
      Partial<Pick<User, "createdAt" | "modifiedAt" | "id">>
  ): Promise<Profile> {
    const { ctx } = request;

    const db = getDb(ctx.env);

    const tenant = await db
      .selectFrom("tenants")
      .innerJoin("admin_users", "tenants.id", "admin_users.tenantId")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("tenants.id", "=", tenantId)
      .select("tenants.id")
      .executeTakeFirst();

    if (!tenant) {
      throw new UnauthorizedError();
    }

    const doId = `${tenantId}|${user.email}`;
    const userInstance = ctx.env.userFactory.getInstanceByName(doId);

    const result = await userInstance.patchProfile.mutate({
      ...user,
      connections: [],
      tenantId,
    });

    return result as Profile;
  }
}
