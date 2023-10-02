import { GetUserResponse } from "../../types/auth0/UserResponse";
import { getDb } from "../../services/db";
import { Env } from "../../types";
import { ListUserParams } from "../interfaces/User";
import { Totals } from "../../types/auth0/Totals";

export function createAdapter(env: Env) {
  const db = getDb(env);

  return {
    listUsers: async ({
      tenantId,
      page,
      perPage,
      includeTotals,
      q,
    }: ListUserParams) => {
      let query = db
        .selectFrom("users")
        .where("users.tenant_id", "=", tenantId)
        .offset(page * perPage)
        .limit(perPage);

      if (q) {
        const filter = new URLSearchParams(q);

        // Only support email for now
        if (filter.has("email")) {
          query = query.where("email", "=", filter.get("email"));
        }
      }

      const users = await query.selectAll().execute();

      const result: { users: GetUserResponse[]; totals?: Totals } = {
        users: users.map((user) => {
          const { id, modified_at, ...userWithoutFields } = user;

          const tags = JSON.parse(user.tags || "[]");

          const userResponse: GetUserResponse = {
            user_id: user.id,
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
        }),
      };

      if (includeTotals) {
        const [{ count }] = await query
          .select((eb) => eb.fn.countAll().as("count"))
          .execute();

        result.totals = {
          start: page * perPage,
          limit: perPage,
          length: count as number,
        };
      }

      return result;
    },
  };
}
