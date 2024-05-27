const SESAMY_PASSWORD_LOGIN_SELECTION_COOKIE_NAME =
  "sesamy-password-login-selection";

export function getPasswordLoginSelectionCookieName(client_id: string) {
  if (!client_id) {
    return SESAMY_PASSWORD_LOGIN_SELECTION_COOKIE_NAME;
  }

  return `${SESAMY_PASSWORD_LOGIN_SELECTION_COOKIE_NAME}-${client_id}`;
}

export enum SesamyPasswordLoginSelection {
  password = "password",
  code = "code",
}
