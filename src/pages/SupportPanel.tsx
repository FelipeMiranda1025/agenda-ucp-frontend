import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  LogOut,
  Users,
  Shield,
  Network,
} from "lucide-react";
import ucpLogo from "@/assets/ucp-logo.png";

// SHA-256 hash (mismo método del AuthContext)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface UserRow {
  id: number;
  cc: string;
  email: string;
  first_name: string;
  second_name: string | null;
  first_last_name: string;
  second_last_name: string | null;
  id_rol: number;
  id_state: number;
  password: string;
  id_faculty: number | null;
  id_professional_career: number | null;
}

interface RoleRow {
  id: number;
  name: string;
}
interface StateRow {
  id: number;
  name: string;
}
interface HierarchyRow {
  id: string;
  user_id: number;
  supervisor_id: number;
}
interface FacultyRow {
  id: number;
  name: string;
}
interface CareerRow {
  id: number;
  name: string;
  id_faculty: number | null;
}

const emptyForm = {
  cc: "",
  email: "",
  first_name: "",
  second_name: "",
  first_last_name: "",
  second_last_name: "",
  id_rol: 1,
  id_state: 1,
  password: "",
  id_faculty: null as number | null,
  id_professional_career: null as number | null,
  supervisor_id: null as number | null,
};

