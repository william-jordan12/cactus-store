import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, parsePriceToCents, parseVariants, variantPriceRange } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import type { Product } from "../../../../drizzle/schema";
import type { ProductVariant } from "../../../../shared/types";
import { GripVertical, ImageOff, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

interface VariantDraft {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
}

interface FormState {
  title: string;
  imageUrl: string;
  images: string[];
  price: string;
  categoryId: string;
  description: string;
  inStock: boolean;
  isVariable: boolean;
  variants: VariantDraft[];
}

const EMPTY_FORM: FormState = {
  title: "",
  imageUrl: "",
  images: [],
  price: "",
  categoryId: "none",
  description: "",
  inStock: true,
  isVariable: false,
  variants: [],
};

function parseProductImages(product: Product): string[] {
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return product.imageUrl ? [product.imageUrl] : [];
}

let variantIdCounter = 0;
function newVariantId(): string {
  return `v_${Date.now()}_${++variantIdCounter}`;
}

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const searchString = useSearch();
  const { data: products, isLoading } = trpc.admin.products.list.useQuery();
  const { data: categories } = trpc.admin.categories.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [variantUploading, setVariantUploading] = useState<string | null>(null);
  const [variantDragOver, setVariantDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (new URLSearchParams(searchString).get("new") === "1") {
      setEditing(null);
      setForm(EMPTY_FORM);
      setDialogOpen(true);
    }
  }, [searchString]);

  const invalidate = () => {
    utils.admin.products.list.invalidate();
    utils.store.products.invalidate();
  };

  const createMutation = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created");
      invalidate();
      setDialogOpen(false);
    },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated");
      invalidate();
      setDialogOpen(false);
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
      setDeleting(null);
    },
    onError: e => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const images = parseProductImages(product);
    const existingVariants = parseVariants((product as any).variants);
    setForm({
      title: product.title,
      imageUrl: product.imageUrl ?? "",
      images,
      price: (product.priceCents / 100).toFixed(2),
      categoryId: product.categoryId ? String(product.categoryId) : "none",
      description: product.description ?? "",
      inStock: product.inStock ?? true,
      isVariable: (product as any).isVariable ?? false,
      variants: existingVariants.map(v => ({
        id: v.id || newVariantId(),
        name: v.name,
        imageUrl: v.imageUrl,
        price: (v.priceCents / 100).toFixed(2),
      })),
    });
    setDialogOpen(true);
  };

  const compressImage = (file: File, maxDim = 600, quality = 0.65): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
          else { width = Math.round((width / height) * maxDim); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const newImages = [...form.images];
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        newImages.push(compressed);
      } catch (e: any) {
        toast.error(`Failed to process ${file.name}: ${e.message}`);
      }
    }
    setForm(f => ({ ...f, images: newImages }));
    setUploading(false);
  }, [form.images]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    setForm(f => {
      const newImages = f.images.filter((_, i) => i !== index);
      return { ...f, images: newImages, imageUrl: newImages[0] ?? "" };
    });
  };

  const moveImage = (from: number, to: number) => {
    setForm(f => {
      const newImages = [...f.images];
      const [moved] = newImages.splice(from, 1);
      newImages.splice(to, 0, moved);
      return { ...f, images: newImages, imageUrl: newImages[0] ?? "" };
    });
  };

  // Variant management
  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...f.variants, { id: newVariantId(), name: "", imageUrl: "", price: "" }],
    }));
  };

  const removeVariant = (id: string) => {
    setForm(f => ({
      ...f,
      variants: f.variants.filter(v => v.id !== id),
    }));
  };

  const updateVariant = (id: string, field: keyof VariantDraft, value: string) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map(v => v.id === id ? { ...v, [field]: value } : v),
    }));
  };

  const handleVariantFile = useCallback(async (variantId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} exceeds 10MB limit`);
      return;
    }
    setVariantUploading(variantId);
    try {
      const compressed = await compressImage(file, 600, 0.65);
      updateVariant(variantId, "imageUrl", compressed);
    } catch (e: any) {
      toast.error(`Failed to process ${file.name}: ${e.message}`);
    }
    setVariantUploading(null);
  }, []);

  const moveVariant = (from: number, to: number) => {
    setForm(f => {
      const newVariants = [...f.variants];
      const [moved] = newVariants.splice(from, 1);
      newVariants.splice(to, 0, moved);
      return { ...f, variants: newVariants };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    let priceCents = 0;
    let priceEndCents: number | null = null;
    let variantsJson: string | null = null;

    if (form.isVariable) {
      // Validate variants
      if (form.variants.length === 0) {
        toast.error("Add at least one variant/sub-product");
        return;
      }
      for (let i = 0; i < form.variants.length; i++) {
        const v = form.variants[i];
        if (!v.name.trim()) {
          toast.error(`Variant ${i + 1} needs a name`);
          return;
        }
        const pc = parsePriceToCents(v.price);
        if (pc === null || pc <= 0) {
          toast.error(`Variant "${v.name || i + 1}" needs a valid price`);
          return;
        }
      }
      // Build variant objects and compute price range
      const builtVariants: ProductVariant[] = form.variants.map(v => ({
        id: v.id,
        name: v.name.trim(),
        imageUrl: v.imageUrl,
        priceCents: parsePriceToCents(v.price)!,
      }));
      variantsJson = JSON.stringify(builtVariants);
      const prices = builtVariants.map(v => v.priceCents);
      priceCents = Math.min(...prices);
      priceEndCents = Math.max(...prices);
      if (priceCents === priceEndCents) priceEndCents = null;
    } else {
      priceCents = parsePriceToCents(form.price) ?? 0;
      if (priceCents <= 0) {
        toast.error("Enter a valid price, e.g. 19.99");
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      imageUrl: form.images.length > 0 ? null : (form.imageUrl.trim() || null),
      images: form.images.length > 0 ? form.images : null,
      priceCents,
      priceEndCents,
      inStock: form.inStock,
      isVariable: form.isVariable,
      variants: variantsJson,
      categoryId: form.categoryId !== "none" ? Number(form.categoryId) : null,
      description: form.description.trim() || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const categoryName = (id: number | null) => categories?.find(c => c.id === id)?.name ?? "—";
  const saving = createMutation.isPending || updateMutation.isPending || uploading || variantUploading !== null;
  const allImages = form.images.length > 0 ? form.images : (form.imageUrl ? [form.imageUrl] : []);

  const productPriceDisplay = (product: Product) => {
    const variants = parseVariants((product as any).variants);
    if ((product as any).isVariable && variants.length > 0) {
      const range = variantPriceRange(variants);
      if (range) return range[0] === range[1] ? formatPrice(range[0]) : `${formatPrice(range[0])} – ${formatPrice(range[1])}`;
    }
    return formatPrice(product.priceCents);
  };

  return (
    <AdminLayout title="Products">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-md border border-border">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No products yet. Click "Add Product" to create your first one.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[280px] truncate">
                        {product.title}
                        {(product as any).isVariable && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-600 rounded">Variable</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{categoryName(product.categoryId)}</TableCell>
                      <TableCell className="font-semibold">
                        {productPriceDisplay(product)}
                        {!product.inStock && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded">Out of Stock</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(product)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3">
                  <div className="h-12 w-12 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {product.title}
                      {(product as any).isVariable && (
                        <span className="ml-1 inline-block px-1 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-600 rounded">Variable</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoryName(product.categoryId)} · {productPriceDisplay(product)}
                      {!product.inStock && <span className="ml-1 inline-block px-1 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded">Out of Stock</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(product)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-2xl md:mx-auto p-0">
          <div className="p-4 sm:p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update the product details below." : "Fill in the details for the new product."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-title">Title *</Label>
                <Input
                  id="p-title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Lophophora Williamsii 4cm"
                />
              </div>

              {/* Image Upload Zone — only for non-variable products */}
              {!form.isVariable && (
                <>
                  <div className="space-y-1.5">
                    <Label>Product Images</Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          if (e.target.files) handleFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 text-muted-foreground/50" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </span>
                        ) : (
                          <>
                            Drag & drop images here, or <span className="text-primary font-medium">browse</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">
                        PNG, JPG, WebP up to 10MB each. First image is the main product image.
                      </p>
                    </div>
                  </div>

                  {/* Image previews */}
                  {allImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allImages.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`Image ${i + 1}`}
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded border border-border object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute -top-1 -left-1 bg-primary text-white text-[9px] font-bold px-1 rounded">
                              MAIN
                            </span>
                          )}
                          <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}
                                className="bg-muted border border-border rounded-full h-4 w-4 flex items-center justify-center text-[8px] hover:bg-primary hover:text-white"
                              >
                                {"\u2190"}
                              </button>
                            )}
                            {i < allImages.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}
                                className="bg-muted border border-border rounded-full h-4 w-4 flex items-center justify-center text-[8px] hover:bg-primary hover:text-white"
                              >
                                {"\u2192"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              className="bg-destructive text-white rounded-full h-4 w-4 flex items-center justify-center text-[8px] hover:bg-destructive/80"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual URL fallback */}
                  <div className="space-y-1.5">
                    <Label htmlFor="p-image">Or paste Image URL</Label>
                    <Input
                      id="p-image"
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  {/* Price for non-variable */}
                  <div className="space-y-1.5">
                    <Label htmlFor="p-price">Price (USD) *</Label>
                    <Input
                      id="p-price"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="19.99"
                      inputMode="decimal"
                    />
                  </div>
                </>
              )}

              {/* Variable Product Toggle */}
              <div className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold text-sm">Variable Product</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Toggle on if this product has variants with different images and prices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      isVariable: !f.isVariable,
                      variants: f.isVariable ? [] : f.variants.length > 0 ? f.variants : [{ id: newVariantId(), name: "", imageUrl: "", price: "" }],
                    }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      form.isVariable ? "bg-purple-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                        form.isVariable ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Variant sub-products */}
                {form.isVariable && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Sub-Products ({form.variants.length})
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Variant
                      </Button>
                    </div>

                    {form.variants.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        No variants yet. Click "Add Variant" to create one.
                      </p>
                    )}

                    {form.variants.map((variant, idx) => (
                      <div key={variant.id} className="border border-border rounded-lg p-3 bg-white space-y-2.5">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <Input
                              value={variant.name}
                              onChange={e => updateVariant(variant.id, "name", e.target.value)}
                              placeholder="Variant name (e.g. Small, 4cm)"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-28 shrink-0">
                            <Input
                              value={variant.price}
                              onChange={e => updateVariant(variant.id, "price", e.target.value)}
                              placeholder="Price"
                              inputMode="decimal"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveVariant(idx, idx - 1)}
                                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted text-xs"
                              >
                                {"\u2191"}
                              </button>
                            )}
                            {idx < form.variants.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveVariant(idx, idx + 1)}
                                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted text-xs"
                              >
                                {"\u2193"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="h-7 w-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Variant image — drag-and-drop zone */}
                        <div className="pl-6">
                          {variant.imageUrl ? (
                            <div className="relative group inline-block">
                              <img
                                src={variant.imageUrl}
                                alt={variant.name || "Variant"}
                                className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg border border-border object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => updateVariant(variant.id, "imageUrl", "")}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] hover:bg-destructive/80 shadow-sm"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer text-white text-[10px] font-medium px-2 py-1 bg-white/20 rounded backdrop-blur-sm hover:bg-white/30 transition-colors">
                                  Replace
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                      if (e.target.files?.[0]) handleVariantFile(variant.id, e.target.files[0]);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div
                              onDrop={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVariantDragOver(null);
                                if (e.dataTransfer.files.length > 0) {
                                  handleVariantFile(variant.id, e.dataTransfer.files[0]);
                                }
                              }}
                              onDragOver={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVariantDragOver(variant.id);
                              }}
                              onDragLeave={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVariantDragOver(null);
                              }}
                              onClick={() => variantFileRefs.current[variant.id]?.click()}
                              className={`h-20 w-20 sm:h-24 sm:w-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                variantDragOver === variant.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <input
                                ref={el => { variantFileRefs.current[variant.id] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  if (e.target.files?.[0]) handleVariantFile(variant.id, e.target.files[0]);
                                  e.target.value = "";
                                }}
                              />
                              {variantUploading === variant.id ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 text-muted-foreground/40" />
                                  <span className="text-[9px] text-muted-foreground/50 mt-1">Drop image</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {form.variants.length > 0 && (
                      <div className="text-[11px] text-muted-foreground bg-muted/50 rounded px-3 py-2">
                        Price range will be: {(() => {
                          const prices = form.variants.map(v => parsePriceToCents(v.price)).filter((p): p is number => p !== null && p > 0);
                          if (prices.length === 0) return "—";
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Stock Status</Label>
                  <div className="flex items-center gap-3 h-9">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        form.inStock ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                          form.inStock ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium">
                      {form.inStock ? (
                        <span className="text-green-600">In Stock</span>
                      ) : (
                        <span className="text-red-500">Out of Stock</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the product…"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product from your store. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate({ id: deleting.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
