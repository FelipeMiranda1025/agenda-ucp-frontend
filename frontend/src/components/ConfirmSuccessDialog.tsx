import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ConfirmSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  variant: "success" | "pending";
}

export function ConfirmSuccessDialog({ open, onClose, variant }: ConfirmSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md text-center flex flex-col items-center gap-6 py-10">
        {variant === "success" ? (
          <CheckCircle className="h-20 w-20 text-green-500" strokeWidth={1.5} />
        ) : (
          <span className="text-7xl">❔</span>
        )}

        <h2 className="text-2xl font-bold text-foreground">
          {variant === "success"
            ? "Se cargó con éxito"
            : "Ups. Aún no dan respuesta"}
        </h2>

        <p className="text-muted-foreground text-base">
          Espera que la agenda sea aprobada
        </p>

        <Button onClick={onClose} variant="outline" className="mt-2 min-w-[120px]">
          Salir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
