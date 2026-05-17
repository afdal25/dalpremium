const escapeCsvValue = (value) => {
  const text = String(value ?? "");

  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportRowsToCsv = (rows, filename) => {
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ].join("\n");

  downloadTextFile(csv, filename, "text/csv;charset=utf-8;");
};

export const exportRowsToXlsx = async (
  rows,
  filename,
  sheetName = "Data"
) => {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const exportRowsToPdf = async ({
  title,
  headers,
  rows,
  filename,
  orientation = "portrait",
  styles,
}) => {
  const [{ default: jsPDF }, { default: autoTable }] =
    await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
  const document = new jsPDF({ orientation });

  document.text(title, 14, 15);
  autoTable(document, {
    startY: 25,
    head: [headers],
    body: rows,
    styles,
  });
  document.save(filename);
};
