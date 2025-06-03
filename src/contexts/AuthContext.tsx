
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username_input: string, password_input: string) => Promise<boolean>;
  logout: () => void;
  username: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials (DO NOT USE IN PRODUCTION)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pali@123';
const AUTH_COOKIE_NAME = 'authToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') {
      return;
    }
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  };

  const eraseCookie = (name: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const checkAuthStatus = useCallback(() => {
    const token = getCookie(AUTH_COOKIE_NAME);
    if (token === 'valid_admin_token') {
      setIsLoggedIn(true);
      setUsername(ADMIN_USERNAME);
    } else {
      setIsLoggedIn(false);
      setUsername(null);
      // Middleware handles primary redirection.
      // Client-side redirect can be a fallback if needed, but ensure it doesn't cause loops.
      // if (pathname !== '/login') {
      //   router.push('/login');
      // }
    }
    setIsLoading(false);
  }, [pathname]); // Removed router from dependencies to prevent potential re-render loops

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);


  const login = useCallback(async (username_input: string, password_input: string): Promise<boolean> => {
    if (username_input === ADMIN_USERNAME && password_input === ADMIN_PASSWORD) {
      setCookie(AUTH_COOKIE_NAME, 'valid_admin_token', 1); // Cookie for 1 day
      setIsLoggedIn(true);
      setUsername(ADMIN_USERNAME);
      router.push('/');
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    eraseCookie(AUTH_COOKIE_NAME);
    setIsLoggedIn(false);
    setUsername(null);
    router.push('/login');
  }, [router]);

  // This block was causing the "document is not defined" error during SSR
  // The isLoading state handled by useEffect and ProtectedAppLayout/LoginPage should be sufficient.
  // The middleware handles server-side redirection.
  // if (isLoading && pathname !== '/login' && (typeof document === 'undefined' || !getCookie(AUTH_COOKIE_NAME))) {
  //    return null; 
  // }


  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, username }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

