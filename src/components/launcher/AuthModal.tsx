import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/context/LanguageProvider";
import { useLauncher } from "@/context/LauncherProvider";
import { cn } from "@/lib/utils";
import { Loader2, LogIn, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useT();
  const { setUser } = useLauncher();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [offlineName, setOfflineName] = useState("");

  const handleMicrosoftLogin = async () => {
    if (!window.electron) {
      toast.error("Electron bridge missing", {
        description: "Microsoft login is only available in the desktop app.",
      });
      return;
    }

    try {
      setIsAuthenticating(true);
      const userData = await window.electron.loginWithMicrosoft();
      setUser(userData);
      onOpenChange(false);
      toast.success(`${t("welcome")}, ${userData.nickname}!`);
    } catch (err: unknown) {
      console.error("Auth failed:", err);
      toast.error("Authentication failed", {
        description:
          err instanceof Error ? err.message : "An error occurred during Microsoft login.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleOfflineLogin = async () => {
    if (!offlineName.trim()) {
      toast.error("Username required");
      return;
    }
    if (!window.electron) return;

    try {
      setIsAuthenticating(true);
      const res = await window.electron.loginOffline(offlineName);
      if (res.success) {
        setUser(res.user);
        onOpenChange(false);
        toast.success(`${t("welcome")}, ${res.user.nickname}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Offline login failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong border-0 rounded-2xl max-w-md p-8">
        <DialogTitle className="sr-only">{t("login")}</DialogTitle>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-xl transition-all duration-500",
                isAuthenticating ? "bg-primary/40 animate-pulse" : "bg-primary/20",
              )}
            />
            <div className="relative flex size-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/30 shadow-inner">
              {isAuthenticating ? (
                <Loader2 className="size-10 animate-spin text-primary" />
              ) : (
                <LogIn className="size-10 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isAuthenticating ? t("waitingAuth") : t("loginTitle") || "Authentication"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {isAuthenticating
                ? "Please complete the login in your system browser."
                : "Sign in with your Microsoft account to play Minecraft."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              disabled={isAuthenticating}
              onClick={handleMicrosoftLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg className="size-4 fill-current" viewBox="0 0 23 23">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                  </svg>
                  <span>Login with Microsoft</span>
                </>
              )}
            </button>

            <div className="relative mt-2">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <span className="relative bg-card px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                or
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("enterNickname")}
                  value={offlineName}
                  onChange={(e) => setOfflineName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOfflineLogin()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                />
              </div>
              <button
                disabled={isAuthenticating || !offlineName.trim()}
                onClick={handleOfflineLogin}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all disabled:opacity-30"
              >
                {t("playOffline")}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
