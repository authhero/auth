import { Controller, Get, Request, Route, Tags, Query } from "@tsoa/runtime";
import { HTTPException } from "hono/http-exception";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { getUserByEmailAndProvider, getUsersByEmail } from "../../utils/users";

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
}
