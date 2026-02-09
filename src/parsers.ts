export const parsePackageJson = (text: string): string[] => {
  try {
    const pkg = JSON.parse(text);
    return [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
  } catch {
    console.warn("Warning: failed to parse package.json");
    return [];
  }
};

export const parseCargoToml = (text: string): string[] => {
  try {
    const deps: string[] = [];
    let inDeps = false;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (
        trimmed === "[dependencies]" ||
        trimmed === "[dev-dependencies]" ||
        trimmed === "[build-dependencies]"
      ) {
        inDeps = true;
        continue;
      }
      if (trimmed.startsWith("[")) {
        inDeps = false;
        continue;
      }
      if (inDeps && trimmed.includes("=")) {
        const name = trimmed.split("=")[0].trim();
        if (name && !name.startsWith("#")) deps.push(name);
      }
    }
    return deps;
  } catch {
    console.warn("Warning: failed to parse Cargo.toml");
    return [];
  }
};

export const parseGoMod = (text: string): string[] => {
  try {
    const deps: string[] = [];
    let inRequire = false;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("require (")) {
        inRequire = true;
        continue;
      }
      if (trimmed === ")") {
        inRequire = false;
        continue;
      }
      if (inRequire && trimmed && !trimmed.startsWith("//")) {
        const modulePath = trimmed.split(/\s/)[0];
        const segments = modulePath.split("/");
        deps.push(segments[segments.length - 1]);
      }
    }
    return deps;
  } catch {
    console.warn("Warning: failed to parse go.mod");
    return [];
  }
};

export const parsePyprojectToml = (text: string): string[] => {
  try {
    const deps: string[] = [];
    const depArrayMatch = text.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depArrayMatch) {
      const items = depArrayMatch[1].matchAll(/"([^"]+)"|'([^']+)'/g);
      for (const m of items) {
        const raw = m[1] || m[2];
        const name = raw.split(/[>=<!~;\s[]/)[0].trim();
        if (name) deps.push(name);
      }
    }
    const poetryMatch = text.match(
      /\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\n\[|$)/,
    );
    if (poetryMatch) {
      for (const line of poetryMatch[1].split("\n")) {
        const trimmed = line.trim();
        if (
          trimmed.includes("=") &&
          !trimmed.startsWith("#") &&
          !trimmed.startsWith("[")
        ) {
          const name = trimmed.split("=")[0].trim();
          if (name && name !== "python") deps.push(name);
        }
      }
    }
    return deps;
  } catch {
    console.warn("Warning: failed to parse pyproject.toml");
    return [];
  }
};

export const parseRequirementsTxt = (text: string): string[] => {
  try {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
      .map((line) => line.split(/[>=<!~;\s[]/)[0].trim())
      .filter(Boolean);
  } catch {
    console.warn("Warning: failed to parse requirements.txt");
    return [];
  }
};

const PARSER_MAP: Record<string, (text: string) => string[]> = {
  "package.json": parsePackageJson,
  "Cargo.toml": parseCargoToml,
  "go.mod": parseGoMod,
  "pyproject.toml": parsePyprojectToml,
  "requirements.txt": parseRequirementsTxt,
};

export const parseManifest = (filename: string, text: string): string[] =>
  (PARSER_MAP[filename] || (() => []))(text);
