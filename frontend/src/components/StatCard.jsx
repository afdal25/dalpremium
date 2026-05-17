export default function StatCard({
  title,
  value,
  color,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">

      <p className="text-zinc-400">
        {title}
      </p>

      <h2 className={`text-2xl font-bold mt-2 ${color}`}>
        {value}
      </h2>

    </div>
  );
}