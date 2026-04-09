import { useState } from "react";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { PrimaryButton } from "./Forms";
import { prediccionService } from "../services/quinielaService";

export function PrediccionesView({ quiniela, isPending = false, isSinPago = false, onSolicitarUnirme = null, isJoining = false }) {
  const { misPredicciones, guardarPrediccion } = useStore();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  if (!quiniela) return null;

  const preds = misPredicciones[quiniela.id] || {};
  const partidos = quiniela.matches || [];

  const totalPredicciones = Object.values(preds).filter(picks => Array.isArray(picks) && picks.length > 0).length;
  const isComplete = totalPredicciones === partidos.length;

  const wildcardMatch = partidos.find(
    (p) => Array.isArray(preds[p.id]) && preds[p.id].length === 2
  );
  const wildcardMatchId = wildcardMatch?.id ?? null;

  const handlePredict = (partidoId, pick) => {
    if (isPending || isSinPago) return;
    guardarPrediccion(quiniela.id, partidoId, pick);
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (totalPredicciones === 0) {
      setSaveMsg("Selecciona al menos una predicción.");
      return;
    }

    setSaving(true);
    setSaveMsg("");

    const prediccionesPayload = Object.entries(preds)
      .filter(([, picks]) => Array.isArray(picks) && picks.length > 0)
      .map(([id_partido, selecciones]) => ({ id_partido, selecciones }));

    try {
      await prediccionService.guardarBulk(prediccionesPayload);
      setSaveMsg("¡Predicciones guardadas!");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al guardar. Intenta de nuevo.";
      setSaveMsg(msg);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Lista de Partidos */}
      <div className="flex-1 flex flex-col gap-4">

        {isSinPago && !isPending && (
          <div className="bg-[#fce4ec] border border-[#f48fb1] rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between mb-4 shadow-sm">
            <div className="flex gap-3 text-[#1a1a1a]">
              <div className="shrink-0 flex items-center mt-1 md:mt-0">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="flex-1 text-[14px] font-semibold flex flex-col justify-center" style={{ fontFamily: "Nunito, sans-serif" }}>
                <span>Aún no estás inscrito en esta quiniela.</span>
                <span className="text-[#6b6b6b] text-[13px] font-medium mt-0.5" style={{ fontFamily: "Nunito, sans-serif" }}>
                  Para participar y predecir los resultados necesitas solicitar tu inscripción.
                </span>
              </div>
            </div>
            {onSolicitarUnirme && (
              <button
                onClick={onSolicitarUnirme}
                disabled={isJoining}
                className="shrink-0 bg-[#e91e63] text-white px-5 py-2.5 rounded-full font-bold text-[14px] hover:bg-opacity-90 transition disabled:opacity-50"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {isJoining ? "Solicitando..." : "Solicitar Inscripción"}
              </button>
            )}
          </div>
        )}

        {isPending && !isSinPago && (
          <div className="bg-[#fff3e0] border border-[#f4a030] rounded-xl p-4 flex gap-3 text-[#7a4a00] mb-2 shadow-sm">
            <div className="shrink-0 flex items-center">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4a030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="flex-1 text-[13px] font-semibold flex items-center" style={{ fontFamily: "Nunito, sans-serif" }}>
              Tienes una inscripción pendiente. No podrás guardar tus predicciones hasta que el administrador confirme tu pago.
            </div>
          </div>
        )}

        {/* Barra superior de estado */}
        <div className="flex items-center gap-3 px-2 mb-1">
          <div className="flex gap-1">
            {partidos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i < totalPredicciones ? "bg-[#3dbb78]" : "bg-[#e4e4e0]"
                )}
              />
            ))}
          </div>
          <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            {totalPredicciones} de {partidos.length} seleccionados
          </span>
        </div>

        {/* Banner de Comodín */}
        <div className="flex justify-between items-center bg-[#f2f2ef] rounded-lg px-4 py-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={wildcardMatch ? "#f4a030" : "#b0b0a8"} stroke={wildcardMatch ? "#f4a030" : "#b0b0a8"} strokeLinejoin="round" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
              {wildcardMatch
                ? `Comodín: ${wildcardMatch.local} vs ${wildcardMatch.visitante}`
                : "Comodín disponible — 2 selecciones en 1 partido"}
            </span>
          </div>
          <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            {wildcardMatch ? "0" : "1"} disponibles
          </span>
        </div>

        {partidos.map((p) => {
          const arrSeleccion = preds[p.id] || [];
          const isWildcardMatch = wildcardMatchId === String(p.id);

          return (
            <div key={p.id} className={cn(
              "bg-white border rounded-[16px] p-4 flex flex-col gap-3 transition-all relative overflow-hidden",
              isWildcardMatch ? "border-[#f4a030] shadow-sm bg-[#fffdfa]" :
              arrSeleccion.length > 0 ? "border-[#e0e0dc] shadow-sm" : "border-[#e4e4e0]"
            )}>

              {isWildcardMatch && (
                <div className="flex items-center gap-2 bg-[#fff8f0] px-3 py-1 mb-1 rounded-md text-[#f4a030] w-fit">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#f4a030" stroke="#f4a030" strokeLinejoin="round" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Comodín — doble selección activa</span>
                </div>
              )}

              {/* Header del partido */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <span className="bg-[#f2f2ef] text-[#6b6b6b] text-[10px] font-black w-6 h-6 rounded-md flex items-center justify-center">
                    {partidos.indexOf(p) + 1}
                  </span>
                  <span className="text-[14px] font-bold text-[#1a1a1a]" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {p.local}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-[#f2f2ef] px-2 py-0.5 rounded-full font-bold text-[#6b6b6b]">VS</span>
                  <span className="text-[14px] font-bold text-[#1a1a1a]" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {p.visitante}
                  </span>
                  <span className="text-[11px] font-semibold text-[#a0a0a0] ml-2" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {p.fecha}
                  </span>
                </div>
              </div>

              {/* Botones de predicción */}
              <div className="grid grid-cols-3 gap-2 mt-1 relative z-10">
                {/* Local */}
                <button
                  onClick={() => handlePredict(p.id, "L")}
                  className={cn(
                    "relative h-12 flex flex-col items-center justify-center rounded-[10px] border transition-all",
                    arrSeleccion.includes("L")
                      ? "bg-[#f2fbf6] border-[#3dbb78] text-[#25854f]"
                      : "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]"
                  )}
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  <span className="text-[10px] font-extrabold uppercase">L</span>
                  <span className="text-[12px] font-bold">{p.local}</span>
                  {arrSeleccion.includes("L") && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#3dbb78] text-white rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>

                {/* Empate */}
                <button
                  onClick={() => handlePredict(p.id, "E")}
                  className={cn(
                    "relative h-12 flex flex-col items-center justify-center rounded-[10px] border transition-all",
                    arrSeleccion.includes("E")
                      ? "bg-[#fff8f0] border-[#f4a030] text-[#b87333]"
                      : "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]"
                  )}
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  <span className="text-[10px] font-extrabold uppercase">E</span>
                  <span className="text-[12px] font-bold">Empate</span>
                  {arrSeleccion.includes("E") && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f4a030] text-white rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>

                {/* Visitante */}
                <button
                  onClick={() => handlePredict(p.id, "V")}
                  className={cn(
                    "relative h-12 flex flex-col items-center justify-center rounded-[10px] border transition-all",
                    arrSeleccion.includes("V")
                      ? "bg-[#f0f7fc] border-[#168fe5] text-[#1069a8]"
                      : "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]"
                  )}
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  <span className="text-[10px] font-extrabold uppercase">V</span>
                  <span className="text-[12px] font-bold">{p.visitante}</span>
                  {arrSeleccion.includes("V") && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#168fe5] text-white rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel flotante lateral */}
      <div className="w-full lg:w-[300px] flex-shrink-0">
        <div className="bg-white border border-[#e4e4e0] rounded-[24px] overflow-hidden p-6 shadow-sm sticky top-6">

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative w-[70px] h-[70px] mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f2f2ef" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={isComplete ? "#3dbb78" : "#f4a030"}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 42 * (partidos.length > 0 ? totalPredicciones / partidos.length : 0)} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-black text-[#1a1a1a] leading-none" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {totalPredicciones}
                </span>
                <span className="text-[8px] font-black text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
                  DE {partidos.length}
                </span>
              </div>
            </div>
            <span className="text-[22px] font-black text-[#1a1a1a] tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
              {totalPredicciones} / {partidos.length}
            </span>
            <span className="text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
              predicciones
            </span>
          </div>

          <div className="w-full h-px bg-[#e4e4e0] mb-4" />

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between items-center text-[12px]" style={{ fontFamily: "Nunito, sans-serif" }}>
              <span className="font-bold text-[#6b6b6b]">Pozo</span>
              <span className="font-black text-[#1a1a1a]">{quiniela.pozo}</span>
            </div>
            <div className="flex justify-between items-center text-[12px]" style={{ fontFamily: "Nunito, sans-serif" }}>
              <span className="font-bold text-[#6b6b6b]">Cierre</span>
              <span className="font-bold text-[#ea4335]">{quiniela.cierre}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            {saveMsg && (
              <div className="text-center font-bold text-[12px] text-[#e91e63]" style={{ fontFamily: "Nunito, sans-serif" }}>
                {saveMsg}
              </div>
            )}
            <PrimaryButton
              onClick={handleSave}
              disabled={saving || isPending || isSinPago}
              className="w-full text-[14px]"
            >
              {saving ? "Guardando..." : "Guardar mis predicciones"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
