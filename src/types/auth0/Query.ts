import { z } from "zod";

export const auth0QuerySchema = z.object({
  page: z
    .string()
    .min(0)
    .optional()
    .default("0")
    .transform((p) => parseInt(p, 10))
    .openapi({
      description: "The page number where 0 is the first page",
    }),
  per_page: z
    .string()
    .min(1)
    .optional()
    .default("10")
    .transform((p) => parseInt(p, 10))
    .openapi({
      description: "The number of items per page",
    }),
  include_totals: z
    .string()
    .optional()
    .default("false")
    .transform((it) => it === "true")
    .openapi({
      description:
        "If the total number of items should be included in the response",
    }),
  sort: z
    .string()
    .regex(/^.+:(-1|1)$/)
    .optional()
    .openapi({
      description:
        "A property that should have the format 'string:-1' or 'string:1'",
    }),
  q: z.string().optional().openapi({
    description: "A lucene query string used to filter the results",
  }),
});
