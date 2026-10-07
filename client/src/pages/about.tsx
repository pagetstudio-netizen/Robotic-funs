import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import factoryImage from "../../../attached_assets/pp1_1791392673984.png";
import teamImage from "../../../attached_assets/pp2_1791392673957.png";
import roboticsImage from "../../../attached_assets/pp3_1791392673831.png";

export default function AboutPage() {
  return (
    <main className="flex h-[100dvh] min-h-[100dvh] w-full justify-center bg-white">
      <div
        className="flex h-full w-full max-w-[432px] flex-col overflow-hidden bg-white text-[#303039]"
        style={{ fontFamily: "Roboto, Arial, sans-serif" }}
      >
        <header className="relative z-10 flex h-[48px] shrink-0 items-center bg-[#23242f] px-4 text-white">
          <Link
            href="/account"
            className="flex h-full items-center gap-0.5 text-white"
            data-testid="button-back"
          >
            <ChevronLeft className="h-[22px] w-4" strokeWidth={1.8} />
            <span className="text-[14px] font-normal">Dos</span>
          </Link>
          <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[20px] font-normal leading-none">
            Profil de l&apos;entreprise
          </h1>
        </header>

        <section
          aria-label="Profil de l'entreprise"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-[8px] pb-6"
        >
          <h2 className="mb-[34px] mt-[10px] text-[16px] font-normal leading-[2]">
            À propos de nous | Un leader mondial en robotique industrielle et en fabrication intelligente
          </h2>

          <p className="mb-[32px] text-[16px] font-normal leading-[2]">
            Roboticsfund est une entreprise leader mondiale en automatisation industrielle et en robotique,
            fondée en 1915 et forte de plus d&apos;un siècle d&apos;expérience dans les technologies de moteurs
            et de contrôle. Animée par sa mission de « promouvoir le progrès », elle contribue sans cesse à
            la transformation et à la modernisation de la production mondiale en l&apos;orientant vers
            l&apos;intelligence, la numérisation et l&apos;efficacité.
          </p>

          <img
            src={factoryImage}
            alt=""
            className="block aspect-[1.2875] w-full object-fill"
          />
          <img
            src={teamImage}
            alt=""
            className="mt-[10px] block aspect-[0.678] w-full object-fill"
          />

          <h2 className="mb-[18px] mt-[48px] text-[16px] font-normal leading-[2]">
            Atouts fondamentaux | Avantage concurrentiel à long terme
          </h2>

          <p className="mb-[34px] text-[16px] font-normal leading-[2]">
            Les systèmes Roboticsfund se caractérisent par une « haute précision + une haute fiabilité +
            une grande stabilité », garantissant un fonctionnement stable à long terme dans les secteurs
            industriels mondiaux :
          </p>

          <p className="mb-[34px] text-[16px] font-normal leading-[2]">
            Les servomoteurs et les systèmes d&apos;entraînement automatiques garantissent une précision de
            vitesse extrêmement élevée. Les algorithmes de contrôle robotique avancés permettent un
            contrôle complexe des trajectoires et des mouvements à grande vitesse.
          </p>

          <p className="mb-[34px] text-[16px] font-normal leading-[2]">
            Sa conception industrielle ultra-fiable s&apos;adapte aux environnements de production continus
            24h/24 et 7j/7.
          </p>

          <p className="mb-[34px] text-[16px] font-normal leading-[2]">
            Des machines autonomes à l&apos;intégration au niveau système dans les usines intelligentes,
            robotsfund fournit des solutions d&apos;automatisation complètes.
          </p>

          <p className="mb-[26px] text-[16px] font-normal leading-[2]">
            Ces technologies clés représentent l&apos;avantage concurrentiel à long terme de robotsfund
            dans le domaine mondial de la robotique industrielle.
          </p>

          <img src={roboticsImage} alt="" className="block h-auto w-full" />
        </section>
      </div>
    </main>
  );
}
