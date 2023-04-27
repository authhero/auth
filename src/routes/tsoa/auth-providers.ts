import {
  Controller,
  Get,
  Post,
  Patch,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Path,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { AuthProvider } from "../../types/sql";
import { UpdateResult } from "kysely";

@Route("auth-providers")
@Tags("tenants")
export class AuthProvidersController extends Controller {
  @Get("")
  public async listAuthProvides(
    @Request() request: RequestWithContext
  ): Promise<AuthProvider[]> {
    const db = getDb(request.ctx);
    const authProviders = await db
      .selectFrom("authProviders")
      .selectAll()
      .execute();

    return authProviders.map((authProvider) => {
      return {
        ...authProvider,
        clientSecret: "********",
      };
    });
  }

  @Post("")
  @SuccessResponse(201, "Created")
  public async postAuthProviders(
    @Request() request: RequestWithContext,
    @Body() body: Omit<AuthProvider, "id" | "createdAt" | "modifiedAt">
  ): Promise<AuthProvider> {
    const db = getDb(request.ctx);
    const authProvider = {
      ...body,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("authProviders").values(authProvider).execute();

    this.setStatus(201);
    return authProvider;
  }

  @Patch("{id}")
  public async patchAuthProvider(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Body() body: Partial<Omit<AuthProvider, "id" | "createdAt" | "modifiedAt">>
  ): Promise<UpdateResult[]> {
    const db = getDb(request.ctx);
    const authProvider = {
      ...body,
      modifiedAt: new Date().toISOString(),
    };

    const result = await db
      .updateTable("authProviders")
      .set(authProvider)
      .where("id", "=", id)
      .execute();

    this.setStatus(200);
    return result;
  }
}
