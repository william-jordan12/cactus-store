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
import { ImageOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

interface FormState {
  title: string;
  imageUrl: string;
  price: string;
  categoryId: string;
  description: string;
}

const EMPTY_FORM: FormState = { title: "", imageUrl: "", price: "", categoryId: "none", description: "" };

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const searchString = useSearch();
  const { data: products, isLoading } = trpc.admin.products.list.useQuery();
  const { data: categories } = trpc.admin.categories.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Support the admin bar's "Add Product" quick link (/admin/products?new=1)
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
    setForm({
      title: product.title,
      imageUrl: product.imageUrl ?? "",
      price: (product.priceCents / 100).toFixed(2),
      categoryId: product.categoryId ? String(product.categoryId) : "none",
      description: product.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
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
      imageUrl: form.imageUrl.trim() || null,
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
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title="Products">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-md border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No products yet. Click "Add Product" to create your first one.
          </div>
        ) : (
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
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-1.5">
              <Label htmlFor="p-image">Image URL</Label>
              <Input
                id="p-image"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
              />
              {form.imageUrl && (
                <div className="h-24 w-24 rounded border border-border overflow-hidden mt-2">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
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
