import { useEffect, useState } from 'react'

const TABS = [
  { id: 'start', label: 'Inicio' },
  { id: 'groups', label: 'Grupos' },
  { id: 'knockout', label: 'Eliminatorias' },
  { id: 'points', label: 'Puntos' },
]

function InfoModal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[min(90vh,680px)] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-200 shrink-0">
          <h2 id="how-to-play-title" className="text-base font-bold text-slate-800 uppercase tracking-widest">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

function MiniScore({ home, away, highlight }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-11 h-11 flex items-center justify-center rounded-lg text-base font-black ${highlight ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40' : 'bg-[#1e1e1e] text-white'}`}>
        {home}
      </span>
      <span className="text-white/20 font-bold text-lg">–</span>
      <span className={`w-11 h-11 flex items-center justify-center rounded-lg text-base font-black ${highlight ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40' : 'bg-[#1e1e1e] text-white'}`}>
        {away}
      </span>
    </div>
  )
}

function MiniTeam({ name, selected, showPenales }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-20">
      <div className="relative">
        <div
          className={`w-12 h-8 rounded-sm border flex items-center justify-center text-[9px] font-bold uppercase tracking-wide ${
            selected
              ? 'border-teal-400 ring-2 ring-teal-400/50 text-teal-300/80'
              : 'border-white/20 bg-white/5 text-white/30'
          }`}
        >
          {name.slice(0, 3)}
        </div>
        {showPenales && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase bg-teal-400 text-black px-1.5 py-px rounded-sm whitespace-nowrap">
            Penales
          </span>
        )}
      </div>
      <span className={`text-xs font-bold text-center leading-tight ${selected ? 'text-teal-300' : 'text-white/50'}`}>
        {name}
      </span>
    </div>
  )
}

