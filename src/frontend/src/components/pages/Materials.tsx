import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { PdfMetadata } from "../../backend.d";
import {
  useAddPdfMetadata,
  useAddPoints,
  useDeletePdfMetadata,
  useUserPdfs,
} from "../../hooks/useQueries";
import { useStorageUpload } from "../../hooks/useStorageUpload";

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Materials() {
  const { data: pdfs = [], isLoading } = useUserPdfs();
  const addPdfMetadata = useAddPdfMetadata();
  const deletePdf = useDeletePdfMetadata();
  const addPoints = useAddPoints();
  const { uploadFile } = useStorageUpload();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são aceitos.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo: 50 MB.");
        return;
      }
      setUploadingName(file.name);
      setUploadProgress(0);
      try {
        const { hash, sizeBytes } = await uploadFile(file, (pct) =>
          setUploadProgress(pct),
        );
        await addPdfMetadata.mutateAsync({
          name: file.name,
          blobId: hash,
          sizeBytes,
        });
        try {
          await addPoints.mutateAsync({
            eventType: "pdf_upload",
            points: BigInt(5),
          });
        } catch {
          // Points failure is non-critical
        }
        toast.success(`"${file.name}" enviado com sucesso! +5 pontos 🎉`);
      } catch (err) {
        console.error(err);
        toast.error(`Erro ao enviar "${file.name}". Tente novamente.`);
      } finally {
        setUploadProgress(null);
        setUploadingName(null);
      }
    },
    [uploadFile, addPdfMetadata, addPoints],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleUpload(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [handleUpload],
  );

  const handleDelete = useCallback(
    async (pdf: PdfMetadata) => {
      try {
        await deletePdf.mutateAsync(pdf.blobId);
        toast.success(`"${pdf.name}" removido.`);
      } catch {
        toast.error("Erro ao remover o arquivo.");
      }
    },
    [deletePdf],
  );

  const isUploading = uploadProgress !== null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Materiais
        </h1>
        <p className="text-muted-foreground mt-1">
          Organize seus PDFs e ganhe 5 pontos por upload
        </p>
      </motion.div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      >
        <button
          type="button"
          data-ocid="materials.dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Área para soltar ou selecionar PDF"
          className={`
            w-full relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
            transition-all duration-200 select-none
            ${
              isDragging
                ? "border-primary bg-primary/8 scale-[1.01]"
                : "border-border hover:border-primary/60 hover:bg-primary/4 bg-card"
            }
            ${isUploading ? "cursor-not-allowed opacity-80" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={handleFileInput}
            aria-hidden="true"
            tabIndex={-1}
            data-ocid="materials.upload_button"
          />

          {isUploading ? (
            <div data-ocid="materials.loading_state" className="space-y-4">
              <div className="text-4xl">📤</div>
              <p className="font-semibold text-foreground text-base">
                Enviando <span className="text-primary">{uploadingName}</span>
              </p>
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Progresso</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl">📄</div>
              <div>
                <p className="font-semibold text-foreground text-base">
                  Arraste um PDF aqui ou{" "}
                  <span className="text-primary underline underline-offset-2">
                    selecione um arquivo
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Apenas PDFs · Máximo 50 MB · +5 pontos por upload
                </p>
              </div>
              <Button
                type="button"
                data-ocid="materials.upload_button"
                variant="outline"
                size="sm"
                className="mt-2 rounded-xl font-semibold pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              >
                Escolher arquivo
              </Button>
            </div>
          )}
        </button>
      </motion.div>

      {/* PDF list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-lg">Meus PDFs</h2>
          {pdfs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pdfs.length} arquivo{pdfs.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div data-ocid="materials.loading_state" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : pdfs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="materials.empty_state"
            className="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-border bg-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              📁
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Nenhum PDF enviado ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload de materiais de estudo acima
              </p>
            </div>
          </motion.div>
        ) : (
          <div data-ocid="materials.list" className="space-y-2">
            <AnimatePresence>
              {pdfs.map((pdf, index) => (
                <motion.div
                  key={pdf.blobId}
                  data-ocid={`materials.item.${index + 1}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: index * 0.04 }}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                    📄
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate leading-snug">
                      {pdf.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBytes(pdf.sizeBytes)} ·{" "}
                      {formatDate(pdf.uploadedAt)}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    data-ocid={`materials.delete_button.${index + 1}`}
                    onClick={() => void handleDelete(pdf)}
                    disabled={deletePdf.isPending}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 disabled:opacity-40"
                    aria-label={`Remover "${pdf.name}"`}
                  >
                    🗑️
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Points reminder */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        className="rounded-2xl border border-border bg-secondary/40 p-5"
      >
        <h3 className="font-semibold text-foreground mb-2">
          💡 Dica sobre recompensas
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cada PDF enviado vale{" "}
          <strong className="text-foreground">+5 pontos</strong>. Acesse a seção{" "}
          <strong className="text-foreground">Recompensas</strong> para ver seu
          saldo e seu nível de conquista!
        </p>
      </motion.div>
    </div>
  );
}
