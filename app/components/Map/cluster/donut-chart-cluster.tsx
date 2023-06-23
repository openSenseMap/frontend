type DonutChartClusterType = {
  cluster: any;
  clusterOnClick: (cluster: any) => void;
};

// colors to use for the categories
const colors = ["#4EAF47", "#666", "#666"];

export default function DonutChartCluster({
  cluster,
  clusterOnClick,
}: DonutChartClusterType) {
  const { active, inactive, old, point_count: pointCount } = cluster.properties;
  const counts: number[] = [active, inactive, old];
  const offsets: number[] = [];
  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }

  const fontSize =
    pointCount >= 1000
      ? 14
      : pointCount >= 100
      ? 10
      : pointCount >= 10
      ? 5
      : 14;
  const r =
    pointCount >= 1000
      ? 36
      : pointCount >= 100
      ? 20
      : pointCount >= 10
      ? 10
      : 18;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  return (
    <div onClick={() => clusterOnClick(cluster)}>
      <svg
        width={w}
        height={w}
        viewBox={`0 0 ${w} ${w}`}
        textAnchor="middle"
        style={{
          font: `${fontSize}px sans-serif`,
          display: "block",
          fontWeight: "bold",
        }}
      >
        {counts.map((count, i) => {
          const start = offsets[i] / total;
          let end = (offsets[i] + count) / total;

          if (end - start === 1) end -= 0.00001;
          const a0 = 2 * Math.PI * (start - 0.25);
          const a1 = 2 * Math.PI * (end - 0.25);
          const x0 = Math.cos(a0),
            y0 = Math.sin(a0);
          const x1 = Math.cos(a1),
            y1 = Math.sin(a1);
          const largeArc = end - start > 0.5 ? 1 : 0;

          return (
            <path
              key={i}
              d={`M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
                r + +r * y0
              } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${
                r + r0 * x1
              } ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
                r + r0 * y0
              }`}
              fill={colors[i]}
              fillOpacity={0.5}
            />
          );
        })}
        <circle cx={r} cy={r} r={r0} fill="transparent" />
        <text dominantBaseline="central" transform={`translate(${r}, ${r})`}>
          {pointCount}
        </text>
      </svg>
    </div>
  );
}
