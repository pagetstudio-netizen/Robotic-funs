import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { AuthPageShell } from "@/components/auth-page-shell";
import { CountrySelector } from "@/components/country-selector";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Sélectionnez un pays"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      country: "",
      password: "",
    },
  });

  const { data: apiCountries, isLoading: countriesLoading } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    // Remove credentials persisted by versions that stored login data locally.
    localStorage.removeItem("doosan_credentials");
    localStorage.removeItem("doosan_login_preferences");
  }, []);

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
    const isValid = apiCountries.some(ac => ac.code === selectedCountry && ac.isActive);
    // Keep a remembered/selected country long enough for the server to apply
    // the administrator-only cross-country login rule.
    if (!isValid) {
      const first = apiCountries.find(ac => ac.isActive);
      if (first) form.setValue("country", first.code);
    }
  }, [apiCountries, selectedCountry, form]);

  const countryData = (() => {
    if (apiCountries && apiCountries.length > 0) {
      const c = apiCountries.find(ac => ac.code === selectedCountry && ac.isActive);
      if (c) return { phonePrefix: c.phonePrefix, name: c.name };
      return null;
    }
    const f = FALLBACK_COUNTRIES.find(fc => fc.code === selectedCountry);
    return f ? { phonePrefix: f.phonePrefix, name: f.name } : null;
  })();

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      await login(data.phone, data.country, data.password);
      navigate("/");
    } catch (error: any) {
      toast({ title: "Erreur de connexion", description: error.message || "Vérifiez vos informations", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const displayedPrefix = countryData?.phonePrefix || (countriesLoading ? "..." : "");

  return (
    <AuthPageShell mode="login">
      <form className="auth-login-form" onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("country")} />
        <div className="auth-fields">
          <div className="auth-field auth-phone-field">
            <button
              type="button"
              className="auth-country-button"
              onClick={() => setCountryModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={countryModalOpen}
              aria-label={`Pays : ${countryData?.name || "non sélectionné"}, indicatif +${displayedPrefix}`}
              data-testid="button-select-country"
            >
              <span className="auth-country-value">
                <span className="auth-country-code">+{displayedPrefix}</span>
              </span>
            </button>
            <span className="auth-field-divider" aria-hidden="true" />
            <input
              {...form.register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Numéro de téléphone"
              aria-label="Numéro de téléphone"
              aria-invalid={Boolean(form.formState.errors.phone)}
              data-testid="input-phone"
            />
          </div>
          {form.formState.errors.phone && <p className="auth-error">{form.formState.errors.phone.message}</p>}

          <label className="auth-field auth-password-field auth-icon-right">
            <input
              {...form.register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="Mot de passe"
              aria-label="Mot de passe"
              aria-invalid={Boolean(form.formState.errors.password)}
              data-testid="input-password"
            />
          </label>
          {form.formState.errors.password && <p className="auth-error">{form.formState.errors.password.message}</p>}
          <label className="auth-remember">
            <input type="checkbox" defaultChecked aria-label="Se souvenir du mot de passe" />
            <span>Se souvenir du mot de passe</span>
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-login">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => navigate("/register")}
          data-testid="link-register"
        >
          Créer un compte
        </button>
      </form>
      <CountrySelector
        selectedCountryCode={selectedCountry}
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(code) => {
          form.setValue("country", code, { shouldValidate: true });
        }}
      />
    </AuthPageShell>
  );
}
