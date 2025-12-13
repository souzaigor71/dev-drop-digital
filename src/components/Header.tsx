import { Gamepad2 } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <span className="font-display text-xl font-bold text-foreground tracking-wider">
            GAME<span className="text-primary">DEV</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#gallery" className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Galeria
          </a>
          <a href="#downloads" className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Downloads
          </a>
          <a href="#about" className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Sobre
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
