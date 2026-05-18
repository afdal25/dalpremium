const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString()}`;

export default function DashboardChart({ data = [] }) {
  const rows = data.length
    ? data
    : [{ date: "-", income: 0, expense: 0, profit: 0 }];

  const width = 900;
  const height = 320;
  const padding = {
    top: 28,
    right: 28,
    bottom: 42,
    left: 64,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [
      Number(row.income || 0),
      Number(row.expense || 0),
      Math.abs(Number(row.profit || 0)),
    ])
  );

  const y = (value) =>
    padding.top +
    plotHeight -
    (Number(value || 0) / maxValue) * plotHeight;
  const groupWidth = plotWidth / rows.length;
  const barWidth = Math.max(
    7,
    Math.min(24, groupWidth * 0.22)
  );
  const linePoints = rows
    .map((row, index) => {
      const x = padding.left + groupWidth * index + groupWidth / 2;
      return `${x},${y(Math.max(Number(row.profit || 0), 0))}`;
    })
    .join(" ");
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="h-full min-w-0 rounded-2xl bg-black/20 p-3">
      <svg
        role="img"
        aria-label="Grafik statistik keuangan"
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => {
          const yPosition = padding.top + plotHeight * line;
          const value = maxValue * (1 - line);

          return (
            <g key={line}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yPosition}
                y2={yPosition}
                stroke="#27272a"
                strokeDasharray="6 6"
              />
              <text
                x={padding.left - 12}
                y={yPosition + 4}
                textAnchor="end"
                className="fill-zinc-400 text-[11px]"
              >
                {Math.round(value / 1000)}k
              </text>
            </g>
          );
        })}

        {rows.map((row, index) => {
          const centerX =
            padding.left + groupWidth * index + groupWidth / 2;
          const income = Number(row.income || 0);
          const expense = Number(row.expense || 0);
          const incomeY = y(income);
          const expenseY = y(expense);

          return (
            <g key={`${row.date}-${index}`}>
              <title>
                {`Tanggal ${row.date}: Pendapatan ${formatCurrency(
                  income
                )}, Pengeluaran ${formatCurrency(
                  expense
                )}, Profit ${formatCurrency(row.profit)}`}
              </title>
              <rect
                x={centerX - barWidth - 2}
                y={incomeY}
                width={barWidth}
                height={padding.top + plotHeight - incomeY}
                rx="6"
                fill="url(#incomeGradient)"
              />
              <rect
                x={centerX + 2}
                y={expenseY}
                width={barWidth}
                height={padding.top + plotHeight - expenseY}
                rx="6"
                fill="url(#expenseGradient)"
              />
              <text
                x={centerX}
                y={height - 14}
                textAnchor="middle"
                className="fill-zinc-400 text-[11px]"
              >
                {row.date}
              </text>
            </g>
          );
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="#eab308"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform={`translate(${padding.left}, 8)`}>
          <circle r="5" fill="#22c55e" />
          <text x="12" y="4" className="fill-zinc-300 text-[12px]">
            Pendapatan
          </text>
          <circle cx="112" r="5" fill="#ef4444" />
          <text x="124" y="4" className="fill-zinc-300 text-[12px]">
            Pengeluaran
          </text>
          <circle cx="234" r="5" fill="#eab308" />
          <text x="246" y="4" className="fill-zinc-300 text-[12px]">
            Profit
          </text>
        </g>
      </svg>
    </div>
  );
}
