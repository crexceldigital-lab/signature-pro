import { renderSignature } from "@/lib/signature-templates";
import type { SignatureData, SignatureStyle } from "@/lib/signature";

export function SignaturePreview({ data, style }: { data: SignatureData; style: SignatureStyle }) {
  const html = renderSignature(data, style);
  return (
    <div className="rounded-lg border bg-white p-6 text-black shadow-elegant">
      <div className="mb-4 text-xs uppercase tracking-widest text-neutral-500">Email preview</div>
      <div className="mb-4 border-b pb-4">
        <div className="text-sm text-neutral-600">From: {data.firstName} {data.lastName} &lt;{data.email}&gt;</div>
        <div className="text-sm text-neutral-600">Subject: Following up</div>
      </div>
      <p className="mb-6 text-sm text-neutral-800">Hi there,</p>
      <p className="mb-6 text-sm text-neutral-800">
        Thanks for the great conversation earlier — sending over a quick recap and next steps below.
      </p>
      <p className="mb-8 text-sm text-neutral-800">Best,</p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
