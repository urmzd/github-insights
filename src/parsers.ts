import * as toml from "smol-toml";
import type { PackageParser } from "./types.js";

export const NodePackageParser: PackageParser = {
  filenames: ["package.json"],
  parseDependencies(text) {
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
  },
};

export const CargoParser: PackageParser = {
  filenames: ["Cargo.toml"],
  parseDependencies(text) {
    try {
      const parsed = toml.parse(text);
      const tables: string[] = [
        "dependencies",
        "dev-dependencies",
        "build-dependencies",
      ];
      const deps: string[] = [];
      for (const table of tables) {
        const section = parsed[table];
        if (section && typeof section === "object") {
          deps.push(...Object.keys(section as Record<string, unknown>));
        }
      }
      return deps;
    } catch {
      console.warn("Warning: failed to parse Cargo.toml");
      return [];
    }
  },
};

export const GoModParser: PackageParser = {
  filenames: ["go.mod"],
  parseDependencies(text) {
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
  },
};

export const PyprojectParser: PackageParser = {
  filenames: ["pyproject.toml"],
  parseDependencies(text) {
    try {
      const parsed = toml.parse(text);
      const deps: string[] = [];

      // PEP 621: project.dependencies array
      const project = parsed.project as
        | { dependencies?: string[] }
        | undefined;
      if (project?.dependencies) {
        for (const raw of project.dependencies) {
          const name = raw.split(/[>=<!~;\s[]/)[0].trim();
          if (name) deps.push(name);
        }
      }

      // Poetry: tool.poetry.dependencies table
      const tool = parsed.tool as
        | { poetry?: { dependencies?: Record<string, unknown> } }
        | undefined;
      const poetryDeps = tool?.poetry?.dependencies;
      if (poetryDeps) {
        for (const name of Object.keys(poetryDeps)) {
          if (name !== "python") deps.push(name);
        }
      }

      return deps;
    } catch {
      console.warn("Warning: failed to parse pyproject.toml");
      return [];
    }
  },
};

export const RequirementsTxtParser: PackageParser = {
  filenames: ["requirements.txt"],
  parseDependencies(text) {
    try {
      return text
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) => line && !line.startsWith("#") && !line.startsWith("-"),
        )
        .map((line) => line.split(/[>=<!~;\s[]/)[0].trim())
        .filter(Boolean);
    } catch {
      console.warn("Warning: failed to parse requirements.txt");
      return [];
    }
  },
};

export const PARSERS: PackageParser[] = [
  NodePackageParser,
  CargoParser,
  GoModParser,
  PyprojectParser,
  RequirementsTxtParser,
];

// Build lookup from filenames → parser (derived from PARSERS, not manually maintained)
const PARSER_MAP = new Map<string, PackageParser>();
for (const parser of PARSERS) {
  for (const filename of parser.filenames) {
    PARSER_MAP.set(filename, parser);
  }
}

export const parseManifest = (filename: string, text: string): string[] =>
  PARSER_MAP.get(filename)?.parseDependencies(text) ?? [];
