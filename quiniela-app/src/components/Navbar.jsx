import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useStore } from "../store";
import { cn } from "../utils/cn";

export const NAV_LOGO = "/iconoQuiniepicks.png";

const REGLAS = [
  {
    num: "01",
    titulo: "Únete a una quiniela",
    desc: "El admin crea una quiniela con los partidos de la jornada. Paga tu inscripción y queda registrado como participante.",
  },
  {
    num: "02",
    titulo: "Predice cada partido",
    desc: "Para cada partido elige tu resultado: L (gana el local), E (empate) o V (gana el visitante). Tienes hasta el cierre de votación para enviar tus picks.",
  },
  {
    num: "03",
    titulo: "Usa tu comodín",
    desc: "Una vez por quiniela puedes seleccionar DOS opciones en un mismo partido (por ejemplo, L y E). Si cualquiera de las dos se cumple, el punto es tuyo.",
  },
  {
    num: "04",
    titulo: "Acumula puntos",
    desc: "Cada predicción correcta vale 1 punto. El sistema actualiza los marcadores en tiempo real conforme terminan los partidos.",
  },
  {
    num: "05",
    titulo: "Gana el pozo",
    desc: "Al finalizar la jornada, quien tenga más puntos se lleva el pozo. En caso de empate, el premio se divide entre los ganadores.",
  },
];

