import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/StatusBadge";
import { FormInput, FormSelect, FormNumber } from "@/components/forms";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Search, Plus, Pencil, Trash2, Users, X, AlertTriangle, MessageCircle, Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, type Supplier } from "@/hooks/useSuppliers";
import { createPortal } from "react-dom";

interface FarmerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: string;
  gstNumber: string;
  notes: string;
}

export default function Farmers() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: farmers = [], isLoading, refetch } = useSuppliers({
    search: searchQuery || undefined,
  });

  const createFarmer = useCreateSupplier();
  const updateFarmer = useUpdateSupplier();
  const deleteFarmer = useDeleteSupplier();

  const { register: registerAdd, control: controlAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: addErrors } } =
    useForm<FarmerFormData>({ mode: "onBlur" });

  const { register: registerEdit, control: controlEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } =
    useForm<FarmerFormData>({ mode: "onBlur" });

  const totalOutstanding = farmers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  const onAddSubmit = async (data: FarmerFormData) => {
    await createFarmer.mutateAsync(data);
    resetAdd();
    setIsAddOpen(false);
  };

  const onEditSubmit = async (data: FarmerFormData) => {
    if (!selectedFarmer) return;
    await updateFarmer.mutateAsync({ id: selectedFarmer._id, ...data });
    resetEdit();
    setIsEditOpen(false);
    setSelectedFarmer(null);
  };

  const handleEdit = (farmer: Supplier) => {
    setSelectedFarmer(farmer);
    resetEdit({
      name: farmer.name,
      phone: farmer.phone || "",
      email: farmer.email || "",
      address: farmer.address || "",
      city: farmer.city || "",
      state: farmer.state || "",
      paymentTerms: farmer.paymentTerms || "Cash",
      gstNumber: farmer.gstNumber || "",
      notes: farmer.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFarmer) return;
    await deleteFarmer.mutateAsync(selectedFarmer._id);
    setIsDeleteOpen(false);
    setSelectedFarmer(null);
  };

  const FarmerForm = ({ reg, control, submit, errs, isSubmitting, title, onClose }: any) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
        <div className="bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-panel w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <FormInput label="Farmer / Supplier Name *" placeholder="Ravi Kumar" {...reg("name", { required: "Name is required" })} error={errs.name} />
              </div>
              <FormInput label="Phone" placeholder="9876543210" {...reg("phone")} />
              <FormInput label="Email" type="email" placeholder="farmer@email.com" {...reg("email")} />
              <FormInput label="City" placeholder="Vijayawada" {...reg("city")} />
              <FormInput label="State" placeholder="Andhra Pradesh" {...reg("state")} />
              <FormSelect label="Payment Terms" options={[{ value: 'Cash', label: 'Cash' }, { value: 'Net30', label: 'Credit (Net 30)' }, { value: 'Net15', label: 'Credit (Net 15)' }]} name="paymentTerms" control={control} />
              <div className="col-span-1 sm:col-span-2">
                <FormInput label="Address" placeholder="Full address" {...reg("address")} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border bg-surface text-sm font-display font-semibold hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {isSubmitting ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Saving...</span></> : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <AppLayout title="Farmers" subtitle="Manage farmer accounts and balances">
      <PageHeader
        title="Farmers & Suppliers"
        description={`${farmers.length} farmers · ₹${totalOutstanding.toLocaleString("en-IN")} total outstanding balance`}
        actions={
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Farmer
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-sm" placeholder="Search farmers…" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-brand/20 border-t-brand animate-spin" /></div>
      ) : farmers.length === 0 ? (
        <EmptyState icon={Tractor} title="No farmers found" description="Add your first farmer to start tracking intakes." action={{ label: "Add Farmer", onClick: () => setIsAddOpen(true) }} />
      ) : (
        <DataTable
          data={farmers}
          mobileCard={(r) => {
            return (
              <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.phone}{r.city ? ` · ${r.city}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                  <div className="flex gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Outstanding Balance</p>
                      <div className="flex items-center gap-1">
                        <p className={`font-display font-bold ${r.outstandingBalance > 0 ? "text-warning" : "text-foreground"}`}>₹{r.outstandingBalance.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand hover:bg-brand-light transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setSelectedFarmer(r); setIsDeleteOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
          columns={[
            {
              key: "name",
              header: "Farmer Name",
              cell: (r) => (
                <div>
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.phone} {r.city ? `· ${r.city}` : ""}</p>
                </div>
              ),
            },
            {
              key: "paymentTerms",
              header: "Payment Terms",
              cell: (r) => <span className="text-sm text-foreground">{r.paymentTerms}</span>,
            },
            {
              key: "outstandingBalance",
              header: "Outstanding Balance",
              cell: (r) => {
                return (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${r.outstandingBalance > 0 ? "text-warning" : "text-foreground"}`}>
                      ₹{r.outstandingBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              cell: (r) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand hover:bg-brand-light transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { setSelectedFarmer(r); setIsDeleteOpen(true); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {isAddOpen && (
        <FarmerForm
          reg={registerAdd}
          control={controlAdd}
          submit={handleAddSubmit(onAddSubmit)}
          errs={addErrors}
          isSubmitting={createFarmer.isPending}
          title="Add Farmer"
          onClose={() => setIsAddOpen(false)}
        />
      )}

      {isEditOpen && selectedFarmer && (
        <FarmerForm
          reg={registerEdit}
          control={controlEdit}
          submit={handleEditSubmit(onEditSubmit)}
          errs={editErrors}
          isSubmitting={updateFarmer.isPending}
          title="Edit Farmer"
          onClose={() => { setIsEditOpen(false); setSelectedFarmer(null); }}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Farmer"
        message={`Delete "${selectedFarmer?.name}"? This cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteFarmer.isPending}
        onConfirm={handleDelete}
        onCancel={() => { setIsDeleteOpen(false); setSelectedFarmer(null); }}
      />
    </AppLayout>
  );
}
