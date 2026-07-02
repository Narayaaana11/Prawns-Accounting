import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardSkeleton, ChartSkeleton, ListItemSkeleton } from "@/components/ui/loading-skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ShoppingCart, Package, AlertTriangle, Users, TrendingUp,
  DollarSign, Calendar, RefreshCw, Weight, Layers, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { useDashboard, useSalesTrend, useTopProducts, useInventoryValue } from "@/hooks/useReports";
import { useLoadDemoData } from "@/hooks/useSettings";
import { useWebSocketContext } from "@/hooks/useWebSocketContext";
import { AppLogo } from "@/components/AppLogo";

const COLORS = ["#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Custom Tooltip for currency values
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: ₹{(entry.value || 0).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("month");
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data: dashData, isLoading: dashLoading, refetch } = useDashboard(dateRange);
  const { data: trendData, isLoading: isTrendLoading } = useSalesTrend("year");
  const { data: topProductsData, isLoading: isTopLoading } = useTopProducts(5);
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryValue();
  const loadDemoMutation = useLoadDemoData();

  // WebSocket integration
  const { isConnected, subscribe, on, off } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      subscribe("dashboard");
      subscribe("sales");
      subscribe("products");
      subscribe("inventory");

      const handleDashboardUpdate = (data: any) => {
        if (import.meta.env.DEV) console.log("📊 Real-time dashboard update:", data);
        if (data?.kpis) {
          setRealTimeData(data);
          setLastUpdate(new Date());
        } else {
          if (import.meta.env.DEV) console.log("🔄 Refetching dashboard");
          refetch();
          setLastUpdate(new Date());
        }
      };

      const handleLowStockAlert = (data: any) => {
        setLowStockAlerts(data.products || []);
      };

      const handleInvoiceCreated = () => {
        setLastUpdate(new Date());
        refetch();
      };

      const handleProductUpdate = () => refetch();

      on("dashboard_update", handleDashboardUpdate);
      on("low_stock_alert", handleLowStockAlert);
      on("invoice_created", handleInvoiceCreated);
      on("product_update", handleProductUpdate);
      on("product_created", handleProductUpdate);

      return () => {
        off("dashboard_update");
        off("low_stock_alert");
        off("invoice_created");
        off("product_update");
        off("product_created");
      };
    }
  }, [isConnected, subscribe, on, off, refetch]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const dashboardSource = realTimeData || dashData;
  const kpis = dashboardSource?.kpis;
  const recentSales = dashboardSource?.recentSales || [];

  const salesTrend = (trendData || []).map((item: any) => ({
    month: item._id.month ? monthNames[item._id.month - 1] : "",
    Sales: item.sales,
    Expenses: item.expenses,
  }));

  const inventoryValue = inventoryData?.breakdown || [];
  const topProducts = topProductsData || [];

  const isEmptyWorkspace =
    !dashLoading && (kpis?.production?.value === 0 || !kpis?.production?.value);

  return (
    <AppLayout title="Dashboard" subtitle={today}>

      {/* WebSocket Status Bar */}
      <div className="mb-4 flex items-center justify-between px-4 py-2 rounded-lg bg-surface border border-border text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-muted-foreground">
            {isConnected ? "✅ Live Updates Connected" : "⚠️ Live Updates Disconnected"}
          </span>
          {lastUpdate && (
            <span className="text-muted-foreground text-xs">
              • Last update: {lastUpdate.toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-4 bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-warning mb-3">
            ⚠️ Low Stock Alert ({lowStockAlerts.length} items)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lowStockAlerts.slice(0, 4).map((product: any) => (
              <div key={product._id} className="text-xs text-warning/80 bg-warning/5 rounded p-2">
                {product.name}: {product.stock} units (threshold: {product.lowStockThreshold})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Filter + Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-foreground">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={String(dateRange)} onValueChange={(val) => setDateRange(val)}>
            <SelectTrigger className="flex-1 bg-transparent outline-none text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          Refresh
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
        {dashLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Period Sales"
              value={`₹${(kpis?.sales?.value || 0).toLocaleString("en-IN")}`}
              change={`${kpis?.sales?.change >= 0 ? "+" : ""}${kpis?.sales?.change || 0}% vs previous`}
              changeType={kpis?.sales?.change >= 0 ? "positive" : "negative"}
              icon={ShoppingCart}
            />
            <StatCard
              title="Total Production"
              value={`${(kpis?.production?.value || 0).toLocaleString("en-IN")} kg`}
              change={`${kpis?.production?.change >= 0 ? "+" : ""}${kpis?.production?.change || 0}% vs previous`}
              changeType={kpis?.production?.change >= 0 ? "positive" : "negative"}
              icon={Package}
            />
            <StatCard
              title="Meat Purchased"
              value={`${(kpis?.meatPurchased?.value || 0).toLocaleString("en-IN")} kg`}
              change={`${kpis?.meatPurchased?.change >= 0 ? "+" : ""}${kpis?.meatPurchased?.change || 0}% vs previous`}
              changeType={kpis?.meatPurchased?.change >= 0 ? "positive" : "negative"}
              icon={Weight}
            />
            <StatCard
              title="Total Customers"
              value={String(kpis?.customers?.value || 0)}
              subtitle={kpis?.overdue?.value > 0 ? `${kpis.overdue.value} overdue invoices` : undefined}
              changeType={kpis?.overdue?.value > 0 ? "negative" : "positive"}
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Charts Grid — Row 1: Sales Trend (full width) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4 mb-4">
        <div className="xl:col-span-2 bg-surface rounded-xl border border-border shadow-card p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-xs font-display font-semibold uppercase tracking-wide text-muted-foreground">
                Sales vs Expenses Trend
              </p>
              <p className="font-display text-xl font-bold text-foreground mt-0.5">
                ₹{(kpis?.sales?.value || 0).toLocaleString("en-IN")} this {dateRange}
              </p>
            </div>
            {kpis?.sales?.change !== undefined && (
              <div
                className={`flex items-center gap-1.5 text-sm font-medium mt-2 sm:mt-0 ${
                  kpis.sales.change >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {kpis.sales.change >= 0 ? "+" : ""}{kpis.sales.change}%
              </div>
            )}
          </div>
          {isTrendLoading ? (
            <ChartSkeleton height={200} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesTrend.length > 0 ? salesTrend : [{ month: "No data", Sales: 0 }]}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-body)", fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)", fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="Sales" stroke="#14b8a6" strokeWidth={2} fill="url(#gradSales)" />
                <Area type="monotone" dataKey="Expenses" stroke="#f59e0b" strokeWidth={2} fill="url(#gradExp)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Breakdown Pie */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-4 md:p-5">
          <p className="text-xs font-display font-semibold uppercase tracking-wide text-muted-foreground">
            Inventory Value
          </p>
          <p className="font-display text-xl font-bold text-foreground mt-0.5 mb-4">By Category</p>
          {isInventoryLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-full bg-muted/60 animate-pulse" />
              <div className="w-full space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-muted/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : inventoryValue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Layers className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No inventory data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={inventoryValue}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {inventoryValue.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Value"]}
                    contentStyle={{ border: "1px solid hsl(214 32% 91%)", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {inventoryValue.slice(0, 5).map((item: any, i: number) => (
                  <li key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-foreground font-medium truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Charts Grid — Row 2: Top Products + Recent Sales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4">
        {/* Top Selling Products */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-4 md:p-5">
          <p className="text-xs font-display font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Top Selling Products
          </p>
          {isTopLoading ? (
            <ChartSkeleton height={180} />
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No sales data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 0, right: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(214 32% 91%)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fontFamily: "var(--font-body)", fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fontFamily: "var(--font-body)", fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString("en-IN")} units`, "Qty"]}
                  contentStyle={{ border: "1px solid hsl(214 32% 91%)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="qty" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Sales */}
        <div className="xl:col-span-2 bg-surface rounded-xl border border-border shadow-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-display font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Sales
            </p>
            {lastUpdate && (
              <span className="text-[10px] text-muted-foreground/60">
                Updated {lastUpdate.toLocaleTimeString("en-IN")}
              </span>
            )}
          </div>
          {dashLoading ? (
            <ListItemSkeleton count={5} />
          ) : recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No sales yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Create your first invoice to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map((s: any) => (
                <div key={s._id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.invoiceNumber} · {new Date(s.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-display font-semibold text-foreground">
                      ₹{(s.total || 0).toLocaleString("en-IN")}
                    </p>
                    <StatusBadge status={s.status} variant="payment" className="mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </AppLayout>
  );
}
