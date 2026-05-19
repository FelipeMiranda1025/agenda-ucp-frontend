import { useContext } from "react";
import { AgendaContext } from "@/context/agendaContextRef";

export const useAgenda = () => {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda must be used within AgendaProvider");
  return ctx;
};
