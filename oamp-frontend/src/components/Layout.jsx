import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { StatusBanner } from "@/components/StatusBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Home, UserPlus, Download, LayoutDashboard, Users, Swords, Trophy, Shield, ShieldCheck, ShieldOff, Sun, Moon, LogOut, Eye, EyeOff, User, Lock, School } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/participants", label: "Peserta", icon: Users },
  { to: "/children", label: "Peserta", icon: Users },
  { to: "/schools", label: "Sekolah", icon: School },
  { to: "/pendaftaran", label: "Daftar", icon: UserPlus },
  { to: "/tournaments", label: "Cup", icon: Trophy },
  { to: "/users", label: "Pengguna", icon: Users },
  { to: "/register", label: "Daftar", icon: UserPlus },
  { to: "/duel", label: "Duel", icon: Swords },
  { to: "/export", label: "Export", icon: Download },
];

export function Layout() {
  const isOnline = useHealthCheck();
  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser") || "null")
  );
  const userRole = localStorage.getItem("role");
  const userName = currentUser?.name || "Pengguna";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  const location = useLocation();
  const navigate = useNavigate();
  const { adminMode, showPinDialog, setShowPinDialog, attemptActivate, deactivate } = useAdminMode();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (!profileOpen || !localStorage.getItem("token")) return;

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);

      try {
        const response = await api.get("/profile");
        const user = response.user;

        if (!cancelled && user) {
          const savedUser = JSON.parse(
            localStorage.getItem("currentUser") || "null"
          );

          const updatedUser = {
            ...savedUser,
            ...user,
          };

          setCurrentUser(updatedUser);
          localStorage.setItem(
            "currentUser",
            JSON.stringify(updatedUser)
          );

          setProfileForm({
            name: user.name || "",
            username: user.username || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.error || "Gagal memuat profil"
          );
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileOpen]);

  function handlePinSubmit(e) {
    e.preventDefault();
    if (!attemptActivate(pin)) {
      setPinError(true);
      setPin("");
    }
  }
  
  async function handleSaveProfile(e) {
    e.preventDefault();

    const name = profileForm.name.trim();
    const username = profileForm.username.trim();

    if (!name || !username) {
      toast.error("Nama dan username wajib diisi");
      return;
    }

    const changingPassword =
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== "";

    if (changingPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("Lengkapi semua kolom password");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password baru minimal 6 karakter");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Konfirmasi password baru tidak cocok");
        return;
      }
    }

    setSavingProfile(true);

    try {
      const response = await api.put("/profile", {
        name,
        username,
      });

      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      if (changingPassword) {
        await api.put("/profile/password", {
          current_password: currentPassword,
          new_password: newPassword,
        });
      }

      const latest = await api.get("/profile");
      const finalUser = latest.user || response.user;

      setCurrentUser(finalUser);
      localStorage.setItem("currentUser", JSON.stringify(finalUser));

      setProfileForm({
        name: finalUser.name || "",
        username: finalUser.username || "",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setEditMode(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Gagal memperbarui profil"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40">
        <div className="bg-card border-b-2 border-border">
          <div className="max-w-7xl mx-auto px-4 py-3  flex flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center border border-border shadow-sm transition-all group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-sm">
                  <span className="text-xl text-primary-foreground font-black">🧩</span>
                </div>
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border border-border" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-lg tracking-tight text-foreground truncate" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                  Otak Atik Merah Putih
                </span>
                <span className="text-muted-foreground text-xs font-medium ml-1.5">
                  Block Design Test
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 max-w-full">
              <nav className="flex items-center gap-1 bg-muted p-1.5 rounded-2xl border border-border shadow-sm max-w-full overflow-x-auto">
                {navItems
                  .filter((item) => {
                    // BELUM LOGIN
                    // Tampilkan halaman umum, termasuk /participants
                    if (!userRole) {
                      return (
                        item.to !== "/children" &&
                        item.to !== "/pendaftaran" &&
                        item.to !== "/schools"
                      );
                    }

                    // SUDAH LOGIN
                    // Menu Sekolah hanya untuk ADMIN
                    if (item.to === "/schools" && userRole !== "admin") {
                      return false;
                    }
                    // Jangan tampilkan menu umum /participants
                    if (item.to === "/participants") {
                      return false;
                    }

                    // Home tidak ditampilkan setelah login
                    if (item.to === "/") {
                      return false;
                    }

                    // GURU
                    if (userRole === "guru") {
                      return (
                        item.to !== "/tournaments" &&
                        item.to !== "/register" &&
                        item.to !== "/users" 
                      );
                    }

                    // ORANG TUA
                    if (userRole === "orang_tua") {
                      return (
                        item.to === "/dashboard" ||
                        item.to === "/children"
                      );
                    }

                    // ADMIN
                    if (userRole === "admin") {
                      return item.to !== "/pendaftaran"&&
                             item.to !== "/register" &&
                             item.to !== "/tournaments";
                    }

                    return false;
                  })
                  .map((item) => {
                  const isActive =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={
                        item.to === "/dashboard" && userRole
                          ? "/dashboard-role"
                          : item.to
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground border border-border shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-white hover:border hover:border-border hover:shadow-sm dark:hover:bg-card"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile */}
              {userRole && (
                <button type="button" onClick={() => setProfileOpen(true)} className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border border-border shadow-sm hover:opacity-90 transition-opacity" title="Profil">
                  {userInitials}
                </button>
              )}

              {/* Logout */}
              {userRole && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                  title="Keluar dari akun"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}

              {/* Dark/Light toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-bold bg-muted border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Admin mode toggle */}
              {adminMode ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={deactivate}
                  title="Admin mode aktif — klik untuk matikan"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setShowPinDialog(true);
                    setPinError(false);
                    setPin("");
                  }}
                  title="Aktifkan admin mode"
                >
                  <ShieldOff className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-1 pb-1">
          <StatusBanner isOnline={isOnline} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-slide-up">
          <Outlet />
        </div>
      </main>

      {/* Profile Dialog */}
      <Dialog
        open={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open);

          if (!open) {
            setEditMode(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
          }
        }}  >
        
          <DialogContent className=" w-[calc(100vw-2rem)] max-w-md max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden p-0 rounded-2xl ">
          {/* Header Profile */}
           <div className="shrink-0 bg-gradient-to-r from-red-600 to-red-500 px-4 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-8">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-red-600 text-2xl font-bold shadow-md">
                  {(currentUser?.name || "U").charAt(0).toUpperCase()}
                </div>

                <div className="text-white min-w-0">
                  <DialogTitle className="text-xl font-bold text-white">
                    {currentUser?.name || "Pengguna"}
                  </DialogTitle>

                  <p className="text-sm text-white/80 mt-1">
                    @{currentUser?.username || "-"}
                  </p>

                  <span className="inline-flex mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {currentUser?.role === "orang_tua"
                      ? "Orang Tua"
                      : currentUser?.role === "guru"
                        ? "Guru"
                        : currentUser?.role || "-"}
                  </span>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Body Profile */}
          <div className="flex-1 min-h-0 w-full min-w-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 space-y-4">
            {profileLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Memuat profil...
              </p>
            ) : editMode ? (
              <>
                <form onSubmit={handleSaveProfile} className="w-full min-w-0 space-y-4">
                  {/* Nama */}
                  <div className="w-full min-w-0 space-y-1.5">
                    <label className="text-sm font-medium">
                      Nama Pengguna
                    </label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Masukkan nama"
                      maxLength={100}
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="w-full min-w-0 space-y-1.5">
                    <label className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          username: e.target.value,
                        })
                      }
                      placeholder="Masukkan username"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold">
                      Ubah Password (Opsional)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kosongkan ketiga kolom password jika tidak ingin menggantinya.
                    </p>
                  </div>

                  {/* Password Lama */}
                  <div className="w-full min-w-0 space-y-1.5">
                    <label className="text-sm font-medium">
                      Password Lama
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password lama"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        aria-label="Tampilkan atau sembunyikan password lama"
                      >
                        {showCurrentPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div className="w-full min-w-0 space-y-1.5">
                    <label className="text-sm font-medium">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Tampilkan atau sembunyikan password baru"
                      >
                        {showNewPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="w-full min-w-0 space-y-1.5">
                    <label className="text-sm font-medium">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label="Tampilkan atau sembunyikan konfirmasi password"
                      >
                        {showConfirmPassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Tombol Simpan dan Batal */}
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:flex-1"
                      disabled={savingProfile}
                      onClick={() => {
                        setEditMode(false);
                        setProfileForm({
                          name: currentUser?.name || "",
                          username: currentUser?.username || "",
                        });
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                    >
                      Batal
                    </Button>

                    <Button
                      type="submit"
                      className="w-full sm:flex-1"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Informasi Sekolah */}
                <div className="w-full min-w-0 flex items-center gap-4 rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <School className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Sekolah
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {currentUser?.school?.name || "-"}
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <User className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Username
                    </p>
                    <p className="text-sm font-semibold text-foreground break-all">
                      {currentUser?.username || "-"}
                    </p>
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <Lock className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Password
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground break-all">
                        {showPassword
                          ? currentUser?.password || "Password tidak tersedia"
                          : "••••••••"}
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                        title={showPassword ? "Sembunyikan password" : "Lihat password"}
                        aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Role
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {currentUser?.role === "orang_tua"
                        ? "Orang Tua"
                        : currentUser?.role === "guru"
                          ? "Guru"
                          : currentUser?.role || "-"}
                    </p>
                  </div>
                </div>

                {/* Tombol Edit Profil */}
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setProfileForm({
                      name: currentUser?.name || "",
                      username: currentUser?.username || "",
                    });
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setEditMode(true);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profil
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

     {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Admin Mode
            </DialogTitle>
            <DialogDescription>
              Masukkan PIN untuk mengaktifkan tombol admin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setPinError(false);
              }}
              className={cn("text-center text-lg tracking-[0.5em]", pinError && "border-red-300 focus-visible:ring-red-200")}
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-500 text-center">PIN salah</p>
            )}
            <Button type="submit" className="w-full">Buka</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
