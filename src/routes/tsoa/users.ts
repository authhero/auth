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
} from "@tsoa/runtime";
import { User } from "../../types/sql/User";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NoUserFoundError, NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";
import { profile } from "console";

@Route("tenants/{tenantId}/users")
@Security("oauth2", [])
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<User[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const users = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .selectAll()
      .offset(parsedRange.from)
      .limit(parsedRange.limit)
      .execute();

    if (parsedRange.entity) {
      this.setHeader(
        headers.contentRange,
        `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${parsedRange.limit}`,
      );
    }

    return users.map((user) => ({
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

    const profile: Profile = await user.getProfile.query();

    return profile;
  }

  @Patch("{userId}")
  public async updateUser(
    @Request() request: RequestWithContext,
    @Body()
    body: Partial<Omit<User, "id" | "createdAt" | "modifiedAt">> & {
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
    body: Omit<User, "id" | "createdAt" | "modifiedAt">,
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

    const db = getDb(ctx.env);

    const doId = `${tenantId}|${user.email}`;
    const userInstance = ctx.env.userFactory.getInstanceByName(doId);

    const result: Profile = await userInstance.patchProfile.mutate({
      ...user,
      connections: [],
      tenantId,
    });

    return result;
  }
}
