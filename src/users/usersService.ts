// src/users/usersService.ts
import { User } from "./user";

// A post request should not contain an id.
export type UserCreationParams = Pick<
  User,
  "email" | "name" | "phoneNumbers" | "length"
>;

export class UsersService {
  public get(id: number, name?: string): User {
    if (id === 2) {
      return {
        id,
        email: "markus@sesamy.com",
        name: name ?? "Markus Ahlstrand",
        status: "Sad",
        phoneNumbers: [],
      };
    }

    return {
      id,
      email: "jane@doe.com",
      name: name ?? "Jane Doe",
      status: "Happy",
      phoneNumbers: [],
    };
  }

  public create(userCreationParams: UserCreationParams): User {
    return {
      id: Math.floor(Math.random() * 10000), // Random
      status: "Happy",
      ...userCreationParams,
    };
  }
}
