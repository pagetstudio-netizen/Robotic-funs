import type { ReactNode } from "react";
import "./auth-redesign.css";

interface AuthPageShellProps {
  children: ReactNode;
  mode: "login" | "register";
}

export function AuthPageShell({ children, mode }: AuthPageShellProps) {
  return (
    <main className="auth-redesign" data-mode={mode}>
      <div className={`auth-shell auth-shell-${mode}`}>
        <header className="auth-hero">
          <div className="auth-hero-copy">
            <h1>
              <span>Bienvenue chez</span>
              <strong>RoboticsFund</strong>
            </h1>
          </div>
          <div className="auth-art">
            <img
              src="/roboticsfund-logo.jpg"
              alt="Logo RoboticsFund"
            />
          </div>
        </header>

        <section className="auth-card" aria-label="Formulaire d’authentification">
          {mode === "login" && <h2 className="auth-login-heading">heureuse de vous revoir</h2>}
          {children}
        </section>
      </div>
    </main>
  );
}