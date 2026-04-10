import { useState } from "react";
import { useStore } from "../../store";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
export const C = {
  black:    "#1a1a1a",
  white:    "#ffffff",
  cream:    "#fafaf8",
  border:   "#e4e4e0",
  grey:     "#6b6b6b",
  greyLight:"#f2f2ef",
  green:    "#3dbb78",
  greenDark:"#25854f",
  greenPale:"#d6f5e8",
  orange:   "#f4a030",
  pink:     "#f8c0ce",
  blue:     "#1d4ed8",
};

const font = "Nunito, sans-serif";

// ─── ICON COMPONENTS (SVG inline) ──────────────────────────────────────────
export function IconGrid({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <rect x="1" y="1" width="5" height="5" rx="1" fill={color} />
      <rect x="8" y="1" width="5" height="5" rx="1" fill={color} />
      <rect x="1" y="8" width="5" height="5" rx="1" fill={color} />
      <rect x="8" y="8" width="5" height="5" rx="1" fill={color} />
    </svg>
  );
}

export function IconUsers({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <circle cx="5" cy="4" r="2.5" fill={color} />
      <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.5" cy="4.5" r="2" fill={color} fillOpacity="0.5" />
      <path d="M12.5 12c0-1.7-1-3.1-2.5-3.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}

export function IconQuiniela({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <rect x="1" y="1" width="12" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M1 5h12M5 5v8" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconMoney({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M7 4v6M5 5.5h3a1.5 1.5 0 0 1 0 3H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrophy({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <path d="M4 2h6v5a3 3 0 0 1-6 0V2z" stroke={color} strokeWidth="1.5" />
      <path d="M1 2h3M10 2h3M1 4a2 2 0 0 0 3 1.7M13 4a2 2 0 0 1-3 1.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10v2M5 12h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconReport({ size = 14, color = "currentColor", opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
      <rect x="2" y="1" width="10" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M5 5h4M5 7.5h4M5 10h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1a4 4 0 0 1 4 4v3l1.5 1.5H1.5L3 8V5a4 4 0 0 1 4-4z" stroke={color} strokeWidth="1.5" />
      <path d="M5.5 12a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ size = 11, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke={color} strokeWidth="1.3" />
      <path d="M9 9l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1v8M3.5 6.5l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 11h11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconWarning({ size = 20, color = "#f4a030" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L2 17h16L10 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4M10 14v1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFile({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 2h6l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.3" />
      <path d="M9 2v3h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 8h4M5 10.5h2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M2 4h14M2 9h14M2 14h14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconX({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 3l12 12M15 3L3 15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ size = 11, color = C.greenDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M1.5 5.5l3 3 5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Logo Quiniela SVG
export function LogoIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#1a1a1a" />
      <circle cx="14" cy="14" r="5" fill="white" />
      <circle cx="14" cy="14" r="2" fill="#1a1a1a" />
      <circle cx="7" cy="7" r="2" fill="white" opacity="0.6" />
      <circle cx="21" cy="7" r="2" fill="white" opacity="0.6" />
      <circle cx="7" cy="21" r="2" fill="white" opacity="0.6" />
      <circle cx="21" cy="21" r="2" fill="white" opacity="0.6" />
    </svg>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",     Icon: IconGrid,    section: "general" },
  { id: "participantes",  label: "Participantes", Icon: IconUsers,   section: "general" },
  { id: "quinielas",      label: "Quinielas",     Icon: IconQuiniela,section: "quinielas" },
  { id: "pagos",          label: "Pagos",         Icon: IconMoney,   section: "quinielas", badge: true },
  { id: "resultados",     label: "Resultados",    Icon: IconTrophy,  section: "quinielas" },
  { id: "reportes",       label: "Reportes",      Icon: IconReport,  section: "quinielas" },
];

export function Sidebar({ active, onNavigate, onClose }) {
  const sections = [
    { id: "general",   label: "General" },
    { id: "quinielas", label: "Quinielas" },
  ];

  const handleNav = (id) => {
    onNavigate && onNavigate(id);
    onClose && onClose();
  };

  return (
    <aside className="w-[196px] flex-shrink-0 bg-white border-r border-[#e4e4e0] flex flex-col h-full" style={{ fontFamily: font }}>
      {/* Logo header */}
      <div className="border-b border-[#e4e4e0] px-4 py-5 flex items-center gap-2.5">
        <LogoIcon size={28} />
        <div className="flex flex-col gap-[2px] flex-1">
          <span className="text-[14px] font-black text-[#1a1a1a] tracking-[-0.3px] leading-none">Quiniela</span>
          <span className="text-[9px] font-extrabold bg-[#1a1a1a] text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-[0.5px] w-fit">Admin</span>
        </div>
        {/* Close button — only visible when used as drawer on mobile */}
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded-[6px] hover:bg-[#f2f2ef] transition-colors md:hidden">
            <IconX size={16} color="#6b6b6b" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.id}>
            <div className="px-2 pt-2.5 pb-2">
              <span className="text-[9px] font-extrabold text-[#6b6b6b] uppercase tracking-[0.8px]">{sec.label}</span>
            </div>
            {NAV_ITEMS.filter((i) => i.section === sec.id).map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#1a1a1a] text-white shadow-md"
                      : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a] hover:translate-x-0.5"
                  }`}
                >
                  <item.Icon size={14} color={isActive ? "white" : "#6b6b6b"} opacity={isActive ? 1 : 0.5} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="relative flex-shrink-0 w-[6px] h-[6px]">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#f4a030] block relative z-10" />
                      <span className="absolute inset-0 rounded-full bg-[#f4a030] animate-ping opacity-75" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#e4e4e0] px-2.5 py-3">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-[30px] h-[30px] rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[10px] font-extrabold text-[#25854f] flex-shrink-0 transition-transform duration-200 hover:scale-110">
            AD
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[12px] font-extrabold text-[#1a1a1a] leading-none truncate">Admin</span>
            <span className="text-[10px] font-semibold text-[#6b6b6b] leading-none mt-0.5 truncate">Administrador</span>
          </div>
          <button
            onClick={() => useStore.getState().logout()}
            className="text-[10px] font-extrabold text-white bg-[#d93025] hover:bg-[#b91c1c] px-2 py-1 rounded transition-colors flex-shrink-0"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── TOP BAR ────────────────────────────────────────────────────────────────
export function TopBar({ title, badge, children, onMenuToggle }) {
  return (
    <div className="h-[58px] bg-white border-b border-[#e4e4e0] flex items-center justify-between px-4 md:px-7 flex-shrink-0 gap-2" style={{ fontFamily: font }}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — solo móvil */}
        <button
          onClick={onMenuToggle}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f2f2ef] transition-colors flex-shrink-0"
        >
          <IconMenu size={18} color="#1a1a1a" />
        </button>
        <span className="text-[14px] font-black text-[#1a1a1a] truncate">{title}</span>
        {badge && (
          <span className="hidden sm:flex border border-[#e4e4e0] rounded-full px-3 h-[25px] items-center text-[11px] font-extrabold text-[#6b6b6b] whitespace-nowrap flex-shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}
        <div className="relative w-8 h-8 bg-white border border-[#e4e4e0] rounded-[9px] flex items-center justify-center flex-shrink-0 hover:bg-[#f2f2ef] transition-colors cursor-pointer">
          <IconBell size={14} color="#6b6b6b" />
          <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full bg-[#f4a030] border border-white">
            <span className="absolute inset-0 rounded-full bg-[#f4a030] animate-ping opacity-75" />
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[12px] font-extrabold text-[#25854f] flex-shrink-0 transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-[#3dbb78]/30">
          AD
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN STAT CARD ────────────────────────────────────────────────────────
export function AdminStatCard({ label, value, sub, dark = false, accent }) {
  return (
    <div
      className={`flex-1 rounded-[14px] border px-4 py-3 flex flex-col gap-1 min-w-0 animate-fade-in-up transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        dark ? "bg-[#1a1a1a] border-[#1a1a1a]" : "bg-white border-[#e4e4e0]"
      }`}
      style={{
        fontFamily: font,
        ...(accent && !dark ? { borderTopColor: accent, borderTopWidth: 2 } : {}),
      }}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-[0.4px] ${dark ? "text-white/50" : "text-[#6b6b6b]"}`}
      >
        {label}
      </span>
      <span
        className="text-[22px] font-black tracking-[-0.8px] leading-none"
        style={{ color: accent || (dark ? "white" : "#1a1a1a"), fontFamily: font }}
      >
        {value}
      </span>
      {sub && (
        <span className={`text-[10px] font-semibold ${dark ? "text-white/40" : "text-[#6b6b6b]"}`}>{sub}</span>
      )}
    </div>
  );
}

