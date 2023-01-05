import generateOTP from "../utils/otp";
import { IUser, RegisterParams, StatusResponse } from "../types/IUser";

interface UserStorage {
  code?: string;
  codeExpireAt?: number;
  password?: string;
}

/**
 * Durable object to create a consistent storage
 */
export class User implements DurableObject, IUser {
  state: DurableObjectState;
  userStorage: UserStorage = {};

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      const userStorage = await this.state.storage.get<UserStorage>(
        "userStorage"
      );

      this.userStorage = userStorage || {};
    });
  }

  async saveUserStorage() {
    await this.state.storage.put<UserStorage>("userStorage", this.userStorage);
  }

  async createCode() {
    this.userStorage.code = generateOTP();
    this.userStorage.codeExpireAt = Date.now() + 300 * 1000;

    return {
      code: this.userStorage.code,
      expireAt: this.userStorage.codeExpireAt,
    };
  }

  async register(params: RegisterParams): Promise<StatusResponse> {
    if (this.userStorage.password) {
      return {
        ok: false,
        code: 409,
        message: "Conflict",
      };
    }

    this.userStorage.password = params.password;

    await this.saveUserStorage();

    return {
      ok: true,
    };
  }

  async validateCode(code: string): Promise<StatusResponse> {
    return {
      ok:
        code === this.userStorage.code &&
        this.userStorage.codeExpireAt !== undefined &&
        Date.now() < this.userStorage.codeExpireAt,
    };
  }

  async validatePassword(password: string): Promise<StatusResponse> {
    console.log("password: " + password);
    console.log("password2: " + this.userStorage.password);
    return {
      ok: password === this.userStorage.password,
    };
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    let result: any;
    switch (request.method) {
      case "POST":
        const body: any = await request.json();

        switch (path) {
          case "createCode":
            result = await this.createCode();
            break;
          case "register":
            result = {
              valid: await this.register(body),
            };
            break;
          case "validateCode":
            result = await this.validateCode(body.code);
            break;
          case "validatePassword":
            result = await this.validatePassword(body.password);
            break;
        }
    }

    if (result) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    return new Response("Not Found", {
      status: 404,
    });
  }
}
