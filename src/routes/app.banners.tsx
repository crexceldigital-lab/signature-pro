import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Pencil, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/banners")({
  component: Banners,
});

interface Banner { id: string; name: string; image_url: string | null; target_url: string | null; created_at: string }

const emptyForm = { name: "", image_url: "", target_url: "" };

function Banners() {
  const { user } = useAuth();
  const orgId = user?.orgId ?? null;
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("id,name,image_url,target_url,created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Banner[]) ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ name: b.name, image_url: b.image_url ?? "", target_url: b.target_url ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!orgId) return toast.error("No organization on your profile yet.");
    if (!form.name.trim()) return toast.error("Give the banner a name.");
    if (!form.image_url) return toast.error("Upload a banner image.");
    setSaving(true);
    const payload = {
      org_id: orgId,
      name: form.name.trim(),
      image_url: form.image_url,
      target_url: form.target_url.trim() || null,
    };
    const res = editing
      ? await supabase.from("banners").update(payload).eq("id", editing.id)
      : await supabase.from("banners").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Banner updated" : "Banner created");
    setOpen(false);
    void load();
  };

  const remove = async (b: Banner) => {
    if (!window.confirm(`Delete banner “${b.name}”? Campaigns using it will keep running without an image.`)) return;
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Banner deleted");
    setRows((r) => r.filter((x) => x.id !== b.id));
  };

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Campaign artwork that appears beneath signatures. Recommended 520×120px."
        actions={<Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> New banner</Button>}
      />

      {loading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="grid h-48 place-items-center text-sm text-muted-foreground">
          No banners yet — create your first one to run signature campaigns.
        </CardContent></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id} className="hover-lift overflow-hidden shadow-elegant">
              <div className="grid h-36 place-items-center border-b bg-muted/40">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{b.name}</div>
                    {b.target_url && (
                      <a href={b.target_url} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {b.target_url}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => void remove(b)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1.5" placeholder="Q3 product launch" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <ImageUpload
              label="Banner image"
              folder="banners"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              hint="520×120px looks best across email clients."
            />
            <div><Label>Link</Label><Input className="mt-1.5" placeholder="https://…" value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
