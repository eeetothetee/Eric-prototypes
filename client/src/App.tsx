import { useCallback, useEffect, useState } from "react";
import { api, currentMonth } from "./api";
import type { Bill, Household, MonthData } from "./types";
import MonthView from "./components/MonthView";
import BillsView from "./components/BillsView";
import InsightsView from "./components/InsightsView";
import SettingsView from "./components/SettingsView";
import BillForm from "./components/BillForm";
import PaySheet from "./components/PaySheet";
import { ChartIcon, GearIcon, HomeIcon, ListIcon, PlusIcon, initials } from "./components/icons";

type Tab = "home" | "bills" | "insights" | "settings";

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Month", Icon: HomeIcon },
  { id: "bills", label: "Bills", Icon: ListIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "settings", label: "Settings", Icon: GearIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [month, setMonth] = useState(currentMonth());
  const [household, setHousehold] = useState<Household | null>(null);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
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

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <div className="household">{household?.householdName ?? "\u2014"}</div>
          <h1>
            {tab === "home" && "Monthly Bills"}
            {tab === "bills" && "Recurring Bills"}
            {tab === "insights" && "Insights"}
            {tab === "settings" && "Settings"}
          </h1>
        </div>
        <div className="avatars">
          {household?.members.map((m) => (
            <div key={m.id} className="avatar" style={{ background: m.color }} title={m.name}>
              {initials(m.name)}
            </div>
          ))}
        </div>
      </header>

      {loading && !monthData ? (
        <div className="loading">Loading</div>
      ) : (
        <>
          {tab === "home" && monthData && household && (
            <MonthView
              data={monthData}
              month={month}
              onMonthChange={setMonth}
              onTogglePaid={togglePaid}
              onEditBill={openEditBill}
              onAddBill={openAddBill}
            />
          )}
          {tab === "bills" && monthData && household && (
            <BillsView
              bills={monthData.items.map((it) => it.bill).filter((b) => b.active === 1)}
              members={household.members}
              onEdit={openEditBill}
              onAdd={openAddBill}
            />
          )}
          {tab === "insights" && monthData && <InsightsView monthData={monthData} />}
          {tab === "settings" && household && (
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

      {(tab === "home" || tab === "bills") && (
        <button className="fab" aria-label="Add bill" onClick={openAddBill}>
          <PlusIcon />
        </button>
      )}

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <Icon width={21} height={21} strokeWidth={tab === id ? 1.8 : 1.5} />
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
