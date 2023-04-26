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
import { Organization } from "../../types/sql/Organization";
import { nanoid } from "nanoid";

@Route("organizations")
@Tags("organizations")
export class OrganizationsController extends Controller {
  @Get("")
  public async listOrganizations(
    @Request() request: RequestWithContext
  ): Promise<Organization[]> {
    const db = getDb(request.ctx);
    const organizations = await db
      .selectFrom("organizations")
      .selectAll()
      .execute();

    return organizations;
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postOrganizations(
    @Request() request: RequestWithContext,
    @Body() body: Omit<Organization, "id">
  ): Promise<Organization> {
    const db = getDb(request.ctx);

    const organization = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    await db.insertInto("organizations").values(organization).execute();

    this.setStatus(201);
    return organization;
  }
}
