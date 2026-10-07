import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, getCountryByCode } from "@/lib/countries";
import { Loader2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

import serviceIcon from "@assets/20260311_214852_1773265973964.png";
import { getJohnDeereProductImage, ROBOTICSFUND_LOGO } from "@/lib/john-deere-assets";
import EmptyState from "@/components/empty-state";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
}

export default function InvestPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const { data: products, isLoading } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: "Produit acheté !", description: "Vos gains seront versés en une seule fois à la fin de la période." });
    },
    onError: (error: any) => {
      setConfirmProduct(null);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const balance     = parseFloat(user.balance || "0");
  const country     = getCountryByCode(user.country);
  const currency    = country?.currency || "FCFA";
  const paidProducts = products?.filter(p => !p.isFree) || [];
  const myProducts   = paidProducts.filter(p => p.isOwned);
  const displayed    = activeTab === "all" ? paidProducts : myProducts;

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f0f2f5" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shadow-sm"
        style={{ background: "linear-gradient(135deg, #367C2B 0%, #25591C 100%)" }}
      >
          <div className="flex items-center gap-2">
            <img src={ROBOTICSFUND_LOGO} alt="RoboticsFund" className="h-8 w-8 rounded-md object-contain" />
            <span className="text-white text-sm font-bold">RoboticsFund</span>
          </div>
        <button
          onClick={() => navigate("/service")}
          className="flex items-center justify-center"
          data-testid="button-service"
        >
          <img src={serviceIcon} alt="Service client" className="w-8 h-8 object-contain" />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className="px-5 py-2 rounded-full font-bold text-sm transition-all"
          style={{
            background: activeTab === "all"
              ? "linear-gradient(135deg, #367c2b, #25591c)"
              : "linear-gradient(135deg, #bbf7d0, #86efac)",
            color: activeTab === "all" ? "#fff" : "#15803d",
          }}
        >
          our products
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className="px-5 py-2 rounded-full font-bold text-sm transition-all"
          style={{
            background: activeTab === "mine"
              ? "linear-gradient(135deg, #367c2b, #25591c)"
              : "linear-gradient(135deg, #bbf7d0, #86efac)",
            color: activeTab === "mine" ? "#fff" : "#15803d",
          }}
        >
          my product
        </button>
      </div>

      {/* ── Product list ── */}
      <div className="flex-1 overflow-y-auto pb-24 px-3 space-y-3 pt-1">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
        ) : displayed.length > 0 ? (
          displayed.map((product, idx) => {
            const img = getJohnDeereProductImage(product.imageUrl, idx);
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden flex"
                data-testid={`product-card-${product.id}`}
              >
                {/* Left — product image */}
                <div className="shrink-0" style={{ width: 150, minHeight: 160 }}>
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: 160 }}
                  />
                </div>

                {/* Right — info */}
                <div className="flex-1 flex flex-col px-3 pt-3 pb-3 min-w-0">
                  {/* Name + Acheter */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-black text-gray-900 text-base leading-tight">{product.name}</p>
                    <button
                      onClick={() => setConfirmProduct(product)}
                      className="shrink-0 px-4 py-1.5 rounded-full text-white text-sm font-bold shadow"
                      style={{ background: "linear-gradient(135deg, #367c2b, #25591c)" }}
                      data-testid={`button-purchase-${product.id}`}
                    >
                      Acheter
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1 mt-auto">
                    {[
                      { label: "Prix unitaire",    value: `${currency} ${Number(product.price).toLocaleString("fr-FR")}` },
                      { label: "Validité",         value: `${product.cycleDays} Jours` },
                      { label: "Gain/jour (calcul)", value: `${currency} ${Number(product.dailyEarnings).toLocaleString("fr-FR")}` },
                      { label: "Gain à l’échéance", value: `${currency} ${Number(product.totalReturn).toLocaleString("fr-FR")}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">{label}</span>
                        <span className="font-bold text-[11px]" style={{ color: "var(--ton-green)" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
           <EmptyState className="text-center py-8 flex flex-col items-center gap-2">
            <p className="text-gray-400 text-sm">
              {activeTab === "mine" ? "Vous n'avez aucun produit actif" : "Aucun produit disponible"}
            </p>
           </EmptyState>
        )}
      </div>

      {/* ── Purchase confirm modal ── */}
      {confirmProduct && (() => {
        const prodIdx   = (products?.findIndex(p => p.id === confirmProduct.id) ?? 0);
        const prodImg   = getJohnDeereProductImage(confirmProduct.imageUrl, prodIdx);
        const shortage  = confirmProduct.price - balance;
        const daily     = Number(confirmProduct.dailyEarnings || 0);
        const total     = Number(confirmProduct.totalReturn  || daily * Number(confirmProduct.cycleDays || 90));
        const duration  = Number(confirmProduct.cycleDays || 90);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/60"
            onClick={() => setConfirmProduct(null)}
          >
            <div
              className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(160deg, #367c2b 0%, #25591c 100%)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Title block ── */}
              <div className="px-5 pt-6 pb-4">
                <p className="text-white font-extrabold text-2xl leading-tight">
                  {confirmProduct.name}
                </p>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">
                  Le gain journalier sert au calcul du total. Vos gains seront versés en une seule fois à la fin de la période.
                </p>
              </div>

              {/* ── Details row ── */}
              <div className="mx-5 mb-4 flex items-start gap-4">
                {/* Product image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border-2 border-white/20">
                  <img src={prodImg} alt={confirmProduct.name} className="w-full h-full object-cover" />
                </div>

                {/* Info list */}
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Prix",              value: `${currency} ${Number(confirmProduct.price).toLocaleString("fr-FR")}` },
                    { label: "Gain/jour (calcul)", value: `${currency} ${daily.toLocaleString("fr-FR")}` },
                    { label: "Gain à l’échéance",  value: `${currency} ${total.toLocaleString("fr-FR")}` },
                    { label: "Période de validité", value: `${duration} jours` },
                  ].map(row => (
                    <div key={row.label}>
                      <p className="text-white/60 text-[10px] leading-none">{row.label}</p>
                      <p className="text-white font-bold text-[13px] leading-tight">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Insufficient balance warning ── */}
              {shortage > 0 && (
                <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(220,50,50,0.22)", border: "1px solid rgba(255,100,100,0.35)" }}>
                  <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                  <p className="text-red-200 text-xs leading-snug">
                    Solde insuffisant. Il vous manque {currency} {shortage.toLocaleString("fr-FR")}.
                  </p>
                </div>
              )}

              {/* ── Buttons ── */}
              <div className="flex gap-3 px-5 pb-6">
                <button
                  onClick={() => setConfirmProduct(null)}
                  className="flex-1 py-3 rounded-2xl font-semibold text-white/80 text-sm active:opacity-70 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
                  data-testid="button-cancel-purchase"
                >
                  Annuler
                </button>
                <button
                  onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                  disabled={purchaseMutation.isPending}
                  className="flex-1 py-3 rounded-2xl font-bold text-white/90 text-sm flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
                  data-testid="button-confirm-purchase"
                >
                  {purchaseMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "Confirmer"
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
