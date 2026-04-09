import { cn } from "../utils/cn";

export function StatCard({ label, value, sub, dark = false }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border px-5 py-4 sm:px-[22px] flex flex-col gap-1 flex-1 min-w-[140px] sm:min-w-[150px] transition-all hover:-translate-y-1 hover:shadow-lg",
        dark ? "bg-[#1a1a1a] border-[#1a1a1a]" : "bg-white border-[#e4e4e0]"
      )}
    >
      <span className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px]", dark ? "text-white/60" : "text-[#6b6b6b]")} style={{ fontFamily: "Nunito, sans-serif" }}>
        {label}
      </span>
      <span className={cn("text-[24px] sm:text-[28px] font-black tracking-tight leading-none", dark ? "text-white" : "text-[#1a1a1a]")} style={{ fontFamily: "Nunito, sans-serif" }}>
        {value}
      </span>
      {sub && (
        <span className={cn("text-[10px] sm:text-[11px] font-semibold mt-auto pt-1", dark ? "text-white/50" : "text-[#6b6b6b]")} style={{ fontFamily: "Nunito, sans-serif" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    abierta: { bg: "bg-[#d6f5e8]", text: "text-[#25854f]", label: "Abierta" },
    resuelta: { bg: "bg-[#f2f2ef]", text: "text-[#6b6b6b]", label: "Resuelta" },
    cerrada: { bg: "bg-[#fee2e2]", text: "text-[#b91c1c]", label: "Cerrada" },
  };
  const s = map[status] || map.abierta;
  return (
    <span className={cn(s.bg, s.text, "text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-3 h-[22px] sm:h-[23px] rounded-full flex items-center justify-center")} style={{ fontFamily: "Nunito, sans-serif" }}>
      {s.label}
    </span>
  );
}

export function AvatarStack({ initials = [], extra = 0 }) {
  return (
    <div className="flex items-center">
      {initials.map((ini, i) => (
        <div
          key={i}
          className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#d6f5e8] border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-[#25854f] -ml-[6px] first:ml-0 shadow-sm transition-transform hover:scale-110 hover:z-10 relative"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          {ini}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full bg-[#f2f2ef] border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-[#6b6b6b] -ml-[6px] shadow-sm relative" style={{ fontFamily: "Nunito, sans-serif" }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

function DataPair({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>{label}</span>
      <span className="text-[14px] sm:text-[15px] font-extrabold text-[#1a1a1a] truncate" style={{ fontFamily: "Nunito, sans-serif" }}>{value}</span>
    </div>
  );
}

const accentColors = {
  green: "bg-[#3dbb78]",
  orange: "bg-[#f4a030]",
  pink: "bg-[#f8c0ce]",
  gray: "bg-[#6b6b6b]",
};

export function QuinielaCard({ title, league, status = "abierta", pozo, entrada, partidos, cierre, players = [], extraPlayers = 0, buttonLabel = "Ver quiniela", accentColor = "green", onButtonClick, resolved = false, ganador, posicion, puntos, pague, misPoints }) {
  return (
    <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden relative flex flex-col transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 group">
      <div className={cn("h-1 w-full transition-all group-hover:h-1.5", accentColors[accentColor] || accentColors.green)} />
      <div className="p-4 sm:p-[22px] flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-[16px] font-black text-[#1a1a1a] tracking-tight leading-[1.2] truncate" style={{ fontFamily: "Nunito, sans-serif" }}>{title}</h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#6b6b6b] mt-0.5 truncate" style={{ fontFamily: "Nunito, sans-serif" }}>{league}</p>
          </div>
          <Badge status={status} />
        </div>

        <div className="border-t border-[#e4e4e0] pt-3 grid grid-cols-2 gap-y-3 gap-x-2">
          {resolved ? (
            <>
              <DataPair label="Pozo final" value={pozo} />
              <DataPair label="Ganador" value={ganador} />
              <DataPair label="Tu pos." value={posicion} />
              <DataPair label="Aciertos" value={puntos} />
            </>
          ) : misPoints !== undefined ? (
            <>
              <DataPair label="Mi pos." value={posicion} />
              <DataPair label="Mis pts" value={misPoints} />
              <DataPair label="Pozo" value={pozo} />
              <DataPair label="Pagué" value={pague} />
            </>
          ) : (
            <>
              <DataPair label="Pozo" value={pozo} />
              <DataPair label="Entrada" value={entrada} />
              <DataPair label="Partidos" value={partidos} />
              <DataPair label="Cierre" value={cierre} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <AvatarStack initials={players} extra={extraPlayers} />
          <button
            onClick={onButtonClick}
            className={cn(
              "h-8 sm:h-9 px-4 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-extrabold transition-all active:scale-95",
              resolved
                ? "border border-[#e4e4e0] text-[#1a1a1a] hover:bg-[#f2f2ef]"
                : "bg-[#1a1a1a] text-white hover:bg-[#333] hover:shadow-md"
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

export function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-4 mb-4 sm:mb-5">
      <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap" style={{ fontFamily: "Nunito, sans-serif" }}>
        {title}
      </span>
      <div className="flex-1 h-px bg-[#e4e4e0]" />
    </div>
  );
}
