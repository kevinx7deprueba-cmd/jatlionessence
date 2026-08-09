import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Instagram, Facebook } from "lucide-react";

import { settingsQuery } from "@/lib/queries";
import { SUPPORT_MESSAGE, waLink } from "@/lib/store";

export function Footer() {
  const { data: settings } = useQuery(settingsQuery);
  const support = waLink(settings?.whatsapp ?? "", SUPPORT_MESSAGE);

  return (
    <footer className="mt-16 border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-[0.24em] text-gold">JATLION</p>
          <p className="mt-2 text-sm text-white/70">
            Perfumes, cuidado personal y productos seleccionados para realzar tu estilo.
          </p>
          {settings?.contact_info ? (
            <p className="mt-3 whitespace-pre-line text-sm text-white/70">{settings.contact_info}</p>
          ) : null}
        </div>
        <div className="text-sm">
          <p className="eyebrow text-white/50">Tienda</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/catalogo" className="text-white/80 hover:text-gold">
              Catálogo
            </Link>
            <Link to="/promociones" className="text-white/80 hover:text-gold">
              Promociones
            </Link>
            <Link to="/carrito" className="text-white/80 hover:text-gold">
              Carrito
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="eyebrow text-white/50">Contacto</p>
          <a
            href={support}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 font-medium text-ink"
          >
            <MessageCircle className="h-4 w-4" /> Soporte técnico
          </a>
          <div className="mt-4 flex gap-3">
            {settings?.instagram_url ? (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-white/70 hover:text-gold" />
              </a>
            ) : null}
            {settings?.facebook_url ? (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-white/70 hover:text-gold" />
              </a>
            ) : null}
            {settings?.tiktok_url ? (
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-gold"
              >
                TikTok
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} JATLION Essence · Bolivia ·{" "}
        <Link to="/auth" className="hover:text-gold">
          Administrar
        </Link>
      </div>
    </footer>
  );
}
