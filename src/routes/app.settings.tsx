import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Personal, security, billing, and integration settings." />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-elegant"><CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div><Label>Full name</Label><Input className="mt-1.5" defaultValue="Ava Kirsch" /></div>
            <div><Label>Email</Label><Input className="mt-1.5" defaultValue="ava@acmestudio.com" /></div>
            <div><Label>Job title</Label><Input className="mt-1.5" defaultValue="CEO" /></div>
            <div><Label>Timezone</Label><Input className="mt-1.5" defaultValue="America/Los_Angeles" /></div>
            <div className="md:col-span-2"><Button onClick={() => toast.success("Profile saved")}>Save profile</Button></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
            <div><Label>Current password</Label><Input type="password" className="mt-1.5" /></div>
            <div><Label>New password</Label><Input type="password" className="mt-1.5" /></div>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div><div className="font-medium">Two-factor authentication</div><div className="text-sm text-muted-foreground">Extra security for sign-in.</div></div>
              <Switch defaultChecked />
            </div>
            <Button onClick={() => toast.success("Password updated")}>Update password</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-elegant"><CardContent className="space-y-3 p-6">
            {["Campaign updates", "New teammates joining", "Signature deploys", "Weekly analytics digest"].map((n) => (
              <div key={n} className="flex items-center justify-between rounded-md border p-4">
                <span className="text-sm">{n}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-elegant"><CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl font-semibold">Pro plan</div>
                <div className="text-sm text-muted-foreground">$4 / user / month · billed annually</div>
              </div>
              <Badge>Current</Badge>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-4"><div className="text-xs text-muted-foreground">Seats</div><div className="mt-1 font-display text-2xl">24 / 50</div></div>
              <div className="rounded-md border p-4"><div className="text-xs text-muted-foreground">Renews</div><div className="mt-1 font-display text-2xl">Mar 12, 2027</div></div>
              <div className="rounded-md border p-4"><div className="text-xs text-muted-foreground">Method</div><div className="mt-1 font-display text-2xl">Visa · 4242</div></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
            <div>
              <Label>Publishable key</Label>
              <Input readOnly className="mt-1.5 font-mono text-xs" value="sf_pub_••••••••••••8fa2" />
            </div>
            <div>
              <Label>Secret key</Label>
              <Input readOnly className="mt-1.5 font-mono text-xs" value="sf_sk_••••••••••••••••••••" />
            </div>
            <Button variant="outline" onClick={() => toast.success("Key rotated")}>Rotate secret</Button>
            <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground">
              REST API and webhooks are available under Settings → API Keys. Zapier and Make.com apps ship soon.
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}