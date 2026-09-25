import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

const GRADES = ["4A", "4B", "4C", "5A", "5B", "5C", "6A", "6B", "6C"];

const initialForm = {
  name: "",
  age: "",
  grade: "",
  gender: "",
  height: "",
  weight: "",
  dexterity: "",
  grip_strength: "",
};

export function Pendaftaran() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      grade: form.grade,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/participants", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Peserta berhasil didaftarkan!");
      const newUid = res.data?.uid;
      await queryClient.invalidateQueries({ queryKey: ["participants"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      navigate(`/paywall/${newUid}`);
    } catch (err) {
      console.error("[Register] Failed:", err?.response?.status, err?.response?.data);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Gagal mendaftarkan peserta.";
      if (status === 409) {
        toast.error("UID sudah terdaftar. Gunakan UID lain.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto">
      <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
        <CardHeader className="bg-muted border-b border-[var(--color-border)]">
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <UserPlus className="h-5 w-5" />
            Registration Station
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nama peserta"
                required
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select
                  value={form.grade}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, grade: val }))
                  }
                >
                  <SelectTrigger className="border border-[var(--color-border)] shadow-sm rounded-xl">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Participant"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}