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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAddGlossaryTerm,
  useGlossary,
  useSearchGlossary,
} from "../../hooks/useQueries";
import { useIsAdmin } from "../../hooks/useQueries";

export default function Glossary() {
  const [searchInput, setSearchInput] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");

  const { identity } = useInternetIdentity();
  const { data: allTerms = [], isLoading: glossaryLoading } = useGlossary();
  const { data: isAdmin = false } = useIsAdmin();
  const searchGlossary = useSearchGlossary();
  const addTerm = useAddGlossaryTerm();

  const searchResult = searchGlossary.data;
  const hasSearch = searchInput.trim().length > 0 && searchGlossary.isSuccess;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    searchGlossary.mutate(q);
  };

  const handleAddTerm = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      toast.error("Preencha o termo e a definição");
      return;
    }
    try {
      await addTerm.mutateAsync({
        term: newTerm.trim(),
        definition: newDefinition.trim(),
      });
      toast.success("Termo adicionado com sucesso!");
      setNewTerm("");
      setNewDefinition("");
      setAddModalOpen(false);
    } catch {
      toast.error("Erro ao adicionar termo");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
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
            Glossário Acadêmico
          </h1>
          <p className="text-muted-foreground mt-1">
            Definições de termos usados na vida universitária
          </p>
        </div>
        {identity && isAdmin && (
          <Button
            data-ocid="glossary.open_modal_button"
            onClick={() => setAddModalOpen(true)}
            size="lg"
            className="font-semibold rounded-xl"
          >
            + Adicionar termo
          </Button>
        )}
      </motion.div>

      {/* Search */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        onSubmit={handleSearch}
        className="flex gap-3"
      >
        <Input
          data-ocid="glossary.search_input"
          placeholder="Buscar um termo acadêmico..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (!e.target.value.trim()) searchGlossary.reset();
          }}
          className="flex-1 text-base py-3 px-4 h-auto rounded-xl"
          aria-label="Buscar termo"
        />
        <Button
          data-ocid="glossary.submit_button"
          type="submit"
          disabled={searchGlossary.isPending || !searchInput.trim()}
          size="lg"
          className="rounded-xl font-semibold px-6"
        >
          {searchGlossary.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
        {hasSearch && (
          <Button
            data-ocid="glossary.cancel_button"
            type="button"
            variant="outline"
            size="lg"
            className="rounded-xl"
            onClick={() => {
              setSearchInput("");
              searchGlossary.reset();
            }}
          >
            ✕
          </Button>
        )}
      </motion.form>

      {/* Search result or full list */}
      <div>
        {hasSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            {searchResult ? (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                      Resultado encontrado
                    </p>
                    <h3 className="font-display font-bold text-xl text-foreground">
                      {searchInput}
                    </h3>
                    <p className="text-foreground mt-2 leading-relaxed">
                      {searchResult}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                data-ocid="glossary.empty_state"
                className="rounded-2xl border border-border bg-card p-8 text-center"
              >
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-foreground">
                  Nenhum resultado para "{searchInput}"
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Tente outro termo ou navegue pela lista completa abaixo
                </p>
              </div>
            )}
          </motion.div>
        )}

        {glossaryLoading ? (
          <div className="space-y-3" data-ocid="glossary.loading_state">
            {["a", "b", "c", "d", "e", "f"].map((id) => (
              <div
                key={id}
                className="rounded-2xl border border-border p-5 space-y-2"
              >
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !hasSearch && allTerms.length === 0 ? (
          <div
            data-ocid="glossary.empty_state"
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              📚
            </div>
            <p className="font-semibold text-foreground text-lg">
              Glossário vazio
            </p>
            {isAdmin && (
              <Button
                onClick={() => setAddModalOpen(true)}
                className="rounded-xl"
              >
                Adicionar primeiro termo
              </Button>
            )}
          </div>
        ) : (
          <>
            {!hasSearch && (
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                {allTerms.length} termo{allTerms.length !== 1 ? "s" : ""} no
                glossário
              </h2>
            )}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-ocid="glossary.list"
            >
              <AnimatePresence>
                {allTerms.map(([term, definition], index) => (
                  <motion.div
                    key={term}
                    variants={itemVariants}
                    data-ocid={`glossary.item.${index + 1}`}
                    className="rounded-2xl border border-border bg-card p-5 hover:shadow-card hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 flex-shrink-0">
                        {["📖", "📝", "💡", "🔬", "📐", "🌍"][index % 6]}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-foreground text-base">
                          {term}
                        </h3>
                        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                          {definition}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      {/* Add Term Modal (admin only) */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent data-ocid="glossary.modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Adicionar termo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gl-term" className="text-base font-medium">
                Termo *
              </Label>
              <Input
                id="gl-term"
                data-ocid="glossary.input"
                placeholder="Ex: Epistemologia"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="text-base py-3 px-4 h-auto rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gl-def" className="text-base font-medium">
                Definição *
              </Label>
              <Textarea
                id="gl-def"
                data-ocid="glossary.textarea"
                placeholder="Explicação clara e objetiva do termo..."
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                className="text-base rounded-xl"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="glossary.cancel_button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              data-ocid="glossary.save_button"
              onClick={handleAddTerm}
              disabled={addTerm.isPending}
              className="rounded-xl font-semibold"
            >
              {addTerm.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
