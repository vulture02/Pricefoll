import { sendPriceDropAlert } from "@/lib/email";
import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Cron job to check prices executed successfully.",
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const supabae = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: products, error: productsError } = await supabae
      .from("products")
      .select("*");
    if (productsError) {
      throw productsError;
    }
    console.log(`Fetched ${products.length} products to check prices.`);
    const results = {
      total: products.length,
      update: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };
    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);
        if (!productData.currentPrice) {
          results.failed++;
          continue;
        }
        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);
        (await supabae)
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currencyCode || product.currency,
            name: productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (newPrice !== oldPrice) {
          await supabae.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: productData.currencyCode || product.currency,
          });
          results.priceChanges++;

          if (newPrice < oldPrice) {
            const {
              data: { users },
            } = await supabae.auth.admin.getUserById(product.user_id);

            if (users?.email) {
              const emailResult = await sendPriceDropAlert(
                users.email,
                product,
                oldPrice,
                newPrice
              );
              if (emailResult.success) {
                results.alertsSent++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to update product ID ${product.id}:`, error);
        results.failed++;
      }
    }
    return NextResponse.json({
      success: true,
      message: "Price check completed.",
      results,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
