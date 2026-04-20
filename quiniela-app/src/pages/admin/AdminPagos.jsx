import { useState, useEffect, useCallback } from "react";
import {
  AdminLayout, TopBar, AdminStatCard, SectionHeader,
  Badge, Modal, InputField, SelectField, IconWarning, IconCheck
} from "../../components/admin/index.jsx";
import { adminService } from "../../services/quinielaService";

const font = "Nunito, sans-serif";

const statusStyle = {
  "confirmado": { bg: "var(--green-pale)",  text: "var(--green-dk)",     label: "Pagado" },
  "pendiente":  { bg: "var(--orange-pale)", text: "var(--orange-text)",  label: "Pendiente" },
  "rechazado":  { bg: "var(--red-pale)",    text: "var(--red)",          label: "Rechazado" },
  "sin_pago":   { bg: "var(--surface-2)",   text: "var(--text-2)",       label: "Sin pago" },
};

const avatarColors = [
  { bg: "var(--green-pale)",  text: "var(--green-dk)" },
  { bg: "var(--surface-2)",   text: "var(--blue-text)" },
  { bg: "var(--orange-pale)", text: "var(--orange-text)" },
  { bg: "var(--red-pale)",    text: "var(--purple-text)" },
];

export default function AdminPagos({ onNavigate }) {
  const [quinielas, setQuinielas] = useState([]);
  const [quinielaId, setQuinielaId] = useState("");
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [metodo, setMetodo] = useState("efectivo");
  const [nota, setNota] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [revertTarget, setRevertTarget] = useState(null);

  useEffect(() => {
    adminService.getQuinielas().then(qs => {
      setQuinielas(qs);
      if (qs.length > 0) setQuinielaId(qs[0].id);
    }).catch(() => {});
  }, []);

  const cargarPagos = useCallback(async () => {
    if (!quinielaId) return;
    setLoading(true);
    try {
      const data = await adminService.getPagos(quinielaId);
      setPagos(data);
    } catch { setPagos([]); }
    setLoading(false);
  }, [quinielaId]);

  useEffect(() => { cargarPagos(); }, [cargarPagos]);

  const quinielaActual = quinielas.find(q => q.id === quinielaId);
  const pagadosCount = pagos.filter(p => p.estado === 'confirmado').length;
  const pendientesCount = pagos.filter(p => p.estado === 'pendiente').length;
  const pozoConfirmado = pagos.filter(p => p.estado === 'confirmado').reduce((a, p) => a + p.monto, 0);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      await adminService.confirmarPago(confirmTarget.id_pago, {
        metodo,
        nota,
        monto: confirmTarget.monto,
      });
      setConfirmTarget(null);
      setNota("");
      setMetodo("efectivo");
      cargarPagos();
    } catch { }
    setConfirmLoading(false);
  };

  const handleRevertir = async () => {
    if (!revertTarget) return;
    try {
      await adminService.revertirPago(revertTarget.id_pago);
      setRevertTarget(null);
      cargarPagos();
    } catch { }
  };

  return (
    <AdminLayout active="pagos" onNavigate={onNavigate}>
      <TopBar
        title="Pagos"
        badge={quinielaActual ? `${pagadosCount} / ${pagos.length} pagados` : "—"}
      />

      {/* Stats banner */}
      <div className="bg-white border-b border-[#e4e4e0] relative overflow-hidden px-4 md:px-7 pt-7 pb-7 flex-shrink-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1400px] h-[260px] rounded-b-[415px] opacity-45 pointer-events-none"
          style={{ backgroundImage: "var(--hero-blob-img)" }} />
        <div className="relative z-10">
          <h1 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.6px]" style={{ fontFamily: font }}>
            Pagos — {quinielaActual?.nombre || "Selecciona una quiniela"}
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[12px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>Confirma los pagos. El dinero va directo al ganador.</p>
            <button onClick={cargarPagos} disabled={loading} className="text-[#25854f] font-bold text-[12px] bg-[#d6f5e8] px-2 py-0.5 rounded-full hover:bg-opacity-80 transition cursor-pointer" style={{ fontFamily: font }}>
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
          <div className="flex gap-2.5 mt-4 flex-wrap">
            <AdminStatCard label="Bolsa acumulada" value={`$${pozoConfirmado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} sub={`${pagadosCount} confirmados`} dark />
            <AdminStatCard label="Pagados"        value={String(pagadosCount)}    sub={`de ${pagos.length}`} />
            <AdminStatCard label="Pendientes"     value={String(pendientesCount)} sub="sin confirmar" accent="#f4a030" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5">
        {/* Quiniela selector */}
        {quinielas.length > 1 && (
          <div className="mb-4">
            <select
              value={quinielaId}
              onChange={e => setQuinielaId(e.target.value)}
              className="bg-white border border-[#e4e4e0] rounded-[8px] h-9 px-3 text-[13px] text-[#1a1a1a] outline-none"
              style={{ fontFamily: font }}
            >
              {quinielas.map(q => (
                <option key={q.id} value={q.id}>{q.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-[18px]">
          {/* Left: payments table */}
          <div className="flex flex-col gap-3">
            <SectionHeader title="Pagos de participantes" />

            <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-x-auto">
              <div className="min-w-[520px]">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] border-b border-[#e4e4e0] bg-[#fafaf8]">
                {["Participante", "Método", "Estado", "Acción"].map(h => (
                  <div key={h} className="px-[18px] py-2 text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]" style={{ fontFamily: font }}>{h}</div>
                ))}
              </div>

              {loading && (
                <div className="px-4 py-8 text-center text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Cargando...</div>
              )}

              {!loading && pagos.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                  {quinielaId ? "Sin pagos registrados." : "Selecciona una quiniela."}
                </div>
              )}

              {!loading && pagos.map((p, i) => {
                const av = avatarColors[i % avatarColors.length];
                const ss = statusStyle[p.estado] || statusStyle["sin_pago"];
                const isPagado   = p.estado === "confirmado";
                const isPendiente = p.estado === "pendiente";
                return (
                  <div key={p.id_pago}
                    className={`grid grid-cols-[2fr_1fr_1fr_1.5fr] border-b border-[#e4e4e0] last:border-b-0 items-center ${isPendiente ? "bg-[#fffdf5]" : ""}`}>
                    {/* Participante */}
                    <div className="px-[18px] py-3 flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                        style={{ background: av.bg, color: av.text, boxShadow: "0 0 0 1.5px var(--border)" }}>
                        {p.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1a1a1a] leading-none" style={{ fontFamily: font }}>{p.nombre}</span>
                        <span className="text-[11px] font-semibold text-[#6b6b6b] mt-0.5" style={{ fontFamily: font }}>{p.correo}</span>
                      </div>
                    </div>

                    {/* Método */}
                    <div className="px-[18px] py-3">
                      <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full"
                        style={{ background: "var(--surface-2)", color: "var(--text-2)", fontFamily: font }}>
                        {isPendiente ? "—" : (p.metodo || "—")}
                      </span>
                    </div>

                    {/* Estado */}
                    <div className="px-[18px] py-3">
                      <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full"
                        style={{ background: ss.bg, color: ss.text, fontFamily: font }}>
                        {ss.label}
                      </span>
                    </div>

                    {/* Acción */}
                    <div className="px-[18px] py-3 flex gap-2 justify-end">
                      {isPagado && (
                        <button onClick={() => setRevertTarget(p)}
                          className="h-7 px-3 rounded-full border border-[#e4e4e0] text-[11px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
                          style={{ fontFamily: font }}>
                          Revertir
                        </button>
                      )}
                      {isPendiente && (
                        <button onClick={() => { setConfirmTarget(p); setMetodo("efectivo"); setNota(""); }}
                          className="h-7 px-3 rounded-full bg-[#1a1a1a] text-white text-[11px] font-extrabold hover:bg-[#333] transition-colors flex items-center gap-1.5"
                          style={{ fontFamily: font }}>
                          <IconCheck size={10} color="white" />
                          Confirmar
                        </button>
                      )}
                      {p.estado !== 'confirmado' && p.estado !== 'pendiente' && (
                        <button onClick={() => { setConfirmTarget(p); setMetodo("efectivo"); setNota(""); }}
                          className="h-7 px-3 rounded-full bg-[#1a1a1a] text-white text-[11px] font-extrabold hover:bg-[#333] transition-colors"
                          style={{ fontFamily: font }}>
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Disclaimer */}
              <div className="border-t border-[#e4e4e0] px-[18px] py-3 flex items-center gap-2.5 bg-[#fffdf5]">
                <IconWarning size={14} color="#f4a030" />
                <span className="text-[13px] font-bold text-[#1a1a1a]" style={{ fontFamily: font }}>
                  El dinero no pasa por la plataforma.
                </span>
              </div>
              </div>{/* end min-w wrapper */}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-3.5">
            <div className="bg-white border border-[#e4e4e0] rounded-[14px] p-5 flex flex-col" style={{ fontFamily: font }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]">Pozo acumulado</span>
              <span className="text-[30px] font-black text-[#1a1a1a] tracking-[-1px] mt-1">
                ${pozoConfirmado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] font-semibold text-[#6b6b6b] mt-0.5">
                {pagadosCount} confirmados · ${quinielaActual?.precio_entrada || 0} c/u
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden p-px" style={{ fontFamily: font }}>
              <div className="border-b border-[var(--border)] px-4 py-3 bg-[var(--surface-3)]">
                <span className="text-[12px] font-extrabold text-[var(--text)]">Resumen de pagos</span>
              </div>
              <div className="px-4 py-3 flex flex-col divide-y divide-[var(--border)]">
                {[
                  { l: "Total inscritos", v: pagos.length },
                  { l: "Confirmados", v: pagadosCount, color: "var(--green-dk)" },
                  { l: "Pendientes", v: pendientesCount, color: "var(--orange-text)" },
                ].map(({ l, v, color }) => (
                  <div key={l} className="flex items-center justify-between py-2.5">
                    <span className="text-[12px] font-bold text-[var(--text-2)]">{l}</span>
                    <span className="text-[13px] font-extrabold" style={{ color: color || "var(--text)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Confirmar pago */}
      {confirmTarget && (
        <Modal onClose={() => setConfirmTarget(null)}>
          <div className="w-full sm:w-[380px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <div className="w-[42px] h-[42px] bg-[#d6f5e8] rounded-[10px] flex items-center justify-center mb-5">
              <IconCheck size={20} color="var(--green-dk)" />
            </div>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Confirmar pago</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">
              Marcas el pago de {confirmTarget.nombre} como recibido.
            </p>

            <div className="bg-[#fafaf8] border border-[#e4e4e0] rounded-[12px] p-4 flex items-center gap-3 mb-4">
              <div className="w-[38px] h-[38px] rounded-full bg-[#d6f5e8] flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
                style={{ color: "var(--green-dk)", boxShadow: "0 0 0 1.5px var(--border)" }}>
                {confirmTarget.initials}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#1a1a1a]">{confirmTarget.nombre}</div>
                <div className="text-[12px] text-[#6b6b6b]">{confirmTarget.correo}</div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-black text-[#1a1a1a]">${confirmTarget.monto}</div>
              </div>
            </div>

            <SelectField
              label="Método de pago"
              value={metodo}
              onChange={e => setMetodo(e.target.value)}
              options={[
                { value: "efectivo", label: "Efectivo" },
                { value: "transferencia", label: "Transferencia" },
                { value: "otro", label: "Otro" },
              ]}
            />

            <div className="mt-3">
              <InputField
                label="Nota (opcional)"
                placeholder="Ej: pagado en reunión del grupo"
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmTarget(null)}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirm} disabled={confirmLoading}
                className="flex-[1.5] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-60">
                {confirmLoading ? "Confirmando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Revertir pago */}
      {revertTarget && (
        <Modal onClose={() => setRevertTarget(null)}>
          <div className="w-full sm:w-[360px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <div className="w-[42px] h-[42px] bg-[#fff3e0] rounded-[10px] flex items-center justify-center mb-5">
              <IconWarning size={20} color="#f4a030" />
            </div>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Revertir confirmación</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">
              El pago de {revertTarget.nombre} volverá a estado pendiente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRevertTarget(null)}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleRevertir}
                className="flex-1 h-[42px] bg-[#d93025] text-white rounded-full text-[14px] font-extrabold hover:bg-[#b91c1c] transition-colors">
                Sí, revertir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
