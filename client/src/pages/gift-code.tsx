import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import GiftCodeModal from "@/components/gift-code-modal";
import { useToast } from "@/hooks/use-toast";
import treasureChest from "@assets/treasure-chest.png";
import "./gift-code.css";

export default function GiftCodePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpening) return;
    const timer = window.setTimeout(() => {
      setIsOpening(false);
      if (successMessage) {
        toast({ title: "Coffre ouvert !", description: successMessage });
        setSuccessMessage("");
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [isOpening, successMessage, toast]);

  const handleClaimSuccess = (message?: string) => {
    setSuccessMessage(message || "Votre code cadeau a été réclamé avec succès.");
    setIsOpening(true);
  };

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
          onClaimSuccess={handleClaimSuccess}
      />
    </main>
  );
}
