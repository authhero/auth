export interface RegisterParams {
  email: string;
  password: string;
}

export interface StatusResponse {
  ok: boolean;
  code?: number;
  message?: string;
}

export interface IUser {
  createCode: () => Promise<{ code: string }>;
  register: (params: RegisterParams) => Promise<StatusResponse>;
  validateCode: (code: string) => Promise<StatusResponse>;
  validatePassword: (password: string) => Promise<StatusResponse>;
}
