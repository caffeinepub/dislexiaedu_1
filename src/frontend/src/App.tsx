import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import LoginPrompt from "./components/LoginPrompt";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/pages/Dashboard";
import Glossary from "./components/pages/Glossary";
import Materials from "./components/pages/Materials";
import Notes from "./components/pages/Notes";
import Rewards from "./components/pages/Rewards";
import Settings from "./components/pages/Settings";
import Tasks from "./components/pages/Tasks";
import Timer from "./components/pages/Timer";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { applyProfileToDOM, useUserProfile } from "./hooks/useQueries";

export type Page =
  | "dashboard"
  | "timer"
  | "notes"
  | "tasks"
  | "glossary"
  | "settings"
  | "materials"
  | "rewards";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile } = useUserProfile();

  // Apply saved profile to DOM when profile loads
  useEffect(() => {
    if (profile) {
      applyProfileToDOM(profile);
    }
  }, [profile]);

  if (isInitializing) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-lg">
            Carregando DislexiaEdu...
          </p>
        </div>
      </div>
    );
  }

  // Pages that require authentication
  const protectedPages: Page[] = [
    "notes",
    "tasks",
    "settings",
    "materials",
    "rewards",
  ];
  const isProtected = protectedPages.includes(currentPage);

  const renderPage = () => {
    if (isProtected && !identity) {
      return <LoginPrompt onGoBack={() => setCurrentPage("dashboard")} />;
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "timer":
        return <Timer />;
      case "notes":
        return <Notes />;
      case "tasks":
        return <Tasks />;
      case "glossary":
        return <Glossary />;
      case "settings":
        return <Settings />;
      case "materials":
        return <Materials />;
      case "rewards":
        return <Rewards />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "0" : "0" }}
      >
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <button
            type="button"
            data-ocid="nav.toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-md text-foreground hover:bg-accent transition-colors"
            aria-label="Abrir menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-display font-bold text-lg text-foreground">
            DislexiaEdu
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">{renderPage()}</div>

        <footer className="px-6 py-4 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Feito com ❤️ usando caffeine.ai
          </a>
        </footer>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}
