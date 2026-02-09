import { describe, it, expect } from "vitest";
import {
  NodePackageParser,
  CargoParser,
  GoModParser,
  PyprojectParser,
  RequirementsTxtParser,
  PARSERS,
  parseManifest,
} from "./parsers.js";

describe("NodePackageParser", () => {
  it("returns both deps and devDeps", () => {
    const json = JSON.stringify({
      dependencies: { react: "^18.0.0", next: "^14.0.0" },
      devDependencies: { vitest: "^2.0.0" },
    });
    expect(NodePackageParser.parseDependencies(json)).toEqual([
      "react",
      "next",
      "vitest",
    ]);
  });

  it("returns only dependencies when devDependencies is missing", () => {
    const json = JSON.stringify({ dependencies: { express: "^4.0.0" } });
    expect(NodePackageParser.parseDependencies(json)).toEqual(["express"]);
  });

  it("returns only devDependencies when dependencies is missing", () => {
    const json = JSON.stringify({ devDependencies: { jest: "^29.0.0" } });
    expect(NodePackageParser.parseDependencies(json)).toEqual(["jest"]);
  });

  it("returns [] for invalid JSON", () => {
    expect(NodePackageParser.parseDependencies("not json")).toEqual([]);
  });

  it("returns [] for empty object", () => {
    expect(NodePackageParser.parseDependencies("{}")).toEqual([]);
  });
});

describe("CargoParser", () => {
  it("parses [dependencies] and [dev-dependencies]", () => {
    const toml = `[dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
criterion = "0.5"
`;
    expect(CargoParser.parseDependencies(toml)).toEqual([
      "serde",
      "tokio",
      "criterion",
    ]);
  });

  it("stops collecting when hitting a non-deps section", () => {
    const toml = `[dependencies]
serde = "1.0"

[package]
name = "myapp"
version = "0.1.0"
`;
    expect(CargoParser.parseDependencies(toml)).toEqual(["serde"]);
  });

  it("ignores comments", () => {
    const toml = `[dependencies]
# this is a comment
serde = "1.0"
`;
    expect(CargoParser.parseDependencies(toml)).toEqual(["serde"]);
  });

  it("handles inline table syntax", () => {
    const toml = `[dependencies]
tokio = { version = "1", features = ["full"] }
`;
    expect(CargoParser.parseDependencies(toml)).toEqual(["tokio"]);
  });
});

describe("GoModParser", () => {
  it("extracts last path segment from require block", () => {
    const gomod = `module example.com/myapp

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/stretchr/testify v1.8.4
)
`;
    expect(GoModParser.parseDependencies(gomod)).toEqual(["gin", "testify"]);
  });

  it("ignores comments in require block", () => {
    const gomod = `module example.com/myapp

require (
	// indirect dependency
	github.com/gin-gonic/gin v1.9.1
)
`;
    expect(GoModParser.parseDependencies(gomod)).toEqual(["gin"]);
  });

  it("returns [] when no require block", () => {
    expect(
      GoModParser.parseDependencies("module example.com/myapp\n\ngo 1.21\n"),
    ).toEqual([]);
  });
});

describe("PyprojectParser", () => {
  it("parses PEP 621 dependencies array", () => {
    const toml = `[project]
name = "myapp"
dependencies = [
  "fastapi>=0.100.0",
  "uvicorn[standard]>=0.23.0",
]
`;
    expect(PyprojectParser.parseDependencies(toml)).toEqual([
      "fastapi",
      "uvicorn",
    ]);
  });

  it("parses Poetry [tool.poetry.dependencies]", () => {
    const toml = `[tool.poetry.dependencies]
python = "^3.11"
django = "^4.2"
celery = "^5.3"
`;
    expect(PyprojectParser.parseDependencies(toml)).toEqual([
      "django",
      "celery",
    ]);
  });

  it("strips version specifiers", () => {
    const toml = `[project]
dependencies = [
  "requests>=2.28,<3",
  "pydantic~=2.0",
]
`;
    const result = PyprojectParser.parseDependencies(toml);
    expect(result).toEqual(["requests", "pydantic"]);
  });

  it("excludes python from Poetry deps", () => {
    const toml = `[tool.poetry.dependencies]
python = "^3.11"
flask = "^2.3"
`;
    expect(PyprojectParser.parseDependencies(toml)).toEqual(["flask"]);
  });
});

describe("RequirementsTxtParser", () => {
  it("strips version specifiers", () => {
    const txt = `requests>=2.28.0
flask==2.3.3
numpy~=1.24
`;
    expect(RequirementsTxtParser.parseDependencies(txt)).toEqual([
      "requests",
      "flask",
      "numpy",
    ]);
  });

  it("ignores comments and blank lines", () => {
    const txt = `# comment
requests

flask
`;
    expect(RequirementsTxtParser.parseDependencies(txt)).toEqual([
      "requests",
      "flask",
    ]);
  });

  it("ignores flags like -r and -e", () => {
    const txt = `-r base.txt
-e git+https://example.com
requests
`;
    expect(RequirementsTxtParser.parseDependencies(txt)).toEqual(["requests"]);
  });

  it("returns [] for empty input", () => {
    expect(RequirementsTxtParser.parseDependencies("")).toEqual([]);
  });
});

describe("PARSERS", () => {
  it("covers all expected filenames", () => {
    const allFilenames = PARSERS.flatMap((p) => p.filenames).sort();
    expect(allFilenames).toEqual([
      "Cargo.toml",
      "go.mod",
      "package.json",
      "pyproject.toml",
      "requirements.txt",
    ]);
  });
});

describe("parseManifest", () => {
  it("dispatches to NodePackageParser for package.json", () => {
    const json = JSON.stringify({ dependencies: { react: "^18" } });
    expect(parseManifest("package.json", json)).toEqual(["react"]);
  });

  it("dispatches to CargoParser for Cargo.toml", () => {
    const toml = "[dependencies]\nserde = \"1.0\"\n";
    expect(parseManifest("Cargo.toml", toml)).toEqual(["serde"]);
  });

  it("dispatches to GoModParser for go.mod", () => {
    const gomod =
      "module x\nrequire (\n\tgithub.com/foo/bar v1.0\n)\n";
    expect(parseManifest("go.mod", gomod)).toEqual(["bar"]);
  });

  it("dispatches to PyprojectParser for pyproject.toml", () => {
    const toml = '[project]\ndependencies = [\n  "flask",\n]\n';
    expect(parseManifest("pyproject.toml", toml)).toEqual(["flask"]);
  });

  it("dispatches to RequirementsTxtParser for requirements.txt", () => {
    expect(parseManifest("requirements.txt", "requests\n")).toEqual([
      "requests",
    ]);
  });

  it("returns [] for unknown filename", () => {
    expect(parseManifest("Makefile", "all: build")).toEqual([]);
  });
});
