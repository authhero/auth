import {
  Controller,
  Get,
  Patch,
  Request,
  Route,
  Tags,
  Body,
  Path,
} from "@tsoa/runtime";
import { User } from "../../types/UserMetadata";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";

export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

@Route("users")
@Tags("users")
export class UsersController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext
  ): Promise<User[]> {
    const db = getDb(request.ctx);
    const users = await db.selectFrom("users").selectAll().execute();

    return users;
  }

  @Patch("{userId}")
  public async updateUser(
    @Request() request: RequestWithContext,
    @Body() updateUserParams: UpdateUserParams,
    @Path("userId") userId: number
  ): Promise<number> {
    const db = getDb(request.ctx);
    const result = await db
      .updateTable("users")
      .set(updateUserParams)
      .where("users.id", "=", userId)
      .execute();

    return result.length;
  }
}
