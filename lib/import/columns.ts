import * as XLSX from "xlsx"
import { ALL_PURPOSES, ALL_ROASTS, ALL_PROCESS_METHODS, ALL_FLAVORS } from "@/lib/types"

export interface ImportColumnDef {
  key: string
  header: string
  aliases?: string[]
  required: boolean
  type: "string" | "number" | "boolean" | "url" | "array"
  description: string
  example: string
}

export const BATCH_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "external_id",
    header: "external_id",
    aliases: ["id", "sku", "product_id", "externalid"],
    required: false,
    type: "string",
    description: "Unique external identifier or SKU for tracking and upsert matching",
    example: "CLIMP-BARON-001",
  },
  {
    key: "roaster_brand",
    header: "roaster_brand",
    aliases: ["roaster", "brand", "roaster_name"],
    required: true,
    type: "string",
    description: "Roastery or brand name",
    example: "Climpson & Sons",
  },
  {
    key: "retailer",
    header: "retailer",
    aliases: ["store", "retailer_name", "merchant"],
    required: true,
    type: "string",
    description: "Retailer or store selling this coffee bean",
    example: "Climpson & Sons Direct",
  },
  {
    key: "name",
    header: "name",
    aliases: ["bean_name", "product_name", "title"],
    required: true,
    type: "string",
    description: "Coffee bean title/name",
    example: "The Baron: Fazenda Inhame",
  },
  {
    key: "product_url",
    header: "product_url",
    aliases: ["url", "canonical_url", "link"],
    required: true,
    type: "url",
    description: "Direct canonical store URL for this product",
    example: "https://climpsonandsons.com/products/the-baron",
  },
  {
    key: "affiliate_url",
    header: "affiliate_url",
    aliases: ["affiliate_link", "tracking_url", "referral_url"],
    required: false,
    type: "url",
    description: "Affiliate network redirect URL",
    example: "https://tidd.ly/example-baron",
  },
  {
    key: "affiliate_network",
    header: "affiliate_network",
    aliases: ["network", "affiliate_platform"],
    required: false,
    type: "string",
    description: "Affiliate platform (awin, shareasale, impact, custom)",
    example: "awin",
  },
  {
    key: "merchant_id",
    header: "merchant_id",
    aliases: ["advertiser_id", "merchantid"],
    required: false,
    type: "string",
    description: "Merchant/Advertiser ID inside the affiliate network",
    example: "12456",
  },
  {
    key: "image_url",
    header: "image_url",
    aliases: ["image", "photo_url", "thumbnail"],
    required: false,
    type: "url",
    description: "Product image URL",
    example: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&q=80",
  },
  {
    key: "price",
    header: "price",
    aliases: ["cost", "sale_price", "amount"],
    required: true,
    type: "number",
    description: "Price per bag in decimal format",
    example: "15.00",
  },
  {
    key: "currency",
    header: "currency",
    aliases: ["curr", "currency_code"],
    required: false,
    type: "string",
    description: "Currency code (defaults to GBP)",
    example: "GBP",
  },
  {
    key: "bag_size_g",
    header: "bag_size_g",
    aliases: ["weight", "bag_size", "weight_g", "grams"],
    required: true,
    type: "number",
    description: "Net bag weight in grams (e.g. 250, 500, 1000)",
    example: "250",
  },
  {
    key: "country",
    header: "country",
    aliases: ["origin", "origin_country"],
    required: false,
    type: "string",
    description: "Country of origin",
    example: "Brazil",
  },
  {
    key: "region",
    header: "region",
    aliases: ["farm", "estate", "origin_region"],
    required: false,
    type: "string",
    description: "Growing region, estate, or farm",
    example: "Cerrado Mineiro",
  },
  {
    key: "process",
    header: "process",
    aliases: ["processing", "process_method"],
    required: false,
    type: "string",
    description: "Processing method (Washed, Natural, Honey, Anaerobic, Other)",
    example: "Natural",
  },
  {
    key: "roast_level",
    header: "roast_level",
    aliases: ["roast", "roast_type"],
    required: false,
    type: "string",
    description: "Roast degree (Light, Medium, Medium-Dark, Dark)",
    example: "Medium",
  },
  {
    key: "best_for",
    header: "best_for",
    aliases: ["purposes", "brew_methods", "recommended_brew"],
    required: false,
    type: "array",
    description: "Recommended brewing methods separated by '|' pipe",
    example: "Espresso | Pour Over | French Press",
  },
  {
    key: "flavour_notes",
    header: "flavour_notes",
    aliases: ["flavors", "flavor_notes", "tasting_notes"],
    required: false,
    type: "array",
    description: "Tasting notes separated by '|' pipe",
    example: "Chocolate | Hazelnut | Marzipan",
  },
  {
    key: "is_decaf",
    header: "is_decaf",
    aliases: ["decaf"],
    required: false,
    type: "boolean",
    description: "TRUE or FALSE indicating decaffeinated coffee",
    example: "FALSE",
  },
  {
    key: "in_stock",
    header: "in_stock",
    aliases: ["available", "stock"],
    required: false,
    type: "boolean",
    description: "TRUE or FALSE indicating stock availability (default TRUE)",
    example: "TRUE",
  },
  {
    key: "featured",
    header: "featured",
    aliases: ["is_featured", "highlight"],
    required: false,
    type: "boolean",
    description: "TRUE or FALSE to feature on homepage (default FALSE)",
    example: "FALSE",
  },
  {
    key: "active",
    header: "active",
    aliases: ["is_active", "enabled"],
    required: false,
    type: "boolean",
    description: "TRUE or FALSE indicating if listing is active (default TRUE)",
    example: "TRUE",
  },
  {
    key: "admin_notes",
    header: "admin_notes",
    aliases: ["notes", "internal_notes", "blurb"],
    required: false,
    type: "string",
    description: "Short product description or internal tasting notes",
    example: "Rich notes of chocolate and roasted nuts with smooth milk body.",
  },
]

