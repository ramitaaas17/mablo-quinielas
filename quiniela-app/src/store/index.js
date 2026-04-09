import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── AUTH ───────────────────────────────────────────────────────────────
      user: null,

      login: (userData) => set({
        user: {
          token: userData.token,
          username: userData.username,
          nombre: userData.nombre,
          apellido: userData.apellido,
          correo: userData.correo,
          is_admin: userData.is_admin || false,
          // Alias para compatibilidad con guards
          isAdmin: userData.is_admin || false,
        }
      }),

      logout: () => set({ user: null, misPredicciones: {} }),

      // ─── PREDICCIONES LOCALES ────────────────────────────────────────────────
      // Estructura: { quinielaId: { partidoId: ['L', 'E'] } }
      misPredicciones: {},

      setPrediccionesQuiniela: (quinielaId, prediccionesApi) => {
        // prediccionesApi viene de GET /predicciones/mis-predicciones/<id>
        // Formato API: [{ id_partido, selecciones }]
        const mapa = {};
        for (const p of prediccionesApi) {
          mapa[p.id_partido] = p.selecciones || [];
        }
        set((state) => ({
          misPredicciones: {
            ...state.misPredicciones,
            [quinielaId]: mapa,
          }
        }));
      },

      guardarPrediccion: (quinielaId, partidoId, prediccion) => {
        set((state) => {
          const quinielaPreds = state.misPredicciones[quinielaId] || {};
          let currentPicks = quinielaPreds[partidoId] || [];

          if (!Array.isArray(currentPicks)) {
            currentPicks = currentPicks ? [currentPicks] : [];
          }

          let newPicks = [...currentPicks];

          if (currentPicks.includes(prediccion)) {
            newPicks = currentPicks.filter(p => p !== prediccion);
          } else {
            if (currentPicks.length === 0) {
              newPicks.push(prediccion);
            } else if (currentPicks.length === 1) {
              const wildcardUsed = Object.entries(quinielaPreds)
                .some(([id, picks]) => id !== String(partidoId) && Array.isArray(picks) && picks.length === 2);

              if (wildcardUsed) {
                newPicks = [prediccion];
              } else {
                newPicks.push(prediccion);
              }
            } else if (currentPicks.length === 2) {
              newPicks = [currentPicks[1], prediccion];
            }
          }

          return {
            misPredicciones: {
              ...state.misPredicciones,
              [quinielaId]: {
                ...quinielaPreds,
                [partidoId]: newPicks,
              }
            }
          };
        });
      },
    }),
    {
      name: 'quiniela-storage-v5',
      partialize: (state) => ({
        user: state.user,
        misPredicciones: state.misPredicciones,
      }),
    }
  )
);
