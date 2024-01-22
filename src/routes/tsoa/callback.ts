import {
  Controller,
  Get,
  Body,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
  Post,
} from "@tsoa/runtime";
import { socialAuthCallback } from "../../authentication-flows";
import { LoginState, RequestWithContext } from "../../types";
import { stateDecode } from "../../utils/stateEncode";
import { headers } from "../../constants";
@Route("callback")
@Tags("callback")
export class CallbackController extends Controller {
  /**
   * A callback endpoint used for oauth2 providers such as google.
   */
  @Get("")
  @SuccessResponse("302", "Redirect")
  public async getCallback(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
    @Query("code") code?: string,
    @Query("scope") scope?: string,
    @Query("prompt") prompt?: string,
    @Query("authuser") authUser?: string,
    @Query("hd") hd?: string,
    // optional error params
    @Query("error") error?: string,
    @Query("error_description") errorDescription?: string,
    @Query("error_code") errorCode?: string,
    @Query("error_reason") errorReason?: string,
  ): Promise<string> {
    const loginState: LoginState = stateDecode(state);
    if (!loginState) {
      throw new Error("State not found");
    }

    if (error) {
      const { redirect_uri } = loginState.authParams;

      const redirectUri = new URL(redirect_uri!);

      redirectUri.searchParams.set("error", error);
      redirectUri.searchParams.set("error_description", errorDescription!);
      redirectUri.searchParams.set("error_code", errorCode!);
      redirectUri.searchParams.set("error_reason", errorReason!);
      redirectUri.searchParams.set("state", state);

      this.setStatus(302);
      this.setHeader(headers.location, redirectUri.href);
      return "Redirecting";
    }

    if (code) {
      return socialAuthCallback({
        ctx: request.ctx,
        controller: this,
        state: loginState,
        code,
      });
    }

    throw new Error("Invalid request");
  }

  /**
   * A callback endpoint with post used for some oauth2 providers such as apple.
   */
  @Post("")
  @SuccessResponse("302", "Redirect")
  public async postCallback(
    @Request() request: RequestWithContext,
    @Body() body: { state: string; code: string },
  ): Promise<string> {
    const { code, state } = body;
    const loginState: LoginState = stateDecode(state);

    if (!loginState) {
      throw new Error("State not found");
    }

    return socialAuthCallback({
      ctx: request.ctx,
      controller: this,
      state: loginState,
      code,
    });
  }
}
