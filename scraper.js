require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const slugify = require("slugify");
const Product = require("./models/Product");
const connectDB = require("./config/db");

// ---------------- CONFIG ----------------
const BASE_URL = "https://allairaircon.co.za";
const START_URL = `${BASE_URL}/shop/`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
};

// ---------------- PRICE LOGIC ----------------
function applyMarkup(price) {
  if (price >= 1000) return price * 1.15;
  if (price >= 500) return price * 1.2;
  return price * 1.3;
}

// ---------------- NORMALIZER ----------------
function normalizeProduct(raw) {
  const cleanPrice = Number(raw.price.toFixed(2));
  const markedUp = Number(applyMarkup(cleanPrice).toFixed(2));

  return {
    title: raw.title.trim(),
    slug: slugify(raw.title, { lower: true }),
    productCode: raw.productCode || "N/A",
    price: markedUp,
    originalPrice: cleanPrice,
    image: raw.image?.startsWith("http")
      ? raw.image
      : `${BASE_URL}${raw.image}`,
    sourceUrl: raw.sourceUrl,
    stockStatus: "dropship",
    category: raw.category || "general",
  };
}

// ---------------- DB SAVE ----------------
async function saveOrUpdateProduct(prod) {
  try {
    await Product.findOneAndUpdate(
      { slug: prod.slug },
      { $set: prod },
      { upsert: true, new: true }
    );

    console.log(`✅ ${prod.title} → R${prod.price}`);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
}

// ---------------- FETCH HTML ----------------
async function fetch(url) {
  try {
    const res = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      console.log(`⚠️ Skipping ${url} (status ${res.status})`);
      return null;
    }

    const html = res.data;

    if (
      !html ||
      html.length < 5000 ||
      html.toLowerCase().includes("not found")
    ) {
      console.log(`⚠️ Invalid or blocked page: ${url}`);
      return null;
    }

    return html;
  } catch (err) {
    console.log(`❌ Request failed: ${url}`);
    return null;
  }
}

// ---------------- EXTRACT PRODUCTS ----------------
function extractProducts($, currentUrl) {
  const products = [];

  $("li.product, .product").each((_, el) => {
    const title =
      $(el)
        .find(".woocommerce-loop-product__title, h2")
        .first()
        .text()
        .trim();

    const link =
      $(el)
        .find("a.woocommerce-LoopProduct-link, a")
        .attr("href") || "";

    const priceText =
      $(el)
        .find(".woocommerce-Price-amount bdi")
        .first()
        .text()
        .replace(/[^0-9.]/g, "");

    const price = parseFloat(priceText);

    const image =
      $(el).find("img").attr("src") ||
      $(el).find("img").attr("data-src") ||
      "";

    const sku =
      $(el).find(".sku, .product-sku").text().trim();

    if (!title || !price || price <= 0) return;

    products.push(
      normalizeProduct({
        title,
        price,
        image,
        sourceUrl: link,
        productCode: sku,
        category: currentUrl.split("/shop/")[1] || "general",
      })
    );
  });

  return products;
}

// ---------------- SCRAPE PAGE ----------------
async function scrapePage(url) {
  const html = await fetch(url);
  if (!html) return { products: [], nextPage: null };

  const $ = cheerio.load(html);

  const products = extractProducts($, url);

  let nextPage =
    $(".next.page-numbers").attr("href") ||
    $("a.next").attr("href") ||
    null;

  return { products, nextPage };
}

// ---------------- MAIN SCRAPER ----------------
async function scrapeAll() {
  const visited = new Set();
  const queue = [START_URL];
  let total = 0;

  while (queue.length) {
    const url = queue.shift();

    if (!url || visited.has(url)) continue;
    visited.add(url);

    console.log(`🌐 Visiting: ${url}`);

    const { products, nextPage } = await scrapePage(url);

    if (!products.length) {
      console.log("⚠️ No products found");
      continue;
    }

    for (const product of products) {
      await saveOrUpdateProduct(product);
    }

    total += products.length;
    console.log(`✅ ${products.length} products processed`);

    if (nextPage && !visited.has(nextPage)) {
      queue.push(nextPage);
    }
  }

  console.log(`🎯 DONE — Total: ${total} products`);
}

// ---------------- RUNNER ----------------
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    await scrapeAll();

    console.log("🚀 SCRAPING COMPLETE");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
    process.exit(1);
  }
})();