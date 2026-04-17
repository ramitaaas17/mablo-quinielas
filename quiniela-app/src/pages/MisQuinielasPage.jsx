import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, StatCard, QuinielaCard, SectionHeader, CardSkeleton } from "../components";
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

export default function MisQuinielasPage() {
  const navigate = useNavigate();
  const { getCache, setCache } = useStore();

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

      {/* Hero */}
      <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden animate-fade-in">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[200%] sm:w-[1400px] h-[300px] sm:h-[280px] rounded-b-[40%] sm:rounded-b-[420px] pointer-events-none animate-breathe"
          style={{ backgroundImage: "var(--hero-blob-img)", opacity: 0.5 }}
        />
        <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] pt-8 lg:pt-[44px] pb-10">
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

          <div className="flex gap-3 sm:gap-4 mt-6 flex-wrap">
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
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-[#e4e4e0] bg-[#fafaf8]">
                  {["Quiniela", "Entrada", "Puntos", "Cierre", "Estado"].map((h) => (
                    <div
                      key={h}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]"
                      style={{ fontFamily: font }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {/* Rows — staggered */}
                {resolvedQ.map((q, i) => (
                  <div
                    key={q.id_quiniela}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-b border-[#e4e4e0] last:border-b-0 py-3 transition-colors hover:bg-[#fafaf8] animate-fade-in"
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
                        Resuelta
                      </span>
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
