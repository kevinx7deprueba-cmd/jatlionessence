import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrador | JATLION Essence" },
      {
        name: "description",
        content: "Inicia sesión para administrar los productos y pedidos de JATLION Essence.",
      },
      { property: "og:title", content: "Acceso administrador | JATLION Essence" },
      { property: "og:description", content: "Panel privado de JATLION Essence." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Correo o contraseña incorrectos");
      return;
    }
    navigate({ to: "/admin" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/admin" });
    } else {
      toast.success("Revisa tu correo para confirmar la cuenta.");
    }
  };

  return (
    <div className="surface-hero flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-8 shadow-lift">
        <Link to="/" className="eyebrow block text-center">
          JATLION Essence
        </Link>
        <h1 className="mt-3 text-center font-display text-3xl">Panel de administración</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          La primera cuenta creada se convierte en administradora.
        </p>

        <Tabs defaultValue="login" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Ingresar</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={signIn} className="space-y-4 pt-4">
              <Field
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
              />
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4 pt-4">
              <Field
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
              />
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Creando…" : "Crear cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-muted-foreground underline underline-offset-4"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

function Field({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          required
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
