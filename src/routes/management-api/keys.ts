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
export class LogsController extends Controller {
  @Get("")
  public async list(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
  ) {
    const { ctx } = request;
    const { env } = ctx;

    const result = await env.data.logs.list(tenantId, {
      page,
      per_page,
      include_totals,
      // TODO - sorting!
      // sort: parseSort(sort),
      q,
    });

    if (include_totals) {
      const res: ListLogsResponse = {
        logs: result.logs,
        start: result.start,
        length: result.length,
        limit: result.limit,
      };
      return res;
    }

    return result.logs;
  }
}
