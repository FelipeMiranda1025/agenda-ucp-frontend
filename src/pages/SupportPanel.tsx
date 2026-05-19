import { useState, useMemo, useEffect, useRef } from "react";
import { api } from "@/lib/api";
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
  Eye,
  EyeOff,
} from "lucide-react";
import ucpLogo from "@/assets/ucp-logo.png";


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
  const [showPassword, setShowPassword] = useState(false);

  // ----- Queries
  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["sp_users"],
    queryFn: async () => {
      try {
        return await api.get<UserRow[]>("/users?order=id.asc");
      } catch (err: any) {
        toast.error("Error al cargar usuarios: " + err.message);
        return [];
      }
    },
  });

  const { data: roles = [] } = useQuery<RoleRow[]>({
    queryKey: ["sp_roles"],
    queryFn: async () => {
      try {
        return await api.get<RoleRow[]>("/roles?order=id.asc");
      } catch (err: any) {
        toast.error("Error al cargar roles");
        return [];
      }
    },
  });

  const { data: states = [] } = useQuery<StateRow[]>({
    queryKey: ["sp_states"],
    queryFn: async () => {
      try {
        return await api.get<StateRow[]>("/states?order=id.asc");
      } catch {
        return [];
      }
    },
  });

  const { data: hierarchy = [] } = useQuery<HierarchyRow[]>({
    queryKey: ["sp_hierarchy"],
    queryFn: async () => {
      try {
        return await api.get<HierarchyRow[]>("/user-hierarchy");
      } catch {
        return [];
      }
    },
  });

  const { data: faculties = [] } = useQuery<FacultyRow[]>({
    queryKey: ["sp_faculties"],
    queryFn: async () => {
      try {
        return await api.get<FacultyRow[]>("/faculties?order=name.asc");
      } catch {
        return [];
      }
    },
  });

  const { data: careers = [] } = useQuery<CareerRow[]>({
    queryKey: ["sp_careers"],
    queryFn: async () => {
      try {
        return await api.get<CareerRow[]>("/professional-careers?order=name.asc");
      } catch {
        return [];
      }
    },
  });

  // ----- Mutations con manejo de errores y try/catch
  const applyHierarchy = async (userId: number, supervisorId: number | null) => {
    try {
      await api.delete(`/user-hierarchy/${userId}`).catch(() => undefined);
      if (supervisorId !== null) {
        await api.post("/user-hierarchy", {
          user_id: userId,
          supervisor_id: supervisorId,
        });
      }
    } catch (err: any) {
      console.error("Error en applyHierarchy:", err);
      throw new Error("No se pudo actualizar la jerarquía");
    }
  };

  const createUser = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      const data = await api.post<{ id: number }>("/users", {
        cc: payload.cc.trim(),
        email: payload.email.trim(),
        first_name: payload.first_name.trim(),
        second_name: payload.second_name.trim() || null,
        first_last_name: payload.first_last_name.trim(),
        second_last_name: payload.second_last_name.trim() || null,
        id_rol: payload.id_rol,
        id_state: payload.id_state,
        password: payload.password,
        id_faculty: payload.id_faculty,
        id_professional_career: payload.id_professional_career,
      });
      if ([1, 2, 3].includes(payload.id_rol) && payload.supervisor_id !== null) {
        await applyHierarchy(data.id, payload.supervisor_id);
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
        updates.password = payload.password;
      }
      const data = await api.put<{ id: number }>(`/users/${payload.id}`, updates);
      if ([1, 2, 3].includes(payload.id_rol)) {
        await applyHierarchy(payload.id, payload.supervisor_id);
      } else {
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
      await api.delete(`/users/${id}`);
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
      await applyHierarchy(userId, supervisorId);
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

  // ============================================================
  // LÓGICA MEJORADA PARA CANDIDATOS A SUPERVISOR (diálogo de jerarquía)
  // ============================================================
  const getSupervisorCandidates = (targetUser: UserRow): UserRow[] => {
    if (!targetUser) return [];

    switch (targetUser.id_rol) {
      case 1: // Docente Planta -> Directores de Programa de la misma carrera
        if (!targetUser.id_professional_career) return [];
        return users.filter(
          (u) => u.id_rol === 2 && u.id_professional_career === targetUser.id_professional_career && u.id !== targetUser.id
        );

      case 2: // Director de Programa -> Decanos de la misma facultad
        if (!targetUser.id_faculty) return [];
        return users.filter(
          (u) => u.id_rol === 3 && u.id_faculty === targetUser.id_faculty && u.id !== targetUser.id
        );

      case 3: // Decano -> Vicerrector (rol 4)
        return users.filter((u) => u.id_rol === 4 && u.id !== targetUser.id);

      case 4: // Vicerrector no tiene supervisor
      case 5: // Soporte no tiene supervisor
      default:
        return [];
    }
  };

  // Carreras filtradas por facultad (para filtro de tabla)
  const careersForFilter = useMemo(() => {
    if (filterFaculty === "all") return careers;
    return careers.filter((c) => c.id_faculty === Number(filterFaculty));
  }, [careers, filterFaculty]);

  // Carreras filtradas por facultad del formulario (para diálogo crear/editar)
  const careersForForm = useMemo(() => {
    if (form.id_faculty === null) return careers;
    return careers.filter((c) => c.id_faculty === form.id_faculty);
  }, [careers, form.id_faculty]);

  // Candidatos a supervisor en el formulario con fallback inteligente
  const supervisorCandidatesForm = useMemo(() => {
    if (form.id_rol === 1) {
      if (!form.id_professional_career) return [];
      const exact = users.filter(
        (u) => u.id_rol === 2 && u.id_professional_career === form.id_professional_career
      );
      if (exact.length > 0) return exact;
      const inFaculty = form.id_faculty
        ? users.filter((u) => u.id_rol === 2 && u.id_faculty === form.id_faculty)
        : [];
      if (inFaculty.length > 0) return inFaculty;
      return users.filter((u) => u.id_rol === 2);
    }
    if (form.id_rol === 2) {
      if (!form.id_faculty) return [];
      const exact = users.filter((u) => u.id_rol === 3 && u.id_faculty === form.id_faculty);
      if (exact.length > 0) return exact;
      return users.filter((u) => u.id_rol === 3);
    }
    if (form.id_rol === 3) {
      return users.filter((u) => u.id_rol === 4);
    }
    return [];
  }, [users, form.id_rol, form.id_faculty, form.id_professional_career]);

  // Auto-selección en formulario
  const prevRolRef = useRef(form.id_rol);
  useEffect(() => {
    const rolChanged = prevRolRef.current !== form.id_rol;
    prevRolRef.current = form.id_rol;
    if (editing) return;
    if (![1, 2, 3].includes(form.id_rol)) {
      if (form.supervisor_id !== null) setForm((f) => ({ ...f, supervisor_id: null }));
      return;
    }
    if (rolChanged || form.supervisor_id === null) {
      const validIds = supervisorCandidatesForm.map((s) => s.id);
      if (form.supervisor_id !== null && !validIds.includes(form.supervisor_id)) {
        setForm((f) => ({ ...f, supervisor_id: null }));
      }
      if (form.supervisor_id === null && supervisorCandidatesForm.length === 1) {
        setForm((f) => ({ ...f, supervisor_id: supervisorCandidatesForm[0].id }));
      }
    }
  }, [supervisorCandidatesForm, form.id_rol, form.supervisor_id, editing]);

  // Filtro de usuarios para la tabla
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
        filterCareer === "all" || u.id_professional_career === Number(filterCareer);
      return matchesSearch && matchesFaculty && matchesCareer;
    });
  }, [users, search, roles, filterFaculty, filterCareer]);

  // ----- Handlers
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowPassword(false);
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
    setShowPassword(false);
    setDialogOpen(true);
  };
  const openHierarchy = (u: UserRow) => {
    setHierarchyTarget(u);
    const sup = supervisorOf(u.id);
    setSupervisorPick(sup ? String(sup.id) : "none");
  };

  const submit = () => {
    if (!form.cc || !form.email || !form.first_name || !form.first_last_name) {
      toast.error("Completa todos los campos obligatorios (*)");
      return;
    }

    // 1. Validación estricta de cédula (mínimo 6 dígitos numéricos)
    const ccClean = form.cc.trim();
    if (!/^\d+$/.test(ccClean) || ccClean.length < 6) {
      toast.error("La cédula debe tener mínimo 6 dígitos numéricos enteros sin letras.");
      return;
    }

    // 2. Validación estricta de correo institucional UCP
    const emailClean = form.email.trim();
    if (!emailClean.toLowerCase().endsWith("@ucp.edu.co")) {
      toast.error("El correo debe terminar con @ucp.edu.co");
      return;
    }

    // 3. Validación estricta de contraseña (si se está creando o si se ingresa al editar)
    if (!editing || form.password) {
      const p = form.password;
      if (p.length < 8) {
        toast.error("La contraseña debe tener mínimo 8 caracteres.");
        return;
      }
      if (!/[A-Z]/.test(p)) {
        toast.error("La contraseña debe incluir al menos una letra mayúscula.");
        return;
      }
      if (!/[a-z]/.test(p)) {
        toast.error("La contraseña debe incluir al menos una letra minúscula.");
        return;
      }
      if (!/[@$!%*?&#\-_+]/.test(p)) {
        toast.error("La contraseña debe incluir al menos un carácter especial (@ - $ ! #).");
        return;
      }
    }
    if ([1, 2, 3].includes(form.id_rol)) {
      if (!form.id_faculty) {
        toast.error("La Facultad es obligatoria para este rol");
        return;
      }
      if ([1, 2].includes(form.id_rol) && !form.id_professional_career) {
        toast.error("La Carrera profesional es obligatoria para este rol");
        return;
      }
      if (form.supervisor_id === null && supervisorCandidatesForm.length > 0) {
        const msg =
          form.id_rol === 3
            ? "Debes seleccionar un Vicerrector Académico como supervisor."
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
      {/* Header igual que antes... */}
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

      {/* Main content: tabla y filtros (igual que antes, sin cambios) */}
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
                            {u.id_rol !== 5 && u.id_rol !== 4 && (
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

      {/* ================================================================ */}
      {/* DIÁLOGO DE JERARQUÍA MEJORADO */}
      {/* ================================================================ */}
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

          {/* Información del usuario objetivo */}
          {hierarchyTarget && (
            <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-md">
              <p><span className="font-medium">Rol:</span> {roleName(hierarchyTarget.id_rol)}</p>
              {hierarchyTarget.id_faculty && (
                <p><span className="font-medium">Facultad:</span> {facultyName(hierarchyTarget.id_faculty)}</p>
              )}
              {hierarchyTarget.id_professional_career && (
                <p><span className="font-medium">Carrera:</span> {careerName(hierarchyTarget.id_professional_career)}</p>
              )}
            </div>
          )}

          <div className="space-y-2 py-2">
            <Label>Supervisor</Label>
            <Select value={supervisorPick} onValueChange={setSupervisorPick}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un supervisor" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">— Sin supervisor —</SelectItem>
                {hierarchyTarget &&
                  getSupervisorCandidates(hierarchyTarget).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {fullName(s)} · {roleName(s.id_rol)}
                      {s.id_rol === 2 && ` (${careerName(s.id_professional_career)})`}
                      {s.id_rol === 3 && ` (${facultyName(s.id_faculty)})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {hierarchyTarget && hierarchyTarget.id_rol === 4 && (
              <p className="text-xs text-muted-foreground">
                Los Vicerrectores no tienen supervisor asignado.
              </p>
            )}
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
                  supervisorId: supervisorPick === "none" ? null : Number(supervisorPick),
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

      {/* Diálogo de creación/edición (sin cambios significativos) */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-sm">
            <div className="space-y-1">
              <Label htmlFor="user-cc" className="text-xs">Cédula / Identificación <span className="text-destructive">*</span></Label>
              <Input
                id="user-cc"
                value={form.cc}
                onChange={(e) => setForm({ ...form, cc: e.target.value })}
                placeholder="Ej. 12345678"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-email" className="text-xs">Correo electrónico <span className="text-destructive">*</span></Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ejemplo@ucp.edu.co"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-fn" className="text-xs">Primer nombre <span className="text-destructive">*</span></Label>
              <Input
                id="user-fn"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Ej. Carlos"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-sn" className="text-xs">Segundo nombre</Label>
              <Input
                id="user-sn"
                value={form.second_name}
                onChange={(e) => setForm({ ...form, second_name: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-fln" className="text-xs">Primer apellido <span className="text-destructive">*</span></Label>
              <Input
                id="user-fln"
                value={form.first_last_name}
                onChange={(e) => setForm({ ...form, first_last_name: e.target.value })}
                placeholder="Ej. Ramírez"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-sln" className="text-xs">Segundo apellido</Label>
              <Input
                id="user-sln"
                value={form.second_last_name}
                onChange={(e) => setForm({ ...form, second_last_name: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-role" className="text-xs">Rol en el sistema <span className="text-destructive">*</span></Label>
              <Select
                value={String(form.id_rol)}
                onValueChange={(v) => {
                  const r = Number(v);
                  setForm({
                    ...form,
                    id_rol: r,
                    id_faculty: [1, 2, 3].includes(r) ? form.id_faculty : null,
                    id_professional_career: [1, 2].includes(r) ? form.id_professional_career : null,
                    supervisor_id: null,
                  });
                }}
              >
                <SelectTrigger id="user-role" className="bg-background">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-state" className="text-xs">Estado del usuario <span className="text-destructive">*</span></Label>
              <Select
                value={String(form.id_state)}
                onValueChange={(v) => setForm({ ...form, id_state: Number(v) })}
              >
                <SelectTrigger id="user-state" className="bg-background">
                  <SelectValue placeholder="Selecciona un estado" />
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

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="user-pass" className="text-xs font-medium">
                Contraseña {editing ? "(Dejar en blanco si no se desea cambiar)" : <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="user-pass"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "•••••••• (Sin cambios)" : "Mínimo 6 caracteres"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Condicional: Facultad requerida para DocentePlanta(1), DirectorPrograma(2), Decano(3) */}
            {[1, 2, 3].includes(form.id_rol) && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="user-fac" className="text-xs">Facultad a la que pertenece <span className="text-destructive">*</span></Label>
                <Select
                  value={form.id_faculty ? String(form.id_faculty) : "none"}
                  onValueChange={(v) => {
                    const fac = v === "none" ? null : Number(v);
                    setForm({
                      ...form,
                      id_faculty: fac,
                      id_professional_career: null, // Reset career when faculty changes
                      supervisor_id: null,
                    });
                  }}
                >
                  <SelectTrigger id="user-fac" className="bg-background">
                    <SelectValue placeholder="Selecciona una facultad" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">-- Selecciona una facultad --</SelectItem>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Condicional: Carrera requerida para DocentePlanta(1), DirectorPrograma(2) */}
            {[1, 2].includes(form.id_rol) && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="user-car" className="text-xs">Carrera Profesional <span className="text-destructive">*</span></Label>
                <Select
                  value={form.id_professional_career ? String(form.id_professional_career) : "none"}
                  onValueChange={(v) => {
                    const car = v === "none" ? null : Number(v);
                    setForm({
                      ...form,
                      id_professional_career: car,
                      supervisor_id: null,
                    });
                  }}
                  disabled={!form.id_faculty}
                >
                  <SelectTrigger id="user-car" className="bg-background">
                    <SelectValue placeholder={form.id_faculty ? "Selecciona una carrera" : "Primero selecciona una facultad"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">-- Selecciona una carrera --</SelectItem>
                    {careersForForm.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Condicional: Selección de Supervisor para DocentePlanta(1), DirectorPrograma(2), Decano(3) */}
            {[1, 2, 3].includes(form.id_rol) && (
              <div className="space-y-1 sm:col-span-2 p-3 bg-muted/40 rounded-md border">
                <Label htmlFor="user-sup" className="text-xs font-semibold text-primary">
                  Supervisor Directo <span className="text-destructive">*</span>
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1">
                  {form.id_rol === 1 && "Docente Planta es supervisado por Director de Programa de su carrera."}
                  {form.id_rol === 2 && "Director de Programa es supervisado por Decano de su facultad."}
                  {form.id_rol === 3 && "Decano de Facultad es supervisado por Vicerrector Académico."}
                </p>
                <Select
                  value={form.supervisor_id ? String(form.supervisor_id) : "none"}
                  onValueChange={(v) => setForm({ ...form, supervisor_id: v === "none" ? null : Number(v) })}
                >
                  <SelectTrigger id="user-sup" className="bg-background font-medium">
                    <SelectValue placeholder="Selecciona un supervisor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">
                      {supervisorCandidatesForm.length === 0
                        ? "-- Guardar sin supervisor (puedes crearlo y asignarlo más tarde) --"
                        : "-- Sin supervisor seleccionado --"}
                    </SelectItem>
                    {supervisorCandidatesForm.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {fullName(s)} ({s.cc})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supervisorCandidatesForm.length === 0 && form.id_faculty && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ Aún no hay usuarios creados en el sistema con el rol requerido para ser supervisor en esta facultad/carrera. 
                    <strong> Se guardará al usuario sin supervisor</strong> para que puedas crear a su supervisor y asignárselo más adelante desde la tabla.
                  </p>
                )}
              </div>
            )}
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

      {/* Alerta de eliminación (sin cambios) */}
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