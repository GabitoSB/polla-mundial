import { useEffect, useRef, useState } from 'react'
import { COUNTRY_OPTIONS } from '../constants/countries'

export default function TeamSelect({ value, onChange, placeholder = 'Seleccionar equipo', exclude }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const selected = COUNTRY_OPTIONS.find((c) => c.value === value)

  const filtered = COUNTRY_OPTIONS.filter(
    (c) =>
      c.value !== exclude &&
      c.label.toLowerCase().includes(search.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (option) => {
    onChange(option.value)
    setSearch('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch('') }}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-2.5 text-sm
                    bg-white text-left transition-all
                    ${open ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}
                    ${!selected ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <><span className="text-lg leading-none">{selected.flag}</span> {selected.value}</>
          ) : placeholder}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer px-0.5"
              title="Limpiar"
            >✕</span>
          )}
          <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
            )}

            {/* Hosts first */}
            {filtered.filter((c) => c.host).length > 0 && search === '' && (
              <>
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Anfitriones ★
                </div>
                {filtered.filter((c) => c.host).map((c) => (
                  <OptionRow key={c.value} option={c} selected={value} onSelect={handleSelect} />
                ))}
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">
                  Todos los equipos
                </div>
              </>
            )}

            {filtered
              .filter((c) => search !== '' || !c.host)
              .map((c) => (
                <OptionRow key={c.value} option={c} selected={value} onSelect={handleSelect} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
        ${option.value === selected
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'hover:bg-gray-50 text-gray-800'}`}
    >
      <span className="text-xl leading-none w-7 text-center">{option.flag}</span>
      <span>{option.value}</span>
      {option.host && <span className="ml-auto text-xs text-amber-500 font-semibold">Anfitrión</span>}
    </button>
  )
}
