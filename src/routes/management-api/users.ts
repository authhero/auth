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
  Middlewares,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  UserResponse,
  PostUsersBody,
  GetUserResponseWithTotals,
} from "../../types/auth0/UserResponse";
import { HTTPException } from "hono/http-exception";
import userIdGenerate from "../../utils/userIdGenerate";
import userIdParse from "../../utils/userIdParse";
import { Identity } from "../../types/auth0/Identity";
import { enrichUser } from "../../utils/enrichUser";
import { loggerMiddleware, LogTypes } from "../../tsoa-middlewares/logger";

export interface LinkWithBodyParams {
  link_with: string;
}

export interface LinkUserIdBodyParams {
  provider: string;
  connection_id?: string;
  user_id: string;
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

    // Filter out linked users
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
        user_id: user.id,
        identities: [
          {
            connection: user.connection,
            provider: user.provider,
            user_id: userIdParse(user.id),
            isSocial: user.is_social,
          },
          // TODO - need to do the join here with linked accounts
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

    // accept ids without provider for now, but Auth0 has this check
    // if (!user_id.includes("|")) {
    //   throw new HTTPException(400, {
    //     message: "Invalid user_id format",
    //   });
    // }

    const user = await env.data.users.get(tenant_id, user_id);

    if (!user) {
      throw new HTTPException(404);
    }

    const userResponse: UserResponse = await enrichUser(env, tenant_id, user);

    return userResponse;
  }

  @Delete("{user_id}")
  @SuccessResponse(200, "Delete")
  public async deleteUser(
    @Request() request: RequestWithContext,
    @Path() user_id: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const result = await env.data.users.remove(tenantId, user_id);

    if (!result) {
      throw new HTTPException(404);
    }

    return "OK";
  }

  @Post("")
  @SuccessResponse(201, "Created")
  @Middlewares(loggerMiddleware(LogTypes.API_OPERATION, "Create a User"))
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
      id: `email|${userIdGenerate()}`,
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
      user_id: data.id,
      identities: [
        {
          connection: data.connection,
          provider: data.provider,
          user_id: userIdParse(data.id),
          isSocial: data.is_social,
        },
      ],
    };

    return userResponse;
  }

  @Patch("{user_id}")
  @Middlewares(loggerMiddleware(LogTypes.API_OPERATION, "Update a User"))
  public async patchUser(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenant_id: string,
    @Path() user_id: string,
    @Body() user: Partial<PostUsersBody>,
  ): Promise<boolean> {
    const { env } = request.ctx;

    // verify_email is not persisted
    const { verify_email, ...userFields } = user;

    if (userFields.email) {
      const existingUser = await env.data.users.getByEmail(
        tenant_id,
        userFields.email,
      );

      // If there is an existing user with the same email address, and it is not the same user
      if (existingUser.length && existingUser.some((u) => u.id !== user_id)) {
        throw new HTTPException(409, {
          message: "Another user with the same email address already exists.",
        });
      }
    }

    const results = await env.data.users.update(tenant_id, user_id, userFields);

    return results;
  }

  @Post("{user_id}/identities")
  @Middlewares(loggerMiddleware(LogTypes.API_OPERATION, "Link a User"))
  public async linkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path() user_id: string,
    @Body() body: LinkWithBodyParams | LinkUserIdBodyParams,
  ): Promise<Identity[]> {
    const { env } = request.ctx;

    const link_with = "link_with" in body ? body.link_with : body.user_id;

    const user = await env.data.users.get(tenantId, user_id);
    if (!user) {
      throw new HTTPException(400, {
        message: "Linking an inexistent identity is not allowed.",
      });
    }

    await env.data.users.update(tenantId, link_with, {
      linked_to: user_id,
    });

    const linkedusers = await env.data.users.list(tenantId, {
      page: 0,
      per_page: 10,
      include_totals: false,
      q: `linked_to:${user_id}`,
    });

    const identities = [user, ...linkedusers.users].map((u) => ({
      connection: u.connection,
      provider: u.provider,
      user_id: userIdParse(u.id),
      isSocial: u.is_social,
    }));

    this.setStatus(201);
    return identities;
  }

  // what should happen here?  Where we do we specify the linked user? what should this even do?
  @Delete("{user_id}/identities")
  @Middlewares(loggerMiddleware(LogTypes.API_OPERATION, "Unlink a User"))
  public async unlinkUserAccount(
    @Request() request: RequestWithContext,
    @Header("tenant-id") tenantId: string,
    @Path() user_id: string,
  ): Promise<string> {
    const { env } = request.ctx;

    await env.data.users.update(tenantId, user_id, {
      linked_to: undefined,
    });

    this.setStatus(200);
    return "ok";
  }
}
