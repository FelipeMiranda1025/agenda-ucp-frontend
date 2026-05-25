import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Pencil, Save, X, KeyRound, Settings } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { LineamientosImportSection } from "@/components/LineamientosImportSection";
import { ROLES, STATUSES } from "@/types/auth";
import { toast } from "sonner";
import { useAgendaView } from "@/hooks/useDatabase";
import { canAccessScheduleDistribution } from "@/lib/agendaScheduleAccess";
import { hasScheduleInStorage } from "@/lib/scheduleStorage";

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [pwdOpen, setPwdOpen] = useState(false);
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase();
  const roleLabel = ROLES.find((r) => r.id === user.rolId)?.name || "";
  const statusLabel = STATUSES.find((s) => s.id === user.statusId)?.name || "";

  const isVicerrector = user.rolId === 4;
  const { data: ownAgendaView, isLoading: loadingAgendaView } = useAgendaView(user.id);
  const scheduleAccess = canAccessScheduleDistribution(ownAgendaView, user.rolId);
  const agendaApproved = ownAgendaView?.status === "approved";
  const scheduleReady = hasScheduleInStorage(user.id);
  const showScheduleCard = agendaApproved && scheduleAccess && !loadingAgendaView;

  const handleSave = () => {
    toast.success(t("profilePage.updated"));
    setEditing(false);
  };

  const fields = [
    { label: t("profilePage.cedula"), key: "id", disabled: !isVicerrector },
    { label: t("profilePage.email"), key: "email", disabled: !isVicerrector },
    { label: t("profilePage.firstName"), key: "firstName", disabled: false },
    { label: t("profilePage.secondName"), key: "secondName", disabled: false },
    { label: t("profilePage.firstLastName"), key: "firstLastName", disabled: false },
    { label: t("profilePage.secondLastName"), key: "secondLastName", disabled: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 flex items-center gap-3 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-gray-800 dark:text-gray-100 font-semibold text-lg">{t("profilePage.title")}</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información Personal</TabsTrigger>
            {isVicerrector && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("profile.settings")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {showScheduleCard && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t("profilePage.scheduleSection")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {scheduleReady
                      ? t("profilePage.scheduleReady")
                      : t("profilePage.schedulePending")}
                  </p>
                  <Button
                    className="shrink-0 gap-2"
                    onClick={() => navigate("/schedule")}
                  >
                    <Calendar className="h-4 w-4" />
                    {scheduleReady
                      ? t("profilePage.viewSchedule")
                      : t("profilePage.openSchedule")}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-xl">{t("profilePage.userInfo")}</CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                    <Pencil className="h-4 w-4" /> {t("profilePage.edit")}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} className="gap-1.5">
                      <Save className="h-4 w-4" /> {t("profilePage.save")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ ...user }); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-32 w-32 text-4xl">
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      onClick={() => setPwdOpen(true)}
                      className="gap-1.5 min-w-[180px]"
                    >
                      <KeyRound className="h-4 w-4" /> {t("profilePage.changePassword")}
                    </Button>
                    <div className="text-center">
                      <p className="font-semibold text-lg">{user.firstName} {user.firstLastName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{roleLabel}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${user.statusId === 1 ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-sm font-medium text-muted-foreground">{f.label}</Label>
                        {editing && !f.disabled ? (
                          <Input
                            value={(form as any)[f.key] || ""}
                            onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                          />
                        ) : (
                          <p className={`text-sm font-medium py-2 px-3 rounded-md bg-muted ${f.disabled ? 'opacity-70' : ''}`}>{(user as any)[f.key] || "—"}</p>
                        )}
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">{t("profilePage.role")}</Label>
                      {editing && isVicerrector ? (
                         <Input
                           value={form.rolId}
                           onChange={(e) => setForm((p: any) => ({ ...p, rolId: Number(e.target.value) }))}
                           type="number"
                         />
                      ) : (
                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize opacity-70">{roleLabel}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">{t("profilePage.status")}</Label>
                      {editing && isVicerrector ? (
                         <Input
                           value={form.statusId}
                           onChange={(e) => setForm((p: any) => ({ ...p, statusId: Number(e.target.value) }))}
                           type="number"
                         />
                      ) : (
                        <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize opacity-70">{statusLabel}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isVicerrector && (
            <TabsContent value="settings">
              <LineamientosImportSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </div>
  );
};

export default Profile;
