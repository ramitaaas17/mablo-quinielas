import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── THEME ──────────────────────────────────────────────────────────────
      theme: (typeof window !== 'undefined' ? localStorage.getItem('qp-theme') : null) || 'light',

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('qp-theme', next);
          if (next === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          return { theme: next };
        });
      },

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

      logout: () => set({ user: null, misPredicciones: {}, _cache: {} }),

      // ─── PREDICCIONES LOCALES ────────────────────────────────────────────────
      // Estructura: { quinielaId: { partidoId: ['L', 'E'] } }
      misPredicciones: {},
      misX2: {}, // { quinielaId: partidoId }
      hasUnsavedChanges: false,
      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),

      setPrediccionesQuiniela: (quinielaId, prediccionesApi) => {
        // prediccionesApi viene de GET /predicciones/mis-predicciones/<id>
        // Formato API: [{ id_partido, selecciones, es_x2 }]
        const mapa = {};
        let x2PartidoId = null;
        for (const p of prediccionesApi) {
          mapa[p.id_partido] = p.selecciones || [];
          if (p.es_x2) x2PartidoId = p.id_partido;
        }
        set((state) => ({
          misPredicciones: {
            ...state.misPredicciones,
            [quinielaId]: mapa,
          },
          misX2: {
            ...state.misX2,
            [quinielaId]: x2PartidoId,
          },
          hasUnsavedChanges: false
        }));
      },

      // ─── CACHÉ DE DATOS ─────────────────────────────────────────────────────
      // Almacena datos de páginas en memoria para navegación instantánea.
      // No se persiste en localStorage — se limpia al recargar la página.
      _cache: {},

      setCache: (key, data) => set(state => ({
        _cache: { ...state._cache, [key]: { data, at: Date.now() } }
      })),

      // Devuelve los datos si son frescos (maxAge en ms, default 45s).
      // Devuelve null si no existe o si expiró.
      getCache: (key, maxAge = 45_000) => {
        const entry = get()._cache[key];
        if (!entry) return null;
        if (Date.now() - entry.at > maxAge) return null;
        return entry.data;
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
            },
            hasUnsavedChanges: true
          };
        });
      },

      toggleX2: (quinielaId, partidoId, totalPartidos, quinielaCierreIso = null) => {
        set((state) => {
          if (totalPartidos < 3) return state; // No permitido

          // Verificar si la quiniela ya cerró
          if (quinielaCierreIso) {
            const cierreTime = new Date(quinielaCierreIso).getTime();
            if (Date.now() > cierreTime) return state; // Ya cerró, no permitir cambios
          }

          const quinielaPreds = state.misPredicciones[quinielaId] || {};
          const currentPicks = quinielaPreds[partidoId] || [];

          if (Array.isArray(currentPicks) && currentPicks.length === 2) {
            return state; // Mutualmente excluyente con selección doble
          }

          const currentX2 = state.misX2[quinielaId];
          const newX2 = currentX2 === partidoId ? null : partidoId;

          return {
            misX2: {
              ...state.misX2,
              [quinielaId]: newX2
            },
            hasUnsavedChanges: true
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
