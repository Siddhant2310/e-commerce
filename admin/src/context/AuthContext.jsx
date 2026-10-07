import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, tokenStore } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [accessToken, setAccessToken] = useState(() => tokenStore.getAccess());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    window.addEventListener("lnz:logout", logout);
    return () => window.removeEventListener("lnz:logout", logout);
  }, [logout]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    if (!data.accessToken) throw new Error("Login response had no access token");
    // Only administrators may enter this panel. Tokens are NOT stored for other roles.
    if (data.user?.role !== "admin") {
      const err = new Error("This account is not an administrator.");
      err.notAdmin = true;
      throw err;
    }
    tokenStore.save(data);
    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isAdmin: Boolean(accessToken) && user?.role === "admin", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
