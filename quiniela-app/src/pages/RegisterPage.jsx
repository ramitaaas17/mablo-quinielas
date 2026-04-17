import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, InputField, PrimaryButton, REGISTER_BG } from "../components";
import { useStore } from "../store";
import { authService } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useStore();

  const [form, setForm] = useState({
    nombre: "", apellido: "", usuario: "", correo: "", fecha: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: null }));
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "Requerido";
    if (!form.apellido.trim()) newErrors.apellido = "Requerido";
    if (!form.usuario.trim()) newErrors.usuario = "Requerido";
    if (!form.correo.includes("@")) newErrors.correo = "Correo inválido";
    if (!form.fecha) newErrors.fecha = "Requerido";
    if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirm) newErrors.confirm = "Las contraseñas no coinciden";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const payload = {
        nombre_completo: `${form.nombre.trim()} ${form.apellido.trim()}`,
        username: form.usuario.trim(),
        correo: form.correo.trim().toLowerCase(),
        contrasena: form.password,
        fecha_nacimiento: form.fecha,
      };
      const data = await authService.registro(payload);
      login(data);
      // Si venía de un enlace de invitación, regresar a él
      const pendingCode = sessionStorage.getItem("pending_invite_code");
      if (pendingCode && !data.is_admin) {
        sessionStorage.removeItem("pending_invite_code");
        navigate(`/unirse/${pendingCode}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al registrarse. Intenta de nuevo.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col relative overflow-hidden">
      <Navbar variant="landing" />

      {/* Background Gradient Blob — wrapper centers it, inner animates */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          className="w-[200vw] md:w-[1400px] h-[400px] md:h-[500px] rounded-b-[50%] animate-breathe"
          style={{ backgroundImage: "var(--hero-blob-img)", opacity: 0.55 }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 lg:pl-10 lg:pr-16 xl:pl-20 w-full max-w-[1440px] mx-auto py-8 lg:gap-14">

        {/* Left Image */}
        <div className="hidden lg:flex w-[55%] xl:w-[60%] justify-center xl:justify-start items-center h-full relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <img
            src={REGISTER_BG}
            alt="Perro anotando gol"
            fetchPriority="high"
            decoding="async"
            className="w-full max-w-[800px] object-contain drop-shadow-lg"
          />
        </div>

        {/* Right Form Card */}
        <div className="w-full max-w-[480px] lg:w-[45%] xl:w-[40%] flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <form
            onSubmit={handleSubmit}
            className="w-full bg-[#f2f2ef] rounded-[32px] p-8 md:p-10 flex flex-col gap-4 shadow-sm"
          >
            <div className="mb-2 text-center">
              <h2 className="text-[24px] font-black text-[#1a1a1a] tracking-[-0.5px]" style={{ fontFamily: "Nunito, sans-serif" }}>
                Crear cuenta
              </h2>
              <p className="text-[13px] font-medium text-[#6b6b6b] mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>
                Completa tus datos para empezar a jugar.
              </p>
            </div>

            {/* Nombre + Apellido */}
            <div className="flex flex-col sm:flex-row gap-4">
              <InputField label="Nombre" placeholder="Carlos" value={form.nombre} error={!!errors.nombre} helperText={errors.nombre} onChange={set("nombre")} />
              <InputField label="Apellido" placeholder="Ruiz" value={form.apellido} error={!!errors.apellido} helperText={errors.apellido} onChange={set("apellido")} />
            </div>

            <InputField label="Nombre de usuario" placeholder="@carlosruiz" value={form.usuario} error={!!errors.usuario} helperText={errors.usuario} onChange={set("usuario")} />
            <InputField label="Correo electrónico" type="email" placeholder="hola@ejemplo.com" value={form.correo} error={!!errors.correo} helperText={errors.correo} onChange={set("correo")} />
            <InputField label="Fecha de nacimiento" type="date" value={form.fecha} error={!!errors.fecha} helperText={errors.fecha} onChange={set("fecha")} />

            {/* Password + Confirm */}
            <div className="flex flex-col sm:flex-row gap-4">
              <InputField label="Contraseña" type="password" placeholder="••••••••" value={form.password} error={!!errors.password} helperText={errors.password} onChange={set("password")} />
              <InputField label="Confirmar" type="password" placeholder="••••••••" value={form.confirm} error={!!errors.confirm} helperText={errors.confirm} onChange={set("confirm")} />
            </div>

            {apiError && (
              <p className="text-[13px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-red-200 rounded-[10px] px-3 py-2" style={{ fontFamily: "Nunito, sans-serif" }}>
                {apiError}
              </p>
            )}

            <PrimaryButton type="submit" className="mt-4" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </PrimaryButton>

            <p className="text-center text-[13px] font-semibold text-[#6b6b6b] mt-2" style={{ fontFamily: "Nunito, sans-serif" }}>
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-[#3dbb78] font-extrabold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
