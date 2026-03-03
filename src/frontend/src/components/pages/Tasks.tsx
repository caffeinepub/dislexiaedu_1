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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAddPoints } from "../../hooks/useQueries";

type Priority = "Baixa" | "Média" | "Alta";
type Status = "pendente" | "em_progresso" | "concluída";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  createdAt: string;
}

const STORAGE_KEY = "dislexia-tasks";

function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Task[]) : getDefaultTasks();
  } catch {
    return getDefaultTasks();
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getDefaultTasks(): Task[] {
  const today = new Date();
  const addDays = (d: Date, n: number) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy.toISOString().split("T")[0];
  };

  return [
    {
      id: "1",
      title: "Entregar trabalho de Sociologia",
      description: "Análise de 3 páginas sobre estratificação social",
      subject: "Sociologia",
      dueDate: addDays(today, 3),
      priority: "Alta",
      status: "em_progresso",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Estudar para prova de Cálculo",
      description: "Capítulos 4 e 5: derivadas e integrais",
      subject: "Matemática",
      dueDate: addDays(today, 7),
      priority: "Alta",
      status: "pendente",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Ler capítulo sobre Revolução Industrial",
      description: "Páginas 120-145 do livro de História",
      subject: "História",
      dueDate: addDays(today, 5),
      priority: "Média",
      status: "pendente",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Revisão de Português",
      description: "Praticar concordância verbal e nominal",
      subject: "Português",
      dueDate: addDays(today, -1),
      priority: "Baixa",
      status: "concluída",
      createdAt: new Date().toISOString(),
    },
  ];
}

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  Alta: { label: "Alta", class: "bg-red-100 text-red-700 border-red-200" },
  Média: {
    label: "Média",
    class: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Baixa: { label: "Baixa", class: "bg-blue-100 text-blue-700 border-blue-200" },
};

const statusConfig: Record<Status, { label: string; class: string }> = {
  pendente: { label: "Pendente", class: "bg-muted text-muted-foreground" },
  em_progresso: { label: "Em progresso", class: "bg-sky-100 text-sky-700" },
  concluída: { label: "Concluída", class: "bg-green-100 text-green-700" },
};

