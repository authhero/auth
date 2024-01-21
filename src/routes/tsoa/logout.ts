import { RequestWithContext } from "../../types";
import {
  Query,
  Controller,
  Get,
  Request,
  Route,
  Tags,
  SuccessResponse,
  Header,
} from "@tsoa/runtime";
import { getClient } from "../../services/clients";
import {
  getStateFromCookie,
  serializeClearCookie,
} from "../../services/cookies";
import { headers } from "../../constants";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { HTTPException } from "hono/http-exception";
@Route("v2/logout")
@Tags("logout")
export class LogoutController extends Controller {
  /**
   * Clears any cookies used for auth and redirects to the return_to url.
   */
  @Get("")
  @SuccessResponse(302)
  public async logout(
    @Request() request: RequestWithContext,
    @Query() client_id: string,
    @Query() returnTo?: string,
    @Header() cookie?: string,
  ) {
    const client = await getClient(request.ctx.env, client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const redirectUri = returnTo || request.ctx.req.header("referer");
    if (!redirectUri) {
      throw new Error("No return to url found");
    }

    if (!validateRedirectUrl(client.allowed_logout_urls, redirectUri)) {
      throw new HTTPException(403, {
        message: `Invalid logout URI - ${redirectUri}`,
      });
    }

    if (cookie) {
      const tokenState = getStateFromCookie(cookie);

      if (tokenState) {
        await request.ctx.env.data.sessions.remove(
          client.tenant_id,
          tokenState,
        );
      }
    }

    this.setStatus(302);
    serializeClearCookie().forEach((cookie) => {
      this.setHeader(headers.setCookie, cookie);
    });
    this.setHeader(headers.location, redirectUri);

    return "Redirecting";
  }
}
