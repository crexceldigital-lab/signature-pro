import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  folder?: string; // e.g. "logos" | "photos" | "banners"
  hint?: string;
}

const BUCKET = "brand-assets";
const MAX_MB = 2;

/**
 * Uploads to Supabase Storage (public `brand-assets` bucket).
 * If the bucket isn't available yet, falls back to an inline base64 data URL
 * so the builder keeps working — with a heads-up that hosted URLs are more
 * reliable across email clients.
 */
export function ImageUpload({ value, onChange, label, folder = "misc", hint }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Could not read file"));
      r.readAsDataURL(file);
    });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image must be under ${MAX_MB}MB`);
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success(`${label} uploaded`);
    } catch {
      // Storage bucket missing or offline — embed inline so nothing blocks.
      try {
        const dataUrl = await toBase64(file);
        onChange(dataUrl);
        toast.info(`${label} embedded inline. For best email-client support, run the storage migration to host images.`);
      } catch {
        toast.error("Upload failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/40"
          role="img"
          aria-label={`${label} preview`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {busy ? "Uploading…" : `Upload ${label.toLowerCase()}`}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")} aria-label={`Remove ${label}`}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Input
            placeholder="…or paste an image URL"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
