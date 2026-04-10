import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";

// Lazy loading — cada página es un chunk separado.
// El navegador solo descarga el JS de la página que visitas.
const LoginPage       = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage    = lazy(() => import("./pages/RegisterPage.jsx"));
const DashboardPage   = lazy(() => import("./pages/DashboardPage.jsx"));
const TablaPage       = lazy(() => import("./pages/TablaPage.jsx"));
const MisQuinielasPage = lazy(() => import("./pages/MisQuinielasPage.jsx"));
const PerfilPage      = lazy(() => import("./pages/PerfilPage.jsx"));
const EmptyStatePage  = lazy(() => import("./pages/EmptyStatePage.jsx"));
const AdminApp        = lazy(() => import("./pages/admin/AdminApp.jsx"));
const InvitacionPage  = lazy(() => import("./pages/InvitacionPage.jsx"));

// Fallback mínimo — sin flash raro, solo fondo del color de la app
function PageLoader() {
  return <div className="min-h-screen bg-[#fafaf8]" />;
}

function ProtectedRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useStore();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"    element={user ? <Navigate to={user.isAdmin ? "/admin" : "/"} replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to={user.isAdmin ? "/admin" : "/"} replace /> : <RegisterPage />} />

          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/tabla" element={<ProtectedRoute><TablaPage /></ProtectedRoute>} />
          <Route path="/mis-quinielas" element={<ProtectedRoute><MisQuinielasPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/empty" element={<ProtectedRoute><EmptyStatePage /></ProtectedRoute>} />

          <Route path="/unirse/:codigo" element={<InvitacionPage />} />

          <Route path="/admin/*" element={<AdminRoute><AdminApp /></AdminRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
