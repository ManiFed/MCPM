import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[MCPM] Mounting app...");

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
  console.log("[MCPM] App mounted.");
} else {
  console.error("[MCPM] Root element not found!");
}
