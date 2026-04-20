import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { adminService } from "../../services/quinielaService";

// Inline sun/moon icons — avoid adding a lucide-react import to this file
function IconSun({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function IconMoon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

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

// App logo
export function LogoIcon({ size = 64 }) {
  return (
    <img src="/iconoQuiniepicks.png" alt="Quiniepicks" width={size} height={size} style={{ objectFit: "contain", flexShrink: 0, minWidth: size, minHeight: size }} />
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

export function Sidebar({ active, onNavigate, onClose, collapsed, onToggleCollapse, pendingPagos = 0 }) {
  const { theme, toggleTheme } = useStore();
  const isDark = theme === 'dark';

  const sections = [
    { id: "general",   label: "General" },
    { id: "quinielas", label: "Quinielas" },
  ];

  const handleNav = (id) => {
    onNavigate && onNavigate(id);
    onClose && onClose();
  };

  return (
    <aside
      className={`flex-shrink-0 border-r border-[#e4e4e0] flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[60px]' : 'w-[196px]'
      }`}
      style={{ fontFamily: font, backgroundColor: "var(--surface)" }}
    >
      {/* Logo header */}
      <div className={`border-b border-[#e4e4e0] flex items-center flex-shrink-0 h-[72px] ${collapsed ? 'justify-center px-1' : 'px-4 gap-2.5'}`}>
        <LogoIcon size={collapsed ? 32 : 44} />
        {!collapsed && (
          <>
            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
              <span className="text-[14px] font-black text-[#1a1a1a] tracking-[-0.3px] leading-none">Quiniepicks</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px] uppercase tracking-[0.5px] w-fit"
                style={{ backgroundColor: "var(--text)", color: "var(--bg)" }}>Admin</span>
            </div>
            {onClose && (
              <button onClick={onClose} className="ml-auto p-1 rounded-[6px] hover:bg-[#f2f2ef] transition-colors lg:hidden">
                <IconX size={16} color="#6b6b6b" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {collapsed ? (
          /* ── Mini mode: icons only ── */
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleNav(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-center p-[10px] rounded-[10px] transition-all duration-200 ${
                      isActive ? "shadow-sm" : "hover:bg-[#f2f2ef]"
                    }`}
                    style={isActive ? { backgroundColor: "var(--text)" } : {}}
                  >
                    <item.Icon
                      size={16}
                      color={isActive ? (isDark ? "#101010" : "white") : "#6b6b6b"}
                      opacity={isActive ? 1 : 0.65}
                    />
                  </button>
                  {item.badge && !isActive && pendingPagos > 0 && (
                    <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full bg-[#f4a030] pointer-events-none">
                      <span className="absolute inset-0 rounded-full bg-[#f4a030] animate-ping opacity-75" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Full mode: sections + labels ── */
          sections.map((sec) => (
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
                      isActive ? "shadow-sm" : "text-[#6b6b6b] hover:bg-[#f2f2ef] hover:text-[#1a1a1a] hover:translate-x-0.5"
                    }`}
                    style={isActive ? { backgroundColor: "var(--text)", color: "var(--bg)" } : {}}
                  >
                    <item.Icon
                      size={14}
                      color={isActive ? (isDark ? "#101010" : "white") : "#6b6b6b"}
                      opacity={isActive ? 1 : 0.5}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && !isActive && pendingPagos > 0 && (
                      <span className="relative flex-shrink-0 w-[6px] h-[6px]">
                        <span className="w-[6px] h-[6px] rounded-full bg-[#f4a030] block relative z-10" />
                        <span className="absolute inset-0 rounded-full bg-[#f4a030] animate-ping opacity-75" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </nav>

      {/* Collapse toggle — only for persistent desktop sidebar */}
      {onToggleCollapse && (
        <div className={`px-3 pb-2 flex ${collapsed ? 'justify-center' : 'justify-start'}`}>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Mostrar menú" : "Ocultar menú"}
            className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#f2f2ef] text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
          >
            <IconMenu size={18} />
          </button>
        </div>
      )}

      {/* User footer */}
      <div className={`border-t border-[#e4e4e0] py-3 flex flex-col gap-2 ${collapsed ? 'px-1 items-center' : 'px-2.5'}`}>
        {/* Theme toggle */}
        <div className={`flex ${collapsed ? 'justify-center' : 'justify-start'} w-full px-1`}>
          <button
            onClick={toggleTheme}
            title={isDark ? "Tema claro" : "Tema oscuro"}
            className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#f2f2ef] transition-colors"
          >
            {isDark ? <IconSun size={15} color="#f4a030" /> : <IconMoon size={15} color="#6b6b6b" />}
          </button>
        </div>

        {collapsed ? (
          /* Collapsed user area */
          <>
            <div className="w-[30px] h-[30px] rounded-full bg-[#d6f5e8] border-2 border-[#3dbb78] flex items-center justify-center text-[10px] font-extrabold text-[#25854f] flex-shrink-0 transition-transform duration-200 hover:scale-110">
              AD
            </div>
            <button
              onClick={() => useStore.getState().logout()}
              title="Salir"
              className="w-7 h-7 flex items-center justify-center rounded-[6px] text-white bg-[#d93025] hover:bg-[#b91c1c] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M5 7h7M9.5 4.5L12 7 9.5 9.5M7.5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        ) : (
          /* Expanded user area */
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
        )}
      </div>
    </aside>
  );
}

// ─── TOP BAR ────────────────────────────────────────────────────────────────
export function TopBar({ title, badge, children, onMenuToggle }) {
  return (
    <div
      className="h-[58px] border-b border-[#e4e4e0] flex items-center justify-between px-4 md:px-7 flex-shrink-0 gap-2 bg-white"
      style={{ fontFamily: font }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f2f2ef] transition-colors flex-shrink-0"
        >
          <IconMenu size={18} color="var(--text)" />
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
        <div className="relative w-8 h-8 border border-[#e4e4e0] rounded-[9px] flex items-center justify-center flex-shrink-0 hover:bg-[#f2f2ef] transition-colors cursor-pointer bg-white">
          <IconBell size={14} color="#6b6b6b" />
          <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full bg-[#f4a030]" style={{ border: "1.5px solid var(--surface)" }}>
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
      className="flex-1 rounded-[14px] border px-4 py-3 flex flex-col gap-1 min-w-0 animate-fade-in-up transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        fontFamily: font,
        backgroundColor: dark ? "var(--stat-dark-bg)" : "var(--surface)",
        borderColor: dark ? "var(--stat-dark-bg)" : "var(--border)",
        ...(accent && !dark ? { borderTopColor: accent, borderTopWidth: 2 } : {}),
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-[0.4px]"
        style={{ color: dark ? "var(--stat-dark-label)" : "var(--text-2)" }}
      >
        {label}
      </span>
      <span
        className="text-[22px] font-black tracking-[-0.8px] leading-none"
        style={{ color: accent || (dark ? "var(--stat-dark-text)" : "var(--text)"), fontFamily: font }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] font-semibold"
          style={{ color: dark ? "var(--stat-dark-sub)" : "var(--text-2)" }}>{sub}</span>
      )}
    </div>
  );
}

// ─── SECTION HEADER ─────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction, actionIcon }) {
  return (
    <div className="flex items-center gap-2 mb-3" style={{ fontFamily: font }}>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] whitespace-nowrap" style={{ color: "var(--text-2)" }}>{title}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 h-7 rounded-full transition-colors"
          style={{ backgroundColor: "var(--btn-bg)", color: "var(--btn-text)" }}
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
  abierta:        { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  resuelta:       { bg: "var(--surface-2)",   text: "var(--text-2)" },
  pagado:         { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  pendiente:      { bg: "var(--orange-pale)", text: "var(--orange-text)" },
  "sin pago":     { bg: "var(--surface-2)",   text: "var(--text-2)" },
  prediccion:     { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  "pago enviado": { bg: "var(--surface-2)",   text: "var(--blue-text)" },
  "nuevo usuario":{ bg: "var(--orange-pale)", text: "var(--orange-text)" },
};

export function Badge({ label }) {
  const key = (label || "").toLowerCase();
  const s = BADGE_MAP[key] || { bg: "var(--surface-2)", text: "var(--text-2)" };
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("admin-sidebar-collapsed") === "true"; }
    catch { return false; }
  });
  const [pendingPagos, setPendingPagos] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchPending = () => {
      adminService.getStats().then(s => {
        if (mounted) setPendingPagos(s?.pagos_pendientes || 0);
      }).catch(() => {});
    };
    fetchPending();
    pollRef.current = setInterval(fetchPending, 60_000);
    return () => { mounted = false; clearInterval(pollRef.current); };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("admin-sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  };

  // Inyectar onMenuToggle al primer TopBar hijo
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
    <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>

      {/* Sidebar — visible en lg+ (desktop), colapsable */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          active={active}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          pendingPagos={pendingPagos}
        />
      </div>

      {/* Drawer overlay — móvil y tablet (< lg) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer sidebar — móvil y tablet (< lg) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          active={active}
          onNavigate={onNavigate}
          onClose={() => setDrawerOpen(false)}
          collapsed={false}
          pendingPagos={pendingPagos}
        />
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
    <div
      className="border border-[#e4e4e0] rounded-[14px] overflow-hidden flex flex-col p-[17px] gap-3 relative group animate-fade-in-up transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]"
      style={{ fontFamily: font, backgroundColor: "var(--surface)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 group-hover:h-[5px] rounded-t-[14px]" style={{ background: accent }} />
      <div className="flex items-start justify-between pt-1">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[13px] font-black text-[#1a1a1a] leading-none">{title}</span>
          <span className="text-[11px] font-semibold text-[#6b6b6b]">{league}</span>
        </div>
        <Badge label={status} />
      </div>
      <div className="border-t border-[#e4e4e0] pt-3 grid grid-cols-2 gap-y-2">
        {[["Bolsa acumulada", pozo], ["Pagados", pagados], ["Partidos", partidos], ["Cierre", cierre]].map(([l, v]) => (
          <div key={l} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.3px] text-[#6b6b6b]">{l}</span>
            <span className="text-[13px] font-black text-[#1a1a1a]">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
            <div
              className="h-full rounded-full animate-bar-fill"
              style={{ "--bar-target-w": `${ratio * 100}%`, background: accent, animationFillMode: "both", animationDelay: "0.3s" }}
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
        className="border border-[#e4e4e0] rounded-[8px] h-[38px] px-3 text-[13px] font-semibold placeholder:text-[#aaa] outline-none focus:border-[#3dbb78] focus:ring-2 focus:ring-[#3dbb78]/20 transition-all"
        style={{ fontFamily: font, backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--border)" }}
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
        className="border rounded-[8px] h-[38px] px-3 text-[13px] font-semibold outline-none focus:border-[#3dbb78] transition-all appearance-none cursor-pointer"
        style={{ fontFamily: font, backgroundColor: "var(--input-bg)", color: "var(--text)", borderColor: "var(--border)" }}
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
      <div
        className="relative z-10 rounded-t-[20px] sm:rounded-[16px] shadow-[0_-4px_40px_rgba(0,0,0,0.18)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.22)] overflow-hidden w-full sm:w-auto max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto sm:max-w-[calc(100vw-32px)]"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── TABLE ──────────────────────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div className="border border-[#e4e4e0] rounded-[14px] overflow-hidden" style={{ fontFamily: font, backgroundColor: "var(--surface)" }}>
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
