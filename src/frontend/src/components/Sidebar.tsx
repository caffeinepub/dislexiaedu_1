import { AnimatePresence, motion } from "motion/react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: { id: Page; label: string; icon: string; public?: boolean }[] =
  [
    { id: "dashboard", label: "Início", icon: "🏠", public: true },
    { id: "timer", label: "Temporizador", icon: "⏱️", public: true },
    { id: "notes", label: "Notas", icon: "📝" },
    { id: "tasks", label: "Tarefas", icon: "✅" },
    { id: "glossary", label: "Glossário", icon: "📚", public: true },
    { id: "materials", label: "Materiais", icon: "📄" },
    { id: "rewards", label: "Recompensas", icon: "🏆" },
    { id: "settings", label: "Configurações", icon: "⚙️" },
  ];

export default function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  onToggle,
}: SidebarProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        className="fixed lg:relative lg:translate-x-0 z-30 w-64 min-h-screen bg-sidebar flex flex-col shadow-xl lg:shadow-none"
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-lg font-bold text-sidebar-primary-foreground">
              D
            </div>
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground text-base leading-tight">
                DislexiaEdu
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Aprendizado inclusivo
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="nav.toggle"
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" aria-label="Menu principal">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const requiresAuth = !item.public;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-200 text-base font-medium
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span>{item.label}</span>
                {requiresAuth && !isAuthenticated && (
                  <span className="ml-auto text-xs opacity-60">🔒</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Auth section */}
        <div className="p-4 border-t border-sidebar-border">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-sm font-bold">
                  {identity.getPrincipal().toString().slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {identity.getPrincipal().toString().slice(0, 16)}...
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="auth.button"
                onClick={clear}
                className="w-full px-4 py-2.5 rounded-xl border border-sidebar-border text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-ocid="auth.button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full px-4 py-3 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Entrar na conta
                </>
              )}
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
