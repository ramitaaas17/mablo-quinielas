import { useState, useEffect, useCallback } from "react";
import {
  AdminLayout, TopBar, AdminStatCard, SectionHeader,
  Badge, Modal, InputField, SelectField,
  IconPlus, IconSearch, IconTrash, IconWarning
} from "../../components/admin/index.jsx";
import { adminService } from "../../services/quinielaService";
import { quinielaService } from "../../services/quinielaService";

const font = "Nunito, sans-serif";

export default function AdminParticipantes({ onNavigate }) {
  const [usuarios, setUsuarios] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: "", apellido: "", usuario: "", correo: "",
    password: "", fecha: "", equipo: "",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [us, ligas] = await Promise.all([
        adminService.getUsuarios(),
        quinielaService.getLigas(),
      ]);
      setUsuarios(us);

      if (ligas.length > 0) {
        const eqs = await quinielaService.getEquipos(ligas[0].id);
        setEquipos(eqs);
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (k) => (e) => {
    setNewUser(p => ({ ...p, [k]: e.target.value }));
    setAddError("");
  };

  const handleAdd = async () => {
    if (!newUser.nombre || !newUser.apellido || !newUser.usuario || !newUser.correo || !newUser.password || !newUser.fecha) {
      setAddError("Completa todos los campos obligatorios.");
      return;
    }
    setAddLoading(true);
    try {
      const equipoSeleccionado = equipos.find(e => e.nombre === newUser.equipo);
      await adminService.crearUsuario({
        nombre_completo: `${newUser.nombre.trim()} ${newUser.apellido.trim()}`,
        username: newUser.usuario.trim(),
        correo: newUser.correo.trim().toLowerCase(),
        contrasena: newUser.password,
        fecha_nacimiento: newUser.fecha,
        equipo_favorito: equipoSeleccionado?.id || null,
      });
      setShowAdd(false);
      setNewUser({ nombre: "", apellido: "", usuario: "", correo: "", password: "", fecha: "", equipo: "" });
      cargar();
    } catch (err) {
      setAddError(err?.response?.data?.error || "Error al agregar participante.");
    }
    setAddLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.eliminarUsuario(deleteTarget.id);
      setDeleteTarget(null);
      cargar();
    } catch { }
  };

  const filtered = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.correo.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = [
    { bg: "#d6f5e8", text: "#25854f" },
    { bg: "#f2f2ef", text: "#1d4ed8" },
    { bg: "#fde8d8", text: "#a05a00" },
    { bg: "#fce8e8", text: "#7c3aed" },
  ];

  return (
    <AdminLayout active="participantes" onNavigate={onNavigate}>
      <TopBar title="Participantes" badge={`${usuarios.length} usuarios`} />

      {/* Stats banner */}
      <div className="bg-white border-b border-[#e4e4e0] relative overflow-hidden px-4 md:px-7 pt-7 pb-7 flex-shrink-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1400px] h-[260px] rounded-b-[415px] opacity-45 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(145deg, #f2f2ef 0%, #fde8d8 40%, #d6f5e8 100%)" }} />
        <div className="relative z-10">
          <h1 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.6px]" style={{ fontFamily: font }}>Participantes</h1>
          <p className="text-[12px] font-semibold text-[#6b6b6b] mt-0.5" style={{ fontFamily: font }}>Gestiona los usuarios registrados.</p>
          <div className="flex gap-2.5 mt-4 flex-wrap">
            <AdminStatCard label="Total participantes" value={String(usuarios.length)} sub="registrados" />
            <AdminStatCard label="En quinielas" value={String(usuarios.filter(u => u.num_quinielas > 0).length)} sub="activos" />
            <AdminStatCard label="Sin quinielas" value={String(usuarios.filter(u => u.num_quinielas === 0).length)} sub="sin actividad" accent="#f4a030" />
          </div>
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5">
        <SectionHeader
          title="Lista de participantes"
          action="Agregar"
          actionIcon={<IconPlus size={11} color="white" />}
          onAction={() => setShowAdd(true)}
        />

        {/* Search */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconSearch size={13} color="#aaa" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, usuario o correo..."
              className="w-full bg-white border border-[#e4e4e0] rounded-[8px] h-9 pl-8 pr-3 text-[13px] text-[#1a1a1a] outline-none focus:border-[#3dbb78] transition-all"
              style={{ fontFamily: font }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e4e4e0] rounded-[14px] overflow-hidden">
          {loading && (
            <div className="px-4 py-8 text-center text-[13px] text-[#6b6b6b]" style={{ fontFamily: font }}>Cargando...</div>
          )}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]" style={{ fontFamily: font }}>
              <thead>
                <tr className="border-b border-[#e4e4e0]">
                  {["Participante", "Correo", "Equipo favorito", "Quinielas", "Pts", "Registro", "Acciones"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[13px] text-[#6b6b6b]">Sin resultados.</td></tr>
                )}
                {filtered.map((u, i) => {
                  const av = avatarColors[i % avatarColors.length];
                  const fecha = new Date(u.fecha_creacion).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
                  return (
                    <tr key={u.id} className="border-b border-[#e4e4e0] last:border-b-0 hover:bg-[#fafaf8] transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                            style={{ background: av.bg, color: av.text, boxShadow: "0 0 0 1.5px #e4e4e0" }}>
                            {u.initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#1a1a1a] leading-none">{u.nombre}</span>
                            <span className="text-[11px] font-semibold text-[#6b6b6b] mt-0.5">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-[#6b6b6b]">{u.correo}</td>
                      <td className="px-3 py-3 text-[12px] text-[#1a1a1a] font-semibold">{u.equipo_favorito || "—"}</td>
                      <td className="px-3 py-3 text-[13px] font-black text-[#1a1a1a] text-center">{u.num_quinielas}</td>
                      <td className="px-3 py-3 text-[13px] font-black text-[#1a1a1a] text-center">{u.total_puntos}</td>
                      <td className="px-3 py-3 text-[12px] text-[#6b6b6b] whitespace-nowrap">{fecha}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setDeleteTarget({ ...u, av })}
                          className="w-7 h-7 rounded-[6px] border border-[#e4e4e0] flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <IconTrash size={13} color="#6b6b6b" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* MODAL: Agregar participante */}
      {showAdd && (
        <Modal onClose={() => { setShowAdd(false); setAddError(""); }}>
          <div className="w-full sm:w-[420px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Agregar participante</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">Completa los datos para registrar un nuevo usuario.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Nombre *" placeholder="Carlos" value={newUser.nombre} onChange={set("nombre")} />
                <InputField label="Apellido *" placeholder="Ruiz" value={newUser.apellido} onChange={set("apellido")} />
              </div>
              <InputField label="Usuario *" placeholder="@carlosruiz" value={newUser.usuario} onChange={set("usuario")} />
              <InputField label="Correo *" type="email" placeholder="hola@ejemplo.com" value={newUser.correo} onChange={set("correo")} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Contraseña temporal *" type="password" placeholder="••••••••" value={newUser.password} onChange={set("password")} />
                <InputField label="Fecha de nacimiento *" type="date" value={newUser.fecha} onChange={set("fecha")} />
              </div>
              {equipos.length > 0 && (
                <SelectField
                  label="Equipo favorito"
                  value={newUser.equipo}
                  onChange={set("equipo")}
                  options={[{ value: "", label: "Sin equipo" }, ...equipos.map(e => ({ value: e.nombre, label: e.nombre }))]}
                />
              )}
            </div>

            {addError && (
              <p className="mt-3 text-[12px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[8px] px-3 py-2">
                {addError}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setAddError(""); }}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleAdd} disabled={addLoading}
                className="flex-[2] h-[42px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors disabled:opacity-60">
                {addLoading ? "Agregando..." : "Agregar participante"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Eliminar participante */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="w-full sm:w-[360px] p-5 sm:p-7" style={{ fontFamily: font }}>
            <div className="w-[42px] h-[42px] bg-[#fff3e0] rounded-[10px] flex items-center justify-center mb-5">
              <IconWarning size={20} color="#f4a030" />
            </div>
            <h2 className="text-[20px] font-black text-[#1a1a1a] tracking-[-0.5px]">Eliminar participante</h2>
            <p className="text-[13px] font-medium text-[#6b6b6b] mt-1 mb-5">Esta acción no se puede deshacer.</p>

            <div className="bg-[#fafaf8] border border-[#e4e4e0] rounded-[12px] p-4 flex items-center gap-3 mb-6">
              <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
                style={{ background: deleteTarget.av?.bg || "#d6f5e8", color: deleteTarget.av?.text || "#25854f", boxShadow: "0 0 0 1.5px #e4e4e0" }}>
                {deleteTarget.initials}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#1a1a1a]">{deleteTarget.nombre}</div>
                <div className="text-[12px] text-[#6b6b6b]">@{deleteTarget.username} · {deleteTarget.correo}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 h-[42px] border border-[#e4e4e0] rounded-full text-[14px] font-extrabold text-[#1a1a1a] hover:bg-[#f2f2ef] transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-[42px] bg-[#d93025] text-white rounded-full text-[14px] font-extrabold hover:bg-[#b91c1c] transition-colors">
                Sí, eliminar usuario
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
