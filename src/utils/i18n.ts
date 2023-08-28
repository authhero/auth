import { en, sv } from "../locales";

type Labels = { [lang: string]: { [key: string]: string } };

export const labels: Labels = {
  en,
  sv,
};

// This type is used for type checking and IDE auto-completion
export type LabelIds = keyof typeof en | keyof typeof sv;

export function translate(language: string, label: LabelIds): string {
  return labels[language]?.[label] ?? "missing label";
}
