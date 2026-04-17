import EstadioLogin from "../assets/mabloImages/EstadioLogin.webp";
import golLogin from "../assets/mabloImages/golLogin.webp";
import emptyMablo from "../assets/mabloImages/emptyMablo.webp";
import mabloTablaPosiciones from "../assets/mabloImages/mabloTablaPosiciones.webp";
import vestidoresDashboard from "../assets/mabloImages/vestidoresDashboard.webp";

export * from "./Navbar";
export * from "./Cards";
export { CardSkeleton } from "./Cards";
export * from "./Forms";
export { InputField, PrimaryButton } from "./Forms";

// Views
export { PrediccionesView } from "./PrediccionesView";

// Constants
export const LOGO_SVG = "/iconoQuiniepicks.png";
export const NAV_LOGO = "/iconoQuiniepicks.png";
export const MASCOT_DASHBOARD = vestidoresDashboard;
export const MASCOT_TABLE = mabloTablaPosiciones;
export const HERO_BG = EstadioLogin;
export const REGISTER_BG = golLogin;
export const EMPTY_STATE_IMG = emptyMablo;