// ─── SECTION HEADER ─────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction, actionIcon }) {
  return (
    <div className="flex items-center gap-2 mb-3" style={{ fontFamily: font }}>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-[#e4e4e0]" />
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 bg-[#1a1a1a] text-white text-[11px] font-extrabold px-2.5 h-7 rounded-full hover:bg-[#333] transition-colors"
        >
          {actionIcon && actionIcon}
          {action}
        </button>
      )}
    </div>
  );
}

// ─── BADGE ──────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  abierta:   { bg: "#d6f5e8", text: "#25854f" },
  resuelta:  { bg: "#f2f2ef", text: "#6b6b6b" },
  pagado:    { bg: "#d6f5e8", text: "#25854f" },
  pendiente: { bg: "#fff3e0", text: "#a05a00" },
  "sin pago":{ bg: "#f2f2ef", text: "#6b6b6b" },
  prediccion:{ bg: "#d6f5e8", text: "#25854f" },
  "pago enviado": { bg: "#f2f2ef", text: "#1d4ed8" },
  "nuevo usuario":{ bg: "#fde8d8", text: "#a05a00" },
};

export function Badge({ label }) {
  const key = (label || "").toLowerCase();
  const s = BADGE_MAP[key] || { bg: "#f2f2ef", text: "#6b6b6b" };
  return (
    <span
      className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text, fontFamily: font }}
    >
      {label}
    </span>
  );
}

