import { UserResponse, Totals } from "../../../types/auth0";
import {
  ListUserParams,
  ListUsersResponse,
} from "../../../adapters/interfaces/User";
import { Database } from "../../../types";
import { Kysely } from "kysely";

// duplicated from tenants
function getCountAsInt(count: string | number | bigint) {
  // VScode complains that parseInt only accepts a string BUT the project builds & lints
  if (typeof count === "string") {
    return parseInt(count, 10);
  }

  if (typeof count === "bigint") {
    return Number(count);
  }

  return count;
}

export function listUsers(db: Kysely<Database>) {
  return async (
    tenantId,
    params: ListUserParams,
  ): Promise<ListUsersResponse> => {
    let query = db.selectFrom("users").where("users.tenant_id", "=", tenantId);

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    if (params.q) {
      query = query.where((eb) => eb.or([eb("name", "like", `%${params.q}%`)]));
    }

    const filteredQuery = query
      .offset((params.page - 1) * params.per_page)
      .limit(params.per_page);

    const usersRaw = await filteredQuery.selectAll().execute();

    const users: UserResponse[] = usersRaw.map((user) => {
      const { id, modified_at, ...userWithoutFields } = user;

      const tags = JSON.parse(user.tags || "[]");

      const userResponse: UserResponse = {
        user_id: user.id,
        // TODO: store this field in sql
        email_verified: true,
        username: user.email,
        phone_number: "",
        phone_verified: false,
        updated_at: modified_at,
        logins_count: 0,
        identities: tags.map((tag) => ({
          profileData: {
            email: user.email,
            user_id: user.id,
            is_social: true,
            connection: tag,
          },
        })),
        ...userWithoutFields,
        // Deprecated
        tags,
      };

      return userResponse;
    });

    if (!params.include_totals) {
      return {
        users,
      };
    }

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      users,
      totals: {
        start: (params.page - 1) * params.per_page,
        limit: params.per_page,
        length: countInt,
      },
    };
  };
}
