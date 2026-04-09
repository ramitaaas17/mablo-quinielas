import { cn } from "../utils/cn";

export function InputField({ 
  label, 
  placeholder, 
  type = "text", 
  value, 
  onChange, 
  error,
  helperText,
  name
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[12px] font-bold uppercase tracking-[0.4px] text-[#6b6b6b]" style={{ fontFamily: "Nunito, sans-serif" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "bg-white border rounded-[10px] h-11 px-4 text-[14.5px] font-semibold text-[#1a1a1a] placeholder:text-[#757575] outline-none transition-all w-full",
          "focus:ring-2",
          error 
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50" 
            : "border-[#e0e0dc] focus:border-[#3dbb78] focus:ring-[#3dbb78]/20"
        )}
        style={{ fontFamily: "Nunito, sans-serif" }}
      />
      {error && helperText && (
        <span className="text-[11px] font-bold text-red-500 mt-0.5" style={{ fontFamily: "Nunito, sans-serif" }}>
          {helperText}
        </span>
      )}
    </div>
  );
}

export function PrimaryButton({ children, onClick, className = "", type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-[#1a1a1a] text-white font-extrabold text-[15px] h-12 rounded-full w-full transition-all inline-flex items-center justify-center",
        "active:scale-[0.98]",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#333] hover:shadow-lg",
        className
      )}
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      {children}
    </button>
  );
}
