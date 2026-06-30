import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/context/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageProvider";
import { LauncherProvider } from "@/context/LauncherProvider";
import { LauncherShell } from "@/components/launcher/LauncherShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minecraft Launcher" },
      { name: "description", content: "Sleek glassmorphic Minecraft launcher with light/dark themes and RU/EN localization." },
      { property: "og:title", content: "Minecraft Launcher" },
      { property: "og:description", content: "Sleek glassmorphic Minecraft launcher with light/dark themes and RU/EN localization." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LauncherProvider>
          <LauncherShell />
        </LauncherProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
