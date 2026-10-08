import type { ReactNode } from "react";
import { ChevronLeft, Headphones } from "lucide-react";
import { useLocation } from "wouter";
import authReferenceLogin from "@assets/Screenshot_20261008-173005_1791496056745.png";
import "./auth-redesign.css";
import "./auth-reference.css";
import "./auth-screenshot.css";

interface AuthPageShellProps {
  children: ReactNode;
  mode: "login" | "register";
}

export function AuthPageShell({ children, mode }: AuthPageShellProps) {
  const [, navigate] = useLocation();

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
              <Headphones aria-hidden="true" />
            </a>
            <span className="auth-language-label" aria-label="Langue : français">
              <span aria-hidden="true">🇫🇷</span>
              <span>FR</span>
            </span>
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
    </main>
  );
}