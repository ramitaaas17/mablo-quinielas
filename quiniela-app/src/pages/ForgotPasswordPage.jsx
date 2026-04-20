import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar, InputField, PrimaryButton, HERO_BG } from "../components";
import { authService } from "../services/authService";

const font = "Nunito, sans-serif";

const DOTS = [
  { size: 14, top: "24%",   left: "11%",  color: "#3dbb78", anim: "animate-float-a", dur: "4.2s", delay: "0s" },
  { size: 10, top: "18%",   left: "82%",  color: "#b0d4ff", anim: "animate-float-b", dur: "5.5s", delay: "0.9s" },
  { size: 8,  top: "52%",   left: "19%",  color: "#d6f5e8", anim: "animate-float-c", dur: "3.8s", delay: "0.4s" },
  { size: 18, top: "40%",   left: "79%",  color: "#fce4d6", anim: "animate-float-a", dur: "6s",   delay: "1.1s" },
  { size: 7,  top: "12%",   left: "50%",  color: "#ffe08a", anim: "animate-float-b", dur: "4.5s", delay: "0.6s" },
  { size: 20, top: "22%",   left: "14%",  color: "#e2cfff", anim: "animate-float-c", dur: "5s",   delay: "0.2s" },
  { size: 16, top: "33%",   left: "77%",  color: "#b0d4ff", anim: "animate-float-a", dur: "6.5s", delay: "0.8s" },
];

// ─── Step 1: Email input ──────────────────────────────────────────────────────
function StepEmail({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      onSuccess(email.trim().toLowerCase());
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: font }}>
      <div>
        <p className="text-[11px] font-extrabold text-[#3dbb78] uppercase tracking-widest mb-1">
          Paso 1 de 2
        </p>
        <h2 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.5px] leading-tight">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-[13px] text-[#6b6b6b] font-medium mt-2 leading-relaxed">
          Ingresa tu correo y te enviaremos un código de 6 dígitos para recuperar el acceso.
        </p>
      </div>

      <InputField
        label="Correo electrónico"
        placeholder="hola@ejemplo.com"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      {error && (
        <p className="text-[13px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[10px] px-3 py-2 animate-scale-in">
          {error}
        </p>
      )}

      <PrimaryButton onClick={handleSend} disabled={loading}>
        {loading ? "Enviando código..." : "Enviar código"}
      </PrimaryButton>
    </div>
  );
}

// ─── Step 2: Code + new password ──────────────────────────────────────────────
function StepReset({ correo, onSuccess }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleDigit = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0 && !val) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(""));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    setError("");
    const codigo = code.join("");
    if (codigo.length < 6) {
      setError("Ingresa los 6 dígitos del código.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("La contraseña debe incluir letras y números.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(correo, codigo, password);
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.error || "Código incorrecto o expirado.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: font }}>
      <div>
        <p className="text-[11px] font-extrabold text-[#3dbb78] uppercase tracking-widest mb-1">
          Paso 2 de 2
        </p>
        <h2 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.5px] leading-tight">
          Ingresa tu código
        </h2>
        <p className="text-[13px] text-[#6b6b6b] font-medium mt-1.5">
          Enviamos un código a <strong className="text-[#1a1a1a]">{correo}</strong>. Caduca en 15 minutos.
        </p>
      </div>

      {/* PIN inputs */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !code[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
            className="w-11 h-14 text-center text-[22px] font-black border-2 rounded-[12px] outline-none transition-all focus:border-[#3dbb78] focus:ring-2 focus:ring-[#3dbb78]/20"
            style={{
              borderColor: d ? "#3dbb78" : "#e4e4e0",
              background: d ? "#f0fdf4" : "#fff",
              color: "#1a1a1a",
              fontFamily: "'Courier New', monospace",
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <InputField
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
        />
        <InputField
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {error && (
        <p className="text-[13px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[10px] px-3 py-2 animate-scale-in">
          {error}
        </p>
      )}

      <PrimaryButton onClick={handleSubmit} disabled={loading}>
        {loading ? "Guardando..." : "Restablecer contraseña"}
      </PrimaryButton>
    </div>
  );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────
function StepSuccess() {
  return (
    <div className="flex flex-col items-center gap-5 py-2" style={{ fontFamily: font }}>
      <div className="w-16 h-16 rounded-full bg-[#d6f5e8] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#25854f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-[22px] font-black text-[#1a1a1a] tracking-[-0.5px]">
          ¡Contraseña actualizada!
        </h2>
        <p className="text-[13px] text-[#6b6b6b] font-medium mt-2">
          Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión.
        </p>
      </div>
      <Link
        to="/login"
        className="w-full h-[46px] bg-[#1a1a1a] text-white rounded-full text-[14px] font-extrabold hover:bg-[#333] transition-colors flex items-center justify-center"
      >
        Ir a iniciar sesión
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email"); // "email" | "reset" | "success"
  const [correo, setCorreo] = useState("");

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="landing" />

      <div className="relative flex-1 overflow-hidden">
        {/* Gradient blob */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className="w-[1400px] h-[420px] rounded-b-[455px] animate-breathe"
            style={{ backgroundImage: "var(--hero-blob-img)" }}
          />
        </div>

        {/* Floating dots */}
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

        {/* Hero background */}
        <img
          src={HERO_BG}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
          style={{ top: 59 }}
        />

        {/* Heading */}
        <div className="relative z-10 pt-14 sm:pt-20 text-center px-4 animate-fade-in-up" style={{ animationDuration: "0.6s" }}>
          <h1
            className="text-[32px] sm:text-[42px] font-black text-[#1a1a1a] tracking-[-1.5px] leading-[1.1]"
            style={{ fontFamily: font }}
          >
            Recupera tu cuenta
          </h1>
          <p
            className="mt-3 text-[15px] font-medium text-[#6b6b6b] animate-fade-in"
            style={{ fontFamily: font, animationDelay: "0.2s" }}
          >
            En dos pasos recuperas el acceso.
          </p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 mx-auto mt-8 w-full max-w-[400px] px-4 sm:px-0 animate-fade-in-up"
          style={{ animationDelay: "0.15s", animationDuration: "0.55s" }}
        >
          <div className="bg-white/60 backdrop-blur-sm border border-[#e4e4e0] rounded-[20px] shadow-[0_2px_24px_rgba(0,0,0,0.08)] p-6 sm:p-8">
            {step === "email" && (
              <StepEmail
                onSuccess={(email) => { setCorreo(email); setStep("reset"); }}
              />
            )}
            {step === "reset" && (
              <StepReset
                correo={correo}
                onSuccess={() => setStep("success")}
              />
            )}
            {step === "success" && <StepSuccess />}
          </div>

          {step !== "success" && (
            <p className="text-center text-[13px] font-semibold text-[#6b6b6b] mt-4" style={{ fontFamily: font }}>
              ¿Recordaste tu contraseña?{" "}
              <Link to="/login" className="text-[#3dbb78] font-extrabold hover:underline">
                Inicia sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
