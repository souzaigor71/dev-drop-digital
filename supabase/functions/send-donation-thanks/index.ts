import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DonationThanksRequest {
  name: string;
  email: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, amount }: DonationThanksRequest = await req.json();

    console.log(`Sending thank you email to ${email} for donation of R$${amount}`);

    const emailResponse = await resend.emails.send({
      from: "Igor's Studio <onboarding@resend.dev>",
      to: [email],
      subject: "Obrigado pela sua doação! 💚",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .heart { font-size: 48px; }
            h1 { color: #22c55e; margin: 10px 0; }
            .card { background: #1a1a1a; border-radius: 12px; padding: 30px; border: 1px solid #22c55e33; }
            .amount { font-size: 36px; font-weight: bold; color: #22c55e; text-align: center; margin: 20px 0; }
            .message { color: #a1a1aa; line-height: 1.6; }
            .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 14px; }
            .badge { display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="heart">💚</div>
              <h1>Obrigado, ${name}!</h1>
            </div>
            <div class="card">
              <p class="message">Sua generosidade nos ajuda a continuar criando jogos incríveis para a comunidade.</p>
              <div class="amount">R$ ${amount.toFixed(2)}</div>
              <p class="message">Graças a apoiadores como você, podemos dedicar mais tempo e recursos para desenvolver experiências únicas e divertidas.</p>
              <p style="text-align: center;">
                <span class="badge">🌟 Apoiador Oficial</span>
              </p>
              <p class="message" style="text-align: center; margin-top: 20px;">
                Seu nome foi adicionado ao nosso <strong>Mural de Apoiadores</strong>!
              </p>
            </div>
            <div class="footer">
              <p>Com gratidão,<br><strong>Igor's Studio</strong></p>
              <p>🎮 Feito com amor para gamers</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending thank you email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
