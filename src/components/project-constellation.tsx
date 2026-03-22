import { Fragment, h } from "../jsx-factory.js";
import { escapeXml, truncate } from "../svg-utils.js";
import { LAYOUT, THEME } from "../theme.js";
import type { ConstellationNode, RenderResult } from "../types.js";

export function renderProjectConstellation(
  nodes: ConstellationNode[],
  y: number,
): RenderResult {
  if (nodes.length === 0) return { svg: "", height: 0 };

  const { padX } = LAYOUT;
  const height = 380;

  // Draw connection lines first (behind nodes)
  const drawnConnections = new Set<string>();
  const connectionsSvg = nodes.flatMap((node, i) =>
    node.connections
      .filter((j) => {
        const key = [Math.min(i, j), Math.max(i, j)].join("-");
        if (drawnConnections.has(key)) return false;
        drawnConnections.add(key);
        return true;
      })
      .map((j) => {
        const other = nodes[j];
        return (
          <line
            x1={padX + node.x}
            y1={y + node.y}
            x2={padX + other.x}
            y2={y + other.y}
            stroke={THEME.border}
            stroke-width="1"
            stroke-opacity="0.15"
            stroke-dasharray="4 4"
          />
        );
      }),
  );

  // Draw nodes
  const nodesSvg = nodes.map((node, i) => {
    const cx = padX + node.x;
    const cy = y + node.y;
    const delay = Math.min(i + 1, 6);

    return (
      <>
        {/* Glow effect */}
        <circle
          cx={cx}
          cy={cy}
          r={node.radius + 4}
          fill={node.color}
          fill-opacity="0.08"
          className={`fade-${delay}`}
        />
        {/* Main circle */}
        <circle
          cx={cx}
          cy={cy}
          r={node.radius}
          fill={node.color}
          fill-opacity="0.7"
          stroke={node.color}
          stroke-width="1.5"
          stroke-opacity="0.9"
          className={`fade-${delay}`}
        />
        {/* Label */}
        <text
          x={cx}
          y={cy + node.radius + 14}
          className={`t t-value fade-${delay}`}
          text-anchor="middle"
        >
          {escapeXml(truncate(node.name, 18))}
        </text>
      </>
    );
  });

  // Group labels at the bottom showing language ecosystem clusters
  const langGroups = new Map<
    string,
    { color: string; minX: number; maxX: number }
  >();
  for (const node of nodes) {
    const lang = node.color; // Use color as key since we don't have lang name in ConstellationNode
    if (!langGroups.has(lang)) {
      langGroups.set(lang, { color: lang, minX: node.x, maxX: node.x });
    } else {
      const group = langGroups.get(lang)!;
      group.minX = Math.min(group.minX, node.x);
      group.maxX = Math.max(group.maxX, node.x);
    }
  }

  const svg = (
    <>
      {/* Connection lines */}
      {connectionsSvg.join("")}

      {/* Nodes */}
      {nodesSvg.join("")}
    </>
  );

  return { svg, height };
}

void Fragment;
