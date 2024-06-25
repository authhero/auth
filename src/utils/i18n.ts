import en from "../locales/en/default.json";
import sv from "../locales/sv/default.json";
import nb from "../locales/nb/default.json";
import it from "../locales/it/default.json";
import pl from "../locales/it/default.json";

type Labels = { [lang: string]: { [key: string]: string } };

const labels: Labels = {
  en,
  sv,
  nb,
  it,
  pl,
};

// This type is used for type checking and IDE auto-completion
type LabelIds = keyof typeof en | keyof typeof sv;

export function translate(language: string, label: LabelIds): string {
  // or we could fallback to en
  if (!labels[language]) {
    throw new Error(`Language ${language} is not supported`);
  }

  return labels[language]?.[label] ?? "missing label";
}
