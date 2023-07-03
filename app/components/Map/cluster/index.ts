import type { Device } from "@prisma/client";
import type { GeoJsonProperties } from "geojson";

// colors to use for the categories
const colors = ["#4EAF47", "#666", "#666"];

export type ClusterPropertiesType = GeoJsonProperties &
  Device & {
    active: number;
    inactive: number;
    old: number;
    cluster: boolean;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: number | string;
  };

// code for creating an SVG donut chart from feature properties
const createDonutChart = (props: any) => {
  const offsets = [];
  const counts = [props.active, props.inactive, props.old];
  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }
  const fontSize =
    total >= 1000 ? 14 : total >= 100 ? 10 : total >= 10 ? 5 : 14;
  const r = total >= 1000 ? 36 : total >= 100 ? 20 : total >= 10 ? 10 : 18;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
<svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block; font-weight: bold;">`;

  for (let i = 0; i < counts.length; i++) {
    html += donutSegment(
      offsets[i] / total,
      (offsets[i] + counts[i]) / total,
      r,
      r0,
      colors[i]
    );
  }
  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="transparent" />
<text dominant-baseline="central" transform="translate(${r}, ${r})">
${total.toLocaleString()}
</text>
</svg>
</div>`;

  const el = document.createElement("div");
  el.innerHTML = html;

  return el.firstChild;
};

function donutSegment(
  start: number,
  end: number,
  r: number,
  r0: number,
  color: string
) {
  if (end - start === 1) end -= 0.00001;
  const a0 = 2 * Math.PI * (start - 0.25);
  const a1 = 2 * Math.PI * (end - 0.25);
  const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  const largeArc = end - start > 0.5 ? 1 : 0;

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
    r + r * y0
  } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
    r + r0 * y1
  } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
    r + r0 * y0
  }" fill="${color}" fill-opacity="0.5" />`;
}

export default createDonutChart;
