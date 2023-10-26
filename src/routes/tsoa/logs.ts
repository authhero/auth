import {
  Controller,
  Get,
  Path,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { z } from "zod";
import { headers } from "../../constants";

export const LogsFilterSchema = z.object({
  userId: z.string(),
});

@Route("tenants/{tenantId}/logs")
@Tags("logs")
@Security("oauth2managementApi", [""])
export class LogsController extends Controller {
  @Get("")
  public async getUserLogs(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Query("filter") filterJson: string,
    // TODO - implement these in SQL
    @Query("range") range?: string,
    @Query("sort") sort?: string,
  ) {
    const { ctx } = request;
    const { env } = ctx;

    const filter = LogsFilterSchema.parse(JSON.parse(filterJson));

    const db = getDb(env);
    // TODO - this needs to be an adaptor of course! so we can support in-memory
    const logs = await db
      .selectFrom("logs")
      .where("logs.tenant_id", "=", tenantId)
      .where("logs.user_id", "=", filter.userId)
      .selectAll()
      .executeTakeFirst();

    // need to also do this? check what code has changed...
    // this.setHeader(headers.contentRange, `logs=${0}-${10}/${logs.length}`);

    return logs;
  }
}
