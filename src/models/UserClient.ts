import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { IUser, RegisterParams, StatusResponse } from "../types/IUser";

const BASEURL = "http://localhost";

export default class UserClient implements IUser {
  stub: DurableObjectStub;
  ctx: Context<Env>;

  constructor(ctx: Context<Env>, name: string) {
    this.ctx = ctx;

    const namespace = ctx.env.USER;
    this.stub = namespace.get(namespace.idFromName(name));
  }

  async createCode(): Promise<{ code: string }> {
    const url = new URL(BASEURL);
    url.pathname = "createCode";

    const response = await this.stub.fetch(url.toString(), {
      body: JSON.stringify({}),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    return response.json();
  }

  async register(params: RegisterParams): Promise<StatusResponse> {
    const url = new URL(BASEURL);
    url.pathname = "register";

    const response = await this.stub.fetch(url.toString(), {
      body: JSON.stringify(params),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    const body: any = await response.json();
    return body.valid;
  }

  async validateCode(code: string): Promise<StatusResponse> {
    const url = new URL(BASEURL);
    url.pathname = "validateCode";

    const response = await this.stub.fetch(url.toString(), {
      body: JSON.stringify({ code }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    return response.json();
  }

  async validatePassword(password: string): Promise<StatusResponse> {
    const url = new URL(BASEURL);
    url.pathname = "validatePassword";

    const response = await this.stub.fetch(url.toString(), {
      body: JSON.stringify({ password }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    return response.json();
  }
}
