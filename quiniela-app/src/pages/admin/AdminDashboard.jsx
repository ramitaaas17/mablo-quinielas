import { useState, useEffect } from "react";
import {
  AdminLayout, TopBar, AdminStatCard, SectionHeader,
  MiniQuinielaCard, IconPlus,
} from "../../components/admin/index.jsx";
import { adminService } from "../../services/quinielaService";

const font = "Nunito, sans-serif";

const actionBadgeStyle = {
  "Predicción":        { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  "Pago enviado":      { bg: "var(--surface-2)",   text: "var(--blue-text)" },
  "Pago confirmado":   { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  "Nuevo usuario":     { bg: "var(--orange-pale)", text: "var(--orange-text)" },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [quinielas, setQuinielas] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminService.getStats().catch(() => null),
      adminService.getQuinielas().catch(() => []),
      adminService.getActividad().catch(() => []),
    ]).then(([s, q, a]) => {
      if (!mounted) return;
      setStats(s);
      setQuinielas(q.filter(x => x.estado === 'abierta').slice(0, 3));
      setActividad(a.slice(0, 8));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const s = stats || {};

  return (
    <AdminLayout active="dashboard" onNavigate={onNavigate}>
      <TopBar title="Dashboard" badge={quinielas.length > 0 ? quinielas[0]?.nombre : "—"} />

      {/* Content + Hero banner juntos en el scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div className="bg-white border-b border-[#e4e4e0] relative overflow-hidden px-4 md:px-7 pt-6 pb-6 animate-fade-in">
          {/* Blob — wrapper centers, inner breathes */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div
              className="w-[1400px] h-[260px] rounded-b-[415px] opacity-45 animate-breathe"
              style={{ backgroundImage: "var(--hero-blob-img)" }}
            />
          </div>
          <div className="relative z-10">
            <h1 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.6px] animate-fade-in-up" style={{ fontFamily: font }}>
              Panel de administración
            </h1>
            <p className="text-[12px] font-semibold text-[#6b6b6b] mt-0.5 animate-fade-in" style={{ fontFamily: font, animationDelay: "0.1s" }}>
              {loading ? "Cargando datos..." : `${s.quinielas_activas || 0} quinielas activas · ${s.total_usuarios || 0} participantes`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 mt-4">
              {[
                { label: "Bolsa total activa",  value: `$${(s.pozo_total || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, sub: "acumulado",    dark: true },
                { label: "Participantes",      value: String(s.total_usuarios || 0),    sub: "registrados" },
                { label: "Pagos confirmados",  value: String(s.pagos_confirmados || 0), sub: "esta semana",  accent: "#3dbb78" },
                { label: "Pagos pendientes",   value: String(s.pagos_pendientes || 0),  sub: "sin confirmar",accent: "#f4a030" },
                { label: "Quinielas activas",  value: String(s.quinielas_activas || 0), sub: "abiertas" },
              ].map((card, i) => (
                <div
                  key={card.label}
                  className={card.label === "Quinielas activas" ? "col-span-2 sm:col-span-1 animate-fade-in-up" : "animate-fade-in-up"}
                  style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                >
                  <AdminStatCard {...card} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="px-4 md:px-7 py-5">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_252px] gap-[18px]">
          {/* Left column */}
          <div className="flex flex-col gap-[18px]">
            {/* Quinielas activas */}
            <div>
              <SectionHeader
                title="Quinielas activas"
                action="Nueva"
                actionIcon={<IconPlus size={11} color="currentColor" />}
                onAction={() => onNavigate && onNavigate("quinielas")}
              />
              {quinielas.length === 0 && !loading && (
                <p className="text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Sin quinielas activas.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quinielas.map((q, i, arr) => {
                  const handleShareLink = async () => {
                    try {
                      const inv = await adminService.getCodigoInvitacion(q.id);
                      const url = `${window.location.origin}/unirse/${inv.codigo}`;
                      // Fallback para HTTP (localhost sin HTTPS)
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(url);
                      } else {
                        const ta = document.createElement("textarea");
                        ta.value = url;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.focus(); ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                      }
                      setToastMsg({ title: "Enlace copiado", text: url });
                      setTimeout(() => setToastMsg(null), 3500);
                    } catch (err) {
                      try {
                        const inv = await adminService.getCodigoInvitacion(q.id);
                        const url = `${window.location.origin}/unirse/${inv.codigo}`;
                        prompt("Copia este enlace manualmente:", url);
                      } catch {
                        setToastMsg({ title: "Error", text: "No se pudo generar el enlace.", isError: true });
                        setTimeout(() => setToastMsg(null), 3500);
                      }
                    }
                  };
                  return (
                  <div key={q.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                    <MiniQuinielaCard
                      title={q.nombre}
                      league={q.liga_nombre}
                      status={q.estado}
                      pozo={`$${(q.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                      pagados={`${q.pagos_confirmados || 0}/${q.num_jugadores || 0}`}
                      partidos={String(q.num_partidos || 0)}
                      cierre={q.cierre ? new Date(q.cierre).toLocaleDateString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : ""}
                      accentColor={["green", "orange", "pink"][i % 3]}
                      onVer={() => onNavigate && onNavigate("pagos")}
                      onShare={handleShareLink}
                    />
                  </div>
                );
                })}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="border border-[#e4e4e0] rounded-[14px] overflow-hidden" style={{ backgroundColor: "var(--surface)" }}>
              <div className="border-b border-[#e4e4e0] px-4 py-3">
                <span className="text-[12px] font-extrabold text-[#1a1a1a]" style={{ fontFamily: font }}>Actividad reciente</span>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]" style={{ fontFamily: font }}>
                <thead>
                  <tr className="border-b border-[#e4e4e0]">
                    {["Usuario", "Acción", "Quiniela", "Hora"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actividad.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-[12px] text-[#6b6b6b] text-center">Sin actividad reciente.</td></tr>
                  )}
                  {actividad.map((r, i) => {
                    const bs = actionBadgeStyle[r.tipo] || { bg: "var(--surface-2)", text: "var(--text-2)" };
                    return (
                      <tr
                        key={i}
                        className="border-b border-[#e4e4e0] last:border-b-0 animate-fade-in transition-colors"
                        style={{ cursor: "default" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}
                        style={{ animationDelay: `${i * 40 + 100}ms` }}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-[30px] h-[30px] rounded-full bg-[#d6f5e8] flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                              style={{ color: "var(--green-dk)", boxShadow: "0 0 0 1.5px var(--border)" }}>
                              {r.initials}
                            </div>
                            <span className="text-[12px] font-extrabold text-[#1a1a1a] whitespace-nowrap">{r.usuario}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full whitespace-nowrap"
                            style={{ background: bs.bg, color: bs.text }}>{r.tipo}</span>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-[#6b6b6b]">{r.quiniela || "—"}</td>
                        <td className="px-3 py-3 text-[12px] text-[#6b6b6b] whitespace-nowrap">{timeAgo(r.fecha)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>{/* end overflow-x-auto */}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3.5">
            {/* Resumen financiero */}
            <div className="border border-[#e4e4e0] rounded-[14px] overflow-hidden p-px" style={{ backgroundColor: "var(--surface)" }}>
              <div className="border-b border-[#e4e4e0] px-4 py-3">
                <span className="text-[12px] font-extrabold text-[#1a1a1a]" style={{ fontFamily: font }}>Resumen</span>
              </div>
              <div className="px-4 py-3 flex flex-col" style={{ fontFamily: font }}>
                {[
                  { l: "Usuarios", v: String(s.total_usuarios || 0) },
                  { l: "Pagos confirmados", v: String(s.pagos_confirmados || 0) },
                  { l: "Pagos pendientes", v: String(s.pagos_pendientes || 0), color: "var(--orange)" },
                  { l: "Quinielas activas", v: String(s.quinielas_activas || 0) },
                ].map(({ l, v, color }) => (
                  <div key={l} className="flex justify-between items-center py-2 border-b border-[#e4e4e0] last:border-0">
                    <span className="text-[12px] font-bold text-[#6b6b6b]">{l}</span>
                    <span className="text-[13px] font-extrabold" style={{ color: color || "#1a1a1a" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* end flex-1 overflow-y-auto */}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-[#1a1a1a] shadow-xl rounded-[18px] px-5 py-4 flex items-center gap-4 min-w-[300px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toastMsg.isError ? "bg-[#fee2e2]" : "bg-[#d6f5e8]"}`}>
               {toastMsg.isError ? (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
               ) : (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25854f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               )}
            </div>
            <div className="flex flex-col">
              <span className="text-white text-[14px] font-bold" style={{ fontFamily: font }}>{toastMsg.title}</span>
              <span className="text-[#a0a0a0] text-[12px] font-medium max-w-[250px] truncate" style={{ fontFamily: font }}>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="ml-auto text-[#6b6b6b] hover:text-white transition-colors p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
