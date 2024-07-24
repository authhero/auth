import { z } from "zod";

export const hookResponseSchema = z.object({
  state: z.enum(["suceess", "fail"]),
  message: z.string().optional(),
});

export const postUserLoginResponseSchmea = z.object({
  ...hookResponseSchema.shape,
  user_info: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  request_additional_info: z.array(
    z.object({
      name: z.string(),
      description: z.string().default(""),
      type: z.enum(["string", "number", "boolean", "date"]).default("string"),
      optional: z.boolean().default(false),
    }),
  ),
  redirect_url: z.string().optional(),
});
