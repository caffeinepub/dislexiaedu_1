import { motion } from "motion/react";
import { useMemo } from "react";
import type { Page } from "../../App";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useStudySessions, useTips } from "../../hooks/useQueries";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const quickLinks: {
  id: Page;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "timer",
    label: "Temporizador",
    description: "Sessões de estudo com foco",
    icon: "⏱️",
    color: "from-emerald-500/10 to-emerald-600/5 border-emerald-200",
  },
  {
    id: "notes",
    label: "Notas",
    description: "Suas anotações organizadas",
    icon: "📝",
    color: "from-sky-500/10 to-sky-600/5 border-sky-200",
  },
  {
    id: "tasks",
    label: "Tarefas",
    description: "Controle suas atividades",
    icon: "✅",
    color: "from-violet-500/10 to-violet-600/5 border-violet-200",
  },
  {
    id: "glossary",
    label: "Glossário",
    description: "Termos acadêmicos explicados",
    icon: "📚",
    color: "from-amber-500/10 to-amber-600/5 border-amber-200",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getThisWeekSessions(
  sessions: Array<{ date: bigint; durationMinutes: bigint; subject: string }>,
) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => {
    // date is stored as nanoseconds
    const dateMs = Number(s.date) / 1_000_000;
    return dateMs >= weekAgo;
  });
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { identity } = useInternetIdentity();
  const { data: tips = [], isLoading: tipsLoading } = useTips();
  const { data: sessions = [] } = useStudySessions();

  const dailyTip = useMemo(() => {
    if (tips.length === 0) return null;
    // Deterministic based on day
    const dayIndex =
      Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % tips.length;
    return tips[dayIndex];
  }, [tips]);

  const thisWeekSessions = useMemo(
    () => getThisWeekSessions(sessions),
    [sessions],
  );
  const totalMinutesThisWeek = useMemo(
    () =>
      thisWeekSessions.reduce((acc, s) => acc + Number(s.durationMinutes), 0),
    [thisWeekSessions],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-5xl mx-auto space-y-8"
    >
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <p className="text-muted-foreground text-lg font-medium">
          {getGreeting()}! 👋
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          {identity ? "Bem-vindo(a) de volta" : "Bem-vindo(a)!"}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
          O DislexiaEdu está aqui para apoiar sua jornada acadêmica com
          ferramentas pensadas especialmente para você.
        </p>
      </motion.div>

      {/* Daily Tip */}
      <motion.div variants={itemVariants} data-ocid="dashboard.card">
        {tipsLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3" />
            <div className="h-6 bg-muted rounded w-2/3" />
          </div>
        ) : dailyTip ? (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/4 p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">💡</span>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                  Dica do dia
                </p>
                <p className="text-foreground text-lg font-medium leading-relaxed">
                  {dailyTip}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Stats (only for logged in users) */}
      {identity && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div
            className="rounded-2xl border border-border bg-card p-4 text-center"
            data-ocid="dashboard.section"
          >
            <div className="text-3xl font-display font-bold text-primary">
              {thisWeekSessions.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Sessões esta semana
            </div>
          </div>
          <div
            className="rounded-2xl border border-border bg-card p-4 text-center"
            data-ocid="dashboard.section"
          >
            <div className="text-3xl font-display font-bold text-primary">
              {Math.round(totalMinutesThisWeek / 60)}h
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Horas estudadas
            </div>
          </div>
          <div
            className="rounded-2xl border border-border bg-card p-4 text-center"
            data-ocid="dashboard.section"
          >
            <div className="text-3xl font-display font-bold text-primary">
              {new Set(sessions.map((s) => s.subject)).size}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Matérias estudadas
            </div>
          </div>
          <div
            className="rounded-2xl border border-border bg-card p-4 text-center"
            data-ocid="dashboard.section"
          >
            <div className="text-3xl font-display font-bold text-primary">
              {sessions.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Sessões no total
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick access */}
      <motion.div variants={itemVariants}>
        <h2 className="font-display text-xl font-bold text-foreground mb-4">
          Acesso rápido
        </h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-ocid="dashboard.list"
        >
          {quickLinks.map((link, index) => (
            <motion.button
              key={link.id}
              data-ocid={`dashboard.item.${index + 1}`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(link.id)}
              className={`
                flex items-center gap-4 p-5 rounded-2xl border text-left
                bg-gradient-to-br ${link.color}
                hover:shadow-card-hover transition-shadow duration-200
                group w-full
              `}
            >
              <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                {link.icon}
              </div>
              <div>
                <div className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                  {link.label}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {link.description}
                </div>
              </div>
              <div className="ml-auto text-muted-foreground/50 group-hover:text-primary/60 transition-colors">
                →
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tips list */}
      {tips.length > 1 && (
        <motion.div variants={itemVariants}>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">
            Dicas de estudo
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            data-ocid="tips.list"
          >
            {tips.map((tip, i) => (
              <div
                key={tip}
                data-ocid={`tips.item.${i + 1}`}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <span className="text-primary font-bold text-sm mt-0.5 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
