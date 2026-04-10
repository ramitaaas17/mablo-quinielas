import { useState, useEffect } from "react";
import { AdminLayout, TopBar, SectionHeader, SelectField, IconDownload, IconFile } from "../../components/admin/index.jsx";
import { adminService } from "../../services/quinielaService";
import { useStore } from "../../store";

const font = "Nunito, sans-serif";

export default function AdminReportes({ onNavigate }) {
  const { user } = useStore();
  const [quinielas, setQuinielas] = useState([]);
  const [quinielaId, setQuinielaId] = useState("");
  const [tipo, setTipo] = useState("resultados");

  useEffect(() => {
    adminService.getQuinielas().then(qs => {
      setQuinielas(qs);
      if (qs.length > 0) setQuinielaId(qs[0].id);
    }).catch(() => {});
  }, []);

  // Para descargar con token adjunto debemos usar fetch + blob
  const descargar = async (url, filename) => {
    try {
      const token = user?.token;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        alert("Error al generar el reporte. Verifica que la quiniela tenga datos.");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Error de conexión al generar el reporte.");
    }
  };

  const handleDownload = () => {
    if (!quinielaId) return;
    const q = quinielas.find(q => q.id === quinielaId);
    const nombre = q?.nombre?.replace(/\s+/g, '_') || 'reporte';

    let url;
    let filename;
    if (tipo === "resultados") {
      url = adminService.getReporteCSVUrl(quinielaId);
      filename = `${nombre}_resultados.csv`;
    } else if (tipo === "pagos") {
      url = adminService.getReportePagosCSVUrl(quinielaId);
      filename = `${nombre}_pagos.csv`;
    } else if (tipo === "posiciones") {
      url = adminService.getReportePosicionesCSVUrl(quinielaId);
      filename = `${nombre}_posiciones.csv`;
    } else if (tipo === "pdf_completo") {
      url = adminService.getReportePDFUrl(quinielaId);
      filename = `${nombre}_reporte.pdf`;
    } else {
      url = adminService.getReportePosicionesPDFUrl(quinielaId);
      filename = `${nombre}_posiciones.pdf`;
    }

    descargar(url, filename);
  };

  const TIPO_LABELS = {
    resultados: "Resultados y puntos",
    pagos: "Pagos y confirmaciones",
    posiciones: "Tabla de posiciones",
  };

  return (
    <AdminLayout active="reportes" onNavigate={onNavigate}>
      <TopBar title="Reportes" />

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_252px] gap-[18px]">
          {/* Left */}
          <div className="flex flex-col gap-5">
            {/* Downloads list */}
            <div>
              <SectionHeader title="Descargas disponibles" />
              <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden">
                {quinielas.length === 0 && (
                  <div className="px-4 py-8 text-center text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                    Sin quinielas disponibles.
                  </div>
                )}
                {quinielas.map((q) => (
                  <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b border-[#e4e4e0] last:border-b-0 hover:bg-[#fafaf8] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-[34px] h-[34px] bg-[#f2f2ef] rounded-[8px] flex items-center justify-center flex-shrink-0">
                        <IconFile size={14} color="#6b6b6b" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-[#1a1a1a] leading-none" style={{ fontFamily: font }}>{q.nombre}</div>
                        <div className="text-[11px] font-semibold text-[#6b6b6b] mt-0.5" style={{ fontFamily: font }}>
                          {q.liga_nombre} · {q.num_partidos} partidos · {q.num_jugadores} jugadores · {q.estado}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:ml-auto sm:flex-shrink-0">
                      {[
                        { label: "CSV Resultados", url: adminService.getReporteCSVUrl(q.id), file: `${q.nombre.replace(/\s+/g, '_')}_resultados.csv` },
                        { label: "CSV Pagos", url: adminService.getReportePagosCSVUrl(q.id), file: `${q.nombre.replace(/\s+/g, '_')}_pagos.csv` },
                        { label: "CSV Pos.", url: adminService.getReportePosicionesCSVUrl(q.id), file: `${q.nombre.replace(/\s+/g, '_')}_posiciones.csv` },
                        { label: "PDF Completo", url: adminService.getReportePDFUrl(q.id), file: `${q.nombre.replace(/\s+/g, '_')}_reporte.pdf` },
                        { label: "PDF Posiciones", url: adminService.getReportePosicionesPDFUrl(q.id), file: `${q.nombre.replace(/\s+/g, '_')}_posiciones.pdf` },
                      ].map(({ label, url, file }) => (
                        <button
                          key={label}
                          onClick={() => descargar(url, file)}
                          className={`h-7 px-3 rounded-full border text-[10px] font-extrabold transition-colors ${label.startsWith('PDF') ? 'border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white' : 'border-[#e4e4e0] text-[#1a1a1a] hover:bg-[#f2f2ef]'}`}
                          style={{ fontFamily: font }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Info */}
            <div className="bg-[#f2f2ef] rounded-[14px] p-5" style={{ fontFamily: font }}>
              <div className="text-[13px] font-bold text-[#1a1a1a] mb-1">¿Cómo funcionan los reportes?</div>
              <p className="text-[12px] text-[#6b6b6b]">
                Los reportes CSV son compatibles con Excel y Google Sheets. Los PDFs incluyen una tabla completa de predicciones y posiciones, listos para imprimir o compartir.
              </p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-3.5">
            {/* Generate report */}
            <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden p-px" style={{ fontFamily: font }}>
              <div className="border-b border-[#e4e4e0] px-4 py-3">
                <span className="text-[12px] font-extrabold text-[#1a1a1a]">Generar reporte</span>
              </div>
              <div className="px-4 py-4 flex flex-col gap-4">
                <SelectField
                  label="Quiniela"
                  value={quinielaId}
                  onChange={e => setQuinielaId(e.target.value)}
                  options={quinielas.map(q => ({ value: q.id, label: q.nombre }))}
                />
                <SelectField
                  label="Tipo"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  options={[
                    { value: "resultados",        label: "Resultados y puntos (CSV)" },
                    { value: "pagos",             label: "Pagos y confirmaciones (CSV)" },
                    { value: "posiciones",        label: "Tabla de posiciones (CSV)" },
                    { value: "pdf_completo",      label: "Reporte completo (PDF)" },
                    { value: "pdf_posiciones",    label: "Posiciones (PDF)" },
                  ]}
                />
                <button
                  onClick={handleDownload}
                  disabled={!quinielaId}
                  className="w-full h-[42px] bg-[#1a1a1a] text-white rounded-full text-[13px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <IconDownload size={13} color="white" />
                  Descargar
                </button>
              </div>
            </div>

            {/* Summary */}
            {quinielaId && quinielas.length > 0 && (() => {
              const q = quinielas.find(q => q.id === quinielaId);
              if (!q) return null;
              return (
                <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden p-px" style={{ fontFamily: font }}>
                  <div className="border-b border-[#e4e4e0] px-4 py-3">
                    <span className="text-[12px] font-extrabold text-[#1a1a1a]">Resumen</span>
                  </div>
                  <div className="px-4 py-3 flex flex-col">
                    {[
                      ["Quiniela", q.nombre],
                      ["Jugadores", String(q.num_jugadores)],
                      ["Partidos", String(q.num_partidos)],
                      ["Total recaudado", `$${(q.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`],
                      ["Estado", q.estado],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-center py-2 border-t border-[#e4e4e0] first:border-0">
                        <span className="text-[12px] font-bold text-[#6b6b6b]">{l}</span>
                        <span className="text-[13px] font-extrabold text-[#1a1a1a]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
