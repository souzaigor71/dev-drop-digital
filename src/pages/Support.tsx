import { useState, useEffect } from "react";
import { Heart, Copy, Check, ArrowLeft, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const suggestedAmounts = [
  { value: 5, label: "Café ☕", description: "Ajuda a manter a energia!" },
  { value: 10, label: "Lanche 🍕", description: "Uma refeição pro dev" },
  { value: 25, label: "Apoiador 💪", description: "Apoio significativo" },
  { value: 50, label: "Fã 🌟", description: "Você é incrível!" },
  { value: 100, label: "Patrono 👑", description: "Apoio premium" },
];

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  created_at: string;
}

const Support = () => {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationName, setDonationName] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pixKey = "66e61cc3-0bf0-4964-a20e-d9e5ebeb810b";

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setDonations(data);
    }
  };

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
      toast.success("Obrigado pela sua doação! 💚");
      setDonationName("");
      setDonationAmount("");
      setDonationMessage("");
      setShowDonationForm(false);
      fetchDonations();
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
                        <Label htmlFor="name">Seu nome</Label>
                        <Input
                          id="name"
                          placeholder="Como quer ser chamado?"
                          value={donationName}
                          onChange={(e) => setDonationName(e.target.value)}
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Valor doado (R$)</Label>
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
                        {isSubmitting ? "Registrando..." : "Registrar Doação"}
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
            </div>
            <p className="text-sm text-muted-foreground">
              Nossos heróis que tornaram isso possível
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
                donations.map((donation, index) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-foreground truncate">
                              {donation.name}
                            </p>
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
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Support;
