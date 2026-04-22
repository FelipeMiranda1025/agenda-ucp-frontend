import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { subfunctions } from "@/data/subfunctions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Users, Clock, CheckCircle2, TrendingUp, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(142 70% 45%)",
  "hsl(38 90% 55%)",
  "hsl(200 80% 55%)",
  "hsl(280 65% 60%)",
  "hsl(0 75% 55%)",
  "hsl(170 60% 45%)",
  "hsl(50 85% 55%)",
  "hsl(220 70% 60%)",
  "hsl(330 70% 60%)",
  "hsl(15 80% 55%)",
];

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboardData();

  const [docenteCc, setDocenteCc] = useState<string>("all");
  const [docenteOpen, setDocenteOpen] = useState(false);
  const [facultyId, setFacultyId] = useState<string>("all");
  const [careerId, setCareerId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user && user.rolId !== 4) {
      navigate("/");
    }
  }, [user, navigate]);

  const subfMap = useMemo(() => {
    const m: Record<string, { id: string; short: string }> = {};
    subfunctions.forEach((s) => (m[s.id] = { id: s.id, short: s.shortTitle }));
    return m;
  }, []);

  const filtered = useMemo(() => {
    if (!data) {
      return {
        agendas: [] as NonNullable<typeof data>["agendas"],
        views: [] as NonNullable<typeof data>["views"],
        users: [] as NonNullable<typeof data>["users"],
        faculties: [] as NonNullable<typeof data>["faculties"],
        careers: [] as NonNullable<typeof data>["careers"],
        userByCc: new Map<string, NonNullable<typeof data>["users"][number]>(),
        allowedCcs: new Set<string>(),
        latestViewByCc: new Map<string, NonNullable<typeof data>["views"][number]>(),
      };
    }
    const { agendas, views, users, faculties, careers } = data;

    const userByCc = new Map(users.map((u) => [u.cc, u]));
    let allowedCcs = new Set(users.map((u) => u.cc));

    if (facultyId !== "all") {
      const fid = Number(facultyId);
      allowedCcs = new Set(users.filter((u) => u.id_faculty === fid).map((u) => u.cc));
    }
    if (careerId !== "all") {
      const cid = Number(careerId);
      allowedCcs = new Set(
        users
          .filter((u) => u.id_professional_career === cid && allowedCcs.has(u.cc))
          .map((u) => u.cc)
      );
    }
    if (docenteCc !== "all") {
      allowedCcs = allowedCcs.has(docenteCc) ? new Set([docenteCc]) : new Set();
    }

    const latestViewByCc = new Map<string, typeof views[number]>();
    views.forEach((v) => {
      const prev = latestViewByCc.get(v.user_cc);
      if (!prev || new Date(v.created_at) > new Date(prev.created_at)) {
        latestViewByCc.set(v.user_cc, v);
      }
    });

    if (statusFilter !== "all") {
      allowedCcs = new Set(
        Array.from(allowedCcs).filter((cc) => latestViewByCc.get(cc)?.status === statusFilter)
      );
    }

    const filteredAgendas = agendas.filter((a) => allowedCcs.has(a.docente_cc));
    const filteredViews = views.filter((v) => allowedCcs.has(v.user_cc));

    return { agendas: filteredAgendas, views: filteredViews, users, faculties, careers, userByCc, allowedCcs, latestViewByCc };
  }, [data, docenteCc, facultyId, careerId, statusFilter]);

  const kpis = useMemo(() => {
    if (!filtered) return { docentesConAgenda: 0, totalHoras: 0, pctAprobadas: 0, promedio: 0 };
    const { agendas, latestViewByCc, allowedCcs } = filtered;
    const docentesConAgenda = new Set(agendas.map((a) => a.docente_cc)).size;
    const totalHoras = agendas.reduce((sum, a) => sum + (a.total_horas || 0), 0);
    const aprobadas = Array.from(allowedCcs).filter((cc) => latestViewByCc.get(cc)?.status === "approved").length;
    const totalConVista = Array.from(allowedCcs).filter((cc) => latestViewByCc.has(cc)).length;
    const pctAprobadas = totalConVista ? Math.round((aprobadas / totalConVista) * 100) : 0;
    const promedio = docentesConAgenda ? Math.round(totalHoras / docentesConAgenda) : 0;
    return { docentesConAgenda, totalHoras, pctAprobadas, promedio };
  }, [filtered]);

  const horasPorSubfuncion = useMemo(() => {
    if (!filtered) return [];
    const totals: Record<string, number> = {};
    filtered.agendas.forEach((a) => {
      totals[a.subfunction_id] = (totals[a.subfunction_id] ?? 0) + (a.total_horas || 0);
    });
    return Object.entries(totals)
      .map(([id, horas]) => ({ name: subfMap[id]?.short ?? id, horas }))
      .sort((a, b) => b.horas - a.horas);
  }, [filtered, subfMap]);

  const estadosAgenda = useMemo(() => {
    if (!filtered) return [];
    const counts: Record<string, number> = { approved: 0, pending: 0, returned: 0 };
    filtered.allowedCcs.forEach((cc) => {
      const v = filtered.latestViewByCc.get(cc);
      if (v) counts[v.status] = (counts[v.status] ?? 0) + 1;
    });
    return [
      { name: t("dashboard.status.approved"), value: counts.approved, color: PALETTE[1] },
      { name: t("dashboard.status.pending"), value: counts.pending, color: PALETTE[2] },
      { name: t("dashboard.status.returned"), value: counts.returned, color: PALETTE[5] },
    ].filter((d) => d.value > 0);
  }, [filtered, t]);

  const cumplimiento16h = useMemo(() => {
    if (!filtered) return [];
    const horasPorDocente: Record<string, number> = {};
    filtered.agendas
      .filter((a) => a.subfunction_id === "docencia-directa")
      .forEach((a) => {
        const hs = Number((a.data as any)?.horasSemana) || 0;
        horasPorDocente[a.docente_cc] = (horasPorDocente[a.docente_cc] ?? 0) + hs;
      });
    let cumple = 0;
    let menos = 0;
    let mas = 0;
    Object.values(horasPorDocente).forEach((h) => {
      if (h === 16) cumple++;
      else if (h < 16) menos++;
      else mas++;
    });
    return [
      { name: t("dashboard.compliance.exact"), value: cumple, color: PALETTE[1] },
      { name: t("dashboard.compliance.under"), value: menos, color: PALETTE[2] },
      { name: t("dashboard.compliance.over"), value: mas, color: PALETTE[5] },
    ];
  }, [filtered, t]);

  const topDocentes = useMemo(() => {
    if (!filtered) return { rows: [], keys: [] as string[] };
    const byDoc: Record<string, Record<string, number>> = {};
    filtered.agendas.forEach((a) => {
      const u = filtered.userByCc.get(a.docente_cc);
      const label = u ? `${u.first_name} ${u.first_last_name}` : a.docente_cc;
      const key = subfMap[a.subfunction_id]?.short ?? a.subfunction_id;
      if (!byDoc[label]) byDoc[label] = {};
      byDoc[label][key] = (byDoc[label][key] ?? 0) + (a.total_horas || 0);
    });
    const rows = Object.entries(byDoc)
      .map(([name, vals]) => ({ name, ...vals, _total: Object.values(vals).reduce((s, v) => s + v, 0) }))
      .sort((a: any, b: any) => b._total - a._total)
      .slice(0, 10);
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r).filter((k) => k !== "name" && k !== "_total"))));
    return { rows, keys };
  }, [filtered, subfMap]);

  const horasPorFacultad = useMemo(() => {
    if (!filtered) return [];
    const totals: Record<string, number> = {};
    filtered.agendas.forEach((a) => {
      const u = filtered.userByCc.get(a.docente_cc);
      const fac = filtered.faculties.find((f) => f.id === u?.id_faculty);
      const name = fac?.name ?? "—";
      totals[name] = (totals[name] ?? 0) + (a.total_horas || 0);
    });
    return Object.entries(totals).map(([name, horas]) => ({ name, horas })).sort((a, b) => b.horas - a.horas);
  }, [filtered]);

  const horasPorPrograma = useMemo(() => {
    if (!filtered) return [];
    const totals: Record<string, number> = {};
    filtered.agendas.forEach((a) => {
      const u = filtered.userByCc.get(a.docente_cc);
      const car = filtered.careers.find((c) => c.id === u?.id_professional_career);
      const name = car?.name ?? "—";
      totals[name] = (totals[name] ?? 0) + (a.total_horas || 0);
    });
    return Object.entries(totals)
      .map(([name, horas]) => ({ name, horas }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 10);
  }, [filtered]);

  const adminAprobadas = useMemo(() => {
    if (!filtered) return [];
    const ccsConAdmin = new Set(filtered.agendas.filter((a) => a.subfunction_id === "administrativas").map((a) => a.docente_cc));
    let aprobadas = 0;
    let noAprobadas = 0;
    ccsConAdmin.forEach((cc) => {
      const v = filtered.latestViewByCc.get(cc);
      if (v?.status === "approved") aprobadas++;
      else noAprobadas++;
    });
    return [
      { name: t("dashboard.status.approved"), value: aprobadas, color: PALETTE[1] },
      { name: t("dashboard.adminPending"), value: noAprobadas, color: PALETTE[2] },
    ].filter((d) => d.value > 0);
  }, [filtered, t]);

  const aprobacionesPorMes = useMemo(() => {
    if (!filtered) return [];
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = 0;
    }
    filtered.views.forEach((v) => {
      if (v.status !== "approved" || !v.reviewed_at) return;
      const d = new Date(v.reviewed_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([mes, total]) => ({ mes, total }));
  }, [filtered]);

  const proyectosTrabajos = useMemo(() => {
    if (!filtered) return [];
    const totals: Record<string, number> = {};
    filtered.agendas
      .filter((a) => a.subfunction_id === "trabajos-grado")
      .forEach((a) => {
        const tipo = String((a.data as any)?.tipoTrabajo ?? "—");
        const cant = Number((a.data as any)?.cantidadProyectos) || 0;
        totals[tipo] = (totals[tipo] ?? 0) + cant;
      });
    return Object.entries(totals).map(([name, proyectos]) => ({ name, proyectos }));
  }, [filtered]);

  const estudiantesPracticas = useMemo(() => {
    if (!filtered) return [];
    const totals: Record<string, number> = {};
    filtered.agendas
      .filter((a) => a.subfunction_id === "practicas-academicas")
      .forEach((a) => {
        const act = String((a.data as any)?.actividad ?? "—");
        const cant = Number((a.data as any)?.cantidadEstudiantes) || 0;
        totals[act] = (totals[act] ?? 0) + cant;
      });
    return Object.entries(totals).map(([name, estudiantes]) => ({ name, estudiantes }));
  }, [filtered]);

  const filteredCareers = useMemo(() => {
    if (!data) return [];
    if (facultyId === "all") return data.careers;
    return data.careers.filter((c) => c.id_faculty === Number(facultyId));
  }, [data, facultyId]);

  const docenteOptions = useMemo(() => {
    if (!data) return [];
    return data.users
      .map((u) => ({
        cc: u.cc,
        label: `${u.first_name} ${u.first_last_name} (${u.cc})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const selectedDocenteLabel =
    docenteCc === "all" ? t("dashboard.allDocentes") : docenteOptions.find((d) => d.cc === docenteCc)?.label ?? docenteCc;

  const clearFilters = () => {
    setDocenteCc("all");
    setFacultyId("all");
    setCareerId("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">{t("dashboard.loading")}</div>
      </div>
    );
  }

  const faculties = data?.faculties ?? [];
  const hasAgendas = (data?.agendas?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{t("dashboard.title")}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <Popover open={docenteOpen} onOpenChange={setDocenteOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="justify-between w-full font-normal">
                <span className="truncate">{selectedDocenteLabel}</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t("dashboard.searchDocente")} />
                <CommandList>
                  <CommandEmpty>{t("dashboard.noResults")}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setDocenteCc("all");
                        setDocenteOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", docenteCc === "all" ? "opacity-100" : "opacity-0")} />
                      {t("dashboard.allDocentes")}
                    </CommandItem>
                    {docenteOptions.map((d) => (
                      <CommandItem
                        key={d.cc}
                        value={d.label}
                        onSelect={() => {
                          setDocenteCc(d.cc);
                          setDocenteOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", docenteCc === d.cc ? "opacity-100" : "opacity-0")} />
                        {d.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={facultyId} onValueChange={(v) => { setFacultyId(v); setCareerId("all"); }}>
            <SelectTrigger><SelectValue placeholder={t("dashboard.faculty")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allFaculties")}</SelectItem>
              {faculties.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={careerId} onValueChange={setCareerId}>
            <SelectTrigger><SelectValue placeholder={t("dashboard.career")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allCareers")}</SelectItem>
              {filteredCareers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder={t("dashboard.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allStatus")}</SelectItem>
              <SelectItem value="approved">{t("dashboard.status.approved")}</SelectItem>
              <SelectItem value="pending">{t("dashboard.status.pending")}</SelectItem>
              <SelectItem value="returned">{t("dashboard.status.returned")}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>{t("dashboard.clearFilters")}</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {isError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {t("dashboard.error")}
          </div>
        )}
        {!isError && !hasAgendas && (
          <div className="rounded-md border border-border bg-muted/40 text-muted-foreground px-4 py-3 text-sm">
            {t("dashboard.noData")}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Users className="h-5 w-5" />} title={t("dashboard.kpi.docentes")} value={kpis.docentesConAgenda} />
          <KpiCard icon={<Clock className="h-5 w-5" />} title={t("dashboard.kpi.totalHoras")} value={kpis.totalHoras} />
          <KpiCard icon={<CheckCircle2 className="h-5 w-5" />} title={t("dashboard.kpi.pctAprobadas")} value={`${kpis.pctAprobadas}%`} />
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} title={t("dashboard.kpi.promedio")} value={kpis.promedio} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t("dashboard.chart.subfuncion")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={horasPorSubfuncion} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="horas" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.estados")}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={estadosAgenda} dataKey="value" nameKey="name" outerRadius={110} label>
                  {estadosAgenda.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.cumplimiento")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={cumplimiento16h}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {cumplimiento16h.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.topDocentes")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topDocentes.rows} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {topDocentes.keys.map((k, i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={PALETTE[i % PALETTE.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.facultad")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={horasPorFacultad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="horas" fill={PALETTE[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.programa")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={horasPorPrograma} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="horas" fill={PALETTE[4]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.adminAprobadas")}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={adminAprobadas} dataKey="value" nameKey="name" outerRadius={110} label>
                  {adminAprobadas.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.aprobacionesMes")}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={aprobacionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke={PALETTE[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.proyectos")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={proyectosTrabajos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="proyectos" fill={PALETTE[6]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("dashboard.chart.estudiantes")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={estudiantesPracticas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="estudiantes" fill={PALETTE[7]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: number | string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default Dashboard;
