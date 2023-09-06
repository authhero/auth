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
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { User } from "../../types/sql/User";

@Route("api/v2")
@Tags("users-mgmt") // what is tags?
// TODO - need security!
// @Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("users/{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    const userResult = user.getProfile.query();

    return userResult;
  }

  @Get("users-by-email")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") userEmail: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.email", "=", userEmail)
      .selectAll()
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(dbUser.tenantId, dbUser.email),
    );

    const userResult = user.getProfile.query();

    return userResult;
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
    const { ctx } = request;

    const userInstance = ctx.env.userFactory.getInstanceByName(
      getId(tenantId, user.email),
    );

    const result: Profile = await userInstance.createUser.mutate({
      ...user,
      connections: [],
      tenantId,
    });
    return result;
  }
}
