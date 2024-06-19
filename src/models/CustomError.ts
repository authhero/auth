import { HTTPException } from "hono/http-exception";
import { StatusCode } from "hono/utils/http-status";

export type HTTPExceptionCode =
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_PASSWORD"
  | "USER_NOT_FOUND";

export type HTTPExceptionOptions = {
  code: HTTPExceptionCode;
  res?: Response;
  message?: string;
  cause?: unknown;
};

export class CustomException extends HTTPException {
  private _code?: HTTPExceptionCode;

  constructor(status?: StatusCode, options?: HTTPExceptionOptions) {
    super(status, options);
    this._code = options?.code;
  }

  public get code(): HTTPExceptionCode | undefined {
    return this._code;
  }
}
