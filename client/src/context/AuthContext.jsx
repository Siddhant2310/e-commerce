import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, tokenStore } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // read saved login once, on first render
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [accessToken, setAccessToken] = useState(() => tokenStore.getAccess());
  const loading = false;

  const logout = useCallback(async () => {
    tokenStore.clear(); // backend has no logout route; deleting the tokens is the logout
    setUser(null);
    setAccessToken(null);
  }, []);

  // api.js fires this event when refresh fails
  useEffect(() => {
    const onForcedLogout = () => { setUser(null); setAccessToken(null); };
    window.addEventListener("lnz:logout", onForcedLogout);
    return () => window.removeEventListener("lnz:logout", onForcedLogout);
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    if (!data.accessToken) throw new Error("Login response had no access token");
    tokenStore.save(data);
    setUser(data.user);
    setAccessToken(data.accessToken);
    return data.user;
  };

  const register = (details) => authApi.register(details);

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated: Boolean(accessToken), loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
