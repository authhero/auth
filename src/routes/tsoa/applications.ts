import {
  Controller,
  Get,
  Post,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { Application } from "../../types/sql";

@Route("applications")
@Tags("applications")
export class ApplicationsController extends Controller {
  @Get("")
  public async listApplications(
    @Request() request: RequestWithContext
  ): Promise<Application[]> {
    const db = getDb(request.ctx);
    const applications = await db
      .selectFrom("applications")
      .selectAll()
      .execute();

    return applications;
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postApplications(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Application, "id">
  ): Promise<Application> {
    const db = getDb(request.ctx);
    const application = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("applications").values(application).execute();

    this.setStatus(201);
    return application;
  }
}
