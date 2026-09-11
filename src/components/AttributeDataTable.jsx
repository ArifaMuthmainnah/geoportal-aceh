import { useEffect, useMemo, useState } from 'react'

import {
  IconSearch,
  IconPencil,
  IconTrash,
} from './ActionIcons'

function IconPlus({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconCrosshair({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function IconColumns({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  )
}

function IconRefreshCw({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function IconSliders({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

const NUMERIC_OPERATORS = [
  { value: '=', label: '=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '<>', label: '<>' },
]

const TEXT_OPERATORS = [
  { value: '=', label: '=' },
  { value: '<>', label: '<>' },
  { value: 'like', label: 'like' },
  { value: 'ilike', label: 'ilike' },
  { value: 'isNull', label: 'isNull' },
]

const PAGE_SIZE = 15

function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function applyTextFilter(value, operator, target) {
  const v = value === null || value === undefined ? '' : String(value)
  switch (operator) {
    case '=': return v === target
    case '<>': return v !== target
    case 'like': return v.includes(target)
    case 'ilike': return v.toLowerCase().includes(String(target || '').toLowerCase())
    case 'isNull': return v.trim() === ''
    default: return true
  }
}

function applyNumericFilter(value, operator, target) {
  const num = Number(value)
  const cmp = Number(target)
  if (Number.isNaN(num) || Number.isNaN(cmp)) return true
  switch (operator) {
    case '=': return num === cmp
    case '>': return num > cmp
    case '<': return num < cmp
    case '>=': return num >= cmp
    case '<=': return num <= cmp
    case '<>': return num !== cmp
    default: return true
  }
}

function isFilterActive(filter) {
  if (!filter?.operator) return false
  if (filter.operator === 'isNull') return true
  return filter.value !== '' && filter.value !== undefined && filter.value !== null
}

function AttributeDataTable({
  rows = [],
  attributeMeta = [],
  loading = false,
  saving = false,
  emptyMessage = '',
  onSaveRows,
  onZoomToFeature,
  onZoomToRows,
}) {

  const [editMode, setEditMode] = useState(false)
  const [draftRows, setDraftRows] = useState([])
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())

  const [columnFilters, setColumnFilters] = useState({})
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set())

  const [showColumnsPopup, setShowColumnsPopup] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedConditions, setAdvancedConditions] = useState([{ column: '', operator: '', value: '' }])

  const [syncMapWithFilter, setSyncMapWithFilter] = useState(false)
  const [page, setPage] = useState(1)

  function labelFor(col) {
    const found = attributeMeta.find((a) => a.name === col)
    if (found && found.label && found.label !== 'N/A' && found.label.trim()) return found.label.trim()
    return col
  }

  const columns = useMemo(() => {
    const known = new Set()
    const ordered = []

    attributeMeta.forEach((a) => {
      if (a?.name && !known.has(a.name)) {
        known.add(a.name)
        ordered.push(a.name)
      }
    })

    rows.forEach((row) => {
      Object.keys(row?.properties || {}).forEach((key) => {
        if (!known.has(key)) {
          known.add(key)
          ordered.push(key)
        }
      })
    })

    return ordered
  }, [rows, attributeMeta])

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col)),
    [columns, hiddenColumns]
  )

  const columnTypes = useMemo(() => {
    const types = {}
    columns.forEach((col) => {
      let sampled = 0
      let numeric = 0
      for (const row of rows) {
        if (sampled >= 30) break
        const v = row?.properties?.[col]
        if (v === undefined || v === null || v === '') continue
        sampled++
        if (v !== '' && !Number.isNaN(Number(v))) numeric++
      }
      types[col] = sampled > 0 && numeric === sampled ? 'number' : 'text'
    })
    return types
  }, [columns, rows])

  useEffect(() => {
    if (columns.length === 0) return
    setColumnFilters((current) => {
      let changed = false
      const next = { ...current }
      columns.forEach((col) => {
        if (!next[col]) {
          next[col] = { operator: columnTypes[col] === 'number' ? '=' : 'ilike', value: '' }
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [columns, columnTypes])

  const workingRows = editMode ? draftRows : rows

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, f]) => isFilterActive(f))
    if (activeFilters.length === 0) return workingRows

    return workingRows.filter((row) =>
      activeFilters.every(([col, filter]) => {
        const value = row?.properties?.[col]
        return columnTypes[col] === 'number'
          ? applyNumericFilter(value, filter.operator, filter.value)
          : applyTextFilter(value, filter.operator, filter.value)
      })
    )
  }, [workingRows, columnFilters, columnTypes])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  )

  useEffect(() => {
    if (!syncMapWithFilter || !onZoomToRows) return
    const withGeometry = filteredRows.filter((r) => r._hasGeometry)
    if (withGeometry.length > 0) onZoomToRows(withGeometry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncMapWithFilter, filteredRows])

  function handleToggleEditMode() {
    if (editMode) {
      setEditMode(false)
      setDraftRows([])
      setSelectedKeys(new Set())
      return
    }
    setDraftRows(rows.map((row) => ({ ...row, properties: { ...row.properties } })))
    setSelectedKeys(new Set())
    setEditMode(true)
  }

  function handleCellChange(key, col, value) {
    setDraftRows((current) =>
      current.map((row) =>
        row._key === key
          ? { ...row, properties: { ...row.properties, [col]: value } }
          : row
      )
    )
  }

  function handleAddRow() {
    const emptyProps = {}
    columns.forEach((col) => { emptyProps[col] = '' })

    setDraftRows((current) => [
      ...current,
      {
        _key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        properties: emptyProps,
        _hasGeometry: false,
        _geometry: null,
        _isAdded: true,
      },
    ])
  }

  function toggleRowSelected(key) {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allPagedSelected =
    pagedRows.length > 0 && pagedRows.every((r) => selectedKeys.has(r._key))

  function toggleSelectAllPaged() {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (allPagedSelected) {
        pagedRows.forEach((r) => next.delete(r._key))
      } else {
        pagedRows.forEach((r) => next.add(r._key))
      }
      return next
    })
  }

  function handleDeleteSelected() {
    if (selectedKeys.size === 0) return
    const confirmed = window.confirm(`Hapus ${selectedKeys.size} baris terpilih?`)
    if (!confirmed) return
    setDraftRows((current) => current.filter((row) => !selectedKeys.has(row._key)))
    setSelectedKeys(new Set())
  }

  async function handleSave() {
    if (!onSaveRows) return
    await onSaveRows(draftRows)
    setEditMode(false)
    setDraftRows([])
    setSelectedKeys(new Set())
  }

  function handleSetFilterOperator(col, operator) {
    setColumnFilters((current) => ({
      ...current,
      [col]: { operator, value: operator === 'isNull' ? '' : (current[col]?.value || '') },
    }))
  }

  function handleSetFilterValue(col, value) {
    setColumnFilters((current) => ({
      ...current,
      [col]: { operator: current[col]?.operator || '', value },
    }))
  }

  function handleResetFilters() {
    setColumnFilters({})
    setAdvancedConditions([{ column: '', operator: '', value: '' }])
  }

  function updateAdvancedCondition(index, field, value) {
    setAdvancedConditions((current) =>
      current.map((cond, i) => {
        if (i !== index) return cond
        const next = { ...cond, [field]: value }
        if (field === 'column') next.operator = ''
        return next
      })
    )
  }

  function addAdvancedCondition() {
    setAdvancedConditions((current) => [...current, { column: '', operator: '', value: '' }])
  }

  function removeAdvancedCondition(index) {
    setAdvancedConditions((current) => current.filter((_, i) => i !== index))
  }

  function applyAdvancedConditions() {
    setColumnFilters((current) => {
      const next = { ...current }
      advancedConditions.forEach((cond) => {
        if (cond.column && cond.operator) {
          next[cond.column] = { operator: cond.operator, value: cond.value }
        }
      })
      return next
    })
  }

  function toggleColumn(col) {
    setHiddenColumns((current) => {
      const next = new Set(current)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  const showZoomColumn = Boolean(onZoomToFeature)

  return (
    <div className="attr-table-panel">

      <div className="attr-table-toolbar">

        <button
          type="button"
          className={`attr-table-icon-btn ${editMode ? 'active' : ''}`}
          title={editMode ? 'Keluar dari mode edit' : 'Edit Mode'}
          onClick={handleToggleEditMode}
        >
          <IconPencil size={15} />
        </button>

        <button
          type="button"
          className={`attr-table-icon-btn ${showAdvancedSearch ? 'active' : ''}`}
          title="Advanced Search"
          onClick={() => setShowAdvancedSearch((v) => !v)}
        >
          <IconSliders />
        </button>

        <button
          type="button"
          className="attr-table-icon-btn"
          title="Zoom to page extent"
          onClick={() => onZoomToRows && onZoomToRows(filteredRows.filter((r) => r._hasGeometry))}
        >
          <IconCrosshair />
        </button>

        <div className="attr-columns-wrap">
          <button
            type="button"
            className={`attr-table-icon-btn ${showColumnsPopup ? 'active' : ''}`}
            title="Hide/show columns"
            onClick={() => setShowColumnsPopup((v) => !v)}
          >
            <IconColumns />
          </button>

          {showColumnsPopup && (
            <div className="attr-columns-popup">
              <strong>Tampilkan Kolom</strong>
              {columns.map((col) => (
                <label key={col}>
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(col)}
                    onChange={() => toggleColumn(col)}
                  />
                  <span>{labelFor(col)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`attr-table-icon-btn ${syncMapWithFilter ? 'active' : ''}`}
          title="Sync map with filter"
          onClick={() => setSyncMapWithFilter((v) => !v)}
        >
          <IconRefreshCw />
        </button>

        <div className="attr-table-toolbar-spacer" />

        {editMode && (
          <div className="attr-table-edit-actions">
            <button type="button" className="attr-table-add-row-btn" onClick={handleAddRow}>
              <IconPlus /> Tambah Baris
            </button>
            <button
              type="button"
              className="attr-table-delete-selected-btn"
              onClick={handleDeleteSelected}
              disabled={selectedKeys.size === 0}
            >
              <IconTrash size={14} /> Hapus Terpilih{selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ''}
            </button>
            <button type="button" className="attr-table-cancel-btn" onClick={handleToggleEditMode} disabled={saving}>
              Batal
            </button>
            <button type="button" className="attr-table-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}

        <span className="attr-table-count-badge">
          {filteredRows.length} / {rows.length} baris
          {editMode && selectedKeys.size > 0 ? ` · ${selectedKeys.size} dipilih` : ''}
        </span>

      </div>

      {showAdvancedSearch && (
        <div className="attr-advanced-search-panel">

          {advancedConditions.map((cond, index) => (
            <div className="attr-advanced-condition-row" key={index}>

              <select value={cond.column} onChange={(e) => updateAdvancedCondition(index, 'column', e.target.value)}>
                <option value="">Pilih kolom...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{labelFor(col)}</option>
                ))}
              </select>

              <select
                value={cond.operator}
                onChange={(e) => updateAdvancedCondition(index, 'operator', e.target.value)}
                disabled={!cond.column}
              >
                <option value="">Operator...</option>
                {(columnTypes[cond.column] === 'number' ? NUMERIC_OPERATORS : TEXT_OPERATORS).map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={cond.value}
                placeholder={
                  cond.operator === 'isNull'
                    ? 'tidak perlu nilai'
                    : columnTypes[cond.column] === 'number'
                      ? 'masukkan angka...'
                      : 'masukkan teks...'
                }
                disabled={cond.operator === 'isNull'}
                onChange={(e) => updateAdvancedCondition(index, 'value', e.target.value)}
              />

              <button type="button" className="attr-table-delete-row-btn" onClick={() => removeAdvancedCondition(index)}>
                <IconTrash size={13} />
              </button>

            </div>
          ))}

          <div className="attr-advanced-search-actions">
            <button type="button" onClick={addAdvancedCondition}>
              <IconPlus size={13} /> Tambah Kondisi
            </button>
            <button type="button" className="attr-primary-btn" onClick={applyAdvancedConditions}>
              <IconSearch size={13} /> Terapkan
            </button>
            <button type="button" onClick={handleResetFilters}>
              Reset Semua Filter
            </button>
          </div>

        </div>
      )}

      <div className="attr-table-wrapper">

        {loading ? (

          <div className="attr-table-loading">
            <div className="loading-spinner" />
            <p>Memuat isi atribut...</p>
          </div>

        ) : pagedRows.length === 0 ? (

          <div className="dataset-attributes-empty">
            <div className="dataset-empty-icon">◫</div>
            <h4>Isi atribut belum tersedia</h4>
            <p>{emptyMessage || 'Belum ada baris data untuk ditampilkan.'}</p>
          </div>

        ) : (

          <>
            <table className="attr-table">

              <thead>

                <tr>
                  {editMode && (
                    <th className="attr-table-select-col">
                      <input type="checkbox" checked={allPagedSelected} onChange={toggleSelectAllPaged} />
                    </th>
                  )}
                  {showZoomColumn && <th className="attr-table-zoom-col"></th>}
                  {visibleColumns.map((col) => (
                    <th key={col}>{labelFor(col)}</th>
                  ))}
                </tr>

                <tr className="attr-table-filter-row">
                  {editMode && <th></th>}
                  {showZoomColumn && <th></th>}
                  {visibleColumns.map((col) => (
                    <th key={col}>
                      <div className="attr-filter-cell">
                        <select
                          value={columnFilters[col]?.operator || ''}
                          onChange={(e) => handleSetFilterOperator(col, e.target.value)}
                        >
                          <option value="">--</option>
                          {(columnTypes[col] === 'number' ? NUMERIC_OPERATORS : TEXT_OPERATORS).map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={columnFilters[col]?.value || ''}
                          disabled={!columnFilters[col]?.operator || columnFilters[col]?.operator === 'isNull'}
                          onChange={(e) => handleSetFilterValue(col, e.target.value)}
                          placeholder={
                            !columnFilters[col]?.operator
                              ? 'pilih operator dulu'
                              : columnFilters[col]?.operator === 'isNull'
                                ? 'tidak perlu nilai'
                                : columnTypes[col] === 'number'
                                  ? 'masukkan angka...'
                                  : 'masukkan teks...'
                          }
                        />
                      </div>
                    </th>
                  ))}
                </tr>

              </thead>

              <tbody>

                {pagedRows.map((row) => (
                  <tr key={row._key} className={selectedKeys.has(row._key) ? 'attr-row-selected' : ''}>

                    {editMode && (
                      <td className="attr-table-select-col">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(row._key)}
                          onChange={() => toggleRowSelected(row._key)}
                        />
                      </td>
                    )}

                    {showZoomColumn && (
                      <td className="attr-table-zoom-col">
                        <button
                          type="button"
                          className="attr-table-zoom-btn"
                          title={row._hasGeometry ? 'Zoom to feature' : 'Tidak ada geometri'}
                          disabled={!row._hasGeometry}
                          onClick={() => onZoomToFeature(row)}
                        >
                          <IconCrosshair size={13} />
                        </button>
                      </td>
                    )}

                    {visibleColumns.map((col) => (
                      <td key={col}>
                        {editMode ? (
                          <input
                            type="text"
                            value={row.properties?.[col] ?? ''}
                            onChange={(e) => handleCellChange(row._key, col, e.target.value)}
                          />
                        ) : (
                          <span>{formatCellValue(row.properties?.[col])}</span>
                        )}
                      </td>
                    ))}

                  </tr>
                ))}

              </tbody>

            </table>

            {totalPages > 1 && (
              <div className="attr-table-pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹ Sebelumnya
                </button>
                <span>Halaman {page} dari {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Berikutnya ›
                </button>
              </div>
            )}
          </>

        )}

      </div>

    </div>
  )

}

export default AttributeDataTable