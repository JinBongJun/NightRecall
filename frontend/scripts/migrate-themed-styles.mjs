import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, "../src/mobile");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

function themeImportDepth(filePath) {
  const rel = path.relative(mobileRoot, filePath);
  const depth = rel.split(path.sep).length - 1;
  return "../".repeat(depth) + "theme";
}

function closeStyleSheetFactory(src) {
  const fnIdx = src.indexOf("function createStyles");
  if (fnIdx === -1) {
    return src;
  }
  const retIdx = src.indexOf("return StyleSheet.create({", fnIdx);
  if (retIdx === -1) {
    return src;
  }

  let depth = 0;
  let pos = retIdx + "return StyleSheet.create(".length;
  for (; pos < src.length; pos++) {
    const ch = src[pos];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && src.slice(pos, pos + 3) === "});") {
        pos += 3;
        return `${src.slice(0, pos)}\n}${src.slice(pos)}`;
      }
    }
  }
  return src;
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (!src.includes("theme/colors") || src.includes("useThemedStyles")) {
    return false;
  }

  const colorsImport = src.match(/import \{ colors \} from (["'][^"']+["']);/);
  if (!colorsImport) {
    return false;
  }

  if (!src.includes("const styles = StyleSheet.create")) {
    return false;
  }

  const themeBase = themeImportDepth(filePath);
  src = src.replace(
    colorsImport[0],
    `import { useThemedStyles, type ThemedStyleContext } from "${themeBase}/useThemedStyles";`,
  );

  src = src.replace(
    /const styles = StyleSheet\.create\(\{/,
    "function createStyles({ colors, typography }: ThemedStyleContext) {\n  return StyleSheet.create({",
  );

  src = closeStyleSheetFactory(src);

  src = src.replace(/theme\.typography\.(\w+)\.fontSize/g, "typography.$1.fontSize");
  src = src.replace(/theme\.typography\.(\w+)\.lineHeight/g, "typography.$1.lineHeight");
  src = src.replace(/theme\.typography\.(\w+)\.fontWeight/g, "typography.$1.fontWeight");

  const hookLine = "  const styles = useThemedStyles(createStyles);\n";
  if (src.includes("export function ")) {
    if (!src.includes(hookLine.trim())) {
      src = src.replace(/export function (\w+)\([^)]*\) \{\n/, (m) => `${m}${hookLine}`);
    }
  } else if (src.includes("forwardRef")) {
    if (!src.includes(hookLine.trim())) {
      src = src.replace(/(forwardRef<[^>]+>\(function \w+\([^)]*\) \{)\n/, `$1\n${hookLine}`);
    }
  } else {
    return false;
  }

  fs.writeFileSync(filePath, src);
  return true;
}

const files = walk(path.join(mobileRoot, "components"))
  .concat(walk(path.join(mobileRoot, "screens")))
  .concat([path.join(mobileRoot, "navigation/CustomTabBar.tsx")]);

let count = 0;
for (const file of files) {
  if (migrateFile(file)) {
    count++;
    console.log("migrated", path.relative(mobileRoot, file));
  }
}
console.log("done", count);