function ReglasModal({ onClose }) {
  const { theme } = useStore();
  const isDark = theme === "dark";

  const pickChips = isDark
    ? [
        { key: "L", label: "Local",     color: "#55cc8a", bg: "#0d2018" },
        { key: "E", label: "Empate",    color: "#e0a050", bg: "#211608" },
        { key: "V", label: "Visitante", color: "#70b8dd", bg: "#0c1828" },
      ]
    : [
        { key: "L", label: "Local",     color: "#3dbb78", bg: "#d6f5e8" },
        { key: "E", label: "Empate",    color: "#f59e0b", bg: "#fef3c7" },
        { key: "V", label: "Visitante", color: "#3b82f6", bg: "#dbeafe" },
      ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e4e4e0] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <img src={NAV_LOGO} alt="logo" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <div>
              <p className="text-[11px] font-bold text-[#3dbb78] uppercase tracking-widest leading-none">Quiniepicks</p>
              <h2 className="text-[18px] font-black text-[#1a1a1a] leading-tight">Cómo funciona</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f2ef] hover:bg-[#e4e4e0] flex items-center justify-center transition-colors text-[#1a1a1a]"
          >
            <X size={16} strokeWidth={2.5} color="currentColor" />
          </button>
        </div>

        {/* Rules */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {REGLAS.map((r) => (
            <div key={r.num} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[11px] font-black text-[#3dbb78] tracking-tight">
                {r.num}
              </span>
              <div className="flex-1 pt-1">
                <p className="text-[14px] font-black text-[#1a1a1a] leading-tight mb-0.5">{r.titulo}</p>
                <p className="text-[13px] font-medium text-[#6b6b6b] leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}

          {/* Leyenda picks */}
          <div className="mt-1 p-4 bg-[#f2f2ef] rounded-xl">
            <p className="text-[11px] font-extrabold text-[#6b6b6b] uppercase tracking-widest mb-3">Opciones de predicción</p>
            <div className="flex gap-3">
              {pickChips.map((o) => (
                <div key={o.key} className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: o.bg }}>
                  <span className="text-[18px] font-black" style={{ color: o.color }}>{o.key}</span>
                  <span className="text-[10px] font-bold text-[#1a1a1a]">{o.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-5">
          <Link
            to="/register"
            onClick={onClose}
            className="block w-full h-11 rounded-full text-[14px] font-black flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--btn-bg)", color: "var(--btn-text)" }}
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Navbar({ showWeek = false, variant = "app" }) {
  const { pathname } = useLocation();
  const { user, logout, theme, toggleTheme } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reglasOpen, setReglasOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const isDark = theme === 'dark';

  const activeLink = pathname.substring(1) || "inicio";

  const appLinks = [
    { id: "inicio",         label: "Inicio",        path: "/" },
    { id: "mis-quinielas",  label: "Mis Quinielas",  path: "/mis-quinielas" },
    { id: "perfil",         label: "Perfil",         path: "/perfil" },
    ...(user?.isAdmin ? [{ id: "admin", label: "Admin Panel", path: "/admin" }] : []),
  ];

  const landingLinks = [
    { id: "inicio",  label: "Inicio",  path: "/" },
    { id: "reglas",  label: "Reglas",  path: null, modal: true },
  ];

  const links = variant === "landing" ? landingLinks : appLinks;

  function openMenu() {
    setOpenCount((c) => c + 1);
    setMobileMenuOpen(true);
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      {reglasOpen && <ReglasModal onClose={() => setReglasOpen(false)} />}

      <nav className="h-[68px] bg-white border-b border-[#e4e4e0] px-4 sm:px-10 relative z-50 overflow-visible">
        <div className="flex items-center justify-between h-full max-w-[1400px] mx-auto">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 z-50 group/logo">
            <img
              src={NAV_LOGO}
              alt="Quiniepicks"
              className="flex-shrink-0 transition-transform duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-[-6deg]"
              style={{
                width: "clamp(60px, 8vw, 84px)",
                height: "clamp(60px, 8vw, 84px)",
                objectFit: "contain",
              }}
            />
            <span
              className="font-black text-[16px] sm:text-[17px] text-[#1a1a1a] tracking-tight transition-colors group-hover/logo:text-[#3dbb78]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Quiniepicks
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            {variant === "landing" ? (
              <div className="flex gap-2">
                {links.map((l) =>
                  l.modal ? (
                    <button
                      key={l.id}
                      onClick={() => setReglasOpen(true)}
                      className="text-[13.5px] font-semibold text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-[#f2f2ef]"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      {l.label}
                    </button>
                  ) : (
                    <Link
                      key={l.id}
                      to={l.path}
                      className="text-[13.5px] font-semibold text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-[#f2f2ef]"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      {l.label}
                    </Link>
                  )
                )}
              </div>
            ) : (
              links.map((l) => (
                <Link
                  key={l.id}
                  to={l.path}
                  className={cn(
                    "text-[13px] font-bold px-4 h-[30px] rounded-full flex items-center transition-all duration-200",
                    activeLink === l.id || (activeLink === "" && l.id === "inicio")
                      ? "text-white"
                      : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f2f2ef]"
                  )}
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    ...(activeLink === l.id || (activeLink === "" && l.id === "inicio")
                      ? { backgroundColor: "var(--text)" }
                      : {}),
                  }}
                >
                  {l.label}
                </Link>
              ))
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3 z-50">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center border border-[#e4e4e0] bg-[#f2f2ef] hover:bg-[#e4e4e0] transition-colors"
              title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            >
              {isDark
                ? <Sun size={14} strokeWidth={2} color="#f4a030" />
                : <Moon size={14} strokeWidth={2} color="#6b6b6b" />}
            </button>
            {variant === "app" && showWeek && (
              <span
                className="border border-[#e4e4e0] rounded-full px-3 h-[25px] flex items-center gap-1.5 text-[11px] font-extrabold text-[#6b6b6b]"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                <span className="relative flex-shrink-0 w-[7px] h-[7px]">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#3dbb78] block relative z-10" />
                  <span className="absolute inset-0 rounded-full bg-[#3dbb78] animate-ping opacity-60" />
                </span>
                Semana 12
              </span>
            )}
            {user ? (
              <button
                onClick={logout}
                className="w-[36px] h-[36px] rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[13px] font-extrabold text-[#25854f] transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-[#3dbb78]/30"
                style={{ fontFamily: "Nunito, sans-serif" }}
                title="Cerrar Sesión"
              >
                {user.nombre.charAt(0) || "U"}
              </button>
            ) : (
              <Link
                to="/register"
                className="text-[13px] font-bold px-5 h-9 rounded-full hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center"
                style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "var(--btn-bg)", color: "var(--btn-text)" }}
              >
                Regístrate
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 -mr-2 z-50 text-[#1a1a1a] transition-transform duration-200 active:scale-90"
            onClick={mobileMenuOpen ? closeMenu : openMenu}
          >
            <div className="transition-transform duration-300" style={{ transform: mobileMenuOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
              {mobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </div>
          </button>
        </div>

        {/* Mobile Drawer */}
        <div
          className={cn(
            "fixed inset-0 bg-white z-40 flex flex-col pt-20 px-6",
            "transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div key={openCount} className="flex flex-col gap-4">
            {links.map((l, i) =>
              l.modal ? (
                <button
                  key={l.id}
                  onClick={() => { setReglasOpen(true); closeMenu(); }}
                  className="text-[20px] font-black tracking-tight py-2 text-left text-[#6b6b6b] animate-slide-in-right"
                  style={{ fontFamily: "Nunito, sans-serif", animationDelay: `${i * 60}ms` }}
                >
                  {l.label}
                </button>
              ) : (
                <Link
                  key={l.id}
                  to={l.path}
                  onClick={closeMenu}
                  className={cn(
                    "text-[20px] font-black tracking-tight py-2 transition-colors animate-slide-in-right",
                    activeLink === l.id || (activeLink === "" && l.id === "inicio")
                      ? "text-[#1a1a1a]"
                      : "text-[#6b6b6b]"
                  )}
                  style={{ fontFamily: "Nunito, sans-serif", animationDelay: `${i * 60}ms` }}
                >
                  {l.label}
                </Link>
              )
            )}
          </div>

          <div className="mt-auto pb-8 flex flex-col gap-4">
            {/* Theme toggle row */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-bold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
                {isDark ? "Tema oscuro" : "Tema claro"}
              </span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 h-8 rounded-full border border-[#e4e4e0] bg-[#f2f2ef] hover:bg-[#e4e4e0] text-[12px] font-bold text-[#6b6b6b] transition-colors"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {isDark
                  ? <><Sun size={13} strokeWidth={2} color="#f4a030" /> Claro</>
                  : <><Moon size={13} strokeWidth={2} color="#6b6b6b" /> Oscuro</>}
              </button>
            </div>
            {user ? (
              <div
                className="flex items-center justify-between p-4 bg-[#f2f2ef] rounded-2xl animate-fade-in"
                style={{ animationDelay: `${links.length * 60 + 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-[40px] h-[40px] rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[15px] font-extrabold text-[#25854f]"
                    style={{ fontFamily: "Nunito, sans-serif" }}
                  >
                    {user.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1a1a1a]" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-[12px] font-semibold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {user.correo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className="text-[#b91c1c] text-[13px] font-bold underline"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full h-12 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center text-[15px] font-extrabold text-[#1a1a1a] animate-fade-in transition-all hover:bg-[#f2f2ef]"
                  style={{ fontFamily: "Nunito, sans-serif", animationDelay: `${links.length * 60 + 40}ms` }}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[15px] font-extrabold text-white shadow-lg animate-fade-in hover:bg-[#333] transition-colors"
                  style={{ fontFamily: "Nunito, sans-serif", animationDelay: `${links.length * 60 + 100}ms` }}
                >
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
