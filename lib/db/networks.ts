import { AffiliateNetwork } from "@/lib/types"

const NETWORKS: AffiliateNetwork[] = [
  { id: "awin", name: "Awin" },
  { id: "shareasale", name: "ShareASale" },
  { id: "impact", name: "Impact" },
  { id: "custom", name: "Custom Direct / Coupon" },
]

export async function getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
  return NETWORKS
}
