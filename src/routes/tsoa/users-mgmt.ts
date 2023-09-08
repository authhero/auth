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
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";
import { User } from "../../types/sql/User";

@Route("api/v2")
@Tags("management-api")
// TODO - need security!
// @Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
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
}
