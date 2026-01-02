import { useState } from "react";
import { Heart, Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const suggestedAmounts = [
  { value: 5, label: "Café ☕", description: "Ajuda a manter a energia!" },
  { value: 10, label: "Lanche 🍕", description: "Uma refeição pro dev" },
  { value: 25, label: "Apoiador 💪", description: "Apoio significativo" },
  { value: 50, label: "Fã 🌟", description: "Você é incrível!" },
  { value: 100, label: "Patrono 👑", description: "Apoio premium" },
];

const Support = () => {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const pixKey = "66e61cc3-0bf0-4964-a20e-d9e5ebeb810b";

  // Gera o payload PIX no formato EMV
  const generatePixPayload = (amount?: number) => {
    // Payload simplificado - apenas a chave PIX
    // Para um payload completo EMV, seria necessário mais dados do recebedor
    return pixKey;
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Apoie o <span className="text-primary">Studio</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Sua contribuição ajuda a criar jogos incríveis!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* QR Code Section */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Heart className="w-6 h-6 fill-primary" />
              </div>
              <CardTitle className="font-display">QR Code PIX</CardTitle>
              <CardDescription>
                Escaneie com o app do seu banco
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={generatePixPayload(selectedAmount ?? undefined)}
                  size={200}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {selectedAmount && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor sugerido:</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {selectedAmount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Chave PIX */}
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Ou copie a chave PIX:
                </p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">
                    {pixKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixKey}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Amounts */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              Escolha um valor
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione um valor sugerido ou doe qualquer quantia que desejar
            </p>

            <div className="grid gap-3">
              {suggestedAmounts.map((amount) => (
                <Card
                  key={amount.value}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedAmount === amount.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedAmount(amount.value)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-display font-bold text-foreground">
                        {amount.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {amount.description}
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold text-primary">
                      R$ {amount.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Clear selection */}
            {selectedAmount && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setSelectedAmount(null)}
              >
                Limpar seleção
              </Button>
            )}

            {/* Thank you message */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground">
                  Cada contribuição, não importa o valor, nos ajuda a continuar
                  criando jogos incríveis. <strong>Muito obrigado!</strong> 💚
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
