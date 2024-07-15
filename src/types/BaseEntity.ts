import { z } from "zod";

export const baseEntitySchema = z.object({
  created_at: z.string(),
  updated_at: z.string(),
});
