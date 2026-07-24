import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import type { Category } from "../../../../drizzle/schema";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.admin.categories.list.useQuery();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);

  const invalidate = () => {
    utils.admin.categories.list.invalidate();
    utils.store.categories.invalidate();
    utils.store.products.invalidate();
    utils.admin.products.list.invalidate();
  };

  const createMutation = trpc.admin.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created");
      setNewName("");
      invalidate();
    },
    onError: e => toast.error(e.message.includes("Duplicate") ? "A category with this name already exists" : e.message),
  });
  const updateMutation = trpc.admin.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category renamed");
      setEditingId(null);
      invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleting(null);
      invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  };

  return (
    <AdminLayout title="Categories">
      <form onSubmit={handleCreate} className="flex gap-2 mb-6 max-w-md">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name…"
        />
        <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </form>

      <div className="bg-white rounded-md border border-border max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No categories yet. Add one above to organize your products.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <form
                        className="flex gap-2 items-center"
                        onSubmit={e => {
                          e.preventDefault();
                          if (editName.trim()) updateMutation.mutate({ id: cat.id, name: editName.trim() });
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" aria-label="Save">
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <span className="font-medium">{cat.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                        aria-label="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(cat)}
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

      <AlertDialog open={Boolean(deleting)} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this category will not be deleted — they will become "Uncategorized".
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
