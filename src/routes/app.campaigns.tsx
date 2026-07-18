import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Play, Pause, Copy, XCircle, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/campaigns")({
  component: Campaigns,
});

interface Campaign {
  id: string; name: string; status: string; audience: string | null;
  starts_at: string | null; ends_at: string | null;
  views: number; clicks: number; banner_id: string | null;
}
interface BannerOpt { id: string; name: string }

const statusStyle: Record<string, string> = {
  active: "bg-brand text-brand-foreground",
  scheduled: "bg-secondary",
  paused: "bg-muted",
  ended: "bg-destructive/10 text-destructive",
};

const emptyForm = { name: "", audience: "", banner_id: "", starts_at: "", ends_at: "" };

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—");

function Campaigns() {
  const { user } = useAuth();
  const orgId = user?.orgId ?? null;
  const [rows, setRows] = useState<Campaign[]>([]);
  const [banners, setBanners] = useState<BannerOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [c, b] = await Promise.all([
      supabase.from("campaigns").select("id,name,status,audience,starts_at,ends_at,views,clicks,banner_id").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("banners").select("id,name").eq("org_id", orgId).order("name"),
    ]);
    if (c.error) toast.error(c.error.message);
    setRows((c.data as Campaign[]) ?? []);
    setBanners((b.data as BannerOpt[]) ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  const bannerName = useMemo(() => Object.fromEntries(banners.map((b) => [b.id, b.name])), [banners]);

  const create = async () => {
    if (!orgId) return toast.error("No organization on your profile yet.");
    if (!form.name.trim()) return toast.error("Name the campaign.");
    setSaving(true);
    const starts = form.starts_at ? new Date(form.starts_at) : null;
    const status = starts && starts.getTime() > Date.now() ? "scheduled" : "active";
    const { error } = await supabase.from("campaigns").insert({
      org_id: orgId,
      name: form.name.trim(),
      audience: form.audience.trim() || "All employees",
      banner_id: form.banner_id || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      status,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Campaign created (${status})`);
    setOpen(false);
    setForm(emptyForm);
    void load();
  };

  const setStatus = async (c: Campaign, status: string) => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", c.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, status } : x)));
    toast.success(status === "active" ? "Campaign resumed" : status === "paused" ? "Campaign paused" : "Campaign ended");
  };

  const duplicate = async (c: Campaign) => {
    if (!orgId) return;
    const { error } = await supabase.from("campaigns").insert({
      org_id: orgId, name: `${c.name} (copy)`, audience: c.audience,
      banner_id: c.banner_id, starts_at: null, ends_at: null, status: "scheduled",
    });
    if (error) return toast.error(error.message);
    toast.success("Campaign duplicated as scheduled");
    void load();
  };

  const remove = async (c: Campaign) => {
    if (!window.confirm(`Delete campaign “${c.name}”? Analytics for it will be lost.`)) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== c.id));
    toast.success("Campaign deleted");
  };

  return (
    <div>
      <PageHeader
        title="Banner campaigns"
        description="Marketing-owned campaigns that appear inside every signature."
        actions={<Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New campaign</Button>}
      />

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                No campaigns yet. {banners.length === 0 ? <>Create a <Link to="/app/banners" className="text-brand underline-offset-4 hover:underline">banner</Link> first, then launch one.</> : "Launch your first one."}
              </TableCell></TableRow>
            ) : (
              rows.map((c) => {
                const ctr = c.views ? ((c.clicks / c.views) * 100).toFixed(2) : "0.00";
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.banner_id ? bannerName[c.banner_id] ?? "Banner removed" : "No banner"}</div>
                    </TableCell>
                    <TableCell><Badge className={statusStyle[c.status] ?? "bg-secondary"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm">{c.audience ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.starts_at)} → {fmtDate(c.ends_at)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{c.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{c.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{ctr}%</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {c.status === "active" ? (
                        <Button size="icon" variant="ghost" onClick={() => void setStatus(c, "paused")} aria-label="Pause"><Pause className="h-4 w-4" /></Button>
                      ) : c.status !== "ended" ? (
                        <Button size="icon" variant="ghost" onClick={() => void setStatus(c, "active")} aria-label="Resume"><Play className="h-4 w-4" /></Button>
                      ) : null}
                      <Button size="icon" variant="ghost" onClick={() => void duplicate(c)} aria-label="Duplicate"><Copy className="h-4 w-4" /></Button>
                      {c.status !== "ended" && (
                        <Button size="icon" variant="ghost" onClick={() => void setStatus(c, "ended")} aria-label="End"><XCircle className="h-4 w-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => void remove(c)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1.5" placeholder="Q3 product launch" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Audience</Label><Input className="mt-1.5" placeholder="All employees / Sales / East Africa…" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} /></div>
            <div>
              <Label>Banner</Label>
              <Select value={form.banner_id || "none"} onValueChange={(v) => setForm({ ...form, banner_id: v === "none" ? "" : v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No banner yet</SelectItem>
                  {banners.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {banners.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No banners yet — <Link to="/app/banners" className="text-brand underline-offset-4 hover:underline">create one</Link> to attach artwork.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts</Label><Input className="mt-1.5" type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Ends</Label><Input className="mt-1.5" type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Launch campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
