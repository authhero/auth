import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  Header,
  Security,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { User } from "../../types";
import { HTTPException } from "hono/http-exception";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2/users-by-email")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersByEmailController extends Controller {
  @Get("")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") email: string,
    @Header("tenant-id") tenant_id: string,
  ): Promise<User> {
    const { env } = request.ctx;

    const user = await env.data.users.getByEmail(tenant_id, email);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return user;
  }
}
