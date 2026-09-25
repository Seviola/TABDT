import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

export function RegisterParticipant() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    school_id: "",
    role: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.role) {
      alert("Silakan pilih role terlebih dahulu.");
      return;
    }

    try {
      const response = await api.post(
        "/auth/registerParticipant",
        {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          school_id: Number(formData.school_id),
        }
      );

      console.log("Akun berhasil dibuat:", response.data);
      toast.success("Akun berhasil dibuat. Silakan login.");

      navigate("/login");
    } catch (error) {
      console.error("Register error:", error);

      const message =
        error.response?.data?.error ||
        "Gagal membuat akun. Silakan coba lagi.";

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8">

          {/* Judul */}
          <h2 className="text-[30px] font-bold text-red-600 mb-2">
            Register
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nama */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2" >
                Nama
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition">
              </input>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                required
                className="w-full px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"/>

              <p className="text-xs text-muted-foreground mt-1">
                username digunakan untuk login*
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                required
                className="w-full px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"/>
            </div>

            {/* Asal Sekolah */}
            <div>
            <label
                htmlFor="school_id"
                className="block text-sm font-medium text-foreground mb-2">
                Asal Sekolah
            </label>

            <div className="relative">
              <select
                id="school_id"
                name="school_id"
                value={formData.school_id}
                onChange={handleChange}
                required
                style={{ appearance: "none", WebkitAppearance: "none" }}
                className="w-full px-4 py-3 pr-12 bg-background text-foreground border border-border rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              >
                <option value="">Pilih sekolah</option>
                <option value="1">SDIT Al Uswah Surabaya</option>
                <option value="2">SDN Menur Pumpungan IV</option>
              </select>

              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                <ChevronDown
                  className="w-4 h-4 text-foreground"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: "guru" })
                }
                className={`px-4 py-3 rounded-lg border transition ${
                  formData.role === "guru"
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 border-border bg-card text-foreground hover:border-red-400 text-foreground hover:border-red-400"
                }`}
              >
                Guru
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: "orang_tua" })
                }
                className={`px-4 py-3 rounded-lg border transition ${
                  formData.role === "orang_tua"
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 bg-card border border-border text-foreground hover:border-red-400"
                }`}>
                Orang Tua
              </button>

              {/* <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, role: "admin" })
                }
                className={`px-4 py-3 rounded-lg border transition ${
                  formData.role === "admin"
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 bg-card border border-border text-foreground hover:border-red-400"
                }`}>
                Admin
              </button> */}
            </div>
          </div>

            {/* Tombol Daftar */}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition">
              Daftar
            </button>

          </form>

          {/* Link Login */}
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">
              Sudah punya akun?{" "}
            </span>

            <Link
              to="/login"
              className="text-sm font-medium text-red-600 hover:text-red-700 transition">
              Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}