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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "dislexia-notes";

function loadNotes(): Note[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Note[]) : getDefaultNotes();
  } catch {
    return getDefaultNotes();
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function getDefaultNotes(): Note[] {
  return [
    {
      id: "1",
      title: "Introdução à Sociologia",
      subject: "Sociologia",
      content:
        "Sociologia é o estudo científico da sociedade, incluindo padrões de relações sociais, interação social e cultura.\n\nConceitos principais:\n- Estrutura social\n- Normas e valores\n- Instituições sociais\n- Estratificação social",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Cálculo - Derivadas",
      subject: "Matemática",
      content:
        "A derivada mede a taxa de variação de uma função em relação à variável independente.\n\nRegras básicas:\n- d/dx (xⁿ) = n·xⁿ⁻¹\n- d/dx (c) = 0\n- Regra da soma: d/dx [f+g] = f' + g'\n- Regra do produto: d/dx [f·g] = f'g + fg'",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Revolução Industrial",
      subject: "História",
      content:
        "A Revolução Industrial foi uma transformação socioeconômica que ocorreu na Inglaterra no final do séc. XVIII.\n\nCaracterísticas:\n- Substituição do trabalho manual por máquinas\n- Surgimento das fábricas\n- Urbanização acelerada\n- Proletariado e burguesia industrial",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

const SUBJECT_COLORS: Record<string, string> = {
  Matemática: "bg-blue-100 text-blue-700 border-blue-200",
  Sociologia: "bg-purple-100 text-purple-700 border-purple-200",
  História: "bg-amber-100 text-amber-700 border-amber-200",
  Português: "bg-rose-100 text-rose-700 border-rose-200",
  Física: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Química: "bg-green-100 text-green-700 border-green-200",
};

function getSubjectColor(subject: string): string {
  return (
    SUBJECT_COLORS[subject] || "bg-muted text-muted-foreground border-border"
  );
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Partial<Note>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const allSubjects = Array.from(
    new Set(notes.map((n) => n.subject).filter(Boolean)),
  );

  const filteredNotes = notes.filter((n) => {
    const matchSubject = filterSubject === "all" || n.subject === filterSubject;
    const matchSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  const openCreateModal = () => {
    setEditNote({ title: "", subject: "", content: "" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditNote(note);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editNote.title?.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    let updated: Note[];
    if (isEditing && editNote.id) {
      updated = notes.map((n) =>
        n.id === editNote.id
          ? { ...n, ...editNote, updatedAt: new Date().toISOString() }
          : n,
      );
      toast.success("Nota atualizada!");
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: editNote.title || "",
        subject: editNote.subject || "",
        content: editNote.content || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newNote, ...notes];
      toast.success("Nota criada!");
    }
    setNotes(updated);
    saveNotes(updated);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = notes.filter((n) => n.id !== deleteId);
    setNotes(updated);
    saveNotes(updated);
    setDeleteId(null);
    toast.success("Nota excluída");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Notas
          </h1>
          <p className="text-muted-foreground mt-1">
            {notes.length} nota{notes.length !== 1 ? "s" : ""} salvas localmente
          </p>
        </div>
        <Button
          data-ocid="notes.open_modal_button"
          onClick={openCreateModal}
          size="lg"
          className="font-semibold rounded-xl"
        >
          + Nova nota
        </Button>
      </motion.div>

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          data-ocid="notes.search_input"
          placeholder="Buscar nas notas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-base rounded-xl flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            data-ocid="notes.filter.tab"
            onClick={() => setFilterSubject("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filterSubject === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            }`}
          >
            Todas
          </button>
          {allSubjects.map((subj) => (
            <button
              type="button"
              key={subj}
              data-ocid="notes.filter.tab"
              onClick={() => setFilterSubject(subj)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                filterSubject === subj
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="notes.empty_state"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            📝
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">
              Nenhuma nota encontrada
            </p>
            <p className="text-muted-foreground mt-1">
              {searchQuery || filterSubject !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Crie sua primeira nota clicando no botão acima"}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.15 } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="notes.list"
        >
          <AnimatePresence>
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                data-ocid={`notes.item.${index + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl border border-border bg-card hover:shadow-card-hover transition-shadow space-y-3 flex flex-col overflow-hidden"
              >
                <button
                  type="button"
                  className="flex-1 p-5 text-left space-y-3 flex flex-col"
                  onClick={() => openEditModal(note)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                      {note.title}
                    </h3>
                    <button
                      type="button"
                      data-ocid={`notes.delete_button.${index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(note.id);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Excluir nota"
                    >
                      🗑
                    </button>
                  </div>
                  {note.subject && (
                    <Badge
                      variant="outline"
                      className={`text-xs w-fit ${getSubjectColor(note.subject)}`}
                    >
                      {note.subject}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-xs text-muted-foreground/60 pt-1 border-t border-border">
                    {formatDate(note.updatedAt)}
                  </p>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          data-ocid="notes.modal"
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {isEditing ? "Editar nota" : "Nova nota"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="note-title" className="text-base font-medium">
                Título *
              </Label>
              <Input
                id="note-title"
                data-ocid="notes.input"
                placeholder="Título da nota"
                value={editNote.title || ""}
                onChange={(e) =>
                  setEditNote((v) => ({ ...v, title: e.target.value }))
                }
                className="text-base py-3 px-4 h-auto rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-subject" className="text-base font-medium">
                Matéria
              </Label>
              <Input
                id="note-subject"
                data-ocid="notes.input"
                placeholder="Ex: Matemática, História..."
                value={editNote.subject || ""}
                onChange={(e) =>
                  setEditNote((v) => ({ ...v, subject: e.target.value }))
                }
                className="text-base py-3 px-4 h-auto rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content" className="text-base font-medium">
                Conteúdo
              </Label>
              <Textarea
                id="note-content"
                data-ocid="notes.textarea"
                placeholder="Escreva suas anotações aqui..."
                value={editNote.content || ""}
                onChange={(e) =>
                  setEditNote((v) => ({ ...v, content: e.target.value }))
                }
                className="text-base min-h-[200px] rounded-xl resize-y"
                style={{ lineHeight: "var(--app-line-height)" }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="notes.cancel_button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              data-ocid="notes.save_button"
              onClick={handleSave}
              className="rounded-xl font-semibold"
            >
              {isEditing ? "Salvar alterações" : "Criar nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="notes.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A nota será removida
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="notes.cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="notes.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
