import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import "./pages/HQorg/index.css";
import "./pages/HQManager/index.css";
import "./pages/HQEmployee/index.css";
import "./pages/Fieldorg/index.css";
import "./pages/FieldEmployee/index.css";
import "./pages/FieldManager/index.css";
createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
