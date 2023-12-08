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
  ): Promise<User[]> {
    // This should be ResponseUser!  8-)
    const { env } = request.ctx;

    const user = await env.data.users.getByEmail(tenant_id, email);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // Step 1 - return this user in array
    // Step 2 - return all users with this email address
    // Step 3- filter out linked users e.g. linked_to field is populated
    // Step 4 - return nested identities
    // don't overthink this last step. copy-paste but have tests so can TDD
    return [user];
  }
}
