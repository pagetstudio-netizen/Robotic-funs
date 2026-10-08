import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { AuthPageShell } from "@/components/auth-page-shell";
import { CountrySelector } from "@/components/country-selector";
import { ChevronRight, Eye, EyeOff, Loader2, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { normalizeBeninPhone } from "@shared/phone";

const visualCodeCharacters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function createVisualCode() {
  return Array.from({ length: 4 }, () =>
    visualCodeCharacters[Math.floor(Math.random() * visualCodeCharacters.length)],
  ).join("");
}

const registerSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Sélectionnez un pays"),
  password: z.string().min(6, "Au moins 6 caractères"),
  confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  invitationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => data.country.toUpperCase() !== "BJ" || normalizeBeninPhone(data.phone) !== null, {
  message: "Au Bénin, saisissez 8 chiffres locaux ou 01 suivi de 8 chiffres.",
  path: ["phone"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [visualCode, setVisualCode] = useState(createVisualCode);
  const [enteredVisualCode, setEnteredVisualCode] = useState("");

  const params = new URLSearchParams(searchString);
  // Keep accepting legacy invitation links that placed a second "?" before code.
  const currentInvitationMatch = searchString.match(/[?&]code=([^&?#]+)/i);
  const refCode = currentInvitationMatch?.[1]
    || params.get("money")
    || params.get("reg")
    || params.get("code")
    || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      invitationCode: refCode,
    },
  });

  const { data: apiCountries, isLoading: countriesLoading } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
    const isValid = apiCountries.some(ac => ac.code === selectedCountry && ac.isActive);
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

  async function onSubmit(data: RegisterForm) {
    if (enteredVisualCode.trim().toUpperCase() !== visualCode) {
      toast({ title: "Code incorrect", description: "Saisissez le code affiché sur l’écran.", variant: "destructive" });
      setVisualCode(createVisualCode());
      setEnteredVisualCode("");
      return;
    }

    const phone = data.country.toUpperCase() === "BJ"
      ? normalizeBeninPhone(data.phone)
      : data.phone.trim();
    if (!phone) {
      form.setError("phone", { message: "Au Bénin, saisissez 8 chiffres locaux ou 01 suivi de 8 chiffres." });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: `User_${phone}`,
        phone,
        country: data.country,
        password: data.password,
        invitationCode: data.invitationCode,
      });
      toast({ title: "Inscription réussie !", description: "Bienvenue chez RoboticsFund !" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Erreur d'inscription", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const displayedPrefix = countryData?.phonePrefix || (countriesLoading ? "..." : "");
  const phoneField = form.register("phone");

  return (
    <AuthPageShell mode="register">
      <form className="auth-register-form" onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("country")} />
        <div className="auth-fields">
          <div className="auth-field auth-phone-field">
            <Phone className="auth-phone-icon" aria-hidden="true" />
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
                <ChevronRight aria-hidden="true" />
              </span>
            </button>
            <span className="auth-field-divider" aria-hidden="true" />
            <input
              {...phoneField}
              onBlur={(event) => {
                phoneField.onBlur(event);
                if (selectedCountry.toUpperCase() === "BJ") {
                  const normalized = normalizeBeninPhone(event.currentTarget.value);
                  if (normalized && normalized !== event.currentTarget.value) {
                    form.setValue("phone", normalized, { shouldDirty: true, shouldValidate: true });
                  }
                }
              }}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={selectedCountry.toUpperCase() === "BJ" ? "01 00 00 00 00" : "Numéro de téléphone"}
              aria-label="Numéro de téléphone"
              aria-invalid={Boolean(form.formState.errors.phone)}
              data-testid="input-phone"
            />
          </div>
          {form.formState.errors.phone && <p className="auth-error">{form.formState.errors.phone.message}</p>}
          <div className="auth-field auth-password-field">
            <LockKeyhole className="auth-leading-icon" aria-hidden="true" />
            <input
              {...form.register("password")}
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mot de passe (8 à 15 caractères)"
              aria-label="Mot de passe"
              aria-invalid={Boolean(form.formState.errors.password)}
              data-testid="input-password"
            />
            <button
              type="button"
              className="auth-visibility-button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={passwordVisible}
            >
              {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="auth-error">{form.formState.errors.password.message}</p>}

          <div className="auth-field auth-password-field">
            <LockKeyhole className="auth-leading-icon" aria-hidden="true" />
            <input
              {...form.register("confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirmer le mot de passe"
              aria-label="Confirmer le mot de passe"
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              data-testid="input-confirm-password"
            />
            <button
              type="button"
              className="auth-visibility-button"
              onClick={() => setConfirmPasswordVisible((visible) => !visible)}
              aria-label={confirmPasswordVisible ? "Masquer la confirmation" : "Afficher la confirmation"}
              aria-pressed={confirmPasswordVisible}
            >
              {confirmPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && <p className="auth-error">{form.formState.errors.confirmPassword.message}</p>}

          <div className="auth-field auth-verification-field">
            <ShieldCheck className="auth-verification-icon" aria-hidden="true" />
            <input
              value={enteredVisualCode}
              onChange={(event) => setEnteredVisualCode(event.target.value)}
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={4}
              placeholder="Code"
              aria-label="Code affiché"
              data-testid="input-visual-code"
            />
            <button
              className="auth-visual-code"
              type="button"
              onClick={() => {
                setVisualCode(createVisualCode());
                setEnteredVisualCode("");
              }}
              aria-label="Afficher un nouveau code"
              data-testid="button-refresh-visual-code"
            >
              {Array.from(visualCode).map((character, index) => (
                <span key={`${index}-${character}`} className={`auth-visual-char auth-visual-char-${index + 1}`}>
                  {character}
                </span>
              ))}
            </button>
          </div>

          <label className="auth-field auth-invitation-field">
            <ShieldCheck className="auth-leading-icon" aria-hidden="true" />
            <input
              {...form.register("invitationCode")}
              placeholder="Code d’invitation"
              aria-label="Code d’invitation"
              data-testid="input-invitation-code"
            />
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-register">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer un compte"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => navigate("/login")}
          data-testid="link-login"
        >
          Se connecter
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
