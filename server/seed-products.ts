const SITE = "https://peyoteseedsvault.com";
const SOURCE_API = "https://peyoteseedsfarm.com/wp-json/wc/store/v1/products";
const ADMIN_PASSWORD = "william.40";

let sessionCookie = "";
let bearerToken = "";

interface WcProduct {
  id: number;
  name: string;
  type: string;
  description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range: { min_amount: string; max_amount: string } | null;
    currency_minor_unit: number;
  };
  images: { src: string }[];
  categories: { id: number; name: string }[];
  attributes: { name: string; terms: { name: string }[] }[];
  is_in_stock: boolean;
}

async function login(): Promise<void> {
  const res = await fetch(`${SITE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const setCookie = res.headers.get("set-cookie");
  console.log("Login response:", res.status);
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
    // Extract the JWT value after the =
    const eqIdx = sessionCookie.indexOf("=");
    if (eqIdx !== -1) bearerToken = sessionCookie.substring(eqIdx + 1);
  }
  if (!bearerToken) throw new Error("No session token received");
  console.log("Token obtained");
}

async function trpcGet(method: string, input?: any): Promise<any> {
  let url = `${SITE}/api/trpc/${method}?batch=1`;
  if (input !== undefined) {
    url += `&input=${encodeURIComponent(JSON.stringify({ "0": { json: input } }))}`;
  }
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${bearerToken}`,
  };
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${method} failed ${res.status}: ${body.substring(0, 200)}`);
  }
  const data = await res.json();
  if (data[0]?.error) throw new Error(`${method}: ${JSON.stringify(data[0].error)}`);
  return data[0]?.result?.data;
}

async function trpcMutate(method: string, input: any): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${bearerToken}`,
  };
  const res = await fetch(`${SITE}/api/trpc/${method}?batch=1`, {
    method: "POST",
    headers,
    body: JSON.stringify({ "0": { json: input } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${method} failed ${res.status}: ${body.substring(0, 200)}`);
  }
  const data = await res.json();
  if (data[0]?.error) throw new Error(`${method}: ${JSON.stringify(data[0].error)}`);
  return data[0]?.result?.data;
}

async function fetchAllProducts(): Promise<WcProduct[]> {
  const all: WcProduct[] = [];
  let page = 1;
  while (true) {
    process.stdout.write(`Fetching source page ${page}...\r`);
    const res = await fetch(`${SOURCE_API}?per_page=100&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
    if (page >= totalPages) break;
    page++;
  }
  console.log(`Fetched ${all.length} products from source`);
  return all;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#036;/g, "$")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...")
    .replace(/&#8230;/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCents(priceStr: string, minorUnit: number): number {
  const n = parseInt(priceStr, 10);
  return minorUnit === 2 ? n : Math.round(n * Math.pow(10, minorUnit));
}

async function main() {
  await login();

  const products = await fetchAllProducts();
  if (!products.length) { console.error("No products"); process.exit(1); }

  // Create categories
  const catMap = new Map<string, string>();
  for (const p of products) {
    for (const c of p.categories) {
      if (!catMap.has(c.name)) catMap.set(c.name, c.name);
    }
  }

  const existingCats = await trpcGet("admin.categories.list");
  const existingNames = new Set((existingCats ?? []).map((c: any) => c.name));
  const catIdByName = new Map<string, number>();

  for (const name of catMap.keys()) {
    if (existingNames.has(name)) {
      const found = (existingCats ?? []).find((c: any) => c.name === name);
      if (found) catIdByName.set(name, found.id);
      continue;
    }
    const result = await trpcMutate("admin.categories.create", { name });
    const id = result?.id ?? result;
    console.log(`  Category: ${name} (id=${id})`);
    catIdByName.set(name, id as number);
  }

  // Create products
  let created = 0;
  for (const p of products) {
    const minor = p.prices.currency_minor_unit ?? 2;
    const priceCents = parseCents(p.prices.price, minor);
    let priceEndCents: number | null = null;
    if (p.prices.price_range) {
      priceEndCents = parseCents(p.prices.price_range.max_amount, minor);
    }

    const images = p.images.map((i) => i.src);
    const imageUrl = images[0] ?? null;
    const isVariable = p.type === "variable";
    const firstCat = p.categories[0];
    const categoryId = firstCat ? (catIdByName.get(firstCat.name) ?? null) : null;

    let variants: any = null;
    if (isVariable && p.attributes.length > 0) {
      const attr = p.attributes.find((a) => /quantity/i.test(a.name));
      if (attr && attr.terms.length > 0) {
        variants = attr.terms.map((t) => ({
          id: `v-${p.id}-${t.name}`,
          name: t.name,
          imageUrl: imageUrl ?? "",
          priceCents,
        }));
      }
    }

    await trpcMutate("admin.products.create", {
      title: p.name,
      imageUrl,
      images,
      priceCents,
      priceEndCents,
      inStock: p.is_in_stock,
      isVariable,
      variants,
      categoryId,
      description: stripHtml(p.description) || null,
    });

    created++;
    if (created % 10 === 0 || created === products.length) {
      console.log(`  ${created}/${products.length} products created`);
    }
  }

  console.log(`Done! ${created} products, ${catMap.size} categories.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
