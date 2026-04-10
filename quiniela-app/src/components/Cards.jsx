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
          ? "bg-[#1a1a1a] border-[#1a1a1a] hover:shadow-[0_8px_32px_rgba(61,187,120,0.25)]"
          : "bg-white border-[#e4e4e0] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#d6f5e8]"
      )}
    >
      <span
        className={cn(
          "text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px]",
          dark ? "text-white/60" : "text-[#6b6b6b]"
        )}
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[20px] sm:text-[28px] font-black tracking-tight leading-none tabular-nums",
          dark ? "text-white" : "text-[#1a1a1a]"
        )}
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        {animatedValue}
      </span>
      {sub && (
        <span
          className={cn(
            "text-[10px] sm:text-[11px] font-semibold mt-auto pt-1",
            dark ? "text-white/50" : "text-[#6b6b6b]"
          )}
          style={{ fontFamily: "Nunito, sans-serif" }}
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
    abierta:  { bg: "bg-[#d6f5e8]", text: "text-[#25854f]", label: "Abierta" },
    resuelta: { bg: "bg-[#f2f2ef]", text: "text-[#6b6b6b]", label: "Resuelta" },
    cerrada:  { bg: "bg-[#fee2e2]", text: "text-[#b91c1c]", label: "Cerrada" },
  };
  const s = map[status] || map.abierta;
  return (
    <span
      className={cn(
        s.bg, s.text,
        "text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-3 h-[22px] sm:h-[23px] rounded-full flex items-center justify-center",
        "animate-scale-in"
      )}
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      {s.label}
    </span>
  );
}

/* ── AvatarStack ──────────────────────────────────────────────────── */
export function AvatarStack({ initials = [], extra = 0 }) {
  return (
    <div className="flex items-center">
      {initials.map((ini, i) => (
        <div
          key={i}
          className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#d6f5e8] border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-[#25854f] -ml-[6px] first:ml-0 shadow-sm transition-transform hover:scale-125 hover:z-10 relative"
          style={{ fontFamily: "Nunito, sans-serif", animationDelay: `${i * 50}ms` }}
        >
          {ini}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#f2f2ef] border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-[#6b6b6b] -ml-[6px] shadow-sm relative"
          style={{ fontFamily: "Nunito, sans-serif" }}
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
      <span className="text-[14px] sm:text-[15px] font-extrabold text-[#1a1a1a] truncate" style={{ fontFamily: "Nunito, sans-serif" }}>
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
  players = [], extraPlayers = 0, buttonLabel = "Ver quiniela",
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
              <DataPair label="Pozo final" value={pozo} />
              <DataPair label="Ganador"    value={ganador} />
              <DataPair label="Tu pos."    value={posicion} />
              <DataPair label="Aciertos"   value={puntos} />
            </>
          ) : misPoints !== undefined ? (
            <>
              <DataPair label="Mi pos."  value={posicion} />
              <DataPair label="Mis pts"  value={misPoints} />
              <DataPair label="Pozo"     value={pozo} />
              <DataPair label="Pagué"    value={pague} />
            </>
          ) : (
            <>
              <DataPair label="Pozo"     value={pozo} />
              <DataPair label="Entrada"  value={entrada} />
              <DataPair label="Partidos" value={partidos} />
              <DataPair label="Cierre"   value={cierre} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <AvatarStack initials={players} extra={extraPlayers} />
          <button
            onClick={onButtonClick}
            className={cn(
              "h-8 sm:h-9 px-4 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-extrabold transition-all duration-200 active:scale-95",
              resolved
                ? "border border-[#e4e4e0] text-[#1a1a1a] hover:bg-[#f2f2ef]"
                : isOpen
                  ? "bg-[#1a1a1a] text-white hover:bg-[#25854f] hover:shadow-lg hover:shadow-[#3dbb78]/30"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-lg hover:shadow-black/20"
            )}
            style={{ fontFamily: "Nunito, sans-serif" }}
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
        className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap"
        style={{ fontFamily: "Nunito, sans-serif" }}
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
    <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden flex flex-col">
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
              <div key={i} className="w-6 h-6 rounded-full animate-shimmer -ml-1 first:ml-0 border-2 border-white" />
            ))}
          </div>
          <div className="h-8 w-28 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
