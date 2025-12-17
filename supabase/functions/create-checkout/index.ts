import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId, gameTitle, price, originalPrice, couponCode, discountAmount, returnUrl, userId } = await req.json();

    console.log("Creating checkout session for:", { gameId, gameTitle, price, originalPrice, couponCode, discountAmount, userId });

    if (!gameId || !gameTitle || price === undefined) {
      throw new Error("Missing required fields: gameId, gameTitle, or price");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Build line item description
    let description = `Download do jogo ${gameTitle}`;
    if (couponCode && discountAmount > 0) {
      description += ` (Cupom: ${couponCode} - R$ ${discountAmount.toFixed(2)} de desconto)`;
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: gameTitle,
              description: description,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${returnUrl}?success=true&game_id=${gameId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        game_id: gameId,
        user_id: userId || '',
        coupon_code: couponCode || '',
        original_price: originalPrice?.toString() || price.toString(),
        discount_amount: discountAmount?.toString() || '0',
        price_paid: price.toString(),
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