export const SAMPLE_TEMPLATE_ROWS = [
  {
    external_id: "CLIMP-BARON-001",
    roaster_brand: "Climpson & Sons",
    retailer: "Climpson & Sons",
    name: "The Baron: Fazenda Inhame",
    product_url: "https://climpsonandsons.com/products/the-baron",
    affiliate_url: "https://tidd.ly/climpson-baron",
    affiliate_network: "awin",
    merchant_id: "12456",
    image_url: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&q=80",
    price: 15.00,
    currency: "GBP",
    bag_size_g: 250,
    country: "Brazil",
    region: "Cerrado Mineiro",
    process: "Natural",
    roast_level: "Medium",
    best_for: "Espresso | Pour Over | Drip",
    flavour_notes: "Chocolate | Nutty | Caramel",
    is_decaf: "FALSE",
    in_stock: "TRUE",
    featured: "TRUE",
    active: "TRUE",
    admin_notes: "Award-winning Brazilian roast with heavy chocolate sweetness.",
  },
  {
    external_id: "ORIG-PATH-002",
    roaster_brand: "Origin Coffee",
    retailer: "Origin Coffee Roasters",
    name: "Pathfinder Blend",
    product_url: "https://www.origincoffee.co.uk/products/pathfinder",
    affiliate_url: "https://tidd.ly/origin-pathfinder",
    affiliate_network: "awin",
    merchant_id: "12456",
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
    price: 13.50,
    currency: "GBP",
    bag_size_g: 250,
    country: "Colombia",
    region: "Huila",
    process: "Washed",
    roast_level: "Medium",
    best_for: "Espresso | French Press | Moka Pot",
    flavour_notes: "Stone Fruit | Honey | Caramel",
    is_decaf: "FALSE",
    in_stock: "TRUE",
    featured: "FALSE",
    active: "TRUE",
    admin_notes: "Bright and juicy profile with balanced sweetness.",
  },
  {
    external_id: "MONM-SANTA-003",
    roaster_brand: "Monmouth Coffee",
    retailer: "Monmouth Direct",
    name: "Finca Santa Catalina",
    product_url: "https://www.monmouthcoffee.co.uk/coffee/finca-santa-catalina",
    affiliate_url: "",
    affiliate_network: "custom",
    merchant_id: "",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    price: 14.20,
    currency: "GBP",
    bag_size_g: 250,
    country: "Guatemala",
    region: "Antigua",
    process: "Washed",
    roast_level: "Medium-Dark",
    best_for: "Pour Over | Drip | French Press",
    flavour_notes: "Chocolate | Nutty | Earthy",
    is_decaf: "FALSE",
    in_stock: "TRUE",
    featured: "FALSE",
    active: "TRUE",
    admin_notes: "Classic Central American washed profile with clean finish.",
  },
]

/**
 * Generate binary buffer for Excel (.xlsx) batch upload template
 */
export function generateTemplateXlsxBuffer(): Uint8Array {
  const headers = BATCH_IMPORT_COLUMNS.map((col) => col.header)
  const rows = SAMPLE_TEMPLATE_ROWS.map((row) =>
    headers.map((h) => (row as any)[h] !== undefined ? (row as any)[h] : "")
  )

  const data = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Configure column widths for readability
  ws["!cols"] = BATCH_IMPORT_COLUMNS.map((col) => {
    switch (col.key) {
      case "name":
      case "admin_notes":
        return { wch: 32 }
      case "product_url":
      case "affiliate_url":
      case "image_url":
        return { wch: 38 }
      case "best_for":
      case "flavour_notes":
        return { wch: 28 }
      case "roaster_brand":
      case "retailer":
        return { wch: 22 }
      default:
        return { wch: 16 }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Coffee Beans Import")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new Uint8Array(buffer)
}

/**
 * Generate CSV text for batch upload template
 */
export function generateTemplateCsvText(): string {
  const headers = BATCH_IMPORT_COLUMNS.map((col) => col.header)
  const rows = SAMPLE_TEMPLATE_ROWS.map((row) =>
    headers
      .map((h) => {
        const val = (row as any)[h] !== undefined ? String((row as any)[h]) : ""
        if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("|")) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      .join(",")
  )

  return [headers.join(","), ...rows].join("\n")
}
