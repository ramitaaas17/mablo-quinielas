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
export const LOGO_SVG = "https://www.figma.com/api/mcp/asset/af1ca7ab-3b12-48e4-974d-8ff3d673c11d";
export const NAV_LOGO = "https://www.figma.com/api/mcp/asset/f5a9f746-a954-4ee6-a0a3-d093e919a0ae";
export const MASCOT_DASHBOARD = vestidoresDashboard;
export const MASCOT_TABLE = mabloTablaPosiciones;
export const HERO_BG = EstadioLogin;
export const REGISTER_BG = golLogin;
export const EMPTY_STATE_IMG = emptyMablo;
