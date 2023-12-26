import {
  Controller,
  Get,
  Header,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { z } from "zod";
import { ListLogsResponse } from "../../adapters/interfaces/Logs";

export const LogsFilterSchema = z.object({
  userId: z.string(),
});

@Route("api/v2/keys/signing")
@Tags("keys")
@Security("oauth2managementApi", [""])
export class KeysController extends Controller {
  @Get("")
  public async list(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
  ) {
    const { ctx } = request;
    const { env } = ctx;

    const result = await env.data.keys.list();

    return result;
  }
}
