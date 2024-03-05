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

/*
    Auth0 sends this:
    client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW"
    connection: "Username-Password-Authentication"
    email: "dan+456@sesamy.com"
  */

interface ChangePasswordParams {
  client_id: string;
  connection: string;
  email: string;
}

@Route("dbconnections")
@Tags("dbconnections")
export class DbConnectionsController extends Controller {
  @Post("signup")
  @SuccessResponse(200)
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
    });

    // Store the password
    await ctx.env.data.passwords.create(client.tenant_id, {
      user_id: newUser.id,
      password: body.password,
    });

    return {
      _id: newUser.id,
      email: newUser.email,
      email_verified: false,
      app_metadata: {},
      user_metadata: {},
    };
  }

  @Post("change_password")
  @SuccessResponse(200, "We've just sent you an email to reset your password.")
  public async sendPasswordResetEmail(
    @Body() body: ChangePasswordParams,
    @Request() request: RequestWithContext,
  ) {
    const { ctx } = request;
    const { env } = ctx;
    const { email } = body;

    if (body.connection !== "Username-Password-Authentication") {
      throw new HTTPException(400, { message: "Connection not found" });
    }

    const client = await getClient(ctx.env, body.client_id);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const user = await getPrimaryUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
      // we are only allowing this on this route... I'm not sure how it could be different!
      provider: "auth2",
    });

    // always returns the same success! doesn't matter if email is bad, if user is non-existent!
    if (!user) {
      return "We've just sent you an email to reset your password.";
    }

    // Need to decide what to do here then! dependent on next PR
    // await env.data.email.sendCode(env, client, email, code);

    // are we sending them to a login2 page?  an update-password page?
    // IF SO - this is non-standard...
    return "We've just sent you an email to reset your password.";
  }
}
