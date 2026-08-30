import * as db from "./db";

/**
 * Bootstraps default store data if the database is empty.
 * The MySQL database on Render's free tier uses ephemeral storage, so tables
 * are wiped on every deploy/restart. Running this on startup guarantees the
 * catalog is always repopulated after a reset.
 */
export async function bootstrapIfEmpty() {
  const conn = await db.getRawConnection();
  if (!conn) {
    console.warn("[Bootstrap] No DB connection, skipping.");
    return;
  }

  try {
    // If products already exist, nothing to do.
    const countRes = await conn.query("SELECT COUNT(*) AS c FROM products");
    const count = Number(countRes.rows[0]?.c ?? 0);
    if (count > 0) {
      console.log(`[Bootstrap] Products already present (${count}), skipping seed.`);
      return;
    }

    console.log("[Bootstrap] Database empty, seeding default catalog...");

    const categories = [
      "Ariocarpus", "Astrophytum", "Lophophora", "Trichocereus",
      "Echinopsis", "Mammillaria", "Ferocactus", "Gymnocalycium",
      "Notocactus", "Turbinicarpus", "Coryphantha", "Escobaria",
      "Pediocactus", "Sulcorebutia",
    ];

    const catImages: Record<string, string> = {
      Ariocarpus: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop",
      Astrophytum: "https://images.unsplash.com/photo-1520178606913-118a6b3c31b1?w=600&h=600&fit=crop",
      Lophophora: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=600&fit=crop",
      Trichocereus: "https://images.unsplash.com/photo-1580752137660-17f9fd9d0c15?w=600&h=600&fit=crop",
      Echinopsis: "https://images.unsplash.com/photo-1516481605912-d34c1411504c?w=600&h=600&fit=crop",
      Mammillaria: "https://images.unsplash.com/photo-1589046212139-bf293b6eba18?w=600&h=600&fit=crop",
      Ferocactus: "https://images.unsplash.com/photo-1537799261701-0cf2e54a840b?w=600&h=600&fit=crop",
      Gymnocalycium: "https://images.unsplash.com/photo-1533066636271-fdbe3e84ad80?w=600&h=600&fit=crop",
      Notocactus: "https://images.unsplash.com/photo-1510711547938-04fb9010e471?w=600&h=600&fit=crop",
      Turbinicarpus: "https://images.unsplash.com/photo-1539571711714-62cd2534f96e?w=600&h=600&fit=crop",
      Coryphantha: "https://images.unsplash.com/photo-1589046207215-b5ee3097bafc?w=600&h=600&fit=crop",
      Escobaria: "https://images.unsplash.com/photo-1520178606913-118a6b3c31b1?w=600&h=600&fit=crop",
      Pediocactus: "https://images.unsplash.com/photo-1516481605912-d34c1411504c?w=600&h=600&fit=crop",
      Sulcorebutia: "https://images.unsplash.com/photo-1532295039064-229629db1073?w=600&h=600&fit=crop",
    };

    const products: Array<{ title: string; priceCents: number; cat: string; desc: string }> = [
      { title: "Ariocarpus Retusus Seeds (10 seeds)", priceCents: 1299, cat: "Ariocarpus", desc: "Premium Ariocarpus retusus seeds. Slow-growing Living Rock Cactus with white to pink flowers." },
      { title: "Ariocarpus Retusus Seeds (25 seeds)", priceCents: 2499, cat: "Ariocarpus", desc: "Bulk 25 Ariocarpus retusus seeds with detailed growing guide." },
      { title: "Ariocarpus Furfuraceus Seeds (10 seeds)", priceCents: 1499, cat: "Ariocarpus", desc: "Rare Ariocarpus furfuraceus with distinctive tubercle texture." },
      { title: "Ariocarpus Kotsoubeyanus Seeds (10 seeds)", priceCents: 1999, cat: "Ariocarpus", desc: "Smallest Ariocarpus species with stunning pink flowers." },
      { title: "Ariocarpus Scaphirostris Seeds (10 seeds)", priceCents: 2499, cat: "Ariocarpus", desc: "Extremely rare endangered species with large pink flowers." },
      { title: "Ariocarpus Bravoanus Seeds (10 seeds)", priceCents: 2299, cat: "Ariocarpus", desc: "Compact species with woolly areoles and large white flowers." },
      { title: "Ariocarpus Trigonus Seeds (10 seeds)", priceCents: 1399, cat: "Ariocarpus", desc: "Elongated tubercle species with beautiful yellow flowers." },
      { title: "Astrophytum Asterias Seeds (20 seeds)", priceCents: 999, cat: "Astrophytum", desc: "Sand Dollar Cactus. Star-shaped spineless body with bright yellow flowers." },
      { title: "Astrophytum Myriostigma Seeds (20 seeds)", priceCents: 1099, cat: "Astrophytum", desc: "Bishop's Cap. Columnar star shape with white flocking." },
      { title: "Astrophytum Ornatum Seeds (20 seeds)", priceCents: 1199, cat: "Astrophytum", desc: "Most robust Astrophytum with star-shaped body. Great for beginners." },
      { title: "Astrophytum Capricorne Seeds (20 seeds)", priceCents: 1299, cat: "Astrophytum", desc: "Curved spines and golden-brown flocking. Large yellow flowers." },
      { title: "Astrophytum Potassium (Hybrid) Seeds (20 seeds)", priceCents: 1499, cat: "Astrophytum", desc: "Beautiful asterias x myriostigma hybrid with pronounced ribs." },
      { title: "Astrophytum Nudum Seeds (20 seeds)", priceCents: 1199, cat: "Astrophytum", desc: "Rare spineless Astrophytum with smooth green body and white dotting." },
      { title: "Astrophytum Asterias Super Kabuto Seeds (10 seeds)", priceCents: 2999, cat: "Astrophytum", desc: "Sought-after Japanese cultivar with dramatic white flocking. Limited." },
      { title: "Lophophora Williamsii Seeds (20 seeds)", priceCents: 1499, cat: "Lophophora", desc: "Famous Peyote cactus. Beautiful pink flowers. Highly prized." },
      { title: "Lophophora Fricii Seeds (20 seeds)", priceCents: 1699, cat: "Lophophora", desc: "Second-largest Lophophora with pink to lavender flowers." },
      { title: "Lophophora Williamsii Var Caespitosa Seeds (20 seeds)", priceCents: 1999, cat: "Lophophora", desc: "Clumping form producing multiple heads with pink flowers." },
      { title: "Lophophora Diffusa Seeds (20 seeds)", priceCents: 1599, cat: "Lophophora", desc: "Rare species with diffuse rib pattern and yellow-green flowers." },
      { title: "Lophophora Jourdaniana Seeds (10 seeds)", priceCents: 2999, cat: "Lophophora", desc: "Extremely rare. Largest flowers of any Lophophora. Limited." },
      { title: "Lophophora Williamsii Mixed Seeds (50 seeds)", priceCents: 3499, cat: "Lophophora", desc: "Bulk 50 seeds. Great value for larger collections." },
      { title: "Trichocereus Pachanoi Seeds (30 seeds)", priceCents: 899, cat: "Trichocereus", desc: "San Pedro. Fast-growing columnar. Easy and hardy." },
      { title: "Trichocereus Bridgesii Seeds (30 seeds)", priceCents: 999, cat: "Trichocereus", desc: "Achuma. Tall columnar with larger ribs. Beautiful white flowers." },
      { title: "Trichocereus Terscheckii Seeds (20 seeds)", priceCents: 1199, cat: "Trichocereus", desc: "Large columnar from Argentina. Beautiful white flowers." },
      { title: "Trichocereus Spachianus Seeds (30 seeds)", priceCents: 799, cat: "Trichocereus", desc: "Torch Cactus. Cluster-forming with large white flowers." },
      { title: "Trichocereus Ancistrophorus Seeds (20 seeds)", priceCents: 1299, cat: "Trichocereus", desc: "Rare with distinctive hooked spines and large white flowers." },
      { title: "Trichocereus Hybrid Mix Seeds (30 seeds)", priceCents: 1099, cat: "Trichocereus", desc: "Curated blend of Trichocereus species crosses." },
      { title: "Echinopsis Oxygona Seeds (30 seeds)", priceCents: 799, cat: "Echinopsis", desc: "Classic globular with spectacular night-blooming white to pink flowers." },
      { title: "Echinopsis Subdenudata Seeds (20 seeds)", priceCents: 899, cat: "Echinopsis", desc: "Domino Cactus. Spineless globular with large white flowers." },
      { title: "Echinopsis Pachanoi Seeds (30 seeds)", priceCents: 849, cat: "Echinopsis", desc: "Fast-growing columnar with nocturnal white flowers. Very hardy." },
      { title: "Echinopsis Huascha Seeds (20 seeds)", priceCents: 749, cat: "Echinopsis", desc: "Red Torch Cactus. Vibrant red to orange flowers." },
      { title: "Echinopsis Mirabilis Seeds (20 seeds)", priceCents: 1099, cat: "Echinopsis", desc: "Small globular with enormous white night-blooming flowers." },
      { title: "Mammillaria Elongata Seeds (30 seeds)", priceCents: 699, cat: "Mammillaria", desc: "Lady Finger Cactus. Easy-growing clustering with pink flowers." },
      { title: "Mammillaria Grahamii Seeds (30 seeds)", priceCents: 649, cat: "Mammillaria", desc: "Small globular from southwestern US. Pink to lavender crown ring." },
      { title: "Mammillaria Bocasana Seeds (30 seeds)", priceCents: 749, cat: "Mammillaria", desc: "Powder Puff Cactus. White woolly with pink flowers." },
      { title: "Mammillaria Plumerigera Seeds (20 seeds)", priceCents: 999, cat: "Mammillaria", desc: "Rare Oaxaca species with large yellow flowers." },
      { title: "Mammillaria Hahniana Seeds (20 seeds)", priceCents: 899, cat: "Mammillaria", desc: "Old Lady Cactus. White hairy with purple-pink flowers." },
      { title: "Mammillaria Heynmannii Seeds (20 seeds)", priceCents: 899, cat: "Mammillaria", desc: "Slender cylindrical with delicate lavender flowers." },
      { title: "Ferocactus Histrix Seeds (20 seeds)", priceCents: 799, cat: "Ferocactus", desc: "Classic barrel with prominent ribs and hooked spines." },
      { title: "Ferocactus Wislizeni Seeds (20 seeds)", priceCents: 849, cat: "Ferocactus", desc: "Fishhook Barrel. Large Sonoran Desert species. Orange to red flowers." },
      { title: "Ferocactus Emoryi Seeds (20 seeds)", priceCents: 899, cat: "Ferocactus", desc: "Robust barrel with red-tipped spines. Yellow to orange flowers." },
      { title: "Ferocactus Latispinus Seeds (20 seeds)", priceCents: 999, cat: "Ferocactus", desc: "Wide flat spines. Purple to red flowers." },
      { title: "Gymnocalycium Mihanovichii Seeds (30 seeds)", priceCents: 699, cat: "Gymnocalycium", desc: "Popular globular with pink to white flowers. Easy to grow." },
      { title: "Gymnocalycium Baldianum Seeds (20 seeds)", priceCents: 799, cat: "Gymnocalycium", desc: "Dwarf Chin Cactus. Deep red flowers." },
      { title: "Gymnocalycium Saglionis Seeds (20 seeds)", priceCents: 899, cat: "Gymnocalycium", desc: "Large globular with heavy spination and pale pink flowers." },
      { title: "Gymnocalycium Pflanzii Seeds (20 seeds)", priceCents: 749, cat: "Gymnocalycium", desc: "Flattened globular with silver spines and large white flowers." },
      { title: "Gymnocalycium Friedmanii Seeds (20 seeds)", priceCents: 849, cat: "Gymnocalycium", desc: "Chin Cactus. Dark green with pink to magenta flowers." },
      { title: "Notocactus Magnificus Seeds (20 seeds)", priceCents: 899, cat: "Notocactus", desc: "Blue-green globular with golden spines and large yellow flowers." },
      { title: "Notocactus Haselbergii Seeds (20 seeds)", priceCents: 799, cat: "Notocactus", desc: "Scarlet Ball Cactus. Bright orange-red flowers." },
      { title: "Notocactus Leninghausii Seeds (20 seeds)", priceCents: 749, cat: "Notocactus", desc: "Golden Ball. Clustering golden-spined. Fast-growing." },
      { title: "Notocactus Grappleri Seeds (20 seeds)", priceCents: 849, cat: "Notocactus", desc: "Small clustering with bright red flowers." },
      { title: "Turbinicarpus Valdezianus Seeds (20 seeds)", priceCents: 1499, cat: "Turbinicarpus", desc: "Tiny with white feathery spines and large pink flowers." },
      { title: "Turbinicarpus Pseudopectinatus Seeds (20 seeds)", priceCents: 1399, cat: "Turbinicarpus", desc: "Comb-like spines. Large pink to magenta flowers." },
      { title: "Turbinicarpus Schmiedickeanus Seeds (20 seeds)", priceCents: 1299, cat: "Turbinicarpus", desc: "Variable species with attractive spination." },
      { title: "Turbinicarpus Jauernigii Seeds (10 seeds)", priceCents: 2499, cat: "Turbinicarpus", desc: "Extremely rare. White flowers with dark center stripe." },
      { title: "Coryphantha Macromeris Seeds (20 seeds)", priceCents: 899, cat: "Coryphantha", desc: "Clustering with large pink to magenta flowers." },
      { title: "Coryphantha Elephantidens Seeds (20 seeds)", priceCents: 999, cat: "Coryphantha", desc: "Large-flowered with bright pink to magenta blooms." },
      { title: "Coryphantha Radiosa Seeds (20 seeds)", priceCents: 849, cat: "Coryphantha", desc: "Compact globular with vibrant red flowers." },
      { title: "Escobaria Vivipara Seeds (30 seeds)", priceCents: 699, cat: "Escobaria", desc: "Hardy clustering from Great Plains. Pink flowers." },
      { title: "Escobaria Missouriensis Seeds (20 seeds)", priceCents: 799, cat: "Escobaria", desc: "Small globular with greenish-yellow flowers. Very cold-hardy." },
      { title: "Escobaria Runyonii Seeds (20 seeds)", priceCents: 999, cat: "Escobaria", desc: "Rat Tail Coryphantha. Cylindrical with bright pink flowers." },
      { title: "Pediocactus Simpsonii Seeds (20 seeds)", priceCents: 1299, cat: "Pediocactus", desc: "Hardy mountain cactus. Extremely cold-tolerant." },
      { title: "Pediocactus Knowltonii Seeds (10 seeds)", priceCents: 2999, cat: "Pediocactus", desc: "One of the rarest cacti in North America." },
      { title: "Pediocactus Pectinatus Seeds (20 seeds)", priceCents: 1499, cat: "Pediocactus", desc: "Comb-like spines and pink to white flowers." },
      { title: "Sulcorebutia Rauschii Seeds (30 seeds)", priceCents: 899, cat: "Sulcorebutia", desc: "Stunning blue-purple body with vibrant yellow to orange flowers." },
      { title: "Sulcorebutia Brettfeldii Seeds (20 seeds)", priceCents: 999, cat: "Sulcorebutia", desc: "Intense violet-blue flowers. Most colorful cactus in cultivation." },
      { title: "Sulcorebutia Alba Seeds (20 seeds)", priceCents: 1199, cat: "Sulcorebutia", desc: "White-bodied form with bright yellow flowers. Rare." },
      { title: "Sulcorebutia Horstii Seeds (20 seeds)", priceCents: 1099, cat: "Sulcorebutia", desc: "Blue-green body with golden spines and magenta flowers." },
    ];

    // Insert categories
    const catIdMap: Record<string, number> = {};
    for (const name of categories) {
      const img = catImages[name] ?? null;
      const existing = await conn.query("SELECT id FROM categories WHERE name = $1", [name]);
      if (existing.rows.length > 0) {
        catIdMap[name] = Number(existing.rows[0].id);
      } else {
        const ins = await conn.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [name]);
        catIdMap[name] = Number(ins.rows[0].id);
      }
    }

    // Insert products with images
    for (const p of products) {
      const catId = catIdMap[p.cat] ?? null;
      const img = catImages[p.cat] ?? null;
      await conn.query(
        "INSERT INTO products (title, \"imageUrl\", \"priceCents\", \"categoryId\", description, \"inStock\", \"isVariable\") VALUES ($1, $2, $3, $4, $5, TRUE, FALSE)",
        [p.title, img, p.priceCents, catId, p.desc]
      );
    }

    // Seed 5 default reviews
    const reviews = [
      { authorName: "Marco T.", rating: 5, content: "Excellent Ariocarpus retusus seeds. Germinated within a week and are growing strong. Packaging was discreet and seeds arrived in perfect condition. Highly recommend!" },
      { authorName: "Sarah L.", rating: 5, content: "I've ordered from several cactus seed suppliers online and Peyote Seeds Farm is by far the best. My Astrophytum asterias seeds had an amazing germination rate." },
      { authorName: "Diego R.", rating: 4, content: "Great selection of rare Lophophora williamsii seeds. Shipping was fast and discreet. Customer service responded quickly when I reached out." },
      { authorName: "Yuki M.", rating: 5, content: "Ordered a variety pack of Trichocereus seeds. Every single one germinated! The care instructions included with the order were super helpful." },
      { authorName: "Carlos P.", rating: 5, content: "Finally found a reliable source for Ariocarpus seeds online. The quality is outstanding and the prices are fair. Discreet worldwide shipping as promised." },
    ];
    for (const r of reviews) {
      await conn.query(
        "INSERT INTO reviews (\"authorName\", rating, content, status) VALUES ($1, $2, $3, 'approved')",
        [r.authorName, r.rating, r.content]
      );
    }

    console.log(`[Bootstrap] Seeded ${products.length} products, ${categories.length} categories, ${reviews.length} reviews.`);
  } catch (e: any) {
    console.error("[Bootstrap] Seeding failed:", e?.message);
  } finally {
    try { await conn.release(); } catch {}
  }
}
