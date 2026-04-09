import EstadioLogin from "../assets/mabloImages/EstadioLogin.png";
import golLogin from "../assets/mabloImages/golLogin.png";
import emptyMablo from "../assets/mabloImages/emptyMablo.png";
import mabloTablaPosiciones from "../assets/mabloImages/mabloTablaPosiciones.png";
import vestidoresDashboard from "../assets/mabloImages/vestidoresDashboard.png";

export * from "./Navbar";
export * from "./Cards";
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
