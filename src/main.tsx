import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Удаляем все service workers (PWA отключён)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// Prevent iOS Safari auto-zoom when focusing inputs with font-size < 16px
// by temporarily locking the viewport scale during focus
const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
if (viewport) {
  const original = viewport.content;
  const locked = original + ", maximum-scale=1";
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
      viewport.content = locked;
    }
  });
  document.addEventListener("focusout", () => {
    viewport.content = original;
  });
}

createRoot(document.getElementById("root")!).render(<App />);
