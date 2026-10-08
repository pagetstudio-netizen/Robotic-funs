import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { ApiCountry } from "@/lib/countries";
import EmptyState from "@/components/empty-state";

function countryFlag(code: string) {
  return String.fromCodePoint(
    ...Array.from(code.toUpperCase(), (letter) => 127397 + letter.charCodeAt(0)),
  );
}

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCountryCode?: string;
}

export function CountrySelector({ open, onClose, onSelect, selectedCountryCode }: CountrySelectorProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const { data: apiCountries, isLoading, isError, refetch } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
    enabled: open,
  });

  const countries = useMemo(
    () => (apiCountries || [])
      .filter((country) => country.isActive)
      .map((country) => ({
        code: country.code,
        name: country.name,
        phonePrefix: country.phonePrefix,
      }))
      .sort((first, second) => first.name.localeCompare(second.name, "fr")),
    [apiCountries],
  );
  const activeSelectedCountryCode = countries.some((country) => country.code === selectedCountryCode)
    ? selectedCountryCode
    : countries[0]?.code || "";

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousRootOverscroll = root.style.overscrollBehavior;
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    root.style.overscrollBehavior = "none";
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      root.style.overscrollBehavior = previousRootOverscroll;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="auth-picker-overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="auth-picker-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-country-dialog-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="auth-picker-heading">
          <h2 id="auth-country-dialog-title">Choisir un pays</h2>
        </header>
        <div className="auth-picker-wheel">
          <div
            className="auth-picker-list"
            aria-label="Pays disponibles"
          >
            {isLoading ? (
              <div className="auth-picker-state" role="status">Chargement des pays…</div>
            ) : isError ? (
              <div className="auth-picker-state auth-picker-error" role="alert">
                <span>Impossible de charger les pays.</span>
                <button type="button" onClick={() => refetch()}>Réessayer</button>
              </div>
            ) : countries.length === 0 ? (
              <div className="auth-picker-state">
                <EmptyState size="compact" className="auth-picker-empty">
                  Aucun pays disponible
                </EmptyState>
              </div>
            ) : (
              countries.map((country) => {
                const selected = country.code === activeSelectedCountryCode;
                return (
                  <button
                    type="button"
                    key={country.code}
                    className={`auth-picker-row${selected ? " is-selected" : ""}`}
                    onClick={() => {
                      onSelect(country.code);
                      onClose();
                    }}
                    aria-pressed={selected}
                    data-country-code={country.code}
                    data-testid={`country-option-${country.code}`}
                  >
                    <span className="auth-picker-flag" aria-hidden="true">{countryFlag(country.code)}</span>
                    <span className="auth-picker-name">{country.name}</span>
                    <span className="auth-picker-prefix">+{country.phonePrefix}</span>
                    {selected && (
                      <span className="auth-picker-check" aria-hidden="true">
                        <Check />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}