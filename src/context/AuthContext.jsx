import React, { createContext, useEffect, useState } from "react";
import auth from "../services/auth";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, []);

  const saveSession = (data) => {
    const u = data?.data?.user || data?.user || null;
    const accessToken = data?.data?.accessToken || data?.accessToken || null;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setToken(accessToken);
    }

    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const resp = await auth.login(credentials);
      saveSession(resp.data);
      return resp;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      return await auth.register(payload);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call backend logout (clears httpOnly cookie)
      await auth.logout();
    } catch (error) {
      console.error("Backend logout error:", error);
      // Continue with local logout even if backend fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const tryRefresh = async () => {
    try {
      const resp = await auth.refresh();
      const accessToken =
        resp.data?.data?.accessToken || resp.data?.accessToken;
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        setToken(accessToken);
      }
      return resp;
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        token,
        setToken,
        login,
        logout,
        register,
        saveSession,
        tryRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
