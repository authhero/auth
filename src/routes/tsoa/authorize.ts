import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import { getClient } from "../../services/clients";
import { RequestWithContext } from "../../types/RequestWithContext";

@Route("")
@Tags("authorize")
export class AuthorizeController extends Controller {
  @Get("authorize")
  @SuccessResponse(302, "Redirct")
  public async authorize(
    @Request() request: RequestWithContext,
    @Query("client_id") clientId: string,
    @Query("response_type") responseType: string,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string,
    @Query("state") state: string,
    @Query("prompt") prompt?: string,
    @Query("audience") audience?: string,
    @Query("scope") connection?: string
  ): Promise<string> {
    // TODO: Move to middleware
    const client = await getClient(clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Silent authentication
    if (prompt == "none") {
      return "This should render some javascript";
    }

    // Social login
    if (connection) {
      const oauthProvider = client.oauthProviders.find(
        (p) => p.name === connection
      );
      if (!oauthProvider) {
        throw new Error("Connection not found");
      }

      const oauthLoginUrl = new URL(oauthProvider.loginUrl);
      oauthLoginUrl.searchParams.set("scope", scope);
      oauthLoginUrl.searchParams.set("state", state);
      // TODO: this should be pointing to the callback url
      oauthLoginUrl.searchParams.set("redirect_uri", client.loginBaseUrl);
      this.setHeader("locaction", oauthProvider.loginUrl);
      this.setStatus(307);
      return "Redireting to login";
    }

    const url = new URL(request.ctx.request.url);
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", state);

    url.pathname = "/u/login";

    this.setStatus(302);
    this.setHeader("location", url.toString());
    return "Redirect";
  }

  @Get("authorize/resume")
  @SuccessResponse("302", "Redirect")
  public async resume(
    @Request() request: RequestWithContext,
    @Query("state") state: string
  ): Promise<string> {
    // This endpoint seems to set the silent auth cookie and pass the client back

    return state;
  }

  /**
   * A callback endpoint used for oauth2 providers such as google.
   */
  @Get("callback")
  @SuccessResponse("302", "Redirect")
  public async callback(
    @Query("client_id") clientId: string,
    @Query("response_type") responseType: string,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string,
    @Query("audience") audience: string,
    @Query("state") state: string,
    @Query("code") code: string
  ): Promise<string> {
    const client = await getClient(clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    this.setStatus(302);
    this.setHeader("location", redirectUri);
    this.setHeader("content-type", "text/plain");

    return "Redirecting";
  }

  @Get("logout")
  @SuccessResponse("302", "Redirect")
  public async logout(
    @Query("client_id") clientId: string,
    @Query("return_to") returnTo: string
  ): Promise<string> {
    // TODO: validate that the return to is valid for the current clietn
    this.setStatus(302);
    this.setHeader("location", returnTo);
    this.setHeader("content-type", "text/plain");

    return "Redirecting";
  }
}
