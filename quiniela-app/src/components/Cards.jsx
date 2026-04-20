import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

/* ── Animated number counter ──────────────────────────────────────── */
function useCountUp(rawValue, duration = 780) {
  const str = String(rawValue);
  // Match optional non-digit prefix, a numeric string, optional non-digit suffix
  const m = str.match(/^([^\d]*)(\d[\d,.]*)([^\d.]*)$/);
  const [displayed, setDisplayed] = useState(m ? `${m[1]}0${m[3]}` : str);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!m) { setDisplayed(str); return; }
    const [, prefix, numStr, suffix] = m;
    const target = parseFloat(numStr.replace(/,/g, ""));
    if (isNaN(target)) { setDisplayed(str); return; }

    cancelAnimationFrame(rafRef.current);
    let startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(target * eased);
      setDisplayed(`${prefix}${current.toLocaleString("es-MX")}${suffix}`);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rawValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return displayed;
}

/* ── StatCard ─────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, dark = false }) {
  const animatedValue = useCountUp(value);

  return (
    <div
      className={cn(
        "rounded-[20px] border px-4 py-3 sm:px-[22px] sm:py-4 flex flex-col gap-1 flex-1 min-w-[110px] sm:min-w-[150px]",
        "transition-all duration-300 hover:-translate-y-1.5",
        dark
          ? "hover:shadow-[0_8px_32px_rgba(61,187,120,0.25)]"
          : "bg-white border-[#e4e4e0] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#d6f5e8]"
      )}
      style={dark ? { backgroundColor: "var(--stat-dark-bg)", borderColor: "var(--stat-dark-bg)" } : {}}
    >
      <span
        className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px]",
          dark ? "" : "text-[#6b6b6b]")}
        style={{ fontFamily: "Nunito, sans-serif", ...(dark ? { color: "var(--stat-dark-label)" } : {}) }}
      >
        {label}
      </span>
      <span
        className={cn("text-[20px] sm:text-[28px] font-black tracking-tight leading-none tabular-nums",
          dark ? "" : "text-[#1a1a1a]")}
        style={{ fontFamily: "Nunito, sans-serif", ...(dark ? { color: "var(--stat-dark-text)" } : {}) }}
      >
        {animatedValue}
      </span>
      {sub && (
        <span
          className={cn("text-[10px] sm:text-[11px] font-semibold mt-auto pt-1",
            dark ? "" : "text-[#6b6b6b]")}
          style={{ fontFamily: "Nunito, sans-serif", ...(dark ? { color: "var(--stat-dark-sub)" } : {}) }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────────────── */
