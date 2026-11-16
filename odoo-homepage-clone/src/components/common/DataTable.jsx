import React, { useState, useMemo } from 'react';
import Icon from './Icons';

export const DataTable = ({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your search or filters.',
  searchPlaceholder = 'Search records...',
  defaultSortKey = '',
  defaultSortOrder = 'asc',
  itemsPerPageOptions = [10, 25, 50],
  initialItemsPerPage = 10,
  actionButton = null,
  filters = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey || (columns[0]?.key || ''));
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Sorting handler
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by search term across all columns
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        return sortOrder === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  return (
    <div className="datatable-wrapper">
      {/* Table Controls Top */}
      <div className="datatable-controls">
        <div className="datatable-search-wrapper">
          <Icon name="search" size={18} className="search-icon" />
          <input
            type="text"
            className="datatable-search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="datatable-actions-right">
          {filters}
          {actionButton}
        </div>
      </div>

      {/* Table Container */}
      <div className="datatable-table-container">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;

                return (
                  <th
                    key={col.key || col.header}
                    style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                    className={canSort ? 'sortable-header' : ''}
                    onClick={() => canSort && handleSort(col.key)}
                  >
                    <div className="th-content" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                      <span>{col.header}</span>
                      {canSort && (
                        <span className={`sort-caret ${isSorted ? 'active' : ''}`}>
                          <Icon name="arrowUpDown" size={13} />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="skeleton-row">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`}>
                      <div className="skeleton-cell" style={{ width: cIdx === 0 ? '60%' : '80%' }}></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || `row-${rIdx}`} className="datatable-row">
                  {columns.map((col) => (
                    <td 
                      key={col.key || col.header}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="datatable-empty-cell">
                  <div className="empty-state-box">
                    <div className="empty-icon-wrap">
                      <Icon name="package" size={36} />
                    </div>
                    <h4>{emptyMessage}</h4>
                    <p>{emptySubtext}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && processedData.length > 0 && (
        <div className="datatable-footer">
          <div className="datatable-count-info">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, processedData.length)}</strong> of{' '}
            <strong>{processedData.length}</strong> entries
          </div>

          <div className="datatable-pagination-controls">
            <div className="items-per-page-selector">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {itemsPerPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="pagination-buttons">
              <button
                className="btn-page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <Icon name="chevronLeft" size={16} />
              </button>

              <span className="page-indicator">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn-page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
