import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  PenTool,
  LayoutTemplate,
  Users,
  Building2,
  Megaphone,
  Image as ImageIcon,
  BarChart3,
  BookOpen,
  Settings,
  Sparkles,
  Plug,
  ShieldCheck,
} from "lucide-react";

const items: { title: string; to: string; icon: React.ComponentType<{ className?: string }>; hint?: string }[] = [
  { title: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard, hint: "Overview" },
  { title: "AI Signature Designer", to: "/app/ai-designer", icon: Sparkles, hint: "Generate a signature" },
  { title: "Signature Builder", to: "/app/builder", icon: PenTool },
  { title: "Templates", to: "/app/templates", icon: LayoutTemplate },
  { title: "Employees", to: "/app/employees", icon: Users },
  { title: "Organization", to: "/app/organization", icon: Building2 },
  { title: "Campaigns", to: "/app/campaigns", icon: Megaphone },
  { title: "Banners", to: "/app/banners", icon: ImageIcon },
  { title: "Analytics", to: "/app/analytics", icon: BarChart3 },
  { title: "Integrations", to: "/app/integrations", icon: Plug, hint: "Microsoft · Google" },
  { title: "Install Guides", to: "/app/installation", icon: BookOpen },
  { title: "Settings", to: "/app/settings", icon: Settings },
  { title: "Admin Panel", to: "/app/admin", icon: ShieldCheck },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((it) => (
            <CommandItem key={it.to} onSelect={() => go(it.to)} className="gap-2">
              <it.icon className="h-4 w-4" />
              <span>{it.title}</span>
              {it.hint && <span className="ml-auto text-xs text-muted-foreground">{it.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/app/builder")} className="gap-2">
            <PenTool className="h-4 w-4" /> New signature
          </CommandItem>
          <CommandItem onSelect={() => go("/app/employees")} className="gap-2">
            <Users className="h-4 w-4" /> Invite employees
          </CommandItem>
          <CommandItem onSelect={() => go("/app/campaigns")} className="gap-2">
            <Megaphone className="h-4 w-4" /> Launch campaign
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}