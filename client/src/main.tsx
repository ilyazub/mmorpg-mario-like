import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isProduction, DEBUG } from "./env";

// Log environment information in development mode
if (DEBUG) {
  console.log(`Application running in ${isProduction ? 'production' : 'development'} mode`);
  console.log(`Debug mode: ${DEBUG ? 'enabled' : 'disabled'}`);
}

// Find the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Cannot find root element to mount application");
} else {
  // Create and render the app
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
