import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useStore } from "../store";
import { cn } from "../utils/cn";

export const NAV_LOGO = "https://www.figma.com/api/mcp/asset/f5a9f746-a954-4ee6-a0a3-d093e919a0ae";

export function Navbar({ showWeek = false, variant = "app" }) {
  const { pathname } = useLocation();
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Incrementing key forces mobile link re-animation each time menu opens
  const [openCount, setOpenCount] = useState(0);

  const activeLink = pathname.substring(1) || "inicio";

  const appLinks = [
    { id: "inicio",         label: "Inicio",       path: "/" },
    { id: "mis-quinielas",  label: "Mis Quinielas", path: "/mis-quinielas" },
    { id: "perfil",         label: "Perfil",        path: "/perfil" },
    ...(user?.isAdmin ? [{ id: "admin", label: "Admin Panel", path: "/admin" }] : []),
  ];

  const landingLinks = [
    { id: "inicio",   label: "Inicio",  path: "/" },
    { id: "precios",  label: "Precios", path: "#" },
    { id: "ayuda",    label: "Ayuda",   path: "#" },
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
    <nav className="h-[60px] bg-white border-b border-[#e4e4e0] px-4 sm:px-10 relative z-50">
      <div className="flex items-center justify-between h-full max-w-[1400px] mx-auto">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50 group/logo">
          <img
            src={NAV_LOGO}
            alt="logo"
            className="w-[22px] h-[22px] object-contain transition-transform duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-[-6deg]"
          />
          <span
            className="font-black text-[15px] text-[#1a1a1a] tracking-tight transition-colors group-hover/logo:text-[#3dbb78]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Quiniela
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {variant === "landing" ? (
            <div className="flex gap-6">
              {links.map((l) => (
                <Link
                  key={l.id}
                  to={l.path}
                  className="text-[13.5px] font-semibold text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors duration-200"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : (
            links.map((l) => (
              <Link
                key={l.id}
                to={l.path}
                className={cn(
                  "text-[13px] font-bold px-4 h-[30px] rounded-full flex items-center transition-all duration-200",
                  activeLink === l.id || (activeLink === "" && l.id === "inicio")
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f2f2ef]"
                )}
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {l.label}
              </Link>
            ))
          )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-3 z-50">
          {variant === "app" && showWeek && (
            <span
              className="border border-[#e4e4e0] rounded-full px-3 h-[25px] flex items-center gap-1.5 text-[11px] font-extrabold text-[#6b6b6b]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {/* Live green pulse dot */}
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
              className="w-[34px] h-[34px] rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[13px] font-extrabold text-[#25854f] transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-[#3dbb78]/30"
              style={{ fontFamily: "Nunito, sans-serif" }}
              title="Cerrar Sesión"
            >
              {user.nombre.charAt(0) || "U"}
            </button>
          ) : (
            <Link
              to="/register"
              className="bg-[#1a1a1a] text-white text-[13px] font-bold px-5 h-9 rounded-full hover:bg-[#333] hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center"
              style={{ fontFamily: "Nunito, sans-serif" }}
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
        {/* Staggered links — re-keyed on each open so animation re-triggers */}
        <div key={openCount} className="flex flex-col gap-4">
          {links.map((l, i) => (
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
          ))}
        </div>

        <div className="mt-auto pb-8 flex flex-col gap-4">
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
  );
}
