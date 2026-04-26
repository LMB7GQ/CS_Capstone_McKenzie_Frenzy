const API_BASE = "http://localhost:5000/api/auth";

export interface User {
  appUserId: number;
  username: string;
  email: string;
  displayName?: string;
  role?: string;
}

export interface LoginResponse {
  ok: boolean;
  user?: User;
  error?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export async function login(emailOrUsername: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      ok: false,
      error: "Network error. Please try again.",
    };
  }
}

export async function register(data: RegisterData): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      ok: false,
      error: "Network error. Please try again.",
    };
  }
}

export async function logout(): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });
    return await response.json();
  } catch {
    return { ok: false };
  }
}

export async function getCurrentUser(): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      credentials: "include",
    });
    return await response.json();
  } catch {
    return { ok: false, error: "Not logged in" };
  }
}