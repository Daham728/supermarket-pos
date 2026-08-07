const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "supermarket_pos_token";

export const tokenStorage = {
  get() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  set(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export async function apiRequest(endpoint, options = {}) {
  const token = tokenStorage.get();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Make sure the backend is running on port 5000.",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && endpoint !== "/auth/login") {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    const error = new Error(data.message || "The request failed.");
    error.status = response.status;
    error.details = data.errors || [];

    throw error;
  }

  return data;
}

export const authApi = {
  login(credentials) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getCurrentUser() {
    return apiRequest("/auth/me");
  },
};