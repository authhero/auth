import { z } from "zod";

export const LogMessageSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  category: z.string(),
  message: z.string(),
});

export const LogMessageSchemaList = z.array(LogMessageSchema);

export type LogMessage = z.infer<typeof LogMessageSchema>;
