import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/leaderboard'
import { useAuth } from '../context/AuthContext'

function InfoModal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
      <div className="relative w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-200 z-10">
          <h2 id="info-modal-title" className="text-sm font-bold text-slate-800 uppercase tracking-widest">
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
      <span className={`shrink-0 font-black text-sm tabular-nums ${ptsClass}`}>{pts}</span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PointsSystemContent() {
  return (
    <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
      <p className="text-sm text-slate-600">
        En cada partido primero se calculan los <span className="font-semibold text-slate-800">puntos base</span>.
        En eliminatorias puedes sumar <span className="font-semibold text-slate-800">bonos extra</span>, pero solo
        si acertaste el resultado (3 o 5 pts base). Si fallas el resultado, el partido vale{' '}
        <span className="font-semibold">0 pts</span> en total.
      </p>

      {/* Paso 1 */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black">1</span>
          Puntos base (todos los partidos)
        </h3>
        <div className="space-y-2">
          <RuleRow
            pts="5 pts"
            ptsClass="text-emerald-600"
            title="Marcador exacto"
            desc="Aciertas los goles del local y del visitante tal como terminaron el partido."
          />
          <RuleRow
            pts="3 pts"
            ptsClass="text-amber-600"
            title="Resultado correcto (sin marcador exacto)"
            desc="Aciertas quién gana o si hay empate en el tiempo reglamentario, pero no el marcador completo."
          />
          <RuleRow
            pts="0 pts"
            ptsClass="text-slate-400"
            title="Resultado incorrecto"
            desc="No acertaste el desenlace del partido. No sumas bonos de eliminatoria."
          />
        </div>
      </section>

      {/* Paso 2 */}
      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black">2</span>
          Bono por fase (solo eliminatorias)
        </h3>
        <p className="mb-2 text-slate-600">
          Se suma <span className="font-semibold">encima</span> de los 3 o 5 pts base, según la ronda del partido:
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
          {[
            ['Dieciseisavos', '+1'],
            ['Octavos', '+2'],
            ['Cuartos', '+3'],
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
          <p className="text-xs font-semibold text-amber-900">Si el partido termina empatado y se define por penales</p>
          <p className="text-xs text-amber-900/90">
            El <span className="font-semibold">bono por fase</span> (tabla de arriba) solo se otorga si, además de
            acertar el empate en el marcador, pronosticaste correctamente{' '}
            <span className="font-semibold">qué equipo pasa por penales</span>.
          </p>
          <p className="text-xs text-amber-800/80">
            Si acertaste el ganador en tiempo reglamentario (marcador no empatado), el bono por fase se suma con normalidad.
          </p>
        </div>
      </section>

      {/* Paso 3 */}
      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black">3</span>
          Bono de alargue (solo eliminatorias)
        </h3>
        <RuleRow
          pts="+2 pts"
          ptsClass="text-teal-600"
          title="¿Hubo alargue?"
          desc="Al pronosticar debes indicar si crees que habrá alargue (Sí/No). Si coincide con lo que ocurrió en el partido real, sumas 2 pts extra. Es independiente del bono por fase, pero también requiere haber obtenido 3 o 5 pts base."
        />
      </section>

      {/* Ejemplos */}
      <section className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Ejemplos</h3>
        <div className="space-y-2">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Grupos — marcador exacto 2-1</p>
            <p className="text-xs text-slate-500">5 pts base · sin bonos de eliminatoria</p>
            <p className="text-sm font-black text-slate-800 mt-1">Total: 5 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Octavos — aciertas 1-0 (ganador correcto)</p>
            <p className="text-xs text-slate-500">3 pts base + 2 pts bono por fase (Octavos)</p>
            <p className="text-sm font-black text-slate-800 mt-1">Total: 5 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Final — marcador exacto 2-2, penales y alargue acertados</p>
            <p className="text-xs text-slate-500">5 pts base + 5 pts bono (Final) + 2 pts alargue</p>
            <p className="text-sm font-black text-slate-800 mt-1">Total: 12 pts</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Semifinal — pronosticaste 1-0 y salió 0-2</p>
            <p className="text-xs text-slate-500">Resultado incorrecto</p>
            <p className="text-sm font-black text-slate-800 mt-1">Total: 0 pts</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function TiebreakContent() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">
        Si dos o más jugadores empatan en puntos, se aplican en este orden:
      </p>
      <div className="flex flex-col gap-3">
        {[
          {
            n: '1°',
            title: 'Puntos totales',
            desc: 'Suma de todos los puntos, incluyendo bonos de eliminatorias y alargue.',
          },
          {
            n: '2°',
            title: 'Cantidad de resultados exactos',
            desc: 'Quien acertó más veces el marcador completo (goles de local y visitante). Los bonos no influyen en este conteo.',
          },
          {
            n: '3°',
            title: 'Cantidad de aciertos parciales',
            desc: 'A igual cantidad de exactos, gana quien tuvo más aciertos parciales: ganador correcto y al menos un marcador de equipo acertado, sin ser exacto en el partido.',
          },
        ].map(({ n, title, desc }) => (
          <div key={n} className="grid grid-cols-[2rem_1fr] gap-2 items-baseline">
            <span className="text-slate-400 font-black text-sm text-right">{n}</span>
            <div>
              <span className="text-slate-800 text-sm font-semibold">{title}</span>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
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
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/stadium.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1
            className="text-2xl font-black text-white mb-6 text-center drop-shadow-lg"
          >
            Tabla de Posiciones
          </h1>

          <div className="rounded-2xl overflow-x-auto bg-white/95 shadow-xl border border-slate-200/90 backdrop-blur-md w-fit max-w-full mx-auto">
            {entries.length === 0 ? (
              <div className="text-center py-12 px-8 text-slate-400">
                <p>Aún no hay puntuaciones</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm table-auto">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-bold w-0 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left font-bold whitespace-nowrap">Jugador</th>
                    <th className="px-4 py-3 text-right font-bold whitespace-nowrap">Pts</th>
                    <th className="px-4 py-3 text-right font-bold whitespace-nowrap">Exactos</th>
                    <th className="px-4 py-3 text-right font-bold whitespace-nowrap">Parciales</th>
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
                        <td className="px-4 py-3 font-bold text-slate-400 tabular-nums whitespace-nowrap">
                          {entry.rank}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={isMe ? 'text-teal-700 font-bold' : 'text-slate-800 font-medium'}>
                            {entry.username}
                            {isMe && <span className="ml-1 text-xs text-teal-600 font-semibold">(tú)</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 text-lg tabular-nums whitespace-nowrap">
                          {entry.total_points}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold tabular-nums whitespace-nowrap">
                          {entry.exact_results}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 font-semibold tabular-nums whitespace-nowrap">
                          {entry.partial_score_hits}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setModal('points')}
              className="flex-1 min-w-[10rem] max-w-xs px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 bg-white/95 shadow-lg border border-slate-200/90 backdrop-blur-md hover:bg-white hover:border-teal-300 hover:text-teal-800 transition-colors"
            >
              Sistema de puntos
            </button>
            <button
              type="button"
              onClick={() => setModal('tiebreak')}
              className="flex-1 min-w-[10rem] max-w-xs px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 bg-white/95 shadow-lg border border-slate-200/90 backdrop-blur-md hover:bg-white hover:border-teal-300 hover:text-teal-800 transition-colors"
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
