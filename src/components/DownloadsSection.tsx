import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Star, Clock, HardDrive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const DownloadsSection = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingGameId, setPurchasingGameId] = useState<string | null>(null);
  const { toast } = useToast();

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
        window.open(data.fileUrl, '_blank');
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
        window.open(game.file_url, '_blank');
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
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            gameId: game.id,
            gameTitle: game.title,
            price: Number(game.price),
            returnUrl: window.location.origin + '/#downloads',
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game, index) => (
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
                    {game.is_free ? "Download Grátis" : `Comprar - R$ ${Number(game.price).toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadsSection;
