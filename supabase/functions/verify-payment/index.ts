import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Function to send sale notification in background
async function sendSaleNotification(supabaseUrl: string, gameTitle: string, pricePaid: number, customerEmail: string, couponCode?: string, discountAmount?: number) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-sale-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameTitle,
        pricePaid,
        customerEmail,
        couponCode,
        discountAmount,
      }),
    });
    console.log("Sale notification sent:", await response.json());
  } catch (error) {
    console.error("Failed to send sale notification:", error);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, gameId } = await req.json();

    console.log("Verifying payment:", { sessionId, gameId });

    if (!sessionId || !gameId) {
      throw new Error("Missing required fields: sessionId or gameId");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("Session status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ verified: false, message: "Payment not completed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the file URL from the games table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: game, error } = await supabase
      .from("games")
      .select("file_url, title, downloads")
      .eq("id", gameId)
      .single();

    if (error || !game) {
      console.error("Error fetching game:", error);
      throw new Error("Game not found");
    }

    // Increment download count
    await supabase
      .from("games")
      .update({ downloads: (game.downloads || 0) + 1 })
      .eq("id", gameId);

    // Get metadata from session
    const metadata = session.metadata || {};
    const userId = metadata.user_id || null;
    const couponCode = metadata.coupon_code || null;
    const pricePaid = parseFloat(metadata.price_paid || "0");
    const discountAmount = parseFloat(metadata.discount_amount || "0");

    // Save purchase if user is logged in
    if (userId) {
      const { error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          user_id: userId,
          game_id: gameId,
          price_paid: pricePaid,
          coupon_code: couponCode,
          discount_amount: discountAmount,
        });

      if (purchaseError) {
        console.error("Error saving purchase:", purchaseError);
      } else {
        console.log("Purchase saved for user:", userId);
      }
    }

    // Increment coupon usage if coupon was used
    if (couponCode) {
      // Get current coupon data
      const { data: coupon } = await supabase
        .from("coupons")
        .select("current_uses")
        .eq("code", couponCode)
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ current_uses: (coupon.current_uses || 0) + 1 })
          .eq("code", couponCode);
        console.log("Coupon usage incremented:", couponCode);
      }
    }

    console.log("Payment verified successfully for game:", game.title);

    // Send email notification in background (fire and forget)
    const customerEmail = session.customer_details?.email || session.customer_email || 'unknown@email.com';
    sendSaleNotification(supabaseUrl, game.title, pricePaid, customerEmail, couponCode || undefined, discountAmount || undefined)
      .catch(err => console.error("Background notification failed:", err));

    return new Response(
      JSON.stringify({ 
        verified: true, 
        fileUrl: game.file_url,
        gameTitle: game.title 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error verifying payment:", error);
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
