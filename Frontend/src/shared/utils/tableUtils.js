function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function searchAndPaginate({
  items,
  query,
  matcher,
  page,
  pageSize,
}) {
  const normalizedQuery = normalizeText(query || '');
  const filteredItems = !normalizedQuery
    ? items
    : items.filter((item) => matcher(item, normalizedQuery, normalizeText));

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedItems = filteredItems.slice(start, start + pageSize);

  return {
    filteredItems,
    pagedItems,
    totalItems,
    totalPages,
    currentPage,
  };
}
