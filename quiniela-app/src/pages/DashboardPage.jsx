import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, StatCard, QuinielaCard, SectionHeader, MASCOT_DASHBOARD } from "../components";
import { useStore } from "../store";
import { quinielaService } from "../services/quinielaService";
import { authService } from "../services/authService";

const font = "Nunito, sans-serif";

function formatPozo(n) {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function formatFecha(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mapQuiniela(q) {
  return {
    id: q.id,
    title: q.nombre,
    league: `${q.liga_nombre} · ${q.liga_pais || ""}`,
    status: q.estado,
    pozo: formatPozo(q.pozo_acumulado),
    entrada: formatPozo(q.precio_entrada),
    partidos: String(q.num_partidos),
    cierre: formatFecha(q.cierre),
    players: q.jugadores_initials || [],
    extraPlayers: q.jugadores_extra || 0,
    accentColor: "green",
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useStore();

  const [quinielas, setQuinielas] = useState([]);
  const [stats, setStats] = useState({ totalPoints: 0, position: "-", totalPlayers: 0, balance: 0, openCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function cargar() {
      try {
        const [qs, st] = await Promise.all([
          quinielaService.getActivas().catch(() => []),
          authService.stats().catch(() => null),
        ]);

        if (!mounted) return;

        setQuinielas(qs);

        const pozoTotal = qs.reduce((acc, q) => acc + (q.pozo_acumulado || 0), 0);
        setStats({
          totalPoints: st?.total_puntos || 0,
          position: st?.mejor_posicion ? `#${st.mejor_posicion}` : "-",
          totalPlayers: st?.total_jugadores || 0,
          balance: pozoTotal,
          openCount: qs.filter(q => q.estado === 'abierta').length,
        });
      } catch {
        // silencioso — estado vacío
      } finally {
        if (mounted) setLoading(false);
      }
    }

    cargar();
    return () => { mounted = false; };
  }, []);

  const openQuinielas = quinielas.filter(q => q.estado === 'abierta').map(mapQuiniela);
  const resolvedQuinielas = quinielas.filter(q => q.estado === 'resuelta').map(mapQuiniela);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="app" showWeek />

      {/* Hero Banner */}
      <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden">
        <img
          src={MASCOT_DASHBOARD}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0) 55%)" }}
        />

        <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] pt-8 lg:pt-14 pb-10 xl:pb-14">
          <h1 className="text-[28px] sm:text-[34px] font-black text-[#1a1a1a] tracking-[-1px]" style={{ fontFamily: font }}>
            Bolsa de quinielas
          </h1>
          <p className="text-[13px] sm:text-[14px] font-medium text-[#6b6b6b] mt-1" style={{ fontFamily: font }}>
            Elige una quiniela, predice los resultados y gana el pozo.
          </p>

          <div className="flex gap-3 sm:gap-4 mt-8 flex-wrap lg:pr-64">
            <StatCard label="Pozo total activo" value={formatPozo(stats.balance)} sub={`en ${stats.openCount} quinielas`} dark />
            <StatCard label="Quinielas abiertas" value={String(stats.openCount)} sub="disponibles ahora" />
            <StatCard label="Tus puntos" value={String(stats.totalPoints)} sub="acumulados" />
            <StatCard label="Tu posición" value={stats.position} sub={stats.totalPlayers > 0 ? `de ${stats.totalPlayers} jugadores` : "—"} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-10 lg:px-[90px] xl:px-[130px] py-8 flex flex-col gap-10">
        {loading && (
          <p className="text-[14px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>Cargando quinielas...</p>
        )}

        {/* Open quinielas */}
        {!loading && openQuinielas.length > 0 && (
          <div>
            <SectionHeader title="Quinielas abiertas" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {openQuinielas.map((q) => (
                <QuinielaCard
                  key={q.id}
                  {...q}
                  buttonLabel="Ver quiniela"
                  onButtonClick={() => navigate("/tabla", { state: { quinielaId: q.id } })}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && openQuinielas.length === 0 && resolvedQuinielas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[16px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>No hay quinielas disponibles por ahora.</p>
          </div>
        )}

        {/* Resolved quinielas */}
        {!loading && resolvedQuinielas.length > 0 && (
          <div>
            <SectionHeader title="Quinielas resueltas" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resolvedQuinielas.map((q) => (
                <div key={q.id} className="opacity-80 transition-opacity hover:opacity-100">
                  <QuinielaCard
                    {...q}
                    buttonLabel="Ver resultados"
                    onButtonClick={() => navigate("/tabla", { state: { quinielaId: q.id } })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
