import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Star, Clock, HardDrive, Loader2, Ticket, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Game {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  file_size: string | null;
  created_at: string;
  rating: number;
  genre: string | null;
  file_url: string | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

const DownloadsSection = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingGameId, setPurchasingGameId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGames(data);
      }
      setLoading(false);
    };

    fetchGames();
  }, []);

  // Handle payment success callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const gameId = params.get('game_id');
    const sessionId = params.get('session_id');

    if (success === 'true' && gameId && sessionId) {
      verifyAndDownload(sessionId, gameId);
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Compra cancelada",
        description: "Você cancelou a compra.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    setValidatingCoupon(false);

    if (error || !data) {
      toast({
        title: "Cupom inválido",
        description: "Este cupom não existe ou não está mais ativo.",
        variant: "destructive",
      });
      return;
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({
        title: "Cupom expirado",
        description: "Este cupom já expirou.",
        variant: "destructive",
      });
      return;
    }

    // Check max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast({
        title: "Cupom esgotado",
        description: "Este cupom atingiu o limite máximo de usos.",
        variant: "destructive",
      });
      return;
    }

    setAppliedCoupon(data);
    toast({
      title: "Cupom aplicado!",
      description: data.discount_percent 
        ? `${data.discount_percent}% de desconto aplicado`
        : `R$ ${Number(data.discount_amount).toFixed(2)} de desconto aplicado`,
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const calculateDiscount = (price: number): number => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_percent) {
      return (price * appliedCoupon.discount_percent) / 100;
    }
    if (appliedCoupon.discount_amount) {
      return Math.min(Number(appliedCoupon.discount_amount), price);
    }
    return 0;
  };

  const getFinalPrice = (price: number): number => {
    const discount = calculateDiscount(price);
    return Math.max(0, price - discount);
  };

  const verifyAndDownload = async (sessionId: string, gameId: string) => {
    try {
      toast({
        title: "Verificando pagamento...",
        description: "Aguarde enquanto verificamos seu pagamento.",
      });

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId, gameId },
      });

      if (error) throw error;

      if (data.verified && data.fileUrl) {
        toast({
          title: "Pagamento confirmado!",
          description: `Download de ${data.gameTitle} iniciando...`,
        });
        triggerDownload(data.fileUrl, data.gameTitle);
      } else {
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar o pagamento. Entre em contato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (game: Game) => {
    if (game.is_free) {
      if (game.file_url) {
        triggerDownload(game.file_url, game.title);
        toast({
          title: "Download iniciado!",
          description: `${game.title} está sendo baixado.`,
        });
      } else {
        toast({
          title: "Arquivo indisponível",
          description: "O arquivo ainda não foi disponibilizado.",
          variant: "destructive",
        });
      }
    } else {
      // Paid game - redirect to Stripe checkout
      setPurchasingGameId(game.id);
      try {
        const finalPrice = getFinalPrice(Number(game.price));
        const discount = calculateDiscount(Number(game.price));

        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            gameId: game.id,
            gameTitle: game.title,
            price: finalPrice,
            originalPrice: Number(game.price),
            couponCode: appliedCoupon?.code || null,
            discountAmount: discount,
            returnUrl: window.location.origin + '/#downloads',
            userId: user?.id || null,
          },
        });

        if (error) throw error;

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('Error creating checkout:', error);
        toast({
          title: "Erro",
          description: "Erro ao iniciar pagamento. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setPurchasingGameId(null);
      }
    }
  };

  const formatYear = (dateStr: string) => {
    return new Date(dateStr).getFullYear().toString();
  };

  if (loading) {
    return (
      <section id="downloads" className="py-24 relative bg-secondary/30">
        <div className="container mx-auto px-4 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section id="downloads" className="py-24 relative bg-secondary/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(145_70%_35%_/_0.1)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">BAIXE MEUS </span>
              <span className="text-primary text-glow">GAMES</span>
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              Em breve teremos jogos disponíveis para download!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="downloads" className="py-24 relative bg-secondary/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(145_70%_35%_/_0.1)_0%,_transparent_60%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">BAIXE MEUS </span>
            <span className="text-primary text-glow">GAMES</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Jogos completos prontos para jogar. Alguns são pagos, outros são totalmente gratuitos!
          </p>

          {/* Coupon Section */}
          <div className="mt-8 max-w-md mx-auto">
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-primary/20 border border-primary/50 rounded-lg p-3">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="font-body text-sm flex-1">
                  Cupom <strong>{appliedCoupon.code}</strong> aplicado!
                  {appliedCoupon.discount_percent 
                    ? ` (${appliedCoupon.discount_percent}% off)`
                    : ` (R$ ${Number(appliedCoupon.discount_amount).toFixed(2)} off)`}
                </span>
                <Button variant="ghost" size="sm" onClick={removeCoupon}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button 
                  variant="outline" 
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game, index) => {
            const discount = game.is_free ? 0 : calculateDiscount(Number(game.price));
            const finalPrice = game.is_free ? 0 : getFinalPrice(Number(game.price));

            return (
            <div
              key={game.id}
              className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                  {game.thumbnail_url ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                      ?
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card sm:block hidden" />
                  
                  <div className="absolute top-3 left-3">
                    {game.is_free ? (
                      <span className="px-3 py-1 bg-primary/90 rounded font-display text-sm font-bold text-primary-foreground box-glow">
                        GRÁTIS
                      </span>
                    ) : discount > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 bg-destructive/90 rounded font-display text-xs font-bold text-destructive-foreground line-through">
                          R$ {Number(game.price).toFixed(2)}
                        </span>
                        <span className="px-3 py-1 bg-accent/90 rounded font-display text-sm font-bold text-accent-foreground box-glow-accent">
                          R$ {finalPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-accent/90 rounded font-display text-sm font-bold text-accent-foreground box-glow-accent">
                        R$ {Number(game.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-body uppercase tracking-wider text-primary">
                        {game.genre || 'Game'}
                      </span>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {game.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-body text-sm font-semibold">{Number(game.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="font-body text-sm text-muted-foreground mb-4 flex-1">
                    {game.description || 'Sem descrição disponível.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {game.file_size && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> {game.file_size}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatYear(game.created_at)}
                    </span>
                  </div>

                  <Button
                    variant={game.is_free ? "free" : "price"}
                    className="w-full"
                    onClick={() => handleDownload(game)}
                    disabled={purchasingGameId === game.id}
                  >
                    {purchasingGameId === game.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {game.is_free 
                      ? "Download Grátis" 
                      : discount > 0 
                        ? `Comprar - R$ ${finalPrice.toFixed(2)}`
                        : `Comprar - R$ ${Number(game.price).toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
};

export default DownloadsSection;
