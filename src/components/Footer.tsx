import { Gamepad2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border bg-card/50">
      <div className="container mx-auto px-4">
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
    </footer>
  );
};

export default Footer;
