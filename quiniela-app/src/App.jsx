import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TablaPage from "./pages/TablaPage.jsx";
import MisQuinielasPage from "./pages/MisQuinielasPage.jsx";
import PerfilPage from "./pages/PerfilPage.jsx";
import EmptyStatePage from "./pages/EmptyStatePage.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";
import InvitacionPage from "./pages/InvitacionPage.jsx";
import { useStore } from "./store";

function ProtectedRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />; // Only admin can access
  return children;
}

export default function App() {
  const { user } = useStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.isAdmin ? "/admin" : "/"} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.isAdmin ? "/admin" : "/"} replace /> : <RegisterPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
             <ProtectedRoute>
               <DashboardPage />
             </ProtectedRoute>
          } 
        />
        <Route 
          path="/tabla" 
          element={
             <ProtectedRoute>
               <TablaPage />
             </ProtectedRoute>
          } 
        />
        <Route 
          path="/mis-quinielas" 
          element={
             <ProtectedRoute>
               <MisQuinielasPage />
             </ProtectedRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
             <ProtectedRoute>
               <PerfilPage />
             </ProtectedRoute>
          } 
        />
        <Route 
          path="/empty" 
          element={
             <ProtectedRoute>
               <EmptyStatePage />
             </ProtectedRoute>
          } 
        />
        
        {/* Ruta pública de invitación — no requiere autenticación */}
        <Route path="/unirse/:codigo" element={<InvitacionPage />} />

        {/* Admin routes */}
        <Route 
          path="/admin/*" 
          element={
             <AdminRoute>
               <AdminApp />
             </AdminRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
