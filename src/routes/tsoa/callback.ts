import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import { socialAuthCallback } from "../../authentication-flows";
import { base64ToHex } from "../../utils/base64";
import { LoginState, RequestWithContext } from "../../types";

@Route("callback")
@Tags("callback")
export class CallbackController extends Controller {
  /**
   * A callback endpoint used for oauth2 providers such as google.
   */
  @Get("")
  @SuccessResponse("302", "Redirect")
  public async callback(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
    @Query("scope") scope: string,
    @Query("code") code: string,
    @Query("prompt") prompt: string,
    @Query("authuser") authUser?: string,
    @Query("hd") hd?: string
  ): Promise<string> {
    const { env } = request.ctx;
    const stateInstance = env.stateFactory.getInstanceById(base64ToHex(state));
    const loginString = await stateInstance.getState.query();
    if (!loginString) {
      throw new Error("State not found");
    }

    const loginState: LoginState = JSON.parse(loginString);

    return socialAuthCallback({
      env,
      controller: this,
      state: loginState,
      code,
    });
  }
}
