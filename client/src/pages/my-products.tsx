import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

import { getJohnDeereProductImage } from "@/lib/john-deere-assets";
import "./my-products.css";

interface UserProduct {
  id: number;
  purchasedAt: string;
  daysRemaining: number;
  totalEarned: string | number;
  prepaidEarnings?: string | number;
  totalReturn?: string | number;
  status: string;
  product: Product | null;
}

function getPurchasedProductImage(imageUrl: string | null | undefined, index: number) {
  const image = imageUrl?.trim();
  if (image && image.startsWith("/") && !image.startsWith("//")) return image;

  if (image) {
    try {
      const parsed = new URL(image);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return image;
    } catch {
      // Use a local equipment image when the stored URL is malformed.
    }
  }

  return getJohnDeereProductImage(image, index);
}

export default function MyProductsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const {
    data: userProducts,
    isLoading: loadingUserProducts,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = country?.currency || "XOF";
  const currencyLabel = /^(XOF|XAF|FCFA)$/i.test(currency) ? "FCFA" : currency;
  const allUserProducts = userProducts || [];
  const formatAmount = (amount: number | string | null | undefined) => {
    const value = Number(amount);
    return Math.round(Number.isFinite(value) ? value : 0).toLocaleString("fr-FR");
  };
  const formatCurrency = (amount: number | string | null | undefined) =>
    `${currencyLabel} ${formatAmount(amount)}`;

  const formatPurchaseDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <main className="products-reference">
      <div className="products-screen">
        <header className="products-header">
          <button
            type="button"
            className="products-back"
            onClick={() => navigate("/")}
            aria-label="Retour à l’accueil"
          >
            <ChevronLeft aria-hidden="true" />
            <span>Retour</span>
          </button>
          <h1>Gains</h1>
          <span className="products-header-spacer" aria-hidden="true" />
        </header>

        <section className="product-list" aria-label="Produits achetés">
          {loadingUserProducts ? (
            <div className="products-loading" role="status" aria-label="Chargement des produits">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : productsError ? (
            <div className="products-error" role="alert">
              <p>Impossible de charger vos produits achetés.</p>
              <button
                className="products-retry"
                type="button"
                onClick={() => void refetchProducts()}
              >
                Réessayer
              </button>
            </div>
          ) : allUserProducts.length === 0 ? (
            <p className="products-empty">Plus de données</p>
          ) : (
            allUserProducts.map((up, index) => {
              const cycleDays = Number(up.product?.cycleDays) || 60;
              const daysRemaining = Number(up.daysRemaining) || 0;
              const daysCompleted = Math.max(0, Math.min(cycleDays, cycleDays - daysRemaining));
              const earnedSoFar = Number(up.totalEarned || 0);
              const prepaidEarnings = Number(up.prepaidEarnings || 0);
              const totalReturn = Number(up.totalReturn ?? up.product?.totalReturn ?? 0);
              const remainingAtMaturity = Math.max(0, totalReturn - prepaidEarnings);
              const productName = up.product?.name || "Produit acheté";

              return (
                <article
                  key={up.id}
                  className="purchased-product-card"
                  data-testid={`my-product-card-${up.id}`}
                  aria-label={`Revenus du produit ${productName}`}
                >
                  <div className="product-card-main">
                    <time className="purchase-date" dateTime={up.purchasedAt}>
                      {formatPurchaseDate(up.purchasedAt)}
                    </time>

                    <div className="product-metrics">
                      <div className="product-metric">
                        <strong>{formatCurrency(up.product?.dailyEarnings || 0)}</strong>
                        <span>Gain journalier calculé</span>
                      </div>
                      <div className="product-metric">
                        <strong>{formatCurrency(earnedSoFar)}</strong>
                        <span>Gains accumulés</span>
                      </div>
                    </div>

                    <div className="product-details">
                      <div className="product-image">
                        <img
                          src={getPurchasedProductImage(up.product?.imageUrl, index)}
                          alt={productName}
                          onError={event => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getJohnDeereProductImage(null, index);
                          }}
                        />
                      </div>
                      <div className="product-copy">
                        <h2 className="product-name">{productName}</h2>
                        <p className="product-duration">
                          Durée : {daysCompleted}/{cycleDays} Jours
                        </p>
                      </div>
                    </div>
                  </div>
                  <footer className="product-received">
                    {up.status === "active"
                      ? `Versement unique à l’échéance : ${formatCurrency(remainingAtMaturity)}`
                      : `Gains totaux du produit : ${formatCurrency(totalReturn)}`}
                    {prepaidEarnings > 0 && (
                      <span> · Déjà versés avant la bascule : {formatCurrency(prepaidEarnings)}</span>
                    )}
                  </footer>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
