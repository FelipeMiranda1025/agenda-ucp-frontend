import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Wrench, LogOut } from "lucide-react";
import ucpLogo from "@/assets/ucp-logo.png";

export const SystemMaintenance = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <img src={ucpLogo} alt="UCP" className="h-16 mb-8" />
      <div className="rounded-full bg-muted p-6 mb-6">
        <Wrench className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-3 max-w-md">
        {t("maintenance.title")}
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {t("maintenance.description")}
      </p>
      <Button onClick={logout} variant="outline" className="gap-2">
        <LogOut className="h-4 w-4" />
        {t("maintenance.logout")}
      </Button>
    </div>
  );
};

export default SystemMaintenance;
