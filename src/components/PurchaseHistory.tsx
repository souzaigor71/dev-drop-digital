import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ShoppingBag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Purchase {
  id: string;
  game_id: string;
  price_paid: number;
  coupon_code: string | null;
  discount_amount: number;
  created_at: string;
  games: {
    title: string;
    thumbnail_url: string | null;
    file_url: string | null;
  } | null;
}

const PurchaseHistory = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchPurchases();
    }
  }, [open, user]);

  const fetchPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        games (
          title,
          thumbnail_url,
          file_url
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPurchases(data as Purchase[]);
    }
    setLoading(false);
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Minhas Compras</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Histórico de Compras
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não fez nenhuma compra.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  {purchase.games?.thumbnail_url ? (
                    <img
                      src={purchase.games.thumbnail_url}
                      alt={purchase.games?.title || 'Game'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-foreground truncate">
                    {purchase.games?.title || 'Jogo removido'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-semibold">
                      R$ {Number(purchase.price_paid).toFixed(2)}
                    </span>
                    {purchase.coupon_code && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Cupom: {purchase.coupon_code}
                      </span>
                    )}
                  </div>
                </div>
                {purchase.games?.file_url && (
                  <Button
                    variant="gaming"
                    size="sm"
                    onClick={() => triggerDownload(purchase.games!.file_url!, purchase.games!.title)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseHistory;
