function escapeCsvValue(value) {
  const raw = String(value ?? '');
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportToCsv({ fileName, headers, rows }) {
  const headerLine = headers.map((header) => escapeCsvValue(header.label)).join(',');

  const dataLines = rows.map((row) =>
    headers
      .map((header) => escapeCsvValue(row[header.key]))
      .join(','),
  );

  const content = [headerLine, ...dataLines].join('\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
