import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  School,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export function Schools() {
  const { data: schoolsRes, isLoading, isError } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.get("/schools"),
  });

  const schools = schoolsRes?.data || [];

  const queryClient = useQueryClient();

  const [resetting, setResetting] = useState({});
  const [selectedSchool, setSelectedSchool] = useState(null);

  async function handleResetSchool() {
    if (!selectedSchool) return;

    const school = selectedSchool;

    setResetting((prev) => ({
      ...prev,
      [school.id]: true,
    }));

    try {
      const res = await api.post(
        `/admin/schools/${school.id}/reset-participants`
      );

      toast.success(
        res.data?.message || "Peserta sekolah berhasil direset."
      );

      queryClient.invalidateQueries({
        queryKey: ["schools"],
      });

      queryClient.invalidateQueries({
        queryKey: ["participants"],
      });

      setSelectedSchool(null);
    } catch (error) {
      console.error("Gagal reset peserta sekolah:", error);

      toast.error(
        error.response?.data?.message ||
          "Gagal mereset peserta sekolah."
      );
    } finally {
      setResetting((prev) => ({
        ...prev,
        [school.id]: false,
      }));
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Sekolah
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Kelola sekolah dan data peserta berdasarkan sekolah.
          </p>
        </div>

        {/* Container */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <School className="h-7 w-7" />
            </div>

            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Memuat data sekolah...
              </p>
            ) : isError ? (
              <p className="mt-4 text-sm text-red-500">
                Gagal memuat data sekolah.
              </p>
            ) : schools.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Belum ada sekolah.
              </p>
            ) : (
              <div className="mt-6 w-full space-y-3 text-left">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="font-bold text-foreground">
                      {school.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Kode sekolah:{" "}
                      <span className="font-semibold text-foreground">
                        {school.code}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      UID terakhir:{" "}
                      <span className="font-semibold text-foreground">
                        {school.uid_counter > 0
                          ? `${school.code}${String(
                              school.uid_counter
                            ).padStart(3, "0")}`
                          : "-"}
                      </span>
                    </p>

                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        disabled={resetting[school.id]}
                        onClick={() => setSelectedSchool(school)}
                      >
                        {resetting[school.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mereset...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Peserta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!resetting[selectedSchool.id]) {
                setSelectedSchool(null);
              }
            }}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            {/* Title */}
            <h2 className="mt-4 text-lg font-bold text-foreground">
              Reset Peserta?
            </h2>

            {/* Description */}
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <p className="font-medium">
                  Semua peserta dan data game terkait akan dihapus, kembali uid lama
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={resetting[selectedSchool.id]}
                onClick={() => setSelectedSchool(null)}
              >
                Batal
              </Button>

              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={resetting[selectedSchool.id]}
                onClick={handleResetSchool}
              >
                {resetting[selectedSchool.id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mereset...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Peserta
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}