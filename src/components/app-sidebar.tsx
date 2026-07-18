import { Link, useRouterState } from "@tanstack/react-router";
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
  Bell,
  Settings,
  ShieldCheck,
  Sparkles,
  Plug,
  Wand2,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

const workspace = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "AI Designer", url: "/app/ai-designer", icon: Wand2 },
  { title: "Signature Builder", url: "/app/builder", icon: PenTool },
  { title: "Templates", url: "/app/templates", icon: LayoutTemplate },
  { title: "Employees", url: "/app/employees", icon: Users },
  { title: "Organization", url: "/app/organization", icon: Building2 },
  { title: "Integrations", url: "/app/integrations", icon: Plug },
  { title: "Agent Access", url: "/app/agents", icon: Bot },
];

const marketing = [
  { title: "Campaigns", url: "/app/campaigns", icon: Megaphone },
  { title: "Banners", url: "/app/banners", icon: ImageIcon },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const support = [
  { title: "Install Guides", url: "/app/installation", icon: BookOpen },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Admin Panel", url: "/app/admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const isActive = (u: string) => path === u || path.startsWith(u + "/");

  const section = (label: string, items: typeof workspace) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} className="gap-2">
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/app/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold">SignatureFlow</span>
            <span className="text-[11px] text-muted-foreground">{user?.org ?? "Workspace"}</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {section("Workspace", workspace)}
        {section("Marketing", marketing)}
        {section("System", support)}
      </SidebarContent>
      <SidebarFooter className="border-t p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg border bg-brand/10 p-3">
          <div className="mb-1 font-semibold text-foreground">Pro plan</div>
          <div>Unlimited signatures, banners, and analytics.</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}