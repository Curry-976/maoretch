import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Renders a discreet "Installer l'app" pill whenever the browser tells us the
 * PWA can be installed. Hidden on iOS (Safari doesn't fire the event but the
 * user can still use Share → Add to Home Screen).
 */
export function InstallButton({ className = "" }: { className?: string }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !event) return null;

  const handleClick = async () => {
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === "accepted") setEvent(null);
    } catch {
      /* user dismissed */
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-medium text-ink-foreground/70 hover:text-ink-foreground border border-ink-foreground/15 hover:border-ink-foreground/30 transition-all ${className}`}
    >
      <Download className="w-3 h-3" strokeWidth={1.8} />
      Installer
    </button>
  );
}
