import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("token"));
    return () => setAuthTokenGetter(null);
  }, []);

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("token");
      setToken(null);
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    }
  }, [isError, queryClient]);

  const login = (newToken: string) => {
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    setLocation("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user: token ? user || null : null,
        isLoading: isLoading && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
