import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAddPoints,
  useLogStudySession,
  useStudySessions,
} from "../../hooks/useQueries";

type TimerMode = "focus" | "break";

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Polar to cartesian for SVG
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [sessionsToday, setSessionsToday] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const { identity } = useInternetIdentity();
  const { data: sessions = [] } = useStudySessions();
  const logSession = useLogStudySession();
  const addPoints = useAddPoints();

  const totalDuration = mode === "focus" ? FOCUS_DURATION : BREAK_DURATION;
  const progress = (totalDuration - timeLeft) / totalDuration;
  const angle = progress * 360;

  // Count today's sessions
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const count = sessions.filter((s) => {
      const dateMs = Number(s.date) / 1_000_000;
      return dateMs >= todayMs;
    }).length;
    setSessionsToday(count);
  }, [sessions]);

  const handleSessionComplete = useCallback(async () => {
    setRunning(false);
    if (mode === "focus" && identity) {
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      try {
        await logSession.mutateAsync({
          subject: subject || "Estudo geral",
          duration: BigInt(durationMinutes),
        });
        toast.success(`Sessão de ${durationMinutes} min registrada! 🎉`);
        setSessionsToday((v) => v + 1);
        // Award Pomodoro points
        try {
          await addPoints.mutateAsync({
            eventType: "pomodoro",
            points: BigInt(10),
          });
        } catch {
          // Points failure is non-critical
        }
      } catch {
        toast.error("Erro ao registrar sessão");
      }
    }
    if (mode === "focus") {
      toast.success("Hora do intervalo! 🌿", {
        description: "Você merece descansar.",
      });
    } else {
      toast.success("Intervalo terminado!", {
        description: "Pronto para continuar?",
      });
    }
  }, [mode, elapsedSeconds, subject, identity, logSession, addPoints]);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          setElapsedSeconds((e) => e + 1);
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            void handleSessionComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, handleSessionComplete]);

  const handleStart = () => {
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setElapsedSeconds(0);
    setTimeLeft(mode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
  };

  const handleNext = () => {
    setRunning(false);
    setElapsedSeconds(0);
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    setTimeLeft(nextMode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
  };

  const cx = 120;
  const cy = 120;
  const r = 100;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Temporizador
        </h1>
        <p className="text-muted-foreground mt-1">
          Técnica Pomodoro para estudo focado
        </p>
      </motion.div>

      {/* Mode tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex gap-2 p-1 bg-muted rounded-xl w-fit"
      >
        <button
          type="button"
          data-ocid="timer.focus.tab"
          onClick={() => {
            setMode("focus");
            handleReset();
          }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === "focus"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎯 Foco (25 min)
        </button>
        <button
          type="button"
          data-ocid="timer.break.tab"
          onClick={() => {
            setMode("break");
            handleReset();
          }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === "break"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🌿 Pausa (5 min)
        </button>
      </motion.div>

      {/* Subject input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
        className="space-y-2"
      >
        <Label htmlFor="subject" className="text-base font-medium">
          Matéria ou tópico estudado
        </Label>
        <Input
          id="subject"
          data-ocid="timer.subject.input"
          placeholder="Ex: Cálculo, Português, Algoritmos..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-base py-3 px-4 h-auto rounded-xl"
        />
      </motion.div>

      {/* Timer circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: { delay: 0.2, duration: 0.5 },
        }}
        className="flex justify-center"
      >
        <div className="relative">
          <svg
            width="240"
            height="240"
            viewBox="0 0 240 240"
            className="drop-shadow-lg"
            aria-hidden="true"
          >
            {/* Background track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="oklch(var(--border))"
              strokeWidth="10"
            />
            {/* Progress arc */}
            {progress > 0 && progress < 1 && (
              <path
                d={describeArc(cx, cy, r, 0, angle)}
                fill="none"
                stroke={
                  mode === "focus"
                    ? "oklch(var(--primary))"
                    : "oklch(0.65 0.12 155)"
                }
                strokeWidth="10"
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}
            {progress >= 1 && (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={
                  mode === "focus"
                    ? "oklch(var(--primary))"
                    : "oklch(0.65 0.12 155)"
                }
                strokeWidth="10"
              />
            )}
            {/* Center background */}
            <circle cx={cx} cy={cy} r="85" fill="oklch(var(--card))" />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={Math.floor(timeLeft / 60)}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="font-display text-5xl font-bold text-foreground tabular-nums"
              >
                {formatTime(timeLeft)}
              </motion.div>
            </AnimatePresence>
            <div
              className={`text-sm font-medium mt-1 ${mode === "focus" ? "text-primary" : "text-emerald-600"}`}
            >
              {mode === "focus" ? "🎯 Focando" : "🌿 Intervalo"}
            </div>
            {running && (
              <div className="mt-2 w-2 h-2 rounded-full bg-primary animate-pulse-ring" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        className="flex items-center justify-center gap-3 flex-wrap"
      >
        {!running ? (
          <Button
            data-ocid="timer.start.button"
            onClick={handleStart}
            disabled={timeLeft === 0}
            size="lg"
            className="px-8 font-semibold text-base rounded-xl"
          >
            ▶ Iniciar
          </Button>
        ) : (
          <Button
            data-ocid="timer.pause.button"
            onClick={handlePause}
            size="lg"
            variant="secondary"
            className="px-8 font-semibold text-base rounded-xl"
          >
            ⏸ Pausar
          </Button>
        )}
        <Button
          data-ocid="timer.reset.button"
          onClick={handleReset}
          size="lg"
          variant="outline"
          className="px-6 font-semibold text-base rounded-xl"
        >
          ↺ Resetar
        </Button>
        <Button
          data-ocid="timer.next.button"
          onClick={handleNext}
          size="lg"
          variant="outline"
          className="px-6 font-semibold text-base rounded-xl"
        >
          ⏭ Próximo
        </Button>
      </motion.div>

      {/* Session info */}
      {identity && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Sessões hoje</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sessionsToday === 0
                  ? "Nenhuma sessão registrada ainda"
                  : `${sessionsToday} sessão${sessionsToday > 1 ? "ões" : ""} concluída${sessionsToday > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="text-4xl font-display font-bold text-primary">
              {sessionsToday}
            </div>
          </div>
          {!identity && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Entre na conta para salvar suas sessões automaticamente.
            </p>
          )}
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
        className="rounded-2xl border border-border bg-secondary/40 p-5"
      >
        <h3 className="font-semibold text-foreground mb-3">
          💡 Dicas para o Pomodoro
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Mantenha a mesa organizada antes de começar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Desligue notificações durante o tempo de foco</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Durante a pausa, mova-se: levante, alongue-se</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Após 4 ciclos, faça uma pausa longa de 20-30 min</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
