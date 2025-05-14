import { type DeviceClusterProperties } from "~/routes/explore";

type DonutChartClusterType = {
  cluster: any;
  isExpanded?: boolean;
  clusterOnClick: (cluster: DeviceClusterProperties) => void;
};

// colors to use for the categories
const colors = [
  { color: "#4EAF47", opacity: 1 },
  { color: "#575757", opacity: 0.65 },
  { color: "#575757", opacity: 0.65 },
  { color: "#38AADD", opacity: 1 },
];

// Expanded cluster highlight color
const EXPANDED_COLOR = "#38AADD";

export default function DonutChartCluster({
  cluster,
  clusterOnClick,
  isExpanded = false,
}: DonutChartClusterType) {
  const [theme] = "light"; //useTheme();
  const { categories, point_count: pointCount } = cluster.properties;
  const { active = 0, inactive = 0, old = 0 } = categories;
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
        ? 12
        : pointCount >= 10
          ? 10
          : 10;
  const r =
    pointCount >= 1000
      ? 36
      : pointCount >= 100
        ? 20
        : pointCount >= 10
          ? 18
          : 18;
  const r0 = Math.round(r * 0.7);
  const w = r * 2;

  return (
    <div onClick={() => clusterOnClick(cluster)}>
      <svg
        width={isExpanded ? w + 6 : w}
        height={isExpanded ? w + 6 : w}
        viewBox={`0 0 ${isExpanded ? w + 6 : w} ${isExpanded ? w + 6 : w}`}
        textAnchor="middle"
        style={{
          font: `${fontSize}px sans-serif`,
          display: "block",
          fontWeight: "bold",
        }}
      >
        {/* Expanded cluster highlight */}
        {isExpanded && (
          <>
            {/* Outer highlight ring */}
            <circle
              cx={w / 2 + 3}
              cy={w / 2 + 3}
              r={r + 3}
              fill="none"
              stroke={EXPANDED_COLOR}
              strokeWidth="2"
              strokeDasharray="3,2"
            />
            
            {/* Pulse animation for expanded state */}
            <circle
              cx={w / 2 + 3}
              cy={w / 2 + 3}
              r={r + 3}
              fill="none"
              stroke={EXPANDED_COLOR}
              strokeWidth="1"
              opacity="0.6"
            >
              <animate
                attributeName="r"
                from={r + 3}
                to={r + 10}
                dur="1.5s"
                begin="0s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.6"
                to="0"
                dur="1.5s"
                begin="0s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Adjusted group to center the original donut */}
            <g transform={`translate(3, 3)`}>
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
                    fill={colors[i].color}
                    fillOpacity={colors[i].opacity}
                  />
                );
              })}
              <circle cx={r} cy={r} r={r0} fill="transparent" />
              <text
                dominantBaseline="central"
                fill={theme === "dark" ? "white" : "black"}
                transform={`translate(${r}, ${r})`}
              >
                {pointCount}
              </text>
            </g>
          </>
        )}
        
        {/* Original donut chart when not expanded */}
        {!isExpanded && (
          <>
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
                  fill={colors[i].color}
                  fillOpacity={colors[i].opacity}
                />
              );
            })}
            <circle cx={r} cy={r} r={r0} fill="transparent" />
            <text
              dominantBaseline="central"
              fill={theme === "dark" ? "white" : "black"}
              transform={`translate(${r}, ${r})`}
            >
              {pointCount}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}