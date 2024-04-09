import { z } from "zod";

export const baseEntitySchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
