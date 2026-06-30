import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/context/LanguageProvider";
import { useLauncher } from "@/context/LauncherProvider";
import { Loader2 } from "lucide-react";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useT();
  const { setUser } = useLauncher();

  const testLogin = () => {
    setUser({ nickname: "Steve" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong border-0 rounded-2xl max-w-md p-8">
        <DialogTitle className="sr-only">{t("login")}</DialogTitle>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
            <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/15 border border-primary/40">
              <Loader2 className="size-9 animate-spin text-primary" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{t("waitingAuth")}</div>
          </div>
          <button
            onClick={testLogin}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            {t("testLogin")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
