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
};
