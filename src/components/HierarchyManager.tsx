import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    useInsertUserHierarchy,
    useUserHierarchy,
    useFaculties,
    useProfessionalCareers,
} from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, Save, Search } from "lucide-react";

// ============================================
// 1. TIPADO FUERTE
// ============================================
interface User {
    id: number;
    cc: string;
    first_name: string;
    second_name: string;
    first_last_name: string;
    second_last_name: string;
    email: string;
    id_rol: number;
    id_state: number;
    id_faculty: number | null;
    id_professional_career: number | null;
}

// ============================================
// 2. HOOK SEGURO PARA OBTENER USUARIOS
// ============================================
const useAllUsers = () => {
    return useQuery<User[]>({
        queryKey: ["all_users_with_details"],
        queryFn: async () => {
            try {
                // Se fuerza a obtener solo usuarios activos y se espera que el backend valide el token
                const users = await api.get<User[]>("/users?all=true&id_state=1");
                // Sanitización básica: asegurar que los campos opcionales no sean null/undefined peligrosos
                return users.map(u => ({
                    ...u,
                    first_name: u.first_name ?? "",
                    second_name: u.second_name ?? "",
                    first_last_name: u.first_last_name ?? "",
                    second_last_name: u.second_last_name ?? "",
                }));
            } catch (error) {
                console.error("Error al cargar usuarios:", error);
                throw new Error("No se pudieron cargar los usuarios. Intente más tarde.");
            }
        },
        staleTime: 1000 * 60 * 5,
        retry: 2,
    });
};

