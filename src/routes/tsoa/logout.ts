import { Env, RequestWithContext } from "../../types";
import {
  Query,
  Controller,
  Get,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import { getClient } from "../../services/clients";
import { serializeClearCookie } from "../../services/cookies";
import { headers } from "../../constants";

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
    @Query("client_id") clientId: string,
    @Query("return_to") returnTo?: string
  ) {
    const client = await getClient(request.ctx.env, clientId);

    const redirectUri = returnTo || request.ctx.headers.get("referer");
    if (!redirectUri) {
      throw new Error("No return to url found");
    }

    if (
      !client.allowedCallbackUrls.some((callbackUrl) => {
        const regex = new RegExp(callbackUrl, "i");
        return regex.test(redirectUri);
      })
    ) {
      throw new Error("Invalid return to url");
    }

    this.setStatus(302);
    serializeClearCookie().forEach((cookie) => {
      this.setHeader(headers.setCookie, cookie);
    });
    this.setHeader(headers.location, redirectUri);

    return "Redirecting";
  }
}
