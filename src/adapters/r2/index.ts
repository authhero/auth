import { Env } from "../../types";
import { DataAdapters } from "../interfaces";
import { createTemplatesAdapter } from "./templates";

export default function createR2Adapter(env: Env): Partial<DataAdapters> {
  return {
    templates: createTemplatesAdapter(env),
  };
}
