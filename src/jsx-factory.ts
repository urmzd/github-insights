const SELF_CLOSING = new Set([
  "circle",
  "rect",
  "line",
  "path",
  "ellipse",
  "polygon",
  "polyline",
  "use",
]);

const escapeAttr = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function h(
  tag: string | ((props: Record<string, unknown>) => string),
  props: Record<string, unknown> | null,
  ...children: unknown[]
): string {
  if (typeof tag === "function")
    return tag({ ...props, children: children.flat() });

  const attrs = Object.entries(props || {})
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => {
      const name = k === "className" ? "class" : k;
      return ` ${name}="${escapeAttr(String(v))}"`;
    })
    .join("");

  const content = children
    .flat()
    .filter((c) => c != null && c !== false)
    .join("");

  if (SELF_CLOSING.has(tag) && !content) return `<${tag}${attrs}/>`;
  return `<${tag}${attrs}>${content}</${tag}>`;
}

export function Fragment({ children }: { children?: unknown[] }): string {
  return (children || []).flat().filter(Boolean).join("");
}
