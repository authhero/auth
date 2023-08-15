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
import { nanoid } from "nanoid";
import { NotFoundError } from "../../errors";
import { getDb } from "../../services/db";
import { getId } from "../../models";
import { RequestWithContext } from "../../types/RequestWithContext";
import { z } from "zod";
import { headers } from "../../constants";
import { LogMessage } from "../../types/LogMessage";

export const LogsFilterSchema = z.object({
  userId: z.string(),
});

function applySort(logs: LogMessage[], sort?: string) {
  if (!sort) {
    return logs;
  }

  const [column, order] = JSON.parse(sort);

  logs.sort((a, b) =>
    order === "DESC"
      ? b[column]?.localeCompare(a[column])
      : a[column]?.localeCompare(b[column]),
  );

  return logs;
}

@Route("tenants/{tenantId}/logs")
@Tags("logs")
@Security("oauth2managementApi", [""])
export class LogsController extends Controller {
  applyRange(logs: LogMessage[], range?: string) {
    if (!range) {
      return logs;
    }

    this.setHeader(headers.contentRange, `logs=${0}-${10}/${logs.length}`);

    const [from, to] = JSON.parse(range);

    return logs.slice(from, to);
  }

  @Get("")
  public async getUserLogs(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Query("filter") filterJson: string,
    @Query("range") range?: string,
    @Query("sort") sort?: string,
  ) {
    const { ctx } = request;
    const { env } = ctx;

    const filter = LogsFilterSchema.parse(JSON.parse(filterJson));

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", filter.userId)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    // Fetch the user from durable object
    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    const logs = await user.getLogs.query();

    return this.applyRange(applySort(logs, sort), range).map((log) => ({
      ...log,
      // TODO: this is a temporary hack as we didn't have id in the start. Can be removed once the users are recreated.
      id: nanoid(),
    }));
  }
}
