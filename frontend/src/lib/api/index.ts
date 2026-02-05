import axios, { AxiosError } from "axios";

function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  // Client-side: match API hostname AND protocol to current page
  // so cookies are always sent to the correct origin and no mixed content
  if (typeof window !== "undefined") {
    try {
      const url = new URL(envUrl);
      url.hostname = window.location.hostname;
      url.protocol = window.location.protocol;
      // Use default port for the protocol (443 for https, 80 for http)
      if (
        window.location.port === "" ||
        window.location.port === "80" ||
        window.location.port === "443"
      ) {
        url.port = "";
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      return envUrl;
    }
  }

  return envUrl;
}

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send httpOnly cookies automatically
});

// Helper to get cookie value (for CSRF token only)
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// Request interceptor to add CSRF token (auth is handled via httpOnly cookies)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Add CSRF token for state-changing requests
      const csrfToken = getCookie("XSRF-TOKEN");
      if (
        csrfToken &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(
          config.method?.toUpperCase() || "",
        )
      ) {
        config.headers["X-XSRF-TOKEN"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth failure - cookies are cleared by backend
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
