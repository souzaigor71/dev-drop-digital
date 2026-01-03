import { useState, useEffect, useCallback } from "react";
import { Heart, Copy, Check, ArrowLeft, Users, Sparkles, Trophy, Crown, Star, Medal, Award, Target, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const suggestedAmounts = [
  { value: 5, label: "Café ☕", description: "Ajuda a manter a energia!" },
  { value: 10, label: "Lanche 🍕", description: "Uma refeição pro dev" },
  { value: 25, label: "Apoiador 💪", description: "Apoio significativo" },
  { value: 50, label: "Fã 🌟", description: "Você é incrível!" },
  { value: 100, label: "Patrono 👑", description: "Apoio premium" },
];

// Fundraising goals configuration
const FUNDRAISING_GOALS = [
  { target: 500, label: "Meta Inicial", description: "Equipamentos básicos", icon: "🎯" },
  { target: 1000, label: "Meta Bronze", description: "Novo projeto de jogo", icon: "🥉" },
  { target: 2500, label: "Meta Prata", description: "Recursos avançados", icon: "🥈" },
  { target: 5000, label: "Meta Ouro", description: "Jogo completo", icon: "🏆" },
];

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  created_at: string;
}

interface TopSupporter {
  name: string;
  total: number;
  rank: number;
}

const getBadgeForRank = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/20", label: "👑 Lendário" };
    case 2:
      return { icon: Medal, color: "text-gray-300", bg: "bg-gray-300/20", label: "🥈 Épico" };
    case 3:
      return { icon: Award, color: "text-amber-600", bg: "bg-amber-600/20", label: "🥉 Raro" };
    default:
      return { icon: Star, color: "text-primary", bg: "bg-primary/20", label: "⭐ Apoiador" };
  }
};

const getBadgeForAmount = (amount: number) => {
  if (amount >= 500) return { label: "💎 Diamante", color: "text-cyan-400", bg: "bg-cyan-400/20" };
  if (amount >= 200) return { label: "🔮 Platina", color: "text-purple-400", bg: "bg-purple-400/20" };
  if (amount >= 100) return { label: "🏆 Ouro", color: "text-yellow-400", bg: "bg-yellow-400/20" };
  if (amount >= 50) return { label: "🥈 Prata", color: "text-gray-300", bg: "bg-gray-300/20" };
  if (amount >= 25) return { label: "🥉 Bronze", color: "text-amber-600", bg: "bg-amber-600/20" };
  return { label: "💚 Apoiador", color: "text-primary", bg: "bg-primary/20" };
};

const fireConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
    });
  }, 250);
};

