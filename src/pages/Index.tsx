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
import { useAllAgendaComments, useMarkCommentsRead, useAgendaView, usePendingAgendaViewsForSupervisor, useUserNameByCc } from "@/hooks/useDatabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, ChevronDown, User, LogOut, Menu, X, Bell, MessageSquare, ClipboardList, History } from "lucide-react";

// Roles that can see the audit log — currently all roles; restrict later as needed
const AUDIT_VISIBLE_ROLES = [1, 2, 3, 4];
import ucpLogo from "@/assets/ucp-logo.png";
import flagCol from "@/assets/flag-col.png";
import flagUsa from "@/assets/flag-usa.png";

const Index = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifHistory, setShowNotifHistory] = useState(false);
  const [visibleSection, setVisibleSection] = useState<string>("header.production");
  const mainRef = useRef<HTMLDivElement>(null);

  // Global comments & notifications
  const { setSelectedDocente, docentesList, loadFromAgendaView } = useAgenda();
  const { data: allComments = [] } = useAllAgendaComments();
  const markRead = useMarkCommentsRead();
  const { data: agendaView } = useAgendaView(user?.id);
  const { data: pendingSubordinateAgendas = [] } = usePendingAgendaViewsForSupervisor(user?.id);

  // Resolve reviewer name when agenda is returned
  const reviewerCc = agendaView?.status === "returned" ? agendaView.reviewer_cc : null;
  const { data: reviewerName } = useUserNameByCc(reviewerCc);

  const isReturnedAgenda = agendaView?.status === "returned";

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    let count = allComments.filter(
      (c) => c.reviewer_cc !== user.id && !(c.read_by || []).includes(user.id)
    ).length;
    if (isReturnedAgenda) {
      count += 1;
    }
    // Add pending subordinate agendas as notifications for supervisors
    count += pendingSubordinateAgendas.length;
    return count;
  }, [allComments, user, isReturnedAgenda, pendingSubordinateAgendas]);

  const handleOpenNotifications = () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = allComments
      .filter((c) => c.reviewer_cc !== user.id && !(c.read_by || []).includes(user.id))
      .map((c) => c.id);
    if (unreadIds.length > 0) {
      markRead.mutate({ commentIds: unreadIds, userCc: user.id });
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

  const currentFlag = language === "es" ? flagCol : flagUsa;

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky header - white */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="h-14 flex items-center gap-6 px-4">
          <img src={ucpLogo} alt="UCP" className="h-9 w-auto" />
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-800 dark:text-gray-100 font-semibold text-lg leading-tight">
              {t("header.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-tight">{t(visibleSection)}</p>
          </div>

          {/* Right-side toolbar */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <DropdownMenu onOpenChange={(open) => { if (open) handleOpenNotifications(); }}>
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
              <DropdownMenuContent align="end" className="w-80 max-h-72 overflow-auto">
                <div className="px-3 py-2 text-sm font-semibold">{t("notifications.title")}</div>
                <DropdownMenuSeparator />
                {/* Returned agenda notification for docentes */}
                {isReturnedAgenda && (
                  <div className="px-3 py-2 text-xs border-b bg-destructive/10">
                    <p className="text-foreground font-medium">{reviewerName || agendaView?.reviewer_cc}</p>
                    <p className="text-muted-foreground">{t("notifications.returned")}</p>
                    {agendaView?.reviewed_at && (
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(agendaView.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {/* Pending subordinate agendas for supervisors */}
                {pendingSubordinateAgendas.map((pa) => (
                  <button
                    key={pa.agendaView.id}
                    className="w-full text-left px-3 py-2 text-xs border-b last:border-0 bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
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
                    }}
                  >
                    <p className="text-foreground font-medium">{pa.docenteName}</p>
                    <p className="text-muted-foreground">{t("notifications.pendingReview")}</p>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(pa.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
                {/* Regular comment notifications */}
                {allComments.filter((c) => c.reviewer_cc !== user?.id).length === 0 && pendingSubordinateAgendas.length === 0 && !isReturnedAgenda ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    {t("notifications.empty")}
                  </div>
                ) : (
                  allComments
                    .filter((c) => c.reviewer_cc !== user?.id)
                    .slice(0, 10)
                    .map((c) => (
                      <div key={c.id} className="px-3 py-2 text-xs border-b last:border-0">
                        <p className="text-foreground line-clamp-2">{c.comment}</p>
                        <span className="text-muted-foreground">
                          {c.reviewer_cc} · {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                )}
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
                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> {t("profile.view")}
                </DropdownMenuItem>
                {user && AUDIT_VISIBLE_ROLES.includes(user.rolId) && (
                  <DropdownMenuItem onClick={() => navigate("/audit")} className="gap-2 cursor-pointer">
                    <ClipboardList className="h-4 w-4" /> {t("audit.viewAudit")}
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
      </header>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        <main ref={mainRef} className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
            {subfunctions
              .filter((s) => s.id !== "distribucion-horaria")
              .map((s) => (
                <section key={s.id} id={`section-${s.id}`} data-section-id={s.id}>
                  <SubfunctionForm subfunctionId={s.id} />
                </section>
              ))}
          </div>
        </main>
        <SummaryPanel />
      </div>

      {/* Floating hamburger button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-colors"
        aria-label={t("menu.open")}
      >
        <Menu className="h-6 w-6" />
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
    </div>
  );
};

export default Index;
