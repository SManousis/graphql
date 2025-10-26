import React from "react";

type Props = {
  pass: number;
  fail: number;
  width?: number;
  height?: number;
};

// SvgPassFailDonut renders a static arc visualization so product metrics can be embedded without
// external charting dependencies. The donut is drawn manually to retain full control over colors.
export default function SvgPassFailDonut({ pass, fail, width = 280, height = 220 }: Props) {
  const total = pass + fail;
  const rate = total ? pass / total : 0;       // guard against division by zero when no data exists

  // Donut geometry
  const size = Math.min(width, height);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;             // radius
  const stroke = Math.max(10, size * 0.12);
  const C = 2 * Math.PI * r;         // circumference

  const passLen = C * rate;
  const failLen = C - passLen;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <g transform={`translate(${(width - size) / 2}, ${(height - size) / 2}) rotate(-90 ${cx} ${cy})`}>
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* fail segment */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="#ef4444" strokeWidth={stroke} strokeLinecap="butt"
          strokeDasharray={`${failLen} ${C - failLen}`}
          transform={`rotate(${(passLen / C) * 360} ${cx} ${cy})`} // offset so fail always trails pass
        />
        {/* pass segment */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="#10b981" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${passLen} ${C - passLen}`}
        />
      </g>

      {/* labels (upright) */}
      <g transform={`translate(${(width - size) / 2}, ${(height - size) / 2})`}>
        {/* Central annotation doubles as both percentage and empty state */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight={600}>
          {total ? Math.round(rate * 100) : 0}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12">Pass rate</text>

        {/* Legend positions anchor to donut to remain aligned regardless of custom width/height */}
        <g transform={`translate(${cx - 60}, ${size - 12})`}>
          <rect width="10" height="10" rx="2" fill="#10b981" />
          <text x={16} y={10} fontSize="12">Pass: {pass}</text>
        </g>
        <g transform={`translate(${cx + 30}, ${size - 12})`}>
          <rect width="10" height="10" rx="2" fill="#ef4444" />
          <text x={16} y={10} fontSize="12">Fail: {fail}</text>
        </g>
      </g>
    </svg>
  );
}
