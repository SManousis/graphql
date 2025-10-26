import React, { useMemo, useState } from "react";
import type { Tx } from "../hooks/useGraph";
import { scaleTime, scaleLinear, linePath, fmtDate } from "../lib/svg";

type Props = { txs: Tx[]; width?: number; height?: number };

// SvgXpOverTime plots cumulative XP so learners can reason about velocity and plateaus visually.
// Interactivity stays lightweight (manual hover) to keep bundle size under control.
export default function SvgXpOverTime({ txs, width = 760, height = 320 }: Props) {
  const pad = { t: 20, r: 20, b: 40, l: 48 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const points = useMemo(() => {
    const sorted = [...txs].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    let sum = 0;
    return sorted.map((t) => {
      sum += t.amount;
      return { date: new Date(t.createdAt), cum: sum }; // store running total for cumulative line
    });
  }, [txs]);

  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null); // memoizes tooltip anchor so DOM stays minimal

  if (points.length === 0) return <svg width={width} height={height}><text x={16} y={24}>No XP yet</text></svg>;

  const x = scaleTime([points[0].date, points[points.length - 1].date], [0, innerW]);
  const y = scaleLinear([0, Math.max(...points.map((p) => p.cum))], [innerH, 0]);
  const path = linePath(points.map((p) => ({ x: pad.l + x(p.date), y: pad.t + y(p.cum) }))); // convert data into SVG path string

  // axis ticks (simple)
  const xticks = 6;
  const dates = Array.from({ length: xticks }, (_, i) =>
    new Date(points[0].date.getTime() + (i / (xticks - 1)) * (points[points.length - 1].date.getTime() - points[0].date.getTime()))
  ); // simple evenly-spaced tick generator without external date libs

  const yticks = 5;
  const ymax = Math.max(...points.map((p) => p.cum));
  const yvals = Array.from({ length: yticks }, (_, i) => Math.round((i / (yticks - 1)) * ymax));

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* axes */}
      <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="currentColor" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="currentColor" />

      {dates.map((d, i) => {
        const xx = pad.l + x(d);
        return (
          <g key={i} transform={`translate(${xx},0)`}>
            <line y1={pad.t + innerH} y2={pad.t + innerH + 6} stroke="currentColor" />
            <text y={pad.t + innerH + 20} textAnchor="middle" fontSize="10">{fmtDate(d)}</text>
          </g>
        );
      })}
      {yvals.map((v, i) => {
        const yy = pad.t + y(v);
        return (
          <g key={i} transform={`translate(0,${yy})`}>
            <line x1={pad.l - 6} x2={pad.l} stroke="currentColor" />
            <text x={pad.l - 10} y={3} textAnchor="end" fontSize="10">{v}</text>
            <line x1={pad.l} x2={pad.l + innerW} y1={0} y2={0} strokeOpacity={0.1} />
          </g>
        );
      })}

      {/* path */}
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />

      {/* hover */}
      <rect
        x={pad.l} y={pad.t} width={innerW} height={innerH}
        fill="transparent"
        onMouseMove={(e) => {
          const box = (e.target as SVGRectElement).getBoundingClientRect();
          const px = e.clientX - box.left - pad.l;
          // nearest point
          let idx = 0, best = Number.POSITIVE_INFINITY;
          points.forEach((p, i) => {
            const dx = Math.abs(x(p.date) - px);
            if (dx < best) { best = dx; idx = i; }
          });
          const p = points[idx];
          setHover({ x: pad.l + x(p.date), y: pad.t + y(p.cum), label: `${fmtDate(p.date)} • ${p.cum} XP` });
        }}
        onMouseLeave={() => setHover(null)}
      />
      {hover && (
        <>
          <line x1={hover.x} x2={hover.x} y1={pad.t} y2={pad.t + innerH} stroke="currentColor" strokeDasharray="3,3" />
          <circle cx={hover.x} cy={hover.y} r={4} />
          <rect x={hover.x + 8} y={hover.y - 18} rx={4} ry={4} width={140} height={22} fill="white" stroke="currentColor" />
          <text x={hover.x + 12} y={hover.y - 3} fontSize="12">{hover.label}</text>
        </>
      )}
    </svg>
  );
}

