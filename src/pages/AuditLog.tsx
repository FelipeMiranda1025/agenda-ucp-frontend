import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuditLog } from "@/hooks/useDatabase";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";

const AUDIT_TABLES = [
  "agendas",
  "agenda_comments",
  "subjects",
  "users",
  "indirect_teaching",
  "investigations",
  "social_projects",
  "teacher_training",
  "degree_works",
  "complementary_activities",
  "administrative_activities",
  "academic_practices",
  "professional_careers",
];

const ACTIONS = ["INSERT", "UPDATE", "DELETE"];

const actionBadgeVariant = (action: string) => {
  switch (action) {
    case "INSERT":
      return "default";
    case "UPDATE":
      return "secondary";
    case "DELETE":
      return "destructive";
    default:
      return "outline";
  }
};

const AuditLog = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: logs, isLoading } = useAuditLog(
    filterTable === "all" ? undefined : filterTable
  );

  const filteredLogs = (logs ?? []).filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b shrink-0">
        <div className="h-14 flex items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{t("audit.title")}</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("audit.filterTable")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.allTables")}</SelectItem>
              {AUDIT_TABLES.map((tb) => (
                <SelectItem key={tb} value={tb}>
                  {tb}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("audit.filterAction")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.allActions")}</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t("audit.noRecords")}</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>{t("audit.date")}</TableHead>
                  <TableHead>{t("audit.table")}</TableHead>
                  <TableHead>{t("audit.action")}</TableHead>
                  <TableHead>{t("audit.recordId")}</TableHead>
                  <TableHead>{t("audit.changedFields")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <Collapsible
                    key={log.id}
                    open={expandedRow === log.id}
                    onOpenChange={(open) => setExpandedRow(open ? log.id : null)}
                    asChild
                  >
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell>
                            {expandedRow === log.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.table_name}</TableCell>
                          <TableCell>
                            <Badge variant={actionBadgeVariant(log.action) as any}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate">
                            {log.record_id}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {log.changed_fields?.join(", ") || "—"}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-semibold mb-1 text-muted-foreground">
                                  {t("audit.oldData")}
                                </p>
                                <pre className="bg-muted rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                                  {log.old_data ? JSON.stringify(log.old_data, null, 2) : "—"}
                                </pre>
                              </div>
                              <div>
                                <p className="font-semibold mb-1 text-muted-foreground">
                                  {t("audit.newData")}
                                </p>
                                <pre className="bg-muted rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                                  {log.new_data ? JSON.stringify(log.new_data, null, 2) : "—"}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
