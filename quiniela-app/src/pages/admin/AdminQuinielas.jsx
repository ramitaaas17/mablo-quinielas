import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminLayout, TopBar, AdminStatCard, SectionHeader, Badge, Modal,
  InputField, SelectField, IconPlus, IconWarning, MiniQuinielaCard
} from "../../components/admin/index.jsx";
import { adminService, quinielaService } from "../../services/quinielaService";

function fmtFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString('es-MX', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const font = "Nunito, sans-serif";

export default function AdminQuinielas({ onNavigate }) {
  const navigate = useNavigate();
  const [quinielas, setQuinielas] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create quiniela modal
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    nombre: "", id_liga: "", inicio: "", cierre: "", precio_entrada: "", comision: "10", imagen_fondo: ""
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit quiniela modal
  const [editTarget, setEditTarget] = useState(null);
  const [editData, setEditData] = useState({
    nombre: "", cierre: "", precio_entrada: "", comision: "", imagen_fondo: ""
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Import matches modal (from scraper)
  const [importTarget, setImportTarget] = useState(null);
  const [proximosPartidos, setProximosPartidos] = useState([]);
  const [proximosLoading, setProximosLoading] = useState(false);
  const [proximosError, setProximosError] = useState("");
  const [seleccionados, setSeleccionados] = useState({});
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  // Close quiniela confirm
  const [closeTarget, setCloseTarget] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [qs, lg] = await Promise.all([
        adminService.getQuinielas(),
        quinielaService.getLigas(),
      ]);
      setQuinielas(qs);
      setLigas(lg);
      if (!createData.id_liga && lg.length > 0) {
        setCreateData(d => ({ ...d, id_liga: lg[0].id }));
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (createData.id_liga) {
      quinielaService.getEquipos(createData.id_liga).then(setEquipos).catch(() => {});
    }
  }, [createData.id_liga]);

  const setC = (k) => (e) => {
    setCreateData(d => ({ ...d, [k]: e.target.value }));
    setCreateError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setCreateError("Solo se permiten imágenes.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir a JPEG con 80% de calidad garantiza un base64 diminuto
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCreateData(d => ({ ...d, imagen_fondo: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.onerror = () => setCreateError("Error al leer la imagen.");
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!createData.nombre || !createData.id_liga || !createData.inicio || !createData.cierre || !createData.precio_entrada) {
      setCreateError("Completa todos los campos.");
      return;
    }
    if (new Date(createData.cierre) <= new Date(createData.inicio)) {
      setCreateError("El cierre debe ser después del inicio.");
      return;
    }
    setCreateLoading(true);
    try {
      await adminService.crearQuiniela({
        nombre: createData.nombre,
        id_liga: createData.id_liga,
        inicio: createData.inicio,
        cierre: createData.cierre,
        precio_entrada: parseFloat(createData.precio_entrada),
        comision: parseFloat(createData.comision || 0),
        imagen_fondo: createData.imagen_fondo || null,
      });
      setShowCreate(false);
      setCreateData({ nombre: "", id_liga: ligas[0]?.id || "", inicio: "", cierre: "", precio_entrada: "", comision: "10", imagen_fondo: "" });
      cargar();
    } catch (err) {
      setCreateError(err?.response?.data?.error || "Error al crear quiniela.");
    }
    setCreateLoading(false);
  };

  const openEdit = (q) => {
    // Para fecha_cierre, quitar la zona horaria (Z) para <input type="datetime-local">
    let cierreIso = "";
    if (q.cierre) {
      const dt = new Date(q.cierre);
      // Ajuste básico para local
      cierreIso = new Date(dt.getTime() - (dt.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }

    setEditTarget(q);
    setEditData({
      nombre: q.nombre || "",
      cierre: cierreIso,
      precio_entrada: q.precio_entrada || "",
      comision: q.comision || "0",
      imagen_fondo: q.imagen_fondo || ""
    });
    setEditError("");
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setEditError("Solo se permiten imágenes.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setEditData(d => ({ ...d, imagen_fondo: dataUrl }));
        setEditError("");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!editData.nombre || !editData.cierre || !editData.precio_entrada) {
      setEditError("Completa los campos obligatorios.");
      return;
    }
    setEditLoading(true);
    try {
      await adminService.editarQuiniela(editTarget.id, {
        nombre: editData.nombre,
        cierre: new Date(editData.cierre).toISOString(),
        precio_entrada: parseFloat(editData.precio_entrada),
        comision: parseFloat(editData.comision || 0),
        imagen_fondo: editData.imagen_fondo || null,
      });
      setEditTarget(null);
      cargar();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Error al editar quiniela.");
    }
    setEditLoading(false);
  };

  const openImport = async (quiniela) => {
    setImportTarget(quiniela);
    setSeleccionados({});
    setImportError("");
    setProximosError("");
    setProximosLoading(true);
    try {
      const data = await adminService.getProximosPartidos();
      setProximosPartidos(data);
    } catch {
      setProximosError("No se pudo conectar con la fuente de datos. Verifica tu conexión.");
      setProximosPartidos([]);
    }
    setProximosLoading(false);
  };

  const toggleSeleccion = (idx) => {
    setSeleccionados(s => ({ ...s, [idx]: !s[idx] }));
  };

  const handleImport = async () => {
    const elegidos = proximosPartidos.filter((_, i) => seleccionados[i]);
    if (elegidos.length === 0) {
      setImportError("Selecciona al menos un partido.");
      return;
    }
    setImportLoading(true);
    try {
      const res = await adminService.importarPartidos(importTarget.id, elegidos.map(p => ({
        local: p.local,
        visitante: p.visitante,
        fecha_iso: p.fecha_iso,
      })));
      setImportTarget(null);
      cargar();
    } catch (err) {
      setImportError(err?.response?.data?.error || "Error al importar partidos.");
    }
    setImportLoading(false);
  };

  const handleClose = async () => {
    if (!closeTarget) return;
    try {
      await adminService.cerrarQuiniela(closeTarget.id);
      setCloseTarget(null);
      cargar();
    } catch { }
  };

  const abiertas = quinielas.filter(q => q.estado === 'abierta');
  const cerradas = quinielas.filter(q => q.estado === 'cerrada');
  const resueltas = quinielas.filter(q => q.estado === 'resuelta');

  return (
    <AdminLayout active="quinielas" onNavigate={onNavigate}>
      <TopBar title="Quinielas" badge={`${quinielas.length} total`} />

      {/* Stats banner */}
      <div className="bg-white border-b border-[#e4e4e0] relative overflow-hidden px-4 md:px-7 pt-7 pb-7 flex-shrink-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1400px] h-[260px] rounded-b-[415px] opacity-45 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(145deg, #f2f2ef 0%, #fde8d8 40%, #d6f5e8 100%)" }} />
        <div className="relative z-10">
          <h1 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.6px]" style={{ fontFamily: font }}>Gestión de Quinielas</h1>
          <p className="text-[12px] font-semibold text-[#6b6b6b] mt-0.5" style={{ fontFamily: font }}>Crea, edita y administra tus quinielas.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <AdminStatCard label="Abiertas"  value={String(abiertas.length)}  sub="activas ahora" />
            <AdminStatCard label="Cerradas"  value={String(cerradas.length)}  sub="sin resolver" />
            <AdminStatCard label="Resueltas" value={String(resueltas.length)} sub="finalizadas" />
            <AdminStatCard label="Total"     value={String(quinielas.length)} sub="historial" dark />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5 flex flex-col gap-6">
        {loading && <p className="text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Cargando...</p>}

        {!loading && (
          <>
            {/* Abiertas */}
            <div>
              <SectionHeader
                title="Quinielas abiertas"
                action="Nueva"
                actionIcon={<IconPlus size={11} color="white" />}
                onAction={() => setShowCreate(true)}
              />
              {abiertas.length === 0 && (
                <p className="text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Sin quinielas abiertas.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {abiertas.map((q, i) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <MiniQuinielaCard
                      title={q.nombre}
                      league={q.liga_nombre}
                      status={q.estado}
                      pozo={`$${(q.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                      pagados={`${q.pagos_confirmados || 0}/${q.num_jugadores || 0}`}
                      partidos={String(q.num_partidos || 0)}
                      cierre={q.cierre ? new Date(q.cierre).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}
                      accentColor={["green", "orange", "pink"][i % 3]}
                      onVer={() => onNavigate && onNavigate("pagos")}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate("/tabla", { state: { quinielaId: q.id } })}
                        className="w-8 h-7 rounded-[8px] flex items-center justify-center border border-[#e4e4e0] bg-white text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
                        title="Previsualizar Portada">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button onClick={() => openEdit(q)}
                        className="w-8 h-7 rounded-[8px] flex items-center justify-center border border-[#e4e4e0] bg-white text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
                        title="Editar Quiniela">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => openImport(q)}
                        className="flex-1 h-7 rounded-[8px] border border-[#e4e4e0] text-[10px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
                        style={{ fontFamily: font }}>
                        + Partidos
                      </button>
                      <button onClick={() => setCloseTarget(q)}
                        className="flex-1 h-7 rounded-[8px] border border-[#e4e4e0] text-[10px] font-extrabold text-[#6b6b6b] hover:bg-[#fee2e2] hover:border-red-200 hover:text-red-600 transition-colors"
                        style={{ fontFamily: font }}>
                        Cerrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial */}
            {(cerradas.length > 0 || resueltas.length > 0) && (
              <div>
                <SectionHeader title="Historial" />
                <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden">
                  <table className="w-full" style={{ fontFamily: font }}>
                    <thead>
                      <tr className="border-b border-[#e4e4e0]">
                        {["Nombre", "Liga", "Partidos", "Jugadores", "Pozo", "Estado"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...cerradas, ...resueltas].map(q => (
                        <tr key={q.id} className="border-b border-[#e4e4e0] last:border-b-0 hover:bg-[#fafaf8]">
                          <td className="px-3 py-3 text-[13px] font-bold text-[#1a1a1a]">{q.nombre}</td>
                          <td className="px-3 py-3 text-[12px] text-[#6b6b6b]">{q.liga_nombre}</td>
                          <td className="px-3 py-3 text-[12px] text-center font-bold text-[#1a1a1a]">{q.num_partidos}</td>
                          <td className="px-3 py-3 text-[12px] text-center font-bold text-[#1a1a1a]">{q.num_jugadores}</td>
                          <td className="px-3 py-3 text-[12px] font-bold text-[#1a1a1a]">
                            ${(q.pozo_acumulado || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-3 py-3"><Badge label={q.estado} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Crear quiniela */}
      {showCreate && (
        <Modal onClose={() => { setShowCreate(false); setCreateError(""); }}>
          <div className="w-full sm:w-[440px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Nueva quiniela</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">Configura los datos de la nueva quiniela.</p>

            <div className="flex flex-col gap-4">
              <InputField label="Nombre *" placeholder="Jornada 13 — Liga MX" value={createData.nombre} onChange={setC("nombre")} />
              <SelectField
                label="Liga *"
                value={createData.id_liga}
                onChange={setC("id_liga")}
                options={ligas.map(l => ({ value: l.id, label: `${l.nombre} (${l.pais})` }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Inicio *" type="datetime-local" value={createData.inicio} onChange={setC("inicio")} />
                <InputField label="Cierre *" type="datetime-local" value={createData.cierre} onChange={setC("cierre")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Precio entrada ($) *" type="number" placeholder="100" value={createData.precio_entrada} onChange={setC("precio_entrada")} />
                <InputField label="Comisión (%)" type="number" placeholder="10" value={createData.comision} onChange={setC("comision")} />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6b6b6b] uppercase tracking-[0.4px]">Foto de fondo (opcional)</label>
                <div className="relative border border-[#e4e4e0] rounded-[10px] bg-[#fafaf8] overflow-hidden flex items-center p-2 group hover:border-[#6b6b6b] transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-3 px-2 flex-col w-full">
                    {createData.imagen_fondo ? (
                      <div className="w-full flex items-center justify-between">
                        <img src={createData.imagen_fondo} alt="Preview" className="h-10 w-auto rounded object-cover border border-[#e4e4e0]" />
                        <span className="text-[11px] font-bold text-[#3dbb78]">¡Foto cargada! (Cambiar)</span>
                      </div>
                    ) : (
                      <span className="text-[13px] font-semibold text-[#1a1a1a] text-center w-full">Click para adjuntar foto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {createError && (
              <p className="mt-3 text-[12px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[8px] px-3 py-2">{createError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={createLoading}
                className="flex-[2] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-60">
                {createLoading ? "Creando..." : "Crear quiniela"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Editar quiniela */}
      {editTarget && (
        <Modal onClose={() => { setEditTarget(null); setEditError(""); }}>
          <div className="w-full sm:w-[440px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Editar quiniela</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">Modifica los detalles de la quiniela {editTarget.nombre}.</p>

            <div className="flex flex-col gap-4">
              <InputField label="Nombre *" value={editData.nombre} onChange={(e) => {setEditData(d => ({ ...d, nombre: e.target.value })); setEditError("");}} />
              
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Cierre *" type="datetime-local" value={editData.cierre} onChange={(e) => {setEditData(d => ({ ...d, cierre: e.target.value })); setEditError("");}} />
                <InputField label="Precio ($) *" type="number" value={editData.precio_entrada} onChange={(e) => {setEditData(d => ({ ...d, precio_entrada: e.target.value })); setEditError("");}} />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#6b6b6b] uppercase tracking-[0.4px]">Foto de fondo (opcional)</label>
                <div className="relative border border-[#e4e4e0] rounded-[10px] bg-[#fafaf8] overflow-hidden flex items-center p-2 group hover:border-[#6b6b6b] transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-3 px-2 flex-col w-full">
                    {editData.imagen_fondo ? (
                      <div className="w-full flex items-center justify-between">
                        <img src={editData.imagen_fondo} alt="Preview" className="h-10 w-auto rounded object-cover border border-[#e4e4e0]" />
                        <span className="text-[11px] font-bold text-[#3dbb78]">¡Foto lista! (Cambiar)</span>
                      </div>
                    ) : (
                      <span className="text-[13px] font-semibold text-[#1a1a1a] text-center w-full">Click para adjuntar foto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {editError && (
              <p className="mt-3 text-[12px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[8px] px-3 py-2">{editError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditTarget(null); setEditError(""); }}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleEdit} disabled={editLoading}
                className="flex-[2] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-60">
                {editLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Importar partidos desde Liga MX */}
      {importTarget && (
        <Modal onClose={() => { setImportTarget(null); setImportError(""); }}>
          <div className="w-full sm:w-[560px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Importar partidos de Liga MX</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">
              {importTarget.nombre} — selecciona los partidos que quieres incluir.
            </p>

            {proximosLoading && (
              <div className="py-8 text-center text-[13px] text-[#6b6b6b]">
                Cargando partidos desde SofaScore...
              </div>
            )}

            {!proximosLoading && proximosError && (
              <div className="py-4 text-center text-[13px] font-semibold text-[#b91c1c] bg-[#fee2e2] rounded-[10px] px-4">
                {proximosError}
              </div>
            )}

            {!proximosLoading && !proximosError && proximosPartidos.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[#6b6b6b]">
                No hay próximos partidos disponibles en este momento.
              </div>
            )}

            {!proximosLoading && proximosPartidos.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-[0.4px]">
                    {proximosPartidos.length} partidos disponibles
                  </span>
                  <button
                    onClick={() => {
                      const allSelected = proximosPartidos.every((_, i) => seleccionados[i]);
                      if (allSelected) {
                        setSeleccionados({});
                      } else {
                        const all = {};
                        proximosPartidos.forEach((_, i) => { all[i] = true; });
                        setSeleccionados(all);
                      }
                    }}
                    className="text-[11px] font-bold text-[#3dbb78] hover:underline"
                  >
                    {proximosPartidos.every((_, i) => seleccionados[i]) ? "Deseleccionar todo" : "Seleccionar todo"}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[46vh] overflow-y-auto pr-1">
                  {proximosPartidos.map((p, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                        seleccionados[i]
                          ? "border-[#3dbb78] bg-[#f0fdf4]"
                          : "border-[#e4e4e0] bg-[#fafaf8] hover:bg-[#f2f2ef]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!seleccionados[i]}
                        onChange={() => toggleSeleccion(i)}
                        className="w-4 h-4 accent-[#3dbb78] flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#1a1a1a]">
                          {p.local} <span className="font-normal text-[#6b6b6b]">vs</span> {p.visitante}
                        </div>
                        <div className="text-[11px] font-semibold text-[#6b6b6b] mt-0.5">
                          {fmtFecha(p.fecha_iso)}{p.jornada ? ` · ${p.jornada}` : ""}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {importError && (
              <p className="mt-3 text-[12px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[8px] px-3 py-2">
                {importError}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setImportTarget(null); setImportError(""); }}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importLoading || proximosLoading || Object.values(seleccionados).filter(Boolean).length === 0}
                className="flex-[2] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                {importLoading
                  ? "Importando..."
                  : `Importar ${Object.values(seleccionados).filter(Boolean).length} partido(s)`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Cerrar quiniela */}
      {closeTarget && (
        <Modal onClose={() => setCloseTarget(null)}>
          <div className="w-full sm:w-[360px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <div className="w-[42px] h-[42px] bg-[#fff3e0] rounded-[10px] flex items-center justify-center mb-5">
              <IconWarning size={20} color="#f4a030" />
            </div>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Cerrar quiniela</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">
              "{closeTarget.nombre}" ya no aceptará nuevas predicciones ni inscripciones.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCloseTarget(null)}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleClose}
                className="flex-1 h-[42px] bg-[#d93025] text-white rounded-full text-[14px] font-extrabold hover:bg-[#b91c1c] transition-colors">
                Sí, cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
