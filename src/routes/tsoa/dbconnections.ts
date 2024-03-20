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
import { getPrimaryUserByEmailAndProvider } from "../../utils/users";
import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";
import { nanoid } from "nanoid";
import { AuthParams } from "../../types";
import generateOTP from "../../utils/otp";
import { sendEmailVerificationEmail } from "../../authentication-flows/passwordless";
import validatePassword from "../../utils/validatePassword";

const CODE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

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

    // auth0 returns a detailed JSON response with the way the password does match the strength rules
    if (!validatePassword(body.password)) {
      throw new HTTPException(400, {
        message: "Password does not meet the requirements",
      });
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

    await sendEmailVerificationEmail({
      env,
      client,
      user: newUser,
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
      provider: "auth2",
    });

    // route always returns success
    if (!user) {
      return "We've just sent you an email to reset your password.";
    }

    const authParams: AuthParams = {
      client_id: body.client_id,
      username: email,
    };

    const session: UniversalLoginSession = {
      id: nanoid(),
      client_id: client.id,
      tenant_id: client.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
      ).toISOString(),
      authParams,
    };

    const state = session.id;

    await env.data.universalLoginSessions.create(session);

    const code = generateOTP();

    await env.data.codes.create(client.tenant_id, {
      id: nanoid(),
      code,
      type: "password_reset",
      user_id: user.id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
    });

    await env.data.email.sendPasswordReset(env, client, email, code, state);

    return "We've just sent you an email to reset your password.";
  }
}
