export interface PasswordResponse {
  valid: boolean;
  message: string;
}

export interface PasswordParams {
  user_id: string;
  password: string;
}