export function Badge({ status }) {
  const map = {
    abierta:  { bg: "var(--green-pale)", text: "var(--green-dk)", label: "Abierta" },
    resuelta: { bg: "var(--surface-2)",  text: "var(--text-2)",   label: "Resuelta" },
    cerrada:  { bg: "var(--red-pale)",   text: "var(--red)",      label: "Cerrada" },
  };
  const s = map[status] || map.abierta;
  return (
    <span
      className="text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-3 h-[22px] sm:h-[23px] rounded-full flex items-center justify-center animate-scale-in"
      style={{ fontFamily: "Nunito, sans-serif", backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

/* ── AvatarStack ──────────────────────────────────────────────────── */
const API_ORIGIN = (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_URL || '') : '').replace(/\/api$/, '');

export function AvatarStack({ initials = [], photos = [], extra = 0 }) {
  return (
    <div className="flex items-center">
      {initials.map((ini, i) => {
        const rawFoto = photos[i];
        const fotoUrl = rawFoto ? (rawFoto.startsWith('http') ? rawFoto : `${API_ORIGIN}${rawFoto}`) : null;
        return (
          <div
            key={i}
            className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full border-2 border-white -ml-[6px] first:ml-0 shadow-sm transition-transform hover:scale-125 hover:z-10 relative overflow-hidden flex-shrink-0"
            style={{ backgroundColor: "var(--green-pale)" }}
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt={ini} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }} />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold" style={{ color: "var(--green-dk)", fontFamily: "Nunito, sans-serif" }}>
                {ini}
              </span>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold -ml-[6px] shadow-sm relative"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)", fontFamily: "Nunito, sans-serif" }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ── DataPair ─────────────────────────────────────────────────────── */
function DataPair({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
        {label}
      </span>
      <span className="text-[14px] sm:text-[15px] font-extrabold truncate" style={{ fontFamily: "Nunito, sans-serif", color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

/* ── Accent color map ─────────────────────────────────────────────── */
const accentColors = {
  green:  "bg-[#3dbb78]",
  orange: "bg-[#f4a030]",
  pink:   "bg-[#f8c0ce]",
  gray:   "bg-[#6b6b6b]",
};

/* ── QuinielaCard ─────────────────────────────────────────────────── */
export function QuinielaCard({
  title, league, status = "abierta", pozo, entrada, partidos, cierre,
  players = [], photos = [], extraPlayers = 0, buttonLabel = "Ver quiniela",
  accentColor = "green", onButtonClick, resolved = false,
  ganador, posicion, puntos, pague, misPoints,
}) {
  const isOpen = status === "abierta";
  return (
    <div
      className={cn(
        "bg-white border rounded-[20px] overflow-hidden relative flex flex-col group transition-all duration-300 hover:-translate-y-1.5",
        isOpen
          ? "border-[#e4e4e0] hover:shadow-[0_8px_32px_rgba(61,187,120,0.20)] hover:border-[#c5f0dc]"
          : "border-[#e4e4e0] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* Animated accent bar — grows slightly taller on hover */}
      <div
        className={cn(
          "h-1 w-full transition-all duration-300 group-hover:h-[6px]",
          accentColors[accentColor] || accentColors.green
        )}
      />
      <div className="p-4 sm:p-[22px] flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-[16px] font-black text-[#1a1a1a] tracking-tight leading-[1.2] truncate" style={{ fontFamily: "Nunito, sans-serif" }}>
              {title}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#6b6b6b] mt-0.5 truncate" style={{ fontFamily: "Nunito, sans-serif" }}>
              {league}
            </p>
          </div>
          <Badge status={status} />
        </div>

        <div className="border-t border-[#e4e4e0] pt-3 grid grid-cols-2 gap-y-3 gap-x-2">
          {resolved ? (
            <>
              <DataPair label="Bolsa final" value={pozo} />
              <DataPair label="Ganador"    value={ganador} />
              <DataPair label="Tu pos."    value={posicion} />
              <DataPair label="Aciertos"   value={puntos} />
            </>
          ) : misPoints !== undefined ? (
            <>
              <DataPair label="Mi pos."  value={posicion} />
              <DataPair label="Mis pts"  value={misPoints} />
              <DataPair label="Bolsa acumulada"     value={pozo} />
              <DataPair label="Pagué"    value={pague} />
            </>
          ) : (
            <>
              <DataPair label="Bolsa acumulada"     value={pozo} />
              <DataPair label="Entrada"  value={entrada} />
              <DataPair label="Partidos" value={partidos} />
              <DataPair label="Cierre"   value={cierre} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <AvatarStack initials={players} photos={photos} extra={extraPlayers} />
          <button
            onClick={onButtonClick}
            className={cn(
              "h-8 sm:h-9 px-4 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-extrabold transition-all duration-200 active:scale-95",
              resolved
                ? "border border-[#e4e4e0] hover:bg-[#f2f2ef]"
                : isOpen
                  ? "hover:shadow-lg hover:shadow-[#3dbb78]/30"
                  : "hover:shadow-lg hover:shadow-black/20"
            )}
            style={{
              fontFamily: "Nunito, sans-serif",
              ...(resolved
                ? { color: "var(--text)" }
                : { backgroundColor: "var(--btn-bg)", color: "var(--btn-text)" }),
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── SectionHeader ────────────────────────────────────────────────── */
export function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-4 mb-4 sm:mb-5">
      <span
        className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.6px] whitespace-nowrap"
        style={{ fontFamily: "Nunito, sans-serif", color: "var(--text-2)" }}
      >
        {title}
      </span>
      {/* Gradient divider: green → transparent, grows from left */}
      <div
        className="flex-1 h-px origin-left animate-scale-in"
        style={{
          background: "linear-gradient(to right, #3dbb78 0%, #d6f5e8 30%, #e4e4e0 60%, transparent 100%)",
          animationDuration: "0.7s",
        }}
      />
    </div>
  );
}

/* ── CardSkeleton — shimmer placeholder while data loads ──────────── */
export function CardSkeleton() {
  return (
    <div className="border border-[#e4e4e0] rounded-[20px] overflow-hidden flex flex-col" style={{ backgroundColor: "var(--surface)" }}>
      <div className="h-1 w-full animate-shimmer" />
      <div className="p-5 flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 w-3/4 rounded-full animate-shimmer" />
            <div className="h-3 w-1/2 rounded-full animate-shimmer" />
          </div>
          <div className="h-6 w-16 rounded-full animate-shimmer flex-shrink-0" />
        </div>
        {/* Data grid */}
        <div className="border-t border-[#e4e4e0] pt-3 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2 w-10 rounded animate-shimmer" />
              <div className="h-4 w-16 rounded animate-shimmer" />
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-[-4px]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full animate-shimmer -ml-1 first:ml-0 border-2" style={{ borderColor: "var(--surface)" }} />
            ))}
          </div>
          <div className="h-8 w-28 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
