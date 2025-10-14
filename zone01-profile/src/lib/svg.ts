export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0 || 1);
  return (x: number) => r0 + (x - d0) * m;
}
export function scaleTime(domain: [Date, Date], range: [number, number]) {
  const [d0, d1] = domain.map((d) => +d); // convert once
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0 || 1);
  return (x: Date | number) => r0 + ((+x) - d0) * m;
}

export function linePath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return "M " + points.map((p) => `${p.x} ${p.y}`).join(" L ");
}
export function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
