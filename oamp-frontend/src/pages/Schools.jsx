import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import {
  School,
  Users,
  Trophy,
  Gamepad2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Schools() {
  const navigate = useNavigate();
  const {
    data: schoolsRes,
    isLoading: isLoadingSchools,
    isError: isErrorSchools,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get("/schools"),
  });

  const {
  data: participantsRes,
  isLoading: isLoadingParticipants,
  isError: isErrorParticipants,
} = useQuery({
  queryKey: ["schools", "participant-stats"],
  queryFn: () => api.get("/schools/participant-stats"),
  refetchInterval: 5000,
});

  const schools = schoolsRes?.data || [];
  const participants = Array.isArray(participantsRes?.data)
    ? participantsRes.data
    : [];

  const isLoading = isLoadingSchools || isLoadingParticipants;
  const isError = isErrorSchools || isErrorParticipants;

  function getSchoolStats(schoolName) {
    const schoolParticipants = participants.filter(
      (p) => (p.school_name || "").trim() === schoolName.trim()
    );

    const playedParticipants = schoolParticipants.filter(
      (p) => p.total_time != null && Number(p.total_time) > 0
    );

    const times = playedParticipants
      .map((p) => Number(p.total_time))
      .filter((time) => Number.isFinite(time) && time > 0);

    const fastestTime =
      times.length > 0 ? Math.min(...times) : null;

    // Tampilan peserta terendah
    const top10Lowest = [...playedParticipants]
      .sort(
        (a, b) =>
          Number(a.total_time) - Number(b.total_time)
      )
      .slice(0, 10);

    return {
      total: schoolParticipants.length,
      played: playedParticipants.length,
      fastestTime,
      top10Lowest,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manajemen Sekolah
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          Kelola sekolah dan lihat perkembangan peserta berdasarkan sekolah.
        </p>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <School className="h-7 w-7" />
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat data sekolah...
            </div>
          ) : isError ? (
            <p className="mt-6 text-sm text-red-500">
              Gagal memuat data sekolah atau peserta.
            </p>
          ) : schools.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Belum ada sekolah.
            </p>
          ) : (
            <div className="mt-6 w-full space-y-4 text-left">
              {schools.map((school) => {
                const stats = getSchoolStats(school.name);

                return (
                  <div
                    key={school.id}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    {/* Nama Sekolah */}
                    <div className="mb-5">
                      <p className="font-bold text-foreground">
                        {school.name}
                      </p>
                    </div>

                    {/* Statistik */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Jumlah Peserta */}
                      <SchoolStat
                        icon={<Users className="h-4 w-4" />}
                        label="Jumlah Peserta"
                        value={`${stats.total} peserta`}
                        color="blue"
                      />

                      {/* Waktu Tercepat */}
                      <SchoolStat
                        icon={<Trophy className="h-4 w-4" />}
                        label="Waktu Tercepat"
                        value={
                          stats.fastestTime != null
                            ? `${stats.fastestTime.toFixed(2)} detik`
                            : "N/A"
                        }
                        color="amber"
                      />

                      {/* Sudah Bermain */}
                      <SchoolStat
                        icon={<Gamepad2 className="h-4 w-4" />}
                        label="Sudah Bermain"
                        value={`${stats.played} peserta`}
                        color="green"
                      />
                    </div>
                    {/* 10 Peserta dengan Total Waktu Terendah */}
                    {stats.top10Lowest.length > 0 && (
                      <div className="mt-6">
                        <div className="mb-3">
                          <p className="font-bold text-foreground">
                            10 Peserta dengan Total Waktu Terendah
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Berdasarkan total waktu permainan peserta.
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border">
                          {/* Header tabel */}
                          <div className="grid grid-cols-[50px_1fr_120px_80px_100px_140px] gap-3 bg-muted/40 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <span>#</span>
                            <span>Peserta</span>
                            <span>UID</span>
                            <span>Kelas</span>
                            <span>Percobaan</span>
                            <span>Total Waktu</span>
                          </div>

                          {/* Daftar peserta */}
                          {stats.top10Lowest.map((participant, index) => (
                            <div
                              key={
                                participant.id ||
                                participant.uid ||
                                index
                              }
                              className="grid grid-cols-[50px_1fr_120px_80px_100px_140px] items-center gap-3 border-t border-border px-4 py-3 cursor-pointer group transition-all hover:bg-muted"
                              onClick={() => navigate(`/analytics/${participant.uid}`)} >

                              <span className="font-semibold text-muted-foreground">
                                {index + 1}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                  {participant.name || "-"}
                                </p>

                                {participant.age != null && (
                                  <p className="text-xs text-muted-foreground">
                                    {participant.age} th
                                  </p>
                                )}
                              </div>

                              <span className="text-sm text-muted-foreground">
                                {participant.uid || "-"}
                              </span>

                              <span className="text-sm text-foreground">
                                {participant.grade || "-"}
                              </span>

                              <span className="text-sm text-foreground">
                                {participant.attempts ?? 0}
                              </span>

                              <span className="font-semibold text-foreground">
                                {Number(participant.total_time).toFixed(2)} detik
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statColors = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  green: "border-green-200 bg-green-50 text-green-700",
};

function SchoolStat({ icon, label, value, color }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        statColors[color]
      )}
    >
      <div className="p-2 rounded-lg bg-white shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
          {label}
        </p>

        <p className="text-lg font-bold">
          {value}
        </p>
      </div>
    </div>
  );
}