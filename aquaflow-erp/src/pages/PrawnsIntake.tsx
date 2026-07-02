import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { FormCombobox, FormSelect, FormNumber } from "@/components/forms";
import { Plus, X, Package, Search, Calendar, Scale, IndianRupee, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useProducts } from "@/hooks/useProducts";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useCreateIntake, useUpdateIntake, useDeleteIntake } from "@/hooks/useIntake";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts as useProductsWebSocket, useInventory as useInventoryWebSocket } from "@/hooks/useModuleWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const COUNT_VALUES = [
  "100c", "90c", "80c", "70c", "60c", "50c", "47c", "45c", "42c", "41c", "40c",
  "37c", "35c", "33c", "32c", "31c", "30c", "27c", "25c", "22c", "21c", "20c",
  "19c", "18c", "17c", "16c", "15c", "other"
];

const getCountGroup = (countSize: string) => {
  const num = parseInt(countSize);
  if (isNaN(num)) return "Other";
  if (num >= 91 && num <= 100) return "91/100";
  if (num >= 81 && num <= 90) return "81/90";
  if (num >= 71 && num <= 80) return "71/80";
  if (num >= 61 && num <= 70) return "61/70";
  if (num >= 51 && num <= 60) return "51/60";
  if (num >= 41 && num <= 50) return "41/50";
  if (num >= 31 && num <= 40) return "31/40";
  if (num >= 26 && num <= 30) return "26/30";
  if (num >= 21 && num <= 25) return "21/25";
  if (num >= 16 && num <= 20) return "16/20";
  if (num >= 13 && num <= 15) return "13/15";
  if (num >= 9 && num <= 12) return "8/12";
  if (num >= 6 && num <= 8) return "6/8";
  return "Other";
};

const SORTED_GROUPS = [
  "6/8", "8/12", "13/15", "16/20", "21/25", "26/30", "31/40", "41/50",
  "51/60", "61/70", "71/80", "81/90", "91/100", "Other"
];

interface IntakeFormData {
  farmerName: string;
  paymentMethod: string;
  countValue: string;
  weight: number;
  amountPerKg: number;
}

