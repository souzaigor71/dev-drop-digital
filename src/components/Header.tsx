import { Gamepad2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PurchaseHistory from "./PurchaseHistory";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <span className="font-display text-xl font-bold text-foreground tracking-wider">
            GAME<span className="text-primary">DEV</span>
          </span>
        </Link>
        
        <nav className="flex items-center gap-4 md:gap-8">
          <a href="#gallery" className="hidden md:block font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Galeria
          </a>
          <a href="#downloads" className="hidden md:block font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Downloads
          </a>
          <a href="#about" className="hidden md:block font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
            Sobre
          </a>
          {user && <PurchaseHistory />}
          <Link 
            to="/auth" 
            className="flex items-center gap-1 font-body text-sm font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
          >
            <Shield className="w-4 h-4" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
