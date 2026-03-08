import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { ROLES, STATUSES } from "@/types/auth";
import { toast } from "sonner";

const Profile = () => {
  const { user, roleName } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase();
  const roleLabel = ROLES.find((r) => r.id === user.rolId)?.name || "";
  const statusLabel = STATUSES.find((s) => s.id === user.statusId)?.name || "";

  const handleSave = () => {
    // In-memory only for now
    toast.success("Perfil actualizado (solo en sesión actual)");
    setEditing(false);
  };

  const fields = [
    { label: "Cédula (ID)", key: "id", disabled: true },
    { label: "Correo institucional", key: "email", disabled: false },
    { label: "Primer nombre", key: "firstName", disabled: false },
    { label: "Segundo nombre", key: "secondName", disabled: false },
    { label: "Primer apellido", key: "firstLastName", disabled: false },
    { label: "Segundo apellido", key: "secondLastName", disabled: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 flex items-center gap-3 border-b bg-primary px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-primary-foreground font-semibold text-lg">Mi Perfil</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-xl">Información del usuario</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                <Pencil className="h-4 w-4" /> Editar perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                  <Save className="h-4 w-4" /> Guardar
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
                <div className="text-center">
                  <p className="font-semibold text-lg">{user.firstName} {user.firstLastName}</p>
                  <p className="text-sm text-muted-foreground capitalize">{roleLabel}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${user.statusId === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
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
                  <Label className="text-sm font-medium text-muted-foreground">Rol</Label>
                  <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize">{roleLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted capitalize">{statusLabel}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
