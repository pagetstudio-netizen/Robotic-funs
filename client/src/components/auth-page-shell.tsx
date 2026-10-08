import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import authReferenceLogin from "@assets/Screenshot_20261008-173005_1791496056745.png";
import serviceClientIcon from "@assets/home-main-icon-cs-TBZ05BAA_1791498686920.png";
import "./auth-redesign.css";
import "./auth-reference.css";
import "./auth-screenshot.css";

interface AuthPageShellProps {
  children: ReactNode;
  mode: "login" | "register";
}

export function AuthPageShell({ children, mode }: AuthPageShellProps) {
  const [, navigate] = useLocation();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  useEffect(() => {
    if (!languageModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageModalOpen]);

  return (
    <main className="auth-redesign auth-screenshot" data-mode={mode}>
      <div className={`auth-shell auth-shell-${mode}`}>
        <div
          className="auth-reference-backdrop"
          aria-hidden="true"
          style={{ backgroundImage: `url("${authReferenceLogin}")` }}
        />
        <header className="auth-topbar">
          <button
            type="button"
            className="auth-back-button"
            aria-label="Retour"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else navigate("/");
            }}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <div className="auth-topbar-actions">
            <a className="auth-support-button" href="/service" aria-label="Service client">
              <img src={serviceClientIcon} alt="" aria-hidden="true" />
            </a>
            <button
              type="button"
              className="auth-language-label"
              aria-label="Langue : français"
              aria-haspopup="dialog"
              aria-expanded={languageModalOpen}
              onClick={() => setLanguageModalOpen(true)}
              data-testid="button-auth-language"
            >
              <span aria-hidden="true">🇫🇷</span>
              <span>FR</span>
            </button>
          </div>
        </header>

        <img className="auth-brand-logo" src="/roboticsfund-logo.jpg" alt="RoboticsFund" />

        <section className="auth-card" aria-label="Formulaire d’authentification">
          <h1 className="auth-screen-reader-title">
            {mode === "login" ? "Connexion" : "Inscription"}
          </h1>
          {children}
        </section>
      </div>
      {languageModalOpen && (
        <div
          className="auth-language-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLanguageModalOpen(false);
          }}
        >
          <section
            className="auth-language-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-language-message"
          >
            <p id="auth-language-message">暂不支持翻译，请使用 Google 翻译。</p>
            <button type="button" onClick={() => setLanguageModalOpen(false)}>
              知道了
            </button>
          </section>
        </div>
      )}
    </main>
  );
}