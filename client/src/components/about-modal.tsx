import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROBOTICSFUND_LOGO } from "@/lib/john-deere-assets";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src={ROBOTICSFUND_LOGO} alt="RoboticsFund" className="w-10 h-10 object-contain" />
            </div>
            À propos de RoboticsFund
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            RoboticsFund est une entreprise leader mondiale en automatisation industrielle et en robotique, fondée en 1915 et forte de plus d'un siècle d'expérience dans les technologies de moteurs et de contrôle.
          </p>
          <p>
            Animée par sa mission de « promouvoir le progrès », elle contribue à la transformation et à la modernisation de la production mondiale en l'orientant vers l'intelligence, la numérisation et l'efficacité.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">Nos avantages :</h4>
            <ul className="space-y-1">
              <li>- Gains des produits versés à l’échéance</li>
              <li>- Automatisation industrielle et robotique</li>
              <li>- Système de parrainage attractif</li>
              <li>- Support client disponible</li>
            </ul>
          </div>
          <p className="text-xs">
            Version 1.0.0 - Tous droits réservés
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
