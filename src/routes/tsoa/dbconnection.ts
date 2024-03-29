import {
  Body,
  Controller,
  Post,
  Request,
  Route,
  Tags,
  Path,
  SuccessResponse,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { HTTPException } from "hono/http-exception";
import userIdGenerate from "../../utils/userIdGenerate";
import { getClient } from "../../services/clients";

interface ResetPasswordParams {
  client_id?: string;
  connection: string;
  email: string;
}

interface VerifyEmailParams {
  client_id?: string;
  code: string;
  email: string;
}

interface RegisterParams {
  email: string;
  password: string;
}

@Route("{clientId}/dbconnection")
@Tags("dbconnection")
export class DbConnectionController extends Controller {
  @Post("register")
  @SuccessResponse(201, "Created")
  public async registerUser(
    @Body() body: RegisterParams,
    @Request() request: RequestWithContext,
    @Path() clientId: string,
  ): Promise<string> {
    const { ctx } = request;

    const client = await getClient(ctx.env, clientId);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    // Ensure the user exists
    // TODO - filter this don't just take first
    let [user] = await ctx.env.data.users.getByEmail(
      client.tenant_id,
      body.email,
    );
    if (!user) {
      user = await ctx.env.data.users.create(client.tenant_id, {
        id: `email|${userIdGenerate()}`,
        email: body.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: false,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        is_social: false,
        login_count: 0,
      });
    }

    // Store the password
    await ctx.env.data.passwords.create(client.tenant_id, {
      user_id: user.id,
      password: body.password,
    });

    this.setStatus(201);
    return "OK";
  }

  @Post("reset_password")
  public async resetPassword(
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext,
    @Path() clientId: string,
  ): Promise<string> {
    throw new Error("Not implemented");
  }

  @Post("verify_email")
  public async verifyEmail(
    @Body() body: VerifyEmailParams,
    @Request() request: RequestWithContext,
    @Path() clientId: string,
  ): Promise<string> {
    throw new Error("Not implemented");
  }
}
