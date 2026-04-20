import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, StatCard, QuinielaCard, SectionHeader, CardSkeleton, MASCOT_DASHBOARD } from "../components";
import { authService } from "../services/authService";
import { useStore } from "../store";

const font = "Nunito, sans-serif";

function formatPozo(n) {
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
}

function formatFecha(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function SkeletonGrid({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

// ─── Modal de resultados de una quiniela ──────────────────────────────────────
function ResultadosModal({ idQuiniela, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authService.misResultadosQuiniela(idQuiniela)
      .then(setData)
      .catch(() => setError("No se pudieron cargar los resultados."))
      .finally(() => setLoading(false));
  }, [idQuiniela]);

  const selColor = (sel) => {
    if (sel === "Local")     return { bg: "var(--green-pale)", text: "var(--green-dk)" };
    if (sel === "Visitante") return { bg: "var(--orange-pale)", text: "var(--orange-text)" };
    if (sel === "Empate")    return { bg: "var(--surface-2)", text: "var(--text-2)" };
    return null;
  };

  const resultBadge = (correcto, sel) => {
    if (correcto === true)  return { bg: "var(--green-pale)", text: "var(--green-dk)" };
    if (correcto === false) return { bg: "var(--red-pale)", text: "var(--red)" };
    return selColor(sel) || { bg: "var(--surface-2)", text: "var(--text-2)" };
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 rounded-t-[20px] sm:rounded-[16px] shadow-2xl overflow-hidden w-full sm:w-auto sm:min-w-[560px] sm:max-w-[min(92vw,760px)] max-h-[92dvh] flex flex-col"
        style={{ backgroundColor: "var(--surface)", fontFamily: font }}
      >
        {/* Header */}
        {loading ? (
          <div className="px-6 py-8 text-center text-[13px] text-[#6b6b6b]">Cargando resultados...</div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-[13px] text-[#b91c1c]">{error}</div>
        ) : data ? (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-[#e4e4e0] flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#3dbb78]">Mis resultados</p>
                  <h2 className="text-[18px] font-black text-[#1a1a1a] tracking-[-0.5px] leading-tight mt-0.5">{data.nombre}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#f2f2ef] hover:bg-[#e4e4e0] flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Stats row */}
              <div className="flex gap-3 mt-3 flex-wrap">
                {[
                  { label: "Mis puntos", value: String(data.mis_puntos ?? 0) },
                  { label: "Posición",   value: data.mi_posicion ? `#${data.mi_posicion}` : "—" },
                  { label: "Jugadores",  value: String(data.total_jugadores) },
                  { label: "Bolsa",      value: formatPozo(data.pozo_acumulado) },
                ].map(s => (
                  <div key={s.label} className="flex flex-col bg-[#f2f2ef] rounded-[10px] px-3 py-2 min-w-[70px]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]">{s.label}</span>
                    <span className="text-[16px] font-black text-[#1a1a1a] tracking-tight leading-tight">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Partidos list */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-2">
              {(data.partidos || []).map((p, i) => {
                const miSel = p.mi_seleccion?.[0] || null;
                const miSel2 = p.mi_seleccion?.[1] || null;
                const rb = resultBadge(p.es_correcta, miSel);
                const hasMarca = p.ptos_local !== null && p.ptos_visitante !== null;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 rounded-[12px] px-4 py-3 border ${
                      p.cancelado ? "border-[#e4e4e0] opacity-50" :
                      p.es_correcta === true ? "border-[#bbf7d0] bg-[#f0fdf4]" :
                      p.es_correcta === false ? "border-[#fca5a5] bg-[#fff1f2]" :
                      "border-[#e4e4e0]"
                    }`}
                  >
                    {/* Number */}
                    <span className="w-5 h-5 rounded-full bg-[#f2f2ef] flex items-center justify-center text-[9px] font-black text-[#6b6b6b] flex-shrink-0">
                      {i + 1}
                    </span>

                    {/* Teams + score */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#1a1a1a] truncate">
                        {p.local_nombre} <span className="text-[#6b6b6b] font-medium">vs</span> {p.visitante_nombre}
                      </div>
                      {hasMarca && !p.cancelado && (
                        <div className="text-[11px] font-extrabold text-[#25854f] mt-0.5">
                          {p.ptos_local}–{p.ptos_visitante} · <span className="text-[#6b6b6b] font-semibold">{p.resultado}</span>
                        </div>
                      )}
                      {p.cancelado && (
                        <div className="text-[11px] font-bold text-[#b91c1c]">Cancelado</div>
                      )}
                    </div>

                    {/* My pick(s) */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {miSel ? (
                        <>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                            style={{ background: rb.bg, color: rb.text }}
                          >
                            {miSel === "Local" ? "L" : miSel === "Visitante" ? "V" : "E"}
                          </span>
                          {miSel2 && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                              style={selColor(miSel2) ? { background: selColor(miSel2).bg, color: selColor(miSel2).text } : {}}
                            >
                              {miSel2 === "Local" ? "L" : miSel2 === "Visitante" ? "V" : "E"}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-[#aaa]">—</span>
                      )}

                      {/* Result icon */}
                      {hasMarca && !p.cancelado && miSel && (
                        <span className="ml-1">
                          {p.es_correcta === true ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-dk)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : p.es_correcta === false ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer legend */}
            <div className="px-5 py-3 border-t border-[#e4e4e0] flex items-center gap-4 flex-shrink-0 bg-[#fafaf8]">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                {[
                  { bg: "var(--green-pale)", text: "var(--green-dk)", label: "Correcto" },
                  { bg: "var(--red-pale)",   text: "var(--red)",      label: "Incorrecto" },
                  { bg: "var(--surface-2)",  text: "var(--text-2)",   label: "Sin resultado" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: l.bg }} />
                    <span className="text-[10px] font-semibold text-[#6b6b6b]">{l.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="h-8 px-4 rounded-full bg-[#1a1a1a] text-white text-[12px] font-extrabold hover:bg-[#333] transition-colors flex-shrink-0"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function MisQuinielasPage() {
  const navigate = useNavigate();
  const { getCache, setCache } = useStore();
  const [resultadosId, setResultadosId] = useState(null);

  const cached = getCache("mis-quinielas");
  const [misQuinielas, setMisQuinielas] = useState(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    authService
      .misQuinielas()
      .then((data) => {
        if (mounted) {
          setMisQuinielas(data);
          setCache("mis-quinielas", data);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const activeQ = misQuinielas.filter((q) => q.estado === "abierta");
  const resolvedQ = misQuinielas.filter((q) => q.estado !== "abierta");
  const ganadas = resolvedQ.filter((q) => q.puntos > 0).length;
  const mejorPosicion = misQuinielas.length > 0 ? "#1" : "—";

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="app" showWeek />

      {resultadosId && (
        <ResultadosModal
          idQuiniela={resultadosId}
          onClose={() => setResultadosId(null)}
        />
      )}

      {/* Hero */}
      <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden animate-fade-in">
        <img
          src={MASCOT_DASHBOARD}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "var(--hero-fade-r)" }}
        />
        <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] pt-8 lg:pt-14 pb-10 xl:pb-14">
          <h1
            className="text-[28px] sm:text-[34px] font-black text-[#1a1a1a] tracking-[-1px] animate-fade-in-up"
            style={{ fontFamily: font }}
          >
            Mis quinielas
          </h1>
          <p
            className="text-[13px] sm:text-[14px] font-medium text-[#6b6b6b] mt-1 animate-fade-in"
            style={{ fontFamily: font, animationDelay: "0.1s" }}
          >
            Historial y estado de todas tus participaciones.
          </p>

          <div className="flex gap-3 sm:gap-4 mt-8 flex-wrap lg:pr-64">
            {[
              { label: "Participaciones", value: String(misQuinielas.length), sub: "en total" },
              { label: "Activas",          value: String(activeQ.length),     sub: "ahora mismo" },
              { label: "Con aciertos",     value: String(ganadas),            sub: "quinielas" },
              { label: "Mejor posición",   value: mejorPosicion,             sub: "" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex-1 min-w-[110px] sm:min-w-[150px] animate-fade-in-up"
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <StatCard label={s.label} value={s.value} sub={s.sub} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-10 lg:px-[90px] xl:px-[130px] py-8 flex flex-col gap-10">

        {loading && <SkeletonGrid count={3} />}

        {!loading && misQuinielas.length === 0 && (
          <div className="text-center py-16 animate-scale-in">
            <p className="text-[16px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
              Aún no te has inscrito en ninguna quiniela.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 h-10 px-6 rounded-full bg-[#1a1a1a] text-white text-[13px] font-extrabold hover:bg-[#333] hover:shadow-lg transition-all active:scale-95"
              style={{ fontFamily: font }}
            >
              Ver quinielas disponibles
            </button>
          </div>
        )}

        {/* Active */}
        {!loading && activeQ.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <SectionHeader title="En curso" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeQ.map((q, i) => (
                <div
                  key={q.id_quiniela}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <QuinielaCard
                    title={q.nombre}
                    league="Liga MX"
                    status={q.estado}
                    pozo={formatPozo(q.pozo_acumulado)}
                    pague={formatPozo(q.precio_entrada)}
                    posicion="—"
                    misPoints={`${q.puntos} pts`}
                    accentColor="green"
                    buttonLabel="Ver detalles"
                    onButtonClick={() => navigate("/tabla", { state: { quinielaId: q.id_quiniela } })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History table */}
        {!loading && resolvedQ.length > 0 && (
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${activeQ.length * 80 + 80}ms` }}
          >
            <SectionHeader title="Historial" />
            <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] border-b border-[#e4e4e0] bg-[#fafaf8]">
                  {["Quiniela", "Entrada", "Puntos", "Cierre", "Estado", ""].map((h) => (
                    <div
                      key={h}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]"
                      style={{ fontFamily: font }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {resolvedQ.map((q, i) => (
                  <div
                    key={q.id_quiniela}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center border-b border-[#e4e4e0] last:border-b-0 py-3 transition-colors hover:bg-[#fafaf8] animate-fade-in"
                    style={{ animationDelay: `${activeQ.length * 80 + 120 + i * 40}ms` }}
                  >
                    <div className="px-4 text-[14px] font-semibold text-[#1a1a1a]" style={{ fontFamily: font }}>
                      {q.nombre}
                    </div>
                    <div className="px-4 text-[13px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
                      {formatPozo(q.precio_entrada)}
                    </div>
                    <div className="px-4 text-[14px] font-bold text-[#1a1a1a]" style={{ fontFamily: font }}>
                      {q.puntos}
                    </div>
                    <div className="px-4 text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                      {formatFecha(q.cierre)}
                    </div>
                    <div className="px-4">
                      <span
                        className="bg-[#f2f2ef] text-[#6b6b6b] text-[11px] font-extrabold px-3 h-[23px] rounded-full inline-flex items-center"
                        style={{ fontFamily: font }}
                      >
                        {q.estado === "resuelta" ? "Resuelta" : "Cerrada"}
                      </span>
                    </div>
                    <div className="px-4">
                      <button
                        onClick={() => setResultadosId(q.id_quiniela)}
                        className="h-7 px-3 rounded-full border border-[#e4e4e0] text-[11px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors whitespace-nowrap"
                        style={{ fontFamily: font }}
                      >
                        Ver resultados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
