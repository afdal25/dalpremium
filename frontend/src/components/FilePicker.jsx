export default function FilePicker({
  file,
  onChange,
  accept = "image/*",
  label = "Pilih File",
  className = "",
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center ${className}`}>
      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[#d5a756]/40 bg-[#d5a756]/10 px-4 text-sm font-black text-[#f0cf87] transition hover:border-[#d5a756] hover:bg-[#d5a756]/20">
        {label}
        <input
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>
      <span className="min-w-0 truncate text-sm font-semibold text-zinc-400">
        {file?.name || "Belum ada file dipilih"}
      </span>
    </div>
  );
}
