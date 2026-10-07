import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#111" }}>

      {/* Header */}
      <header className="flex items-center px-4 py-3" style={{ background: "#111", borderBottom: "1px solid #222" }}>
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-white pr-6">À propos de nous</h1>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ color: "#d4d4d4", fontSize: 13.5, lineHeight: "1.75" }}>

        <p>
          RoboticsFund est une entreprise leader mondiale en automatisation industrielle et en robotique, fondée en 1915 et forte de plus d'un siècle d'expérience dans les technologies de moteurs et de contrôle.
        </p>

        <h2 className="text-base font-semibold text-white">Origines et mission</h2>
        <p>
          Forte de plus d'un siècle d'expérience, RoboticsFund est animée par la mission de « promouvoir le progrès ».
        </p>

        <h2 className="text-base font-semibold text-white">Domaines d’activité</h2>
        <p>
          L’entreprise contribue à la transformation et à la modernisation de la production mondiale grâce à l’automatisation industrielle et à la robotique.
        </p>
        <p>
          Ses technologies de moteurs et de contrôle favorisent une production plus intelligente, numérisée et efficace.
        </p>

      </div>
    </div>
  );
}
