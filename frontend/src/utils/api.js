import axios from "axios";

const getDefaultApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window === "undefined") return "http://localhost:5000";

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost
    ? "http://localhost:5000"
    : `${window.location.origin}/_/backend`;
};

const API_BASE_URL = getDefaultApiBaseUrl();

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export const getAssetUrl = (assetPath) => {
  if (!assetPath) return "";
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return assetPath;
  }

  return `${API_BASE_URL}${assetPath}`;
};

export default API;
