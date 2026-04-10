import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { quinielaService } from "../services/quinielaService";

const font = "Nunito, sans-serif";

function formatPozo(n) {
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
}

function formatFechaCorta(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} · ${hh}:${mm}`;
}

// ── SVG helpers ──────────────────────────────────────────────────────────────
const LogoIcon = () => (
  <div style={{ width: 24, height: 24, background: "#1a1a1a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" fill="white" />
      <circle cx="7" cy="7" r="2" fill="#1a1a1a" />
    </svg>
  </div>
);

const QuinielaIcon = () => (
  <div style={{ width: 52, height: 52, background: "#1a1a1a", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5" />
      <path d="M3 9h18M9 9v12" stroke="white" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="1" fill="white" />
    </svg>
  </div>
);

const MoneyIcon = () => (
  <div style={{ width: 36, height: 36, background: "#f4a030", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" />
      <path d="M9 5.5v7M6.5 7.5h4a2 2 0 0 1 0 4H6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const PendingIcon = () => (
  <div style={{ width: 48, height: 48, background: "#f4a030", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.5" />
      <path d="M11 6.5v5.5M11 14.5v1" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// ── Animated floating bubbles ────────────────────────────────────────────────
const BUBBLES = [
  // left side — large to small, top to bottom
  { size: 28, top: "12%",  left: "5%",   color: "#f4a030", anim: "animate-float-b", dur: "5s",   delay: "0s",   opacity: 0.75, blur: 0 },
  { size: 44, top: "38%",  left: "2%",   color: "#d6f5e8", anim: "animate-float-a", dur: "7s",   delay: "0.4s", opacity: 0.6,  blur: 1 },
  { size: 12, top: "22%",  left: "14%",  color: "#ffe08a", anim: "animate-float-c", dur: "3.8s", delay: "1.1s", opacity: 0.9,  blur: 0 },
  { size: 20, top: "58%",  left: "4%",   color: "#e2cfff", anim: "animate-float-b", dur: "6.2s", delay: "0.7s", opacity: 0.65, blur: 0 },
  { size: 9,  top: "75%",  left: "18%",  color: "#f4a030", anim: "animate-float-a", dur: "4.5s", delay: "1.5s", opacity: 0.8,  blur: 0 },
  { size: 16, top: "88%",  left: "8%",   color: "#b0d4ff", anim: "animate-float-c", dur: "5.5s", delay: "0.2s", opacity: 0.7,  blur: 0 },
  // right side
  { size: 14, top: "9%",   right: "8%",  color: "#b0d4ff", anim: "animate-float-a", dur: "4.2s", delay: "0.8s", opacity: 0.85, blur: 0 },
  { size: 32, top: "28%",  right: "3%",  color: "#fce4d6", anim: "animate-float-c", dur: "6.5s", delay: "0.3s", opacity: 0.55, blur: 1 },
  { size: 10, top: "50%",  right: "10%", color: "#d6f5e8", anim: "animate-float-b", dur: "4s",   delay: "1.2s", opacity: 0.9,  blur: 0 },
  { size: 36, top: "68%",  right: "2%",  color: "#ffe08a", anim: "animate-float-a", dur: "8s",   delay: "0.6s", opacity: 0.4,  blur: 2 },
  { size: 11, top: "82%",  right: "12%", color: "#e2cfff", anim: "animate-float-c", dur: "3.5s", delay: "0.9s", opacity: 0.8,  blur: 0 },
  // center scattered
  { size: 8,  top: "6%",   left: "46%",  color: "#3dbb78", anim: "animate-float-b", dur: "4.8s", delay: "0.5s", opacity: 0.7,  blur: 0 },
  { size: 18, top: "93%",  left: "42%",  color: "#f4a030", anim: "animate-float-a", dur: "6s",   delay: "1.3s", opacity: 0.5,  blur: 0 },
];

const FloatingBubbles = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
    {BUBBLES.map((b, i) => (
      /* Outer wrapper: pop-in entrance */
      <div
        key={i}
        className="animate-bubble-in"
        style={{
          position: "absolute",
          top: b.top,
          left: b.left,
          right: b.right,
          width: b.size,
          height: b.size,
          animationDelay: b.delay,
        }}
      >
        {/* Inner bubble: continuous float loop */}
        <div
          className={b.anim}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: b.color,
            opacity: b.opacity,
            filter: b.blur ? `blur(${b.blur}px)` : undefined,
            "--float-dur": b.dur,
            animationDelay: b.delay,
          }}
        />
      </div>
    ))}
  </div>
);

// ── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, sub, dark }) {
  return (
    <div style={{
      background: dark ? "#1a1a1a" : "#fafaf8",
      border: `1px solid ${dark ? "#1a1a1a" : "#e4e4e0"}`,
      borderRadius: 14, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 3, flex: 1,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: dark ? "rgba(255,255,255,0.5)" : "#6b6b6b", fontFamily: font }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: dark ? "white" : "#1a1a1a", letterSpacing: "-0.8px", lineHeight: 1, fontFamily: font }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, fontWeight: 600, color: dark ? "rgba(255,255,255,0.4)" : "#6b6b6b", fontFamily: font }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── InfoRow (estado pendiente) ───────────────────────────────────────────────
function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 16px", background: "#fafaf8",
      border: "1px solid #e4e4e0", borderRadius: 12,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.4px", fontFamily: font }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: valueColor || "#1a1a1a", fontFamily: font }}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function InvitacionPage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();

  const [quiniela, setQuiniela] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [estadoPago, setEstadoPago] = useState(null); // null | 'pendiente' | 'confirmado'
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    if (!codigo) { setError("Código inválido."); setLoading(false); return; }
    quinielaService.getInfoInvitacion(codigo)
      .then(async (q) => {
        setQuiniela(q);
        // Si ya está loggeado, verificar su estado
        if (user) {
          try {
            const estado = await quinielaService.miEstado(q.id_quiniela);
            if (estado.inscrito) {
              setEstadoPago(estado.estado_pago);
            } else {
              // Auto-join si viene de register/login
              if (sessionStorage.getItem("auto_join") === codigo) {
                setJoining(true);
                try {
                  await quinielaService.unirseConCodigo(codigo);
                  setEstadoPago("pendiente");
                } catch (e) {
                  console.error(e);
                } finally {
                  setJoining(false);
                  sessionStorage.removeItem("auto_join");
                }
              }
            }
          } catch {
             // Si el endpoint 404/falla, checar el auto_join
              if (sessionStorage.getItem("auto_join") === codigo) {
                setJoining(true);
                try {
                  await quinielaService.unirseConCodigo(codigo);
                  setEstadoPago("pendiente");
                } catch (e) {
                  console.error(e);
                } finally {
                  setJoining(false);
                  sessionStorage.removeItem("auto_join");
                }
              }
          }
        }
      })
      .catch(() => setError("Este enlace no es válido o ha expirado."))
      .finally(() => setLoading(false));
  }, [codigo, user]);

  const handleUnirse = async () => {
    if (!user) {
      sessionStorage.setItem("pending_invite_code", codigo);
      navigate("/register");
      return;
    }
    setJoining(true);
    try {
      const res = await quinielaService.unirseConCodigo(codigo);
      if (res.ya_inscrito) {
        setEstadoPago("pendiente");
      } else {
        setEstadoPago("pendiente");
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Error al procesar la solicitud.");
    }
    setJoining(false);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/unirse/${codigo}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg("¡Copiado!");
      setTimeout(() => setCopyMsg(""), 2500);
    } catch {
      setCopyMsg(url);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e4e4e0 0%, #deded8 50%, #e8e8e2 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e4e4e0", borderTop: "3px solid #3dbb78", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#6b6b6b" }}>Cargando invitación...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e4e4e0 0%, #deded8 50%, #e8e8e2 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "20px", fontFamily: font }}>
      <div style={{ width: 56, height: 56, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", textAlign: "center" }}>Enlace no válido</h1>
      <p style={{ fontSize: 14, color: "#6b6b6b", textAlign: "center" }}>{error}</p>
      <button onClick={() => navigate("/")} style={{ height: 40, padding: "0 24px", background: "#1a1a1a", color: "white", borderRadius: 40, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: font }}>
        Ir al inicio
      </button>
    </div>
  );

  const isPendiente = estadoPago === "pendiente";
  const isConfirmado = estadoPago === "confirmado";

  // ── ESTADO 2: Pendiente de pago ──────────────────────────────────────────
  if (isPendiente) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e4e4e0 0%, #deded8 50%, #e8e8e2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: font }}>
      <div className="animate-scale-in" style={{ width: "100%", maxWidth: 520, background: "#fafaf8", borderRadius: 20, boxShadow: "0 8px 48px rgba(0,0,0,0.12)", overflow: "hidden", position: "relative" }}>
        {/* Blob wrapper: centering; inner: breathe animation */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
          <div
            className="animate-breathe"
            style={{ width: 900, height: 300, borderRadius: "0 0 55% 55%", background: "linear-gradient(145deg, #fce4ec 0%, #fde8d8 40%, #d6f5e8 100%)" }}
          />
        </div>
        <FloatingBubbles />

        {/* Nav */}
        <nav style={{ position: "relative", zIndex: 10, height: 64, display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon />
            <span style={{ fontSize: 15, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>Quiniela</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6b6b", border: "1px solid #e4e4e0", borderRadius: 40, padding: "4px 12px" }}>
              {quiniela.nombre}
            </span>
            {user && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#d6f5e8", border: "2px solid #3dbb78", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#25854f" }}>
                {user.nombre?.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <main style={{ position: "relative", zIndex: 5, padding: "8px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.1 }}>
              {quiniela.nombre}
            </h1>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#6b6b6b", marginTop: 6 }}>
              Tu inscripción está registrada. Solo falta confirmar el pago.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.72)", border: "1px solid #e4e4e0", borderRadius: 24, boxShadow: "0 4px 32px rgba(0,0,0,0.07)", backdropFilter: "blur(12px)", width: "100%", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Pending banner */}
            <div style={{ background: "#fff3e0", border: "1px solid rgba(244,160,48,0.3)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <PendingIcon />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1a1a1a", fontFamily: font }}>Inscripción pendiente de pago</h3>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#7a4a00", marginTop: 4, lineHeight: 1.5, fontFamily: font }}>
                  Cuando realices tu pago, el administrador confirmará tu acceso y podrás hacer tus predicciones.
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InfoRow label="Quiniela" value={`${quiniela.nombre} · ${quiniela.liga_nombre}`} />
              <InfoRow label="Monto a pagar" value={formatPozo(quiniela.precio_entrada)} valueColor="#1a1a1a" />
              <InfoRow label="Pagar antes de" value={formatFechaCorta(quiniela.cierre)} valueColor="#f4a030" />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#e4e4e0" }} />

            {/* Compartir link */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#6b6b6b", marginBottom: 8, fontFamily: font }}>
                Comparte la quiniela con otros
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f2f2ef", border: "1px solid #e4e4e0", borderRadius: 12, padding: "10px 14px" }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#6b6b6b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: font }}>
                  {`${window.location.origin}/unirse/${codigo}`}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{ background: "#1a1a1a", color: "white", fontSize: 11, fontWeight: 800, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", flexShrink: 0, fontFamily: font, transition: "background 0.15s" }}
                >
                  {copyMsg || "Copiar"}
                </button>
              </div>
            </div>

            {/* Back to dashboard */}
            <button
              onClick={() => navigate("/")}
              style={{ width: "100%", height: 50, background: "#f2f2ef", color: "#1a1a1a", border: "none", borderRadius: 40, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: font }}
            >
              Ver mi dashboard
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ position: "relative", zIndex: 5, padding: "16px 24px", borderTop: "1px solid #e4e4e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoIcon />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", fontFamily: font }}>Quiniela</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6b6b", fontFamily: font }}>El dinero se gestiona directamente entre participantes.</p>
        </footer>
      </div>
    </div>
  );

  // ── ESTADO 1: Default (no loggeado o no inscrito) ────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e4e4e0 0%, #deded8 50%, #e8e8e2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: font }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes colorPing { 0%{transform:scale(1);opacity:0.8} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
        .inv-btn-primary { transition: all 0.2s !important; }
        .inv-btn-primary:hover { background: #333 !important; transform: translateY(-1px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.25) !important; }
        .inv-btn-primary:active { transform: scale(0.97) !important; }
        .inv-btn-copy:hover { background: #333 !important; }
      `}</style>

      <div className="animate-scale-in" style={{ width: "100%", maxWidth: 520, background: "#fafaf8", borderRadius: 20, boxShadow: "0 8px 48px rgba(0,0,0,0.12)", overflow: "hidden", position: "relative" }}>
        {/* Blob wrapper: centering; inner: breathe animation */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
          <div
            className="animate-breathe"
            style={{ width: 900, height: 300, borderRadius: "0 0 55% 55%", background: "linear-gradient(145deg, #fce4ec 0%, #fde8d8 40%, #d6f5e8 100%)" }}
          />
        </div>
        <FloatingBubbles />

        {/* Nav */}
        <nav style={{ position: "relative", zIndex: 10, height: 64, display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon />
            <span style={{ fontSize: 15, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>Quiniela</span>
          </div>
          {!user && (
            <button
              onClick={() => { 
                sessionStorage.setItem("pending_invite_code", codigo);
                sessionStorage.setItem("auto_join", codigo);
                navigate("/login"); 
              }}
              style={{ background: "#1a1a1a", color: "white", fontSize: 13, fontWeight: 700, padding: "0 20px", height: 36, borderRadius: 40, border: "none", cursor: "pointer", fontFamily: font }}
            >
              Iniciar sesión
            </button>
          )}
        </nav>

        {/* Main */}
        <main style={{ position: "relative", zIndex: 5, padding: "0 24px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Invite badge */}
          <div
            className="animate-fade-in-up animate-glow-pulse"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #d6f5e8 0%, #c5f0dc 100%)", border: "1px solid rgba(61,187,120,0.4)", borderRadius: 40, padding: "6px 16px", marginTop: 28, marginBottom: 20, boxShadow: "0 2px 12px rgba(61,187,120,0.15)" }}
          >
            <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, background: "#3dbb78", borderRadius: "50%", position: "relative", zIndex: 1 }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#3dbb78", animation: "colorPing 1.8s ease-out infinite" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#25854f", textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: font }}>
              Tienes una invitación
            </span>
          </div>

          {/* Heading */}
          <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 28, animationDelay: "0.1s" }}>
            <h1 style={{ fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 10, fontFamily: font }}>
              Únete a{" "}
              <em style={{ fontStyle: "normal", background: "linear-gradient(135deg, #25854f 0%, #3dbb78 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{quiniela.nombre}</em>
            </h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#6b6b6b", fontFamily: font }}>
              Predice, compite y gana el pozo del grupo.
            </p>
          </div>

          {/* Card */}
          <div className="animate-fade-in-up" style={{ background: "rgba(255,255,255,0.78)", border: "1px solid #e4e4e0", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.09)", backdropFilter: "blur(14px)", width: "100%", padding: 28, display: "flex", flexDirection: "column", gap: 20, animationDelay: "0.2s" }}>

            {/* Quiniela header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <QuinielaIcon />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px", lineHeight: 1, fontFamily: font }}>
                  {quiniela.nombre}
                </h2>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b6b6b", marginTop: 3, fontFamily: font }}>
                  {quiniela.liga_nombre}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#d6f5e8", color: "#25854f", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 40, marginTop: 6, fontFamily: font }}>
                  <span style={{ width: 6, height: 6, background: "#3dbb78", borderRadius: "50%", display: "inline-block" }} />
                  Abierta
                </div>
              </div>
              {/* Participants */}
              <div style={{ display: "flex" }}>
                {[["#d6f5e8","#25854f"], ["#fde8d8","#a05a00"], ["#fce8e8","#7c3aed"]].map(([bg, color], i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid white", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, marginLeft: i === 0 ? 0 : -6, fontFamily: font }}>
                    {["CR","JL","MA"][i]}
                  </div>
                ))}
                {quiniela.num_jugadores > 3 && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid white", background: "#f2f2ef", color: "#6b6b6b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, marginLeft: -6, fontFamily: font }}>
                    +{quiniela.num_jugadores - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Pozo estimado", value: formatPozo(quiniela.pozo_acumulado || quiniela.precio_entrada * (quiniela.num_jugadores || 1)), sub: `${quiniela.num_jugadores} jugadores`, dark: true },
                { label: "Entrada",       value: formatPozo(quiniela.precio_entrada), sub: "por jugador" },
                { label: "Cierre",        value: formatFechaCorta(quiniela.cierre).split("·")[0].trim(), sub: formatFechaCorta(quiniela.cierre).split("·")[1]?.trim() },
              ].map((s, idx) => (
                <div key={s.label} className="animate-fade-in-up" style={{ flex: 1, animationDelay: `${0.3 + idx * 0.08}s` }}>
                  <StatBox {...s} />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#e4e4e0" }} />

            {/* Payment info */}
            <div style={{ background: "#fff3e0", border: "1px solid rgba(244,160,48,0.25)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <MoneyIcon />
              <div>
                <strong style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#5a3000", marginBottom: 2, fontFamily: font }}>¿Cómo pagar?</strong>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#7a4a00", lineHeight: 1.5, fontFamily: font }}>
                  Paga <strong style={{ display: "inline", color: "#5a3000" }}>{formatPozo(quiniela.precio_entrada)}</strong> directamente al administrador antes del cierre. El organizador confirmará tu pago y podrás hacer predicciones.
                </p>
              </div>
            </div>

            {/* Partidos info */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6b6b6b" strokeWidth="1.2"><rect x="2" y="2" width="10" height="10" rx="2" /><path d="M2 6h10 M6 6v6" /></svg>, text: `${quiniela.num_partidos} partidos` },
                { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6b6b6b" strokeWidth="1.2" strokeLinecap="round"><circle cx="7" cy="5" r="3" /><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>, text: `${quiniela.num_jugadores} participantes` },
                { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.8 4 4.2.6-3.1 3 .7 4.4L7 11.2l-3.6 1.8.7-4.4L1 5.6l4.2-.6L7 1z" stroke="#6b6b6b" strokeWidth="1.2" strokeLinejoin="round" /></svg>, text: "1 comodín" },
              ].map(({ icon, text }, idx) => (
                <div key={idx} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "#f2f2ef", border: "1px solid #e4e4e0", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>{icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6b6b", fontFamily: font }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleUnirse}
              disabled={joining || isConfirmado}
              className="inv-btn-primary"
              style={{ width: "100%", height: 54, background: isConfirmado ? "#3dbb78" : "#1a1a1a", color: "white", border: "none", borderRadius: 40, fontSize: 16, fontWeight: 800, cursor: joining ? "wait" : "pointer", fontFamily: font, letterSpacing: "-0.2px", transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {isConfirmado ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Ya estás inscrito</span>
                </div>
              ) : joining ? "Procesando..." : user ? "Quiero unirme" : "Regístrate para unirte"}
            </button>

            {/* Login link */}
            {!user && (
              <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#6b6b6b", fontFamily: font }}>
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => { 
                    sessionStorage.setItem("pending_invite_code", codigo);
                    sessionStorage.setItem("auto_join", codigo);
                    navigate("/login"); 
                  }}
                  style={{ background: "none", border: "none", color: "#25854f", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: font, textDecoration: "underline", padding: 0 }}
                >
                  Inicia sesión para unirte
                </button>
              </p>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer style={{ position: "relative", zIndex: 5, padding: "16px 24px", borderTop: "1px solid #e4e4e0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoIcon />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", fontFamily: font }}>Quiniela</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6b6b", fontFamily: font }}>
            El dinero se gestiona directamente entre participantes.
          </p>
        </footer>
      </div>
    </div>
  );
}
