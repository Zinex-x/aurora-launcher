import { LogIn } from "lucide-react";
import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";

export function AuthZone() {
  const { user, setUser, setAuthModalOpen } = useLauncher();
  const { t } = useT();

  if (!user) {
    return (
      <button
        onClick={() => setAuthModalOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/10"
      >
        <LogIn className="size-4" />
        {t("login")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 backdrop-blur-md">
      <img
        src={`https://mc-heads.net/avatar/${encodeURIComponent(user.nickname)}/40`}
        alt={user.nickname}
        width={32}
        height={32}
        className="size-8 rounded-lg"
        loading="lazy"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{user.nickname}</span>
        <button
          onClick={() => setUser(null)}
          className="text-[11px] text-muted-foreground hover:text-foreground text-left transition-colors"
        >
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
