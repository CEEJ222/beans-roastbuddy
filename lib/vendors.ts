export type Vendor = {
  name: string
  hostnames: string[]
  productUrlPattern: RegExp
  defaultListingUrl?: string
  notes?: string
}

export const VENDORS: Vendor[] = [
  {
    name: "Sweet Maria's",
    hostnames: ['sweetmarias.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?sweetmarias\.com\/[^/?#]+\.html(?:\?.*)?$/i,
    defaultListingUrl: 'https://www.sweetmarias.com/green-coffee/latest-additions.html',
    notes: 'Heavy bot detection — extracted fields can be hallucinated. Verify carefully.',
  },
  {
    name: 'Coffee Shrub',
    hostnames: ['coffeeshrub.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?coffeeshrub\.com\/[^/?#]+\.html(?:\?.*)?$/i,
    notes: "Sweet Maria's wholesale arm — same bot-detection risks.",
  },
  {
    name: "The Captain's Coffee",
    hostnames: ['thecaptainscoffee.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?thecaptainscoffee\.com\/collections\/[^/]+\/products\/[^/?#]+/i,
    defaultListingUrl: 'https://thecaptainscoffee.com/collections/green-coffee',
  },
  {
    name: 'Burman Coffee Traders',
    hostnames: ['burmancoffee.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?burmancoffee\.com\/product\/green-coffee-beans\/[^/?#]+\/?(?:\?.*)?$/i,
    defaultListingUrl: 'https://burmancoffee.com/product-category/green-coffee-beans/',
  },
  {
    name: 'Bodhi Leaf Coffee Traders',
    hostnames: ['bodhileafcoffee.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?bodhileafcoffee\.com\/(?:collections\/[^/]+\/)?products\/[^/?#]+/i,
  },
  {
    name: 'Mill City Roasters',
    hostnames: ['millcityroasters.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?millcityroasters\.com\/shop\/[^/?#]+/i,
    notes: 'Product URL pattern unverified — adjust if discovery returns wrong items.',
  },
  {
    name: 'Roastmasters',
    hostnames: ['roastmasters.com'],
    productUrlPattern: /^https?:\/\/(?:www\.)?roastmasters\.com\/(?:[^/?#]+\/)?[^/?#]+\.html(?:\?.*)?$/i,
    notes: 'Product URL pattern unverified — adjust if discovery returns wrong items.',
  },
]

function normalizeHost(h: string): string {
  return h.replace(/^www\./i, '').toLowerCase()
}

export function findVendorByUrl(url: string): Vendor | null {
  try {
    const hostname = normalizeHost(new URL(url).hostname)
    return (
      VENDORS.find((v) => v.hostnames.some((h) => normalizeHost(h) === hostname)) ?? null
    )
  } catch {
    return null
  }
}

export function isProductUrl(url: string, vendor: Vendor): boolean {
  return vendor.productUrlPattern.test(url)
}

export function stripQueryAndHash(url: string): string {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    return url
  }
}
