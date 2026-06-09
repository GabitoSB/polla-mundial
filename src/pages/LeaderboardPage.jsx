import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/leaderboard'
import UserAvatar from '../components/UserAvatar'
import { useAuth } from '../context/AuthContext'

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
      aria-labelledby="info-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[min(90vh,640px)] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-200 z-10">
          <h2 id="info-modal-title" className="text-base font-bold text-slate-800 uppercase tracking-widest">
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
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function RuleRow({ pts, ptsClass, title, desc }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
      <span className={`shrink-0 font-black text-base tabular-nums ${ptsClass}`}>{pts}</span>
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PointsSystemContent() {
  return (
    <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
      <p className="text-base text-slate-600">
        En la <span className="font-semibold text-slate-800">fase de grupos</span> solo hay puntos base (5, 3 o 0).
        En <span className="font-semibold text-slate-800">eliminatorias</span> se suman bonos extra sobre esos puntos base,
        pero únicamente cuando acertaste el <span className="font-semibold text-slate-800">desenlace</span> del partido:
        ganador, perdedor o empate en el marcador. No hace falta el marcador exacto: con 3 pts ya cuentas los bonos.
      </p>
      <p className="text-sm text-slate-500">
        Si te equivocas en el desenlace (por ejemplo pronosticas que gana A y gana B), ese partido vale{' '}
        <span className="font-semibold text-slate-700">0 pts</span> en total, aunque hayas acertado alargue o penales.
      </p>

      <section className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-1 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-700">Pronósticos:</span> debes cargarlos antes del inicio de cada partido.
          Después del pitido inicial la casilla se cierra.
        </p>
        <p>
          <span className="font-semibold text-slate-700">Eliminatorias:</span> el marcador cuenta el resultado tras 90 min
          y alargue si hubo. Los goles de la tanda de penales no suman al marcador.
        </p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-sm font-black">1</span>
          Puntos base (todos los partidos)
        </h3>
        <div className="space-y-2">
          <RuleRow
            pts="5 pts"
            ptsClass="text-emerald-600"
            title="Marcador exacto"
            desc="Aciertas los goles del local y del visitante."
          />
          <RuleRow
            pts="3 pts"
            ptsClass="text-amber-600"
            title="Desenlace correcto"
            desc="Aciertas quién gana o si hay empate, pero no el marcador completo. Ejemplo: pronosticas 2-1 y sale 3-2."
          />
          <RuleRow
            pts="0 pts"
            ptsClass="text-slate-400"
            title="Desenlace incorrecto"
            desc="No acertaste ganador ni empate. No sumas bonos de eliminatoria en ese partido."
          />
        </div>
      </section>

      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-sm font-black">2</span>
          Bono por clasificado (solo eliminatorias)
        </h3>
        <p className="mb-2 text-slate-600">
          Por acertar quién avanza a la siguiente ronda. Se suma encima de los 3 o 5 pts base:
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-sm mb-3">
          {[
            ['16° de final', '+1'],
            ['8° de final', '+2'],
            ['4° de final', '+3'],
            ['Semifinal', '+4'],
            ['Tercer puesto', '+3'],
            ['Final', '+5'],
          ].map(([fase, pts]) => (
            <div key={fase} className="flex justify-between rounded-md bg-amber-50/80 border border-amber-100 px-2.5 py-1.5">
              <span className="text-slate-700">{fase}</span>
              <span className="font-bold text-amber-700">{pts}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2.5 space-y-1.5">
          <p className="text-sm text-amber-900/90">
            Si el partido tiene <span className="font-semibold">ganador en el marcador</span>, basta con acertar el
            desenlace (3 o 5 pts base) para sumar el bono de la fase.
          </p>
          <p className="text-sm text-amber-900/90">
            Si el partido termina <span className="font-semibold">empatado</span> y se define por penales, necesitas
            haber pronosticado el empate <span className="font-semibold">y</span> el equipo que pasa por penales.
            Acertar solo los penales sin el empate no alcanza.
          </p>
        </div>
      </section>

      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-800 text-sm font-black">3</span>
          Bono de alargue (solo eliminatorias)
        </h3>
        <RuleRow
          pts="+2 pts"
          ptsClass="text-teal-600"
          title="¿Hubo alargue?"
          desc="Si pronosticas correctamente si hubo alargue (Sí/No), sumas 2 pts extra. Con empate en el marcador el alargue se asume Sí. Solo aplica cuando ya sumaste 3 o 5 pts base en ese mismo partido."
        />
      </section>

      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2">Ejemplos</h3>
        <div className="space-y-2">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Grupos — marcador exacto 2-1</p>
            <p className="text-sm text-slate-500">5 pts base</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 5 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Octavos — ganador correcto 1-0 (sin marcador exacto)</p>
            <p className="text-sm text-slate-500">3 pts base + 2 pts bono de fase</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 5 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Cuartos — marcador exacto 2-1 y alargue acertado</p>
            <p className="text-sm text-slate-500">5 pts base + 3 pts bono de fase + 2 pts alargue</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 10 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Final — marcador exacto 2-2, penales y alargue acertados</p>
            <p className="text-sm text-slate-500">5 pts base + 5 pts bono de fase + 2 pts alargue</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 12 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Semifinal — pronosticaste 1-0, salió 0-2 (aunque acertaste alargue)</p>
            <p className="text-sm text-slate-500">Desenlace incorrecto → sin puntos base ni bonos</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 0 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Octavos — pronosticaste 0-1, salió 1-1 y pasó el visitante por penales</p>
            <p className="text-sm text-slate-500">Desenlace incorrecto aunque acertaras los penales</p>
            <p className="text-base font-black text-slate-800 mt-1">Total: 0 pts</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function TiebreakContent() {
  return (
    <>
      <p className="text-sm text-slate-500 mb-3 leading-relaxed">
        Si dos o más jugadores empatan en puntos totales, se desempata en este orden
        (columnas <span className="font-semibold text-slate-600">Exactos</span> y{' '}
        <span className="font-semibold text-slate-600">Parciales</span> de la tabla):
      </p>
      <div className="flex flex-col gap-3">
        {[
          {
            n: '1°',
            title: 'Puntos',
            desc: 'Suma de todos los puntos del torneo, incluyendo bonos de eliminatorias y alargue.',
          },
          {
            n: '2°',
            title: 'Resultados exactos acertados',
            desc: 'Cantidad de partidos en los que acertaste el marcador completo (goles de local y visitante). Los bonos no cuentan para este número.',
          },
          {
            n: '3°',
            title: 'Resultados parciales acertados',
            desc: 'A igual número de exactos, gana quien tenga más partidos con resultado correcto (3 pts) y al menos los goles de un equipo acertados, sin ser marcador exacto. Ejemplo: pronosticas 3-1 y sale 2-1.',
          },
        ].map(({ n, title, desc }) => (
          <div key={n} className="grid grid-cols-[2rem_1fr] gap-2 items-baseline">
            <span className="text-slate-400 font-black text-base text-right">{n}</span>
            <div>
              <span className="text-slate-800 text-base font-semibold">{title}</span>
              <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    getLeaderboard()
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    )

  return (
    <div
      className="min-h-screen stadium-bg"
      style={{
        backgroundImage: 'url(/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="min-h-screen" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
          <h1
            className="text-2xl sm:text-3xl font-black text-white mb-4 sm:mb-6 text-center drop-shadow-lg"
          >
            Tabla de Posiciones
          </h1>

          <div className="rounded-2xl overflow-x-auto bg-white/95 shadow-xl border border-slate-200/90 backdrop-blur-md w-fit max-w-full mx-auto">
            {entries.length === 0 ? (
              <div className="text-center py-12 px-8 text-slate-400">
                <p>Aún no hay puntuaciones</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-base table-auto">
                <thead>
                  <tr className="text-sm font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border-b border-slate-200">
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold w-0 whitespace-nowrap">#</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left font-bold whitespace-nowrap">Jugador</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-bold whitespace-nowrap">Pts</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-bold whitespace-nowrap max-sm:hidden sm:table-cell">Exactos</th>
                    <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-bold whitespace-nowrap max-sm:hidden sm:table-cell">Parciales</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => {
                    const isMe = entry.username === user?.username
                    return (
                      <tr
                        key={entry.user_id}
                        className={`transition-colors
                          ${idx % 2 === 1 && !isMe ? 'bg-slate-50/80' : 'bg-white'}
                          ${isMe ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : ''}
                        `}
                        style={{ borderBottom: '1px solid #e2e8f0' }}
                      >
                        <td className="px-2 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-400 tabular-nums whitespace-nowrap">
                          {entry.rank}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap max-w-[10rem] sm:max-w-none">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                              username={entry.username}
                              avatarUrl={entry.avatar_url}
                              size="sm"
                            />
                            <span className={`block truncate ${isMe ? 'text-teal-700 font-bold' : 'text-slate-800 font-medium'}`}>
                              {entry.username}
                              {isMe && <span className="ml-1 text-sm text-teal-600 font-semibold">(tú)</span>}
                            </span>
                          </div>
                          <span className="sm:hidden text-xs text-slate-400 mt-0.5 block">
                            {entry.exact_results} exactos · {entry.partial_score_hits} parc.
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-right font-black text-slate-900 text-lg sm:text-xl tabular-nums whitespace-nowrap">
                          {entry.total_points}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-right text-emerald-600 font-bold tabular-nums whitespace-nowrap max-sm:hidden sm:table-cell">
                          {entry.exact_results}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-right text-slate-500 font-semibold tabular-nums whitespace-nowrap max-sm:hidden sm:table-cell">
                          {entry.partial_score_hits}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-center w-full max-w-md mx-auto sm:max-w-none">
            <button
              type="button"
              onClick={() => setModal('points')}
              className="w-full sm:flex-1 sm:min-w-[10rem] sm:max-w-xs px-4 py-3.5 rounded-xl text-base font-semibold text-slate-800 bg-white/95 shadow-lg border border-slate-200/90 backdrop-blur-md hover:bg-white hover:border-teal-300 hover:text-teal-800 transition-colors"
            >
              Sistema de puntos
            </button>
            <button
              type="button"
              onClick={() => setModal('tiebreak')}
              className="w-full sm:flex-1 sm:min-w-[10rem] sm:max-w-xs px-4 py-3.5 rounded-xl text-base font-semibold text-slate-800 bg-white/95 shadow-lg border border-slate-200/90 backdrop-blur-md hover:bg-white hover:border-teal-300 hover:text-teal-800 transition-colors"
            >
              Criterios de desempate
            </button>
          </div>

          {modal === 'points' && (
            <InfoModal title="Sistema de puntos" onClose={() => setModal(null)}>
              <PointsSystemContent />
            </InfoModal>
          )}
          {modal === 'tiebreak' && (
            <InfoModal title="Criterios de desempate" onClose={() => setModal(null)}>
              <TiebreakContent />
            </InfoModal>
          )}
        </div>
      </div>
    </div>
  )
}
