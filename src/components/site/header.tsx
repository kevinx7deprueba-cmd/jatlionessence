import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, ShoppingBag, MessageCircle } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/lib/cart";
import { settingsQuery } from "@/lib/queries";
import { SUPPORT_MESSAGE, waLink } from "@/lib/store";
import { useAssetUrl } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/combos", label: "Combos" },
  { to: "/promociones", label: "Promociones" },
] as const;

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const { data: settings } = useQuery(settingsQuery);
  const logo = useAssetUrl(settings?.logo_url);

  const support = waLink(settings?.whatsapp ?? "", SUPPORT_MESSAGE);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-ink text-ink-foreground">
            <nav className="mt-10 flex flex-col gap-1 px-4">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base tracking-wide hover:bg-white/10"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/carrito"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base tracking-wide hover:bg-white/10"
              >
                Carrito ({count})
              </Link>
              <a
                href={support}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-3 text-base tracking-wide text-gold hover:bg-white/10"
              >
                💬 Soporte
              </a>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex min-w-0 items-center gap-2">
          {logo ? (
            <img src={logo} alt="JATLION Essence" className="h-9 w-9 shrink-0 object-contain" />
          ) : null}
          <span className="min-w-0 truncate font-display text-lg tracking-[0.28em] text-gold">
            JATLION
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="mr-2 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm tracking-wide hover:bg-white/10"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ))}
            <a
              href={support}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2 text-sm tracking-wide hover:bg-white/10"
            >
              Soporte
            </a>
          </nav>
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="relative h-10 w-10 hover:bg-white/10"
          >
            <Link to="/carrito" aria-label="Ver carrito">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-semibold text-ink">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="h-10 w-10 hover:bg-white/10 md:hidden"
          >
            <a href={support} target="_blank" rel="noopener noreferrer" aria-label="Soporte por WhatsApp">
              <MessageCircle className="h-5 w-5 text-gold" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
