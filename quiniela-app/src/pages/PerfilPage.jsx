import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, StatCard } from "../components";
import { useStore } from "../store";
import { authService } from "../services/authService";

const font = "Nunito, sans-serif";

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      authService.perfil().catch(() => null),
      authService.stats().catch(() => null),
    ]).then(([p, s]) => {
      if (!mounted) return;
      if (p) setPerfil(p);
      if (s) setStats(s);
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const nombre = perfil?.nombre_completo || `${user?.nombre || ""} ${user?.apellido || ""}`;
  const partes = nombre.trim().split(' ');
  const iniciales = partes.map(p => p[0]?.toUpperCase() || "").join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="app" showWeek />

      {/* Profile header */}
      <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden animate-fade-in">
        <div
          className="absolute -top-30 -left-10 md:-left-30 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full opacity-40 pointer-events-none animate-breathe"
          style={{ backgroundImage: "linear-gradient(145deg, rgb(252,228,236) 0%, rgb(214,245,232) 100%)" }}
        />
        <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] py-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar with glow pulse */}
          <div
            className="w-[80px] h-[80px] rounded-full bg-[#d6f5e8] border-[3px] border-[#3dbb78] flex items-center justify-center text-[28px] font-extrabold text-[#25854f] flex-shrink-0 animate-scale-in animate-glow-pulse transition-transform hover:scale-105"
            style={{ fontFamily: font }}
          >
            {iniciales || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-[26px] md:text-[30px] font-black text-[#1a1a1a] tracking-[-1px] leading-none" style={{ fontFamily: font }}>
              {nombre}
            </h2>
            <p className="text-[14px] font-medium text-[#6b6b6b] mt-1" style={{ fontFamily: font }}>
              {perfil?.correo || user?.correo}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-[#d6f5e8] text-[#25854f] text-[11px] font-extrabold px-3 h-[23px] rounded-full inline-flex items-center" style={{ fontFamily: font }}>
                Activo
              </span>
              {perfil?.equipo_favorito_nombre && (
                <span className="bg-[#d6f5e8] text-[#25854f] text-[11px] font-extrabold px-3 h-[23px] rounded-full inline-flex items-center" style={{ fontFamily: font }}>
                  Equipo favorito: {perfil.equipo_favorito_nombre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-10 lg:px-[90px] xl:px-[130px] py-8 flex flex-col lg:flex-row gap-8">
        {/* Stats */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap" style={{ fontFamily: font }}>
              Estadísticas
            </span>
            <div className="flex-1 h-px bg-[#e4e4e0]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Quinielas jugadas" value={String(stats?.total_participaciones || 0)} />
            <StatCard label="Puntos totales" value={String(stats?.total_puntos || 0)} />
            <div className="bg-white border border-[#e4e4e0] rounded-[20px] px-5 sm:px-[22px] py-4 flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg transition-all">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]" style={{ fontFamily: font }}>Mejor posición</span>
              <span className="text-[24px] sm:text-[28px] font-black tracking-tight leading-none text-[#1a1a1a]" style={{ fontFamily: font }}>
                {stats?.mejor_posicion ? `#${stats.mejor_posicion}` : "—"}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>en una quiniela</span>
            </div>
            <div className="bg-white border border-[#e4e4e0] rounded-[20px] px-5 sm:px-[22px] py-4 flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg transition-all">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]" style={{ fontFamily: font }}>Jugadores rivales</span>
              <span className="text-[24px] sm:text-[28px] font-black tracking-tight leading-none text-[#1a1a1a]" style={{ fontFamily: font }}>
                {stats?.total_jugadores || "—"}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>en quinielas activas</span>
            </div>
          </div>
        </div>

        {/* Account data */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden">
            <div className="border-b border-[#e4e4e0] px-5 py-4 bg-[#fafaf8]">
              <span className="text-[13px] font-extrabold text-[#1a1a1a]" style={{ fontFamily: font }}>Datos de cuenta</span>
            </div>
            <div className="p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>Nombre completo</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]" style={{ fontFamily: font }}>{nombre}</span>
              </div>

              {[
                { label: "Correo", value: perfil?.correo || user?.correo || "—" },
                { label: "Fecha de nacimiento", value: formatFecha(perfil?.fecha_nacimiento) },
                { label: "Miembro desde", value: formatFecha(perfil?.fecha_creacion) },
                { label: "Equipo favorito", value: perfil?.equipo_favorito_nombre || "Sin equipo" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-2.5 border-t border-[#e4e4e0]">
                  <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>{r.label}</span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a] text-right" style={{ fontFamily: font }}>{r.value}</span>
                </div>
              ))}

              {/* Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleLogout}
                  className="border border-[#e4e4e0] text-[#1a1a1a] text-[13px] font-extrabold h-11 rounded-full hover:bg-[#fee2e2] hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                  style={{ fontFamily: font }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
