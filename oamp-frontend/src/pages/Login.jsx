import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/axios";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { token, user } = response;
      console.log("LOGIN RESPONSE:", response.data);

      // Simpan token dan data user untuk sesi login
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      console.log("Login berhasil:", user);
      console.log("Role:", user.role);
      console.log("Token:", token);

      navigate("/dashboard-role");
    } catch (error) {
      console.error("Login error:", error);

      const message =
        error.response?.data?.error ||
        "Username atau password salah.";

      alert(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card Login */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">

          <h2 className="text-4xl font-bold text-red-600 text-center mb-6">
            Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              />
            </div>

            {/* Tombol Login */}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
              Login
            </button>

          </form>

          {/* Belum punya akun */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link
                to="/register-participant"
                className="text-red-600 font-medium hover:text-red-700 transition"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}