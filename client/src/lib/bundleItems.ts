import type { Listing } from "./api";

// What a bundle holds, read from its title ("Toddler white dress & shoes
// bundle" → dress, shoes), so the card can show every item and not just the
// one the seller photographed. Each item gets a small sample photo (free
// StockSnap photos, the same ones the demo listings use; see
// assets/bundle/CREDITS.md) or, where we have none, an icon.
export type BundleItem = { key: string; label: string; photo?: string };

// Order matters: multi-word names go first and use up their words, so
// "dress shoes" is shoes and "shirt dress" is a dress, not a shirt too.
const ITEMS: { key: string; label: string; pattern: RegExp }[] = [
  { key: "shoes", label: "Shoes", pattern: /\bdress shoes?\b/ },
  { key: "dress", label: "Dress", pattern: /\bshirt ?dress(es)?\b/ },
  { key: "jacket", label: "Jacket", pattern: /\bdenim jackets?\b/ },
  { key: "tshirt", label: "T-shirt", pattern: /\bt-?shirts?\b|\btees?\b/ },
  { key: "sneakers", label: "Sneakers", pattern: /\bsneakers?\b|\btrainers?\b/ },
  { key: "boots", label: "Boots", pattern: /\bboots?\b/ },
  { key: "shoes", label: "Shoes", pattern: /\bshoes?\b|\bsandals?\b|\bheels\b/ },
  { key: "dress", label: "Dress", pattern: /\bdress(es)?\b/ },
  { key: "shirt", label: "Shirt", pattern: /\bshirts?\b|\bblouses?\b/ },
  { key: "sweater", label: "Sweater", pattern: /\bsweaters?\b|\bjumpers?\b|\bknits?\b|\bhoodies?\b/ },
  { key: "jacket", label: "Jacket", pattern: /\bjackets?\b|\bcoats?\b|\bparkas?\b/ },
  { key: "jeans", label: "Jeans", pattern: /\bjeans\b/ },
  { key: "skirt", label: "Skirt", pattern: /\bskirts?\b/ },
  { key: "sunglasses", label: "Sunglasses", pattern: /\bsunglasses\b|\bshades\b/ },
  { key: "tie", label: "Tie", pattern: /\bties?\b/ },
  { key: "belt", label: "Belt", pattern: /\bbelts?\b/ },
  { key: "hat", label: "Hat", pattern: /\bhats?\b|\bbeanies?\b|\bcaps?\b/ },
  { key: "scarf", label: "Scarf", pattern: /\bscarf\b|\bscarves\b/ },
  { key: "gloves", label: "Gloves", pattern: /\bgloves?\b|\bmittens?\b/ },
];

const PHOTOS = import.meta.glob<string>("../assets/bundle/*.jpg", { eager: true, import: "default" });
// The kids or men's version of a photo when there is one, else the default.
const photoFor = (key: string, audience?: string) =>
  PHOTOS[`../assets/bundle/${key}-${audience}.jpg`] ??
  // An adult dress would misdescribe a kids' bundle, so kids fall back to the icon.
  (audience === "kids" && key === "dress" ? undefined : PHOTOS[`../assets/bundle/${key}.jpg`]);

export function bundleItems(listing: Listing): BundleItem[] {
  const isBundle = listing.subcategory?.endsWith("-bundles") || /\bbundle\b/i.test(listing.title);
  if (!isBundle) return [];

  let rest = listing.title.toLowerCase();
  const found: { key: string; label: string; at: number }[] = [];
  for (const { key, label, pattern } of ITEMS) {
    const match = rest.match(pattern);
    if (!match || match.index === undefined) continue;
    if (!found.some((f) => f.key === key)) found.push({ key, label, at: match.index });
    rest = rest.slice(0, match.index) + " ".repeat(match[0].length) + rest.slice(match.index + match[0].length);
  }
  // A bundle of one kind of thing ("six t-shirts") is already shown by its photo.
  if (found.length < 2) return [];

  return found
    .sort((a, b) => a.at - b.at)
    .map(({ key, label }) => ({ key, label, photo: photoFor(key, listing.category) }));
}

// True when the search words name this item, so a search for "shoes" puts the
// shoes tile first and highlights it. Any footwear word matches all footwear.
const FOOTWEAR = ["shoes", "sneakers", "boots"];
const sameKind = (a: string, b: string) => a === b || (FOOTWEAR.includes(a) && FOOTWEAR.includes(b));

export function matchesSearch(item: BundleItem, keywords: string | null) {
  if (!keywords) return false;
  const words = keywords.toLowerCase();
  return ITEMS.some(({ key, pattern }) => sameKind(key, item.key) && pattern.test(words));
}
