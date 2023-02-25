import { Controller, Get, Request, Route, Tags } from "@tsoa/runtime";
import { User } from "../../types/UserMetadata";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";

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
}
