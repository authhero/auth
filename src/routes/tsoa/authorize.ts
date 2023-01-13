import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
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
    @Query("audience") audience?: string
  ): Promise<string> {
    // Silent authentication
    if (prompt == "none") {
      return "This should render some javascript";
    }

    const url = new URL(request.ctx.request.url);
    url.pathname = "/login";

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
    @Query("state") state: string
  ): Promise<string> {
    // TODO: validate that the return to is valid for the current clietn

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
