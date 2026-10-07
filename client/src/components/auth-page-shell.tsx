import type { ReactNode } from "react";
import "./auth-redesign.css";
import "./auth-reference.css";

interface AuthPageShellProps {
  children: ReactNode;
  mode: "login" | "register";
}

export function AuthPageShell({ children, mode }: AuthPageShellProps) {
  return (
    <main className="auth-redesign" data-mode={mode}>
      <div className={`auth-shell auth-shell-${mode}`}>
        <svg className="auth-clip-defs" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="auth-panel-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0 0 C .02 .02 .06 .08 .18 .09 Q .5 .1 .82 .09 C .94 .08 .98 .02 1 0 L 1 .96 Q 1 1 .96 1 H .04 Q 0 1 0 .96 Z" />
            </clipPath>
          </defs>
        </svg>
        <header className="auth-hero">
          <div className="auth-hero-copy">
            <h1>{mode === "login" ? "Connexion" : "Inscription"}</h1>
          </div>
          <div className="auth-art">
            <img
              src="/auth-reference-robot.png"
              alt=""
            />
          </div>
        </header>

        <section className="auth-card" aria-label="Formulaire d’authentification">
          {children}
        </section>
      </div>
    </main>
  );
}