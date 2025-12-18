import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Ticket, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Game {
  id: string;
  title: string;
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
  created_at: string;
  game_id: string | null;
  games?: { title: string } | null;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    discount_amount: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
    game_id: '',
  });

  useEffect(() => {
    fetchCoupons();
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const { data } = await supabase.from('games').select('id, title').order('title');
    if (data) setGames(data);
  };

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*, games(title)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percent: '',
      discount_amount: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
      game_id: '',
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent?.toString() || '',
      discount_amount: coupon.discount_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
      game_id: coupon.game_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code) {
      toast({ title: "Erro", description: "Código é obrigatório", variant: "destructive" });
      return;
    }

    if (!formData.discount_percent && !formData.discount_amount) {
      toast({ title: "Erro", description: "Informe desconto em % ou valor fixo", variant: "destructive" });
      return;
    }

    setSaving(true);

    const couponData = {
      code: formData.code.toUpperCase(),
      discount_percent: formData.discount_percent ? Number(formData.discount_percent) : null,
      discount_amount: formData.discount_amount ? Number(formData.discount_amount) : null,
      max_uses: formData.max_uses ? Number(formData.max_uses) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
      game_id: formData.game_id || null,
    };

    let error;
    if (editingCoupon) {
      const result = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', editingCoupon.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('coupons')
        .insert([couponData]);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: editingCoupon ? "Cupom atualizado!" : "Cupom criado!" });
      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cupom excluído" });
      fetchCoupons();
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (!error) {
      fetchCoupons();
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
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Cupons de Desconto</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gaming">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código do Cupom</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="EX: DESCONTO10"
                  className="uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value, discount_amount: '' })}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value, discount_percent: '' })}
                    placeholder="5.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Máximo de Usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Expira em</Label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Cupom Ativo</Label>
              </div>
              <div>
                <Label>Jogo Específico (opcional)</Label>
                <Select
                  value={formData.game_id}
                  onValueChange={(value) => setFormData({ ...formData, game_id: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os jogos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os jogos</SelectItem>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>{game.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full" variant="gaming">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingCoupon ? 'Atualizar' : 'Criar Cupom'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-lg border ${coupon.is_active ? 'border-primary/50 bg-card' : 'border-border bg-muted/30 opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-2 rounded">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{coupon.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {coupon.discount_percent
                        ? `${coupon.discount_percent}% de desconto`
                        : `R$ ${Number(coupon.discount_amount).toFixed(2)} de desconto`}
                      {coupon.games?.title && (
                        <span className="ml-2 text-primary">• {coupon.games.title}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground mr-4">
                    <p>Usos: {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</p>
                    {coupon.expires_at && (
                      <p>Expira: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={() => toggleActive(coupon)}
                  />
                  <Button variant="outline" size="icon" onClick={() => handleEdit(coupon)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
