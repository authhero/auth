export interface EmailUser {
  email: string;
  name: string;
}

export interface EmailOptions {
  to: EmailUser[];
  from: EmailUser;
  subject: string;
  content: {
    type: "text/plain";
    value: string;
  }[];
}

export interface SendEmail {
  (emailOptions: EmailOptions): Promise<void>;
}

export default async function send(emailOptions: EmailOptions) {
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: emailOptions.to,
        },
      ],
      ...emailOptions,
    }),
  });
}
