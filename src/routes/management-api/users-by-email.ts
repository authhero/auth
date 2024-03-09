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
import { HTTPException } from "hono/http-exception";
import { UserResponse } from "../../types/auth0/UserResponse";
import { enrichUser } from "../../utils/enrichUser";

@Route("api/v2/users-by-email")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersByEmailController extends Controller {
  @Get("")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") email: string,
    @Header("tenant-id") tenant_id: string,
  ): Promise<UserResponse[]> {
    const { env } = request.ctx;

    request.ctx.set("tenantId", tenant_id);

    const users = await env.data.users.getByEmail(tenant_id, email);

    const primarySqlUsers = users.filter((user) => !user.linked_to);

    const response: UserResponse[] = await Promise.all(
      primarySqlUsers.map(async (primarySqlUser) => {
        return await enrichUser(env, tenant_id, primarySqlUser);
      }),
    );
    return response;
  }
}
