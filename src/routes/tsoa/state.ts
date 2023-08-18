import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Route,
  Tags,
  Path,
  Security,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { base64ToHex } from "../../utils/base64";

@Route("state")
@Tags("state")
@Security("oauth2managementApi", ["read:state"])
export class StateController extends Controller {
  @Get("{id}")
  public async getState(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
  ): Promise<any> {
    const stateInstance = request.ctx.env.stateFactory.getInstanceById(
      base64ToHex(id),
    );
    const state = await stateInstance.getState.query();

    if (state) {
      return state;
    }

    this.setStatus(404);
    return "Not found";
  }
}
