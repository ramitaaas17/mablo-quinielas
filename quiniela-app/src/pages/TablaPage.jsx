import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar, MASCOT_TABLE, PrediccionesView } from "../components";
import { Avatar } from "./PerfilPage";
import { useStore } from "../store";
import { quinielaService } from "../services/quinielaService";
import { prediccionService } from "../services/quinielaService";

const font = "Nunito, sans-serif";


function formatFecha(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatPozo(n) {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

export default function TablaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("predicciones");
  const { setPrediccionesQuiniela } = useStore();

  const queryParams = new URLSearchParams(location.search);
  const quinielaId = location.state?.quinielaId || queryParams.get("quinielaId");

  const [quiniela, setQuiniela] = useState(null);
  const [posiciones, setPosiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estadoPago, setEstadoPago] = useState("sin_pago");

  useEffect(() => {
    let mounted = true;

    async function cargar() {
      try {
        let q;
        if (quinielaId) {
          q = await quinielaService.getDetalle(quinielaId);
        } else {
          // Cargar la primera quiniela activa
          const activas = await quinielaService.getActivas();
          if (!activas.length) {
            setError("No hay quinielas disponibles.");
            setLoading(false);
            return;
          }
          q = await quinielaService.getDetalle(activas[0].id);
        }

        if (!mounted) return;

        // Formatear quiniela para el componente
        const quinielaFormatted = {
          id: q.id,
          title: q.nombre,
          league: q.liga_nombre,
          status: q.estado,
          imagen_fondo: q.imagen_fondo,
          pozo: formatPozo(q.pozo_acumulado),
          cierre: formatFecha(q.cierre),
          cierreIso: q.cierre,
          partidos: String(q.partidos?.length || 0),
          matches: (q.partidos || []).filter(p => !p.cancelado).map((p, idx) => ({
            id: p.id,
            local: p.local_nombre,
            visitante: p.visitante_nombre,
            fecha: formatFecha(p.inicio),
            inicio: p.inicio,
            ptos_local: p.ptos_local,
            ptos_visitante: p.ptos_visitante,
          })),
        };
        setQuiniela(quinielaFormatted);

        // Cargar posiciones
        const pos = await quinielaService.getPosiciones(q.id).catch(() => []);
        if (mounted) setPosiciones(pos);

        // Cargar estado
        try {
          const miSt = await quinielaService.miEstado(q.id);
          if (mounted && miSt.inscrito) setEstadoPago(miSt.estado_pago || "sin_pago");
        } catch { /* no inscrito */ }

        // Cargar predicciones
        const preds = await prediccionService.getMisPredicciones(q.id).catch(() => []);
        setPrediccionesQuiniela(q.id, preds);


      } catch (e) {
        if (mounted) setError("No se pudo cargar la quiniela.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    cargar();
    return () => { mounted = false; };
  }, [quinielaId]);

  // Poll payment status every 20s while pending so it auto-updates when admin confirms
  useEffect(() => {
    if (estadoPago !== "pendiente" || !quiniela) return;
    const interval = setInterval(async () => {
      try {
        const miSt = await quinielaService.miEstado(quiniela.id);
        if (miSt.inscrito) setEstadoPago(miSt.estado_pago || "sin_pago");
      } catch { /* ignore */ }
    }, 20000);
    return () => clearInterval(interval);
  }, [estadoPago, quiniela]);

  const [joining, setJoining] = useState(false);

  const handleSolicitarUnirme = async () => {
    if (!quiniela) return;
    setJoining(true);
    try {
      await quinielaService.unirseDirecto(quiniela.id);
      setEstadoPago("pendiente");
    } catch (err) {
      alert(err?.response?.data?.error || "Error al solicitar unirse.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col">
        <Navbar variant="app" showWeek />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-9 h-9 rounded-full border-[3px] border-[#e4e4e0] border-t-[#3dbb78] animate-spinner" />
          <p className="text-[13px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
            Cargando quiniela...
          </p>
        </div>
      </div>
    );
  }

  if (error || !quiniela) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col">
        <Navbar variant="app" showWeek />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[14px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>{error || "Quiniela no encontrada."}</p>
          <button onClick={() => navigate("/")} className="h-10 px-6 rounded-full bg-[#1a1a1a] text-white text-[13px] font-extrabold" style={{ fontFamily: font }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const numPartidos = quiniela.matches?.length || 0;

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="app" showWeek />

      <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden animate-fade-in">
        {quiniela.imagen_fondo ? (
          <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-full md:w-[60%] lg:w-[50%] pointer-events-none" style={{
             maskImage: 'linear-gradient(to right, transparent, black 35%, black 100%)',
             WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%, black 100%)'
          }}>
            <img
              src={quiniela.imagen_fondo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <img
            src={MASCOT_TABLE}
            alt=""
            loading="lazy"
            decoding="async"
            className="hidden sm:block absolute right-0 bottom-0 h-full object-contain object-right pointer-events-none"
          />
        )}

        <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] py-14 lg:py-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors mb-6 animate-fade-in"
            style={{ fontFamily: font }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Volver
          </button>
          <h1 className="text-[26px] md:text-[30px] font-black text-[#1a1a1a] tracking-[-1px] animate-fade-in-up" style={{ fontFamily: font }}>
            {quiniela.title}
          </h1>
          <p className="text-[12px] md:text-[13px] font-semibold text-[#6b6b6b] mt-1" style={{ fontFamily: font }}>
            {quiniela.league} · Cierra el {quiniela.cierre}
          </p>
          <div className="flex gap-3 mt-5 overflow-x-auto pb-2">
            {[
              ["Pozo", quiniela.pozo],
              ["Jugadores", posiciones.length ? String(posiciones.length) : "—"],
              ["Partidos", quiniela.partidos],
            ].map(([l, v], i) => (
              <div key={l} className="bg-[#f2f2ef] rounded-[14px] px-5 py-3 min-w-[90px] flex-shrink-0 animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]" style={{ fontFamily: font }}>{l}</div>
                <div className="text-[18px] md:text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px] mt-1" style={{ fontFamily: font }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-10 lg:px-[90px] xl:px-[130px] py-8 flex flex-col lg:flex-row gap-8 min-h-[500px]">
        {tab === "predicciones" ? (
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTab("predicciones")}
                className={`text-[12px] md:text-[13px] font-bold px-4 h-9 rounded-full transition-all ${tab === "predicciones" ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a]"}`}
                style={{ fontFamily: font }}
              >
                Mis predicciones
              </button>
              <button
                onClick={() => setTab("posiciones")}
                className={`text-[12px] md:text-[13px] font-bold px-4 h-9 rounded-full transition-all ${tab === "posiciones" ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a]"}`}
                style={{ fontFamily: font }}
              >
                Posiciones
              </button>
            </div>

            <PrediccionesView quiniela={quiniela} isPending={estadoPago === "pendiente"} isSinPago={estadoPago === "sin_pago"} onSolicitarUnirme={handleSolicitarUnirme} isJoining={joining} />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTab("predicciones")}
                  className={`text-[12px] md:text-[13px] font-bold px-4 h-9 rounded-full transition-all ${tab === "predicciones" ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a]"}`}
                  style={{ fontFamily: font }}
                >
                  Mis predicciones
                </button>
                <button
                  onClick={() => setTab("posiciones")}
                  className={`text-[12px] md:text-[13px] font-bold px-4 h-9 rounded-full transition-all ${tab === "posiciones" ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a]"}`}
                  style={{ fontFamily: font }}
                >
                  Posiciones
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap" style={{ fontFamily: font }}>
                  Tabla de posiciones
                </span>
                <div className="flex-1 h-px bg-[#e4e4e0]" />
              </div>

              <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-[50px_1fr_100px_1fr] md:grid-cols-[65px_1fr_120px_1fr] border-b border-[#e4e4e0] bg-[#fafaf8]">
                    {["#", "Jugador", "Aciertos", "Progreso"].map((h) => (
                      <div key={h} className="px-4 py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {posiciones.length === 0 && (
                    <div className="px-4 py-8 text-center text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                      Sin posiciones aún.
                    </div>
                  )}

                  {posiciones.map((p, rowIdx) => {
                    const posColors = ["#f4a030", "#6b6b6b", "#b87333"];
                    const color = posColors[p.pos - 1] || "#1a1a1a";
                    const pct = numPartidos > 0 ? (p.puntos_total / numPartidos) * 100 : 0;
                    return (
                      <div
                        key={p.id_usr}
                        className="grid grid-cols-[50px_1fr_100px_1fr] md:grid-cols-[65px_1fr_120px_1fr] items-center border-b border-[#e4e4e0] last:border-b-0 py-3 transition-colors hover:bg-[#fafaf8] animate-fade-in"
                        style={{ animationDelay: `${rowIdx * 40 + 100}ms` }}
                      >
                        <div className="px-4 text-[14px] font-black" style={{ fontFamily: font, color }}>
                          {p.pos}
                        </div>
                        <div className="flex items-center gap-3 px-2">
                          <Avatar foto={p.foto_perfil} iniciales={p.initials} size={28} border={2} fontSize={10} />
                          <span className="text-[13px] md:text-[14px] text-[#1a1a1a]" style={{ fontFamily: font }}>
                            {p.nombre}
                          </span>
                        </div>
                        <div className="px-4 flex items-baseline gap-1">
                          <span className="text-[16px] md:text-[18px] font-black text-[#1a1a1a] tracking-[-0.5px]" style={{ fontFamily: font }}>{p.puntos_total}</span>
                          <span className="text-[10px] md:text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>/ {numPartidos}</span>
                        </div>
                        <div className="px-4 pr-6">
                          <div className="h-[6px] bg-[#f2f2ef] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3dbb78] rounded-full animate-bar-fill"
                              style={{
                                "--bar-target-w": `${pct}%`,
                                animationDelay: `${(p.pos - 1) * 50 + 200}ms`,
                                animationFillMode: "both",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden">
                <div className="border-b border-[#e4e4e0] px-5 py-4 bg-[#fafaf8]">
                  <span className="text-[13px] font-extrabold text-[#1a1a1a]" style={{ fontFamily: font }}>Detalles</span>
                </div>
                <div className="p-5 flex flex-col">
                  <div className="w-full flex flex-col divide-y divide-[#e4e4e0]">
                    {[
                      { label: "Pozo acumulado", value: quiniela.pozo, valueColor: "#1a1a1a" },
                      { label: "Cierre",          value: quiniela.cierre, valueColor: "#ea4335" },
                      { label: "Participantes",   value: posiciones.length || "—", valueColor: "#1a1a1a" },
                      { label: "Partidos",         value: quiniela.partidos, valueColor: "#1a1a1a" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between py-3">
                        <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>{r.label}</span>
                        <span className="text-[13px] font-extrabold" style={{ fontFamily: font, color: r.valueColor }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
