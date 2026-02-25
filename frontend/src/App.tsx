import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/Login/App";
import HQOrgApp from "./pages/HQOrg/App";
import HQManagerApp from "./pages/HQManager/App";
import HQEmployeeApp from "./pages/HQEmployee/App";

import FieldOrgApp from "./pages/FieldOrg/App";
import FieldManagerApp from "./pages/FieldManager/App";
import FieldEmployeeApp from "./pages/FieldEmployee/App";

import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* HQ ORG */}
      <Route
        path="/hq-org"
        element={
          <ProtectedRoute allowedRoles={["HQ_ORG"]}>
            <HQOrgApp />
          </ProtectedRoute>
        }
      />

      {/* FIELD ORG */}
      <Route
        path="/field-org"
        element={
          <ProtectedRoute allowedRoles={["FIELD_ORG"]}>
            <FieldOrgApp />
          </ProtectedRoute>
        }
      />

      {/* HQ ROUTES */}
      <Route
        path="/hq-manager"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <HQManagerApp />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hq-employee"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <HQEmployeeApp />
          </ProtectedRoute>
        }
      />

      {/* FIELD ROUTES */}
      <Route
        path="/field-manager"
        element={
          <ProtectedRoute allowedRoles={["FIELD_MANAGER"]}>
            <FieldManagerApp />
          </ProtectedRoute>
        }
      />

      <Route
        path="/field-employee"
        element={
          <ProtectedRoute allowedRoles={["FIELD_EMPLOYEE"]}>
            <FieldEmployeeApp />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
