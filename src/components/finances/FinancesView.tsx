import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { FinancialAccount, Transaction, Budget, TransactionType } from '../../types';
import {
  PieChart as PieChartIcon,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  PiggyBank,
  Receipt,
  BarChart2,
  Edit2,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Building2,
  Sparkles,
  TrendingUp,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

export const FinancesView: React.FC = () => {
  const {
    accounts,
    transactions,
    budgets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addBudget,
    updateBudget,
    deleteBudget
  } = useLifeOS();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');

  // Add / Edit Transaction State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Alimentación & Supermercado');
  const [txDesc, setTxDesc] = useState('');
  const [txAccountId, setTxAccountId] = useState(accounts[0]?.id || 'acc_1');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Add / Edit Account State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');
  const [accType, setAccType] = useState<FinancialAccount['type']>('debit');

  // Add / Edit Budget State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budCategory, setBudCategory] = useState('Alimentación & Supermercado');
  const [budLimit, setBudLimit] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Calculated Totals in CLP
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const thisMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const thisMonthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const netSavings = thisMonthIncome - thisMonthExpenses;

  // Expense Pie Chart Data
  const categoryMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const pieData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: Math.round(categoryMap[cat])
  }));

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

  // Bar Chart Data (Ingresos vs Gastos)
  const barData = [
    { name: 'Este Mes (CLP)', Ingresos: thisMonthIncome, Gastos: thisMonthExpenses }
  ];

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || t.type === selectedTypeFilter;
    const matchesAccount = selectedAccountFilter === 'all' || t.accountId === selectedAccountFilter;
    return matchesSearch && matchesType && matchesAccount;
  });

  // Handlers
  const handleOpenNewTx = () => {
    setEditingTx(null);
    setTxType('expense');
    setTxAmount('');
    setTxCategory('Alimentación & Supermercado');
    setTxDesc('');
    setTxAccountId(accounts[0]?.id || 'acc_1');
    setTxDate(todayStr);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxCategory(tx.category);
    setTxDesc(tx.description);
    setTxAccountId(tx.accountId);
    setTxDate(tx.date || todayStr);
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (editingTx) {
      updateTransaction({
        ...editingTx,
        type: txType,
        amount: amountNum,
        category: txCategory,
        description: txDesc || txCategory,
        accountId: txAccountId,
        date: txDate
      });
    } else {
      addTransaction({
        accountId: txAccountId,
        type: txType,
        amount: amountNum,
        category: txCategory,
        description: txDesc || txCategory,
        date: txDate
      });
    }

    setIsTxModalOpen(false);
  };

  const handleOpenNewAccount = () => {
    setEditingAccount(null);
    setAccName('');
    setAccBalance('');
    setAccType('debit');
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccBalance(acc.balance.toString());
    setAccType(acc.type);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const balanceNum = parseFloat(accBalance) || 0;

    if (editingAccount) {
      updateAccount({
        ...editingAccount,
        name: accName,
        type: accType,
        balance: balanceNum
      });
    } else {
      addAccount({
        name: accName,
        type: accType,
        balance: balanceNum,
        currency: 'CLP',
        color: accType === 'savings' ? '#8B5CF6' : accType === 'cash' ? '#10B981' : '#3B82F6',
        icon: accType === 'savings' ? 'PiggyBank' : accType === 'cash' ? 'Banknote' : 'CreditCard'
      });
    }

    setIsAccountModalOpen(false);
  };

  const handleOpenNewBudget = () => {
    setEditingBudget(null);
    setBudCategory('Alimentación & Supermercado');
    setBudLimit('');
    setIsBudgetModalOpen(true);
  };

  const handleOpenEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setBudCategory(b.category);
    setBudLimit(b.monthlyLimit.toString());
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(budLimit);
    if (isNaN(limitNum) || limitNum <= 0) return;

    if (editingBudget) {
      updateBudget({
        ...editingBudget,
        category: budCategory,
        monthlyLimit: limitNum
      });
    } else {
      addBudget({
        category: budCategory,
        monthlyLimit: limitNum,
        period: currentMonthStr,
        areaId: 'area_finance'
      });
    }

    setIsBudgetModalOpen(false);
  };

  const getAccountIcon = (type: FinancialAccount['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-purple-400" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      default:
        return <Building2 className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                Finanzas Personales
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Formato CLP ($ Pesos Chilenos)
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white">Gestión de Cuentas & Presupuestos</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenNewAccount}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Nueva Cuenta</span>
          </button>

          <button
            onClick={handleOpenNewTx}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards (CLP) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimonio Total */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 text-white shadow-lg space-y-2">
          <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Patrimonio Consolidado
          </p>
          <p className="text-2xl font-black text-white">{formatCLP(totalBalance)}</p>
          <p className="text-[11px] text-slate-300 font-semibold">{accounts.length} Cuentas configuradas</p>
        </div>

        {/* Ingresos Este Mes */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Ingresos (Este Mes)
          </p>
          <p className="text-2xl font-black text-white">{formatCLP(thisMonthIncome)}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">Flujo entrante registrado</p>
        </div>

        {/* Gastos Este Mes */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Gastos (Este Mes)
          </p>
          <p className="text-2xl font-black text-white">{formatCLP(thisMonthExpenses)}</p>
          <p className="text-[11px] text-rose-400 font-semibold">Salidas registradas</p>
        </div>

        {/* Balance Neto / Margen */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Margen de Ahorro
          </p>
          <p className={`text-2xl font-black ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCLP(netSavings)}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold">
            {thisMonthIncome > 0
              ? `${Math.round((netSavings / thisMonthIncome) * 100)}% de tasa de ahorro`
              : 'Diferencia neta'}
          </p>
        </div>
      </div>

      {/* Accounts List Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-extrabold text-white">Mis Cuentas Financieras (CLP)</h3>
          </div>
          <button
            onClick={handleOpenNewAccount}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Cuenta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                  {getAccountIcon(acc.type)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">{acc.name}</p>
                  <p className="text-[11px] font-mono font-bold text-emerald-400">
                    {formatCLP(acc.balance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEditAccount(acc)}
                  title="Editar Cuenta"
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-sky-400 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {accounts.length > 1 && (
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    title="Eliminar Cuenta"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Distribution Pie Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-amber-400" />
            <span>Distribución de Gastos por Categoría (CLP)</span>
          </h3>

          <div className="h-64 pt-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCLP(val), 'Monto']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sin datos de gastos registrados aún.
              </div>
            )}
          </div>
        </div>

        {/* Budgets Progress Section */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Presupuestos Mensuales (CLP)</span>
            </h3>
            <button
              onClick={handleOpenNewBudget}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Asignar Presupuesto
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {budgets.map((b) => {
              const spent = transactions
                .filter(
                  (t) =>
                    t.category === b.category &&
                    t.type === 'expense' &&
                    t.date.startsWith(currentMonthStr)
                )
                .reduce((sum, t) => sum + t.amount, 0);

              const pct = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));

              return (
                <div
                  key={b.id}
                  className="space-y-2 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">
                        {formatCLP(spent)} / <strong className="text-emerald-400">{formatCLP(b.monthlyLimit)}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenEditBudget(b)}
                        className="p-1 text-slate-400 hover:text-sky-400 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBudget(b.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction History & Full Control Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-extrabold text-white">Historial Completo de Movimientos</h3>
          </div>

          <button
            onClick={handleOpenNewTx}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Transacción</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Todos los Movimientos</option>
            <option value="income">Solo Ingresos (+)</option>
            <option value="expense">Solo Gastos (-)</option>
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Todas las Cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transactions List */}
        <div className="space-y-2 pt-2">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => {
              const acc = accounts.find((a) => a.id === t.accountId);
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        t.type === 'expense'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {t.type === 'expense' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{t.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {t.category} • <strong className="text-slate-300">{acc?.name || 'Cuenta'}</strong> • {t.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black font-mono ${
                        t.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {t.type === 'expense' ? '-' : '+'}{formatCLP(t.amount)}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditTx(t)}
                        title="Editar Transacción"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-sky-400 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        title="Eliminar Transacción"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron transacciones con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add / Edit Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <form
            onSubmit={handleSaveTx}
            className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                <span>{editingTx ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento (CLP)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo:</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as TransactionType)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="expense">Gasto (-)</option>
                  <option value="income">Ingreso (+)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Monto en CLP ($):</label>
                <input
                  type="number"
                  step="1"
                  placeholder="Ej: 45000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Categoría:</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Alimentación & Supermercado">Alimentación & Supermercado</option>
                  <option value="Tecnología & Herramientas">Tecnología & Herramientas</option>
                  <option value="Salud & Deporte">Salud & Deporte</option>
                  <option value="Salario & Honorarios">Salario & Honorarios</option>
                  <option value="Educación & Libros">Educación & Libros</option>
                  <option value="Ocio & Entretenimiento">Ocio & Entretenimiento</option>
                  <option value="Vivienda & Servicios">Vivienda & Servicios</option>
                  <option value="Transporte & Bencina">Transporte & Bencina</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cuenta Destino/Origen:</label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCLP(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha:</label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción:</label>
              <input
                type="text"
                placeholder="Ej: Pago de cuota o supermercado Jumbo"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase"
              >
                {editingTx ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <form
            onSubmit={handleSaveAccount}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <span>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Financiera (CLP)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre de la Cuenta:</label>
              <input
                type="text"
                placeholder="Ej: Cuenta RUT, BCI Débito, Efectivo"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Balance Actual (CLP):</label>
                <input
                  type="number"
                  placeholder="0"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Cuenta:</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as any)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="debit">Cuenta Débito / RUT</option>
                  <option value="cash">Efectivo / Caja</option>
                  <option value="savings">Fondo Ahorro / Mutuo</option>
                  <option value="credit">Tarjeta de Crédito</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase"
              >
                Guardar Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <form
            onSubmit={handleSaveBudget}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <span>{editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto Mensual (CLP)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Categoría:</label>
              <select
                value={budCategory}
                onChange={(e) => setBudCategory(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="Alimentación & Supermercado">Alimentación & Supermercado</option>
                <option value="Tecnología & Herramientas">Tecnología & Herramientas</option>
                <option value="Salud & Deporte">Salud & Deporte</option>
                <option value="Educación & Libros">Educación & Libros</option>
                <option value="Ocio & Entretenimiento">Ocio & Entretenimiento</option>
                <option value="Vivienda & Servicios">Vivienda & Servicios</option>
                <option value="Transporte & Bencina">Transporte & Bencina</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Límite Mensual (CLP $):</label>
              <input
                type="number"
                placeholder="Ej: 350000"
                value={budLimit}
                onChange={(e) => setBudLimit(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase"
              >
                Guardar Presupuesto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
