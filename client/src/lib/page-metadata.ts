import { ADMIN_PATH } from "./admin-path";

interface PageMetadata {
  title: string;
  description: string;
}

const DEFAULT_METADATA: PageMetadata = {
  title: "Page introuvable",
  description: "La page demandée n’existe pas sur RoboticsFund.",
};

const PAGE_METADATA: Record<string, PageMetadata> = {
  "/": {
    title: "Accueil",
    description: "Consultez votre compte, vos soldes et les produits RoboticsFund depuis votre espace d’accueil.",
  },
  "/login": {
    title: "Connexion",
    description: "Connectez-vous à votre compte RoboticsFund avec votre numéro de téléphone et votre mot de passe.",
  },
  "/register": {
    title: "Inscription",
    description: "Créez votre compte RoboticsFund et accédez à votre espace personnel.",
  },
  "/invitation": {
    title: "Inscription par invitation",
    description: "Inscrivez-vous sur RoboticsFund avec votre code d’invitation.",
  },
  "/rejoindre": {
    title: "Rejoindre RoboticsFund",
    description: "Créez un compte RoboticsFund à partir d’une invitation.",
  },
  "/tasks": {
    title: "Inviter",
    description: "Suivez vos objectifs d’invitation et les récompenses liées aux filleuls qui investissent.",
  },
  "/invest": {
    title: "Produits",
    description: "Consultez les produits stables et d’activité disponibles sur RoboticsFund.",
  },
  "/orders": {
    title: "Commandes",
    description: "Consultez le suivi de vos commandes et de vos achats sur RoboticsFund.",
  },
  "/team": {
    title: "Partager",
    description: "Consultez votre équipe de filleuls et partagez votre lien d’invitation RoboticsFund.",
  },
  "/my-products": {
    title: "Mes produits",
    description: "Retrouvez vos produits achetés, leur période et leurs gains sur RoboticsFund.",
  },
  "/checkin": {
    title: "Roue de la fortune",
    description: "Utilisez vos tours gratuits pour jouer à la roue de la fortune RoboticsFund.",
  },
  "/account": {
    title: "Mon compte",
    description: "Gérez votre profil, vos soldes et les paramètres de votre compte RoboticsFund.",
  },
  "/deposit": {
    title: "Dépôt",
    description: "Choisissez un montant et effectuez un dépôt sur votre compte RoboticsFund.",
  },
  "/robotpay": {
    title: "Paiement RobotPay",
    description: "Effectuez ou suivez un paiement RobotPay lié à votre compte RoboticsFund.",
  },
  "/withdrawal": {
    title: "Retrait",
    description: "Demandez un retrait depuis votre solde de retrait RoboticsFund.",
  },
  "/deposit-history": {
    title: "Historique des dépôts",
    description: "Consultez le statut et les détails de vos dépôts RoboticsFund.",
  },
  "/deposits-history": {
    title: "Ordres de dépôt",
    description: "Retrouvez vos ordres et demandes de dépôt RoboticsFund.",
  },
  "/history": {
    title: "Historique du solde",
    description: "Consultez vos soldes de dépôt et de retrait ainsi que vos récompenses RoboticsFund.",
  },
  "/withdrawal-history": {
    title: "Historique des retraits",
    description: "Consultez le statut de vos demandes de retrait RoboticsFund.",
  },
  "/deposit-orders": {
    title: "Ordres de dépôt",
    description: "Suivez vos demandes et vos ordres de dépôt RoboticsFund.",
  },
  "/service": {
    title: "Service client",
    description: "Trouvez les moyens de contacter le service client RoboticsFund.",
  },
  "/wallet": {
    title: "Compte de retrait",
    description: "Consultez ou modifiez le compte de retrait enregistré sur RoboticsFund.",
  },
  "/change-password": {
    title: "Changer le mot de passe",
    description: "Modifiez le mot de passe de votre compte RoboticsFund.",
  },
  "/about": {
    title: "À propos",
    description: "Découvrez les informations et les services de RoboticsFund.",
  },
  "/rules": {
    title: "Règles",
    description: "Consultez les règles d’utilisation et les conditions des services RoboticsFund.",
  },
  "/gift-code": {
    title: "Code cadeau",
    description: "Saisissez un code cadeau et consultez vos récompenses RoboticsFund.",
  },
  "/team-details": {
    title: "Détails des filleuls",
    description: "Consultez les détails de vos filleuls et de votre équipe RoboticsFund.",
  },
  "/daily-bonus": {
    title: "Récompenses",
    description: "Consultez les récompenses disponibles dans votre compte RoboticsFund.",
  },
  "/salary-bonus": {
    title: "Bonus",
    description: "Consultez les bonus associés à votre compte RoboticsFund.",
  },
  "/banker": {
    title: "Espace banquier",
    description: "Gérez les opérations autorisées dans votre espace banquier RoboticsFund.",
  },
};

function normalizedPath(location: string) {
  const pathname = location.split(/[?#]/, 1)[0] || "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function getPageMetadata(location: string): PageMetadata {
  const pathname = normalizedPath(location);
  if (PAGE_METADATA[pathname]) return PAGE_METADATA[pathname];
  if (/^\/products\/[^/]+$/.test(pathname)) {
    return {
      title: "Détail du produit",
      description: "Consultez les informations et les conditions de ce produit RoboticsFund.",
    };
  }
  if (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)) {
    return {
      title: "Administration",
      description: "Gérez les utilisateurs, les produits et les opérations de RoboticsFund.",
    };
  }
  return DEFAULT_METADATA;
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function applyPageMetadata(location: string) {
  const metadata = getPageMetadata(location);
  const title = `${metadata.title} | RoboticsFund`;

  document.title = title;
  setMeta("name", "description", metadata.description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", metadata.description);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", metadata.description);
}
