import {
  Controller,
  Get,
  Header,
  Query,
  Request,
  Route,
  Security,
  Tags,
  Path,
} from "@tsoa/runtime";
import { RequestWithContext, LogsResponse } from "../../types";
import { z } from "zod";
import { ListLogsResponse } from "../../adapters/interfaces/Logs";
import { HTTPException } from "hono/http-exception";
@Route("api/v2/logs")
@Tags("logs")
@Security("oauth2managementApi", [""])
export class LogsController extends Controller {
  @Get("")
  public async getLogs(
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

  @Get("{log_id}")
  public async getLog(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path() log_id: string,
  ) {
    const { ctx } = request;
    const { env } = ctx;

    const log = await env.data.logs.get(tenantId, log_id);

    if (!log) {
      throw new HTTPException(404);
    }

    return log;
  }
}