export default function PrawnsIntake() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: allProducts = [], isLoading: loadingProducts, refetch: refetchProducts } = useProducts();
  const { data: posData, isLoading: loadingPos, refetch: refetchPos } = usePurchaseOrders({ status: "Received" });
  const { data: farmers = [] } = useSuppliers();
  const createIntake = useCreateIntake();
  const updateIntake = useUpdateIntake();
  const deleteIntake = useDeleteIntake();
  const queryClient = useQueryClient();

  useProductsWebSocket(
    () => { refetchProducts(); refetchPos(); },
    () => { refetchProducts(); refetchPos(); },
    () => { refetchProducts(); refetchPos(); }
  );

  useInventoryWebSocket(
    () => { refetchProducts(); refetchPos(); },
    () => { refetchProducts(); refetchPos(); }
  );

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<IntakeFormData>({
    defaultValues: { paymentMethod: 'Cash', countValue: '40c' }
  });

  const weight = watch('weight') || 0;
  const amountPerKg = watch('amountPerKg') || 0;
  const totalAmount = weight * amountPerKg;

  const onAddSubmit = (data: IntakeFormData) => {
    if (editId) {
      updateIntake.mutate(
        { id: editId, data },
        {
          onSuccess: () => {
            setIsAddOpen(false);
            setEditId(null);
            reset();
          },
        }
      );
    } else {
      createIntake.mutate(data, {
        onSuccess: () => {
          setIsAddOpen(false);
          reset();
        },
      });
    }
  };

  const openAddModal = () => {
    setEditId(null);
    reset({
      farmerName: "",
      paymentMethod: "Cash",
      countValue: "40c",
      weight: 0,
      amountPerKg: 0
    });
    setIsAddOpen(true);
  };

  const handleEditClick = (po: any) => {
    const item = po.items[0];
    if (!item) return;
    setEditId(po._id);
    reset({
      farmerName: po.supplierName,
      paymentMethod: po.notes?.includes("Cash") ? "Cash" : "Credit",
      countValue: item.productName.replace("Vannamei Prawns ", ""),
      weight: item.quantity,
      amountPerKg: item.unitCost,
    });
    setIsAddOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteIntake.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const inventoryBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    SORTED_GROUPS.forEach(g => buckets[g] = 0);

    const vannameiProducts = allProducts.filter(p => p.category === 'Vannamei Prawns');
    vannameiProducts.forEach(p => {
      if (!p.countSize) return;
      const group = getCountGroup(p.countSize);
      if (buckets[group] !== undefined) {
        buckets[group] += (p.stock || 0);
      } else {
        buckets['Other'] = (buckets['Other'] || 0) + (p.stock || 0);
      }
    });
    return buckets;
  }, [allProducts]);

  const intakeHistory = useMemo(() => {
    return (posData?.data || []).filter(po => po.poNumber.startsWith('IN-') || po.poNumber.startsWith('PO-'));
  }, [posData]);

  return (
    <AppLayout title="Prawns Intake" subtitle="Manage your Vannamei prawns intake">
      <PageHeader
        title="Prawns Intake"
        description="Add and manage your Vannamei prawns intake and inventory by count size"
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors shadow-button"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Intake</span>
          </button>
        }
      />

      <div className="mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand" /> Current Inventory by Count
        </h3>
        
        {loadingProducts ? (
          <div className="flex justify-center p-8"><div className="w-6 h-6 rounded-full border-2 border-brand/20 border-t-brand animate-spin" /></div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {SORTED_GROUPS.map(group => {
              const kg = inventoryBuckets[group];
              if (kg === 0 && group !== '31/40' && group !== '26/30' && group !== '21/25' && group !== '16/20' && group !== 'Other') return null;
              return (
                <div key={group} className="flex-1 min-w-[120px] max-w-[160px] bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-brand/30 hover:shadow-md transition-all">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group}</span>
                  <span className={cn("font-display text-2xl font-bold", kg > 0 ? "text-foreground" : "text-muted-foreground/50")}>
                    {kg.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Recent Intakes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Farmer (Supplier)</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items / Wt</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingPos ? (
                <tr><td colSpan={6} className="py-8 text-center"><div className="w-6 h-6 mx-auto rounded-full border-2 border-brand/20 border-t-brand animate-spin" /></td></tr>
              ) : intakeHistory.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No recent intakes found</td></tr>
              ) : intakeHistory.map(po => (
                <tr key={po._id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-50" />
                      {new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-foreground">{po.poNumber}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{po.supplierName || 'Unknown Farmer'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      {po.items.map((item, i) => (
                        <span key={i} className="text-xs bg-secondary/50 text-foreground px-2 py-1 rounded-md w-fit">
                          {item.productName.replace('Vannamei Prawns ', '')} · {item.quantity}kg @ ₹{item.unitCost}/kg
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-display font-semibold text-foreground">
                    ₹{po.totalAmount.toLocaleString('en-IN')}
                    {po.notes && po.notes.includes('Credit') && (
                      <span className="ml-2 text-[10px] uppercase bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Credit</span>
                    )}
                    {po.notes && po.notes.includes('Cash') && (
                      <span className="ml-2 text-[10px] uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Cash</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(po)} className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand/10 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(po._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the intake record and reverse any stock and farmer ledger updates associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Intake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAddOpen && createPortal(
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
          <div className="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-border shadow-panel max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">{editId ? "Edit Prawn Intake" : "Add Prawn Intake"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editId ? "Modify an existing intake" : "Record a new vannamei prawns intake"}</p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onAddSubmit)} className="p-5 space-y-4">
              <FormCombobox
                label="Farmer Name"
                placeholder="Select or enter new farmer name"
                name="farmerName"
                control={control}
                options={farmers.map(f => ({ value: f.name, label: f.name }))}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Payment Method"
                  options={[{ value: 'Cash', label: 'Cash' }, { value: 'Credit', label: 'Credit' }]}
                  name="paymentMethod" control={control}
                />
                <FormSelect
                  label="Count Value"
                  options={COUNT_VALUES.map(c => ({ value: c, label: c }))}
                  name="countValue" control={control}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormNumber
                  label="Weight (kg)"
                  placeholder="0"
                  {...register("weight", { required: "Required", min: { value: 0.1, message: "> 0" } })}
                  error={errors.weight}
                  icon={Scale}
                />
                <FormNumber
                  label="Amount Per Kg (₹)"
                  placeholder="0"
                  {...register("amountPerKg", { required: "Required", min: { value: 0, message: ">= 0" } })}
                  error={errors.amountPerKg}
                  icon={IndianRupee}
                />
              </div>

              <div className="mt-2 p-4 bg-brand/5 border border-brand/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold text-sm">Total Amount</span>
                </div>
                <span className="font-display font-bold text-xl text-brand">
                  ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              {watch('paymentMethod') === 'Credit' && (
                <p className="text-xs text-orange-600 font-medium px-1">
                  * This amount will be added to the farmer's outstanding balance.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-border bg-surface text-sm font-display font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createIntake.isPending}
                  className="flex-1 h-11 rounded-xl bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {createIntake.isPending ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Saving…</span></>
                  ) : "Save Intake"}
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
