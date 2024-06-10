import { ListUsersResponse } from "../../interfaces/Users";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";
import { removeNullProperties } from "../helpers/remove-nulls";
import { userToIdentity } from "./user-to-identity";
import userIdParse from "../../../utils/userIdParse";

export function listUsers(db: Kysely<Database>) {
  return async (
    tenantId: string,
    params: ListParams,
  ): Promise<ListUsersResponse> => {
    let query = db.selectFrom("users").where("users.tenant_id", "=", tenantId);
    if (params.q) {
      // NOTE - this isn't faithful to Auth0 as Auth0 does this in the dashboard - we can filter by any field on the Auth0 mgmt api
      query = luceneFilter(db, query, params.q, ["email", "name"]);
    }

    if (params.sort && params.sort.sort_by) {
      const { ref } = db.dynamic;
      query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    }

    const filteredQuery = query
      .offset(params.page * params.per_page)
      .limit(params.per_page);

    const users = await filteredQuery.selectAll().execute();

    const userIds = users.map((u) => u.id);

    // TODO: execute these in parallel with a join
    const linkedUsers = !userIds.length
      ? []
      : await db
          .selectFrom("users")
          .selectAll()
          .where("users.tenant_id", "=", tenantId)
          .where("users.linked_to", "in", userIds)
          .execute();

    const usersWithProfiles = users.map((user) => {
      const linkedUsersForUser = linkedUsers.filter(
        (u) => u.linked_to === user.id,
      );

      return removeNullProperties({
        ...user,
        email_verified: user.email_verified === 1,
        is_social: user.is_social === 1,
        identities: [
          {
            connection: user.connection,
            provider: user.provider,
            user_id: userIdParse(user.id),
            isSocial: Boolean(user.is_social),
          },
          ...linkedUsersForUser.map(userToIdentity),
        ],
      });
    });

    const [{ count }] = await query
      .select((eb) => eb.fn.countAll().as("count"))
      .execute();

    const countInt = getCountAsInt(count);

    return {
      users: usersWithProfiles,
      start: params.page * params.per_page,
      limit: params.per_page,
      length: countInt,
    };
  };
}
