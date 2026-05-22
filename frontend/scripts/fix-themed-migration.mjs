import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, "../src/mobile");
const hookBlock = "  const styles = useThemedStyles(createStyles);\r\n  const { colors } = useAppTheme();\r\n";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

function themeImportDepth(filePath) {
  const rel = path.relative(mobileRoot, filePath);
  return "../".repeat(rel.split(path.sep).length - 1) + "theme";
}

function ensureImports(src, themeBase) {
  if (!src.includes("useThemedStyles")) return src;

  if (src.includes("useAppTheme") && !src.includes(`from "${themeBase}"`)) {
    if (src.includes(`import { theme } from "${themeBase}"`)) {
      src = src.replace(
        new RegExp(`import \\{ theme \\} from ["']${themeBase.replace(/\//g, "\\/")}["'];`),
        `import { theme, useAppTheme } from "${themeBase}";`,
      );
    } else if (!src.includes(`import { useAppTheme }`)) {
      src = src.replace(
        /import \{ useThemedStyles, type ThemedStyleContext \} from ["'][^"']+["'];/,
        `import { useThemedStyles, type ThemedStyleContext } from "${themeBase}/useThemedStyles";\r\nimport { useAppTheme } from "${themeBase}";`,
      );
    }
  }
  return src;
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (!src.includes("function createStyles")) return false;

  const themeBase = themeImportDepth(filePath);
  let changed = false;
  const normalized = src.replace(/\r\n/g, "\n");

  if (!normalized.includes("useThemedStyles(createStyles)")) {
    let updated = normalized;
    if (normalized.includes("forwardRef")) {
      updated = normalized.replace(/(\)\s*\{\n)(\s*return\s*\()/, `$1${hookBlock.replace(/\r\n/g, "\n")}$2`);
    } else {
      updated = normalized.replace(/(export function \w+\([\s\S]*?\)\s*\{\n)/, `$1${hookBlock.replace(/\r\n/g, "\n")}`);
    }
    if (updated !== normalized) {
      src = updated.replace(/\n/g, "\r\n");
      changed = true;
    }
  } else if (/\bcolors\./.test(normalized) && !normalized.includes("useAppTheme()")) {
    src = normalized.replace(
      /const styles = useThemedStyles\(createStyles\);\n/,
      hookBlock.replace(/\r\n/g, "\n"),
    ).replace(/\n/g, "\r\n");
    changed = true;
  }

  const before = src;
  src = ensureImports(src, themeBase);
  if (src !== before) changed = true;

  if (changed) {
    fs.writeFileSync(filePath, src);
    return true;
  }
  return false;
}

const files = walk(path.join(mobileRoot, "components"))
  .concat(walk(path.join(mobileRoot, "screens")))
  .concat([path.join(mobileRoot, "navigation/CustomTabBar.tsx")]);

let count = 0;
for (const file of files) {
  if (fixFile(file)) {
    count++;
    console.log("fixed", path.relative(mobileRoot, file));
  }
}
console.log("done", count);
