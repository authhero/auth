import {
  Body,
  Controller,
  Post,
  Request,
  Route,
  Tags,
  Path,
  SuccessResponse,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { HTTPException } from "hono/http-exception";
import userIdGenerate from "../../utils/userIdGenerate";
import { getClient } from "../../services/clients";
import {
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../../utils/users";

interface SignupParams {
  client_id: string;
  connection: string;
  email: string;
  password: string;
}

interface SignupResponse {
  _id: string;
  email: string;
  email_verified: boolean;
  app_metadata: {};
  user_metadata: {};
}

@Route("dbconnections")
@Tags("dbconnections")
export class DbConnectionsController extends Controller {
  @Post("signup")
  @SuccessResponse(200, "Created")
  public async registerUser(
    @Body() body: SignupParams,
    @Request() request: RequestWithContext,
  ): Promise<SignupResponse> {
    if (body.connection !== "Username-Password-Authentication") {
      throw new HTTPException(400, { message: "Connection not found" });
    }

    const { ctx } = request;
    const { env } = ctx;
    const { email } = body;

    const client = await getClient(ctx.env, body.client_id);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const existingUser = await getPrimaryUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
      // we are only allowing this on this route
      provider: "auth2",
    });

    if (existingUser) {
      // Auth0 doesn't inform that the user already exists
      throw new HTTPException(400, { message: "Invalid sign up" });
    }

    const primaryUser = await getPrimaryUserByEmail({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
    });

    const newUser = await env.data.users.create(client.tenant_id, {
      id: `auth2|${userIdGenerate()}`,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: false,
      provider: "auth2",
      connection: "Username-Password-Authentication",
      is_social: false,
      login_count: 0,
      linked_to: primaryUser ? primaryUser.id : undefined,
    });

    return {
      _id: newUser.id,
      email: newUser.email,
      email_verified: false,
      app_metadata: {},
      user_metadata: {},
    };
  }
}
