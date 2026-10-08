import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { ApiCountry } from "@/lib/countries";
import EmptyState from "@/components/empty-state";

function CountryFlag({ countryCode }: { countryCode: string }) {
  const code = countryCode.toUpperCase();
  const clipId = `auth-country-flag-${code.toLowerCase()}`;
  const star = (
    <polygon
      points="18,11.8 19.7,16.2 24.4,16.4 20.8,19.3 22,23.8 18,21.2 14,23.8 15.2,19.3 11.6,16.4 16.3,16.2"
      fill="#ffdf00"
    />
  );

  const artwork: Record<string, JSX.Element> = {
    TG: (
      <>
        <rect width="36" height="36" fill="#006a4e" />
        <path d="M0 7.2H36M0 21.6H36" stroke="#ffce00" strokeWidth="7.2" />
        <rect width="20" height="21.6" fill="#d21034" />
        <polygon points="10,5.6 11.3,8.7 14.7,8.9 12.1,11 13,14.3 10,12.4 7,14.3 7.9,11 5.3,8.9 8.7,8.7" fill="#fff" />
      </>
    ),
    BJ: (
      <>
        <rect width="14.4" height="36" fill="#008751" />
        <rect x="14.4" width="21.6" height="18" fill="#fcd116" />
        <rect x="14.4" y="18" width="21.6" height="18" fill="#e8112d" />
      </>
    ),
    BF: (
      <>
        <rect width="36" height="18" fill="#ef2b2d" />
        <rect y="18" width="36" height="18" fill="#009e49" />
        {star}
      </>
    ),
    CM: (
      <>
        <rect width="12" height="36" fill="#007a5e" />
        <rect x="12" width="12" height="36" fill="#ce1126" />
        <rect x="24" width="12" height="36" fill="#fcd116" />
        {star}
      </>
    ),
    NE: (
      <>
        <rect width="36" height="12" fill="#e05206" />
        <rect y="12" width="36" height="12" fill="#fff" />
        <rect y="24" width="36" height="12" fill="#0db02b" />
        <circle cx="18" cy="18" r="5" fill="#e05206" />
      </>
    ),
  };

  const flagArt = artwork[code];

  return (
    <span className="auth-picker-flag" aria-hidden="true">
      {flagArt ? (
        <svg viewBox="0 0 36 36" focusable="false">
          <defs>
            <clipPath id={clipId}>
              <circle cx="18" cy="18" r="17" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{flagArt}</g>
          <circle cx="18" cy="18" r="17.25" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".8" />
        </svg>
      ) : (
        <img
          src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
    </span>
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

  return createPortal(
    <div className="auth-picker-portal auth-redesign auth-screenshot">
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
          aria-label="Sélection du pays"
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
          onClick={(event) => event.stopPropagation()}
        >
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
                      <CountryFlag countryCode={country.code} />
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
    </div>,
    document.body,
  );
}