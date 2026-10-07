import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { JOHN_DEERE_PRODUCT_IMAGES } from "@/lib/john-deere-assets";
import depositIcon from "@assets/6_1790677909266.png";
import withdrawalIcon from "@assets/withdraw-icon-DFsum39V_(1)_1790692014343.png";
import checkinIcon from "@assets/téléchargement_(13)_1790692014386.png";
import serviceIcon from "@assets/2-2_1790677909350.png";
import EmptyState from "@/components/empty-state";

type HomeProduct = Product & {
  canClaimFree?: boolean;
};

type HomeQuickAction = {
  label: string;
  path: string;
  image: string;
  whiteIcon?: boolean;
};

const quickActions: HomeQuickAction[] = [
  { label: "Recharger", image: depositIcon, path: "/deposit" },
  { label: "Retirer", image: withdrawalIcon, whiteIcon: true, path: "/withdrawal" },
  { label: "Service", image: serviceIcon, path: "/service" },
  { label: "S’identifier", image: checkinIcon, whiteIcon: true, path: "/checkin" },
];

const formatFcfa = (amount: number) =>
  `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

export default function HomeDashboard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmProduct, setConfirmProduct] = useState<HomeProduct | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<HomeProduct[]>({
    queryKey: ["/api/products"],
    enabled: Boolean(user),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (product: HomeProduct) => {
      const response = await apiRequest("POST", `/api/products/${product.id}/purchase`, {});
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/user/products"] }),
        refreshUser(),
      ]);
      setConfirmProduct(null);
      toast({
        title: "Produit acheté !",
        description: "Vous commencerez à recevoir des gains demain.",
      });
    },
    onError: (error: Error) => {
      setConfirmProduct(null);
      toast({
        title: "Achat impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const visibleProducts = products.filter((product) => product.isActive);

  if (!user) return null;

  return (
      <main className="john-deere-home">
        <style>{`
          .john-deere-home {
            min-height: 100vh;
            padding: 18px 0 100px;
            background: #f2f2f2;
            color: #202124;
            font-family: Inter, Arial, sans-serif;
          }
          .john-deere-home,
          .john-deere-home * {
            box-sizing: border-box;
          }
          .john-deere-home .home-screen {
            width: 100%;
            max-width: 512px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .john-deere-home .home-hero {
            display: block;
            width: 100%;
            aspect-ratio: 1.98 / 1;
            overflow: hidden;
            border-radius: 8px;
            background: #0b1733;
          }
          .john-deere-home .home-hero img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
          }
          .john-deere-home .home-actions {
            display: grid;
            width: 100%;
            height: 116px;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            align-items: center;
            margin-top: 12px;
            border-radius: 14px;
            background: #086b2d;
            box-shadow: 0 2px 3px rgba(0, 0, 0, .12);
          }
          .john-deere-home .home-action {
            display: flex;
            min-width: 0;
            height: 100%;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 11px;
            border: 0;
            padding: 0 3px;
            background: transparent;
            color: #fff;
            cursor: pointer;
            font: inherit;
            -webkit-tap-highlight-color: transparent;
          }
          .john-deere-home .home-action:active {
            background: rgba(255, 255, 255, .1);
          }
          .john-deere-home .home-action:focus-visible,
          .john-deere-home .product-buy:focus-visible {
            outline: 3px solid #ffde00;
            outline-offset: -4px;
          }
          .john-deere-home .home-action-icon {
            width: 40px;
            height: 38px;
            flex: 0 0 auto;
            object-fit: contain;
            filter: grayscale(1) sepia(1) saturate(2.4) hue-rotate(55deg) brightness(.96) contrast(1.1);
          }
          .john-deere-home .home-action-icon.home-action-icon-white {
            filter: brightness(0) invert(1);
          }
          .john-deere-home .home-action-label {
            max-width: 100%;
            overflow: hidden;
            font-size: 13px;
            font-weight: 400;
            line-height: 1.1;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .john-deere-home .product-buy {
            display: flex;
            width: 100%;
            min-width: 0;
            align-items: center;
            justify-content: center;
            gap: 9px;
            border: 0;
            border-radius: 6px;
            background: #086b2d;
            color: white;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            line-height: 1;
            transition: background-color .15s ease, transform .12s ease;
            -webkit-tap-highlight-color: transparent;
          }
          .john-deere-home .product-buy:hover {
            background: #075a27;
          }
          .john-deere-home .product-buy:active {
            transform: scale(.99);
            background: #064c21;
          }
          .john-deere-home .product-buy:disabled {
            cursor: wait;
            opacity: .75;
          }
          .home-purchase-modal {
            width: min(390px, calc(100vw - 40px));
            max-height: calc(100dvh - 32px);
            overflow-y: auto;
            border: 0;
            border-radius: 7px;
            padding: 0;
            background: #fff;
            color: #202124;
            box-shadow: 0 12px 36px rgba(0, 0, 0, .22);
            outline: none;
          }
          .home-purchase-modal-title {
            margin: 0;
            padding: 17px 18px 15px;
            border-bottom: 1px solid #e4e4e4;
            color: #222;
            font-size: 25px;
            font-weight: 400;
            line-height: 1.25;
            text-align: center;
            overflow-wrap: anywhere;
          }
          .home-purchase-modal-question {
            margin: 0;
            padding: 27px 30px 16px;
            color: #4c8758;
            font-size: 17px;
            line-height: 1.55;
            text-align: left;
          }
          .home-purchase-modal-details {
            display: grid;
            gap: 8px;
            padding: 0 30px 25px;
            color: #4c8758;
            font-size: 17px;
            line-height: 1.35;
          }
          .home-purchase-modal-detail {
            display: flex;
            align-items: baseline;
            gap: 7px;
            overflow-wrap: anywhere;
          }
          .home-purchase-modal-bullet {
            flex: 0 0 auto;
            color: #368b55;
            font-size: 21px;
            line-height: 1;
          }
          .home-purchase-modal-actions {
            display: grid;
            min-height: 80px;
            grid-template-columns: 1fr 1fr;
            border-top: 1px solid #e4e4e4;
          }
          .home-purchase-modal-action {
            display: flex;
            min-width: 0;
            align-items: center;
            justify-content: center;
            border: 0;
            background: #fff;
            color: #171717;
            cursor: pointer;
            font: inherit;
            font-size: 23px;
            font-weight: 400;
          }
          .home-purchase-modal-action + .home-purchase-modal-action {
            border-left: 1px solid #e4e4e4;
            color: #3789c7;
          }
          .home-purchase-modal-action:focus-visible {
            outline: 3px solid #367c2b;
            outline-offset: -4px;
          }
          .home-purchase-modal-action:disabled {
            cursor: wait;
            opacity: .65;
          }
          @media (max-width: 390px) {
            .home-purchase-modal-title { font-size: 22px; }
            .home-purchase-modal-question,
            .home-purchase-modal-details {
              padding-right: 22px;
              padding-left: 22px;
              font-size: 16px;
            }
            .home-purchase-modal-actions { min-height: 68px; }
            .home-purchase-modal-action { font-size: 20px; }
          }
          .john-deere-home .product-empty,
          .john-deere-home .product-loading {
            display: grid;
            min-height: 140px;
            place-items: center;
            border-radius: 18px;
            padding: 18px;
            background: #fff;
            color: #28633a;
            font-size: 14px;
            text-align: center;
          }
          @media (max-width: 390px) {
            .john-deere-home .home-screen {
              padding-right: 14px;
              padding-left: 14px;
            }
            .john-deere-home .home-actions {
              height: 108px;
            }
            .john-deere-home .home-action-label {
              font-size: 12px;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .john-deere-home .product-buy,
            .john-deere-home .home-action {
              transition: none;
            }
          }
          .john-deere-home .product-list {
            display: grid;
            gap: 14px;
            margin-top: 14px;
          }
          .john-deere-home .product-list-card {
            display: grid;
            min-width: 0;
            gap: 12px;
            border: 1px solid #e4e9df;
            border-radius: 16px;
            padding: 12px;
            background: #fff;
            box-shadow: 0 5px 15px rgba(26, 55, 29, .09);
          }
          .john-deere-home .product-list-main {
            display: grid;
            min-width: 0;
            min-height: 138px;
            grid-template-columns: minmax(105px, 37%) minmax(0, 1fr);
            gap: 12px;
          }
          .john-deere-home .product-list-photo {
            min-width: 0;
            min-height: 138px;
            overflow: hidden;
            border-radius: 11px;
            background: #f3f5ee;
          }
          .john-deere-home .product-list-image {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 138px;
            object-fit: cover;
            object-position: center;
          }
          .john-deere-home .product-list-info {
            display: flex;
            min-width: 0;
            flex-direction: column;
            justify-content: center;
            gap: 12px;
          }
          .john-deere-home .product-list-heading {
            display: flex;
            min-width: 0;
            align-items: flex-start;
            justify-content: space-between;
            gap: 6px;
          }
          .john-deere-home .product-list-name {
            display: -webkit-box;
            min-width: 0;
            overflow: hidden;
            color: #202124;
            font-size: 16px;
            font-weight: 750;
            line-height: 1.2;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }
          .john-deere-home .product-list-cycle {
            flex: 0 0 auto;
            border-radius: 0 10px 0 10px;
            padding: 6px 8px;
            background: #367c2b;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
            white-space: nowrap;
          }
          .john-deere-home .product-list-metrics {
            display: grid;
            min-width: 0;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }
          .john-deere-home .product-list-metric {
            display: flex;
            min-width: 0;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            border-radius: 9px;
            padding: 8px 7px;
            background: #f4f5f1;
          }
          .john-deere-home .product-list-metric strong {
            color: #28633a;
            font-size: clamp(11px, 3.3vw, 16px);
            font-weight: 800;
            line-height: 1.1;
            overflow-wrap: anywhere;
          }
          .john-deere-home .product-list-metric span {
            color: #555c55;
            font-size: 10px;
            line-height: 1.15;
          }
          .john-deere-home .product-list-footer {
            display: grid;
            min-width: 0;
            grid-template-columns: minmax(0, .85fr) minmax(135px, 1.15fr);
            align-items: center;
            gap: 10px;
            border-top: 1px solid #edf0e9;
            padding-top: 11px;
          }
          .john-deere-home .product-list-price {
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 2px;
          }
          .john-deere-home .product-list-price span {
            color: #666c66;
            font-size: 11px;
            line-height: 1.1;
          }
          .john-deere-home .product-list-price strong {
            color: #176c37;
            font-size: clamp(15px, 4.1vw, 21px);
            font-weight: 800;
            line-height: 1.15;
            overflow-wrap: anywhere;
          }
          .john-deere-home .product-list .product-buy {
            min-height: 46px;
            border-radius: 999px;
            padding: 0 11px;
            background: #086b2d;
            font-size: 13px;
            font-weight: 700;
          }
          .john-deere-home .product-list .product-buy:hover {
            background: #075a27;
          }
          .john-deere-home .product-list .product-buy:active {
            background: #064c21;
          }
          @media (max-width: 390px) {
            .john-deere-home .product-list-main {
              min-height: 124px;
              grid-template-columns: minmax(96px, 36%) minmax(0, 1fr);
              gap: 9px;
            }
            .john-deere-home .product-list-photo,
            .john-deere-home .product-list-image {
              min-height: 124px;
            }
            .john-deere-home .product-list-info {
              gap: 9px;
            }
            .john-deere-home .product-list-metrics {
              gap: 5px;
            }
            .john-deere-home .product-list-metric {
              padding: 7px 5px;
            }
            .john-deere-home .product-list-metric span {
              font-size: 9px;
            }
            .john-deere-home .product-list-footer {
              grid-template-columns: minmax(0, .78fr) minmax(130px, 1.22fr);
              gap: 7px;
            }
            .john-deere-home .product-list .product-buy {
              padding: 0 8px;
              font-size: 12px;
            }
          }
        `}</style>

        <div className="home-screen">
          <section className="home-hero" aria-label="RoboticsFund">
            <img src="/roboticsfund-logo.jpg" alt="RoboticsFund, automatisation industrielle et robotique" />
          </section>

          <section className="home-actions" aria-label="Actions rapides">
            {quickActions.map(({ label, image, whiteIcon, path }) => (
              <button
                key={label}
                type="button"
                className="home-action"
                onClick={() => navigate(path)}
                aria-label={label}
              >
                <img
                  className={`home-action-icon${whiteIcon ? " home-action-icon-white" : ""}`}
                  src={image}
                  alt=""
                  aria-hidden="true"
                />
                <span className="home-action-label">{label}</span>
              </button>
            ))}
          </section>

          <section className="product-list" aria-label="Produits disponibles">
            {productsLoading ? (
              <div className="product-loading">Chargement des produits…</div>
            ) : visibleProducts.length > 0 ? (
              visibleProducts.map((product, index) => {
                const price = Number(product.price) || 0;
                const dailyEarnings = Number(product.dailyEarnings) || 0;
                const cycleDays = Number(product.cycleDays) || 0;
                const totalReturn = Number(product.totalReturn) || dailyEarnings * cycleDays;
                const image =
                  product.imageUrl ||
                  JOHN_DEERE_PRODUCT_IMAGES[index % JOHN_DEERE_PRODUCT_IMAGES.length];

                return (
                  <article className="product-list-card" key={product.id}>
                    <div className="product-list-main">
                      <div className="product-list-photo">
                        <img
                          className="product-list-image"
                          src={image}
                          alt={product.name}
                          loading={index > 1 ? "lazy" : "eager"}
                        />
                      </div>
                      <div className="product-list-info">
                        <div className="product-list-heading">
                          <h2 className="product-list-name" title={product.name}>{product.name}</h2>
                          <span className="product-list-cycle">{cycleDays} jours</span>
                        </div>
                        <div className="product-list-metrics">
                          <div className="product-list-metric">
                            <strong>{formatFcfa(dailyEarnings)}</strong>
                            <span>Gains quotidiens</span>
                          </div>
                          <div className="product-list-metric">
                            <strong>{formatFcfa(totalReturn)}</strong>
                            <span>Gains totaux</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="product-list-footer">
                      <p className="product-list-price">
                        <span>Prix</span>
                        <strong>{product.isFree ? "Gratuit" : formatFcfa(price)}</strong>
                      </p>
                      <button
                        type="button"
                        className="product-buy"
                        onClick={() => product.isFree
                          ? navigate(`/products/${product.id}`)
                          : setConfirmProduct(product)}
                        aria-label={`${product.isFree ? "Découvrir" : "Acheter"} ${product.name}`}
                      >
                        {product.isFree ? "Découvrir" : "Acheter maintenant"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
               <EmptyState className="product-empty">Aucun produit disponible pour le moment.</EmptyState>
            )}
          </section>
        </div>

        <Dialog
          open={Boolean(confirmProduct)}
          onOpenChange={(open) => {
            if (!open && !purchaseMutation.isPending) setConfirmProduct(null);
          }}
        >
          {confirmProduct && (() => {
            const dailyEarnings = Number(confirmProduct.dailyEarnings) || 0;
            const cycleDays = Number(confirmProduct.cycleDays) || 0;
            const totalReturn = Number(confirmProduct.totalReturn) || dailyEarnings * cycleDays;
            return (
              <DialogPortal>
                <DialogOverlay className="bg-black/60" />
                <DialogPrimitive.Content
                  className="home-purchase-modal fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
                  aria-describedby="home-purchase-description"
                >
                  <DialogTitle className="home-purchase-modal-title">
                    {confirmProduct.name}
                  </DialogTitle>
                  <DialogDescription
                    id="home-purchase-description"
                    className="home-purchase-modal-question"
                  >
                    Are you sure you want to purchase this product?
                  </DialogDescription>
                  <div className="home-purchase-modal-details">
                    <div className="home-purchase-modal-detail">
                      <span className="home-purchase-modal-bullet" aria-hidden="true">•</span>
                      <span>Price: {formatFcfa(Number(confirmProduct.price) || 0)}</span>
                    </div>
                    <div className="home-purchase-modal-detail">
                      <span className="home-purchase-modal-bullet" aria-hidden="true">•</span>
                      <span>Total profit: {formatFcfa(totalReturn)}</span>
                    </div>
                  </div>
                  <div className="home-purchase-modal-actions">
                    <button
                      type="button"
                      className="home-purchase-modal-action"
                      onClick={() => setConfirmProduct(null)}
                      disabled={purchaseMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="home-purchase-modal-action"
                      onClick={() => purchaseMutation.mutate(confirmProduct)}
                      disabled={purchaseMutation.isPending}
                    >
                      {purchaseMutation.isPending
                        ? <Loader2 aria-label="Processing purchase" className="h-5 w-5 animate-spin" />
                        : "Confirm"}
                    </button>
                  </div>
                </DialogPrimitive.Content>
              </DialogPortal>
            );
          })()}
        </Dialog>
      </main>
  );
}