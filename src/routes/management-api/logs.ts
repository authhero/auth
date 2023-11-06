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

@Route("api/v2/logs")
@Tags("logs")
@Security("oauth2managementApi", [""])
export class LogsController extends Controller {
  @Get("")
  public async getUserLogs(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    // Auth0
    @Query() page = 0,
    @Query() per_page = 20,
    @Query() include_totals = false,
    @Query() sort?: string,
    @Query() fields?: string,
    @Query() include_fields?: boolean,
    @Query() q?: string,
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
      return result as ListLogsResponse;
    }

    return result.logs;
  }
}
