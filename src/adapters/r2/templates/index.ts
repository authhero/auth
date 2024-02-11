import { Env } from "../../../types";

export function createTemplatesAdapter(env: Env) {
  return {
    get: async (file: string) => {
      const template = await env.AUTH_TEMPLATES.get(`templates/${file}.liquid`);

      if (!template) {
        return;
      }

      return template.text();
    },
  };
}
