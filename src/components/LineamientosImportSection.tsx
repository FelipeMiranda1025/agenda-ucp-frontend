import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileText, Sparkles, History, X, CheckCircle2 } from "lucide-react";
import {
  useUploadLineamientos,
  useApplyExtractedRules,
  useLineamientosHistory,
  type ExtractedRule,
  type LineamientosDocument,
} from "@/hooks/useLineamientosImport";
import { useSemesterLabel } from "@/hooks/useSemesterArchive";

type Phase = "idle" | "selected" | "processing" | "preview" | "applied";

const categoryLabel = (c: ExtractedRule["category"], t: (k: string) => string) => {
  if (c === "investigacion") return t("settings.investigacion");
  if (c === "administrativas") return t("settings.administrativas");
  if (c === "visual") return "Cambios Visuales / Diseño";
  return t("settings.formacion");
};

export function LineamientosImportSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [extracted, setExtracted] = useState<ExtractedRule[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [docId, setDocId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { label: semesterLabel } = useSemesterLabel();

  const upload = useUploadLineamientos();
  const apply = useApplyExtractedRules();
  const history = useLineamientosHistory();

  const lastApplied = history.data?.find(d => d.applied) ?? null;

  if (!user || user.rolId !== 4) {
    return null;
  }

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: t("settings.fileTypeError"), variant: "destructive" });
      return;
    }
    setFile(f);
    setPhase("selected");
    setExtracted([]);
    setSummary("");
    setDocId(null);
    setSelected(new Set());
  };

  const handleProcess = async () => {
    if (!file) return;
    setPhase("processing");
    try {
      const doc = await upload.mutateAsync({
        file,
        semesterLabel,
        uploadedBy: user.id,
      });
      setExtracted(doc.rules_extracted ?? []);
      setSummary(doc.summary ?? "");
      setDocId(doc.id);
      // Pre-select all
      setSelected(new Set((doc.rules_extracted ?? []).map((_, i) => i)));
      setPhase("preview");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : t("settings.importError");
      toast({ title: t("settings.importError"), description: msg, variant: "destructive" });
      setPhase("selected");
    }
  };

  const handleApply = async () => {
    if (!docId) return;
    const selectedRules = extracted.filter((_, i) => selected.has(i));
    if (selectedRules.length === 0) return;
    try {
      await apply.mutateAsync({
        documentId: docId,
        rules: selectedRules,
        appliedBy: user.id,
      });
      toast({ title: t("settings.appliedSuccess") });
      setPhase("applied");
      setTimeout(() => handleDiscard(), 1500);
    } catch (err) {
      console.error(err);
      toast({ title: t("settings.importError"), variant: "destructive" });
    }
  };

  const handleDiscard = () => {
    setFile(null);
    setExtracted([]);
    setSummary("");
    setDocId(null);
    setSelected(new Set());
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const grouped = extracted.reduce<Record<string, { rule: ExtractedRule; idx: number }[]>>((acc, rule, idx) => {
    (acc[rule.category] ||= []).push({ rule, idx });
    return acc;
  }, {});

  return (
    <div className="space-y-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("settings.importPdfTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("settings.importPdfDesc")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setHistoryOpen(v => !v)}
        >
          <History className="h-3.5 w-3.5" />
          {historyOpen ? t("settings.hideHistory") : t("settings.viewHistory")}
        </Button>
      </div>

      {lastApplied && phase === "idle" && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span>
            {t("settings.lastImport")}: <span className="font-medium">{lastApplied.semester_label}</span>
            {" · "}{new Date(lastApplied.applied_at ?? lastApplied.uploaded_at).toLocaleDateString()}
            {lastApplied.applied_by ? ` · ${lastApplied.applied_by}` : ""}
          </span>
        </div>
      )}

      {/* Dropzone */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          className={`w-full rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/60 hover:bg-accent/30"
          }`}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">{t("settings.dropPdf")}</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {/* Selected file + process */}
      {phase === "selected" && file && (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-card p-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="ghost" onClick={handleDiscard}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleProcess} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("settings.processWithAi")}
            </Button>
          </div>
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("settings.processing")}
        </div>
      )}

      {/* Preview */}
      {phase === "preview" && (
        <div className="space-y-3">
          {summary && (
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t("settings.summary")}</p>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {extracted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("settings.noRulesExtracted")}</p>
          ) : (
            <div className="rounded-md border bg-card max-h-[40vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>{t("settings.rule")}</TableHead>
                    <TableHead className="w-20 text-right">{t("settings.hours")}</TableHead>
                    <TableHead className="w-24 text-right">{t("settings.subjects")}</TableHead>
                    <TableHead className="w-28">{t("settings.sourceArticle")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <>
                      <TableRow key={`h-${cat}`} className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={5} className="py-1.5 text-xs font-semibold uppercase tracking-wide">
                          {categoryLabel(cat as ExtractedRule["category"], t)}
                        </TableCell>
                      </TableRow>
                      {items.map(({ rule, idx }) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2">
                            <Checkbox
                              checked={selected.has(idx)}
                              onCheckedChange={() => toggleSelect(idx)}
                            />
                          </TableCell>
                          <TableCell className="py-2 text-sm">{rule.label}</TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {rule.category === "visual" ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs font-mono">{String(rule.value)}</span>
                                <div 
                                  className="h-4 w-4 rounded border" 
                                  style={{ backgroundColor: String(rule.value) }}
                                />
                              </div>
                            ) : (
                              rule.hours
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {rule.category === "visual" ? "—" : rule.subjects}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">{rule.source_article}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              {t("settings.discard")}
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={selected.size === 0 || apply.isPending}
              className="gap-1.5"
            >
              {apply.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("settings.applySelected")} ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {phase === "applied" && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          {t("settings.appliedSuccess")}
        </div>
      )}

      {/* History */}
      {historyOpen && (
        <div className="rounded-md border bg-card">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold">{t("settings.importHistory")}</p>
          </div>
          {history.isLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (history.data?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">—</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("history.semester")}</TableHead>
                    <TableHead className="text-xs">{t("settings.fileName")}</TableHead>
                    <TableHead className="text-xs">{t("settings.uploadDate")}</TableHead>
                    <TableHead className="text-xs">{t("settings.uploadedBy")}</TableHead>
                    <TableHead className="text-xs text-right">{t("settings.rulesCount")}</TableHead>
                    <TableHead className="text-xs">{t("settings.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data!.map((doc: LineamientosDocument) => (
                    <TableRow key={doc.id}>
                      <TableCell className="text-xs">{doc.semester_label}</TableCell>
                      <TableCell className="text-xs truncate max-w-[180px]">{doc.file_name}</TableCell>
                      <TableCell className="text-xs">{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs">{doc.uploaded_by ?? "—"}</TableCell>
                      <TableCell className="text-xs text-right">{(doc.rules_extracted ?? []).length}</TableCell>
                      <TableCell>
                        {doc.applied ? (
                          <Badge variant="default" className="text-[10px]">{t("settings.applied")}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">{t("settings.pending")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
