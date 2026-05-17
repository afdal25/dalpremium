import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#27272a"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: "#a1a1aa" }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={{ stroke: "#3f3f46" }}
        />

        <YAxis
          tick={{ fill: "#a1a1aa" }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={{ stroke: "#3f3f46" }}
          tickFormatter={(value) => `${value / 1000}k`}
        />

        <Tooltip
          cursor={{
            fill: "rgba(255,255,255,0.03)",
          }}
          contentStyle={{
            background: "rgba(24,24,27,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            color: "#fff",
            backdropFilter: "blur(10px)",
          }}
          labelStyle={{
            color: "#fff",
            fontWeight: "bold",
          }}
          formatter={(value, name) => [
            `Rp ${Number(value).toLocaleString()}`,
            name,
          ]}
        />

        <Legend
          wrapperStyle={{
            paddingTop: 20,
          }}
        />

        <Bar
          dataKey="income"
          name="Pendapatan"
          fill="#22c55e"
          radius={[12, 12, 0, 0]}
        />

        <Bar
          dataKey="expense"
          name="Pengeluaran"
          fill="#ef4444"
          radius={[12, 12, 0, 0]}
        />

        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#eab308"
          strokeWidth={4}
          dot={false}
          activeDot={{
            r: 8,
            fill: "#eab308",
            stroke: "#18181b",
            strokeWidth: 3,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
