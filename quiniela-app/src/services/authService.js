import apiClient from './apiClient';

export const authService = {
  login: async (correo, contrasena) => {
    const { data } = await apiClient.post('/auth/login', { correo, contrasena });
    return data;
  },

  registro: async (userData) => {
    const { data } = await apiClient.post('/auth/registro', userData);
    return data;
  },

  perfil: async () => {
    const { data } = await apiClient.get('/auth/perfil');
    return data;
  },

  misQuinielas: async () => {
    const { data } = await apiClient.get('/auth/mis-quinielas');
    return data;
  },

  stats: async () => {
    const { data } = await apiClient.get('/auth/stats');
    return data;
  },

  actualizarFoto: async (fotoDataUrl) => {
    const { data } = await apiClient.patch('/auth/foto-perfil', { foto: fotoDataUrl });
    return data;
  },

  actualizarPerfil: async (payload) => {
    const { data } = await apiClient.patch('/auth/perfil', payload);
    return data;
  },

  forgotPassword: async (correo) => {
    const { data } = await apiClient.post('/auth/forgot-password', { correo });
    return data;
  },

  resetPassword: async (correo, codigo, nueva_contrasena) => {
    const { data } = await apiClient.post('/auth/reset-password', { correo, codigo, nueva_contrasena });
    return data;
  },

  notificaciones: async () => {
    const { data } = await apiClient.get('/auth/notificaciones');
    return data;
  },

  misResultadosQuiniela: async (id_quiniela) => {
    const { data } = await apiClient.get(`/auth/mis-quinielas/${id_quiniela}/resultados`);
    return data;
  },
};
