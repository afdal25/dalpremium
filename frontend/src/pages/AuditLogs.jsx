import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
  useState(10);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get(
        "/audit-logs"
      );

      setLogs(response.data);
    } catch (error) {
      toast.error(
        "Gagal mengambil audit log"
      );
    }
  };

  const filteredLogs = logs.filter((log) => {

    const matchSearch = log.action
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchRole =
      roleFilter === "ALL"
        ? true
        : log.userRole === roleFilter;

    const logDate = new Date(
      log.createdAt
    );

    const matchStartDate = startDate
      ? logDate >= new Date(startDate)
      : true;

    const matchEndDate = endDate
      ? logDate <=
        new Date(endDate + "T23:59:59")
      : true;

    return (
      matchSearch &&
      matchRole &&
      matchStartDate &&
      matchEndDate
    );
  });

  const totalPages = Math.ceil(
    filteredLogs.length / itemsPerPage
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Logs
      </h1>

      <div className="flex gap-4 mb-6 flex-wrap">

        <input
          type="text"
          placeholder="Search audit log..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-80"
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        >
          <option value="ALL">
            ALL
          </option>

          <option value="ADMIN">
            ADMIN
          </option>

          <option value="STAFF">
            STAFF
          </option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        />

        <button
  onClick={() => {
    setSearch("");
    setRoleFilter("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  }}
  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl"
>
  Reset
</button>

      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">
                Action
              </th>

              <th className="text-left p-4">
                User
              </th>

              <th className="text-left p-4">
                Role
              </th>

              <th className="text-left p-4">
                Tanggal
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedLogs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4">
                  {log.action}
                </td>

                <td className="p-4">
                  {log.userName}
                </td>

                <td className="p-4">
                  {log.userRole}
                </td>

                <td className="p-4">
                  {new Date(
                    log.createdAt
                  ).toLocaleString()}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="p-8 text-center text-zinc-400"
                >
                  Tidak ada log
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
  <span className="text-sm text-zinc-400">
    Show:
  </span>

  <select
    value={itemsPerPage}
    onChange={(e) => {
      setItemsPerPage(
        Number(e.target.value)
      );

      setCurrentPage(1);
    }}
    className="h-9 rounded-lg border border-zinc-800 bg-black px-2 text-sm"
  >
    <option value={10}>10</option>
    <option value={15}>15</option>
    <option value={20}>20</option>
    <option value={25}>25</option>
    <option value={50}>50</option>
    <option value={100}>100</option>
    <option value={1000}>1000</option>
  </select>
</div>
        <p className="text-sm text-zinc-400">
          Page {currentPage} of{" "}
          {totalPages || 1}
        </p>

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">

          <button
            onClick={() =>
              setCurrentPage(currentPage - 1)
            }
            disabled={currentPage === 1}
            className="h-9 shrink-0 rounded-lg bg-zinc-800 px-3 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map(
            (_, index) => {
              const page = index + 1;

              return (
                <button
                  key={page}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`h-9 min-w-9 shrink-0 rounded-lg px-2 text-sm transition ${
                    currentPage === page
                      ? "bg-indigo-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  {page}
                </button>
              );
            }
          )}

          <button
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            className="h-9 shrink-0 rounded-lg bg-zinc-800 px-3 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Next
          </button>

        </div>
      </div>
    </div>
  );
}