// ============================================
// 3. COMPONENTE PRINCIPAL
// ============================================
export function HierarchyManager() {
    const queryClient = useQueryClient();

    // Consultas con manejo de errores integrado
    const { data: hierarchy, isLoading: hierarchyLoading, error: hierarchyError } = useUserHierarchy();
    const { data: users, isLoading: usersLoading, error: usersError } = useAllUsers();
    const { data: faculties, error: facultiesError } = useFaculties();
    const { data: allCareers, error: careersError } = useProfessionalCareers();
    const { mutate: insertHierarchy, isPending, error: mutationError } = useInsertUserHierarchy();

    // Estados de filtros
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
    const [selectedCareerId, setSelectedCareerId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedSupervisors, setSelectedSupervisors] = useState<Record<number, number>>({});

    // ============================================
    // 4. VALIDACIONES Y MANEJO DE ERRORES
    // ============================================
    // Mostrar errores globales si alguna consulta falla
    const hasError = hierarchyError || usersError || facultiesError || careersError;
    if (hasError) {
        return (
            <div className="p-4 text-destructive">
                <p>❌ Error al cargar datos necesarios. Por favor, recargue la página.</p>
                <p className="text-xs text-muted-foreground">
                    {hierarchyError?.message || usersError?.message || facultiesError?.message || careersError?.message}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
                    Reintentar
                </Button>
            </div>
        );
    }

    if (usersLoading || hierarchyLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!users || !faculties || !allCareers) {
        return <p>No hay datos disponibles. Verifique la conexión con el servidor.</p>;
    }

    // ============================================
    // 5. FUNCIONES AUXILIARES SEGURAS
    // ============================================
    const getFullName = useCallback((user: User): string => {
        return [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
    }, []);

    const getFacultyName = useCallback((facultyId: number | null): string => {
        if (facultyId == null) return "Sin facultad";
        const faculty = faculties.find(f => f.id === facultyId);
        return faculty?.name ?? "Desconocida";
    }, [faculties]);

    const getCareerName = useCallback((careerId: number | null): string => {
        if (careerId == null) return "Sin carrera";
        const career = allCareers.find(c => c.id === careerId);
        return career?.name ?? "Desconocida";
    }, [allCareers]);

    // ============================================
    // 6. FILTROS
    // ============================================
    // Roles que pueden ser supervisores (según base de datos)
    // Ajusta estos números según tus roles reales
    const SUPERVISOR_ROLES = useMemo(() => [2, 3, 4], []); // 2:Decano, 3:Director, 4:Vicerrector

    // Subordinados: docentes (rol 1) y coordinadores (rol 2)
    let subordinates = users.filter(u => u.id_rol === 1 || u.id_rol === 2);

    // Filtro por facultad
    if (selectedFacultyId && selectedFacultyId !== "all") {
        const facultyIdNum = parseInt(selectedFacultyId, 10);
        if (!isNaN(facultyIdNum)) {
            subordinates = subordinates.filter(sub => sub.id_faculty === facultyIdNum);
        }
    }

    // Filtro por carrera (solo si hay facultad seleccionada y carrera válida)
    if (selectedCareerId && selectedCareerId !== "all") {
        const careerIdNum = parseInt(selectedCareerId, 10);
        if (!isNaN(careerIdNum)) {
            subordinates = subordinates.filter(sub => sub.id_professional_career === careerIdNum);
        }
    }

    // Filtro por término de búsqueda (escape de posibles inyecciones – React ya escapa)
    const filteredSubordinates = subordinates.filter(sub =>
        getFullName(sub).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ============================================
    // 7. SUPERVISORES ELEGIBLES CON VALIDACIÓN
    // ============================================
    const getEligibleSupervisors = useCallback((subordinate: User): User[] => {
        return users.filter(supervisor => {
            // Solo roles superiores
            if (!SUPERVISOR_ROLES.includes(supervisor.id_rol)) return false;
            // No auto-supervisión
            if (supervisor.id === subordinate.id) return false;

            // Validar datos del subordinado antes de comparar
            if (supervisor.id_rol === 4) {
                // Vicerrector: siempre elegible
                return true;
            } else if (supervisor.id_rol === 2) {
                // Decano: necesita facultad definida y coincidente
                return subordinate.id_faculty != null && supervisor.id_faculty === subordinate.id_faculty;
            } else if (supervisor.id_rol === 3) {
                // Director: necesita carrera definida y coincidente
                return subordinate.id_professional_career != null &&
                    supervisor.id_professional_career === subordinate.id_professional_career;
            }
            return false;
        });
    }, [users, SUPERVISOR_ROLES]);

    // ============================================
    // 8. MANEJO DE GUARDADO (CON TRY/CATCH)
    // ============================================
    const handleSave = useCallback(async (userId: number, supervisorId: number) => {
        // Validaciones de entrada
        if (!userId || !supervisorId) {
            toast.error("Debe seleccionar un usuario y un supervisor válidos");
            return;
        }
        if (typeof userId !== 'number' || typeof supervisorId !== 'number' || isNaN(userId) || isNaN(supervisorId)) {
            toast.error("IDs inválidos");
            return;
        }
        if (userId === supervisorId) {
            toast.error("Un usuario no puede ser su propio supervisor");
            return;
        }

        // Usar la mutación de React Query que ya maneja errores internamente
        insertHierarchy(
            { user_id: userId, supervisor_id: supervisorId },
            {
                onSuccess: () => {
                    toast.success("Jerarquía guardada correctamente");
                    queryClient.invalidateQueries({ queryKey: ["user_hierarchy"] });
                },
                onError: (err: any) => {
                    console.error("Error en mutación:", err);
                    const message = err?.response?.data?.message || "Error al guardar la jerarquía";
                    toast.error(message);
                },
            }
        );
    }, [insertHierarchy, queryClient]);

    // ============================================
    // 9. Sincronizar jerarquías existentes
    // ============================================
    useEffect(() => {
        if (hierarchy && hierarchy.length > 0) {
            const initial: Record<number, number> = {};
            hierarchy.forEach(h => {
                if (h.user_id && h.supervisor_id) {
                    initial[h.user_id] = h.supervisor_id;
                }
            });
            setSelectedSupervisors(initial);
        }
    }, [hierarchy]);

    // ============================================
    // 10. MANEJO DE FILTROS ENCADENADOS
    // ============================================
    const handleFacultyChange = useCallback((value: string) => {
        setSelectedFacultyId(value);
        setSelectedCareerId(""); // resetear carrera al cambiar facultad
    }, []);

    // Carreras filtradas por facultad seleccionada
    const filteredCareers = useMemo(() => {
        if (selectedFacultyId && selectedFacultyId !== "all") {
            const facultyIdNum = parseInt(selectedFacultyId, 10);
            if (!isNaN(facultyIdNum)) {
                return allCareers.filter(c => c.id_faculty === facultyIdNum);
            }
        }
        return [];
    }, [selectedFacultyId, allCareers]);

    // ============================================
    // 11. RENDERIZADO (UI)
    // ============================================
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Asignación de jerarquías (supervisores)</h2>
            </div>

            {/* Panel de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-md bg-muted/20">
                {/* Facultad */}
                <div>
                    <label className="text-xs font-medium">Filtrar por facultad</label>
                    <Select value={selectedFacultyId} onValueChange={handleFacultyChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todas las facultades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las facultades</SelectItem>
                            {faculties.map(fac => (
                                <SelectItem key={fac.id} value={fac.id.toString()}>
                                    {fac.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Carrera (dependiente) */}
                <div>
                    <label className="text-xs font-medium">Filtrar por carrera</label>
                    <Select
                        value={selectedCareerId}
                        onValueChange={setSelectedCareerId}
                        disabled={!selectedFacultyId || selectedFacultyId === "all"}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todas las carreras" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las carreras</SelectItem>
                            {filteredCareers.map(career => (
                                <SelectItem key={career.id} value={career.id.toString()}>
                                    {career.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Búsqueda por nombre */}
                <div>
                    <label className="text-xs font-medium">Buscar docente</label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                            maxLength={100}
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de docentes */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Docente / Coordinador</TableHead>
                            <TableHead>Facultad</TableHead>
                            <TableHead>Carrera</TableHead>
                            <TableHead>Supervisor actual</TableHead>
                            <TableHead>Asignar nuevo supervisor</TableHead>
                            <TableHead className="w-24">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSubordinates.map(sub => {
                            const eligibleSupervisors = getEligibleSupervisors(sub);
                            const currentSupervisorId = hierarchy?.find(h => h.user_id === sub.id)?.supervisor_id;
                            const currentSupervisor = users.find(u => u.id === currentSupervisorId);
                            const currentSupervisorName = currentSupervisor ? getFullName(currentSupervisor) : "Sin asignar";

                            return (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{getFullName(sub)}</TableCell>
                                    <TableCell>{getFacultyName(sub.id_faculty)}</TableCell>
                                    <TableCell>{getCareerName(sub.id_professional_career)}</TableCell>
                                    <TableCell>{currentSupervisorName}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={selectedSupervisors[sub.id]?.toString() || ""}
                                            onValueChange={(val) => {
                                                setSelectedSupervisors(prev => ({ ...prev, [sub.id]: parseInt(val, 10) }));
                                            }}
                                        >
                                            <SelectTrigger className="w-[260px]">
                                                <SelectValue placeholder="Seleccionar supervisor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eligibleSupervisors.map(sup => (
                                                    <SelectItem key={sup.id} value={sup.id.toString()}>
                                                        {getFullName(sup)}
                                                        {sup.id_rol === 2 && ` (Decano - ${getFacultyName(sup.id_faculty)})`}
                                                        {sup.id_rol === 3 && ` (Director - ${getCareerName(sup.id_professional_career)})`}
                                                        {sup.id_rol === 4 && ` (Vicerrector)`}
                                                    </SelectItem>
                                                ))}
                                                {eligibleSupervisors.length === 0 && (
                                                    <div className="px-2 py-1 text-sm text-muted-foreground">
                                                        No hay supervisores elegibles para este docente
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(sub.id, selectedSupervisors[sub.id])}
                                            disabled={isPending || !selectedSupervisors[sub.id]}
                                            className="gap-1"
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            Guardar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredSubordinates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No hay docentes o coordinadores con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mostrar error de mutación si ocurre */}
            {mutationError && (
                <div className="text-destructive text-sm text-center">
                    Error al guardar: {(mutationError as any)?.message || "Intente de nuevo"}
                </div>
            )}
        </div>
    );
}