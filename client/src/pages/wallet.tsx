import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPaymentMethodsForCountry, type ApiCountry } from "@/lib/countries";
import { Loader2, Trash2, CreditCard, ChevronLeft, ChevronRight, Shield, Check, Search, X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";
import EmptyState from "@/components/empty-state";

const walletSchema = z.object({
  accountName: z.string().min(2, "Nom du titulaire requis"),
  accountNumber: z.string().min(8, "Numéro requis"),
  paymentMethod: z.string().min(2, "Moyen de paiement requis"),
});

type WalletForm = z.infer<typeof walletSchema>;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectMode = params.get("from") === "withdrawal";
  const openFormDirectly = params.get("mode") === "form";
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  const { data: wallets, isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });
  const showForm =
    !selectMode ||
    openFormDirectly ||
    (!isLoading && (wallets?.length ?? 0) === 0);

  const { data: apiCountries = [] } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { accountName: "", accountNumber: "", paymentMethod: "" },
  });

  const primaryWallet = wallets?.find((wallet) => wallet.isDefault) ?? wallets?.[0];
  const formInitialized = useRef(false);

  useEffect(() => {
    if (!showForm || isLoading || formInitialized.current) return;
    formInitialized.current = true;
    if (!primaryWallet) return;

    form.reset({
      accountName: primaryWallet.accountName,
      accountNumber: primaryWallet.accountNumber,
      paymentMethod: primaryWallet.paymentMethod,
    });
    setSelectedMethod(primaryWallet.paymentMethod);
  }, [form, isLoading, primaryWallet, showForm]);

  const addMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest("POST", "/api/wallets", {
        ...data,
        country: user!.country,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (savedWallet: WithdrawalWallet) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Compte de retrait enregistré" });
      form.reset({
        accountName: savedWallet.accountName,
        accountNumber: savedWallet.accountNumber,
        paymentMethod: savedWallet.paymentMethod,
      });
      setSelectedMethod(savedWallet.paymentMethod);
      if (selectMode) {
        localStorage.setItem("selectedWalletId", savedWallet.id.toString());
        navigate("/withdrawal");
      }
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Portefeuille supprimé !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectWallet = (wallet: WithdrawalWallet) => {
    if (selectMode) {
      localStorage.setItem("selectedWalletId", wallet.id.toString());
      navigate("/withdrawal");
    }
  };

  const handleChooseMethod = (method: string) => {
    setSelectedMethod(method);
    form.setValue("paymentMethod", method);
    setBankSearch("");
    setShowBankSheet(false);
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => addMutation.mutate(data))();
  };

  if (!user) return null;

  const paymentMethods = getPaymentMethodsForCountry(user.country, apiCountries);
  const backLink = selectMode ? "/withdrawal" : "/account";

  /* ─── ADD FORM VIEW ─── */
  if (showForm) {
    return (
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-[432px] flex-col bg-white"
        style={{ fontFamily: "Roboto, Arial, sans-serif", containerType: "inline-size" }}
      >

        {/* Header */}
        <div
          className="sticky top-0 z-50 flex h-[48px] shrink-0 items-center bg-[#23242f] px-4"
        >
          <button
            onClick={() => navigate(backLink)}
            className="flex h-full items-center gap-0.5 text-white"
            data-testid="button-back-form"
          >
            <ChevronLeft className="h-[22px] w-4 text-white" />
            <span className="text-[14px] font-normal">Dos</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[clamp(16px,4.5cqw,20px)] font-normal leading-none text-white">
            Compte de retrait
          </h1>
        </div>

        {/* Compact withdrawal details */}
        <div className="w-full">
          <div className="flex min-h-[49px] items-center border-b border-[#e1e1e4] px-[17px]">
            <label htmlFor="wallet-account-name" className="w-[36.5%] shrink-0 text-[16px] font-normal text-[#333]">
              Nom réel
            </label>
            <div className="min-w-0 flex-1 py-1">
              <input
                {...form.register("accountName")}
                id="wallet-account-name"
                placeholder=""
                className="w-full bg-transparent text-[16px] font-normal text-[#171717] outline-none"
                data-testid="input-wallet-name"
              />
              {form.formState.errors.accountName && (
                <p className="mt-0.5 text-xs text-[#c34438]">{form.formState.errors.accountName.message}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBankSheet(true)}
            className="flex min-h-[49px] w-full items-center border-b border-[#e1e1e4] px-[17px] text-left"
            aria-label="Sélectionner une banque"
            data-testid="button-select-bank"
          >
            <span className="w-[36.5%] shrink-0 text-[16px] font-normal text-[#333]">Nom de la banque</span>
            <span className={`min-w-0 flex-1 truncate text-[16px] font-normal ${selectedMethod ? "text-[#171717]" : "text-[#96969c]"}`}>
              {selectedMethod || "Sélectionner une banque"}
            </span>
          </button>

          <div className="flex min-h-[49px] items-center border-b border-[#e1e1e4] px-[17px]">
            <label htmlFor="wallet-account-number" className="w-[36.5%] shrink-0 text-[16px] font-normal text-[#333]">
              Compte bancaire
            </label>
            <div className="min-w-0 flex-1 py-1">
              <input
                {...form.register("accountNumber")}
                id="wallet-account-number"
                type="tel"
                placeholder=""
                className="w-full bg-transparent text-[16px] font-normal text-[#171717] outline-none"
                data-testid="input-wallet-number"
              />
              {form.formState.errors.accountNumber && (
                <p className="mt-0.5 text-xs text-[#c34438]">{form.formState.errors.accountNumber.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <div className="px-[25.5px] pt-[18.5px]">
          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="flex h-[44.5px] w-full items-center justify-center rounded-[10px] bg-[#23242f] text-[16px] font-normal leading-none text-white disabled:opacity-40"
            data-testid="button-confirm-wallet"
          >
            {addMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </span>
            ) : (
              "Sauvegarder"
            )}
          </button>
        </div>
        <p className="px-0 pt-[6px] text-center text-[16px] font-normal leading-[24px] text-[#333]">
          Veuillez renseigner vos véritables informations afin d'éviter tout
          <br className="hidden min-[390px]:block" /> échec de retrait.
        </p>

        {/* Bank bottom sheet */}
        {showBankSheet && (
          <div className="country-picker-overlay" onClick={() => { setBankSearch(""); setShowBankSheet(false); }}>
            <section
              className="country-picker"
              role="dialog"
              aria-modal="true"
              aria-label="Choisir un opérateur"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="country-picker-close"
                onClick={() => { setBankSearch(""); setShowBankSheet(false); }}
                aria-label="Fermer"
              >
                <X aria-hidden="true" />
              </button>
              <div className="country-picker-search">
                <Search aria-hidden="true" />
                <input
                  autoFocus
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Rechercher"
                  aria-label="Rechercher un opérateur"
                />
              </div>
              <div className="country-picker-list">
                {paymentMethods
                  .filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase()))
                  .map((method) => (
                  <button
                    key={method}
                    onClick={() => handleChooseMethod(method)}
                    className={`country-picker-row${selectedMethod === method ? " is-selected" : ""}`}
                    data-testid={`button-bank-${method}`}
                  >
                    <span>{method}</span>
                    {selectedMethod === method && (
                      <span className="country-picker-check"><Check aria-hidden="true" /></span>
                    )}
                  </button>
                ))}
                {paymentMethods.filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase())).length === 0 && (
                   <EmptyState size="compact" className="country-picker-empty">Aucun opérateur trouvé</EmptyState>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  /* ─── LIST VIEW ─── */
  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      {/* Header */}
      <div
        className="flex items-center px-4 py-4"
        style={{ background: "linear-gradient(112deg, #55c9e5 0%, #3174d1 100%)" }}
      >
        <Link href={backLink}>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20" data-testid="button-back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-white font-bold text-base">
          {selectMode ? "Sélectionner un compte" : "Liste des comptes bancaires"}
        </h1>
        <div className="w-9" />
      </div>

      {/* Wallet list */}
      <div className="flex-1 px-4 pt-4 pb-28 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#3174d1]" />
          </div>
        ) : wallets && wallets.length > 0 ? (
          wallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => selectMode && handleSelectWallet(wallet)}
              className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 ${
                selectMode ? "cursor-pointer active:opacity-80" : ""
              } ${wallet.isDefault ? "border-l-4 border-[#3174d1]" : ""}`}
              data-testid={`wallet-card-${wallet.id}`}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-gray-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{wallet.paymentMethod}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{wallet.accountName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{wallet.accountNumber}</p>
                {wallet.isDefault && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-[#3174d1]" />
                    <span className="text-xs text-[#3174d1] font-medium">Par défaut</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!selectMode && (
                <div className="flex items-center gap-1">
                  {!wallet.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(wallet.id)}
                      disabled={setDefaultMutation.isPending}
                      className="p-2"
                      data-testid={`button-set-default-${wallet.id}`}
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(wallet.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2"
                    data-testid={`button-delete-wallet-${wallet.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-[#3174d1]" />
                  </button>
                </div>
              )}

              {selectMode && (
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
            </div>
          ))
        ) : (
           <EmptyState className="text-center py-10 flex flex-col items-center gap-2">
            <p className="text-gray-500 text-sm">Aucun compte bancaire enregistré</p>
            <p className="text-gray-400 text-xs mt-1">Ajoutez un compte pour effectuer des retraits</p>
           </EmptyState>
        )}
      </div>

    </div>
  );
}
