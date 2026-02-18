function TableControls({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
  onExportCsv,
  exportLabel = 'Exportar CSV',
}) {
  return (
    <div className="table-controls">
      <input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
      />

      <div className="table-controls-right">
        <span className="table-controls-summary">{`${totalItems} registro(s)`}</span>

        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Tamaño de página"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

        <div className="pagination-controls">
          <button type="button" onClick={onPrevPage} disabled={currentPage <= 1}>
            Anterior
          </button>
          <span>{`Página ${currentPage} de ${totalPages}`}</span>
          <button type="button" onClick={onNextPage} disabled={currentPage >= totalPages}>
            Siguiente
          </button>
        </div>

        {onExportCsv && (
          <button type="button" onClick={onExportCsv} className="export-csv-btn" disabled={totalItems === 0}>
            {exportLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default TableControls;
