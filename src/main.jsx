import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { SessionProvider } from "./context/SessionContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <AdminProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </AdminProvider>
    </HashRouter>
  </StrictMode>
);
