import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FormSelect, FormNumber, FormInput } from "@/components/forms";
import { Plus, X, Snowflake, Package, Calendar, MapPin, AlertTriangle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useFreezingBatches, useCreateFreezingBatch, useUpdateFreezingBatch, useDeleteFreezingBatch, type FreezingBatch } from "@/hooks/useFreezingBatches";
import { cn } from "@/lib/utils";

interface BatchFormData {
  dateFrozen: string;
  datePacked: string;
  quantityKgs: number;
  countSize: string;
  location: string;
  notes: string;
}

const countSizes = ["40 count", "60 count", "80 count", "100 count", "120 count", "Other"];

const statusColors: Record<string, string> = {
  frozen: "bg-blue-100 text-blue-700",
  packed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  exhausted: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  frozen: "Frozen",
  packed: "Packed",
  partial: "Partial",
  exhausted: "Exhausted",
};

export default function FreezingBatches() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [countSizeFilter, setCountSizeFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FreezingBatch | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: batchesData, isLoading, refetch } = useFreezingBatches({
    status: statusFilter !== "All" ? statusFilter : undefined,
    countSize: countSizeFilter !== "All" ? countSizeFilter : undefined,
  });
  const batches = batchesData?.data || [];


  const createBatch = useCreateFreezingBatch();
  const updateBatch = useUpdateFreezingBatch();
  const deleteBatch = useDeleteFreezingBatch();

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<BatchFormData>({
    mode: "onBlur",
    defaultValues: {
      dateFrozen: new Date().toISOString().split('T')[0],
      countSize: "40 count",
    },
  });

  const onCreateSubmit = async (data: BatchFormData) => {
    await createBatch.mutateAsync(data);
    reset();
    setIsCreateOpen(false);
  };

  const onEditSubmit = async (data: BatchFormData) => {
    if (!selectedBatch) return;
    await updateBatch.mutateAsync({ id: selectedBatch._id, ...data });
    reset();
    setIsEditOpen(false);
    setSelectedBatch(null);
  };

  const handleEdit = (batch: FreezingBatch) => {
    setSelectedBatch(batch);
    reset({
      dateFrozen: new Date(batch.dateFrozen).toISOString().split('T')[0],
      datePacked: batch.datePacked ? new Date(batch.datePacked).toISOString().split('T')[0] : "",
      quantityKgs: batch.quantityKgs,
      countSize: batch.countSize,
      location: batch.location || "",
      notes: batch.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    await deleteBatch.mutateAsync(selectedBatch._id);
    setIsEditOpen(false);
    setSelectedBatch(null);
  };

  const totalQuantity = batches.reduce((sum, b) => sum + b.quantityKgs, 0);
  const totalRemaining = batches.reduce((sum, b) => sum + b.remainingKgs, 0);
  const exhaustedCount = batches.filter((b) => b.status === "exhausted").length;

  return (
    <AppLayout title="Freezing Batches" subtitle="Manage frozen prawn batches">
      <PageHeader
        title="Freezing Batches"
        description={`${batches.length} batches · ${totalQuantity.toLocaleString("en-IN")} kg total · ${exhaustedCount} exhausted`}
        actions={
          <button
            onClick={() => { reset(); setIsCreateOpen(true); }}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={String(statusFilter)} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="flex-1 sm:flex-none h-9 px-3 rounded-lg border border-border bg-surface text-sm text-foreground outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="exhausted">Exhausted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(countSizeFilter)} onValueChange={(val) => setCountSizeFilter(val)}>
          <SelectTrigger className="flex-1 sm:flex-none h-9 px-3 rounded-lg border border-border bg-surface text-sm text-foreground outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Count Sizes</SelectItem>
            {countSizes.map((cs) => <SelectItem key={cs} value={cs}>{cs}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
            <Snowflake className="w-8 h-8 text-brand" />
          </div>
          <h3 className="font-display font-bold text-foreground text-base mb-1">No freezing batches yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Create your first freezing batch to track frozen prawns inventory.
          </p>
          <button
            onClick={() => { reset(); setIsCreateOpen(true); }}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>
      ) : (
        <DataTable
          data={batches}
          mobileCard={(r) => (
            <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <Snowflake className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground">{r.batchNumber}</p>
                    <p className="text-xs text-muted-foreground">{r.countSize}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", statusColors[r.status])}>
                  {statusLabels[r.status]}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frozen Date</span>
                  <span className="font-medium text-foreground">{new Date(r.dateFrozen).toLocaleDateString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium text-foreground">{r.quantityKgs} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={cn("font-medium", r.remainingKgs <= 0 ? "text-destructive" : "text-foreground")}>
                    {r.remainingKgs} kg
                  </span>
                </div>

              </div>
            </div>
          )}
          columns={[
            {
              key: "batchNumber",
              header: "Batch",
              cell: (r) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <Snowflake className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.batchNumber}</p>
                    <p className="text-xs text-muted-foreground">{r.countSize}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "dateFrozen",
              header: "Date Frozen",
              cell: (r) => <span className="text-muted-foreground text-sm">{new Date(r.dateFrozen).toLocaleDateString("en-IN")}</span>,
            },
            {
              key: "quantityKgs",
              header: "Quantity",
              cell: (r) => (
                <div>
                  <p className="font-display font-semibold text-foreground">{r.quantityKgs} kg</p>
                  <p className="text-xs text-muted-foreground">{r.remainingKgs} kg remaining</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (r) => (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                  {statusLabels[r.status]}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              cell: (r) => (
                <button
                  onClick={() => handleEdit(r)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand hover:bg-brand-light transition-colors"
                >
                  <Package className="w-3.5 h-3.5" /> View/Edit
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Create Batch Modal */}
      {mounted && isCreateOpen && createPortal(
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-panel w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-foreground">Create Freezing Batch</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  type="date"
                  label="Date Frozen *"
                  {...register("dateFrozen", { required: "Required" })}
                  error={errors.dateFrozen}
                />
                <FormInput
                  type="date"
                  label="Date Packed"
                  {...register("datePacked")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Count Size *"
                  options={countSizes.map((cs) => ({ value: cs, label: cs }))}
                  name="countSize" control={control} required
                  error={errors.countSize}
                />
                <FormNumber
                  label="Quantity (kg) *"
                  placeholder="100"
                  {...register("quantityKgs", { required: "Required", min: { value: 0.1, message: "Must be > 0" } })}
                  error={errors.quantityKgs}
                />
              </div>

              <FormInput
                label="Location"
                placeholder="e.g., Shelf A1, Freezer 2"
                {...register("location")}
              />
              <div>
                <label className="block text-sm font-display font-medium text-foreground mb-1.5">Notes (optional)</label>
                <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-brand/50 resize-none" placeholder="Any additional notes..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 h-10 rounded-lg border border-border bg-surface text-sm font-display font-semibold hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createBatch.isPending} className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {createBatch.isPending ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Creating...</span></>
                  ) : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Batch Modal */}
      {mounted && isEditOpen && selectedBatch && createPortal(
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-panel w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">Edit Batch</h2>
                <p className="text-xs text-muted-foreground">{selectedBatch.batchNumber}</p>
              </div>
              <button onClick={() => { setIsEditOpen(false); setSelectedBatch(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-secondary border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Initial Quantity</span>
                <span className="font-medium text-foreground">{selectedBatch.quantityKgs} kg</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Remaining</span>
                <span className={cn("font-medium", selectedBatch.remainingKgs <= 0 ? "text-destructive" : "text-foreground")}>
                  {selectedBatch.remainingKgs} kg
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  type="date"
                  label="Date Packed"
                  {...register("datePacked")}
                />
                <FormSelect
                  label="Status"
                  options={[
                    { value: "frozen", label: "Frozen" },
                    { value: "packed", label: "Packed" },
                    { value: "partial", label: "Partial" },
                    { value: "exhausted", label: "Exhausted" },
                  ]}
                  name="status" control={control}
                />
              </div>
              <FormInput
                label="Location"
                placeholder="e.g., Shelf A1, Freezer 2"
                {...register("location")}
              />
              <div>
                <label className="block text-sm font-display font-medium text-foreground mb-1.5">Notes (optional)</label>
                <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-brand/50 resize-none" placeholder="Any additional notes..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedBatch(null); }} className="flex-1 h-10 rounded-lg border border-border bg-surface text-sm font-display font-semibold hover:bg-secondary transition-colors">Cancel</button>
                <button type="button" onClick={handleDelete} disabled={selectedBatch.remainingKgs < selectedBatch.quantityKgs} className="h-10 px-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm font-display font-semibold hover:bg-destructive/10 disabled:opacity-50 transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button type="submit" disabled={updateBatch.isPending} className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {updateBatch.isPending ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Saving...</span></>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </AppLayout>
  );
}
