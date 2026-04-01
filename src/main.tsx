import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Удаляем все service workers (PWA отключён)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
