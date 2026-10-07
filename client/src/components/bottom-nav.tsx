import { useLocation } from "wouter";
import homeIcon from "@assets/nav-home-mask.png";
import revenueIcon from "@assets/nav-revenue-mask.png";
import teamIcon from "@assets/nav-team-mask.png";
import accountIcon from "@assets/nav-account-mask.png";
import homeTabIcon from "@assets/tab_home_p_1791380085495.png";
import productTabIcon from "@assets/tab_purchase_1791380085544.png";
import shareTabIcon from "@assets/tab_team_1791380085579.png";
import inviteTabIcon from "@assets/tab_invite_1791380085617.png";
import accountTabIcon from "@assets/tab_mine_1791380085655.png";

const defaultNavItems = [
  { path: "/", label: "Accueil", icon: homeIcon, testId: "nav-accueil" },
  { path: "/my-products", label: "Revenu", icon: revenueIcon, testId: "nav-revenus" },
  { path: "/team", label: "Équipe", icon: teamIcon, testId: "nav-equipe" },
  { path: "/account", label: "Compte", icon: accountIcon, testId: "nav-moi" },
];

const homeNavItems = [
  { path: "/", label: "Accueil", icon: homeTabIcon, testId: "nav-accueil" },
  { path: "/invest", label: "Produits", icon: productTabIcon, testId: "nav-produits" },
  { path: "/team", label: "Partager", icon: shareTabIcon, testId: "nav-partager" },
  { path: "/tasks", label: "Inviter", icon: inviteTabIcon, testId: "nav-inviter" },
  { path: "/account", label: "Compte", icon: accountTabIcon, testId: "nav-moi" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const isHome = location === "/";

  return (
    <nav
      className={isHome
        ? "fixed bottom-0 left-0 right-0 z-50 border-t border-[#343434] bg-[#1D1D1D] text-white"
        : "bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-2px_5px_rgba(0,0,0,.04)]"}
      aria-label="Navigation principale"
      style={isHome ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" } : { borderColor: "#e9e9e9" }}
    >
      <div className={isHome
        ? "mx-auto grid h-[68px] max-w-[512px] grid-cols-5 items-center"
        : "mx-auto grid h-[68px] max-w-[512px] grid-cols-4 items-center"}
      >
        {isHome
          ? homeNavItems.map(({ path, label, icon: Icon, testId }) => {
            const isActive = location === path;
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
                  src={Icon}
                  className="h-9 w-auto max-w-[41px] object-contain"
                  alt=""
                  aria-hidden="true"
                />
                <span className="text-[12px] font-medium leading-none" style={{ color: isActive ? "#F3C244" : "#A0A0A0" }}>
                  {label}
                </span>
              </button>
            );
          })
          : defaultNavItems.map(({ path, label, icon, testId }) => {
            const isActive = location === path;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  navigate(path);
                  if (path === "/") window.dispatchEvent(new Event("home-tab-clicked"));
                }}
                className="flex h-full min-w-0 flex-col items-center justify-center gap-[3px]"
                data-testid={testId}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative flex h-[31px] w-[31px] items-center justify-center">
                  <span
                    className="bottom-nav-icon"
                    aria-hidden="true"
                    style={{
                      backgroundColor: "#367c2b",
                      WebkitMaskImage: `url(${icon})`,
                      maskImage: `url(${icon})`,
                    }}
                  />
                </span>
                <span className="text-[12px] font-medium leading-none" style={{ color: isActive ? "#28633a" : "#7b7d80" }}>
                  {label}
                </span>
              </button>
            );
          })}
      </div>
    </nav>
  );
}
