"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

type AvatarUploaderProps = {
  initialUrl: string | null;
  name: string;
};

export function AvatarUploader({ initialUrl, name }: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { avatarUrl?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível atualizar a foto.");
      }

      setPreviewUrl(payload?.avatarUrl ?? null);
      toast.success("Foto de perfil atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a foto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 rounded-[28px] border border-border bg-primary/10">
        <AvatarImage src={previewUrl ?? undefined} alt={name} />
        <AvatarFallback className="rounded-[28px] bg-primary/12 text-lg font-semibold text-primary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
            event.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-[20px]"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          {loading ? "Enviando..." : "Trocar foto"}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP até 5MB.</p>
      </div>
    </div>
  );
}
