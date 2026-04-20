import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (window.location.hostname === "private-law-articles.lovable.app") {
  window.location.replace(
    "https://roman-bevzenko.com" +
      window.location.pathname +
      window.location.search +
      window.location.hash
  );
}

// Удаляем все service workers (PWA отключён)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
