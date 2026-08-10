import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/admin/orders-tab";
import { ProductsTab } from "@/components/admin/products-tab";
import { CombosTab } from "@/components/admin/combos-tab";
import { DestinationsTab } from "@/components/admin/destinations-tab";
import { SettingsTab } from "@/components/admin/settings-tab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración | JATLION Essence" },
      {
        name: "description",
        content: "Gestiona pedidos, productos, combos, destinos y configuración de la tienda.",
      },
      { property: "og:title", content: "Panel de administración | JATLION Essence" },
      {
        property: "og:description",
        content: "Gestión de pedidos, catálogo y combos de JATLION Essence.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-display text-3xl">Sin permisos de administrador</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta cuenta no tiene acceso al panel. Ingresa con la cuenta administradora.
        </p>
        <Button onClick={signOut} variant="outline" className="rounded-full">
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div>
            <p className="eyebrow">Panel</p>
            <Link to="/" className="font-display text-lg tracking-[0.2em]">
              JATLION
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Ver tienda</Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Tabs defaultValue="pedidos">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="pedidos">📋 Pedidos</TabsTrigger>
            <TabsTrigger value="productos">🛍️ Productos</TabsTrigger>
            <TabsTrigger value="combos">🎁 Combos</TabsTrigger>
            <TabsTrigger value="destinos">🚚 Destinos</TabsTrigger>
            <TabsTrigger value="config">⚙️ Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="pt-6">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="productos" className="pt-6">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="combos" className="pt-6">
            <CombosTab />
          </TabsContent>
          <TabsContent value="destinos" className="pt-6">
            <DestinationsTab />
          </TabsContent>
          <TabsContent value="config" className="pt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
