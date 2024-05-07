const tailwindRowsColumns = require("@ape-egg/tailwind-rows-columns");

module.exports = {
  plugins: [tailwindRowsColumns],
  darkMode: "class",
  content: ["./src/utils/components/*.tsx"],
  theme: {
    extend: {
      screens: {
        short: {
          raw: "(max-height: 900px) and (min-width: 640px)", // 640px = sm. Prevent this from ever triggering on phones
        },
      },
      colors: {
        primary: "var(--primary-color)",
        primaryHover: "var(--primary-hover)",
        textOnPrimary: "var(--text-on-primary)",
      },
    },
  },
  presets: [require("./tailwind.shared.config.js")],
};
