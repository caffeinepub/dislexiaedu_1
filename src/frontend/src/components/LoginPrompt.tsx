import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginPromptProps {
  onGoBack: () => void;
}

export default function LoginPrompt({ onGoBack }: LoginPromptProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      data-ocid="auth.modal"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl mx-auto">
          🔐
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Acesso necessário
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Esta área requer que você esteja conectado para acessar seus dados
            pessoais.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            data-ocid="auth.confirm_button"
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="font-semibold"
          >
            {isLoggingIn ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              "Entrar na conta"
            )}
          </Button>
          <Button
            data-ocid="auth.cancel_button"
            variant="outline"
            size="lg"
            onClick={onGoBack}
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
