import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Trash2, X, Check, Loader2, ZoomIn, ZoomOut, RotateCw, ChevronDown } from "lucide-react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Navbar, StatCard } from "../components";
import { useStore } from "../store";
import { authService } from "../services/authService";
import { quinielaService } from "../services/quinielaService";

const font = "Nunito, sans-serif";

// Backend base URL for resolving /uploads/ paths
const API_BASE = import.meta.env.VITE_API_URL || "";

function resolvePhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${API_BASE}${path}`;
}

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Avatar reutilizable ──────────────────────────────────────────────────────
export function Avatar({ foto, iniciales, size = 80, border = 3, fontSize = 28, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const resolvedFoto = resolvePhotoUrl(foto);

  // Reset error state when the photo URL changes
  useLayoutEffect(() => { setImgError(false); }, [resolvedFoto]);

  if (resolvedFoto && !imgError) {
    return (
      <img
        src={resolvedFoto}
        alt="Foto de perfil"
        decoding="async"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${border}px solid #3dbb78`,
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
        className={className}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#d6f5e8",
        border: `${border}px solid #3dbb78`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 800,
        color: "#25854f",
        flexShrink: 0,
        fontFamily: font,
        userSelect: "none",
      }}
      className={className}
    >
      {iniciales || "U"}
    </div>
  );
}

// ─── Extrae el área recortada del canvas y devuelve data-URL comprimida ───────
async function getCroppedDataUrl(imgEl, crop, scale, rotate) {
  const canvas = document.createElement("canvas");
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  const outputSize = 480;
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropW = crop.width * scaleX;
  const cropH = crop.height * scaleY;

  ctx.save();
  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-outputSize / 2, -outputSize / 2);
  ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, outputSize, outputSize);
  ctx.restore();

  // Comprimir iterativamente hasta <260 KB
  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 260 * 1024 * 1.37 && quality > 0.3) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

