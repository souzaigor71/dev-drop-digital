import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, Ticket, TrendingUp, Package, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Purchase {
  id: string;
  game_id: string;
  user_id: string;
  price_paid: number;
  discount_amount: number | null;
  coupon_code: string | null;
  created_at: string;
  games: {
    title: string;
  } | null;
}

interface CouponUsage {
  code: string;
  uses: number;
  totalDiscount: number;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const AdminSalesReport = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: purchasesData, error } = await supabase
      .from('purchases')
      .select(`
        *,
        games(title)
      `)
      .order('created_at', { ascending: false });

    if (!error && purchasesData) {
      setPurchases(purchasesData);
    }
    setLoading(false);
  };

  const getFilteredPurchases = useMemo(() => {
    if (periodFilter === 'all') return purchases;

    const now = new Date();
    let startDate: Date;

    switch (periodFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return purchases;
    }

    return purchases.filter(p => new Date(p.created_at) >= startDate);
  }, [purchases, periodFilter]);

  const couponUsage = useMemo(() => {
    const couponMap = new Map<string, CouponUsage>();
    getFilteredPurchases.forEach((p) => {
      if (p.coupon_code) {
        const existing = couponMap.get(p.coupon_code);
        if (existing) {
          existing.uses += 1;
          existing.totalDiscount += Number(p.discount_amount) || 0;
        } else {
          couponMap.set(p.coupon_code, {
            code: p.coupon_code,
            uses: 1,
            totalDiscount: Number(p.discount_amount) || 0,
          });
        }
      }
    });
    return Array.from(couponMap.values()).sort((a, b) => b.uses - a.uses);
  }, [getFilteredPurchases]);

  const totalRevenue = getFilteredPurchases.reduce((sum, p) => sum + Number(p.price_paid), 0);
  const totalDiscount = getFilteredPurchases.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
  const purchasesWithCoupon = getFilteredPurchases.filter(p => p.coupon_code).length;

  const exportToCSV = () => {
    const headers = ['Data', 'Jogo', 'Cupom', 'Desconto', 'Valor Pago'];
    const rows = getFilteredPurchases.map(p => [
      new Date(p.created_at).toLocaleDateString('pt-BR'),
      p.games?.title || 'Jogo removido',
      p.coupon_code || '-',
      p.discount_amount ? `R$ ${Number(p.discount_amount).toFixed(2)}` : '-',
      `R$ ${Number(p.price_paid).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getPeriodLabel = (period: PeriodFilter) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Última Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      default: return 'Todo Período';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Relatório de Vendas</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={getFilteredPurchases.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="font-display text-xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendas Totais</p>
              <p className="font-display text-xl font-bold">{getFilteredPurchases.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/20 p-2 rounded">
              <TrendingUp className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descontos Dados</p>
              <p className="font-display text-xl font-bold">R$ {totalDiscount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cupons Usados</p>
              <p className="font-display text-xl font-bold">{purchasesWithCoupon}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Usage */}
      {couponUsage.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-display text-lg font-bold mb-4">Uso de Cupons</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Cupom</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Usos</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Desconto Total</th>
                </tr>
              </thead>
              <tbody>
                {couponUsage.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-border/50">
                    <td className="py-2 px-3 font-mono text-sm">{coupon.code}</td>
                    <td className="py-2 px-3 text-center">{coupon.uses}</td>
                    <td className="py-2 px-3 text-right text-destructive">R$ {coupon.totalDiscount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Purchases */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-display text-lg font-bold mb-4">Vendas Recentes</h3>
        {getFilteredPurchases.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma venda registrada neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Jogo</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Cupom</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Desconto</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Valor Pago</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 text-sm">
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-sm font-medium">
                      {purchase.games?.title || 'Jogo removido'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {purchase.coupon_code ? (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-mono">
                          {purchase.coupon_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-sm text-destructive">
                      {purchase.discount_amount ? `R$ ${Number(purchase.discount_amount).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-sm font-medium text-primary">
                      R$ {Number(purchase.price_paid).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesReport;