import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function User() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get("/users");
                setUsers(response.users || []);
            } catch (err) {
                console.error("Gagal mengambil data:", err);
                console.error("Status:", err.response?.status);
                console.error("Response:", err.response?.data);

                setError(
                    err.response?.data?.error ||
                    `Gagal mengambil data pengguna (${err.response?.status || "unknown"})`
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">
                    Memuat data pengguna...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Daftar Pengguna</h1>

            <p className="mt-1 text-sm text-muted-foreground">
                Berikut adalah daftar pengguna yang terdaftar di sistem.
            </p>

            <div className="mt-6 rounded-lg border bg-background">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[70px]">
                                    No
                                </TableHead>
                                <TableHead>Nama Pengguna</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Sekolah</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada pengguna.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{index + 1}</TableCell>

                                        <TableCell className="font-medium">
                                            {user.name || "-"}
                                        </TableCell>

                                        <TableCell>
                                            {user.username || "-"}
                                        </TableCell>

                                        <TableCell className="capitalize">
                                            {user.role || "-"}
                                        </TableCell>

                                        <TableCell>
                                            {user.school?.name || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
                Jumlah pengguna: {users.length}
            </p>
        </div>
    );
}