import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout, TopBar, SectionHeader, Modal, IconWarning } from "../../components/admin/index.jsx";
import { adminService } from "../../services/quinielaService";

const font = "Nunito, sans-serif";
const posColor = ["#f4a030", "#6b6b6b", "#b87333", "#1a1a1a"];

function tipoResultado(p) {
  if (p.ptos_local === null || p.ptos_visitante === null) return null;
  if (p.ptos_local > p.ptos_visitante) return "Local";
  if (p.ptos_local < p.ptos_visitante) return "Visitante";
  return "Empate";
}

const tipoColor = {
  "Local":     { bg: "#d6f5e8", text: "#25854f" },
  "Visitante": { bg: "#fde8d8", text: "#a05a00" },
  "Empate":    { bg: "#f2f2ef", text: "#6b6b6b" },
};

function estadoPartido(p) {
  if (p.cancelado) return "cancelado";
  const inicio = new Date(p.inicio);
  const ahora  = new Date();
  const diff   = (ahora - inicio) / 1000 / 60; // minutos desde el inicio
  if (diff < 0)   return "pendiente";
  if (diff < 115) return "en_vivo";
  return "finalizado";
}

export default function AdminResultados({ onNavigate }) {
  const [quinielas,         setQuinielas]         = useState([]);
  const [quinielaId,        setQuinielaId]        = useState("");
  const [quiniela,          setQuiniela]          = useState(null);
  const [posiciones,        setPosiciones]        = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [lastUpdate,        setLastUpdate]        = useState(null);
  const [resolverModal,     setResolverModal]     = useState(false);
  const [resolverLoading,   setResolverLoading]   = useState(false);
  const [resolverResult,    setResolverResult]    = useState(null);
  const [predsModal,        setPredsModal]        = useState(false);
  const [predsData,         setPredsData]         = useState([]);
  const [predsLoading,      setPredsLoading]      = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    adminService.getQuinielas().then(qs => {
      setQuinielas(qs);
      if (qs.length > 0) setQuinielaId(qs[0].id);
    }).catch(() => {});
  }, []);

  const cargar = useCallback(async (silent = false) => {
    if (!quinielaId) return;
    if (!silent) setLoading(true);
    try {
      const [q, pos] = await Promise.all([
        adminService.getQuiniela(quinielaId),
        adminService.getParticipantes(quinielaId).catch(() => []),
      ]);
      setQuiniela(q);
      const posOrdenadas = [...(pos || [])].sort((a, b) => b.puntos - a.puntos).map((p, i) => ({
        ...p, pos: i + 1,
      }));
      setPosiciones(posOrdenadas);
      setLastUpdate(new Date());
    } catch { }
    if (!silent) setLoading(false);
  }, [quinielaId]);

  // Carga inicial y polling cada 60s
  useEffect(() => {
    cargar();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => cargar(true), 60_000);
    return () => clearInterval(intervalRef.current);
  }, [cargar]);

  const handleResolver = async () => {
    setResolverLoading(true);
    try {
      const res = await adminService.resolverQuiniela(quinielaId);
      setResolverResult(res);
      cargar();
    } catch (err) {
      setResolverResult({ error: err?.response?.data?.error || "Error al resolver." });
    }
    setResolverLoading(false);
  };

  const handleCancelarPartido = async (id_partido) => {
    try {
      await adminService.cancelarPartido(id_partido);
      cargar();
    } catch { }
  };

  const handleDescancelarPartido = async (id_partido) => {
    try {
      await adminService.descancelarPartido(id_partido);
      cargar();
    } catch { }
  };

  const abrirPredicciones = async () => {
    setPredsModal(true);
    setPredsLoading(true);
    try {
      const data = await adminService.getPredicciones(quinielaId);
      setPredsData(data);
    } catch { setPredsData([]); }
    setPredsLoading(false);
  };

  const todosConResultado = quiniela?.partidos?.filter(p => !p.cancelado).every(p =>
    p.ptos_local !== null && p.ptos_visitante !== null
  );

  const fmtTime = (d) => d?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <AdminLayout active="resultados" onNavigate={onNavigate}>
      <TopBar title="Resultados">
        {quiniela && (
          <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full bg-[#f2f2ef] text-[#6b6b6b]" style={{ fontFamily: font }}>
            {quiniela.estado}
          </span>
        )}
        {lastUpdate && (
          <span className="text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
            Actualizado {fmtTime(lastUpdate)}
          </span>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5">
        {/* Selector de quiniela */}
        {quinielas.length > 1 && (
          <div className="mb-4">
            <select
              value={quinielaId}
              onChange={e => setQuinielaId(e.target.value)}
              className="bg-white border border-[#e4e4e0] rounded-[8px] h-9 px-3 text-[13px] text-[#1a1a1a] outline-none"
              style={{ fontFamily: font }}
            >
              {quinielas.map(q => (
                <option key={q.id} value={q.id}>{q.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {loading && <p className="text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Cargando...</p>}

        {!loading && quiniela && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_252px] gap-[18px]">
            {/* Left */}
            <div className="flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-[22px] font-black text-[#1a1a1a] tracking-[-1px]" style={{ fontFamily: font }}>
                    {quiniela.nombre}
                  </h2>
                  <p className="text-[13px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
                    {(quiniela.partidos || []).filter(p => !p.cancelado).length} partidos · {posiciones.length} jugadores · Pozo ${(quiniela.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={abrirPredicciones}
                    className="h-9 px-5 rounded-full border border-[#e4e4e0] text-[#1a1a1a] text-[12px] font-extrabold hover:bg-[#f2f2ef] transition-colors"
                    style={{ fontFamily: font }}
                  >
                    Ver predicciones
                  </button>
                  {quiniela.estado !== 'resuelta' && (
                    <button
                      onClick={() => setResolverModal(true)}
                      disabled={!todosConResultado}
                      className="h-9 px-5 rounded-full bg-[#1a1a1a] text-white text-[12px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-40"
                      style={{ fontFamily: font }}
                      title={!todosConResultado ? "Esperando que todos los partidos terminen" : ""}
                    >
                      Resolver quiniela
                    </button>
                  )}
                </div>
              </div>

              {/* Aviso de actualización automática */}
              <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-4 py-2.5" style={{ fontFamily: font }}>
                <span className="inline-block w-2 h-2 rounded-full bg-[#3dbb78] animate-pulse flex-shrink-0" />
                <span className="text-[12px] font-semibold text-[#25854f]">
                  Los marcadores se actualizan automáticamente cada 60 segundos desde datos reales de Liga MX.
                </span>
              </div>

              {/* Tabla de partidos — solo lectura */}
              <div>
                <SectionHeader title="Partidos y marcadores en vivo" />
                <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                <div className="grid grid-cols-[28px_1fr_130px_1fr_100px] gap-2 px-3 mb-2" style={{ fontFamily: font }}>
                  <div />
                  <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b] text-right">Local</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b] text-center">Marcador</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]">Visitante</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b] text-right">Estado</div>
                </div>

                <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden">
                  {(quiniela.partidos || []).map((p, i) => {
                    const tipo  = tipoResultado(p);
                    const tc    = tipo ? tipoColor[tipo] : null;
                    const est   = estadoPartido(p);
                    return (
                      <div
                        key={p.id}
                        className={`grid grid-cols-[28px_1fr_130px_1fr_100px] gap-2 items-center px-3 py-3 border-b border-[#e4e4e0] last:border-b-0 ${p.cancelado ? "opacity-40" : ""}`}
                        style={{ fontFamily: font }}
                      >
                        {/* Núm */}
                        <div className="w-[24px] h-[24px] bg-[#f2f2ef] rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-black text-[#6b6b6b]">{i + 1}</span>
                        </div>

                        {/* Local */}
                        <div className="text-[14px] font-semibold text-[#1a1a1a] text-right truncate">{p.local_nombre}</div>

                        {/* Marcador (solo lectura) */}
                        <div className="flex items-center justify-center">
                          {p.cancelado ? (
                            <div className="bg-[#fee2e2] rounded-[8px] px-3 py-1">
                              <span className="text-[13px] font-black text-[#b91c1c]">—</span>
                            </div>
                          ) : est === "en_vivo" && p.ptos_local !== null ? (
                            <div className="flex items-center gap-1.5 bg-[#fff3e0] border border-[#fed7aa] rounded-[8px] px-2.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f4a030] animate-pulse flex-shrink-0" />
                              <span className="text-[18px] font-black text-[#1a1a1a] tracking-[-0.5px]">
                                {p.ptos_local}-{p.ptos_visitante}
                              </span>
                            </div>
                          ) : p.ptos_local !== null ? (
                            <div className="bg-[#f2f2ef] rounded-[8px] px-2.5 py-1">
                              <span className="text-[18px] font-black text-[#1a1a1a] tracking-[-0.5px]">
                                {p.ptos_local}-{p.ptos_visitante}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#f2f2ef] rounded-[8px] px-2.5 py-1">
                              <span className="text-[13px] font-bold text-[#aaa]">- vs -</span>
                            </div>
                          )}
                        </div>

                        {/* Visitante */}
                        <div className="text-[14px] font-semibold text-[#1a1a1a] truncate">{p.visitante_nombre}</div>

                        {/* Estado */}
                        <div className="flex justify-end gap-1.5 items-center">
                          {p.cancelado ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#b91c1c]">Cancelado</span>
                              {quiniela.estado !== 'resuelta' && (
                                <button
                                  onClick={() => handleDescancelarPartido(p.id)}
                                  className="h-5 px-1.5 rounded-full border border-[#e4e4e0] text-[9px] font-extrabold text-[#6b6b6b] hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                                >
                                  Reactivar
                                </button>
                              )}
                            </div>
                          ) : est === "en_vivo" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#fff3e0] text-[#a05a00] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f4a030] animate-pulse inline-block" />
                              En vivo
                            </span>
                          ) : tc ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.text }}>{tipo}</span>
                          ) : est === "pendiente" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-[#6b6b6b]">Pendiente</span>
                              {quiniela.estado !== 'resuelta' && (
                                <button
                                  onClick={() => handleCancelarPartido(p.id)}
                                  className="h-5 px-1.5 rounded-full border border-[#e4e4e0] text-[9px] font-extrabold text-[#6b6b6b] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>{/* end min-w wrapper */}
                </div>{/* end overflow-x-auto */}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-3.5">
              {/* Tabla de posiciones */}
              <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden p-px" style={{ fontFamily: font }}>
                <div className="border-b border-[#e4e4e0] px-4 py-3">
                  <span className="text-[12px] font-extrabold text-[#1a1a1a]">Tabla de posiciones</span>
                </div>
                <div className="px-4 py-3 flex flex-col divide-y divide-[#e4e4e0]">
                  {posiciones.length === 0 && (
                    <span className="text-[12px] text-[#6b6b6b] py-2">Sin posiciones aún.</span>
                  )}
                  {posiciones.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center gap-2 py-2">
                      <span className="w-4 text-[12px] font-black text-center" style={{ color: posColor[Math.min(p.pos - 1, 3)] }}>{p.pos}</span>
                      <span className="flex-1 text-[12px] font-bold text-[#1a1a1a] truncate">{p.nombre}</span>
                      <span className="text-[13px] font-black text-[#1a1a1a]">{p.puntos}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden p-px" style={{ fontFamily: font }}>
                <div className="border-b border-[#e4e4e0] px-4 py-3">
                  <span className="text-[12px] font-extrabold text-[#1a1a1a]">Resumen financiero</span>
                </div>
                <div className="px-4 py-3 flex flex-col">
                  {[
                    ["Jugadores",            posiciones.length],
                    ["Total recaudado",      `$${(quiniela.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`],
                    ["Premio (tras comisión)", `$${((quiniela.pozo_acumulado || 0) * (1 - (quiniela.comision || 0) / 100)).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-center py-2 border-t border-[#e4e4e0] first:border-0">
                      <span className="text-[12px] font-bold text-[#6b6b6b]">{l}</span>
                      <span className="text-[13px] font-extrabold text-[#1a1a1a]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leyenda */}
              <div className="bg-[#f2f2ef] rounded-[12px] p-3.5" style={{ fontFamily: font }}>
                <p className="text-[11px] font-bold text-[#6b6b6b] mb-1">Actualización automática</p>
                <p className="text-[11px] text-[#6b6b6b]">
                  Los marcadores se obtienen de SofaScore cada 60s. El botón "Resolver" se activa automáticamente cuando todos los partidos tienen resultado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Confirmar resolver */}
      {resolverModal && !resolverResult && (
        <Modal onClose={() => setResolverModal(false)}>
          <div className="w-[380px] p-7" style={{ fontFamily: font }}>
            <div className="w-[42px] h-[42px] bg-[#fff3e0] rounded-[10px] flex items-center justify-center mb-5">
              <IconWarning size={20} color="#f4a030" />
            </div>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Resolver quiniela</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">
              Esta acción calculará el ganador con los marcadores actuales y marcará la quiniela como resuelta. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setResolverModal(false)}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleResolver} disabled={resolverLoading}
                className="flex-[1.5] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-60">
                {resolverLoading ? "Resolviendo..." : "Confirmar y resolver"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Predicciones */}
      {predsModal && (
        <Modal onClose={() => setPredsModal(false)}>
          <div className="w-[min(92vw,860px)] max-h-[80vh] flex flex-col" style={{ fontFamily: font }}>
            <div className="px-6 pt-6 pb-4 border-b border-[#e4e4e0] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[18px] font-black text-[#1a1a1a] tracking-[-0.5px]">Predicciones</h2>
                <p className="text-[12px] text-[#6b6b6b] mt-0.5">{quiniela?.nombre} · {predsData.length} participantes</p>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              {predsLoading ? (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#6b6b6b]">Cargando...</div>
              ) : predsData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#6b6b6b]">Sin predicciones registradas.</div>
              ) : (() => {
                const partidos = quiniela?.partidos || [];
                return (
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#fafaf8] sticky top-0">
                        <th className="text-left px-4 py-2.5 font-bold text-[#6b6b6b] border-b border-[#e4e4e0] min-w-[140px]">Jugador</th>
                        <th className="px-3 py-2.5 font-bold text-[#6b6b6b] border-b border-[#e4e4e0] text-center">Pts</th>
                        {partidos.map((p, i) => (
                          <th key={p.id} className="px-2 py-1.5 font-bold text-[#6b6b6b] border-b border-[#e4e4e0] text-center min-w-[70px]">
                            <div className="text-[9px] font-black uppercase tracking-[0.3px]">P{i + 1}</div>
                            <div className="text-[9px] font-semibold truncate max-w-[64px]">{p.local_nombre?.split(' ')[0]} v {p.visitante_nombre?.split(' ')[0]}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {predsData.map((usr, ri) => (
                        <tr key={usr.id_usr} className={ri % 2 === 0 ? "bg-white" : "bg-[#fafaf8]"}>
                          <td className="px-4 py-2.5 border-b border-[#e4e4e0]">
                            <div className="flex items-center gap-2">
                              <div className="w-[26px] h-[26px] rounded-full bg-[#f2f2ef] flex items-center justify-center text-[10px] font-black text-[#6b6b6b] flex-shrink-0">{usr.initials}</div>
                              <span className="font-bold text-[#1a1a1a] truncate">{usr.nombre}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-b border-[#e4e4e0] text-center">
                            <span className="font-black text-[#1a1a1a]">{usr.puntos ?? 0}</span>
                          </td>
                          {partidos.map((p) => {
                            const pred = usr.predicciones?.find(pr => pr.id_partido === String(p.id));
                            const sel = pred?.selecciones?.[0] || null;
                            const correcto = pred?.es_correcta;
                            const selColor = sel === "Local" ? { bg: "#d6f5e8", text: "#25854f" }
                              : sel === "Visitante" ? { bg: "#fde8d8", text: "#a05a00" }
                              : sel === "Empate" ? { bg: "#f2f2ef", text: "#6b6b6b" }
                              : null;
                            return (
                              <td key={p.id} className="px-2 py-2.5 border-b border-[#e4e4e0] text-center">
                                {sel ? (
                                  <span
                                    className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold"
                                    style={{
                                      background: correcto === true ? "#d6f5e8" : correcto === false ? "#fee2e2" : selColor?.bg,
                                      color: correcto === true ? "#25854f" : correcto === false ? "#b91c1c" : selColor?.text,
                                    }}
                                  >
                                    {sel === "Local" ? "L" : sel === "Visitante" ? "V" : "E"}
                                  </span>
                                ) : (
                                  <span className="text-[#ccc] text-[10px]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="px-6 py-4 border-t border-[#e4e4e0] flex items-center gap-4 flex-shrink-0 bg-[#fafaf8]">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                {[
                  { bg: "#d6f5e8", text: "#25854f", label: "Local (L)" },
                  { bg: "#fde8d8", text: "#a05a00", label: "Visitante (V)" },
                  { bg: "#f2f2ef", text: "#6b6b6b", label: "Empate (E)" },
                  { bg: "#fee2e2", text: "#b91c1c", label: "Incorrecto" },
                ].map(({ bg, text, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ background: bg }} />
                    <span className="text-[11px] font-semibold text-[#6b6b6b]">{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPredsModal(false)}
                className="h-9 px-5 rounded-full bg-[#1a1a1a] text-white text-[12px] font-extrabold hover:bg-[#333] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Resultado de resolución */}
      {resolverResult && (
        <Modal onClose={() => { setResolverResult(null); setResolverModal(false); }}>
          <div className="w-[400px] p-7" style={{ fontFamily: font }}>
            {resolverResult.error ? (
              <>
                <div className="w-[42px] h-[42px] bg-[#fee2e2] rounded-[10px] flex items-center justify-center mb-5">
                  <IconWarning size={20} color="#b91c1c" />
                </div>
                <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Error al resolver</h2>
                <p className="text-[13px] font-medium text-[#6b6b6b] mt-2">{resolverResult.error}</p>
              </>
            ) : (
              <>
                <div className="w-[42px] h-[42px] bg-[#d6f5e8] rounded-[10px] flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 1L13 7.5h6.5L14 12l2 6.5L10 15l-6 3.5 2-6.5L.5 7.5H7L10 1z" fill="#25854f" />
                  </svg>
                </div>
                <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">¡Quiniela resuelta!</h2>
                {resolverResult.hay_empate ? (
                  <p className="text-[13px] font-medium text-[#6b6b6b] mt-2">
                    Hubo empate. El pozo se acumula para la siguiente jornada.
                  </p>
                ) : resolverResult.ganador ? (
                  <div className="mt-4 bg-[#d6f5e8] rounded-[12px] p-4">
                    <div className="text-[14px] font-bold text-[#1a1a1a]">Ganador: {resolverResult.ganador.nombre}</div>
                    <div className="text-[12px] text-[#25854f] mt-0.5">
                      {resolverResult.ganador.puntos} aciertos · Premio: ${(resolverResult.premio || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <button
              onClick={() => { setResolverResult(null); setResolverModal(false); }}
              className="w-full mt-6 h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
