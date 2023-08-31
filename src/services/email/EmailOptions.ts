export interface EmailUser {
  email: string;
  name: string;
}

export interface EmailOptions {
  to: EmailUser[];
  from: EmailUser;
  subject: string;
  dkim?: string;
  apiKey?: string;
  emailService?: "mailgun" | "mailchannels";
  content: {
    type: "text/plain" | "text/html";
    value: string;
  }[];
}

export interface SendEmail {
  (emailOptions: EmailOptions): Promise<void>;
}
