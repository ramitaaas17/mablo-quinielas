import { useNavigate } from "react-router-dom";
import { Navbar, EMPTY_STATE_IMG } from "../components";

export default function EmptyStatePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Navbar variant="app" showWeek />

      <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-6 sm:px-10">
        <img src={EMPTY_STATE_IMG} alt="" loading="lazy" decoding="async" className="w-[180px] sm:w-[220px] mb-6 object-contain" />
        <h2 className="text-[24px] sm:text-[28px] font-black text-[#1a1a1a] tracking-tight text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
          Aún no tienes quinielas
        </h2>
        <p className="text-[14px] sm:text-[15px] font-medium text-[#6b6b6b] mt-2 mb-8 max-w-[320px] text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
          Entra a la bolsa de quinielas y empieza a participar para ganar premios increíbles.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-[#1a1a1a] text-white font-extrabold text-[15px] h-12 px-8 rounded-full hover:bg-[#333] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-95"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Explorar bolsa
        </button>
      </div>
    </div>
  );
}
