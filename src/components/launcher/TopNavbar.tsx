import { useLauncher } from "@/context/LauncherProvider";
import { useT } from "@/context/LanguageProvider";
import { AuthZone } from "./AuthZone";

export function TopNavbar() {
  const { view, instances } = useLauncher();
  const { t } = useT();

  let title = t("homeTitle");
  if (view.kind === "library") title = t("library");
  else if (view.kind === "create") title = t("createTitle");
  else if (view.kind === "instance") {
    const inst = instances.find((i) => i.id === view.id);
    title = inst?.name ?? t("homeTitle");
  }

  return (
    <header className="glass-panel flex h-16 items-center justify-between rounded-2xl px-5">
      <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
      <AuthZone />
    </header>
  );
}
