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
  Query,
} from "@tsoa/runtime";
import { User } from "../../types/sql/User";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { InsertResult } from "kysely";

@Route("tenants/{tenantId}/users")
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string
  ): Promise<User[]> {
    const db = getDb(request.ctx.env);
    const query = db.selectFrom("users").selectAll();
    query.where("users.tenantId", "=", tenantId);
    const users = await query.execute();

    return users;
  }

  @Patch("{userId}")
  public async updateUser(
    @Request() request: RequestWithContext,
    @Body()
    updateUserParams: Partial<Omit<User, "id" | "createdAt" | "modifiedAt">>,
    @Path("userId") userId: string,
    @Path("tenantId") tenantId: string
  ): Promise<number> {
    const db = getDb(request.ctx.env);
    const result = await db
      .updateTable("users")
      .set(updateUserParams)
      .where("users.id", "=", userId)
      .where("users.tenantId", "=", tenantId)
      .execute();

    return result.length;
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postUser(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body() user: Omit<User, "createdAt" | "modifiedAt" | "tenantId">
  ): Promise<InsertResult[]> {
    const db = getDb(request.ctx.env);

    const value = {
      ...user,
      tenantId,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    const result = await db.insertInto("users").values(value).execute();

    return result;
  }
}
