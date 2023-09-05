import z from "zod";

export const FilterSchema = z.object({
  q: z.string().optional(),
});

export type filter = z.infer<typeof FilterSchema>;