export default function SupportPanel() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterCareer, setFilterCareer] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [hierarchyTarget, setHierarchyTarget] = useState<UserRow | null>(null);
  const [supervisorPick, setSupervisorPick] = useState<string>("none");

  // ----- Queries
  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["sp_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  const { data: roles = [] } = useQuery<RoleRow[]>({
    queryKey: ["sp_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("id,name").order("id");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const { data: states = [] } = useQuery<StateRow[]>({
    queryKey: ["sp_states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id,name").order("id");
      if (error) throw error;
      return (data ?? []) as StateRow[];
    },
  });

  const { data: hierarchy = [] } = useQuery<HierarchyRow[]>({
    queryKey: ["sp_hierarchy"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("user_hierarchy" as any) as any).select("*");
      if (error) throw error;
      return (data ?? []) as HierarchyRow[];
    },
  });

  const { data: faculties = [] } = useQuery<FacultyRow[]>({
    queryKey: ["sp_faculties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculties").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as FacultyRow[];
    },
  });

  const { data: careers = [] } = useQuery<CareerRow[]>({
    queryKey: ["sp_careers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_careers")
        .select("id,name,id_faculty")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CareerRow[];
    },
  });

  // ----- Mutations
  // Helper interno: aplica la jerarquía (borrar previa + insertar nueva si corresponde)
  const applyHierarchy = async (userId: number, supervisorId: number | null) => {
    await (supabase.from("user_hierarchy" as any) as any).delete().eq("user_id", userId);
    if (supervisorId !== null) {
      const { error } = await (supabase.from("user_hierarchy" as any) as any).insert({
        user_id: userId,
        supervisor_id: supervisorId,
      });
      if (error) throw error;
    }
  };

  const createUser = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      const hashed = await hashPassword(payload.password);
      const { data, error } = await supabase
        .from("users")
        .insert({
          cc: payload.cc.trim(),
          email: payload.email.trim(),
          first_name: payload.first_name.trim(),
          second_name: payload.second_name.trim() || null,
          first_last_name: payload.first_last_name.trim(),
          second_last_name: payload.second_last_name.trim() || null,
          id_rol: payload.id_rol,
          id_state: payload.id_state,
          password: hashed,
          id_faculty: payload.id_faculty,
          id_professional_career: payload.id_professional_career,
        })
        .select()
        .single();
      if (error) throw error;
      // Asignar supervisor si el rol lo requiere (1, 2, 3)
      if ([1, 2, 3].includes(payload.id_rol) && payload.supervisor_id !== null) {
        await applyHierarchy((data as any).id, payload.supervisor_id);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      qc.invalidateQueries({ queryKey: ["sp_users"] });
      qc.invalidateQueries({ queryKey: ["sp_hierarchy"] });
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Error al crear usuario"),
  });

  const updateUser = useMutation({
    mutationFn: async (payload: typeof emptyForm & { id: number }) => {
      const updates: any = {
        cc: payload.cc.trim(),
        email: payload.email.trim(),
        first_name: payload.first_name.trim(),
        second_name: payload.second_name.trim() || null,
        first_last_name: payload.first_last_name.trim(),
        second_last_name: payload.second_last_name.trim() || null,
        id_rol: payload.id_rol,
        id_state: payload.id_state,
        id_faculty: payload.id_faculty,
        id_professional_career: payload.id_professional_career,
      };
      if (payload.password && payload.password.length > 0) {
        updates.password = await hashPassword(payload.password);
      }
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", payload.id)
        .select()
        .single();
      if (error) throw error;
      // Reaplicar jerarquía según rol
      if ([1, 2, 3].includes(payload.id_rol)) {
        await applyHierarchy(payload.id, payload.supervisor_id);
      } else {
        // Roles sin jerarquía (4, 5): limpiar
        await applyHierarchy(payload.id, null);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Usuario actualizado");
      qc.invalidateQueries({ queryKey: ["sp_users"] });
      qc.invalidateQueries({ queryKey: ["sp_hierarchy"] });
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Error al actualizar"),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      // Limpia jerarquía vinculada
      await (supabase.from("user_hierarchy" as any) as any)
        .delete()
        .or(`user_id.eq.${id},supervisor_id.eq.${id}`);
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["sp_users"] });
      qc.invalidateQueries({ queryKey: ["sp_hierarchy"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "Error al eliminar"),
  });

  const setSupervisor = useMutation({
    mutationFn: async ({
      userId,
      supervisorId,
    }: {
      userId: number;
      supervisorId: number | null;
    }) => {
      // Borra existente
      await (supabase.from("user_hierarchy" as any) as any).delete().eq("user_id", userId);
      if (supervisorId !== null) {
        const { error } = await (supabase.from("user_hierarchy" as any) as any).insert({
          user_id: userId,
          supervisor_id: supervisorId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Jerarquía actualizada");
      qc.invalidateQueries({ queryKey: ["sp_hierarchy"] });
      setHierarchyTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "Error al asignar jerarquía"),
  });

  // ----- Helpers
  const roleName = (id: number) => roles.find((r) => r.id === id)?.name ?? "—";
  const stateName = (id: number) => states.find((s) => s.id === id)?.name ?? "—";
  const facultyName = (id: number | null) =>
    id ? faculties.find((f) => f.id === id)?.name ?? "—" : "—";
  const careerName = (id: number | null) =>
    id ? careers.find((c) => c.id === id)?.name ?? "—" : "—";
  const fullName = (u: UserRow) =>
    [u.first_name, u.second_name, u.first_last_name, u.second_last_name]
      .filter(Boolean)
      .join(" ");
  const supervisorOf = (uid: number) => {
    const h = hierarchy.find((x) => x.user_id === uid);
    if (!h) return null;
    return users.find((x) => x.id === h.supervisor_id) || null;
  };

  // Carreras filtradas por facultad seleccionada (para el filtro de la tabla)
  const careersForFilter = useMemo(() => {
    if (filterFaculty === "all") return careers;
    return careers.filter((c) => c.id_faculty === Number(filterFaculty));
  }, [careers, filterFaculty]);

  // Carreras filtradas por facultad del formulario (para el select del diálogo)
  const careersForForm = useMemo(() => {
    if (form.id_faculty === null) return careers;
    return careers.filter((c) => c.id_faculty === form.id_faculty);
  }, [careers, form.id_faculty]);

  // Candidatos a supervisor según el rol elegido en el formulario:
  // - Rol 1 (DocentePlanta) -> Director de Programa (rol 2) de la misma carrera
  // - Rol 2 (DirectorPrograma) -> Decano de Facultad (rol 3) de la misma facultad
  // - Rol 3 (DecanoFacultad) -> Vicerrector Académico (rol 4), único en el sistema
  // - Roles 4 y 5 -> sin supervisor
  const supervisorCandidates = useMemo(() => {
    if (form.id_rol === 1) {
      if (!form.id_professional_career) return [];
      return users.filter(
        (u) => u.id_rol === 2 && u.id_professional_career === form.id_professional_career
      );
    }
    if (form.id_rol === 2) {
      if (!form.id_faculty) return [];
      return users.filter((u) => u.id_rol === 3 && u.id_faculty === form.id_faculty);
    }
    if (form.id_rol === 3) {
      return users.filter((u) => u.id_rol === 4);
    }
    return [];
  }, [users, form.id_rol, form.id_faculty, form.id_professional_career]);

  // Auto-seleccionar el supervisor cuando solo hay un candidato y aún no se ha elegido uno válido
  useEffect(() => {
    if (![1, 2, 3].includes(form.id_rol)) {
      if (form.supervisor_id !== null) setForm((f) => ({ ...f, supervisor_id: null }));
      return;
    }
    const validIds = supervisorCandidates.map((s) => s.id);
    if (form.supervisor_id !== null && !validIds.includes(form.supervisor_id)) {
      setForm((f) => ({ ...f, supervisor_id: null }));
    }
    if (form.supervisor_id === null && supervisorCandidates.length === 1) {
      setForm((f) => ({ ...f, supervisor_id: supervisorCandidates[0].id }));
    }
  }, [supervisorCandidates, form.id_rol, form.supervisor_id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.cc.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        fullName(u).toLowerCase().includes(q) ||
        roleName(u.id_rol).toLowerCase().includes(q);
      const matchesFaculty =
        filterFaculty === "all" || u.id_faculty === Number(filterFaculty);
      const matchesCareer =
        filterCareer === "all" ||
        u.id_professional_career === Number(filterCareer);
      return matchesSearch && matchesFaculty && matchesCareer;
    });
  }, [users, search, roles, filterFaculty, filterCareer]);

  // Roles que pueden ser supervisores (excluye Soporte y al propio usuario)
  const possibleSupervisors = (forUserId: number) =>
    users.filter((u) => u.id !== forUserId && u.id_rol !== 5);

  // ----- Handlers
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };
  const openEdit = (u: UserRow) => {
    setEditing(u);
    const currentSup = supervisorOf(u.id);
    setForm({
      cc: u.cc,
      email: u.email,
      first_name: u.first_name,
      second_name: u.second_name || "",
      first_last_name: u.first_last_name,
      second_last_name: u.second_last_name || "",
      id_rol: u.id_rol,
      id_state: u.id_state,
      password: "",
      id_faculty: u.id_faculty,
      id_professional_career: u.id_professional_career,
      supervisor_id: currentSup ? currentSup.id : null,
    });
    setDialogOpen(true);
  };
  const openHierarchy = (u: UserRow) => {
    setHierarchyTarget(u);
    const sup = supervisorOf(u.id);
    setSupervisorPick(sup ? String(sup.id) : "none");
  };

  const submit = () => {
    if (!form.cc || !form.email || !form.first_name || !form.first_last_name) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (!editing && !form.password) {
      toast.error("La contraseña es obligatoria al crear");
      return;
    }
    // Para roles académicos (Docente Planta, Director de Programa, Decano de Facultad)
    // exigir Facultad, Carrera (cuando aplique) y Supervisor.
    if ([1, 2, 3].includes(form.id_rol)) {
      if (!form.id_faculty) {
        toast.error("La Facultad es obligatoria para este rol");
        return;
      }
      // Decano (3) no requiere carrera; Director (2) y Docente Planta (1) sí
      if ([1, 2].includes(form.id_rol) && !form.id_professional_career) {
        toast.error("La Carrera profesional es obligatoria para este rol");
        return;
      }
      if (form.supervisor_id === null) {
        const msg =
          form.id_rol === 3
            ? "No hay Vicerrector Académico disponible como supervisor."
            : form.id_rol === 2
              ? "Debes seleccionar un Decano de Facultad como supervisor."
              : "Debes seleccionar un Director de Programa como supervisor.";
        toast.error(msg);
        return;
      }
    }
    if (editing) {
      updateUser.mutate({ ...form, id: editing.id });
    } else {
      createUser.mutate(form);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ucpLogo} alt="UCP" className="h-10 w-10 rounded-md object-contain" />
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Panel de Soporte
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestión de usuarios del sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.firstLastName}
              </p>
              <p className="text-xs text-muted-foreground">CC {user?.id}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  Usuarios del sistema
                </CardTitle>
                <CardDescription>
                  Crea, edita, elimina usuarios y asigna su jerarquía de supervisión
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, CC, email, rol..."
                    className="pl-9 sm:w-72"
                  />
                </div>
                <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo usuario
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Filtros facultad / carrera */}
          <div className="border-b bg-muted/30 px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Facultad</Label>
              <Select
                value={filterFaculty}
                onValueChange={(v) => {
                  setFilterFaculty(v);
                  setFilterCareer("all");
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todas las facultades</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Carrera profesional</Label>
              <Select value={filterCareer} onValueChange={setFilterCareer}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todas las carreras</SelectItem>
                  {careersForFilter.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterFaculty !== "all" || filterCareer !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={() => {
                  setFilterFaculty("all");
                  setFilterCareer("all");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CC</TableHead>
                  <TableHead>Nombre completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Facultad</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const sup = supervisorOf(u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.cc}</TableCell>
                        <TableCell className="font-medium">{fullName(u)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{roleName(u.id_rol)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={facultyName(u.id_faculty)}>
                          {facultyName(u.id_faculty)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={careerName(u.id_professional_career)}>
                          {careerName(u.id_professional_career)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.id_state === 1 ? "default" : "outline"}
                            className={
                              u.id_state === 1
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : ""
                            }
                          >
                            {stateName(u.id_state)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {u.id_rol === 5 ? (
                            <span className="text-muted-foreground italic">
                              Sin jerarquía
                            </span>
                          ) : sup ? (
                            <span>{fullName(sup)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {u.id_rol !== 5 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openHierarchy(u)}
                                title="Asignar supervisor"
                              >
                                <Network className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(u)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(u)}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={u.id === Number(user?.id) || u.cc === user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del usuario. Deja la contraseña vacía para no cambiarla."
                : "Completa los datos del nuevo usuario del sistema."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Cédula (CC) *</Label>
              <Input
                value={form.cc}
                onChange={(e) => setForm({ ...form, cc: e.target.value })}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@ucp.edu.co"
              />
            </div>
            <div className="space-y-2">
              <Label>Primer nombre *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Segundo nombre</Label>
              <Input
                value={form.second_name}
                onChange={(e) => setForm({ ...form, second_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Primer apellido *</Label>
              <Input
                value={form.first_last_name}
                onChange={(e) =>
                  setForm({ ...form, first_last_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Segundo apellido</Label>
              <Input
                value={form.second_last_name}
                onChange={(e) =>
                  setForm({ ...form, second_last_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={String(form.id_rol)}
                onValueChange={(v) => setForm({ ...form, id_rol: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select
                value={String(form.id_state)}
                onValueChange={(v) => setForm({ ...form, id_state: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Facultad{[1, 2, 3].includes(form.id_rol) && <span className="text-destructive"> *</span>}
              </Label>
              <Select
                value={form.id_faculty === null ? "none" : String(form.id_faculty)}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    id_faculty: v === "none" ? null : Number(v),
                    // Reset carrera si ya no pertenece a la nueva facultad
                    id_professional_career:
                      v === "none"
                        ? form.id_professional_career
                        : careers.find((c) => c.id === form.id_professional_career)?.id_faculty === Number(v)
                          ? form.id_professional_career
                          : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona facultad" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">— Sin facultad —</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Carrera profesional{[1, 2].includes(form.id_rol) && <span className="text-destructive"> *</span>}
              </Label>
              <Select
                value={
                  form.id_professional_career === null
                    ? "none"
                    : String(form.id_professional_career)
                }
                onValueChange={(v) => {
                  if (v === "none") {
                    setForm({ ...form, id_professional_career: null });
                  } else {
                    const careerId = Number(v);
                    const career = careers.find((c) => c.id === careerId);
                    // Auto-asigna la facultad de la carrera elegida
                    setForm({
                      ...form,
                      id_professional_career: careerId,
                      id_faculty: career?.id_faculty ?? form.id_faculty,
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona carrera" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">— Sin carrera —</SelectItem>
                  {careersForForm.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.id_rol === 5 && (
              <div className="sm:col-span-2 text-xs text-muted-foreground italic">
                Nota: el rol Soporte normalmente no pertenece a ninguna facultad/carrera.
              </div>
            )}
            {form.id_rol === 4 && (
              <div className="sm:col-span-2 text-xs text-muted-foreground italic">
                Nota: el rol Vicerrector Académico no pertenece a ninguna facultad/carrera y no tiene supervisor.
              </div>
            )}

            {/* Asignación automática de supervisor según el rol */}
            {[1, 2, 3].includes(form.id_rol) && (
              <div className="sm:col-span-2 space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  Supervisor asignado
                </Label>
                {form.id_rol === 3 ? (
                  // Decano -> Vicerrector único
                  supervisorCandidates.length === 0 ? (
                    <p className="text-xs text-destructive">
                      No existe ningún Vicerrector Académico en el sistema. Crea primero ese usuario.
                    </p>
                  ) : (
                    <div className="text-sm">
                      <span className="font-medium">{fullName(supervisorCandidates[0])}</span>
                      <span className="text-muted-foreground"> · Vicerrector Académico</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Asignado automáticamente: el Vicerrector Académico es único en el sistema.
                      </p>
                    </div>
                  )
                ) : form.id_rol === 2 ? (
                  // Director de programa -> Decano de la facultad seleccionada
                  !form.id_faculty ? (
                    <p className="text-xs text-muted-foreground">
                      Selecciona primero una facultad para ver el Decano correspondiente.
                    </p>
                  ) : supervisorCandidates.length === 0 ? (
                    <p className="text-xs text-destructive">
                      No existe un Decano para esta facultad. Crea primero ese usuario.
                    </p>
                  ) : (
                    <Select
                      value={form.supervisor_id ? String(form.supervisor_id) : ""}
                      onValueChange={(v) => setForm({ ...form, supervisor_id: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el Decano" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisorCandidates.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {fullName(s)} · Decano de Facultad
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                ) : (
                  // Docente Planta -> Director de la carrera seleccionada
                  !form.id_professional_career ? (
                    <p className="text-xs text-muted-foreground">
                      Selecciona primero una carrera profesional para ver el Director correspondiente.
                    </p>
                  ) : supervisorCandidates.length === 0 ? (
                    <p className="text-xs text-destructive">
                      No existe un Director de Programa para esta carrera. Crea primero ese usuario.
                    </p>
                  ) : (
                    <Select
                      value={form.supervisor_id ? String(form.supervisor_id) : ""}
                      onValueChange={(v) => setForm({ ...form, supervisor_id: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el Director de Programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisorCandidates.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {fullName(s)} · Director de Programa
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                )}
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>
                Contraseña {editing ? "(dejar vacío para no cambiar)" : "*"}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "••••••••" : "Mínimo 4 caracteres"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={createUser.isPending || updateUser.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {editing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hierarchy Dialog */}
      <Dialog open={!!hierarchyTarget} onOpenChange={(o) => !o && setHierarchyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Asignar jerarquía
            </DialogTitle>
            <DialogDescription>
              Define el supervisor directo de{" "}
              <span className="font-medium text-foreground">
                {hierarchyTarget && fullName(hierarchyTarget)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label>Supervisor</Label>
            <Select value={supervisorPick} onValueChange={setSupervisorPick}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un supervisor" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">— Sin supervisor —</SelectItem>
                {hierarchyTarget &&
                  possibleSupervisors(hierarchyTarget.id).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {fullName(s)} · {roleName(s.id_rol)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHierarchyTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                hierarchyTarget &&
                setSupervisor.mutate({
                  userId: hierarchyTarget.id,
                  supervisorId:
                    supervisorPick === "none" ? null : Number(supervisorPick),
                })
              }
              disabled={setSupervisor.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              Guardar jerarquía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a{" "}
              <span className="font-medium text-foreground">
                {deleteTarget && fullName(deleteTarget)}
              </span>{" "}
              y sus relaciones de jerarquía. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