// ─── ADMIN LAYOUT WRAPPER ────────────────────────────────────────────────────
export function AdminLayout({ active, onNavigate, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pasar onMenuToggle a TopBar clonando el primer hijo que sea TopBar
  const childrenWithMenu = Array.isArray(children)
    ? children.map((child, i) =>
        i === 0 && child?.type === TopBar
          ? { ...child, props: { ...child.props, onMenuToggle: () => setDrawerOpen(true) } }
          : child
      )
    : children?.type === TopBar
      ? { ...children, props: { ...children.props, onMenuToggle: () => setDrawerOpen(true) } }
      : children;

  return (
    <div className="flex w-full h-screen bg-[#fafaf8] overflow-hidden">

      {/* Sidebar desktop — siempre visible en md+ */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar active={active} onNavigate={onNavigate} />
      </div>

      {/* Drawer overlay — solo móvil */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer sidebar — solo móvil */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar active={active} onNavigate={onNavigate} onClose={() => setDrawerOpen(false)} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {childrenWithMenu}
      </main>
    </div>
  );
}

// ─── MINI QUINIELA CARD (dashboard) ─────────────────────────────────────────
const ACCENT_COLORS = {
  green: "#3dbb78",
  orange: "#f4a030",
  pink: "#f8c0ce",
};

export function MiniQuinielaCard({ title, league, status, pozo, pagados, partidos, cierre, accentColor = "green", onVer, onShare }) {
  const accent = ACCENT_COLORS[accentColor] || ACCENT_COLORS.green;
  const ratio = parseInt((pagados || "0/1").split("/")[0]) / parseInt((pagados || "1/1").split("/")[1] || 1);

  return (
    <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden flex flex-col p-[17px] gap-3 relative group animate-fade-in-up transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]" style={{ fontFamily: font }}>
      {/* Accent bar grows on hover */}
      <div className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 group-hover:h-[5px] rounded-t-[14px]" style={{ background: accent }} />
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[13px] font-black text-[#1a1a1a] leading-none">{title}</span>
          <span className="text-[11px] font-semibold text-[#6b6b6b]">{league}</span>
        </div>
        <Badge label={status} />
      </div>
      {/* Stats grid */}
      <div className="border-t border-[#e4e4e0] pt-3 grid grid-cols-2 gap-y-2">
        {[["Pozo", pozo], ["Pagados", pagados], ["Partidos", partidos], ["Cierre", cierre]].map(([l, v]) => (
          <div key={l} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.3px] text-[#6b6b6b]">{l}</span>
            <span className="text-[13px] font-black text-[#1a1a1a]">{v}</span>
          </div>
        ))}
      </div>
      {/* Progress + buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[5px] bg-[#f2f2ef] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full animate-bar-fill"
              style={{
                "--bar-target-w": `${ratio * 100}%`,
                background: accent,
                animationFillMode: "both",
                animationDelay: "0.3s",
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-[#6b6b6b]">{pagados}</span>
        </div>
        <div className="flex gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 h-7 px-2 rounded-full border border-[#e4e4e0] text-[11px] font-extrabold text-[#25854f] hover:bg-[#d6f5e8] transition-colors"
            >
              🔗 Compartir
            </button>
          )}
          <button
            onClick={onVer}
            className="flex-1 h-7 px-3 rounded-full border border-[#e4e4e0] text-[11px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INPUT FIELD ────────────────────────────────────────────────────────────
export function InputField({ label, placeholder, type = "text", value, onChange, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} style={{ fontFamily: font }}>
      <label className="text-[10px] font-bold uppercase tracking-[0.3px] text-[#6b6b6b]">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-white border border-[#e4e4e0] rounded-[8px] h-[38px] px-3 text-[13px] font-semibold text-[#1a1a1a] placeholder:text-[#aaa] outline-none focus:border-[#3dbb78] focus:ring-2 focus:ring-[#3dbb78]/20 transition-all"
        style={{ fontFamily: font }}
      />
    </div>
  );
}

// ─── SELECT FIELD ───────────────────────────────────────────────────────────
export function SelectField({ label, value, onChange, options = [], className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} style={{ fontFamily: font }}>
      {label && <label className="text-[10px] font-bold uppercase tracking-[0.3px] text-[#6b6b6b]">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="bg-white border border-[#e4e4e0] rounded-[8px] h-[38px] px-3 text-[13px] font-semibold text-[#1a1a1a] outline-none focus:border-[#3dbb78] transition-all appearance-none cursor-pointer"
        style={{ fontFamily: font }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── MODAL WRAPPER ──────────────────────────────────────────────────────────
export function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-t-[20px] sm:rounded-[16px] shadow-[0_-4px_40px_rgba(0,0,0,0.12)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.15)] overflow-hidden w-full sm:w-auto max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto sm:max-w-[calc(100vw-32px)]">
        {children}
      </div>
    </div>
  );
}

// ─── TABLE ──────────────────────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden" style={{ fontFamily: font }}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e4e4e0]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