function MiniAlargue({ value, locked }) {
  return (
    <div className="flex items-center justify-center gap-2.5 mt-3">
      <span className="text-xs font-bold text-white/30 uppercase">Alargue</span>
      <div className="flex gap-1.5">
        {['Sí', 'No'].map((label, i) => {
          const active = (locked && i === 0) || (!locked && value === label)
          return (
            <span
              key={label}
              className={`px-3 py-1 rounded text-xs font-bold ${
                active
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-[#1a1a1a] text-white/30 border border-[#2a2a2a]'
              } ${locked && i === 1 ? 'opacity-40' : ''}`}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CardMock({ children }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded-full">P73</span>
        <span className="text-[10px] text-white/25 uppercase tracking-wide">Eliminatoria</span>
      </div>
      {children}
    </div>
  )
}

function StepCard({ n, title, desc, color }) {
  const bg = {
    teal: 'bg-teal-50 border-teal-100 text-teal-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  }[color]

  return (
    <div className={`flex gap-4 rounded-xl border px-4 py-4 ${bg}`}>
      <span className="shrink-0 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-base font-black shadow-sm">
        {n}
      </span>
      <div>
        <p className="text-base font-bold text-slate-800">{title}</p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function TabPanel({ active, id, children }) {
  if (active !== id) return null
  return <div className="px-6 py-5 animate-fade-in">{children}</div>
}

function HowToPlayContent() {
  const [tab, setTab] = useState('start')
  const [knockoutMode, setKnockoutMode] = useState('winner')

  return (
    <>
      <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-200/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 px-1 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <TabPanel active={tab} id="start">
        <p className="text-base text-slate-600 mb-5 leading-relaxed">
          Carga tus pronósticos antes de que empiece cada partido. Después del pitido inicial, la casilla se cierra.
        </p>
        <div className="space-y-3">
          <StepCard
            n="1"
            color="teal"
            title="Elige la fase"
            desc="Usa las pestañas Grupos, Dieciseisavos, Octavos… para ver los partidos de cada ronda."
          />
          <StepCard
            n="2"
            color="amber"
            title="Completa la casilla"
            desc="Ingresa el marcador y, en eliminatorias, las opciones extra que aparezcan."
          />
          <StepCard
            n="3"
            color="slate"
            title="Pulsa Guardar"
            desc="Puedes volver y actualizar tu pronóstico hasta el inicio del partido."
          />
        </div>
      </TabPanel>

      <TabPanel active={tab} id="groups">
        <p className="text-base text-slate-600 mb-5 leading-relaxed">
          En fase de grupos solo pronosticas el marcador final del partido.
        </p>
        <CardMock>
          <div className="flex items-center justify-between gap-2">
            <MiniTeam name="Local" />
            <MiniScore home={2} away={1} highlight />
            <MiniTeam name="Visit." />
          </div>
          <div className="mt-4 flex justify-center">
            <span
              className="text-sm font-semibold px-5 py-2 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #00c9a7, #0057ff)' }}
            >
              Guardar
            </span>
          </div>
        </CardMock>
        <p className="text-sm text-slate-500 mt-4 text-center leading-relaxed">
          Escribe goles del local y visitante, luego guarda.
        </p>
      </TabPanel>

      <TabPanel active={tab} id="knockout">
        <p className="text-base text-slate-600 mb-4 leading-relaxed">
          El marcador incluye alargue si hubo. Los penales no suman goles al marcador.
        </p>

        <div className="flex gap-3 mb-5">
          {[
            { id: 'winner', label: 'Con ganador', score: '2 – 1' },
            { id: 'draw', label: 'Empate', score: '1 – 1' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKnockoutMode(opt.id)}
              className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                knockoutMode === opt.id
                  ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xl font-black text-slate-700 tabular-nums mt-1">{opt.score}</p>
            </button>
          ))}
        </div>

        <CardMock>
          <div className="flex items-center justify-between gap-2">
            <MiniTeam
              name="Local"
              selected={knockoutMode === 'draw'}
              showPenales={knockoutMode === 'draw'}
            />
            <MiniScore
              home={knockoutMode === 'winner' ? 2 : 1}
              away={knockoutMode === 'winner' ? 1 : 1}
              highlight
            />
            <MiniTeam name="Visit." />
          </div>
          <MiniAlargue
            value={knockoutMode === 'winner' ? 'Sí' : null}
            locked={knockoutMode === 'draw'}
          />
        </CardMock>

        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
          {knockoutMode === 'winner' ? (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Marcador con ganador:</span> elige si habrá alargue (Sí/No). No se pronostican penales.
            </p>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Empate:</span> toca el equipo que pasa por penales. El alargue queda en <span className="font-semibold">Sí</span> y no se puede cambiar.
            </p>
          )}
        </div>
      </TabPanel>

      <TabPanel active={tab} id="points">
        <p className="text-base text-slate-600 mb-5 leading-relaxed">
          Los puntos se calculan solos cuando el admin carga el resultado real.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { pts: '5', label: 'Exacto', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { pts: '3', label: 'Ganador', color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { pts: '0', label: 'Fallaste', color: 'text-slate-400 bg-slate-50 border-slate-200' },
          ].map(({ pts, label, color }) => (
            <div key={pts} className={`rounded-xl border px-3 py-4 text-center ${color}`}>
              <p className="text-3xl font-black tabular-nums">{pts}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mt-1.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-teal-50 border border-slate-200 px-5 py-4 space-y-3">
          <p className="text-sm font-bold text-slate-800">Fase de grupos</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Solo puntos base: 5 (exacto), 3 (ganador o empate) o 0.
          </p>
          <p className="text-sm font-bold text-slate-800 pt-1">Eliminatorias</p>
          <div className="flex flex-wrap gap-2">
            {['+1 a +5 bono fase', '+2 alargue'].map((tag) => (
              <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 text-slate-600 border border-slate-200/80">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Los bonos se suman solo si acertaste el desenlace (3 o 5 pts base). Si fallas ganador/empate,
            el partido vale 0 aunque acertes penales o alargue. Detalle en{' '}
            <span className="font-semibold text-slate-800">Tabla → Sistema de puntos</span>.
          </p>
        </div>
      </TabPanel>
    </>
  )
}

export default function HowToPlayModal({ onClose }) {
  return (
    <InfoModal title="Cómo jugar" onClose={onClose}>
      <HowToPlayContent />
    </InfoModal>
  )
}