const emptyTask: Partial<Task> = {
  title: "",
  description: "",
  subject: "",
  dueDate: "",
  priority: "Média",
  status: "pendente",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Partial<Task>>(emptyTask);
  const [isEditing, setIsEditing] = useState(false);
  const { identity } = useInternetIdentity();
  const addPoints = useAddPoints();

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchStatus = filterStatus === "all" || t.status === filterStatus;
        const matchPriority =
          filterPriority === "all" || t.priority === filterPriority;
        return matchStatus && matchPriority;
      })
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, filterStatus, filterPriority]);

  const pendingCount = tasks.filter((t) => t.status !== "concluída").length;
  const completedCount = tasks.filter((t) => t.status === "concluída").length;

  const openCreate = () => {
    setEditTask({ ...emptyTask });
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask({ ...task });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editTask.title?.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    let updated: Task[];
    if (isEditing && editTask.id) {
      updated = tasks.map((t) =>
        t.id === editTask.id ? ({ ...t, ...editTask } as Task) : t,
      );
      toast.success("Tarefa atualizada!");
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: editTask.title || "",
        description: editTask.description || "",
        subject: editTask.subject || "",
        dueDate: editTask.dueDate || "",
        priority: editTask.priority || "Média",
        status: editTask.status || "pendente",
        createdAt: new Date().toISOString(),
      };
      updated = [newTask, ...tasks];
      toast.success("Tarefa criada!");
    }
    setTasks(updated);
    saveTasks(updated);
    setModalOpen(false);
  };

  const toggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const wasNotCompleted = task?.status !== "concluída";
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status:
              t.status === "concluída"
                ? ("pendente" as Status)
                : ("concluída" as Status),
          }
        : t,
    );
    setTasks(updated);
    saveTasks(updated);
    // Award points when transitioning to completed
    if (wasNotCompleted && identity) {
      addPoints.mutate({ eventType: "tarefa", points: BigInt(15) });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = tasks.filter((t) => t.id !== deleteId);
    setTasks(updated);
    saveTasks(updated);
    setDeleteId(null);
    toast.success("Tarefa excluída");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const isOverdue = (dateStr: string, status: Status) => {
    if (!dateStr || status === "concluída") return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""} ·{" "}
            {completedCount} concluída{completedCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="tasks.open_modal_button"
          onClick={openCreate}
          size="lg"
          className="font-semibold rounded-xl"
        >
          + Nova tarefa
        </Button>
      </motion.div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Progresso geral</span>
            <span className="text-muted-foreground">
              {completedCount}/{tasks.length}
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
        className="flex gap-3 flex-wrap"
      >
        <div className="flex gap-2 flex-wrap">
          {(["all", "pendente", "em_progresso", "concluída"] as const).map(
            (s) => (
              <button
                type="button"
                key={s}
                data-ocid="tasks.filter.tab"
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "Todas" : statusConfig[s]?.label || s}
              </button>
            ),
          )}
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {(["all", "Alta", "Média", "Baixa"] as const).map((p) => (
            <button
              type="button"
              key={p}
              data-ocid="tasks.filter.tab"
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                filterPriority === p
                  ? p === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : `border-transparent ${priorityConfig[p as Priority]?.class}`
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "Todas prioridades" : p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="tasks.empty_state"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            ✅
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">
              Nenhuma tarefa encontrada
            </p>
            <p className="text-muted-foreground mt-1">
              {filterStatus !== "all" || filterPriority !== "all"
                ? "Tente ajustar os filtros"
                : "Crie sua primeira tarefa acima"}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
          className="space-y-3"
          data-ocid="tasks.list"
        >
          <AnimatePresence>
            {filtered.map((task, index) => (
              <motion.div
                key={task.id}
                data-ocid={`tasks.item.${index + 1}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: index * 0.04 }}
                className={`group flex items-start gap-4 p-4 rounded-2xl border bg-card hover:shadow-card-hover transition-shadow ${
                  task.status === "concluída" ? "opacity-70" : ""
                } ${isOverdue(task.dueDate, task.status) ? "border-red-200" : "border-border"}`}
              >
                <div className="pt-0.5">
                  <Checkbox
                    data-ocid={`tasks.checkbox.${index + 1}`}
                    checked={task.status === "concluída"}
                    onCheckedChange={() => toggleComplete(task.id)}
                    className="w-5 h-5"
                    aria-label={`Marcar "${task.title}" como ${task.status === "concluída" ? "pendente" : "concluída"}`}
                  />
                </div>

                <button
                  type="button"
                  className="flex-1 min-w-0 cursor-pointer text-left"
                  onClick={() => openEdit(task)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-semibold text-foreground leading-snug ${task.status === "concluída" ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityConfig[task.priority]?.class}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {task.subject && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {task.subject}
                      </span>
                    )}
                    {task.dueDate && (
                      <span
                        className={`text-xs font-medium ${isOverdue(task.dueDate, task.status) ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {isOverdue(task.dueDate, task.status) ? "⚠️ " : "📅 "}
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${statusConfig[task.status]?.class}`}
                    >
                      {statusConfig[task.status]?.label}
                    </Badge>
                  </div>
                </button>

                <button
                  type="button"
                  data-ocid={`tasks.delete_button.${index + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(task.id);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Excluir tarefa"
                >
                  🗑
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          data-ocid="tasks.modal"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {isEditing ? "Editar tarefa" : "Nova tarefa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title" className="text-base font-medium">
                Título *
              </Label>
              <Input
                id="task-title"
                data-ocid="tasks.input"
                placeholder="O que precisa ser feito?"
                value={editTask.title || ""}
                onChange={(e) =>
                  setEditTask((v) => ({ ...v, title: e.target.value }))
                }
                className="text-base py-3 px-4 h-auto rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc" className="text-base font-medium">
                Descrição
              </Label>
              <Textarea
                id="task-desc"
                data-ocid="tasks.textarea"
                placeholder="Detalhes da tarefa..."
                value={editTask.description || ""}
                onChange={(e) =>
                  setEditTask((v) => ({ ...v, description: e.target.value }))
                }
                className="text-base rounded-xl resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-subject" className="text-base font-medium">
                  Matéria
                </Label>
                <Input
                  id="task-subject"
                  data-ocid="tasks.input"
                  placeholder="Ex: Matemática"
                  value={editTask.subject || ""}
                  onChange={(e) =>
                    setEditTask((v) => ({ ...v, subject: e.target.value }))
                  }
                  className="text-base py-3 px-4 h-auto rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due" className="text-base font-medium">
                  Prazo
                </Label>
                <Input
                  id="task-due"
                  data-ocid="tasks.input"
                  type="date"
                  value={editTask.dueDate || ""}
                  onChange={(e) =>
                    setEditTask((v) => ({ ...v, dueDate: e.target.value }))
                  }
                  className="text-base py-3 px-4 h-auto rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Prioridade</Label>
                <Select
                  value={editTask.priority || "Média"}
                  onValueChange={(v) =>
                    setEditTask((t) => ({ ...t, priority: v as Priority }))
                  }
                >
                  <SelectTrigger
                    data-ocid="tasks.select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="Média">🟡 Média</SelectItem>
                    <SelectItem value="Alta">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Status</Label>
                <Select
                  value={editTask.status || "pendente"}
                  onValueChange={(v) =>
                    setEditTask((t) => ({ ...t, status: v as Status }))
                  }
                >
                  <SelectTrigger
                    data-ocid="tasks.select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="em_progresso">
                      🔄 Em progresso
                    </SelectItem>
                    <SelectItem value="concluída">✅ Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="tasks.cancel_button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              data-ocid="tasks.save_button"
              onClick={handleSave}
              className="rounded-xl font-semibold"
            >
              {isEditing ? "Salvar" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="tasks.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="tasks.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="tasks.confirm_button"
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
