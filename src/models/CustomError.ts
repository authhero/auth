import { HTTPException } from "hono/http-exception";
import { StatusCode } from "hono/utils/http-status";

export type HttpExceptionCode =
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_PASSWORD"
  | "USER_NOT_FOUND";

export type HttpExceptionOptions = {
  code: HttpExceptionCode;
  res?: Response;
  message?: string;
  cause?: unknown;
};

export class CustomException extends HTTPException {
  private _code?: HttpExceptionCode;

  constructor(status?: StatusCode, options?: HttpExceptionOptions) {
    super(status, options);
    this._code = options?.code;
  }

  public get code(): HttpExceptionCode | undefined {
    return this._code;
  }
}
