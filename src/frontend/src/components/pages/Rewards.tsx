import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "motion/react";
import { usePointsHistory, useUserPoints } from "../../hooks/useQueries";

interface Level {
  name: string;
  emoji: string;
  min: number;
  max: number;
  color: string;
  bgClass: string;
  textClass: string;
}

const LEVELS: Level[] = [
  {
    name: "Bronze",
    emoji: "🥉",
    min: 0,
    max: 99,
    color: "oklch(0.65 0.08 50)",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
  {
    name: "Prata",
    emoji: "🥈",
    min: 100,
    max: 499,
    color: "oklch(0.7 0.04 240)",
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
  },
  {
    name: "Ouro",
    emoji: "🥇",
    min: 500,
    max: Number.POSITIVE_INFINITY,
    color: "oklch(0.75 0.15 80)",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-700",
  },
];

function getLevel(points: number): Level {
  return LEVELS.find((l) => points >= l.min && points <= l.max) ?? LEVELS[0];
}

function getLevelProgress(points: number, level: Level): number {
  if (level.max === Number.POSITIVE_INFINITY) return 100;
  const range = level.max - level.min + 1;
  const progress = points - level.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

const EVENT_LABELS: Record<string, string> = {
  pomodoro: "Sessão Pomodoro",
  tarefa: "Tarefa concluída",
  pdf_upload: "Upload de PDF",
};

function formatEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPoints(points: bigint): string {
  return `+${Number(points)}`;
}

const POINTS_RULES = [
  { label: "Sessão Pomodoro concluída", points: 10, emoji: "⏱️" },
  { label: "Tarefa marcada como concluída", points: 15, emoji: "✅" },
  { label: "Upload de PDF", points: 5, emoji: "📄" },
];

export default function Rewards() {
  const { data: totalPoints = BigInt(0), isLoading: pointsLoading } =
    useUserPoints();
  const { data: history = [], isLoading: historyLoading } = usePointsHistory();

  const pts = Number(totalPoints);
  const level = getLevel(pts);
  const levelProgress = getLevelProgress(pts, level);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Recompensas
        </h1>
        <p className="text-muted-foreground mt-1">
          Ganhe pontos completando atividades de estudo
        </p>
      </motion.div>

      {/* Points card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        data-ocid="rewards.section"
      >
        <div
          data-ocid="rewards.points_card"
          className="rounded-2xl border border-border bg-card p-6 space-y-5"
        >
          {/* Level badge + points */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{level.emoji}</div>
              <div>
                <Badge
                  className={`text-sm font-semibold mb-1 ${level.bgClass} ${level.textClass} border-0`}
                >
                  Nível {level.name}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {level.max === Number.POSITIVE_INFINITY
                    ? "Nível máximo atingido!"
                    : `Faltam ${level.max + 1 - pts} pontos para ${nextLevel?.name}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              {pointsLoading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-5xl font-bold text-primary tabular-nums"
                >
                  {pts}
                </motion.div>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">pontos</p>
            </div>
          </div>

          {/* Progress bar */}
          {level.max !== Number.POSITIVE_INFINITY && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{level.min} pts</span>
                <span>{level.max + 1} pts</span>
              </div>
              <Progress
                value={levelProgress}
                className="h-2.5"
                aria-label={`Progresso para o nível ${nextLevel?.name}`}
              />
              <p className="text-xs text-center text-muted-foreground">
                {levelProgress}% até {nextLevel?.emoji} {nextLevel?.name}
              </p>
            </div>
          )}

          {/* All levels */}
          <div className="flex gap-2 pt-1 flex-wrap">
            {LEVELS.map((l) => (
              <div
                key={l.name}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  l.name === level.name
                    ? `${l.bgClass} ${l.textClass} border-transparent shadow-sm`
                    : "border-border text-muted-foreground"
                }`}
              >
                <span>{l.emoji}</span>
                <span>{l.name}</span>
                <span className="text-xs opacity-70">
                  {l.max === Number.POSITIVE_INFINITY
                    ? `${l.min}+`
                    : `${l.min}–${l.max}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How to earn points */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-foreground text-lg">
          Como ganhar pontos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POINTS_RULES.map((rule) => (
            <div
              key={rule.label}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
            >
              <div className="text-2xl flex-shrink-0">{rule.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {rule.label}
                </p>
              </div>
              <div className="flex-shrink-0 font-display text-lg font-bold text-primary">
                +{rule.points}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction history */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-lg">Histórico</h2>
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.length} evento{history.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {historyLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="rewards.history.empty_state"
            className="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-border bg-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              🏅
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Nenhuma atividade ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete sessões, tarefas ou envie PDFs para ganhar pontos
              </p>
            </div>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-96 pr-1">
            <div data-ocid="rewards.history.list" className="space-y-2">
              <AnimatePresence>
                {[...history]
                  .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                  .map((tx, index) => (
                    <motion.div
                      key={`${Number(tx.timestamp)}-${index}`}
                      data-ocid={`rewards.history.item.${index + 1}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                        {tx.eventType === "pomodoro"
                          ? "⏱️"
                          : tx.eventType === "tarefa"
                            ? "✅"
                            : "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm leading-snug">
                          {formatEventLabel(tx.eventType)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(tx.timestamp)}
                        </p>
                      </div>
                      <div className="font-display text-base font-bold text-primary flex-shrink-0">
                        {formatPoints(tx.points)}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </div>
  );
}
