import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setLoading(false);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleValidate = async () => {
    setError(null);
    if (!currentPassword) {
      setError(t("profilePage.currentPassword"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-password", { currentPassword });
      setStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("profilePage.currentPasswordInvalid");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError(t("profilePage.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profilePage.passwordMismatch"));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t("profilePage.passwordSame"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success(t("profilePage.passwordChanged"));
      handleClose(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = t("profilePage.step").replace("{n}", String(step));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {t("profilePage.changePassword")}
          </DialogTitle>
          <DialogDescription>{stepLabel}</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-pwd">{t("profilePage.currentPassword")}</Label>
              <div className="relative">
                <Input
                  id="current-pwd"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                  autoFocus
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>{t("profilePage.currentPassword")} ✓</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pwd">{t("profilePage.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-pwd"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">{t("profilePage.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirm-pwd"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
              }}
              disabled={loading}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading}>
            {t("profilePage.cancel") || "Cancelar"}
          </Button>
          {step === 1 ? (
            <Button onClick={handleValidate} disabled={loading || !currentPassword}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("profilePage.validate")}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading || !newPassword || !confirmPassword}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("profilePage.save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
