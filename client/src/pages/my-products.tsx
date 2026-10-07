import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { Info, Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";

import { getJohnDeereProductImage } from "@/lib/john-deere-assets";
import EmptyState from "@/components/empty-state";
import "./my-products.css";

interface UserProduct {
  id: number;
  purchasedAt: string;
  daysRemaining: number;
  totalEarned: string | number;
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
  const totalUserEarnings = Math.round(Number(user.totalEarnings || 0));
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
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <main className="products-reference">
      <div className="products-screen">
        <header className="products-total" aria-label="Revenus totaux">
          <p className="products-total-value">{formatCurrency(totalUserEarnings)}</p>
          <h1>Revenus totaux</h1>
        </header>

        <aside className="revenue-notice" aria-label="Informations sur les revenus">
          <p className="revenue-notice-primary">
            <Info aria-hidden="true" />
            <span>Les revenus des produits sont réglés toutes les 24 heures</span>
          </p>
          <p className="revenue-notice-secondary">
            Vous pouvez acheter plusieurs appareils pour augmenter vos revenus
          </p>
        </aside>

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
            <EmptyState className="products-empty">
              <p>Aucun produit RoboticsFund</p>
              <p className="text-sm text-gray-400">Achetez des produits pour commencer à gagner</p>
            </EmptyState>
          ) : (
            allUserProducts.map((up, index) => {
              const cycleDays = Number(up.product?.cycleDays) || 60;
              const daysRemaining = Number(up.daysRemaining) || 0;
              const daysCompleted = Math.max(0, Math.min(cycleDays, cycleDays - daysRemaining));
              const earnedSoFar = Number(up.totalEarned || 0);
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
                        <span>Revenus quotidiens</span>
                      </div>
                      <div className="product-metric">
                        <strong>{formatCurrency(earnedSoFar)}</strong>
                        <span>Revenus totaux</span>
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
                    Revenus reçus : {formatCurrency(earnedSoFar)}
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
