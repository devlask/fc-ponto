"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      toast.error("Não foi possível encerrar a sessão.");
      return;
    }

    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button type="button" variant="secondary" className="rounded-[20px]" onClick={handleSignOut} disabled={loading}>
      <LogOut className="h-4 w-4" />
      {loading ? "Saindo..." : "Sair"}
    </Button>
  );
}
