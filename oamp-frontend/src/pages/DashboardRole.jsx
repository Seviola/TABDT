import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Download,
  Clock,
  Layers,
} from "lucide-react";

export function DashboardRole() {
  const [leaderboardMode, setLeaderboardMode] = useState("training");

  // Ambil akun yang sedang login
  const currentUser = useMemo(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  }, []);

  const role = currentUser?.role || "";

  const school =
    role === "admin"
      ? "Semua Sekolah"
      : currentUser?.school?.name || "Sekolah belum tersedia";

  const roleLabel =
    role === "guru"
      ? "Guru"
      : role === "orang_tua"
        ? "Orang Tua"
        : role === "admin"
          ? "Admin"
          : "Pengguna";

  // Ambil data berdasarkan mode Latihan / Kompetisi
  const batchParams = {
    params: {
      batch_id: "all",
      mode: leaderboardMode,
    },
  };

  const {
    data: boardRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leaderboard-role", leaderboardMode],
    queryFn: () => api.get("/leaderboard", batchParams),
    refetchInterval: 5000,
  });

  const { data: timeStatsRes } = useQuery({
    queryKey: ["time-stats-role", leaderboardMode],
    queryFn: () => api.get("/leaderboard/time-stats", batchParams),
    refetchInterval: 5000,
  });

  const leaderboard = useMemo(
    () => boardRes?.data?.data || boardRes?.data || [],
    [boardRes]
  );

  const totalParticipants = leaderboard.length;

  const timeStats = timeStatsRes?.data || {};

  const fastestTime =
    Number(timeStats.fastest_time) > 0
      ? Number(timeStats.fastest_time)
      : null;

  const averageTime =
    Number(timeStats.average_time) > 0
      ? Number(timeStats.average_time)
      : null;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              OAMP Leaderboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{school}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Mode toggle: Latihan / Kompetisi */}
          <div className="flex items-center bg-muted border border-border rounded-xl p-1">
            <button
              onClick={() => setLeaderboardMode("training")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                leaderboardMode === "training"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Latihan
            </button>

            <button
              onClick={() => setLeaderboardMode("competition")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                leaderboardMode === "competition"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Kompetisi
            </button>
          </div>

          {/* Register */}
          <Button asChild variant="outline" size="sm">
            <Link to="/register">
              <UserPlus className="h-4 w-4 mr-2" />
              Register New
            </Link>
          </Button>

          {/* Report */}
          <Button asChild variant="outline" size="sm">
            <Link to="/export">
              <Download className="h-4 w-4 mr-2" />
              Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-[#fee2e2] border border-[var(--color-border)] text-foreground px-4 py-3 rounded-xl text-sm font-bold shadow-sm">
          Gagal memuat leaderboard. Server offline.
        </div>
      )}

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Players"
          value={totalParticipants}
          icon={<Users className="h-5 w-5" />}
          color="blue"/>

        <StatCard
          title="Fastest Time"
          value={
            fastestTime != null
              ? `${fastestTime.toFixed(2).replace(".", ",")} s`
              : "-"
          }
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />

        <StatCard
          title="Average Time"
          value={
            averageTime != null
              ? `${averageTime.toFixed(2).replace(".", ",")} s`
              : "-"
          }
          icon={<Clock className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Global Rankings */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted py-4 border-b-2 border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5" />
                Global Rankings
              </CardTitle>

              <p className="text-sm text-muted-foreground mt-1">
                {leaderboardMode === "training"
                  ? "Peserta yang mengikuti latihan"
                  : "Peserta yang mengikuti kompetisi"}
              </p>
            </div>

            
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <LeaderboardTable
            data={leaderboard}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const colorMap = {
  blue:
    "bg-[#4f46e5] text-white border border-[var(--color-border)] shadow-sm",

  amber:
    "bg-[#fbbf24] text-foreground border border-[var(--color-border)] shadow-sm",

  green:
    "bg-[#10b981] text-white border border-[var(--color-border)] shadow-sm",
};

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={`p-3 rounded-lg ${
            colorMap[color] || "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {title}
          </p>

          <p className="text-3xl font-black tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}