import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SaleNotificationRequest {
  gameTitle: string;
  pricePaid: number;
  customerEmail: string;
  fileUrl?: string;
  couponCode?: string;
  discountAmount?: number;
}

const ADMIN_EMAIL = "igorsouzainformatica@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameTitle, pricePaid, customerEmail, fileUrl, couponCode, discountAmount }: SaleNotificationRequest = await req.json();

    console.log("Sending sale notification:", { gameTitle, pricePaid, customerEmail, fileUrl });

    // Email para o admin sobre a venda
    const adminEmailPromise = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "IndieJZ CyberLab <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🎮 Nova Venda: ${gameTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
            <h1 style="color: #00ff88; margin-bottom: 20px;">🎮 Nova Venda Realizada!</h1>
            
            <div style="background-color: #16213e; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin-top: 0;">${gameTitle}</h2>
              <p style="color: #b0b0b0; margin: 10px 0;">Cliente: ${customerEmail}</p>
              ${couponCode ? `<p style="color: #ff6b6b; margin: 10px 0;">Cupom usado: ${couponCode} (-R$ ${discountAmount?.toFixed(2)})</p>` : ''}
              <p style="color: #00ff88; font-size: 24px; font-weight: bold; margin: 20px 0;">R$ ${pricePaid.toFixed(2)}</p>
            </div>
            
            <p style="color: #b0b0b0; font-size: 12px; text-align: center;">
              IndieJZ CyberLab - ${new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        `,
      }),
    });

    // Email de confirmação para o cliente
    const downloadButton = fileUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fileUrl}" style="display: inline-block; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #1a1a2e; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
          ⬇️ BAIXAR JOGO
        </a>
      </div>
      <p style="color: #b0b0b0; font-size: 12px; text-align: center;">
        Ou copie o link: <a href="${fileUrl}" style="color: #00ff88;">${fileUrl}</a>
      </p>
    ` : '';

    const customerEmailPromise = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "IndieJZ CyberLab <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `✅ Compra Confirmada: ${gameTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
            <h1 style="color: #00ff88; margin-bottom: 20px;">🎉 Obrigado pela sua compra!</h1>
            
            <div style="background-color: #16213e; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin-top: 0;">${gameTitle}</h2>
              ${couponCode ? `<p style="color: #ff6b6b; margin: 10px 0;">Desconto aplicado: -R$ ${discountAmount?.toFixed(2)}</p>` : ''}
              <p style="color: #00ff88; font-size: 24px; font-weight: bold; margin: 20px 0;">Total: R$ ${pricePaid.toFixed(2)}</p>
            </div>
            
            ${downloadButton}
            
            <p style="color: #ffffff; margin: 20px 0;">
              Seu jogo também está disponível para download na sua conta! Acesse a seção "Meus Jogos" a qualquer momento.
            </p>
            
            <p style="color: #b0b0b0; font-size: 12px; text-align: center; margin-top: 30px;">
              Dúvidas? Entre em contato conosco!<br>
              IndieJZ CyberLab - ${new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </p>
          </div>
        `,
      }),
    });

    // Enviar ambos os emails em paralelo
    const [adminResult, customerResult] = await Promise.all([
      adminEmailPromise.then(r => r.json()),
      customerEmailPromise.then(r => r.json())
    ]);

    console.log("Admin notification sent:", adminResult);
    console.log("Customer confirmation sent:", customerResult);

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent", adminResult, customerResult }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
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
