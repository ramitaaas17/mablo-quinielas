import apiClient from './apiClient';

// ─── QUINIELAS PÚBLICAS ───────────────────────────────────────────────────────

export const quinielaService = {
  getActivas: async () => {
    const { data } = await apiClient.get('/quinielas/');
    return data;
  },

  getTodas: async () => {
    const { data } = await apiClient.get('/quinielas/todas');
    return data;
  },

  getDetalle: async (id_quiniela) => {
    const { data } = await apiClient.get(`/quinielas/${id_quiniela}`);
    return data;
  },

  unirse: async (id_quiniela) => {
    const { data } = await apiClient.post(`/quinielas/${id_quiniela}/unirse`);
    return data;
  },

  getPosiciones: async (id_quiniela) => {
    const { data } = await apiClient.get(`/quinielas/${id_quiniela}/posiciones`);
    return data;
  },

  getLigas: async () => {
    const { data } = await apiClient.get('/quinielas/ligas');
    return data;
  },

  getEquipos: async (id_liga) => {
    const { data } = await apiClient.get(`/quinielas/ligas/${id_liga}/equipos`);
    return data;
  },

  // ─── Invitaciones ─────────────────────────────────────────────────────────
  getInfoInvitacion: async (codigo) => {
    const { data } = await apiClient.get(`/quinielas/invitacion/${codigo}`);
    return data;
  },

  unirseConCodigo: async (codigo) => {
    const { data } = await apiClient.post('/quinielas/unirse-con-codigo', { codigo });
    return data;
  },

  unirseDirecto: async (id_quiniela) => {
    const { data } = await apiClient.post('/quinielas/unirse-con-codigo', { id_quiniela });
    return data;
  },

  miEstado: async (id_quiniela) => {
    const { data } = await apiClient.get(`/quinielas/${id_quiniela}/mi-estado`);
    return data;
  },
};

// ─── PREDICCIONES ─────────────────────────────────────────────────────────────

export const prediccionService = {
  guardar: async (id_partido, selecciones) => {
    const { data } = await apiClient.post('/predicciones/', { id_partido, selecciones });
    return data;
  },

  guardarBulk: async (predicciones) => {
    // predicciones: [{ id_partido, selecciones }]
    const { data } = await apiClient.post('/predicciones/bulk', { predicciones });
    return data;
  },

  getMisPredicciones: async (id_quiniela) => {
    const { data } = await apiClient.get(`/predicciones/mis-predicciones/${id_quiniela}`);
    return data;
  },
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminService = {
  // Stats
  getStats: async () => {
    const { data } = await apiClient.get('/admin/stats');
    return data;
  },

  getActividad: async () => {
    const { data } = await apiClient.get('/admin/actividad');
    return data;
  },

  // Quinielas
  getQuinielas: async () => {
    const { data } = await apiClient.get('/admin/quinielas');
    return data;
  },

  getQuiniela: async (id) => {
    const { data } = await apiClient.get(`/admin/quinielas/${id}`);
    return data;
  },

  crearQuiniela: async (payload) => {
    const { data } = await apiClient.post('/admin/quinielas', payload);
    return data;
  },

  editarQuiniela: async (id, payload) => {
    const { data } = await apiClient.patch(`/admin/quinielas/${id}`, payload);
    return data;
  },

  cerrarQuiniela: async (id) => {
    const { data } = await apiClient.patch(`/admin/quinielas/${id}/cerrar`);
    return data;
  },

  agregarPartidos: async (id_quiniela, partidos) => {
    const { data } = await apiClient.post(`/admin/quinielas/${id_quiniela}/partidos`, { partidos });
    return data;
  },

  getParticipantes: async (id_quiniela) => {
    const { data } = await apiClient.get(`/admin/quinielas/${id_quiniela}/participantes`);
    return data;
  },

  getPredicciones: async (id_quiniela) => {
    const { data } = await apiClient.get(`/admin/quinielas/${id_quiniela}/predicciones`);
    return data;
  },

  resolverQuiniela: async (id_quiniela) => {
    const { data } = await apiClient.post(`/admin/quinielas/${id_quiniela}/resolver`);
    return data;
  },

  getCodigoInvitacion: async (id_quiniela) => {
    const { data } = await apiClient.get(`/admin/quinielas/${id_quiniela}/codigo-invitacion`);
    return data;
  },

  // Pagos
  getPagos: async (id_quiniela) => {
    const { data } = await apiClient.get(`/admin/quinielas/${id_quiniela}/pagos`);
    return data;
  },

  confirmarPago: async (id_pago, payload) => {
    const { data } = await apiClient.patch(`/admin/pagos/${id_pago}/confirmar`, payload);
    return data;
  },

  rechazarPago: async (id_pago, payload) => {
    const { data } = await apiClient.patch(`/admin/pagos/${id_pago}/rechazar`, payload);
    return data;
  },

  revertirPago: async (id_pago) => {
    const { data } = await apiClient.patch(`/admin/pagos/${id_pago}/revertir`);
    return data;
  },

  // Partidos
  getProximosPartidos: async () => {
    const { data } = await apiClient.get('/admin/partidos/proximos');
    return data;
  },

  importarPartidos: async (id_quiniela, partidos) => {
    const { data } = await apiClient.post(`/admin/quinielas/${id_quiniela}/importar-partidos`, { partidos });
    return data;
  },

  cancelarPartido: async (id_partido) => {
    const { data } = await apiClient.patch(`/admin/partidos/${id_partido}/cancelar`);
    return data;
  },

  descancelarPartido: async (id_partido) => {
    const { data } = await apiClient.patch(`/admin/partidos/${id_partido}/descancelar`);
    return data;
  },

  actualizarMarcador: async (id_partido, goles_local, goles_visitante) => {
    const { data } = await apiClient.patch(`/admin/partidos/${id_partido}/marcador`, { goles_local, goles_visitante });
    return data;
  },

  // Usuarios
  getUsuarios: async () => {
    const { data } = await apiClient.get('/admin/usuarios');
    return data;
  },

  crearUsuario: async (payload) => {
    const { data } = await apiClient.post('/admin/usuarios', payload);
    return data;
  },

  eliminarUsuario: async (id) => {
    const { data } = await apiClient.delete(`/admin/usuarios/${id}`);
    return data;
  },

  eliminarQuiniela: async (id) => {
    const { data } = await apiClient.delete(`/admin/quinielas/${id}`);
    return data;
  },

  // Reportes — retornan URL para abrir/descargar directamente
  getReporteCSVUrl: (id_quiniela) =>
    `${apiClient.defaults.baseURL}/admin/reportes/${id_quiniela}/csv`,
  getReportePagosCSVUrl: (id_quiniela) =>
    `${apiClient.defaults.baseURL}/admin/reportes/${id_quiniela}/pagos/csv`,
  getReportePosicionesCSVUrl: (id_quiniela) =>
    `${apiClient.defaults.baseURL}/admin/reportes/${id_quiniela}/posiciones/csv`,
  getReportePDFUrl: (id_quiniela) =>
    `${apiClient.defaults.baseURL}/admin/reportes/${id_quiniela}/pdf`,
  getReportePosicionesPDFUrl: (id_quiniela) =>
    `${apiClient.defaults.baseURL}/admin/reportes/${id_quiniela}/posiciones/pdf`,
};
