// AP Aquaculture Product Master Catalog
// Curated list of Prawns Intake types for the Quick Fill catalog

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  countSize?: string;
  weight: number;
  imageUrl: string;
  description: string;
  suggestedPrice?: number;
  suggestedPurchasePrice?: number;
}

export const AP_CATALOG: CatalogProduct[] = [
  // ── VANNAMEI PRAWNS ─────────────────────────────────────────────
  {
    id: "vannamei-40",
    name: "Vannamei Raw Prawns 40 count",
    brand: "Aqua Farms",
    category: "Vannamei Prawns",
    countSize: "40 count",
    weight: 25,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Premium large Vannamei prawns, ideal for IQF processing.",
    suggestedPrice: 450,
    suggestedPurchasePrice: 380,
  },
  {
    id: "vannamei-60",
    name: "Vannamei Raw Prawns 60 count",
    brand: "Coastal Prawns",
    category: "Vannamei Prawns",
    countSize: "60 count",
    weight: 25,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Medium Vannamei prawns, perfect for peeling and freezing.",
    suggestedPrice: 400,
    suggestedPurchasePrice: 340,
  },
  {
    id: "vannamei-80",
    name: "Vannamei Raw Prawns 80 count",
    brand: "Marine Fresh",
    category: "Vannamei Prawns",
    countSize: "80 count",
    weight: 25,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Standard grade Vannamei prawns, suited for daily batch processing.",
    suggestedPrice: 350,
    suggestedPurchasePrice: 300,
  },
  {
    id: "vannamei-120",
    name: "Vannamei Raw Prawns 120 count",
    brand: "Premium Prawns",
    category: "Vannamei Prawns",
    countSize: "120 count",
    weight: 25,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Small count size Vannamei prawns for value-added products.",
    suggestedPrice: 300,
    suggestedPurchasePrice: 250,
  },

  // ── TIGER PRAWNS ────────────────────────────────────────────────
  {
    id: "tiger-40",
    name: "Tiger Prawns 40 count",
    brand: "Bay Seafood",
    category: "Tiger Prawns",
    countSize: "40 count",
    weight: 20,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Large black Tiger prawns, premium export quality.",
    suggestedPrice: 750,
    suggestedPurchasePrice: 650,
  },
  {
    id: "tiger-60",
    name: "Tiger Prawns 60 count",
    brand: "Coastal Prawns",
    category: "Tiger Prawns",
    countSize: "60 count",
    weight: 20,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Medium Tiger prawns with excellent texture and color.",
    suggestedPrice: 650,
    suggestedPurchasePrice: 550,
  },
  {
    id: "tiger-100",
    name: "Tiger Prawns 100 count",
    brand: "Ocean Harvest",
    category: "Tiger Prawns",
    countSize: "100 count",
    weight: 20,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Regular count Tiger prawns from brackish water farms.",
    suggestedPrice: 550,
    suggestedPurchasePrice: 470,
  },

  // ── SCAMPI PRAWNS ───────────────────────────────────────────────
  {
    id: "scampi-60",
    name: "Scampi Prawns 60 count",
    brand: "Marine Fresh",
    category: "Scampi Prawns",
    countSize: "60 count",
    weight: 15,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Freshwater Scampi, medium grade with sweet flavor.",
    suggestedPrice: 600,
    suggestedPurchasePrice: 500,
  },
  {
    id: "scampi-80",
    name: "Scampi Prawns 80 count",
    brand: "Marine Fresh",
    category: "Scampi Prawns",
    countSize: "80 count",
    weight: 15,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Freshwater Scampi, standard grade from Tenali farms.",
    suggestedPrice: 550,
    suggestedPurchasePrice: 460,
  },
  {
    id: "scampi-100",
    name: "Scampi Prawns 100 count",
    brand: "Ocean Harvest",
    category: "Scampi Prawns",
    countSize: "100 count",
    weight: 15,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Small count freshwater Scampi for peeling.",
    suggestedPrice: 500,
    suggestedPurchasePrice: 420,
  },

  // ── WHITE PRAWNS ────────────────────────────────────────────────
  {
    id: "white-80",
    name: "White Prawns 80 count",
    brand: "Bay Seafood",
    category: "White Prawns",
    countSize: "80 count",
    weight: 30,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Wild caught White prawns, tender texture.",
    suggestedPrice: 580,
    suggestedPurchasePrice: 490,
  },
  {
    id: "white-100",
    name: "White Prawns 100 count",
    brand: "Bay Seafood",
    category: "White Prawns",
    countSize: "100 count",
    weight: 30,
    imageUrl: "https://images.unsplash.com/photo-1559742811-82410b510429?w=500&auto=format&fit=crop&q=60",
    description: "Standard count White prawns, popular choice for processing.",
    suggestedPrice: 500,
    suggestedPurchasePrice: 420,
  }
];

export const CATALOG_BRANDS = [...new Set(AP_CATALOG.map((p) => p.brand))].sort();
export const CATALOG_CATEGORIES = [...new Set(AP_CATALOG.map((p) => p.category))].sort();
