import { User } from "../../../types";

/** Mysql doesn't have a boolean type so it uses a integer instead */
export function fixBooleans(user: User) {
  if (user.email_verified !== undefined) {
    user.email_verified = !!user.email_verified;
  }

  if (user.is_social !== undefined) {
    user.is_social = !!user.is_social;
  }

  return user;
}
