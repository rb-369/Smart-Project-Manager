'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  user: User;
}

interface GitHubUrlResponse {
  configured: boolean;
  oauth_url?: string;
  client_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /**
   * Set when the API could not be reached at all. The session is still
   * valid — we just cannot confirm it right now — so the app stays put and
   * tells the user, instead of bouncing them to the login screen.
   */
  sessionError: string | null;
  loginWithGitHub: () => Promise<void>;
  loginWithGitHubToken: (token: string, syncRepos?: boolean) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, fullName?: string, githubUsername?: string) => Promise<void>;
  switchDemoAccount: (account: 'alice' | 'bob' | 'demo') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setSessionError(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.get<User>('/auth/me');
      setUser(profile);
      setSessionError(null);
    } catch (err: any) {
      console.warn('[DevCommand Auth] Session restoration issue:', err);
      // Only clear tokens if the server explicitly confirmed 401 Unauthorized.
      if (!err?.isNetworkError && err?.status === 401) {
        api.clearTokens();
        setUser(null);
      } else if (err?.isNetworkError) {
        // The API is unreachable. The session may well still be valid, so
        // keep the tokens and tell the user rather than logging them out.
        setSessionError(err?.message || 'Cannot reach the DevCommand API.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen for unauthorized 401 events from api fetcher
    const handleUnauthorized = () => {
      setUser(null);
      setSessionError(null);
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (!path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/auth')) {
          router.push('/login');
        }
      }
    };

    window.addEventListener('devcommand:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('devcommand:unauthorized', handleUnauthorized);
    };
  }, [fetchCurrentUser, router]);

  const loginWithGitHub = async () => {
    const res = await api.get<GitHubUrlResponse>('/auth/github/url');
    if (!res.configured || !res.oauth_url) {
      throw new Error('GITHUB_OAUTH_NOT_CONFIGURED');
    }
    // Redirect to GitHub OAuth Authorization Page
    window.location.href = res.oauth_url;
  };

  const loginWithGitHubToken = async (token: string, syncRepos: boolean = true) => {
    const res = await api.post<AuthResponse>('/auth/github/token-login', {
      token: token.trim(),
      sync_repos: syncRepos,
    });
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
    router.push('/dashboard');
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
    router.push('/dashboard');
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    fullName?: string,
    githubUsername?: string
  ) => {
    const res = await api.post<AuthResponse>('/auth/register', {
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName?.trim() || undefined,
      github_username: githubUsername?.trim() || undefined,
    });
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
    router.push('/dashboard');
  };

  const switchDemoAccount = async (account: 'alice' | 'bob' | 'demo') => {
    const res = await api.post<AuthResponse>('/auth/demo-switch', {
      account,
    });
    api.setTokens(res.tokens.access_token, res.tokens.refresh_token);
    setUser(res.user);
    router.push('/dashboard');
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setSessionError(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        sessionError,
        loginWithGitHub,
        loginWithGitHubToken,
        loginWithEmail,
        registerWithEmail,
        switchDemoAccount,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
