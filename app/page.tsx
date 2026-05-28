import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Clock3, MapPinned, Radio, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardCards, realtimeHighlights } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="studio-backdrop relative overflow-hidden">
      <section className="border-b border-border/70">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/18 text-primary ring-1 ring-primary/30">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-tight">FC Ponto</p>
                <p className="text-sm text-muted-foreground">
                  Ponto digital com energia de estudio criativo.
                </p>
              </div>
            </div>
            <Badge className="hidden border border-primary/20 bg-primary/12 text-primary sm:inline-flex">
              PWA instalavel
            </Badge>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                Criado para comunicacao visual
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                  Controle de ponto com identidade de grafica moderna.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Registre entrada, pausa, retorno, saida e hora extra com selfie ao vivo, geofencing,
                  trilha imutavel de auditoria e dashboard administrativo em tempo real, sem visual frio ou tecnico.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-13 rounded-[20px] px-6 text-base">
                  <Link href="/auth/login">
                    Entrar no sistema
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="h-13 rounded-[20px] px-6 text-base"
                >
                  <Link href="/employee">Ver experiencia do funcionario</Link>
                </Button>
              </div>

              <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Camera, label: "Selfie obrigatoria" },
                  { icon: MapPinned, label: "GPS automatico" },
                  { icon: Radio, label: "Realtime nativo" },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="ink-chip rounded-[24px] border border-border px-4 py-4"
                  >
                    <feature.icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-sm text-foreground">{feature.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[32px] border border-border p-5 backdrop-blur-xl">
              <div className="grid gap-4">
                <div className="rounded-[28px] border border-border bg-white/55 p-5 dark:bg-white/6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Painel vivo</p>
                      <h2 className="font-heading text-2xl font-semibold text-foreground">Operacao do dia</h2>
                    </div>
                    <Badge className="border-emerald-400/20 bg-emerald-400/12 text-emerald-700 dark:text-emerald-300">
                      sincronizado
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboardCards.map((card, index) => (
                      <Card
                        key={card.label}
                        className={
                          index % 3 === 0
                            ? "border-primary/15 bg-primary/8"
                            : index % 3 === 1
                              ? "border-secondary/15 bg-secondary/8"
                              : "border-accent/20 bg-accent/15"
                        }
                      >
                        <CardHeader className="pb-2">
                          <p className="text-sm text-muted-foreground">{card.label}</p>
                          <CardTitle className="font-heading text-3xl text-foreground">{card.value}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {realtimeHighlights.map((item, index) => (
                    <div
                      key={item.title}
                      className={
                        index === 0
                          ? "rounded-[24px] border border-primary/15 bg-primary/8 p-4"
                          : index === 1
                            ? "rounded-[24px] border border-secondary/15 bg-secondary/8 p-4"
                            : "rounded-[24px] border border-accent/20 bg-accent/15 p-4"
                      }
                    >
                      <p className="mb-2 text-sm text-muted-foreground">{item.title}</p>
                      <p className="font-heading text-xl font-semibold text-foreground">{item.value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-2xl font-semibold text-foreground">Arquitetura pronta para escalar</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            "Roles com Supabase Auth, RLS e trilha de auditoria imutavel.",
            "Jornadas configuraveis por dia da semana com hora extra automatica.",
            "PWA com offline parcial, cache do shell e UX mobile premium.",
          ].map((item) => (
            <Card key={item} className="ink-chip border-border">
              <CardContent className="flex items-start gap-3 p-6">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
