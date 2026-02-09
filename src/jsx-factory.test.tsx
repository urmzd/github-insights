import { describe, it, expect } from "vitest";
import { h, Fragment } from "./jsx-factory.js";

describe("h – HTML tags", () => {
  it("renders self-closing tag (rect)", () => {
    const result = <rect x="0" y="0" width="100" height="50" />;
    expect(result).toBe('<rect x="0" y="0" width="100" height="50"/>');
  });

  it("renders self-closing tag (circle)", () => {
    const result = <circle cx="50" cy="50" r="25" />;
    expect(result).toBe('<circle cx="50" cy="50" r="25"/>');
  });

  it("renders non-self-closing tag with children", () => {
    const result = (
      <text x="10" y="20">
        hello
      </text>
    );
    expect(result).toBe('<text x="10" y="20">hello</text>');
  });

  it("maps className to class", () => {
    const result = <text className="t t-label">test</text>;
    expect(result).toContain('class="t t-label"');
    expect(result).not.toContain("className");
  });

  it("filters null and false props", () => {
    const result = (
      <text x="10" y={null} data-hidden={false}>
        ok
      </text>
    );
    expect(result).toContain('x="10"');
    expect(result).not.toContain("y=");
    expect(result).not.toContain("data-hidden");
  });

  it("escapes attribute values", () => {
    const result = <text title={'he said "hi" & <bye>'}>ok</text>;
    expect(result).toContain("&amp;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("renders self-closing tag with content as non-self-closing", () => {
    const result = h("rect", null, "inner");
    expect(result).toBe("<rect>inner</rect>");
  });
});

describe("h – function tags", () => {
  it("calls component function with props and children", () => {
    function MyComponent(props: { color: string; children?: unknown[] }) {
      return `<g fill="${props.color}">${(props.children || []).join("")}</g>`;
    }
    const result = <MyComponent color="red">child</MyComponent>;
    expect(result).toBe('<g fill="red">child</g>');
  });
});

describe("Fragment", () => {
  it("joins children", () => {
    const result = (
      <>
        <rect x="0" y="0" width="10" height="10" />
        <circle cx="5" cy="5" r="5" />
      </>
    );
    expect(result).toContain("<rect");
    expect(result).toContain("<circle");
  });

  it("filters falsy children", () => {
    const result = Fragment({ children: ["hello", null, false, "world"] });
    expect(result).toBe("helloworld");
  });

  it("returns empty string for no children", () => {
    const result = Fragment({});
    expect(result).toBe("");
  });
});
