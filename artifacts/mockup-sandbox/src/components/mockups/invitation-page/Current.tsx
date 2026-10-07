import "./_group.css";
import type { ReactNode } from "react";
import { ChevronLeft, Loader2, Trophy, CheckCircle2 } from "lucide-react";
type Task = {
  id: number;
  name: string;
  description: string;
  requiredInvites: number;
  reward: number;
  sortOrder: number;
  isActive: boolean;
};

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const currentTasks: TaskWithStatus[] = [
  { id: 1, name: "Parrain Bronze", description: "Inviter 3 personnes a investir", requiredInvites: 3, reward: 350, sortOrder: 1, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
  { id: 2, name: "Parrain Argent", description: "Inviter 5 personnes a investir", requiredInvites: 5, reward: 750, sortOrder: 2, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
  { id: 3, name: "Parrain Or", description: "Inviter 10 personnes a investir", requiredInvites: 10, reward: 2500, sortOrder: 3, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
  { id: 4, name: "Parrain Platine", description: "Inviter 30 personnes a investir", requiredInvites: 30, reward: 6500, sortOrder: 4, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
  { id: 5, name: "Parrain Diamant", description: "Inviter 100 personnes a investir", requiredInvites: 100, reward: 15000, sortOrder: 5, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
  { id: 6, name: "Parrain Elite", description: "Inviter 300 personnes a investir", requiredInvites: 300, reward: 50000, sortOrder: 6, isActive: true, isCompleted: false, canClaim: false, currentInvites: 1 },
];
const ROBOTICSFUND_LOGO = "/__mockup/images/roboticsfund-logo.jpg";
const iconBronze = "/__mockup/images/icon-bronze.png";
const iconArgent = "/__mockup/images/icon-argent.png";
const iconOr = "/__mockup/images/icon-or.jpg";
const iconPlatine = "/__mockup/images/icon-platine.png";
const iconDiamant = "/__mockup/images/icon-diamant.png";

function useAuth() {
  return { user: { country: "TG" }, refreshUser: () => undefined };
}

function useToast() {
  return { toast: (_options?: { title?: string; description?: string; variant?: string }) => undefined };
}

function useQuery<T>(_options?: unknown) {
  return { data: currentTasks as unknown as T, isLoading: false };
}

function useMutation(options: { mutationFn?: (value: number) => Promise<unknown>; onSuccess?: () => void; onError?: (error: Error) => void }) {
  return {
    isPending: false,
    mutate: (value: number) => {
      const pending = options.mutationFn?.(value);
      if (pending) void pending.then(() => options.onSuccess?.()).catch(options.onError);
    },
    mutateAsync: async (value: number) => {
      const result = await options.mutationFn?.(value);
      options.onSuccess?.();
      return result;
    },
  };
}

const queryClient = { invalidateQueries: (_options?: unknown) => undefined };
const apiRequest = async (_method: string, _url: string, _body?: unknown) => ({
  ok: true,
  json: async (): Promise<{ message?: string }> => ({}),
});
const getCountryByCode = (_countryCode: string) => ({ currency: "FCFA" });
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={className} />;
}
function Link({ children }: { href: string; children: ReactNode }) {
  return <>{children}</>;
}
function EmptyState({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

const TIER_LABELS = [
  "Parrain Bronze",
  "Parrain Argent",
  "Parrain Or",
  "Parrain Platine",
  "Parrain Diamant",
  "Parrain Elite",
];

const TIER_COLORS = [
  { bg: "from-amber-700 to-amber-500" },
  { bg: "from-gray-500 to-gray-400" },
  { bg: "from-yellow-600 to-yellow-400" },
  { bg: "from-cyan-600 to-cyan-400" },
  { bg: "from-orange-700 to-orange-500" },
  { bg: "from-orange-800 to-orange-600" },
];

const TIER_ICONS = [iconBronze, iconArgent, iconOr, iconPlatine, iconDiamant, iconBronze];

function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({ title: "Récompense réclamée!", description: "Le bonus a été ajouté à votre compte." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const countryInfo = getCountryByCode(user.country);
  const currency = countryInfo?.currency || "FCFA";
  const totalTaskRewards = tasks?.filter(t => t.isCompleted).reduce((sum, t) => sum + t.reward, 0) || 0;
  const completedCount = tasks?.filter(t => t.isCompleted).length || 0;
  const claimableCount = tasks?.filter(t => t.canClaim && !t.isCompleted).length || 0;

  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      {/* Hero Section — tall enough so bottom text clears the stats card overlap */}
      <div className="relative overflow-hidden" style={{ height: "260px" }}>
        <img
          src={ROBOTICSFUND_LOGO}
          alt="RoboticsFund"
          className="w-full h-full object-contain object-center p-2"
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,113,197,0.80) 0%, rgba(0,90,158,0.70) 45%, rgba(0,40,100,0.95) 100%)" }}
        />

        {/* Header nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-4 pt-4">
          <Link href="/">
            <button
              className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center"
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <img src={ROBOTICSFUND_LOGO} alt="RoboticsFund" className="h-8 w-8 rounded-md object-contain" />
              <span className="text-white text-sm font-bold">RoboticsFund</span>
            </div>
          </div>
          <div className="w-9" />
        </div>

        {/* Hero text — positioned above the stats card overlap zone (bottom 60px) */}
        <div className="absolute left-4 right-4" style={{ bottom: "60px" }}>
          <h1 className="text-white font-bold text-xl leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            Programme de Parrainage
          </h1>
          <p className="text-white text-xs mt-1" style={{ opacity: 0.92, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            Invitez des amis et gagnez des récompenses
          </p>
        </div>
      </div>

      {/* Stats Row — overlaps bottom of hero */}
      <div className="mx-4 -mt-10 z-10 relative">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#367c2b] text-xl font-bold" data-testid="text-total-rewards">
              {totalTaskRewards.toLocaleString()}
            </p>
            <p className="text-gray-500 text-[11px] mt-0.5">{currency} gagnés</p>
          </div>
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#FF4500] text-xl font-bold">{completedCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">Terminées</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[#FF4500] text-xl font-bold">{claimableCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">À réclamer</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mx-4 mt-4 mb-24">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF4500]" />
            <h2 className="text-gray-800 font-bold text-sm">Paliers de parrainage</h2>
          </div>
          {claimableCount > 0 && (
            <button
              onClick={async () => {
                const claimable = tasks?.filter(t => t.canClaim && !t.isCompleted) || [];
                for (const task of claimable) {
                  try { await claimMutation.mutateAsync(task.id); } catch {}
                }
              }}
              disabled={claimMutation.isPending}
              className="text-xs text-[#FF4500] font-semibold bg-red-50 px-3 py-1.5 rounded-full"
              data-testid="button-claim-rewards"
            >
              Tout réclamer ({claimableCount})
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, index) => {
              const tier = TIER_COLORS[index] || TIER_COLORS[0];
              const label = TIER_LABELS[index] || `Palier ${index + 1}`;
              const icon = TIER_ICONS[index] || TIER_ICONS[0];
              const progress = Math.min((task.currentInvites / task.requiredInvites) * 100, 100);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${
                    task.isCompleted
                      ? "border-green-200"
                      : task.canClaim
                      ? "border-[#FF4500]/40"
                      : "border-gray-100"
                  }`}
                  data-testid={`task-item-${task.id}`}
                >
                  {/* Tier Header */}
                  <div className={`bg-gradient-to-r ${tier.bg} px-4 py-2.5 flex items-center justify-between`}>
                    <span className="text-white font-bold text-sm">{label}</span>
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  {/* Task Body */}
                  <div className="p-3 flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      <img src={icon} alt={label} className="w-12 h-12 object-contain" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-xs leading-snug mb-0.5">
                        Inviter{" "}
                        <span className="font-bold text-gray-900">{task.requiredInvites}</span>{" "}
                        personnes à recharger
                      </p>
                      <p className="text-[#FF4500] font-bold text-base">
                        {task.reward.toLocaleString()} {currency}
                      </p>

                      {/* Progress */}
                      <div className="mt-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400 text-[10px]">
                            {task.currentInvites} / {task.requiredInvites} invitations
                          </span>
                          <span className="text-gray-400 text-[10px]">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              task.isCompleted ? "bg-green-500" : "bg-[#FF4500]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {task.isCompleted ? (
                        <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2.5 py-1.5 rounded-full block text-center">
                          ✓ Fait
                        </span>
                      ) : task.canClaim ? (
                        <button
                          onClick={() => !claimMutation.isPending && claimMutation.mutate(task.id)}
                          disabled={claimMutation.isPending}
                          className="bg-[#367c2b] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-sm"
                          data-testid={`button-claim-${task.id}`}
                        >
                          {claimMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Réclamer"
                          )}
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 text-[10px] font-semibold px-2.5 py-1.5 rounded-full block text-center">
                          En cours
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <EmptyState className="text-center py-10 flex flex-col items-center gap-2">
            <p className="text-gray-500">Aucune tâche disponible</p>
           </EmptyState>
        )}
      </div>
    </div>
  );
}

const previewNavItems = [
  { label: "Accueil", icon: "/__mockup/images/tab-home.png" },
  { label: "Produits", icon: "/__mockup/images/tab-products.png" },
  { label: "Partager", icon: "/__mockup/images/tab-share.png" },
  { label: "Inviter", icon: "/__mockup/images/tab-invite.png" },
  { label: "Compte", icon: "/__mockup/images/tab-account.png" },
];

export function Current() {
  return (
    <div className="invite-current-preview">
      <div className="invite-current-scroll">
        <TasksPage />
      </div>
      <nav className="invite-current-nav" aria-label="Navigation principale">
        {previewNavItems.map(({ label, icon }) => (
          <div className={`invite-current-nav-item ${label === "Inviter" ? "is-active" : ""}`} key={label}>
            <img src={icon} alt="" />
            <span>{label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
