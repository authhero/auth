export interface EmailUser {
  email: string;
  name: string;
}

export interface DKIM {
  domain: string;
  dkimPrivateKey: string;
}

export interface EmailOptions {
  to: EmailUser[];
  from: EmailUser;
  subject: string;
  dkim?: DKIM;
  apiKey?: string;
  content: {
    type: "text/plain" | "text/html";
    value: string;
  }[];
}

export interface SendEmail {
  (emailOptions: EmailOptions): Promise<void>;
}
