import en from "../locales/en/default.json";
import sv from "../locales/sv/default.json";

type Labels = { [lang: string]: { [key: string]: string } };

const labels: Labels = {
  en,
  sv,
};

// This type is used for type checking and IDE auto-completion
type LabelIds = keyof typeof en | keyof typeof sv;

export function translate(language: string, label: LabelIds): string {
  return labels[language]?.[label] ?? "missing label";
}
