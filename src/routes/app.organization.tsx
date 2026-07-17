import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orgDefaults } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/organization")({
  component: Organization,
});

const roles = ["Owner", "Admin", "Marketing", "HR", "Employee"];

function Organization() {
  const [org, setOrg] = useState(orgDefaults);

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Brand identity, defaults, and team roles applied across every signature."
        actions={<Button onClick={() => toast.success("Organization saved")}>Save changes</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardContent className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company name</Label>
                <Input className="mt-1.5" value={org.companyName} onChange={(e) => setOrg({ ...org, companyName: e.target.value })} />
              </div>
              <div>
                <Label>Website</Label>
                <Input className="mt-1.5" value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
              </div>
              <div>
                <Label>Contact email</Label>
                <Input className="mt-1.5" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input className="mt-1.5" value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
              </div>
              <div>
                <Label>Primary brand color</Label>
                <div className="mt-1.5 flex gap-2">
                  <input type="color" value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} className="h-9 w-14 rounded-md border" />
                  <Input value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Secondary color</Label>
                <div className="mt-1.5 flex gap-2">
                  <input type="color" value={org.secondaryColor} onChange={(e) => setOrg({ ...org, secondaryColor: e.target.value })} className="h-9 w-14 rounded-md border" />
                  <Input value={org.secondaryColor} onChange={(e) => setOrg({ ...org, secondaryColor: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Default font</Label>
                <Input className="mt-1.5" value={org.defaultFont} onChange={(e) => setOrg({ ...org, defaultFont: e.target.value })} />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input className="mt-1.5" value={org.timezone} onChange={(e) => setOrg({ ...org, timezone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Legal disclaimer</Label>
              <Textarea rows={4} className="mt-1.5" value={org.legal} onChange={(e) => setOrg({ ...org, legal: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="font-display text-lg font-semibold">Roles</div>
              <p className="mt-1 text-sm text-muted-foreground">Permission tiers available on this workspace.</p>
              <div className="mt-4 space-y-2">
                {roles.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">{r}</span>
                    <Badge variant="secondary">{r === "Owner" ? "1 seat" : "unlimited"}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => toast.info("Invite modal (mock)")}>
                Invite teammate
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="font-display text-lg font-semibold">Brand preview</div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md border" style={{ background: org.primaryColor }} />
                  <div>
                    <div className="text-sm font-medium">Primary</div>
                    <div className="text-xs text-muted-foreground">{org.primaryColor}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md border" style={{ background: org.secondaryColor }} />
                  <div>
                    <div className="text-sm font-medium">Secondary</div>
                    <div className="text-xs text-muted-foreground">{org.secondaryColor}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}