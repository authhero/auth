import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Route,
  Tags,
  Path,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { base64ToHex, hexToBase64 } from "../../utils/base64";

@Route("state")
@Tags("state")
export class StateController extends Controller {
  @Get("{id}")
  public async getState(
    @Request() request: RequestWithContext,
    @Path("id") id: string
  ): Promise<any> {
    const stateInstance = request.ctx.env.stateFactory.getInstanceById(
      base64ToHex(id)
    );
    const state = await stateInstance.getState.query();

    if (state) {
      return state;
    }

    this.setStatus(404);
    return "Not found";
  }

  @Post("")
  public async setState(
    @Request() request: RequestWithContext,
    @Body() body: any
  ): Promise<any> {
    const id = request.ctx.env.STATE.newUniqueId();
    const stateInstance = request.ctx.env.stateFactory.getInstanceById(
      id.toString()
    );
    await stateInstance.createState.mutate({
      state: JSON.stringify(body),
    });

    return hexToBase64(id.toString());
  }
}
