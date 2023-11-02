import { EmailDTO } from ".";

export function list(emailStorage: EmailDTO[]) {
  return async (): Promise<EmailDTO[]> => {
    return emailStorage;
  };
}
