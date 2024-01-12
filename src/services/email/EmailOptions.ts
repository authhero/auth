interface EmailUser {
  email: string;
  name: string;
}

export interface EmailOptions {
  to: EmailUser[];
  from: EmailUser;
  subject: string;
  content: {
    type: "text/plain" | "text/html";
    value: string;
  }[];
}
