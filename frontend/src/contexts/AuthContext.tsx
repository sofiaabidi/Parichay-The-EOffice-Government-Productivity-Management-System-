import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string) => {
    try {
      // REAL BACKEND USERS (including HQ_ORG and FIELD_ORG)
      let res;

      if (role === "FIELD_MANAGER") {
        res = await authAPI.loginFieldManager(email, password);
      } else if (role === "FIELD_EMPLOYEE") {
        res = await authAPI.loginFieldEmployee(email, password);
      } else {
        res = await authAPI.login(email, password);
      }

      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      if (newUser.role === "MANAGER") navigate("/hq-manager");
      if (newUser.role === "EMPLOYEE") navigate("/hq-employee");
      if (newUser.role === "FIELD_MANAGER") navigate("/field-manager");
      if (newUser.role === "FIELD_EMPLOYEE") navigate("/field-employee");
      if (newUser.role === "HQ_ORG") navigate("/hq-org");
      if (newUser.role === "FIELD_ORG") navigate("/field-org");

    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
