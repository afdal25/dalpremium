import {
  useEffect,
  useState,
} from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  useEffect(() => {

  fetchDashboard();

  const interval =
    setInterval(() => {

      fetchDashboard();

    }, 5000);

  return () =>
    clearInterval(interval);

}, [month, year]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard", {
        params: {
          month,
          year,
        },
      });

      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!data) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-60 bg-zinc-800 rounded-xl" />

      <div className="flex gap-4">
        <div className="h-12 w-32 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="h-12 w-32 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl"
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl"
          />
        ))}
      </div>

      <div className="h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl" />

      <div className="grid grid-cols-2 gap-6">
        <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-2xl" />
        <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      </div>
    </div>
  );
}

  const chartData = data.dailyChart || [];
  const recentTransactions =
    data.recentTransactions || [];

    const recentEmails = data.recentEmails || [];
    const recentAuditLogs = data.recentAuditLogs || [];
    const bestSellerProducts = data.bestSellerProducts || [];
    const recentOrders = data.recentOrders || [];

  return (
    <div className="min-w-0">
      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      {/* Filter */}
      <div className="mb-8 flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(e) =>
            setMonth(e.target.value)
          }
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        >
          <option value="1">Januari</option>
          <option value="2">Februari</option>
          <option value="3">Maret</option>
          <option value="4">April</option>
          <option value="5">Mei</option>
          <option value="6">Juni</option>
          <option value="7">Juli</option>
          <option value="8">Agustus</option>
          <option value="9">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) =>
            setYear(e.target.value)
          }
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-32"
        />
      </div>

      {/* Cards */}
<div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Total Email</p>
    <h2 className="text-3xl font-bold mt-2">
      {data.totalEmails}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Error Email</p>
    <h2 className="text-3xl font-bold mt-2 text-red-400">
      {data.errorEmails}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Total Invite</p>
    <h2 className="text-3xl font-bold mt-2 text-indigo-400">
      {data.totalInvites}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Total Orders</p>
    <h2 className="text-3xl font-bold mt-2">
      {data.totalOrders}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Completed Orders</p>
    <h2 className="text-3xl font-bold mt-2 text-green-400">
      {data.completedOrders}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
    <p className="text-zinc-400">Pending Orders</p>
    <h2 className="text-3xl font-bold mt-2 text-yellow-400">
      {data.pendingOrders}
    </h2>
  </div>
</div>

      {/* Financial Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Pendapatan
          </p>

          <h2 className="text-3xl font-bold mt-2 text-green-400">
            Rp {data.income.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Pengeluaran
          </p>

          <h2 className="text-3xl font-bold mt-2 text-red-400">
            Rp {data.expense.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Profit
          </p>

          <h2 className="text-3xl font-bold mt-2 text-yellow-400">
            Rp {data.profit.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Chart */}
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">
          Statistik Keuangan
        </h2>

        <div className="h-[400px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
  data={chartData}
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
    tickFormatter={(value) =>
      `${value / 1000}k`
    }
  />

  <Tooltip
  cursor={{
    fill: "rgba(255,255,255,0.03)",
  }}
  contentStyle={{
    background:
      "rgba(24,24,27,0.95)",
    border:
      "1px solid rgba(255,255,255,0.08)",
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
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
  <h2 className="text-2xl font-bold mb-6">
    Best Seller Products
  </h2>

  <div className="space-y-4">
    {bestSellerProducts.map((item, index) => (
      <div
        key={item.name}
        className="flex items-center justify-between bg-zinc-800 rounded-xl p-4"
      >
        <div>
          <p className="font-semibold">
            #{index + 1} {item.name}
          </p>

          <p className="text-zinc-400 text-sm">
            {item.totalSold} order
          </p>
        </div>

        <div className="text-green-400 font-bold">
          Rp {item.revenue.toLocaleString()}
        </div>
      </div>
    ))}

    {bestSellerProducts.length === 0 && (
      <div className="text-zinc-400 text-center py-8">
        Belum ada best seller product
      </div>
    )}
  </div>
</div>

<div className="mt-8 grid gap-6 xl:grid-cols-2">
      {/* Recent Transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
        <h2 className="text-2xl font-bold mb-6">
          Transaksi Terbaru
        </h2>

        <div className="space-y-4">
          {recentTransactions.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl bg-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold">
                  {item.description}
                </p>

                <p className="text-zinc-400 text-sm">
                  {new Date(
                    item.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>

              <div
                className={
                  item.type === "PENDAPATAN"
                    ? "shrink-0 text-green-400 font-bold"
                    : "shrink-0 text-red-400 font-bold"
                }
              >
                {item.type === "PENDAPATAN"
                  ? "+"
                  : "-"}
                Rp {item.amount.toLocaleString()}
              </div>
            </div>
          ))}

          {recentTransactions.length === 0 && (
            <div className="text-zinc-400 text-center py-8">
              Belum ada transaksi terbaru
            </div>
          )}
        </div>
      </div>

      {/* Recent Emails */}
<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
  <h2 className="text-2xl font-bold mb-6">
    Akun Email Terbaru
  </h2>

  <div className="space-y-4">
    {recentEmails.map((item) => (
      <div
        key={item.id}
        className="flex min-w-0 flex-col gap-3 rounded-xl bg-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="break-all font-semibold">
            {item.email}
          </p>

          <p className="text-zinc-400 text-sm">
            Slot: {item.invites?.length || 0} / {item.familySlot}
          </p>
        </div>

        <span className="max-w-full shrink-0 rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-400 sm:text-sm">
          {item.status}
        </span>
      </div>
    ))}

    {recentEmails.length === 0 && (
      <div className="text-zinc-400 text-center py-8">
        Belum ada email terbaru
      </div>
    )}
  </div>
</div>

<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
  <h2 className="text-2xl font-bold mb-6">
    Aktivitas Terbaru
  </h2>

  <div className="space-y-4">
    {recentAuditLogs.map((log) => (
      <div
        key={log.id}
        className="bg-zinc-800 rounded-xl p-4"
      >
        <p className="break-words font-semibold">
          {log.action}
        </p>

        <p className="text-zinc-400 text-sm mt-1">
          {log.userName} • {log.userRole} •{" "}
          {new Date(log.createdAt).toLocaleString()}
        </p>
      </div>
    ))}

    {recentAuditLogs.length === 0 && (
      <div className="text-zinc-400 text-center py-8">
        Belum ada aktivitas terbaru
      </div>
    )}
  </div>
</div>

</div>
    </div>
  );
}
