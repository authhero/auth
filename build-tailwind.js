const fs = require("fs");

// Read CSS file
const cssContent = fs.readFileSync("src/styles/tailwind.css", "utf8");

const cssContentCleaned = cssContent.replaceAll("`", "'");

const doubleEscaped = cssContentCleaned.replaceAll("\\", "\\\\");

const tsContent = `export const tailwindCss = \`
    ${doubleEscaped}\`
`;

// Write the TypeScript file
fs.writeFileSync("src/styles/tailwind.ts", tsContent);
