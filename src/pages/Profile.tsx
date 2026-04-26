import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Save, X, KeyRound } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ROLES, STATUSES } from "@/types/auth";
import { toast } from "sonner";

const Profile = () => {
  const { user, roleName } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [pwdOpen, setPwdOpen] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase();
  const roleLabel = ROLES.find((r) => r.id === user.rolId)?.name || "";
  const statusLabel = STATUSES.find((s) => s.id === user.statusId)?.name || "";

  const handleSave = () => {
    toast.success(t("profilePage.updated"));
    setEditing(false);
  };

  const fields = [
    { label: t("profilePage.cedula"), key: "id", disabled: true },
    { label: t("profilePage.email"), key: "email", disabled: false },
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
                  variant="outline"
                  size="sm"
                  onClick={() => setPwdOpen(true)}
                  className="gap-1.5 w-full"
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
                      <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted">{(user as any)[f.key] || "—"}</p>
                    )}
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("profilePage.role")}</Label>
                  <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize">{roleLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("profilePage.status")}</Label>
                  <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize">{statusLabel}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </div>
  );
};

export default Profile;
