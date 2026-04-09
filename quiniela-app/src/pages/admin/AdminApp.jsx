import { useState } from "react";
import AdminDashboard     from "./AdminDashboard.jsx";
import AdminParticipantes from "./AdminParticipantes.jsx";
import AdminQuinielas     from "./AdminQuinielas.jsx";
import AdminPagos         from "./AdminPagos.jsx";
import AdminResultados    from "./AdminResultados.jsx";
import AdminReportes      from "./AdminReportes.jsx";

const PAGES = {
  dashboard:     AdminDashboard,
  participantes: AdminParticipantes,
  quinielas:     AdminQuinielas,
  pagos:         AdminPagos,
  resultados:    AdminResultados,
  reportes:      AdminReportes,
};

export default function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const Page = PAGES[page] || AdminDashboard;

  return (
    <div className="w-full h-screen bg-[#fafaf8]">
      <Page onNavigate={setPage} />
    </div>
  );
}
