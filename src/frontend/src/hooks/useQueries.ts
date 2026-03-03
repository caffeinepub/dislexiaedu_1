import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StudySession, UserProfile } from "../backend.d";
import { FontFamily } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Tips ────────────────────────────────────────────────────────────────────

const FALLBACK_TIPS = [
  "Leia em voz alta para melhorar a compreensão.",
  "Use marcadores coloridos para organizar suas anotações.",
  "Faça pausas regulares durante o estudo.",
  "Peça ao professor materiais antecipadamente.",
  "Use mapas mentais para organizar ideias.",
  "Grave áudios das aulas para ouvir depois.",
  "Divida textos longos em partes menores.",
  "Crie associações visuais com o conteúdo.",
];

export function useTips() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["tips"],
    queryFn: async () => {
      if (!actor) return FALLBACK_TIPS;
      const tips = await actor.getTips();
      return tips.length > 0 ? tips : FALLBACK_TIPS;
    },
    enabled: !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddTip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tip: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addTip(tip);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tips"] });
    },
  });
}

// ─── Glossary ─────────────────────────────────────────────────────────────────

const FALLBACK_GLOSSARY: Array<[string, string]> = [
  [
    "Abstrato",
    "Conceito que não pode ser visto ou tocado, representado mentalmente.",
  ],
  [
    "Metodologia",
    "Conjunto de métodos e técnicas usados em uma pesquisa ou trabalho.",
  ],
  ["Hipótese", "Suposição inicial que será testada ou investigada."],
  [
    "Referência bibliográfica",
    "Informação completa sobre um livro, artigo ou fonte consultada.",
  ],
  [
    "Epistemologia",
    "Ramo da filosofia que estuda a natureza e os limites do conhecimento.",
  ],
  [
    "Paradigma",
    "Modelo ou padrão aceito em uma área do conhecimento como referência.",
  ],
];

export function useGlossary() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, string]>>({
    queryKey: ["glossary"],
    queryFn: async () => {
      if (!actor) return FALLBACK_GLOSSARY;
      const terms = await actor.getGlossary();
      return terms.length > 0 ? terms : FALLBACK_GLOSSARY;
    },
    enabled: !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchGlossary() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (term: string) => {
      if (!actor) return null;
      return actor.searchGlossary(term);
    },
  });
}

export function useAddGlossaryTerm() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      term,
      definition,
    }: { term: string; definition: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addGlossaryTerm(term, definition);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["glossary"] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = {
  fontFamily: FontFamily.sansSerif,
  highContrast: false,
  fontSize: BigInt(16),
  lineSpacing: BigInt(160), // stored as 160 = 1.60
  letterSpacing: BigInt(20), // stored as 20 = 0.020em
};

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserProfile>({
    queryKey: ["userProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return DEFAULT_PROFILE;
      const profile = await actor.getCallerUserProfile();
      return profile ?? DEFAULT_PROFILE;
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !identity) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_data, profile) => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // Apply immediately to the dom
      applyProfileToDOM(profile);
    },
  });
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

export function useStudySessions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<StudySession[]>({
    queryKey: ["studySessions", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getStudySessions(identity.getPrincipal());
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLogStudySession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subject,
      duration,
    }: { subject: string; duration: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.logStudySession(subject, duration);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["studySessions"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── PDF Metadata ─────────────────────────────────────────────────────────────

export function useUserPdfs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["userPdfs", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserPdfs();
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddPdfMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      blobId,
      sizeBytes,
    }: { name: string; blobId: string; sizeBytes: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addPdfMetadata(name, blobId, sizeBytes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userPdfs"] });
    },
  });
}

export function useDeletePdfMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blobId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deletePdfMetadata(blobId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userPdfs"] });
    },
  });
}

// ─── Points ──────────────────────────────────────────────────────────────────

export function useUserPoints() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["userPoints", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      return actor.getUserPoints();
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 30,
  });
}

export function useAddPoints() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventType,
      points,
    }: { eventType: string; points: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addPoints(eventType, points);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userPoints"] });
      void queryClient.invalidateQueries({ queryKey: ["pointsHistory"] });
    },
  });
}

export function usePointsHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["pointsHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getPointsHistory();
    },
    enabled: !!identity && !isFetching,
    staleTime: 1000 * 30,
  });
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

export function applyProfileToDOM(profile: UserProfile) {
  const root = document.documentElement;

  const fontFamilyMap: Record<string, string> = {
    arial: '"Arial", sans-serif',
    sansSerif: '"Figtree", "Plus Jakarta Sans", system-ui, sans-serif',
    verdana: '"Verdana", "Geneva", sans-serif',
    openDyslexic: '"OpenDyslexic", "Arial", sans-serif',
  };

  const fontKey = profile.fontFamily as string;
  const fontFamily = fontFamilyMap[fontKey] ?? fontFamilyMap.sansSerif;
  const fontSize = Number(profile.fontSize);
  const lineSpacing = Number(profile.lineSpacing) / 100;
  const letterSpacing = Number(profile.letterSpacing) / 1000;

  root.style.setProperty("--app-font-family", fontFamily);
  root.style.setProperty("--app-font-size", `${fontSize}px`);
  root.style.setProperty("--app-line-height", String(lineSpacing));
  root.style.setProperty("--app-letter-spacing", `${letterSpacing}em`);

  if (profile.highContrast) {
    root.classList.add("high-contrast");
  } else {
    root.classList.remove("high-contrast");
  }
}