const Support = () => {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [topSupporters, setTopSupporters] = useState<TopSupporter[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationName, setDonationName] = useState("");
  const [donationEmail, setDonationEmail] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pixKey = "66e61cc3-0bf0-4964-a20e-d9e5ebeb810b";

  const currentGoal = FUNDRAISING_GOALS.find(g => totalRaised < g.target) || FUNDRAISING_GOALS[FUNDRAISING_GOALS.length - 1];
  const previousGoal = FUNDRAISING_GOALS[FUNDRAISING_GOALS.findIndex(g => g.target === currentGoal.target) - 1];
  const progressBase = previousGoal?.target || 0;
  const progressPercentage = Math.min(100, ((totalRaised - progressBase) / (currentGoal.target - progressBase)) * 100);

  const fetchDonations = useCallback(async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setDonations(data);
    }
  }, []);

  const fetchTotalRaised = useCallback(async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("amount");

    if (!error && data) {
      const total = data.reduce((sum, d) => sum + d.amount, 0);
      setTotalRaised(total);
    }
  }, []);

  const fetchTopSupporters = useCallback(async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("name, amount")
      .eq("is_public", true);

    if (!error && data) {
      const totals = data.reduce((acc, donation) => {
        acc[donation.name] = (acc[donation.name] || 0) + donation.amount;
        return acc;
      }, {} as Record<string, number>);

      const sorted = Object.entries(totals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      setTopSupporters(sorted);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    fetchTopSupporters();
    fetchTotalRaised();

    // Subscribe to realtime donations
    const channel = supabase
      .channel('donations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
        },
        (payload) => {
          console.log('New donation received:', payload);
          const newDonation = payload.new as Donation;
          
          // Show toast notification
          toast.success(
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>
                <strong>{newDonation.name}</strong> acabou de doar{" "}
                <strong>R$ {newDonation.amount.toFixed(2)}</strong>! 🎉
              </span>
            </div>,
            { duration: 5000 }
          );

          // Fire confetti for any new donation
          fireConfetti();

          // Update state
          setDonations((prev) => [newDonation, ...prev.slice(0, 19)]);
          setTotalRaised((prev) => prev + newDonation.amount);
          fetchTopSupporters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDonations, fetchTopSupporters, fetchTotalRaised]);

  const generatePixPayload = (amount?: number) => {
    return pixKey;
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDonation = async () => {
    if (!donationName.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Por favor, informe o valor doado");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("donations").insert({
      name: donationName.trim(),
      amount: parseFloat(donationAmount),
      message: donationMessage.trim() || null,
      is_public: isPublic,
    });

    if (error) {
      toast.error("Erro ao registrar doação");
    } else {
      // Fire confetti!
      fireConfetti();
      
      toast.success("Obrigado pela sua doação! 💚");
      
      // Send thank you email if email provided
      if (donationEmail.trim()) {
        try {
          await supabase.functions.invoke("send-donation-thanks", {
            body: {
              name: donationName.trim(),
              email: donationEmail.trim(),
              amount: parseFloat(donationAmount),
            },
          });
        } catch (emailError) {
          console.error("Error sending thank you email:", emailError);
        }
      }
      
      setDonationName("");
      setDonationEmail("");
      setDonationAmount("");
      setDonationMessage("");
      setShowDonationForm(false);
    }
    setIsSubmitting(false);
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

        {/* Fundraising Goal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/10 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  <CardTitle className="font-display text-xl">Meta de Arrecadação</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    R$ {totalRaised.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    de R$ {currentGoal.target.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentGoal.icon} {currentGoal.label}</span>
                  <span className="font-medium text-foreground">{progressPercentage.toFixed(0)}%</span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ originX: 0 }}
                >
                  <Progress value={progressPercentage} className="h-4" />
                </motion.div>
                <p className="text-xs text-muted-foreground">{currentGoal.description}</p>
              </div>

              {/* Goal milestones */}
              <div className="flex flex-wrap gap-2 pt-2">
                {FUNDRAISING_GOALS.map((goal, index) => {
                  const isCompleted = totalRaised >= goal.target;
                  const isCurrent = goal.target === currentGoal.target;
                  
                  return (
                    <motion.div
                      key={goal.target}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                        isCompleted 
                          ? 'bg-primary/20 text-primary' 
                          : isCurrent 
                            ? 'bg-yellow-400/20 text-yellow-400 animate-pulse' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <span>{goal.icon}</span>
                      <span>R$ {goal.target}</span>
                      {isCompleted && <Check className="w-3 h-3" />}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Supporters Ranking */}
        {topSupporters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <CardTitle className="font-display text-xl">Top Apoiadores</CardTitle>
                </div>
                <CardDescription>Os heróis que mais contribuíram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {topSupporters.map((supporter, index) => {
                    const badge = getBadgeForRank(supporter.rank);
                    const amountBadge = getBadgeForAmount(supporter.total);
                    const BadgeIcon = badge.icon;
                    
                    return (
                      <motion.div
                        key={supporter.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="relative"
                      >
                        <Card className={`${badge.bg} border-2 ${supporter.rank === 1 ? 'border-yellow-400/50' : supporter.rank === 2 ? 'border-gray-300/50' : supporter.rank === 3 ? 'border-amber-600/50' : 'border-primary/30'} min-w-[140px]`}>
                          <CardContent className="p-4 text-center">
                            <motion.div
                              animate={supporter.rank === 1 ? { rotate: [0, 5, -5, 0] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <BadgeIcon className={`w-8 h-8 ${badge.color} mx-auto mb-2`} />
                            </motion.div>
                            <p className="font-display font-bold text-foreground truncate max-w-[120px]">
                              {supporter.name}
                            </p>
                            <p className={`text-xs font-medium ${badge.color} mb-1`}>
                              {badge.label}
                            </p>
                            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${amountBadge.bg} ${amountBadge.color}`}>
                              {amountBadge.label}
                            </div>
                            <p className="text-lg font-bold text-primary mt-2">
                              R$ {supporter.total.toFixed(0)}
                            </p>
                          </CardContent>
                        </Card>
                        {supporter.rank <= 3 && (
                          <motion.div
                            className="absolute -top-2 -right-2 text-2xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {supporter.rank === 1 ? "👑" : supporter.rank === 2 ? "🥈" : "🥉"}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* QR Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <motion.div
                  className="flex items-center justify-center gap-2 text-primary mb-2"
                  animate={selectedAmount ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className="w-6 h-6 fill-primary" />
                </motion.div>
                <CardTitle className="font-display">QR Code PIX</CardTitle>
                <CardDescription>
                  Escaneie com o app do seu banco
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <motion.div
                  className="bg-white p-4 rounded-xl shadow-lg"
                  animate={selectedAmount ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <QRCodeSVG
                    value={generatePixPayload(selectedAmount ?? undefined)}
                    size={180}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {selectedAmount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center"
                    >
                      <p className="text-sm text-muted-foreground">Valor sugerido:</p>
                      <motion.p
                        key={selectedAmount}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-bold text-primary"
                      >
                        R$ {selectedAmount.toFixed(2)}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* Register donation button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDonationForm(!showDonationForm)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Já doei! Registrar no mural
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggested Amounts */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="font-display text-xl font-bold text-foreground">
              Escolha um valor
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione um valor sugerido ou doe qualquer quantia
            </p>

            <div className="grid gap-3">
              {suggestedAmounts.map((amount, index) => (
                <motion.div
                  key={amount.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedAmount === amount.value
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                        : "border-border hover:border-primary/50"
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
                      <motion.p
                        className="font-display text-xl font-bold text-primary"
                        animate={selectedAmount === amount.value ? { scale: [1, 1.1, 1] } : {}}
                      >
                        R$ {amount.value}
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Clear selection */}
            <AnimatePresence>
              {selectedAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setSelectedAmount(null)}
                  >
                    Limpar seleção
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Donation Form */}
            <AnimatePresence>
              {showDonationForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Registrar Doação</CardTitle>
                      <CardDescription>
                        Deixe seu nome no mural de apoiadores
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Seu nome *</Label>
                        <Input
                          id="name"
                          placeholder="Como quer ser chamado?"
                          value={donationName}
                          onChange={(e) => setDonationName(e.target.value)}
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Seu email (para agradecimento)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={donationEmail}
                          onChange={(e) => setDonationEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Valor doado (R$) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          min="1"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem (opcional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Deixe uma mensagem..."
                          value={donationMessage}
                          onChange={(e) => setDonationMessage(e.target.value)}
                          maxLength={200}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="public"
                          checked={isPublic}
                          onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                        />
                        <Label htmlFor="public" className="text-sm">
                          Mostrar no mural público
                        </Label>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSubmitDonation}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Registrando..." : "Registrar Doação 🎉"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thank you message */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                </motion.div>
                <p className="text-sm text-foreground">
                  Cada contribuição nos ajuda a continuar criando jogos incríveis. <strong>Muito obrigado!</strong> 💚
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Supporters Wall */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Mural de Apoiadores
              </h2>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="ml-auto"
              >
                <Bell className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground">
              Nossos heróis que tornaram isso possível • Atualizações em tempo real
            </p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {donations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Seja o primeiro a aparecer no mural!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                donations.map((donation, index) => {
                  const amountBadge = getBadgeForAmount(donation.amount);
                  return (
                    <motion.div
                      key={donation.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                    >
                      <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-display font-bold text-foreground truncate">
                                  {donation.name}
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${amountBadge.bg} ${amountBadge.color}`}>
                                  {amountBadge.label}
                                </span>
                              </div>
                              {donation.message && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  "{donation.message}"
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(donation.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div className="bg-primary/10 px-3 py-1 rounded-full shrink-0">
                              <p className="text-sm font-bold text-primary">
                                R$ {donation.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Support;
