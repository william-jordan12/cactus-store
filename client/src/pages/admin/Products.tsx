import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { formatPrice, parsePriceToCents } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import type { Product } from "../../../../drizzle/schema";
import { ImageOff, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

interface FormState {
  title: string;
  imageUrl: string;
  images: string[];
  price: string;
  categoryId: string;
  description: string;
}

const EMPTY_FORM: FormState = { title: "", imageUrl: "", images: [], price: "", categoryId: "none", description: "" };

function parseProductImages(product: Product): string[] {
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return product.imageUrl ? [product.imageUrl] : [];
}

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const searchString = useSearch();
  const { data: products, isLoading } = trpc.admin.products.list.useQuery();
  const { data: categories } = trpc.admin.categories.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm({
      title: product.title,
      imageUrl: product.imageUrl ?? "",
      images,
      price: (product.priceCents / 100).toFixed(2),
      categoryId: product.categoryId ? String(product.categoryId) : "none",
      description: product.description ?? "",
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

  const handleSubmit = async () => {
    const priceCents = parsePriceToCents(form.price);
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (priceCents === null) {
      toast.error("Enter a valid price, e.g. 19.99");
      return;
    }
    const payload = {
      title: form.title.trim(),
      imageUrl: form.images.length > 0 ? null : (form.imageUrl.trim() || null),
      images: form.images.length > 0 ? form.images : null,
      priceCents,
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
  const saving = createMutation.isPending || updateMutation.isPending || uploading;
  const allImages = form.images.length > 0 ? form.images : (form.imageUrl ? [form.imageUrl] : []);

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
                      <TableCell className="font-medium max-w-[280px] truncate">{product.title}</TableCell>
                      <TableCell className="text-muted-foreground">{categoryName(product.categoryId)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(product.priceCents)}</TableCell>
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
                    <div className="font-medium text-sm truncate">{product.title}</div>
                    <div className="text-xs text-muted-foreground">{categoryName(product.categoryId)} · {formatPrice(product.priceCents)}</div>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl mx-4 md:mx-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the product details below." : "Fill in the details for the new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Title *</Label>
              <Input
                id="p-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Lophophora Williamsii 4cm"
              />
            </div>

            {/* Image Upload Zone */}
            <div className="space-y-1.5">
              <Label>Product Images</Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
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
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
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
                <p className="text-xs text-muted-foreground/60 mt-1">
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
                      className="h-20 w-20 rounded border border-border object-cover"
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

            <div className="grid grid-cols-2 gap-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
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
