import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Copy, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSemesterArchives, useSemesterLabel, type SemesterArchive } from "@/hooks/useSemesterArchive";
import { useApprovedAgendasForHistory, useUpsertAgendaView } from "@/hooks/useDatabase";
import { toast } from "sonner";

interface ArchivedDocenteEntry {
  user_cc: string;
  records: any[];
  status: string;
}

const HistoryPanel = () => {
  const navigate = useNavigate();
  const { user, roleName } = useAuth();
  const { t } = useLanguage();
  const { data: archives = [], isLoading: loadingArchives } = useSemesterArchives();
  const { label: semesterLabel, isLoading: loadingLabel } = useSemesterLabel();
  const { data: approvedAgendas = [], isLoading: loadingApproved } = useApprovedAgendasForHistory(
    user?.id,
    user?.rolId
  );
  const upsertAgendaView = useUpsertAgendaView();

  const isSupervisor =
    roleName === "DirectorPrograma" ||
    roleName === "DecanoFacultad" ||
    roleName === "VicerrectorAcadémico";

  const [selectedArchive, setSelectedArchive] = useState<SemesterArchive | null>(null);
  const [confirmCopy, setConfirmCopy] = useState<{ entry: ArchivedDocenteEntry; name: string } | null>(
    null
  );

  const filterArchiveEntries = (archive: SemesterArchive): ArchivedDocenteEntry[] => {
    const entries = (archive.agenda_views || []) as ArchivedDocenteEntry[];
    if (isSupervisor) return entries;
    return entries.filter((e) => e.user_cc === user?.id);
  };

  const visibleArchives = useMemo(() => {
    return archives
      .map((a) => ({ archive: a, entries: filterArchiveEntries(a) }))
      .filter((x) => x.entries.length > 0);
  }, [archives, isSupervisor, user?.id]);

  const docenteNameByCc = useMemo(() => {
    const map = new Map<string, string>();
    if (user) map.set(user.id, t("history.you"));
    for (const item of approvedAgendas) {
      map.set(item.docenteCc, item.docenteName);
    }
    return map;
  }, [user, approvedAgendas, t]);

  const handleCopy = async (entry: ArchivedDocenteEntry) => {
    try {
      const targetCc = user!.id;
      await upsertAgendaView.mutateAsync({
        userCc: targetCc,
        records: entry.records || [],
        status: "pending",
      });
      toast.success(t("history.copySuccess"));
      setConfirmCopy(null);
    } catch (e) {
      toast.error(String((e as Error)?.message || e));
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const isLoading = loadingArchives || loadingApproved || loadingLabel;
  const hasCurrentApproved = approvedAgendas.length > 0;
  const hasArchives = visibleArchives.length > 0;
  const isEmpty = !isLoading && !hasCurrentApproved && !hasArchives;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t("history.title")}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {!selectedArchive && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("history.currentSemester")}: {semesterLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">{t("dashboard.loading")}</p>
                ) : !hasCurrentApproved ? (
                  <p className="text-muted-foreground text-sm text-center py-6">
                    {t("history.approvedEmpty")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("history.docente")}</TableHead>
                        <TableHead>{t("history.statusApproved")}</TableHead>
                        <TableHead className="text-right">{t("history.recordsCount")}</TableHead>
                        <TableHead>{t("history.approvedAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedAgendas.map((item) => (
                        <TableRow key={item.agendaView.id}>
                          <TableCell className="font-medium">{item.docenteName}</TableCell>
                          <TableCell>{t("history.statusApproved")}</TableCell>
                          <TableCell className="text-right">{item.recordsCount}</TableCell>
                          <TableCell>{formatDate(item.approvedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("history.archivedSemesters")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">{t("dashboard.loading")}</p>
                ) : !hasArchives ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <Inbox className="h-10 w-10" />
                    <p>{t("history.empty")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("history.semester")}</TableHead>
                        <TableHead>{t("history.archivedAt")}</TableHead>
                        <TableHead className="text-right">{t("history.docentesCount")}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleArchives.map(({ archive, entries }) => (
                        <TableRow
                          key={archive.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedArchive(archive)}
                        >
                          <TableCell className="font-medium">{archive.semester_label}</TableCell>
                          <TableCell>{formatDate(archive.archived_at)}</TableCell>
                          <TableCell className="text-right">{entries.length}</TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {isEmpty && (
              <p className="text-center text-sm text-muted-foreground">{t("history.allEmpty")}</p>
            )}
          </>
        )}

        {selectedArchive && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {t("history.semester")}: {selectedArchive.semester_label}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("history.archivedAt")}: {formatDate(selectedArchive.archived_at)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedArchive(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.docente")}</TableHead>
                    <TableHead className="text-right">{t("history.recordsCount")}</TableHead>
                    {!isSupervisor && (
                      <TableHead className="text-right">{t("history.actions")}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterArchiveEntries(selectedArchive).map((entry) => {
                    const name = docenteNameByCc.get(entry.user_cc) || entry.user_cc;
                    return (
                      <TableRow key={entry.user_cc}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{(entry.records || []).length}</TableCell>
                        {!isSupervisor && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmCopy({ entry, name })}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {t("history.copyToCurrent")}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!confirmCopy} onOpenChange={(o) => !o && setConfirmCopy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("history.copyToCurrent")}</AlertDialogTitle>
            <AlertDialogDescription>{t("history.copyConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmCopy && handleCopy(confirmCopy.entry)}>
              {t("history.copyToCurrent")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoryPanel;
