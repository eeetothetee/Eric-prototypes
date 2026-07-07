import { useCallback, useEffect, useState } from "react";
import { api, currentMonth } from "./api";
import type { Bill, Household, MonthData } from "./types";
import type { ExtData } from "./store";
import { loadExt, saveExt } from "./store";
import Dashboard, { type Sub } from "./components/Dashboard";
import MonthView from "./components/MonthView";
import BillsView from "./components/BillsView";
import InsightsView from "./components/InsightsView";
import SettingsView from "./components/SettingsView";
import BillForm from "./components/BillForm";
import PaySheet from "./components/PaySheet";
import TransactionsView from "./components/TransactionsView";
import CashFlowView from "./components/CashFlowView";
import BudgetView from "./components/BudgetView";
import GoalsView from "./components/GoalsView";
import {
  ArrowLeftIcon,
  GearIcon,
  HomeIcon,
  ListIcon,
  PlusIcon,
  ChartIcon,
  initials,
} from "./components/icons";

type Tab = "home" | "bills" | "insights" | "settings";

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "bills", label: "Bills", Icon: ListIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "settings", label: "Settings", Icon: GearIcon },
];

const SUB_TITLES: Record<Sub, string> = {
  transactions: "Transactions",
  cashflow: "Cash Flow",
  budget: "Budget",
  goals: "Goals",
  recurring: "Recurring Bills",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [sub, setSub] = useState<Sub | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [household, setHousehold] = useState<Household | null>(null);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [ext, setExt] = useState<ExtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [billFormOpen, setBillFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [hh, md] = await Promise.all([api.getHousehold(), api.getMonth(month)]);
      setHousehold(hh);
      setMonthData(md);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [month, showToast]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    loadExt()
      .then(setExt)
      .catch(() => showToast("Could not load household data"));
  }, [showToast]);

  const mutateExt = useCallback(
    async (fn: (d: ExtData) => void) => {
      if (!ext) return;
      const next = structuredClone(ext);
      fn(next);
      setExt(next);
      try {
        await saveExt(next);
      } catch {
        showToast("Could not save — check your connection");
      }
    },
    [ext, showToast]
  );

  const togglePaid = async (bill: Bill) => {
    const item = monthData?.items.find((it) => it.bill.id === bill.id);
    if (item?.payment) {
      await api.unpayBill(bill.id, month);
      showToast(`${bill.name} marked unpaid`);
      refresh();
    } else {
      setPayingBill(bill);
    }
  };

  const openAddBill = () => {
    setEditingBill(null);
    setBillFormOpen(true);
  };

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setBillFormOpen(true);
  };

  const switchTab = (t: Tab) => {
    setSub(null);
    setTab(t);
    // The dashboard always reflects the real current month.
    if (t === "home") setMonth(currentMonth());
  };

  const title =
    tab === "home"
      ? "Dashboard"
      : tab === "bills"
        ? "Monthly Bills"
        : tab === "insights"
          ? "Insights"
          : "Settings";

  return (
    <div className="app">
      {sub ? (
        <header className="subheader">
          <button className="back" onClick={() => setSub(null)} aria-label="Back">
            <ArrowLeftIcon width={18} height={18} />
          </button>
          <h1>{SUB_TITLES[sub]}</h1>
        </header>
      ) : (
        <header className="app-header">
          <div>
            <div className="household">{household?.householdName ?? "\u2014"}</div>
            <h1>{title}</h1>
          </div>
          <div className="avatars">
            {household?.members.map((m) => (
              <div key={m.id} className="avatar" style={{ background: m.color }} title={m.name}>
                {initials(m.name)}
              </div>
            ))}
          </div>
        </header>
      )}

      {loading || !monthData || !household || !ext ? (
        <div className="loading">Loading</div>
      ) : sub ? (
        <>
          {sub === "transactions" && (
            <TransactionsView ext={ext} members={household.members} mutate={mutateExt} />
          )}
          {sub === "cashflow" && <CashFlowView ext={ext} month={month} />}
          {sub === "budget" && <BudgetView ext={ext} month={month} mutate={mutateExt} />}
          {sub === "goals" && <GoalsView ext={ext} mutate={mutateExt} />}
          {sub === "recurring" && (
            <BillsView
              bills={monthData.items.map((it) => it.bill).filter((b) => b.active === 1)}
              members={household.members}
              onEdit={openEditBill}
              onAdd={openAddBill}
            />
          )}
        </>
      ) : (
        <>
          {tab === "home" && (
            <Dashboard
              ext={ext}
              monthData={monthData}
              month={currentMonth()}
              onOpen={setSub}
              onPayBill={(bill) => setPayingBill(bill)}
              onViewBills={() => switchTab("bills")}
            />
          )}
          {tab === "bills" && (
            <MonthView
              data={monthData}
              month={month}
              onMonthChange={setMonth}
              onTogglePaid={togglePaid}
              onEditBill={openEditBill}
              onAddBill={openAddBill}
            />
          )}
          {tab === "insights" && <InsightsView monthData={monthData} />}
          {tab === "settings" && (
            <SettingsView
              household={household}
              onSaved={() => {
                showToast("Saved");
                refresh();
              }}
            />
          )}
        </>
      )}

      {!sub && tab === "bills" && (
        <button className="fab" aria-label="Add bill" onClick={openAddBill}>
          <PlusIcon />
        </button>
      )}

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={tab === id && !sub ? "active" : ""}
            onClick={() => switchTab(id)}
          >
            <Icon width={21} height={21} strokeWidth={tab === id && !sub ? 1.8 : 1.5} />
            {label}
          </button>
        ))}
      </nav>

      {billFormOpen && household && (
        <BillForm
          bill={editingBill}
          members={household.members}
          onClose={() => setBillFormOpen(false)}
          onSaved={(msg) => {
            setBillFormOpen(false);
            showToast(msg);
            refresh();
          }}
        />
      )}

      {payingBill && household && (
        <PaySheet
          bill={payingBill}
          month={month}
          members={household.members}
          onClose={() => setPayingBill(null)}
          onPaid={() => {
            setPayingBill(null);
            showToast(`${payingBill.name} paid`);
            refresh();
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
