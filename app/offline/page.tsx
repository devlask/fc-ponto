import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <WifiOff className="h-6 w-6" />
          </div>
          <CardTitle className="font-heading text-2xl text-foreground">Voce esta offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            O shell do aplicativo continua disponivel, mas alguns dados em tempo real dependem de conexao.
            Assim que a internet voltar, as sincronizacoes pendentes retomam automaticamente.
          </p>
          <Button asChild className="w-full rounded-2xl">
            <Link href="/employee">Voltar ao painel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
