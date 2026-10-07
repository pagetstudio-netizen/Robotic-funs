import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import GiftCodeModal from "@/components/gift-code-modal";
import treasureChest from "@assets/treasure-chest.png";
import "./gift-code.css";

export default function GiftCodePage() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!isOpening) return;
    const timer = window.setTimeout(() => setIsOpening(false), 1900);
    return () => window.clearTimeout(timer);
  }, [isOpening]);

  return (
    <main className={`treasure-page${isOpening ? " is-opening" : ""}`}>
      <header className="treasure-header">
        <button
          className="treasure-back"
          type="button"
          onClick={() => navigate("/account")}
          aria-label="Retour au compte"
        >
          <ChevronLeft aria-hidden="true" />
          <span>Dos</span>
        </button>
        <h1>Trésor</h1>
      </header>

      <section className="treasure-stage" aria-label="Ouvrir le trésor">
        <div className="treasure-lights" aria-hidden="true" />
        <p className="treasure-intro">Trouvez un coffre au trésor</p>
        <button
          className="treasure-trigger"
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Open the treasure"
          data-testid="button-open-treasure"
        >
          <img className="treasure-chest" src={treasureChest} alt="" />
          <span className="treasure-trigger-label">Open the treasure</span>
        </button>
      </section>

      <GiftCodeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        variant="treasure"
        onClaimSuccess={() => setIsOpening(true)}
      />
    </main>
  );
}
