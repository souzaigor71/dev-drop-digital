import { Gamepad2, Heart, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Footer = () => {
  const [copied, setCopied] = useState(false);
  const pixKey = "66e61cc3-0bf0-4964-a20e-d9e5ebeb810b";

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="py-8 border-t border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6">
          {/* Seção de Doação PIX */}
          <div className="flex flex-col items-center gap-3 p-4 bg-background/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-pink-500">
              <Heart className="w-5 h-5" />
              <span className="font-display text-sm font-bold">Apoie o Studio</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Gostou do nosso trabalho? Faça uma doação via PIX!
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-1.5 rounded font-mono text-foreground">
                {pixKey}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyPixKey}
                className="h-8"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Link to="/apoiar">
              <Button variant="link" size="sm" className="text-pink-500 hover:text-pink-400">
                Ver página de apoio completa →
              </Button>
            </Link>
          </div>

          {/* Footer original */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <span className="font-display text-sm font-bold text-foreground tracking-wider">
                GAME<span className="text-primary">DEV</span>
              </span>
            </div>

            <p className="font-body text-sm text-muted-foreground">
              © 2024 GameDev. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
