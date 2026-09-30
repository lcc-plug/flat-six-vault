import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App.jsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
);

// This app previously registered a service worker for offline support, but
// a cache-first bug trapped at least one user on a stale build across
// several deploys. Actively unregister any leftover registration so the
// browser goes back to fetching straight from the network, and don't
// register a new one — see public/sw.js for the one-time cleanup worker
// that recovers clients still stuck on the old registration.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}
