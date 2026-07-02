import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "@/hooks/useSales";
import { useAuth } from "@/hooks/useAuth";

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id || "");
  const { user } = useAuth();
  const navigate = useNavigate();

  const company = user?.company;

  useEffect(() => {
    if (!id) navigate("/sales");
  }, [id, navigate]);

  useEffect(() => {
    if (invoice && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [invoice, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Preparing invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Invoice not found.</p>
          <button
            onClick={() => navigate("/sales")}
            style={{ marginTop: 16, padding: "8px 20px", background: "#14b8a6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
          >
            ← Back to Sales
          </button>
        </div>
      </div>
    );
  }

  const balance = invoice.total - (invoice.paidAmount || 0);
  const isPaid = invoice.status === "Paid" || balance <= 0;
  const isOverdue = invoice.status === "Overdue";
  const invoiceDate = new Date(invoice.createdAt);

  const statusColor = isPaid ? { bg: "#dcfce7", text: "#16a34a" }
    : isOverdue ? { bg: "#fee2e2", text: "#dc2626" }
    : { bg: "#fef3c7", text: "#d97706" };

  const statusLabel = isPaid ? "✓ PAID" : isOverdue ? "⚠ OVERDUE" : "⏳ PENDING";

  return (
    <>
      {/* ── Print Styles ───────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', sans-serif;
          background: #f1f5f9;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .invoice-page {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            padding: 18mm 14mm !important;
            border-radius: 0 !important;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* ── Toolbar (hidden on print) ───────────────────────────────────── */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          style={{
            background: "#0f766e", color: "white", border: "none",
            padding: "8px 18px", borderRadius: 8,
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          🖨️ Print / Save PDF
        </button>
        <button
          onClick={() => navigate("/sales")}
          style={{
            background: "#f1f5f9", color: "#374151",
            border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: 8,
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {/* ── Page Wrapper ────────────────────────────────────────────────── */}
      <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "40px 20px", display: "flex", justifyContent: "center" }}>
        <div
          className="invoice-page"
          style={{
            background: "white", maxWidth: 794, width: "100%",
            padding: "48px 52px", boxShadow: "0 8px 48px rgba(0,0,0,0.12)",
            borderRadius: 12, fontFamily: "Inter, sans-serif",
          }}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, borderBottom: "3px solid #0f766e", paddingBottom: 28 }}>
            {/* Company Info */}
            <div>
              {company?.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  style={{ height: 52, marginBottom: 10, objectFit: "contain" }}
                />
              )}
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
                {company?.name || "Prawns Accounting"}
              </h1>
              {company?.address && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>{company.address}</p>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                {company?.phone && (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>📞 {company.phone}</p>
                )}
                {company?.email && (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>✉️ {company.email}</p>
                )}
              </div>
              {company?.gstNumber && (
                <p style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                  <strong>GSTIN:</strong> {company.gstNumber}
                </p>
              )}
            </div>

            {/* Invoice Meta */}
            <div style={{ textAlign: "right" }}>
              {/* Status Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: statusColor.bg, borderRadius: 8, padding: "7px 14px", marginBottom: 12,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: statusColor.text }}>
                  {statusLabel}
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f766e", marginBottom: 6 }}>TAX INVOICE</h2>
              <table style={{ marginLeft: "auto", fontSize: 12, color: "#374151", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ paddingRight: 12, paddingBottom: 4, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.5px" }}>Invoice #</td>
                    <td style={{ paddingBottom: 4, fontWeight: 700, color: "#111827" }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 12, paddingBottom: 4, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>Date</td>
                    <td style={{ paddingBottom: 4 }}>{invoiceDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td style={{ paddingRight: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>Due Date</td>
                      <td style={{ color: isOverdue ? "#dc2626" : "#374151" }}>
                        {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Bill To ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 32, display: "flex", gap: 48 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 6 }}>
                BILL TO
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{invoice.customerName}</p>
              {typeof invoice.customer === "object" && invoice.customer?.phone && (
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>📞 {invoice.customer.phone}</p>
              )}
              {typeof invoice.customer === "object" && invoice.customer?.address && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2, maxWidth: 220 }}>{invoice.customer.address}</p>
              )}
            </div>
            {invoice.notes && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: 6 }}>
                  NOTES
                </p>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* ── Items Table ──────────────────────────────────────────────── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
            <thead>
              <tr style={{ background: "#0f766e" }}>
                {["#", "Product / Description", "Count Size", "Qty (bags)", "Rate (₹)", "Amount (₹)"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: i === 0 || i === 2 || i >= 3 ? "center" : "left",
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.5px", color: "white",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "11px 12px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 500, color: "#111827" }}>
                    {item.productName}
                    {item.batchNumber && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, color: "#4b5563",
                        background: "#f3f4f6", padding: "2px 6px",
                        borderRadius: 4, border: "1px solid #e5e7eb",
                      }}>
                        Batch: {item.batchNumber}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 12, color: "#374151", textAlign: "center" }}>
                    {item.countSize || (item.freezingBatch?.countSize) || "—"}
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: "#374151", textAlign: "center", fontWeight: 500 }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: "#374151", textAlign: "center" }}>
                    {item.unitPrice.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 700, color: "#111827", textAlign: "center" }}>
                    {item.lineTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Totals ───────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            <div style={{ minWidth: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>₹{invoice.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {invoice.gstRate > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({invoice.gstRate}%)</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>₹{invoice.gstAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 16px", background: "#0f766e", borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Total</span>
                <span style={{ fontSize: 19, fontWeight: 800, color: "white" }}>₹{invoice.total.toLocaleString("en-IN")}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: "#16a34a" }}>Amount Paid</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>−₹{invoice.paidAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 16px",
                    background: balance > 0 ? "#fef3c7" : "#dcfce7",
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: balance > 0 ? "#92400e" : "#166534" }}>Balance Due</span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: balance > 0 ? "#d97706" : "#16a34a" }}>
                      ₹{Math.abs(balance).toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Payment History ──────────────────────────────────────────── */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", marginBottom: 8 }}>
                PAYMENT HISTORY
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Method</th>
                    <th style={{ padding: "6px 10px", textAlign: "right", fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "7px 10px", fontSize: 12, color: "#6b7280" }}>{new Date(p.date).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, color: "#374151" }}>{p.paymentType}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 600, color: "#16a34a", textAlign: "right" }}>₹{p.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={{ borderTop: "2px solid #f3f4f6", paddingTop: 20, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                  Thank you for your business, {invoice.customerName.split(" ")[0]}!
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  For queries, contact us at {company?.phone || company?.email || "our office"}
                </p>
              </div>
              {/* Signature Area */}
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 160, borderBottom: "1px solid #d1d5db", marginBottom: 4, height: 36 }} />
                <p style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Authorised Signature
                </p>
              </div>
            </div>
            <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", marginTop: 20 }}>
              This is a computer-generated invoice — Generated by Prawns Accounting
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
