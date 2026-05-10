import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SubfunctionForm } from "@/components/SubfunctionForm";
import { SummaryPanel } from "@/components/SummaryPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { subfunctions } from "@/data/subfunctions";
import { useAgenda } from "@/context/AgendaContext";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAllAgendaComments, useMarkCommentsRead, useAgendaView, usePendingAgendaViewsForSupervisor, useUserNameByCc, useFullyApprovedCareers } from "@/hooks/useDatabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, ChevronDown, User, LogOut, Menu, X, Bell, MessageSquare, ClipboardList, History, Settings, Power, BarChart3, Download } from "lucide-react";
import { exportAgendaToExcel } from "@/lib/exportAgenda";
import { SettingsDialog } from "@/components/SettingsDialog";
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
import { useSystemEnabled, useToggleSystemEnabled } from "@/hooks/useSystemEnabled";
import { useArchiveAndResetSemester } from "@/hooks/useSemesterArchive";
import { toast } from "sonner";
import { prefetchRoute, warmupCommonRoutes } from "@/lib/routePrefetch";

// Roles that can see the audit log — currently all roles; restrict later as needed
const AUDIT_VISIBLE_ROLES = [1, 2, 3, 4];
import ucpLogo from "@/assets/ucp-logo.png";
import flagCol from "@/assets/flag-col.png";
import flagUsa from "@/assets/flag-usa.png";

