import React, { useMemo } from "react";
import type { Tx, Obj } from "../hooks/useGraph";
import { scaleLinear } from "../lib/svg";

type Props = { txs: Tx[]; objects: Map<number, Obj>; width?: number; height?: number; topN?: number };

// SvgXpByProject visualizes the highest-yield projects as a horizontal bar chart so large XP totals
// can be compared at a glance. Aggregation happens locally to avoid extra GraphQL round trips.
export default function SvgXpByProject({ txs, objects, width = 760, height = 360, topN = 10 }: Props) {
  const pad = { t: 20, r: 20, b: 40, l: 160 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const rows = useMemo(() => {
    const map = new Map<number, number>();
    txs.forEach((t) => map.set(t.objectId, (map.get(t.objectId) ?? 0) + t.amount)); // combine multiple submissions per project
    const arr = Array.from(map.entries()).map(([id, xp]) => ({
      id, xp, name: objects.get(id)?.name ?? `#${id}`,
    }));
    arr.sort((a, b) => b.xp - a.xp); // sort descending so topN picks the most impactful work
    const top = arr.slice(0, topN);
    if (arr.length > topN) {
      const rest = arr.slice(topN).reduce((s, a) => s + a.xp, 0);
      top.push({ id: -1, xp: rest, name: "Others" }); // lump long tail to keep chart compact
    }
    return top;
  }, [txs, objects, topN]);

  if (!rows.length) return <svg width={width} height={height}><text x={16} y={24}>No project XP yet</text></svg>;

  const x = scaleLinear([0, Math.max(...rows.map(r => r.xp))], [0, innerW]);
  const barH = innerH / rows.length * 0.7;
  const gap = (innerH - barH * rows.length) / Math.max(rows.length - 1, 1); // distributes leftover space evenly

  return (
    <svg width={width} height={height} style={{ color: "var(--text)" }}>
      {/* axes */}
      <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="currentColor" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="currentColor" />

      {rows.map((r, i) => {
        const y = pad.t + i * (barH + gap);
        return (
          <g key={i} transform={`translate(${pad.l},${y})`}>
            <rect width={x(r.xp)} height={barH} fill="var(--text)" />
            {/* Labels hug the bar so long titles remain readable even at small widths */}
            <text x={-10} y={barH / 2 + 4} textAnchor="end" fontSize="12" fill="var(--text)">{r.name}</text>
            <text x={x(r.xp) + 6} y={barH / 2 + 4} fontSize="12" fill="var(--text)">{r.xp}</text>
          </g>
        );
      })}
    </svg>
  );
}
