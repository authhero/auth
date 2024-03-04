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

/*
    auth0.js sends this

    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW"
    connection: "Username-Password-Authentication"
    email: "dan+new-signup-loginDELETEME@sesamy.com"
    password: "Hey-Ho-Go-1234"
*/

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

// note plural dbconnectionS - not the same as {clientId}/dbconnection
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
      // we are only allowing this on this route... I'm not sure how it could be different!
      provider: "auth2",
    });

    if (existingUser) {
      // we can copy what auth0 returns here
      // Auth0 doesn't inform that the user already exists
      throw new HTTPException(400, { message: "Invalid sign up" });
    }

    const primaryUser = await getPrimaryUserByEmail({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
    });

    const newUser = await env.data.users.create(client.tenant_id, {
      id: `email|${userIdGenerate()}`,
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

    // What do we return here if we are signing up a linked account?
    // TODO - I think we handle account linking LAST
    // investigate on auth0
    // i. sign in with a new code use dan+newcodeuser@sesamy.com
    // ii. then register... see what happens

    return {
      _id: newUser.id,
      email: newUser.email,
      // this is the crux of the issue!  8-)   What to do here?
      email_verified: false,
      app_metadata: {},
      user_metadata: {},
    };
  }
}
