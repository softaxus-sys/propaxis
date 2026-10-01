"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadCmsImage } from "@/modules/cms/actions";

/** A plain URL text field (still editable/pasteable directly) plus an upload button
 * that fills it — calling the server action directly rather than via a full form
 * submit, so uploading an image doesn't submit the rest of the CMS editor's fields. */
export function ImageUrlField({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadCmsImage(formData);

    setUploading(false);
    if (result.error) setError(result.error);
    else if (result.url) setValue(result.url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input name={name} type="url" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- external, user-uploaded image
        <img src={value} alt="" className="mt-2 h-20 w-auto rounded-lg object-cover" />
      )}
    </div>
  );
}
