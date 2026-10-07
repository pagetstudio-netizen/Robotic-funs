import { useState, type FormEvent } from "react";
import "./_shared.css";

export function Register() {
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Aperçu uniquement : aucune inscription n’a été envoyée.");
  }

  return (
    <main className="rf-reference" aria-label="Inscription à RoboticsFund">
      <svg className="rf-clip-defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="rf-panel-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 C .02 .02 .06 .08 .18 .09 Q .5 .1 .82 .09 C .94 .08 .98 .02 1 0 L 1 .96 Q 1 1 .96 1 H .04 Q 0 1 0 .96 Z" />
          </clipPath>
        </defs>
      </svg>
      <header className="rf-header">
        <h1 className="rf-title">Inscription</h1>
        <img
          className="rf-robot"
          src="/__mockup/images/auth-reference-robot.png"
          alt=""
        />
      </header>

      <section className="rf-panel" aria-label="Formulaire d’inscription">
        <form className="rf-form rf-register-form" onSubmit={handleSubmit}>
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

          <label className="rf-field rf-stacked rf-password">
            <span className="rf-label">Mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Mot de passe"
              aria-label="Mot de passe"
            />
          </label>

          <label className="rf-field rf-stacked rf-confirm">
            <span className="rf-label">Confirmer le mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              aria-label="Confirmer le mot de passe"
            />
          </label>

          <label className="rf-field rf-verification">
            <svg className="rf-shield" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3 20 6v5.5c0 4.6-3.1 7.8-8 9.5-4.9-1.7-8-4.9-8-9.5V6l8-3Z" />
              <path d="m8.7 11.8 2.2 2.1 4.5-4.6" />
            </svg>
            <input type="text" placeholder="Code" aria-label="Code de vérification" />
            <button className="rf-visual-code" type="button" aria-label="Code visuel d’aperçu">
              <span className="rf-char rf-char-one">X</span>
              <span className="rf-char rf-char-two">H</span>
              <span className="rf-char rf-char-three">2</span>
              <span className="rf-char rf-char-four">Q</span>
            </button>
          </label>

          <label className="rf-field rf-stacked rf-invitation">
            <span className="rf-label">Code d’invitation</span>
            <input
              type="text"
              placeholder="Code d’invitation"
              aria-label="Code d’invitation"
            />
          </label>

          <button className="rf-submit" type="submit">Créer un compte</button>
          {notice && <p className="rf-notice" role="status">{notice}</p>}
          <a className="rf-switch" href="/__mockup/preview/auth-reference/Login">
            Se connecter
          </a>
        </form>
      </section>
    </main>
  );
}
