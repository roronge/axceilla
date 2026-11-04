import dressFront from "@/assets/dress-front.webp";
import dressBack from "@/assets/dress-back.webp";

export type ProductVariant = {
  id: string;
  label: string;
  swatch: string;
  front: string;
  back: string;
};
export type ProductCategory = "dress" | "setelan" | "atasan" | "bawahan" | "aksesoris";
export type CatalogProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  sizes: string[];
  weight: number;
  active: boolean;
  variants: ProductVariant[];
  createdAt?: number;
};

export const STORAGE_KEY = "axceilla_catalog_v2";
const LEGACY_STORAGE_KEY = "axceilla_catalog_v1";
export const DEFAULT_CATALOG: CatalogProduct[] = [
  {
    id: "dress-tulle-grey",
    name: "Little Princess Tulle Dress",
    category: "dress",
    weight: 1,
    price: 185000,
    description: "Dress anak bernuansa abu-abu lembut dengan kerah Peter Pan, lengan puff, detail pita, dan rok tulle berlapis. Cocok untuk pesta, ulang tahun, dan momen spesial.",
    sizes: ["6-12M", "1Y", "2Y", "3Y", "4Y"],
    active: true,
    variants: [
      { id: "grey", label: "Dusty Grey", swatch: "#777383", front: dressFront, back: dressBack }
    ],
    createdAt: Date.now()
  }
];

export function loadCatalog(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_CATALOG;
    }
    // Preserve products saved by the previous version, but refresh the sample
    // dress images so its rear view uses the new transparent cutout.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy)) {
        const migrated = legacy.map((product: CatalogProduct) => {
          if (product.id !== "dress-tulle-grey") return product;
          return {
            ...product,
            variants: product.variants.map((variant) =>
              variant.id === "grey"
                ? { ...variant, front: dressFront, back: dressBack }
                : variant
            ),
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}
export function saveCatalog(products: CatalogProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("axceilla-catalog-updated"));
}
export function resetCatalog() {
  localStorage.removeItem(STORAGE_KEY);
}
