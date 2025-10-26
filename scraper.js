require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const slugify = require("slugify");
const Product = require("./models/Product");
const connectDB = require("./config/db");

// Helper: calculate adjusted price
function applyMarkup(price) {
  if (price >= 1000) return +(price * 1.15).toFixed(2);
  if (price >= 500) return +(price * 1.20).toFixed(2);
  return +(price * 1.30).toFixed(2);
}

// Helper: upsert product
async function saveOrUpdateProduct(prod) {
  try {
    const updated = await Product.findOneAndUpdate(
      { slug: prod.slug }, // always use slug
      { $set: prod },
      { upsert: true, new: true }
    );

    console.log(`✅ Saved/Updated: ${prod.title} → R${prod.price.toFixed(2)}`);
  } catch (err) {
    console.error(`❌ Error saving product: ${prod.title}`, err.message);
  }
}

// Scrape category
async function scrapeCategory(categoryUrl) {
  let page = 1;
  let totalScraped = 0;

  while (true) {
    const url = page === 1 ? categoryUrl : `${categoryUrl}page/${page}/`;
    console.log(`🌐 Scraping ${url}`);

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);
      const products = [];

      $("li.product.type-product").each((i, el) => {
        const title = $(el).find("h2.woocommerce-loop-product__title").text().trim();
        const productUrl = $(el).find("a.woocommerce-LoopProduct-link").attr("href");
        let price = parseFloat($(el).find("span.woocommerce-Price-amount bdi").first().text().replace(/[^0-9.]/g, "")) || 0;
        price = Number(price.toFixed(2));

        const image = $(el).find("img").attr("src") || "";
        const skuText = $(el).find(".product-sku").text().replace("SKU:", "").trim();
        const slug = slugify(title, { lower: true });
        const description = $(el).find(".product-short-description").text().trim() || "";

        if (title && price > 0) {
          const adjustedPrice = Number(applyMarkup(price).toFixed(2));

          products.push({
            title,
            slug,
            productCode: skuText || "N/A",
            price: adjustedPrice,
            originalPrice: price,
            image,
            description,
            sourceUrl: productUrl,
            stockStatus: "dropship",
            category: categoryUrl.split("/product-category/")[1]?.replace(/\//g, ""),
          });
        }
      });

      if (products.length === 0) break;

      for (const prod of products) await saveOrUpdateProduct(prod);

      totalScraped += products.length;
      console.log(`✅ Scraped ${products.length} products from page ${page}`);
      page++;
    } catch (err) {
      console.error("❌ Error scraping:", err.message);
      break;
    }
  }

  console.log(`🎉 Finished category ${categoryUrl} — total ${totalScraped} products scraped`);
}

// Categories (same as your list)
const categories = [
  "https://allairaircon.co.za/product-category/airconditioner/",
  "https://allairaircon.co.za/product-category/appliance-spares/",
  "https://allairaircon.co.za/product-category/compressors/",
  "https://allairaircon.co.za/product-category/electrical/",
  "https://allairaircon.co.za/product-category/fans/",
  "https://allairaircon.co.za/product-category/filter-driers/",
  "https://allairaircon.co.za/product-category/fridge-coldroom-accessories/",
  "https://allairaircon.co.za/product-category/gas-oil/",
  "https://allairaircon.co.za/product-category/sales-items/",
  "https://allairaircon.co.za/product-category/shoes/",
  "https://allairaircon.co.za/product-category/tape-pvc-trunking-screws/",
  "https://allairaircon.co.za/product-category/tools-and-multi-meters/",
  "https://allairaircon.co.za/product-category/tubing-fitting-armaflex/",
  "https://allairaircon.co.za/product-category/valves/",
  "https://allairaircon.co.za/product-category/aircon-accessories/",
  "https://allairaircon.co.za/product-category/aircon-spares/",
  "https://allairaircon.co.za/product-category/sensors/",
  "https://allairaircon.co.za/product-category/brackets/",
  "https://allairaircon.co.za/product-category/universal-pc-board/",
  "https://allairaircon.co.za/product-category/universal-remote/",
  "https://allairaircon.co.za/product-category/condensation-pump/",
];

// Runner
(async () => {
  try {
    await connectDB(); // logs host & DB
    console.log("✅ Connected to MongoDB, starting scraping...");

    for (const cat of categories) {
      await scrapeCategory(cat);
    }

    console.log("🎯 Scraping finished for all categories!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    process.exit(1);
  }
})();
