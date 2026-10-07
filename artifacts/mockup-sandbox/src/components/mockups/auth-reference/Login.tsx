import { useState, type FormEvent } from "react";
import "./_shared.css";

export function Login() {
  const [rememberPassword, setRememberPassword] = useState(true);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Aperçu uniquement : aucune connexion n’a été envoyée.");
  }

  return (
    <main className="rf-reference" aria-label="Connexion à RoboticsFund">
      <svg className="rf-clip-defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="rf-panel-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 C .02 .02 .06 .08 .18 .09 Q .5 .1 .82 .09 C .94 .08 .98 .02 1 0 L 1 .96 Q 1 1 .96 1 H .04 Q 0 1 0 .96 Z" />
          </clipPath>
        </defs>
      </svg>
      <header className="rf-header">
        <h1 className="rf-title">Connexion</h1>
        <img
          className="rf-robot"
          src="/__mockup/images/auth-reference-robot.png"
          alt=""
        />
      </header>

      <section className="rf-panel" aria-label="Formulaire de connexion">
        <form className="rf-form rf-login-form" onSubmit={handleSubmit}>
          <label className="rf-field rf-phone">
            <span className="rf-prefix">+228</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Numéro de téléphone"
              aria-label="Numéro de téléphone"
            />
          </label>

          <label className="rf-field rf-login-password">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Mot de passe"
              aria-label="Mot de passe"
            />
          </label>

          <label className="rf-remember">
            <input
              type="checkbox"
              checked={rememberPassword}
              onChange={(event) => setRememberPassword(event.target.checked)}
            />
            <span>Se souvenir du mot de passe</span>
          </label>

          <button className="rf-submit" type="submit">Se connecter</button>
          {notice && <p className="rf-notice" role="status">{notice}</p>}
          <a className="rf-switch" href="/__mockup/preview/auth-reference/Register">
            Créer un compte
          </a>
        </form>
      </section>
    </main>
  );
}
