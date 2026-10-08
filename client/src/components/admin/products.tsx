import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Loader2, TrendingUp, Plus, Trash2 } from "lucide-react";
import { getRobotProductImage } from "@/lib/john-deere-assets";
import type { Product } from "@shared/schema";
import EmptyState from "@/components/empty-state";

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  price: z.string().min(1, "Prix requis"),
  dailyEarnings: z.string().min(1, "Gains journaliers requis"),
  cycleDays: z.string().min(1, "Durée requise"),
  imageUrl: z.string().optional(),
  launchDate: z.string().optional(),
  launchTime: z.string().optional(),
  stockLimit: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;
type ActivityProductDraft = Pick<ProductForm, "name" | "price" | "dailyEarnings" | "cycleDays" | "stockLimit">;
type ActivityProductPayload = Omit<ActivityProductDraft, "stockLimit"> & { stockLimit: number | null };
type AdminProduct = Product & { stockCount?: number };

const emptyActivityDraft = (): ActivityProductDraft => ({
  name: "",
  price: "",
  dailyEarnings: "",
  cycleDays: "80",
  stockLimit: "",
});

export default function AdminProducts() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showActivityBatch, setShowActivityBatch] = useState(false);
  const [productView, setProductView] = useState<"stable" | "activity">("stable");
  const [activityLaunchDate, setActivityLaunchDate] = useState("");
  const [activityLaunchTime, setActivityLaunchTime] = useState("");
  const [activityRows, setActivityRows] = useState<ActivityProductDraft[]>([emptyActivityDraft()]);
  const [activityFormError, setActivityFormError] = useState("");

  const { data: products, isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["/api/admin/products/all"],
  });
  const visibleProducts = (products || []).filter((product) => product.productType === productView);

  const editForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "80", imageUrl: "", launchDate: "", launchTime: "", stockLimit: "" },
  });

  const createForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "80", imageUrl: "", launchDate: "", launchTime: "", stockLimit: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit créé!" });
      setShowCreateForm(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const activityBatchMutation = useMutation({
    mutationFn: async (data: { launchDate: string; launchTime: string; products: ActivityProductPayload[] }) => {
      const response = await apiRequest("POST", "/api/admin/products/bulk-activity", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (created: Product[]) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: `${created.length} produit(s) d’activité créé(s)` });
      setProductView("activity");
      setShowActivityBatch(false);
      setActivityRows([emptyActivityDraft()]);
      setActivityLaunchDate("");
      setActivityLaunchTime("");
      setActivityFormError("");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit mis à jour!" });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: (result: { archived?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: result.archived ? "Produit retiré du catalogue" : "Produit supprimé",
        description: result.archived
          ? "Des achats ou commissions y sont associés. L’historique a été conservé."
          : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      imageUrl: product.imageUrl || "",
      launchDate: product.launchDate || "",
      launchTime: product.launchTime || "",
      stockLimit: product.stockLimit?.toString() || "",
    });
  };

  const handleUpdate = (data: ProductForm) => {
    if (!selectedProduct) return;
    const price = parseInt(data.price);
    const dailyEarnings = parseInt(data.dailyEarnings);
    const cycleDays = parseInt(data.cycleDays);
    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: data.name,
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        imageUrl: data.imageUrl || null,
        ...(selectedProduct.productType === "activity"
          ? {
            launchDate: data.launchDate,
            launchTime: data.launchTime,
            stockLimit: data.stockLimit?.trim() ? Number(data.stockLimit) : null,
          }
          : {}),
      },
    });
  };

  const handleCreate = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  const updateActivityRow = (index: number, field: keyof ActivityProductDraft, value: string) => {
    setActivityRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    ));
  };

  const submitActivityBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activityLaunchDate || !activityLaunchTime) {
      setActivityFormError("Indiquez la date et l’heure locales de lancement.");
      return;
    }
    if (activityRows.some((row) =>
      row.name.trim().length < 2
      || !Number.isSafeInteger(Number(row.price)) || Number(row.price) <= 0
      || !Number.isSafeInteger(Number(row.dailyEarnings)) || Number(row.dailyEarnings) <= 0
      || !Number.isSafeInteger(Number(row.cycleDays)) || Number(row.cycleDays) <= 0
      || (Boolean(row.stockLimit?.trim())
        && (!Number.isSafeInteger(Number(row.stockLimit)) || Number(row.stockLimit) <= 0 || Number(row.stockLimit) > 2_147_483_647))
    )) {
      setActivityFormError("Complétez les informations de chaque produit et indiquez une limite de places valide ou laissez-la vide.");
      return;
    }
    setActivityFormError("");
    activityBatchMutation.mutate({
      launchDate: activityLaunchDate,
      launchTime: activityLaunchTime,
      products: activityRows.map((row) => ({
        ...row,
        name: row.name.trim(),
        stockLimit: row.stockLimit?.trim() ? Number(row.stockLimit) : null,
      })),
    });
  };

  const ProductFormFields = ({ form, isPending, submitLabel, showSchedule = false }: {
    form: any;
    isPending: boolean;
    submitLabel: string;
    showSchedule?: boolean;
  }) => (
    <form onSubmit={form.handleSubmit(submitLabel === "Créer" ? handleCreate : handleUpdate)} className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Nom du produit</FormLabel>
          <FormControl><Input {...field} placeholder="Ex. : Tracteur série 5E" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Prix (F)</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="Ex: 15000" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dailyEarnings" render={({ field }) => (
          <FormItem>
            <FormLabel>Gains/jour (F)</FormLabel>
            <FormControl><Input {...field} type="number" placeholder="Ex: 300" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="cycleDays" render={({ field }) => (
        <FormItem>
          <FormLabel>Durée (jours)</FormLabel>
          <FormControl><Input {...field} type="number" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="imageUrl" render={({ field }) => (
        <FormItem>
          <FormLabel>URL de l'image <span className="text-muted-foreground font-normal">(optionnel)</span></FormLabel>
          <FormControl><Input {...field} placeholder="https://..." /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      {showSchedule && (
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="launchDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Date de lancement</FormLabel>
              <FormControl><Input {...field} type="date" required /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="launchTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Heure locale</FormLabel>
              <FormControl><Input {...field} type="time" required /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )}
      {showSchedule && (
        <FormField control={form.control} name="stockLimit" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre maximum de places <span className="text-muted-foreground font-normal">(facultatif)</span></FormLabel>
            <FormControl>
              <Input {...field} type="number" min="1" step="1" placeholder="Ex. : 30 — vide = sans limite" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      )}
      {form.watch("price") && form.watch("dailyEarnings") && form.watch("cycleDays") && (
        <div className="bg-primary/10 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">Retour total estimé :</p>
          <p className="font-bold text-primary text-lg">
            {(parseInt(form.watch("dailyEarnings") || "0") * parseInt(form.watch("cycleDays") || "0")).toLocaleString()} F
          </p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-product">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button variant={productView === "stable" ? "default" : "outline"} onClick={() => setProductView("stable")}>
          Produits stables ({products?.filter((product) => product.productType === "stable").length || 0})
        </Button>
        <Button variant={productView === "activity" ? "default" : "outline"} onClick={() => setProductView("activity")}>
          Produits d’activité ({products?.filter((product) => product.productType === "activity").length || 0})
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{visibleProducts.length} produit(s)</p>
        {productView === "stable" ? (
          <Button onClick={() => { setShowCreateForm(true); createForm.reset(); }} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit stable
          </Button>
        ) : (
          <Button onClick={() => { setShowActivityBatch(true); setActivityFormError(""); }} data-testid="button-add-activity-batch">
            <Plus className="w-4 h-4 mr-2" />
            Créer un lot
          </Button>
        )}
      </div>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : visibleProducts.length > 0 ? (
        visibleProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={getRobotProductImage(product.imageUrl, product.id, product.name)}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-border"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getRobotProductImage(null, product.id, product.name);
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {product.productType === "activity" ? "Activité" : "Stable"}
                      </Badge>
                      {product.isFree && <Badge variant="secondary" className="text-xs">Gratuit</Badge>}
                      <Badge variant={product.isActive ? "default" : "outline"} className="text-xs">
                        {product.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toLocaleString()} F — {product.dailyEarnings.toLocaleString()} F/jour, versés à l’échéance
                    </p>
                    {product.productType === "activity" && product.launchDate && product.launchTime && (
                      <p className="text-xs text-muted-foreground">
                        Lancement local : {product.launchDate} à {product.launchTime}
                      </p>
                    )}
                    {product.productType === "activity" && (
                      <p className={`text-xs ${product.stockLimit != null && (product.stockCount || 0) >= product.stockLimit ? "text-destructive" : "text-muted-foreground"}`}>
                        {product.stockLimit == null
                          ? `Places : ${product.stockCount || 0} — sans limite`
                          : `Places : ${product.stockCount || 0} / ${product.stockLimit}${(product.stockCount || 0) >= product.stockLimit ? " — complet" : ""}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                    data-testid={`switch-product-${product.id}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!product.isFree && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { if (confirm(`Supprimer "${product.name}" ?`)) deleteMutation.mutate(product.id); }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix</p>
                  <p className="font-medium text-foreground">{product.price.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gains/jour calculés</p>
                  <p className="font-medium text-foreground">{product.dailyEarnings.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total ({product.cycleDays}j)</p>
                  <p className="font-medium text-primary">{product.totalReturn.toLocaleString()} F</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <EmptyState className="py-8">
          {productView === "activity" ? "Aucun produit d’activité planifié." : "Aucun produit stable."}
        </EmptyState>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) { setShowCreateForm(false); createForm.reset(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau produit stable</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <ProductFormFields form={createForm} isPending={createMutation.isPending} submitLabel="Créer" />
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier — {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <ProductFormFields
              form={editForm}
              isPending={updateMutation.isPending}
              submitLabel="Enregistrer"
              showSchedule={selectedProduct?.productType === "activity"}
            />
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivityBatch} onOpenChange={(open) => {
        setShowActivityBatch(open);
        if (!open) {
          setActivityRows([emptyActivityDraft()]);
          setActivityLaunchDate("");
          setActivityLaunchTime("");
          setActivityFormError("");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un lot de produits d’activité</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitActivityBatch} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tous les produits du lot seront disponibles à cette date et à cette heure locale dans chaque pays.
              Togo, Burkina Faso et Côte d’Ivoire partagent la même heure ; Bénin, Cameroun et Niger ont une heure d’avance.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="activity-launch-date">Date de lancement</label>
                <Input
                  id="activity-launch-date"
                  type="date"
                  value={activityLaunchDate}
                  onChange={(event) => setActivityLaunchDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="activity-launch-time">Heure locale</label>
                <Input
                  id="activity-launch-time"
                  type="time"
                  value={activityLaunchTime}
                  onChange={(event) => setActivityLaunchTime(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-3">
              {activityRows.map((row, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Produit {index + 1}</p>
                    {activityRows.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Supprimer le produit ${index + 1} du lot`}
                        onClick={() => setActivityRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      aria-label={`Nom du produit ${index + 1}`}
                      value={row.name}
                      onChange={(event) => updateActivityRow(index, "name", event.target.value)}
                      placeholder="Nom du produit"
                      required
                    />
                    <Input
                      aria-label={`Prix du produit ${index + 1}`}
                      type="number"
                      min="1"
                      step="1"
                      value={row.price}
                      onChange={(event) => updateActivityRow(index, "price", event.target.value)}
                      placeholder="Prix (FCFA)"
                      required
                    />
                    <Input
                      aria-label={`Gain journalier du produit ${index + 1}`}
                      type="number"
                      min="1"
                      step="1"
                      value={row.dailyEarnings}
                      onChange={(event) => updateActivityRow(index, "dailyEarnings", event.target.value)}
                      placeholder="Gain journalier (FCFA)"
                      required
                    />
                    <Input
                      aria-label={`Durée du produit ${index + 1}`}
                      type="number"
                      min="1"
                      step="1"
                      value={row.cycleDays}
                      onChange={(event) => updateActivityRow(index, "cycleDays", event.target.value)}
                      placeholder="Durée (jours)"
                      required
                    />
                    <Input
                      aria-label={`Nombre maximum de places du produit ${index + 1}`}
                      type="number"
                      min="1"
                      step="1"
                      value={row.stockLimit}
                      onChange={(event) => updateActivityRow(index, "stockLimit", event.target.value)}
                      placeholder="Places maximum (facultatif)"
                    />
                    <p className="col-span-2 text-sm text-muted-foreground">
                      Gain total à l’échéance :{" "}
                      <strong className="text-foreground">
                        {(Number(row.dailyEarnings || 0) * Number(row.cycleDays || 0)).toLocaleString("fr-FR")} FCFA
                      </strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {activityRows.length < 50 && (
              <Button type="button" variant="outline" onClick={() => setActivityRows((current) => [...current, emptyActivityDraft()])}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un produit au lot
              </Button>
            )}
            {activityFormError && <p className="text-sm text-destructive" role="alert">{activityFormError}</p>}
            <Button type="submit" className="w-full" disabled={activityBatchMutation.isPending}>
              {activityBatchMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : `Créer ${activityRows.length} produit${activityRows.length > 1 ? "s" : ""} planifié${activityRows.length > 1 ? "s" : ""}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
