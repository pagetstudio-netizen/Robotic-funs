import { useLocation } from "wouter";
import homeTabIcon from "@assets/tab_home_p_1791380085495.png";
import productTabIcon from "@assets/tab_purchase_1791380085544.png";
import shareTabIcon from "@assets/tab_team_1791380085579.png";
import inviteTabIcon from "@assets/tab_invite_1791380085617.png";
import accountTabIcon from "@assets/tab_mine_1791380085655.png";

const navItems = [
  { path: "/", label: "Maison", icon: homeTabIcon, testId: "nav-accueil" },
  { path: "/my-products", label: "Produit", icon: productTabIcon, testId: "nav-produits" },
  { path: "/team", label: "Partager", icon: shareTabIcon, testId: "nav-partager" },
  { path: "/tasks", label: "Inviter", icon: inviteTabIcon, testId: "nav-inviter" },
  { path: "/account", label: "Mon", icon: accountTabIcon, testId: "nav-moi" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#343434] bg-[#1D1D1D] text-white"
      aria-label="Navigation principale"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid h-[68px] max-w-[512px] grid-cols-5 items-center">
        {navItems.map(({ path, label, icon, testId }) => {
          const isActive = ((location === "/team-details" || location === "/gift-code") && path === "/") ||
            location === path ||
            (location === "/service" && path === "/account") ||
            (path === "/my-products" && location === "/invest") ||
            (path !== "/" && location.startsWith(`${path}/`));
          const iconFilter = isActive
            ? path === "/" || path === "/my-products"
              ? "none"
              : "brightness(0) saturate(100%) invert(79%) sepia(48%) saturate(710%) hue-rotate(4deg) brightness(101%) contrast(96%)"
            : "grayscale(1) brightness(.62)";

          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                navigate(path);
                if (path === "/") window.dispatchEvent(new Event("home-tab-clicked"));
              }}
              className="flex h-full min-w-0 flex-col items-center justify-center gap-[3px] rounded-none bg-transparent px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#F3C244] active:opacity-75"
              data-testid={testId}
              aria-current={isActive ? "page" : undefined}
            >
              <img
                src={icon}
                className="h-9 w-auto max-w-[41px] object-contain"
                style={{ filter: iconFilter }}
                alt=""
                aria-hidden="true"
              />
              <span className="text-[12px] font-medium leading-none" style={{ color: isActive ? "#F3C244" : "#A0A0A0" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
