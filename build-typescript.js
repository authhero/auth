const fs = require("fs");

// Read CSS file
const cssContent = fs.readFileSync("src/styles/tailwind.css", "utf8");

const tsContent = `export const tailwindCss = \`${cssContent}\``;

// Write the TypeScript file
fs.writeFileSync("src/styles/tailwind.ts", tsContent);
