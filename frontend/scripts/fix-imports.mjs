import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../src/mobile");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

let count = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("useAppTheme()")) continue;
  if (/import\s*\{[^}]*useAppTheme/.test(src)) continue;

  const rel = path.relative(root, file);
  const depth = rel.split(path.sep).length - 1;
  const themeBase = "../".repeat(depth) + "theme";

  if (src.includes("import { theme }")) {
    src = src.replace(/import \{ theme \} from ["'][^"']+["'];/, `import { theme, useAppTheme } from "${themeBase}";`);
  } else if (src.includes("useThemedStyles")) {
    src = src.replace(
      /import \{ useThemedStyles, type ThemedStyleContext \} from ["'][^"']+["'];/,
      (line) => `${line}\nimport { useAppTheme } from "${themeBase}";`,
    );
  } else {
    continue;
  }

  fs.writeFileSync(file, src);
  count++;
  console.log(path.relative(root, file));
}
console.log("imports fixed", count);
