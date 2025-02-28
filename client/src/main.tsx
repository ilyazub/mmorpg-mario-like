import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isProduction, DEBUG } from "./env";

// Log environment information in development mode
if (DEBUG) {
  console.log(`Application running in ${isProduction ? 'production' : 'development'} mode`);
  console.log(`Debug mode: ${DEBUG ? 'enabled' : 'disabled'}`);
}

createRoot(document.getElementById("root")!).render(<App />);
