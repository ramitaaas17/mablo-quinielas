import { cn } from "../utils/cn";

export function InputField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onKeyDown,
  error,
  helperText,
  name,
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full group/field">
      <label
        className="text-[12px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b] transition-colors group-focus-within/field:text-[#3dbb78]"
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={cn(
          "border rounded-[10px] h-11 px-4 text-[14.5px] font-semibold",
          "placeholder:text-[#a0a09c] outline-none transition-all duration-200 w-full",
          "focus:ring-[3px] focus:scale-[1.01]",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-[#e0e0dc] focus:border-[#3dbb78] focus:ring-[#3dbb78]/20"
        )}
        style={{
          fontFamily: "Nunito, sans-serif",
          backgroundColor: "var(--input-bg)",
          color: "var(--text)",
        }}
      />
      {error && helperText && (
        <span
          className="text-[11px] font-bold text-red-500 mt-0.5 animate-fade-in"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}

/* ── Three-dot loading indicator ────────────────────────────────── */
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-[4px] ml-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-white/80 inline-block"
          style={{
            animation: "dotPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </span>
  );
}

export function PrimaryButton({ children, onClick, className = "", type = "button", disabled = false }) {
  const isLoading = disabled && String(children).includes("...");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-extrabold text-[15px] h-12 rounded-full w-full transition-all duration-200 inline-flex items-center justify-center",
        "active:scale-[0.97]",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-xl hover:shadow-[#3dbb78]/30 hover:-translate-y-[1px]",
        className
      )}
      style={{
        fontFamily: "Nunito, sans-serif",
        backgroundColor: "var(--btn-bg)",
        color: "var(--btn-text)",
      }}
    >
      {isLoading ? (
        <span className="inline-flex items-center">
          {String(children).replace(/\.\.\.$/, "")}
          <LoadingDots />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
