import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Post,
  Patch,
  Tags,
  Header,
  SuccessResponse,
  Delete,
  Security,
  Path,
  Body,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  UserResponse,
  PostUsersBody,
  GetUserResponseWithTotals,
} from "../../types/auth0/UserResponse";
import { HTTPException } from "hono/http-exception";
import { Identity } from "../../types/auth0/Identity";
import userIdGenerate from "../../utils/userIdGenerate";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2/users")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("")
  public async listUsers(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    // @minimum 0
    @Query() page = 0,
    // @minimum 1
    @Query() per_page = 20,
    @Query() include_totals = false,
    @Query() sort?: string,
    @Query() connection?: string,
    @Query() fields?: string,
    @Query() include_fields?: boolean,
    @Query() q?: string,
    @Query() search_engine?: "v1" | "v2" | "v3",
  ): Promise<UserResponse[] | GetUserResponseWithTotals> {
    const { env } = request.ctx;

    // Filter out linked userss
    const query: string[] = ["-_exists_:linked_to"];
    if (q) {
      query.push(q);
    }

    const result = await env.data.users.list(tenantId, {
      page,
      per_page,
      include_totals,
      // TODO - sorting!
      // sort: parseSort(sort),
      q: query.join(" "),
    });

    const users: UserResponse[] = result.users.map((user) => {
      const { id, ...userWithoutId } = user;

      return {
        ...userWithoutId,
        user_id: `${user.provider}|${user.id}`,
        identities: [
          {
            connection: user.connection,
            provider: user.provider,
            user_id: user.id,
            isSocial: user.is_social,
          },
        ],
        // TODO: store this field in sql
        username: user.email,
        phone_number: "",
        phone_verified: false,
      };
    });

    if (include_totals) {
      const res: GetUserResponseWithTotals = {
        users,
        length: result.length,
        start: result.start,
        limit: result.limit,
      };

      return res;
    }

    return users;
  }

  @Get("{user_id}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path() user_id: string,
    @Header("tenant-id") tenant_id: string,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    // return 400 if id is not in the format of provider|id
    if (!user_id.includes("|")) {
      // I think I could do better than chatGPT Here 8-)
      throw new HTTPException(400, {
        message: "Invalid user_id format",
      });
      /* Auth0 gives body like
        statusCode: 400,
        error: "Bad Request",
        message: "Object didn't pass validation for format user-id: 6560cd0f6caaac5b4692f454",
        errorCode: "invalid_uri"
      */
    }

    const [provider, idWithouPrefix] = user_id.split("|");

    const user = await env.data.users.get(tenant_id, idWithouPrefix);

    if (!user) {
      throw new HTTPException(404);
    }

    const linkedusers = await env.data.users.list(tenant_id, {
      page: 0,
      per_page: 10,
      include_totals: false,
      q: `linked_to:${idWithouPrefix}`, // assuming linkedin won't have the full id - TBD
    });

    const identities = [user, ...linkedusers.users].map((u) => ({
      connection: u.connection,
      provider: u.provider,
      user_id: u.id, // this will be correct
      isSocial: u.is_social,
    }));

    const { id, ...userWithoutId } = user;

    return {
      ...userWithoutId,
      identities,
      user_id: `${user.provider}|${user.id}`,
    };
  }

  @Delete("{user_id}")
  @SuccessResponse(200, "Delete")
  public async deleteUser(
    @Request() request: RequestWithContext,
    @Path("user_id") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const result = await env.data.users.remove(tenantId, userId);

    if (!result) {
      throw new HTTPException(404);
    }

    return "OK";
  }

  @Post("")
  @SuccessResponse(201, "Created")
  /**
   * Create a new user.
   */
  public async postUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Body() user: PostUsersBody,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    const { email } = user;

    if (!email) {
      throw new HTTPException(400, { message: "Email is required" });
    }

    const data = await env.data.users.create(tenantId, {
      email,
      id: userIdGenerate(),
      tenant_id: tenantId,
      name: email,
      provider: "email",
      connection: "email",
      email_verified: false,
      last_ip: "",
      login_count: 0,
      is_social: false,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.setStatus(201);
    const userResponse: UserResponse = {
      ...data,
      user_id: `${data.provider}|${data.id}`,
      identities: [
        {
          connection: data.connection,
          provider: data.provider,
          user_id: data.id,
          isSocial: data.is_social,
        },
      ],
    };

    return userResponse;
  }

  @Patch("{user_id}")
  public async patchUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenant_id: string,
    @Path("user_id") user_id: string,
    @Body()
    user: PostUsersBody,
  ): Promise<boolean> {
    const { env } = request.ctx;

    const results = await env.data.users.update(tenant_id, user_id, user);

    await env.data.logs.create({
      category: "update",
      message: "User profile",
      tenant_id,
      // Ooooooo, what does this mean though here? Which user Id are we accepting? CHECK IN AUTH0 MGMT API!
      user_id,
    });

    return results;
  }

  @Post("{user_id}/identities")
  public async linkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path("user_id") userId: string,
    @Body() body: LinkBodyParams,
  ): Promise<Identity[]> {
    const { env } = request.ctx;

    const user = await env.data.users.get(tenantId, body.link_with);
    if (!user) {
      throw new HTTPException(400, {
        message: "Linking to an inexistent identity is not allowed.",
      });
    }

    await env.data.users.update(tenantId, userId, {
      linked_to: body.link_with,
    });

    const linkedusers = await env.data.users.list(tenantId, {
      page: 0,
      per_page: 10,
      include_totals: false,
      q: `linked_to:${body.link_with}`,
    });

    const identities = [user, ...linkedusers.users].map((u) => ({
      connection: u.connection,
      provider: u.provider,
      user_id: u.id,
      isSocial: u.is_social,
    }));

    this.setStatus(201);
    return identities;
  }
}
