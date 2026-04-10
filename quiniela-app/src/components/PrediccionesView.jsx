import { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { PrimaryButton } from "./Forms";
import { prediccionService } from "../services/quinielaService";

const font = "Nunito, sans-serif";

/* ─── Helpers ─────────────────────────────────────────────────────── */

/** Returns "L" | "E" | "V" | null if match hasn't finished */
function getResult(ptos_local, ptos_visitante) {
  if (ptos_local == null || ptos_visitante == null) return null;
  if (ptos_local > ptos_visitante) return "L";
  if (ptos_local < ptos_visitante) return "V";
  return "E";
}

/* ─── Confetti celebration ────────────────────────────────────────── */

const CONFETTI_COLORS = [
  "#3dbb78","#25854f","#f4a030","#ffe08a",
  "#b0d4ff","#168fe5","#e2cfff","#f8c0ce",
  "#fce4d6","#d6f5e8","#1a1a1a","#ea4335",
];

function ConfettiCelebration({ onDismiss }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${Math.random() * 100}%`,
        width: Math.random() * 9 + 4,
        height: Math.random() * 12 + 5,
        delay: `${(Math.random() * 2).toFixed(2)}s`,
        duration: `${(Math.random() * 2 + 2.8).toFixed(2)}s`,
        rotation: Math.round(Math.random() * 360),
        isCircle: Math.random() > 0.6,
      })),
    []
  );

  /* Auto-dismiss after 7s */
  useEffect(() => {
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Confetti layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              top: -30,
              left: p.left,
              width: p.width,
              height: p.isCircle ? p.width : p.height,
              background: p.color,
              borderRadius: p.isCircle ? "50%" : "2px",
              animationName: "confettiFall",
              animationDuration: p.duration,
              animationDelay: p.delay,
              animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              animationFillMode: "both",
              "--cr": `${p.rotation}deg`,
            }}
          />
        ))}
      </div>

      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Banner card */}
      <div
        className="relative z-10 animate-celebration-in text-center mx-4 max-w-[340px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-[28px] shadow-[0_24px_72px_rgba(0,0,0,0.22)] px-8 py-8 flex flex-col items-center gap-3">
          {/* Trophy with twinkle stars */}
          <div className="relative">
            <span className="text-6xl block">🏆</span>
            {["top-0 -right-3","top-1 -left-4","-top-2 right-4"].map((pos, i) => (
              <span
                key={i}
                className={`absolute text-lg animate-twinkle`}
                style={{ animationDelay: `${i * 0.3}s`, top: pos.split(" ")[0].replace("top-","").replace("-top-","-")+"px", ...Object.fromEntries(pos.split(" ").map(c => c.startsWith("-") ? [c.startsWith("-right") ? "right" : "left", `-${c.replace("-right-","").replace("-left-","")}px`] : [c.startsWith("right") ? "right" : "left", `${c.replace("right-","").replace("left-","")}px`])) }}
              >
                ✦
              </span>
            ))}
          </div>

          <h2
            className="text-[34px] font-black text-[#1a1a1a] tracking-[-1.5px] leading-none"
            style={{ fontFamily: font }}
          >
            ¡Perfecto!
          </h2>
          <p className="text-[15px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
            Acertaste <strong className="text-[#25854f]">todos</strong> los partidos 🎉
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e4e4e0] to-transparent my-1" />

          <p className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
            ¡Eres el mejor pronosticador del grupo!
          </p>

          <button
            onClick={onDismiss}
            className="mt-2 h-11 px-8 rounded-full bg-[#3dbb78] text-white text-[14px] font-extrabold hover:bg-[#25854f] transition-all duration-200 active:scale-95 shadow-[0_4px_16px_rgba(61,187,120,0.4)]"
            style={{ fontFamily: font }}
          >
            ¡Woohoo! 🎊
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Result badge (✓ / ✗) ───────────────────────────────────────── */
function ResultBadge({ hit }) {
  return (
    <div
      className={cn(
        "absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md animate-check-pop z-20",
        hit
          ? "bg-[#3dbb78] shadow-[#3dbb78]/40"
          : "bg-[#ef4444] shadow-[#ef4444]/30"
      )}
      style={{ animationDelay: "0.15s" }}
    >
      {hit ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}

/* ─── Prediction button color configs ────────────────────────────── */
const BTN_COLORS = {
  L: {
    idle:     "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]",
    selected: "bg-[#f2fbf6] border-[#3dbb78] text-[#25854f]",
    hit:      "bg-[#3dbb78] border-[#3dbb78] text-white shadow-[0_4px_14px_rgba(61,187,120,0.45)] scale-[1.02]",
    miss:     "bg-[#fee2e2] border-[#fca5a5] text-[#ef4444]",
    correct:  "bg-[#d6f5e8] border-[#3dbb78]/60 text-[#25854f] opacity-75",
    dot:      "bg-[#3dbb78]",
  },
  E: {
    idle:     "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]",
    selected: "bg-[#fff8f0] border-[#f4a030] text-[#b87333]",
    hit:      "bg-[#f4a030] border-[#f4a030] text-white shadow-[0_4px_14px_rgba(244,160,48,0.45)] scale-[1.02]",
    miss:     "bg-[#fee2e2] border-[#fca5a5] text-[#ef4444]",
    correct:  "bg-[#fff3e0] border-[#f4a030]/60 text-[#b87333] opacity-75",
    dot:      "bg-[#f4a030]",
  },
  V: {
    idle:     "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]",
    selected: "bg-[#f0f7fc] border-[#168fe5] text-[#1069a8]",
    hit:      "bg-[#168fe5] border-[#168fe5] text-white shadow-[0_4px_14px_rgba(22,143,229,0.45)] scale-[1.02]",
    miss:     "bg-[#fee2e2] border-[#fca5a5] text-[#ef4444]",
    correct:  "bg-[#e0f0fc] border-[#168fe5]/60 text-[#1069a8] opacity-75",
    dot:      "bg-[#168fe5]",
  },
};

/* ─── Main component ──────────────────────────────────────────────── */
export function PrediccionesView({
  quiniela,
  isPending = false,
  isSinPago = false,
  onSolicitarUnirme = null,
  isJoining = false,
}) {
  const { misPredicciones, guardarPrediccion } = useStore();
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState("");
  const [saveMsgType, setSaveMsgType] = useState("success"); // "success" | "error"
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationFired = useRef(false);

  if (!quiniela) return null;

  const preds   = misPredicciones[quiniela.id] || {};
  const partidos = quiniela.matches || [];

  const totalPredicciones = Object.values(preds).filter(
    (picks) => Array.isArray(picks) && picks.length > 0
  ).length;
  const isComplete = totalPredicciones === partidos.length;

  const wildcardMatch   = partidos.find((p) => Array.isArray(preds[p.id]) && preds[p.id].length === 2);
  const wildcardMatchId = wildcardMatch?.id ?? null;

  /* ── Detect perfect score for confetti ── */
  const isPerfect = useMemo(() => {
    if (quiniela.status !== "resuelta") return false;
    if (!partidos.length) return false;
    return partidos.every((p) => {
      const result   = getResult(p.ptos_local, p.ptos_visitante);
      if (!result) return false;
      const userPick = preds[p.id] || [];
      return userPick.includes(result);
    });
  }, [partidos, preds, quiniela.status]);

  useEffect(() => {
    if (isPerfect && !celebrationFired.current) {
      celebrationFired.current = true;
      const t = setTimeout(() => setShowCelebration(true), 1300);
      return () => clearTimeout(t);
    }
  }, [isPerfect]);

  /* ── Handlers ── */
  const handlePredict = (partidoId, pick) => {
    if (isPending || isSinPago) return;
    guardarPrediccion(quiniela.id, partidoId, pick);
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (totalPredicciones === 0) {
      setSaveMsg("Selecciona al menos una predicción.");
      setSaveMsgType("error");
      return;
    }
    setSaving(true);
    setSaveMsg("");

    const payload = Object.entries(preds)
      .filter(([, picks]) => Array.isArray(picks) && picks.length > 0)
      .map(([id_partido, selecciones]) => ({ id_partido, selecciones }));

    try {
      await prediccionService.guardarBulk(payload);
      setSaveMsg("¡Predicciones guardadas!");
      setSaveMsgType("success");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al guardar. Intenta de nuevo.";
      setSaveMsg(msg);
      setSaveMsgType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  /* ── Derived: per-match results ── */
  const matchMeta = useMemo(
    () =>
      partidos.map((p) => {
        const actualResult = getResult(p.ptos_local, p.ptos_visitante);
        const matchFinished = actualResult !== null;
        const arrSeleccion  = preds[p.id] || [];
        const userPicked    = arrSeleccion.length > 0;
        const userHit       = matchFinished && userPicked && arrSeleccion.includes(actualResult);
        const userMissed    = matchFinished && userPicked && !arrSeleccion.includes(actualResult);
        return { actualResult, matchFinished, arrSeleccion, userPicked, userHit, userMissed };
      }),
    [partidos, preds]
  );

  /* ── Aggregate hit/miss counts ── */
  const finishedCount = matchMeta.filter((m) => m.matchFinished).length;
  const hitCount      = matchMeta.filter((m) => m.userHit).length;

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Confetti overlay */}
      {showCelebration && (
        <ConfettiCelebration onDismiss={() => setShowCelebration(false)} />
      )}

      <div className="flex flex-col lg:flex-row gap-8 w-full">

        {/* ── Partido list ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Inscripción banners */}
          {isSinPago && !isPending && (
            <div className="bg-[#fce4ec] border border-[#f48fb1] rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between mb-4 shadow-sm animate-fade-in-up">
              <div className="flex gap-3 text-[#1a1a1a]">
                <div className="shrink-0 flex items-center mt-1 md:mt-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1 text-[14px] font-semibold flex flex-col justify-center" style={{ fontFamily: font }}>
                  <span>Aún no estás inscrito en esta quiniela.</span>
                  <span className="text-[#6b6b6b] text-[13px] font-medium mt-0.5" style={{ fontFamily: font }}>
                    Para participar y predecir los resultados necesitas solicitar tu inscripción.
                  </span>
                </div>
              </div>
              {onSolicitarUnirme && (
                <button
                  onClick={onSolicitarUnirme}
                  disabled={isJoining}
                  className="shrink-0 bg-[#e91e63] text-white px-5 py-2.5 rounded-full font-bold text-[14px] hover:bg-opacity-90 transition disabled:opacity-50"
                  style={{ fontFamily: font }}
                >
                  {isJoining ? "Solicitando..." : "Solicitar Inscripción"}
                </button>
              )}
            </div>
          )}

          {isPending && !isSinPago && (
            <div className="bg-[#fff3e0] border border-[#f4a030] rounded-xl p-4 flex gap-3 text-[#7a4a00] mb-2 shadow-sm animate-fade-in-up">
              <div className="shrink-0 flex items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4a030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="flex-1 text-[13px] font-semibold flex items-center" style={{ fontFamily: font }}>
                Tienes una inscripción pendiente. No podrás guardar tus predicciones hasta que el administrador confirme tu pago.
              </div>
            </div>
          )}

          {/* Progress dots + hit summary */}
          <div className="flex items-center gap-3 px-2 mb-1">
            <div className="flex gap-1">
              {partidos.map((_, i) => {
                const m = matchMeta[i];
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      m.userHit    ? "bg-[#3dbb78] scale-125"
                      : m.userMissed? "bg-[#ef4444]"
                      : i < totalPredicciones ? "bg-[#3dbb78]"
                      : "bg-[#e4e4e0]"
                    )}
                  />
                );
              })}
            </div>
            <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
              {finishedCount > 0
                ? `${hitCount} aciertos de ${finishedCount} resultados`
                : `${totalPredicciones} de ${partidos.length} seleccionados`}
            </span>
          </div>

          {/* Wildcard banner */}
          <div className="flex justify-between items-center bg-[#f2f2ef] rounded-lg px-4 py-3 mb-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={wildcardMatch ? "#f4a030" : "#b0b0a8"} stroke={wildcardMatch ? "#f4a030" : "#b0b0a8"} strokeLinejoin="round" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
                {wildcardMatch
                  ? `Comodín: ${wildcardMatch.local} vs ${wildcardMatch.visitante}`
                  : "Comodín disponible — 2 selecciones en 1 partido"}
              </span>
            </div>
            <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
              {wildcardMatch ? "0" : "1"} disponibles
            </span>
          </div>

          {/* ── Partido cards ── */}
          {partidos.map((p, idx) => {
            const {
              actualResult, matchFinished,
              arrSeleccion, userPicked, userHit, userMissed,
            } = matchMeta[idx];

            const isWildcardMatch = wildcardMatchId === String(p.id);

            return (
              <div
                key={p.id}
                className={cn(
                  "bg-white border rounded-[16px] p-4 flex flex-col gap-3 relative overflow-hidden",
                  /* Result state styles */
                  matchFinished && userHit
                    ? "border-[#3dbb78] animate-hit-flash"
                    : matchFinished && userMissed
                    ? "border-[#fca5a5] bg-[#fff8f8] animate-miss-shake"
                    : matchFinished && !userPicked
                    ? "border-[#e4e4e0] bg-[#fafafa]"
                    : isWildcardMatch
                    ? "border-[#f4a030] shadow-sm bg-[#fffdfa]"
                    : arrSeleccion.length > 0
                    ? "border-[#e0e0dc] shadow-sm"
                    : "border-[#e4e4e0]"
                )}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Result badge ✓ / ✗ */}
                {matchFinished && userPicked && (
                  <ResultBadge hit={userHit} />
                )}

                {/* Wildcard label */}
                {isWildcardMatch && !matchFinished && (
                  <div className="flex items-center gap-2 bg-[#fff8f0] px-3 py-1 mb-1 rounded-md text-[#f4a030] w-fit">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f4a030" stroke="#f4a030" strokeLinejoin="round" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wide">Comodín — doble selección activa</span>
                  </div>
                )}

                {/* Header: match number + teams (+ score if finished) */}
                <div className="flex items-start gap-2 px-2">
                  <span
                    className={cn(
                      "text-[10px] font-black w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5",
                      matchFinished && userHit
                        ? "bg-[#d6f5e8] text-[#25854f]"
                        : matchFinished && userMissed
                        ? "bg-[#fee2e2] text-[#ef4444]"
                        : "bg-[#f2f2ef] text-[#6b6b6b]"
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {matchFinished ? (
                      /* Score layout */
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-[13px] font-bold truncate max-w-[80px]",
                            actualResult === "L" ? "text-[#1a1a1a] font-black" : "text-[#a0a0a0]"
                          )}
                          style={{ fontFamily: font }}
                        >
                          {p.local}
                        </span>

                        {/* Score pill */}
                        <div
                          className={cn(
                            "flex items-center gap-1 px-3 py-1 rounded-[10px] animate-score-reveal flex-shrink-0",
                            userHit
                              ? "bg-[#3dbb78] text-white"
                              : userMissed
                              ? "bg-[#1a1a1a] text-white"
                              : "bg-[#1a1a1a] text-white"
                          )}
                          style={{ animationDelay: `${idx * 40 + 100}ms` }}
                        >
                          <span className="text-[15px] font-black" style={{ fontFamily: font }}>
                            {p.ptos_local}
                          </span>
                          <span className="text-[11px] font-bold opacity-60">–</span>
                          <span className="text-[15px] font-black" style={{ fontFamily: font }}>
                            {p.ptos_visitante}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "text-[13px] font-bold truncate max-w-[80px]",
                            actualResult === "V" ? "text-[#1a1a1a] font-black" : "text-[#a0a0a0]"
                          )}
                          style={{ fontFamily: font }}
                        >
                          {p.visitante}
                        </span>
                      </div>
                    ) : (
                      /* Normal layout before match */
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] truncate" style={{ fontFamily: font }}>
                          {p.local}
                        </span>
                        <span className="text-[10px] bg-[#f2f2ef] px-1.5 py-0.5 rounded-full font-bold text-[#6b6b6b] flex-shrink-0">
                          VS
                        </span>
                        <span className="text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] truncate" style={{ fontFamily: font }}>
                          {p.visitante}
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] font-semibold text-[#a0a0a0] mt-0.5 block" style={{ fontFamily: font }}>
                      {p.fecha}
                    </span>
                  </div>
                </div>

                {/* Prediction buttons */}
                <div className="grid grid-cols-3 gap-2 mt-1 relative z-10">
                  {[
                    { key: "L", label: p.local },
                    { key: "E", label: "Empate" },
                    { key: "V", label: p.visitante },
                  ].map(({ key, label }) => {
                    const isSelected     = arrSeleccion.includes(key);
                    const isActualResult = actualResult === key;
                    const isHitBtn       = matchFinished && isSelected && isActualResult;
                    const isMissBtn      = matchFinished && isSelected && !isActualResult;
                    const isCorrectBtn   = matchFinished && !isSelected && isActualResult; // reveal correct answer

                    const c    = BTN_COLORS[key];
                    const cls  = isHitBtn ? c.hit
                               : isMissBtn ? c.miss
                               : isCorrectBtn ? c.correct
                               : isSelected ? c.selected
                               : c.idle;

                    return (
                      <button
                        key={key}
                        onClick={() => !matchFinished && handlePredict(p.id, key)}
                        disabled={matchFinished}
                        className={cn(
                          "relative h-12 flex flex-col items-center justify-center rounded-[10px] border transition-all duration-200 overflow-hidden",
                          cls,
                          matchFinished ? "cursor-default" : "active:scale-95"
                        )}
                        style={{ fontFamily: font }}
                      >
                        <span className="text-[10px] font-extrabold uppercase">{key}</span>
                        <span className="text-[11px] font-bold truncate w-full text-center px-1">
                          {label}
                        </span>

                        {/* Selected indicator dot (before match) */}
                        {isSelected && !matchFinished && (
                          <div className={cn(
                            "absolute right-1.5 top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center",
                            c.dot
                          )}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}

                        {/* "Correcto" label on revealed answer */}
                        {isCorrectBtn && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-current opacity-40 animate-scale-in" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Hit / miss verdict text */}
                {matchFinished && userPicked && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-extrabold animate-fade-in",
                      userHit ? "text-[#25854f]" : "text-[#ef4444]"
                    )}
                    style={{ fontFamily: font, animationDelay: `${idx * 40 + 200}ms` }}
                  >
                    {userHit ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3dbb78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        ¡Acierto!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        No acertaste
                      </>
                    )}
                  </div>
                )}

                {/* "Partido finalizado, no participaste" */}
                {matchFinished && !userPicked && (
                  <div className="text-[11px] font-bold text-[#a0a0a0] animate-fade-in" style={{ fontFamily: font }}>
                    Sin predicción registrada
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Floating side panel ───────────────────────────────── */}
        <div className="w-full lg:w-[300px] flex-shrink-0">
          <div className="bg-white border border-[#e4e4e0] rounded-[24px] overflow-hidden p-6 shadow-sm sticky top-6">

            {/* Circular progress */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-[70px] h-[70px] mb-2">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f2f2ef" strokeWidth="12" />
                  {/* Background track */}
                  {finishedCount > 0 && (
                    /* Hit track (green) */
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 42 * (finishedCount / Math.max(partidos.length, 1))} ${2 * Math.PI * 42}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  )}
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={isComplete && finishedCount === 0 ? "#3dbb78" : finishedCount > 0 ? "#3dbb78" : "#f4a030"}
                    strokeWidth="12"
                    strokeDasharray={`${
                      finishedCount > 0
                        ? 2 * Math.PI * 42 * (hitCount / Math.max(partidos.length, 1))
                        : 2 * Math.PI * 42 * (totalPredicciones / Math.max(partidos.length, 1))
                    } ${2 * Math.PI * 42}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-black text-[#1a1a1a] leading-none" style={{ fontFamily: font }}>
                    {finishedCount > 0 ? hitCount : totalPredicciones}
                  </span>
                  <span className="text-[8px] font-black text-[#6b6b6b]" style={{ fontFamily: font }}>
                    DE {partidos.length}
                  </span>
                </div>
              </div>
              <span className="text-[22px] font-black text-[#1a1a1a] tracking-tight" style={{ fontFamily: font }}>
                {finishedCount > 0 ? hitCount : totalPredicciones} / {partidos.length}
              </span>
              <span className="text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
                {finishedCount > 0 ? "aciertos" : "predicciones"}
              </span>
            </div>

            {/* Hit/miss summary bar (when quiniela has results) */}
            {finishedCount > 0 && (
              <div className="mb-4 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-2.5 bg-[#f2f2ef] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#3dbb78] rounded-full transition-all duration-700 animate-bar-fill"
                      style={{ "--bar-target-w": `${(hitCount / finishedCount) * 100}%`, animationFillMode: "both" }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#6b6b6b] w-8 text-right" style={{ fontFamily: font }}>
                    {Math.round((hitCount / finishedCount) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-bold" style={{ fontFamily: font }}>
                  <span className="text-[#25854f]">✓ {hitCount} aciertos</span>
                  <span className="text-[#ef4444]">✗ {finishedCount - hitCount} fallos</span>
                </div>
              </div>
            )}

            <div className="w-full h-px bg-[#e4e4e0] mb-4" />

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-center text-[12px]" style={{ fontFamily: font }}>
                <span className="font-bold text-[#6b6b6b]">Pozo</span>
                <span className="font-black text-[#1a1a1a]">{quiniela.pozo}</span>
              </div>
              <div className="flex justify-between items-center text-[12px]" style={{ fontFamily: font }}>
                <span className="font-bold text-[#6b6b6b]">Cierre</span>
                <span className="font-bold text-[#ea4335]">{quiniela.cierre}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              {saveMsg && (
                <div
                  className={cn(
                    "text-[12px] font-bold text-center rounded-[10px] px-3 py-2.5 animate-scale-in",
                    saveMsgType === "success"
                      ? "bg-[#d6f5e8] text-[#25854f] border border-[#3dbb78]/30"
                      : "bg-[#fee2e2] text-[#b91c1c] border border-red-200"
                  )}
                  style={{ fontFamily: font }}
                >
                  {saveMsgType === "success" && "✓ "}{saveMsg}
                </div>
              )}
              <PrimaryButton
                onClick={handleSave}
                disabled={saving || isPending || isSinPago || quiniela.status === "resuelta"}
                className="w-full text-[14px]"
              >
                {saving ? "Guardando..." : quiniela.status === "resuelta" ? "Quiniela finalizada" : "Guardar mis predicciones"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
