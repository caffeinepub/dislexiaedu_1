import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { FontFamily } from "../../backend.d";
import {
  DEFAULT_PROFILE,
  applyProfileToDOM,
  useSaveUserProfile,
  useUserProfile,
} from "../../hooks/useQueries";

const FONT_OPTIONS: {
  value: FontFamily;
  label: string;
  description: string;
}[] = [
  {
    value: FontFamily.sansSerif,
    label: "Sans-serif (Padrão)",
    description: "Fonte moderna e legível",
  },
  {
    value: FontFamily.arial,
    label: "Arial",
    description: "Clássica e amplamente suportada",
  },
  {
    value: FontFamily.verdana,
    label: "Verdana",
    description: "Espaçamento maior entre letras",
  },
  {
    value: FontFamily.openDyslexic,
    label: "OpenDyslexic",
    description: "Especialmente criada para dislexia",
  },
];

function profileToDisplay(p: UserProfile) {
  return {
    fontFamily: p.fontFamily,
    highContrast: p.highContrast,
    fontSize: Number(p.fontSize), // 14-24 (px)
    lineSpacing: Number(p.lineSpacing), // 120-250 (÷100 = 1.2–2.5)
    letterSpacing: Number(p.letterSpacing), // 0-40 (÷1000 = 0–0.04em)
  };
}

function displayToProfile(d: ReturnType<typeof profileToDisplay>): UserProfile {
  return {
    fontFamily: d.fontFamily,
    highContrast: d.highContrast,
    fontSize: BigInt(d.fontSize),
    lineSpacing: BigInt(d.lineSpacing),
    letterSpacing: BigInt(d.letterSpacing),
  };
}

export default function Settings() {
  const { data: savedProfile, isLoading } = useUserProfile();
  const saveProfile = useSaveUserProfile();

  const [form, setForm] = useState(() => profileToDisplay(DEFAULT_PROFILE));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedProfile) {
      const display = profileToDisplay(savedProfile);
      setForm(display);
      applyProfileToDOM(savedProfile);
    }
  }, [savedProfile]);

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Apply live
      applyProfileToDOM(displayToProfile(next));
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    const profile = displayToProfile(form);
    try {
      await saveProfile.mutateAsync(profile);
      toast.success("Configurações salvas com sucesso!");
      setIsDirty(false);
    } catch {
      toast.error("Erro ao salvar configurações. Tente novamente.");
    }
  };

  const handleReset = () => {
    const defaultDisplay = profileToDisplay(DEFAULT_PROFILE);
    setForm(defaultDisplay);
    applyProfileToDOM(DEFAULT_PROFILE);
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-16"
        data-ocid="settings.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const fontSizeDisplay = form.fontSize;
  const lineSpacingDisplay = (form.lineSpacing / 100).toFixed(1);
  const letterSpacingDisplay = (form.letterSpacing / 1000).toFixed(3);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Configurações de Acessibilidade
        </h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Personalize a aparência do app para tornar a leitura mais confortável.
          As alterações são aplicadas em tempo real.
        </p>
      </motion.div>

      {/* Preview area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Pré-visualização do texto
        </p>
        <p className="text-foreground leading-[var(--app-line-height)] tracking-[var(--app-letter-spacing)] text-[length:var(--app-font-size)]">
          A dislexia afeta a forma como o cérebro processa linguagem escrita.
          Com as configurações certas, a leitura fica muito mais confortável.
          Use este espaço para avaliar as alterações em tempo real.
        </p>
      </motion.div>

      {/* Font Family */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        data-ocid="settings.section"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          🔤 Família de fonte
        </h2>
        <div className="space-y-2">
          <Label className="text-base font-medium">Fonte selecionada</Label>
          <Select
            value={form.fontFamily}
            onValueChange={(v) => updateField("fontFamily", v as FontFamily)}
          >
            <SelectTrigger
              data-ocid="settings.select"
              className="rounded-xl text-base py-3 h-auto"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      — {opt.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            A fonte OpenDyslexic foi criada especialmente para facilitar a
            leitura de pessoas com dislexia.
          </p>
        </div>
      </motion.section>

      {/* Font Size */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        data-ocid="settings.section"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          📏 Tamanho da fonte
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Tamanho</Label>
            <span className="font-semibold text-primary text-lg">
              {fontSizeDisplay}px
            </span>
          </div>
          <Slider
            data-ocid="settings.input"
            min={14}
            max={24}
            step={1}
            value={[form.fontSize]}
            onValueChange={([v]) => updateField("fontSize", v)}
            className="w-full"
            aria-label="Tamanho da fonte"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>14px (menor)</span>
            <span>24px (maior)</span>
          </div>
        </div>
      </motion.section>

      {/* Letter Spacing */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        data-ocid="settings.section"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          ↔️ Espaçamento entre letras
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Espaçamento</Label>
            <span className="font-semibold text-primary text-lg">
              {letterSpacingDisplay}em
            </span>
          </div>
          <Slider
            data-ocid="settings.input"
            min={0}
            max={40}
            step={5}
            value={[form.letterSpacing]}
            onValueChange={([v]) => updateField("letterSpacing", v)}
            className="w-full"
            aria-label="Espaçamento entre letras"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (padrão)</span>
            <span>0.04em (ampliado)</span>
          </div>
        </div>
      </motion.section>

      {/* Line Spacing */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        data-ocid="settings.section"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          ↕️ Espaçamento entre linhas
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Altura da linha</Label>
            <span className="font-semibold text-primary text-lg">
              {lineSpacingDisplay}
            </span>
          </div>
          <Slider
            data-ocid="settings.input"
            min={120}
            max={250}
            step={10}
            value={[form.lineSpacing]}
            onValueChange={([v]) => updateField("lineSpacing", v)}
            className="w-full"
            aria-label="Espaçamento entre linhas"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1.2 (compacto)</span>
            <span>2.5 (espaçado)</span>
          </div>
        </div>
      </motion.section>

      {/* High Contrast */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
        className="rounded-2xl border border-border bg-card p-6"
        data-ocid="settings.section"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-foreground">
              🌓 Alto contraste
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Aumenta o contraste entre texto e fundo para melhorar a
              legibilidade.
            </p>
          </div>
          <Switch
            data-ocid="settings.switch"
            checked={form.highContrast}
            onCheckedChange={(v) => updateField("highContrast", v)}
            aria-label="Ativar alto contraste"
            className="scale-125"
          />
        </div>
      </motion.section>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
        className="flex gap-3 justify-between flex-wrap"
      >
        <Button
          data-ocid="settings.secondary_button"
          variant="outline"
          onClick={handleReset}
          className="rounded-xl"
        >
          Restaurar padrões
        </Button>
        <Button
          data-ocid="settings.save_button"
          onClick={handleSave}
          disabled={saveProfile.isPending || !isDirty}
          size="lg"
          className="font-semibold rounded-xl px-8"
        >
          {saveProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar configurações"
          )}
        </Button>
      </motion.div>

      {saveProfile.isError && (
        <div
          data-ocid="settings.error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm"
        >
          ⚠️ Ocorreu um erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      {saveProfile.isSuccess && !isDirty && (
        <div
          data-ocid="settings.success_state"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 text-sm"
        >
          ✅ Configurações salvas e aplicadas com sucesso!
        </div>
      )}
    </div>
  );
}
