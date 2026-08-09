import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Header } from "./header";
import { Footer } from "./footer";
import { settingsQuery } from "@/lib/queries";
import { SUPPORT_MESSAGE, waLink } from "@/lib/store";

export function StoreLayout({ children }: { children: ReactNode }) {
  const { data: settings } = useQuery(settingsQuery);
  const support = waLink(settings?.whatsapp ?? "", SUPPORT_MESSAGE);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <a
        href={support}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Soporte por WhatsApp"
        className="fixed bottom-5 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-gold text-ink shadow-lift"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
