import {
  Controller,
  Get,
  Post,
  Request,
  Route,
  Tags,
  Body,
  Query,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";
import userIdGenerate from "../../utils/userIdGenerate";
import { HTTPException } from "hono/http-exception";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { renderMessage, renderSignup } from "../../templates/render";
import { AuthorizationResponseType, Env, User } from "../../types";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";
import { getUserByEmailAndProvider, getUsersByEmail } from "../../utils/users";

interface LoginParams {
  username: string;
  password: string;
}

async function handleLogin(
  env: Env,
  controller: Controller,
  user: User,
  session: UniversalLoginSession,
) {
  if (session.authParams.redirect_uri) {
    const responseType =
      session.authParams.response_type ||
      AuthorizationResponseType.TOKEN_ID_TOKEN;

    const authResponse = await generateAuthResponse({
      env,
      userId: user.id,
      sid: nanoid(),
      responseType,
      authParams: session.authParams,
      user,
    });

    return applyTokenResponse(controller, authResponse, session.authParams);
  }

  // This is just a fallback in case no redirect was present
  return renderMessage(env, controller, {
    ...session,
    page_title: "Logged in",
    message: "You are logged in",
  });
}

@Route("u")
@Tags("login ui")
export class LoginController extends Controller {
  /**
   * Validates a link sent to the user's email
   */
  @Get("validate-email")
  public async validateEmail(
    @Request() request: RequestWithContext,
    @Query("code") code: string,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const email = session.authParams.username;
    if (!email) {
      throw new HTTPException(400, { message: "Username not found in state" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const user = await getUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
      provider: "auth2",
    });
    if (!user) {
      throw new HTTPException(500, { message: "No user found" });
    }

    const codes = await env.data.codes.list(client.tenant_id, user.id);
    const foundCode = codes.find((storedCode) => storedCode.code === code);

    if (!foundCode) {
      throw new HTTPException(400, { message: "Code not found or expired" });
    }

    await env.data.users.update(client.tenant_id, user.id, {
      email_verified: true,
    });

    const usersWithSameEmail = await getUsersByEmail(
      env.data.users,
      client.tenant_id,
      email,
    );
    const usersWithSameEmailButNotUsernamePassword = usersWithSameEmail.filter(
      (user) => user.provider !== "auth2",
    );

    if (usersWithSameEmailButNotUsernamePassword.length > 0) {
      const primaryUsers = usersWithSameEmailButNotUsernamePassword.filter(
        (user) => !user.linked_to,
      );

      // these cases are currently not handled! if we think they're edge cases and we release this, we should at least inform datadog!
      if (primaryUsers.length > 1) {
        console.error("More than one primary user found for email", email);
      }

      if (primaryUsers.length === 0) {
        console.error("No primary user found for email", email);
        // so here we should ... hope there is only one usersWithSameEmailButNotUsernamePassword
        // and then follow that linked_to chain?
      }

      // now actually link this username-password user to the primary user
      if (primaryUsers.length === 1) {
        await env.data.users.update(client.tenant_id, user.id, {
          linked_to: primaryUsers[0].id,
        });
      }
    }

    // what should we actually do here?
    return "email validated";
  }

  @Post("signup")
  public async postSignup(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    if (session.authParams.username !== loginParams.username) {
      session.authParams.username = loginParams.username;
      await env.data.universalLoginSessions.update(session.id, session);
    }

    try {
      // TODO - filter by primary user
      let [user] = await getUsersByEmail(
        env.data.users,
        client.tenant_id,
        loginParams.username,
      );

      if (!user) {
        // Create the user if it doesn't exist
        user = await env.data.users.create(client.tenant_id, {
          id: `auth2|${userIdGenerate()}`,
          email: loginParams.username,
          name: loginParams.username,
          provider: "auth2",
          connection: "Username-Password-Authentication",
          email_verified: false,
          last_ip: "",
          login_count: 0,
          is_social: false,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await env.data.passwords.create(client.tenant_id, {
        user_id: user.id,
        password: loginParams.password,
      });

      // if (client.email_validation === "enforced") {
      //   // Update the username in the state
      //   await setLoginState(env, state, {
      //     ...loginState,
      //     authParams: {
      //       ...loginState.authParams,
      //       username: loginParams.username,
      //     },
      //   });

      //   return renderEmailValidation(env.AUTH_TEMPLATES, this, loginState);
      // }

      return handleLogin(env, this, user, session);
    } catch (err: any) {
      return renderSignup(env, this, session, state, err.message);
    }
  }
}
