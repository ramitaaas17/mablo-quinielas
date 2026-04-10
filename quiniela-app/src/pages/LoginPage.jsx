import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, InputField, PrimaryButton, HERO_BG } from "../components";
import { useStore } from "../store";
import { authService } from "../services/authService";

/* Decorative dots — each has its own float personality and timing */
const DOTS = [
  { size: 16, top: "28%",   left: "13.44%", color: "#f4a030", anim: "animate-float-a", dur: "4s",   delay: "0s" },
  { size: 12, top: "21%",   left: "85.47%", color: "#b0d4ff", anim: "animate-float-b", dur: "5.5s", delay: "0.8s" },
  { size: 10, top: "48.75%",left: "21.48%", color: "#d6f5e8", anim: "animate-float-c", dur: "3.8s", delay: "0.3s" },
  { size: 18, top: "37.75%",left: "77.42%", color: "#fce4d6", anim: "animate-float-a", dur: "6s",   delay: "1.2s" },
  { size: 8,  top: "11.5%", left: "49.69%", color: "#ffe08a", anim: "animate-float-b", dur: "4.5s", delay: "0.5s" },
  { size: 22, top: "20%",   left: "16.33%", color: "#e2cfff", anim: "animate-float-c", dur: "5s",   delay: "0.1s" },
  { size: 18, top: "30%",   left: "80.55%", color: "#b0d4ff", anim: "animate-float-a", dur: "6.5s", delay: "0.7s" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (password.length < 4) {
      setError("Contraseña muy corta (mínimo 4 caracteres).");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email.trim().toLowerCase(), password);
      login(data);
      const pendingCode = sessionStorage.getItem("pending_invite_code");
      if (pendingCode && !data.is_admin) {
        sessionStorage.removeItem("pending_invite_code");
        navigate(`/unirse/${pendingCode}`);
      } else {
        navigate(data.is_admin ? "/admin" : "/");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al iniciar sesión. Intenta de nuevo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="landing" />

      {/* Hero */}
      <div className="relative flex-1 overflow-hidden">

        {/* Gradient blob — wrapper centers it, inner div animates scale only */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className="w-[1400px] h-[420px] rounded-b-[455px] animate-breathe"
            style={{ backgroundImage: "linear-gradient(145deg, rgb(252,228,236) 0%, rgb(253,232,216) 40%, rgb(214,245,232) 100%)" }}
          />
        </div>

        {/* Floating decorative dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {DOTS.map((d, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${d.anim}`}
              style={{
                width: d.size,
                height: d.size,
                top: d.top,
                left: d.left,
                background: d.color,
                "--float-dur": d.dur,
                animationDelay: d.delay,
              }}
            />
          ))}
        </div>

        {/* Hero background image */}
        <img
          src={HERO_BG}
          alt=""
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
          style={{ top: 59 }}
        />

        {/* Heading — fades in from top */}
        <div className="relative z-10 pt-14 sm:pt-20 text-center px-4 animate-fade-in-up" style={{ animationDuration: "0.6s" }}>
          <h1
            className="text-[32px] sm:text-[42px] font-black text-[#1a1a1a] tracking-[-1.5px] leading-[1.1]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Tu quiniela,<br />cada semana.
          </h1>
          <p
            className="mt-3 text-[15px] font-medium text-[#6b6b6b] animate-fade-in"
            style={{ fontFamily: "Nunito, sans-serif", animationDelay: "0.2s" }}
          >
            Entra y compite con tus amigos.
          </p>
        </div>

        {/* Login Card — slides up with slight delay */}
        <div
          className="relative z-10 mx-auto mt-8 w-full max-w-[380px] px-4 sm:px-0 animate-fade-in-up"
          style={{ animationDelay: "0.15s", animationDuration: "0.55s" }}
        >
          <div className="bg-white/60 backdrop-blur-sm border border-[#e4e4e0] rounded-[20px] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col gap-5">
            <InputField
              label="Correo electrónico"
              placeholder="hola@ejemplo.com"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
            />
            <InputField
              label="Contraseña"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
            />

            {error && (
              <p
                className="text-[13px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[10px] px-3 py-2 animate-scale-in"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {error}
              </p>
            )}

            <PrimaryButton onClick={handleLogin} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </PrimaryButton>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#ebebeb]" />
              <span className="text-[12px] text-[#ccc]" style={{ fontFamily: "Nunito, sans-serif" }}>o</span>
              <div className="flex-1 h-px bg-[#ebebeb]" />
            </div>

            <div className="text-center flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="text-[#3dbb78] font-extrabold hover:underline transition-all">
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
