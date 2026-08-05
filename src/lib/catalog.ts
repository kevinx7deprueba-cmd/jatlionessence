export type CategorySlug =
  | "fragancias-hombre"
  | "fragancias-mujer"
  | "cuerpo-y-bano"
  | "rostro"
  | "nutricion-y-bienestar"
  | "cabello"
  | "accesorios";

export const CATEGORIES: { slug: CategorySlug; label: string; blurb: string }[] = [
  {
    slug: "fragancias-hombre",
    label: "Fragancias Hombre",
    blurb: "Notas amaderadas, cítricas y orientales",
  },
  {
    slug: "fragancias-mujer",
    label: "Fragancias Mujer",
    blurb: "Florales, dulces y envolventes",
  },
  { slug: "cuerpo-y-bano", label: "Cuerpo y Baño", blurb: "Cremas, geles y exfoliantes" },
  { slug: "rostro", label: "Rostro", blurb: "Limpieza, hidratación y tratamiento" },
  {
    slug: "nutricion-y-bienestar",
    label: "Nutrición y Bienestar",
    blurb: "Suplementos y bebidas funcionales",
  },
  { slug: "cabello", label: "Cabello", blurb: "Shampoo, tratamientos y styling" },
  { slug: "accesorios", label: "Accesorios", blurb: "Estuches, neceseres y complementos" },
];

export const categoryLabel = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export const formatPrice = (value: number) =>
  `Bs ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  featured: boolean;
  is_active: boolean;
};