const Index = () => {
  const { user, logout, roleName } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifHistory, setShowNotifHistory] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readTick, setReadTick] = useState(0);
  const [visibleSection, setVisibleSection] = useState<string>("header.production");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemSwitchOpen, setSystemSwitchOpen] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);
  const { enabled: systemEnabled } = useSystemEnabled();
  const toggleSystem = useToggleSystemEnabled();
  const archiveAndReset = useArchiveAndResetSemester();

  const isVicerrector = roleName === "VicerrectorAcadémico";
  const isDecano = roleName === "DecanoFacultad";
  const isPendingRead = (id: string) =>
    typeof window !== "undefined" && localStorage.getItem(`read_pending_${id}`) === "1";
  const isCareerRead = (careerId: number) =>
    typeof window !== "undefined" && localStorage.getItem(`read_career_${careerId}`) === "1";
  const mainRef = useRef<HTMLDivElement>(null);

  // Global comments & notifications
  const { setSelectedDocente, docentesList, loadFromAgendaView, hasSchedule, records, getSchedule, selectedDocente, activeSubfunction, setActiveSubfunction } = useAgenda();
  const { data: allComments = [] } = useAllAgendaComments();
  const markRead = useMarkCommentsRead();
  const { data: agendaView } = useAgendaView(user?.id);
  const { data: pendingSubordinateAgendas = [] } = usePendingAgendaViewsForSupervisor(user?.id);
  const { data: fullyApprovedCareers = [] } = useFullyApprovedCareers(
    isVicerrector ? "vicerrector" : "decano",
    isDecano ? user?.id : undefined,
    isVicerrector || isDecano
  );

  // Resolve reviewer name when agenda is returned
  const reviewerCc = agendaView?.status === "returned" ? agendaView.reviewer_cc : null;
  const { data: reviewerName } = useUserNameByCc(reviewerCc);

  const isReturnedAgenda = agendaView?.status === "returned";

  // Dismissed returned notifications tracked in localStorage
  const isDismissedReturn = useMemo(() => {
    if (!agendaView?.id) return false;
    return localStorage.getItem(`dismissed_return_${agendaView.id}`) === "1";
  }, [agendaView?.id]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    let count = allComments.filter(
      (c) => c.reviewer_cc !== user.id && !(c.read_by || []).includes(user.id)
    ).length;
    if (isReturnedAgenda && !isDismissedReturn) {
      count += 1;
    }
    count += pendingSubordinateAgendas.filter((pa) => !isPendingRead(pa.agendaView.id)).length;
    if (isVicerrector || isDecano) {
      count += fullyApprovedCareers.filter((c) => !isCareerRead(c.careerId)).length;
    }
    return count;
  }, [allComments, user, isReturnedAgenda, isDismissedReturn, pendingSubordinateAgendas, readTick, isVicerrector, isDecano, fullyApprovedCareers]);

  const handleOpenNotifications = () => {
    if (!user) return;
    const unreadIds = allComments
      .filter((c) => c.reviewer_cc !== user.id && !(c.read_by || []).includes(user.id))
      .map((c) => c.id);
    if (unreadIds.length > 0) {
      markRead.mutate({ commentIds: unreadIds, userCc: user.id });
    }
    // Dismiss returned notification
    if (isReturnedAgenda && agendaView?.id) {
      localStorage.setItem(`dismissed_return_${agendaView.id}`, "1");
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase()
    : "U";

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sections = main.querySelectorAll("[data-section-id]");
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section-id");
            if (sectionId) {
              const sf = subfunctions.find((s) => s.id === sectionId);
              if (sf) {
                if (sf.sectionId === "produccion") setVisibleSection("header.production");
                else if (sf.sectionId === "actividades") setVisibleSection("header.activities");
                else if (sf.sectionId === "horario") setVisibleSection("header.schedule");
              }
            }
          }
        }
      },
      { root: main, threshold: 0.3 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleMenuClose = useCallback(() => setMenuOpen(false), []);

  // Prefetch common routes in idle time so navigation feels instant.
  useEffect(() => { warmupCommonRoutes(); }, []);

  // Auto-redirect to /schedule when the owner's agenda has been approved by the Decano.
  // Supervisors (Decano, Vicerrector) are excluded so their review flow stays intact.
  // Escape hatch: visit "/?view=agenda" to bypass the redirect and inspect the agenda form.
  const isOwnerRole = roleName === "DocentePlanta" || roleName === "DirectorPrograma";
  // Redirigir Admin (rolId === 1) al panel de soporte
  const isAdmin = user?.rolId === 1;
  useEffect(() => {
    if (isAdmin) {
      navigate("/support", { replace: true });
    }
  }, [isAdmin, navigate]);
  useEffect(() => {
    if (!isOwnerRole) return;
    if (agendaView?.status !== "approved") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "agenda") return;
    navigate("/schedule", { replace: true });
  }, [isOwnerRole, agendaView?.status, navigate]);

  const currentFlag = language === "es" ? flagCol : flagUsa;

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky header - white */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 py-1.5">
          <img src={ucpLogo} alt="UCP" className="h-8 md:h-10 w-auto shrink-0" />
          <div className="flex-1 min-w-0 hidden md:block">
            <h1 className="text-gray-800 dark:text-gray-100 font-semibold text-sm md:text-lg leading-tight truncate">
              {t("header.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-tight">{t(visibleSection)}</p>
          </div>
          {/* Right-side toolbar */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
            {/* Notifications */}
            <DropdownMenu open={notifOpen} onOpenChange={(open) => { setNotifOpen(open); if (open) handleOpenNotifications(); }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-auto">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t("notifications.title")}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground"
                    onClick={(e) => { e.preventDefault(); setShowNotifHistory(!showNotifHistory); }}
                  >
                    <History className="h-3.5 w-3.5" />
                    {showNotifHistory ? t("notifications.viewNew") : t("notifications.viewHistory")}
                  </Button>
                </div>
                <DropdownMenuSeparator />

                {/* Returned agenda notification */}
                {isReturnedAgenda && (showNotifHistory || !isDismissedReturn) && (
                  <div className={`px-3 py-2 text-xs border-b bg-destructive/10 ${isDismissedReturn ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-medium">{reviewerName || agendaView?.reviewer_cc}</p>
                      {isDismissedReturn && <span className="text-[10px] text-muted-foreground italic">{t("notifications.read")}</span>}
                    </div>
                    <p className="text-muted-foreground">{t("notifications.returned")}</p>
                    {agendaView?.reviewed_at && (
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(agendaView.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Pending subordinate agendas */}
                {(showNotifHistory
                  ? pendingSubordinateAgendas
                  : pendingSubordinateAgendas.filter((pa) => !isPendingRead(pa.agendaView.id))
                ).map((pa) => {
                  const read = isPendingRead(pa.agendaView.id);
                  return (
                    <button
                      key={pa.agendaView.id}
                      className={`w-full text-left px-3 py-2 text-xs border-b last:border-0 bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors ${read ? "opacity-60" : ""}`}
                      onClick={async () => {
                        const docente = docentesList.find((d) => d.id === pa.docenteCc);
                        if (docente) {
                          setSelectedDocente(docente);
                        } else {
                          setSelectedDocente({
                            id: pa.docenteCc,
                            firstName: pa.docenteName.split(" ")[0] || "",
                            secondName: pa.docenteName.split(" ").length > 2 ? pa.docenteName.split(" ")[1] : "",
                            firstLastName: pa.docenteName.split(" ").slice(-1)[0] || "",
                            secondLastName: "",
                          });
                        }
                        try {
                          await loadFromAgendaView();
                        } catch {
                          // noop
                        }
                        localStorage.setItem(`read_pending_${pa.agendaView.id}`, "1");
                        setReadTick((n) => n + 1);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-foreground font-medium">{pa.docenteName}</p>
                        {read && <span className="text-[10px] text-muted-foreground italic ml-2 shrink-0">{t("notifications.read")}</span>}
                      </div>
                      <p className="text-muted-foreground">{t("notifications.pendingReview")}</p>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(pa.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  );
                })}

                {/* Vicerrector / Decano: fully approved careers (program ready to review) */}
                {(isVicerrector || isDecano) && (showNotifHistory
                  ? fullyApprovedCareers
                  : fullyApprovedCareers.filter((c) => !isCareerRead(c.careerId))
                ).map((c) => {
                  const read = isCareerRead(c.careerId);
                  const description = isVicerrector
                    ? t("notifications.programReadyWithCareerAndFaculty", {
                      career: c.careerName,
                      faculty: c.facultyName ?? "—",
                    })
                    : t("notifications.programReadyWithCareer", { career: c.careerName });
                  return (
                    <button
                      key={`career-${c.careerId}`}
                      className={`w-full text-left px-3 py-2 text-xs border-b last:border-0 bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors ${read ? "opacity-60" : ""}`}
                      onClick={() => {
                        localStorage.setItem(`read_career_${c.careerId}`, "1");
                        setReadTick((n) => n + 1);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-foreground font-medium">{c.careerName}</p>
                        {read && <span className="text-[10px] text-muted-foreground italic ml-2 shrink-0">{t("notifications.read")}</span>}
                      </div>
                      <p className="text-muted-foreground">{description}</p>
                      <span className="text-muted-foreground text-[10px]">
                        {c.totalDocentes} {c.totalDocentes === 1 ? "docente" : "docentes"}
                      </span>
                    </button>
                  );
                })}

                {/* Comment notifications — filtered by read status */}
                {(() => {
                  const userComments = allComments.filter((c) => c.reviewer_cc !== user?.id);
                  const visibleComments = showNotifHistory
                    ? userComments
                    : userComments.filter((c) => !(c.read_by || []).includes(user?.id || ""));

                  const visiblePendingCount = (showNotifHistory
                    ? pendingSubordinateAgendas
                    : pendingSubordinateAgendas.filter((pa) => !isPendingRead(pa.agendaView.id))
                  ).length;
                  const visibleCareerCount = (isVicerrector || isDecano)
                    ? (showNotifHistory ? fullyApprovedCareers : fullyApprovedCareers.filter((c) => !isCareerRead(c.careerId))).length
                    : 0;
                  if (visibleComments.length === 0 && visiblePendingCount === 0 && visibleCareerCount === 0 && !(isReturnedAgenda && (showNotifHistory || !isDismissedReturn))) {
                    return (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                        {t("notifications.empty")}
                      </div>
                    );
                  }
                  return visibleComments.slice(0, 10).map((c) => {
                    const isRead = (c.read_by || []).includes(user?.id || "");
                    return (
                      <div key={c.id} className={`px-3 py-2 text-xs border-b last:border-0 ${isRead ? "opacity-60" : ""}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-foreground line-clamp-2 flex-1">{c.comment}</p>
                          {isRead && <span className="text-[10px] text-muted-foreground italic ml-2 shrink-0">{t("notifications.read")}</span>}
                        </div>
                        <span className="text-muted-foreground">
                          {c.reviewer_cc} · {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  });
                })()}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messaging */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                >
                  <MessageSquare className="h-5 w-5" />
                  {isReturnedAgenda && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      1
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 text-sm font-semibold">{t("messages.title")}</div>
                <DropdownMenuSeparator />
                {isReturnedAgenda ? (
                  <div className="px-3 py-2 text-xs border-b bg-destructive/10">
                    <p className="text-foreground font-medium">
                      {t("messages.returned")} — {reviewerName || agendaView?.reviewer_cc}
                    </p>
                    {agendaView?.reviewer_comment && (
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                        {agendaView.reviewer_comment}
                      </p>
                    )}
                    {agendaView?.reviewed_at && (
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(agendaView.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    {t("messages.empty")}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onMouseEnter={() => prefetchRoute("profile")} onFocus={() => prefetchRoute("profile")} onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> {t("profile.view")}
                </DropdownMenuItem>
                {user && AUDIT_VISIBLE_ROLES.includes(user.rolId) && (
                  <DropdownMenuItem onMouseEnter={() => prefetchRoute("audit")} onFocus={() => prefetchRoute("audit")} onClick={() => navigate("/audit")} className="gap-2 cursor-pointer">
                    <ClipboardList className="h-4 w-4" /> {t("audit.viewAudit")}
                  </DropdownMenuItem>
                )}
                {user?.rolId === 4 && (
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" /> {t("profile.settings")}
                  </DropdownMenuItem>
                )}
                {user && user.rolId !== 5 && (
                  <DropdownMenuItem onMouseEnter={() => prefetchRoute("history")} onFocus={() => prefetchRoute("history")} onClick={() => navigate("/history")} className="gap-2 cursor-pointer">
                    <History className="h-4 w-4" /> {t("profile.history")}
                  </DropdownMenuItem>
                )}
                {user?.rolId === 4 && (
                  <DropdownMenuItem onMouseEnter={() => prefetchRoute("dashboard")} onFocus={() => prefetchRoute("dashboard")} onClick={() => navigate("/dashboard")} className="gap-2 cursor-pointer">
                    <BarChart3 className="h-4 w-4" /> {t("profile.dashboard")}
                  </DropdownMenuItem>
                )}
                {user?.rolId === 4 && (
                  <DropdownMenuItem
                    disabled={!hasSchedule}
                    onSelect={(e) => {
                      if (!hasSchedule) {
                        e.preventDefault();
                        return;
                      }
                      try {
                        exportAgendaToExcel({
                          user,
                          selectedDocente,
                          records,
                          schedule: getSchedule(),
                        });
                        toast.success(t("export.success"));
                      } catch (err) {
                        console.error(err);
                        toast.error(t("export.error"));
                      }
                    }}
                    className={`gap-2 ${hasSchedule ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                    title={!hasSchedule ? t("export.disabledReason") : undefined}
                  >
                    <Download className="h-4 w-4" /> {t("export.downloadAgenda")}
                  </DropdownMenuItem>
                )}
                {user?.rolId === 4 && (
                  <DropdownMenuItem
                    onClick={() => setSystemSwitchOpen(true)}
                    className="gap-2 cursor-pointer"
                  >
                    <Power className="h-4 w-4" />
                    <span className="flex-1">{t("profile.systemSwitch")}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${systemEnabled ? "bg-primary" : "bg-destructive"
                        }`}
                      aria-hidden
                    />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" /> {t("profile.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language selector with flag */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-2"
                >
                  <img src={currentFlag} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => setLanguage("es")}
                  className={`gap-2 cursor-pointer ${language === "es" ? "font-bold" : ""}`}
                >
                  <img src={flagCol} alt="" className="h-5 w-5 rounded-full object-cover" /> {t("lang.es")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={`gap-2 cursor-pointer ${language === "en" ? "font-bold" : ""}`}
                >
                  <img src={flagUsa} alt="" className="h-5 w-5 rounded-full object-cover" /> {t("lang.en")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="md:hidden text-gray-800 dark:text-gray-200 font-medium text-sm leading-tight px-2 pb-1 text-center">{t("header.title")}</p>
      </header>

      {/* Main content area */}
      {/*<div className="flex-1 flex min-h-0">*/}
      {/* Añadimos 'flex-col' para que en móvil se apilen y 'lg:flex-row' para que en PC sigan a los lados */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/*<main ref={mainRef} className="flex-1 overflow-auto">*/}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 dark:bg-transparent">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
            {/* Selector de formulario */}
            {/* Selector de formulario */}
            <div className="rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#8B0000] px-4 py-3">
                <label className="text-xl font-bold text-white">
                  Seleccionar formulario
                </label>
              </div>
              <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg p-4">
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                  value={activeSubfunction || ""}
                  onChange={(e) => setActiveSubfunction(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {subfunctions
                    .filter((s) => s.id !== "distribucion-horaria")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {t(s.shortTitleKey || s.shortTitle)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Formulario seleccionado */}
            {activeSubfunction && (
              <section id={`section-${activeSubfunction}`} data-section-id={activeSubfunction}>
                <SubfunctionForm subfunctionId={activeSubfunction} />
              </section>
            )}

            {/* Placeholder */}
            {!activeSubfunction && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Selecciona un formulario para comenzar</p>
              </div>
            )}
          </div>
        </main>
        {/* En móvil ocupa todo el ancho (w-full), en PC vuelve a su tamaño normal (lg:w-80) */}
        {/*<div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
          <SummaryPanel />
        </div>*/}

        {/* SummaryPanel siempre visible */}
        <div className="flex flex-col w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
          <SummaryPanel />
        </div>
      </div>



      {/* Floating hamburger button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-colors"
        aria-label={t("menu.open")}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Botón toggle SummaryPanel (solo móvil) */}
      <button
        onClick={() => setShowSummaryMobile(!showSummaryMobile)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-colors lg:hidden"
        aria-label="Resumen"
      >
        <ClipboardList className="h-6 w-6" />
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/50" onClick={handleMenuClose} />
          <div className="relative z-10 w-72 bg-card shadow-2xl h-full animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="icon" onClick={handleMenuClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <AppSidebar onClose={handleMenuClose} />
          </div>
        </div>
      )}


      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AlertDialog open={systemSwitchOpen} onOpenChange={setSystemSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.systemSwitchConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {systemEnabled
                ? t("system.shutdownSemester")
                : t("system.startNewSemester")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const next = !systemEnabled;
                try {
                  // Al apagar: archivar el semestre actual antes de bajar la bandera
                  if (!next) {
                    await archiveAndReset.mutateAsync({ archivedBy: user?.id });
                    toast.success(t("system.archiveSuccess"));
                  }
                  await toggleSystem.mutateAsync(next);
                  toast.success(
                    next
                      ? t("profile.systemSwitchToastOn")
                      : t("profile.systemSwitchToastOff")
                  );
                } catch (e) {
                  toast.error(String((e as Error)?.message || e));
                } finally {
                  setSystemSwitchOpen(false);
                }
              }}
              className={systemEnabled ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {systemEnabled
                ? t("profile.systemSwitchConfirmActionOff")
                : t("profile.systemSwitchConfirmActionOn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
