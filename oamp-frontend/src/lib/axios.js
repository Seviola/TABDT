import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Tambahkan token JWT ke setiap request jika user sudah login
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
      console.error("Backend server is unreachable");
    }

    return Promise.reject(err);
  }
);

export default api;