// ─── Modal de recorte ─────────────────────────────────────────────────────────
function CropModal({ srcUrl, onConfirm, onCancel }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [processing, setProcessing] = useState(false);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const side = Math.min(width, height);
    const c = centerCrop(
      makeAspectCrop({ unit: "px", width: side * 0.85 }, 1, width, height),
      width,
      height,
    );
    setCrop(c);
    setCompletedCrop(c);
  }

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop) return;
    setProcessing(true);
    try {
      const dataUrl = await getCroppedDataUrl(imgRef.current, completedCrop, scale, rotate);
      onConfirm(dataUrl);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        style={{ fontFamily: font, maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e4e0]">
          <div>
            <p className="text-[11px] font-extrabold text-[#3dbb78] uppercase tracking-widest">Foto de perfil</p>
            <h2 className="text-[17px] font-black text-[#1a1a1a] leading-tight">Recortar imagen</h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#f2f2ef] hover:bg-[#e4e4e0] flex items-center justify-center transition-colors"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="flex-1 overflow-auto bg-[#111] flex items-center justify-center p-4"
          style={{ minHeight: 0 }}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            keepSelection
            minWidth={60}
            style={{ maxHeight: "60vh" }}
          >
            <img
              ref={imgRef}
              src={srcUrl}
              alt="Recortar"
              onLoad={onImageLoad}
              style={{
                maxHeight: "60vh",
                maxWidth: "100%",
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                transformOrigin: "center",
              }}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-t border-[#e4e4e0] bg-[#fafaf8]">
          <div className="flex items-center gap-3 mb-3">
            <ZoomOut size={14} color="#6b6b6b" />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-[#3dbb78] h-1.5"
            />
            <ZoomIn size={14} color="#6b6b6b" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRotate((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#6b6b6b] border border-[#e4e4e0] px-3 h-8 rounded-full hover:bg-[#f2f2ef] transition-colors"
            >
              <RotateCw size={12} strokeWidth={2.5} /> Rotar
            </button>
            <div className="flex-1" />
            <button
              onClick={onCancel}
              className="text-[13px] font-bold text-[#6b6b6b] px-4 h-9 rounded-full hover:bg-[#f2f2ef] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex items-center gap-1.5 bg-[#1a1a1a] text-white text-[13px] font-black px-5 h-9 rounded-full hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {processing ? (
                <><Loader2 size={13} className="animate-spin" /> Procesando…</>
              ) : (
                <><Check size={13} strokeWidth={2.5} /> Confirmar</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Botones de foto ───────────────────────────────────────────────────────────
function PhotoActions({ hasPhoto, hasPreview, uploading, onSelect, onSave, onCancel, onDelete, uploadMsg }) {
  return (
    <div className="flex flex-col items-center gap-2 mt-1" style={{ fontFamily: font }}>
      {hasPreview ? (
        /* Preview pendiente de guardar */
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-[#1a1a1a] text-white text-[12px] font-extrabold px-4 h-8 rounded-full hover:bg-[#333] active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {uploading
              ? <><Loader2 size={12} className="animate-spin" /> Subiendo…</>
              : <><Check size={12} strokeWidth={2.5} /> Guardar foto</>}
          </button>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#6b6b6b] border border-[#e4e4e0] bg-white px-3.5 h-8 rounded-full hover:bg-[#f2f2ef] active:scale-95 transition-all disabled:opacity-50"
          >
            <X size={12} strokeWidth={2.5} /> Cancelar
          </button>
        </div>
      ) : hasPhoto ? (
        /* Foto guardada — opciones cambiar / eliminar */
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="flex items-center gap-1.5 text-[12px] font-extrabold text-white bg-[#3dbb78] px-3.5 h-8 rounded-full hover:bg-[#2da865] active:scale-95 transition-all shadow-sm shadow-[#3dbb78]/30"
          >
            <Camera size={12} strokeWidth={2} /> Cambiar
          </button>
          <button
            onClick={onDelete}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#b91c1c] bg-[#fff1f2] border border-[#fca5a5] px-3.5 h-8 rounded-full hover:bg-[#fee2e2] active:scale-95 transition-all disabled:opacity-50"
          >
            {uploading
              ? <Loader2 size={12} className="animate-spin" />
              : <Trash2 size={12} strokeWidth={2} />}
            Eliminar
          </button>
        </div>
      ) : (
        /* Sin foto */
        <button
          onClick={onSelect}
          className="flex items-center gap-1.5 text-[12px] font-extrabold text-white bg-[#1a1a1a] px-4 h-8 rounded-full hover:bg-[#333] active:scale-95 transition-all shadow-sm"
        >
          <Camera size={12} strokeWidth={2} /> Subir foto
        </button>
      )}

      {uploadMsg && (
        <span
          className={`text-[11px] font-bold ${uploadMsg.ok ? "text-[#3dbb78]" : "text-[#b91c1c]"}`}
        >
          {uploadMsg.text}
        </span>
      )}
    </div>
  );
}

// ─── Editor de equipo favorito ────────────────────────────────────────────────
function EquipoEdit({ currentId, currentNombre, onSaved }) {
  const [open, setOpen] = useState(false);
  const [ligas, setLigas] = useState([]);
  const [ligaId, setLigaId] = useState("");
  const [equipos, setEquipos] = useState([]);
  const [selectedId, setSelectedId] = useState(currentId || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!open) return;
    quinielaService.getLigas().then((ls) => {
      setLigas(ls);
      if (ls.length === 1) setLigaId(ls[0].id);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!ligaId) { setEquipos([]); return; }
    setLoading(true);
    quinielaService.getEquipos(ligaId).then(setEquipos).catch(() => setEquipos([])).finally(() => setLoading(false));
  }, [ligaId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await authService.actualizarPerfil({ equipo_favorito: selectedId || null });
      onSaved(res);
      setMsg({ ok: true, text: "¡Equipo actualizado!" });
      setTimeout(() => { setOpen(false); setMsg(null); }, 1200);
    } catch {
      setMsg({ ok: false, text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const baseSelect = "w-full h-[42px] px-3 bg-[#fafaf8] border border-[#e4e4e0] rounded-[12px] text-[13px] font-semibold text-[#1a1a1a] outline-none focus:border-[#3dbb78] focus:ring-2 focus:ring-[#3dbb78]/20 appearance-none cursor-pointer transition-all";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[12px] font-extrabold text-[#3dbb78] hover:underline transition-all"
        style={{ fontFamily: font }}
      >
        <ChevronDown size={12} strokeWidth={2.5} />
        {currentNombre ? "Cambiar" : "Elegir equipo"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      {ligas.length > 1 && (
        <select className={baseSelect} style={{ fontFamily: font }} value={ligaId} onChange={(e) => { setLigaId(e.target.value); setSelectedId(""); }}>
          <option value="">Liga...</option>
          {ligas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
      )}
      <select className={baseSelect} style={{ fontFamily: font }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={!ligaId || loading}>
        <option value="">{loading ? "Cargando..." : "Sin equipo"}</option>
        {equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      {msg && (
        <span className={`text-[11px] font-bold ${msg.ok ? "text-[#3dbb78]" : "text-[#b91c1c]"}`} style={{ fontFamily: font }}>
          {msg.text}
        </span>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-8 bg-[#1a1a1a] text-white text-[12px] font-extrabold rounded-full hover:bg-[#333] transition-colors disabled:opacity-50"
          style={{ fontFamily: font }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={() => { setOpen(false); setMsg(null); }}
          className="px-4 h-8 text-[12px] font-bold text-[#6b6b6b] border border-[#e4e4e0] rounded-full hover:bg-[#f2f2ef] transition-colors"
          style={{ fontFamily: font }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Página de perfil ─────────────────────────────────────────────────────────
export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [foto, setFoto] = useState(null);       // URL guardada en servidor
  const [preview, setPreview] = useState(null); // data-URL recortada lista para guardar
  const [cropSrc, setCropSrc] = useState(null); // imagen original para el cropper
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      authService.perfil().catch(() => null),
      authService.stats().catch(() => null),
    ]).then(([p, s]) => {
      if (!mounted) return;
      if (p) { setPerfil(p); setFoto(p.foto_perfil || null); }
      if (s) setStats(s);
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const nombre = perfil?.nombre_completo || `${user?.nombre || ""} ${user?.apellido || ""}`;
  const partes = nombre.trim().split(" ");
  const iniciales = partes.map((p) => p[0]?.toUpperCase() || "").join("").slice(0, 2);
  const fotoActual = preview || foto;

  function abrirSelector() { inputRef.current?.click(); }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: "La imagen no puede superar 50 MB" });
      return;
    }
    setUploadMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function onCropConfirm(dataUrl) {
    setPreview(dataUrl);
    setCropSrc(null);
  }

  const guardarFoto = useCallback(async () => {
    if (!preview) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await authService.actualizarFoto(preview);
      setFoto(res.foto_perfil);
      setPreview(null);
      setUploadMsg({ ok: true, text: "¡Foto actualizada!" });
    } catch {
      setUploadMsg({ ok: false, text: "Error al subir la foto" });
    } finally {
      setUploading(false);
    }
  }, [preview]);

  function cancelarPreview() {
    setPreview(null);
    setUploadMsg(null);
  }

  async function eliminarFoto() {
    setUploading(true);
    setUploadMsg(null);
    try {
      await authService.actualizarFoto("");
      setFoto(null);
      setPreview(null);
      setUploadMsg({ ok: true, text: "Foto eliminada" });
    } catch {
      setUploadMsg({ ok: false, text: "Error al eliminar" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {cropSrc && (
        <CropModal
          srcUrl={cropSrc}
          onConfirm={onCropConfirm}
          onCancel={() => { setCropSrc(null); setUploadMsg(null); }}
        />
      )}

      <div className="min-h-screen bg-[#fafaf8] flex flex-col">
        <Navbar variant="app" showWeek />

        {/* Profile header */}
        <div className="relative bg-white border-b border-[#e4e4e0] overflow-hidden animate-fade-in">
          <div
            className="absolute -top-30 -left-10 md:-left-30 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full opacity-40 pointer-events-none animate-breathe"
            style={{ backgroundImage: "var(--hero-blob-img)" }}
          />
          <div className="relative z-10 px-6 sm:px-10 lg:px-[90px] py-8 flex flex-col md:flex-row items-start md:items-center gap-6">

            {/* Avatar editable */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
              {/* Avatar con overlay cámara */}
              <div className="relative group mb-3">
                <div
                  className="rounded-full"
                  style={{
                    width: 84,
                    height: 84,
                    boxShadow: "0 0 0 3px #3dbb78, 0 4px 20px rgba(61,187,120,0.25)",
                  }}
                >
                  <Avatar
                    foto={fotoActual}
                    iniciales={iniciales}
                    size={84}
                    border={0}
                    className="animate-scale-in"
                  />
                </div>
                <button
                  onClick={abrirSelector}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Cambiar foto"
                  aria-label="Cambiar foto de perfil"
                >
                  <Camera size={22} color="white" strokeWidth={2} />
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>

              {/* Botones de acción de foto */}
              <PhotoActions
                hasPhoto={!!foto && !preview}
                hasPreview={!!preview}
                uploading={uploading}
                onSelect={abrirSelector}
                onSave={guardarFoto}
                onCancel={cancelarPreview}
                onDelete={eliminarFoto}
                uploadMsg={uploadMsg}
              />
            </div>

            <div className="flex-1">
              <h2
                className="text-[26px] md:text-[30px] font-black text-[#1a1a1a] tracking-[-1px] leading-none"
                style={{ fontFamily: font }}
              >
                {nombre}
              </h2>
              <p className="text-[14px] font-medium text-[#6b6b6b] mt-1" style={{ fontFamily: font }}>
                {perfil?.correo || user?.correo}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span
                  className="bg-[#d6f5e8] text-[#25854f] text-[11px] font-extrabold px-3 h-[23px] rounded-full inline-flex items-center"
                  style={{ fontFamily: font }}
                >
                  Activo
                </span>
                {perfil?.equipo_favorito_nombre && (
                  <span
                    className="bg-[#d6f5e8] text-[#25854f] text-[11px] font-extrabold px-3 h-[23px] rounded-full inline-flex items-center"
                    style={{ fontFamily: font }}
                  >
                    Equipo favorito: {perfil.equipo_favorito_nombre}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-10 lg:px-[90px] xl:px-[130px] py-8 flex flex-col lg:flex-row gap-8">
          {/* Stats */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span
                className="text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.6px] text-[#6b6b6b] whitespace-nowrap"
                style={{ fontFamily: font }}
              >
                Estadísticas
              </span>
              <div className="flex-1 h-px bg-[#e4e4e0]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Quinielas jugadas" value={String(stats?.total_participaciones || 0)} />
              <StatCard label="Puntos totales" value={String(stats?.total_puntos || 0)} />
              <div className="bg-white border border-[#e4e4e0] rounded-[20px] px-5 sm:px-[22px] py-4 flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                  Mejor posición
                </span>
                <span className="text-[24px] sm:text-[28px] font-black tracking-tight leading-none text-[#1a1a1a]" style={{ fontFamily: font }}>
                  {stats?.mejor_posicion ? `#${stats.mejor_posicion}` : "—"}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
                  en una quiniela
                </span>
              </div>
              <div className="bg-white border border-[#e4e4e0] rounded-[20px] px-5 sm:px-[22px] py-4 flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5px] text-[#6b6b6b]" style={{ fontFamily: font }}>
                  Jugadores rivales
                </span>
                <span className="text-[24px] sm:text-[28px] font-black tracking-tight leading-none text-[#1a1a1a]" style={{ fontFamily: font }}>
                  {stats?.total_jugadores || "—"}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#6b6b6b]" style={{ fontFamily: font }}>
                  en quinielas activas
                </span>
              </div>
            </div>
          </div>

          {/* Account data */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-white border border-[#e4e4e0] rounded-[20px] overflow-hidden">
              <div className="border-b border-[#e4e4e0] px-5 py-4 bg-[#fafaf8]">
                <span className="text-[13px] font-extrabold text-[#1a1a1a]" style={{ fontFamily: font }}>
                  Datos de cuenta
                </span>
              </div>
              <div className="p-5 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
                    Nombre completo
                  </span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]" style={{ fontFamily: font }}>
                    {nombre}
                  </span>
                </div>
                {[
                  { label: "Correo", value: perfil?.correo || user?.correo || "—" },
                  { label: "Fecha de nacimiento", value: formatFecha(perfil?.fecha_nacimiento) },
                  { label: "Miembro desde", value: formatFecha(perfil?.fecha_creacion) },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center py-2.5 border-t border-[#e4e4e0]">
                    <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
                      {r.label}
                    </span>
                    <span
                      className="text-[13px] font-semibold text-[#1a1a1a] text-right max-w-[160px] truncate"
                      style={{ fontFamily: font }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
                {/* Equipo favorito — editable */}
                <div className="flex flex-col py-2.5 border-t border-[#e4e4e0] gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-[#6b6b6b]" style={{ fontFamily: font }}>
                      Equipo favorito
                    </span>
                    <span className="text-[13px] font-semibold text-[#1a1a1a]" style={{ fontFamily: font }}>
                      {perfil?.equipo_favorito_nombre || "Sin equipo"}
                    </span>
                  </div>
                  <EquipoEdit
                    currentId={perfil?.equipo_favorito || ""}
                    currentNombre={perfil?.equipo_favorito_nombre || ""}
                    onSaved={(updated) => setPerfil((p) => ({ ...p, ...updated }))}
                  />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={handleLogout}
                    className="border border-[#e4e4e0] text-[#1a1a1a] text-[13px] font-extrabold h-11 rounded-full hover:bg-[#fee2e2] hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                    style={{ fontFamily: font }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
