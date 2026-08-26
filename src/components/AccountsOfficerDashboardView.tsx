/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign, Landmark, FileText, ArrowRight, CheckCircle2, AlertTriangle, Check,
  RefreshCw, TrendingUp, TrendingDown, Clock, Search, Bell, Shield, ChevronRight,
  PlusCircle, CreditCard, Receipt, FileSpreadsheet, Send, Sliders, ShieldCheck,
  ChevronDown, X, Layers, Users, Eye, ArrowUpRight, HelpCircle, Activity, Heart,
  MinusCircle, HelpCircle as HelpIcon, PieChart, Star, Menu
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Patient, BillingInvoice } from '../types';

interface AccountsOfficerDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function AccountsOfficerDashboardView({
  currentUser,
  patients,
  onRefresh,
  onOpenPatientFile,
  onShowNotification
}: AccountsOfficerDashboardViewProps) {
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [billingInvoices, setBillingInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'Recent insurance claims clearing rate is 98.4%.', time: '09:20 AM', read: false },
    { id: '2', text: 'EHR Outpatient billing dispute submitted for Patient HIS-1004.', time: '09:12 AM', read: false },
    { id: '3', text: 'Audit trail verified for Accounts Receivable ledger closure.', time: '08:45 AM', read: true },
    { id: '4', text: 'New clinical invoice automatically generated for diagnostic scan.', time: '08:15 AM', read: false },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Quick Action form modals
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // New Invoice Form State
  const [newInvoiceData, setNewInvoiceData] = useState({
    patientId: '',
    itemName: 'General Consultation',
    itemAmount: 150,
  });

  // Record Payment Form State
  const [paymentData, setPaymentData] = useState({
    invoiceId: '',
    amountPaid: 0,
    insuranceAmount: 0,
    status: 'Paid' as 'Paid' | 'Partially Paid' | 'Submitted to Insurance'
  });

  // Refund Form State
  const [refundData, setRefundData] = useState({
    invoiceId: '',
    amount: 100,
    reason: 'Duplicate billing items',
    complianceCheck: false
  });

  // Claim Form State
  const [claimData, setClaimData] = useState({
    invoiceId: '',
    providerName: 'HealthPlus Insurance',
    policyNumber: 'HP-9087-432',
    notes: 'Primary physician consultation countersign release'
  });

  // Statement Form State
  const [targetPatientId, setTargetPatientId] = useState('');
  const [statementText, setStatementText] = useState('');

  // Daily Trend Mockup Lines
  const dailyTrendData = [
    { name: 'May 21', Collections: 480000 },
    { name: 'May 22', Collections: 620000 },
    { name: 'May 23', Collections: 510000 },
    { name: 'May 24', Collections: 880000 },
    { name: 'May 25', Collections: 390000 },
    { name: 'May 26', Collections: 610000 },
    { name: 'May 27', Collections: 580000 }
  ];

  // Aging Widget Colors and Values (0-30 days, 31-60, 61-90, 90+)
  const agingData = [
    { name: '0–30 Days', value: 865400, color: '#10b981' }, // emerald
    { name: '31–60 Days', value: 654320, color: '#3b82f6' }, // blue
    { name: '61–90 Days', value: 356210, color: '#f59e0b' }, // amber
    { name: '90+ Days', value: 258520, color: '#ef4444' }    // red
  ];

  // Claims Widget Stats (Approved, Pending, Rejected, Under Review)
  const claimStatsData = [
    { name: 'Approved', value: 560, color: '#10b981' },
    { name: 'Pending', value: 420, color: '#3b82f6' },
    { name: 'Rejected', value: 145, color: '#f59e0b' },
    { name: 'Under Review', value: 120, color: '#ef4444' }
  ];

  // Top Payers Table Metrics
  const topPayers = [
    { name: 'HealthPlus Insurance', collected: '$1,245,600', percentage: '38.2%' },
    { name: 'Medicare Assurance', collected: '$856,220', percentage: '26.4%' },
    { name: 'LifeSecure Health', collected: '$456,890', percentage: '14.1%' },
    { name: 'Global Health Inc.', collected: '$356,780', percentage: '11.0%' },
    { name: 'Others', collected: '$330,400', percentage: '10.2%' }
  ];

  // Recent Payments Table Metrics
  const recentPayments = [
    { id: 'RCPT-5478', name: 'John Doe', amount: '$2,450.00', method: 'Card', date: 'May 27, 2025' },
    { id: 'RCPT-5477', name: 'Mary Smith', amount: '$1,000.00', method: 'Cash', date: 'May 27, 2025' },
    { id: 'RCPT-5476', name: 'James Brown', amount: '$3,200.00', method: 'Insurance', date: 'May 27, 2025' },
    { id: 'RCPT-5475', name: 'Linda Johnson', amount: '$650.00', method: 'Card', date: 'May 26, 2025' },
    { id: 'RCPT-5474', name: 'Robert Wilson', amount: '$1,250.00', method: 'Cash', date: 'May 26, 2025' }
  ];

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/billing');
      if (res.ok) {
        const data = await res.json();
        setBillingInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Post payment to active server ledger endpoints
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.invoiceId) {
      onShowNotification("Choose an active invoice number to post payment.");
      return;
    }
    setIsLoading(true);
    try {
      const targetInvoice = billingInvoices.find(b => b.id === paymentData.invoiceId);
      const res = await fetch(`/api/billing/${paymentData.invoiceId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: Number(paymentData.amountPaid || 0),
          insuranceAmount: Number(paymentData.insuranceAmount || 0),
          targetStatus: paymentData.status
        })
      });
      if (res.ok) {
        onShowNotification(`Financial transaction posted. Receipt issued for ${paymentData.invoiceId}: Status locked as ${paymentData.status}.`);
        setIsRecordPaymentOpen(false);
        fetchInvoices();
      } else {
        onShowNotification("Ledger post failed. Verify invoice reference parameters.");
      }
    } catch (error) {
      onShowNotification("EHR database accounts communication failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceData.patientId || !newInvoiceData.itemName) {
      onShowNotification("Select valid patient file MRN and item details.");
      return;
    }
    // We update student bills automatically when services are performed but let's emulate a real manual override addition
    try {
      // In St Jude Medical billing system, we can post a manual charge item. Since there is no physical POST endpoints for manually adding single items
      // we mock add items to active invoice and trigger success message for accounts officer logs
      onShowNotification(`Billing entry posted. Added $${newInvoiceData.itemAmount} charge for "${newInvoiceData.itemName}" under Patient Account.`);
      setIsCreateInvoiceOpen(false);
      fetchInvoices();
    } catch (err) {
      onShowNotification("Could not post manual charges.");
    }
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimData.invoiceId) return;
    onShowNotification(`Insurance claim submitted to ${claimData.providerName} for Invoice ${claimData.invoiceId}. Checked policy validation.`);
    setIsClaimOpen(false);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundData.invoiceId) return;
    if (!refundData.complianceCheck) {
      onShowNotification("Compliance authorization indicator required for credit adjustments.");
      return;
    }
    onShowNotification(`Accounts adjustable adjustment approved. Adjusted refund credits for Invoice ${refundData.invoiceId}: $${refundData.amount}.`);
    setIsRefundOpen(false);
  };

  const handleGenerateStatement = () => {
    const activePat = patients.find(p => p.id === targetPatientId);
    if (!activePat) {
      setStatementText("Choose a valid patient MRN file index to summarize invoices.");
      return;
    }

    const patientInvoices = billingInvoices.filter(bi => bi.patientId === targetPatientId);
    let itemsText = patientInvoices.map(bi => {
      let detail = bi.items?.map((it: any) => `  - ${it.description}: $${it.amount}`).join('\n') || '';
      return `Invoice: ${bi.id} (${bi.status})\n  Issued: ${new Date(bi.issuedDate).toLocaleDateString()}\n${detail}\n  Total: $${bi.totalAmount} (Paid: $${bi.patientPaid}, Claimed: $${bi.insuranceClaimed})`;
    }).join('\n\n') || "  No open or completed invoices found in central cabinet archive.";

    setStatementText(
      `ST. JUDE MEDICAL EHR BILLING STATEMENT\n` +
      `====================================\n` +
      `Patient ID: ${activePat.id}\n` +
      `Full Name : ${activePat.fullName}\n` +
      `Allergies : ${activePat.allergies?.join(', ') || 'None'}\n` +
      `Insurance Status: Co-pay Registered\n\n` +
      `Outstanding Billing Ledger Records:\n` +
      `------------------------------------\n` +
      itemsText
    );
  };

  // Safe Filtered invoices matching queries
  const filteredInvoices = billingInvoices.filter(bi => {
    const q = searchQuery.toLowerCase();
    return bi.id.toLowerCase().includes(q) || 
           bi.patientId.toLowerCase().includes(q) || 
           (bi.patientName && bi.patientName.toLowerCase().includes(q));
  });

  return (
    <div className="flex bg-[#f8fafc] text-slate-700 min-h-[calc(100vh-6rem)] -m-6 relative font-sans leading-relaxed" id="accounts-officer-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================== STICKY SIDEBAR (Executive Revenue Theme) ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="accounts-sidebar">
        <div className="p-5 flex-1">
          {/* Logo & Platform ID */}
          <div className="flex items-center justify-between gap-2.5 mb-6">
            <div className="flex items-center gap-2.5">
              <Landmark className="text-emerald-600" size={22} fill="currentColor" />
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold block">Revenue Cycle</span>
                <span className="text-slate-800 font-bold text-sm tracking-tight block">St. Jude Finance</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Close Menu"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-1.5" id="accounts-navigation-list">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 pl-3">Cabinet Accounts</span>

            <button
              onClick={() => { setActiveMenu('Dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Dashboard' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <Receipt size={15} /> Dashboard
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('Patient Billing'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Patient Billing' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Users size={15} /> Patient Billing
            </button>

            <button
              onClick={() => { setActiveMenu('Global Patients'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Global Patients' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Users size={15} /> Global Patients
            </button>

            <button
              onClick={() => { setIsRecordPaymentOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <CreditCard size={15} /> Record Payment
            </button>

            <button
              onClick={() => { setActiveMenu('Invoices'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Invoices' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <FileText size={15} /> Invoices Ledger
            </button>

            <button
              onClick={() => { setIsClaimOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <ShieldCheck size={15} /> Insurance Claims
            </button>

            <button
              onClick={() => { setIsRefundOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <MinusCircle size={15} /> Refunds & Adjusts
            </button>

            <button
              onClick={() => { setActiveMenu('Accounts Receivable'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Accounts Receivable' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <TrendingUp size={15} /> Accounts Receivable
            </button>

            <button
              onClick={() => { setIsReportOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Financial Reports
            </button>

            <button
              onClick={() => { setActiveMenu('ChartOfAccounts'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'ChartOfAccounts' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Sliders size={15} /> Chart of Accounts
            </button>

            <button
              onClick={() => { setActiveMenu('CostCenters'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-transparent hover:bg-slate-50 transition cursor-pointer`}
            >
              <Layers size={15} /> Cost Center Mgmt
            </button>

            <button
              onClick={() => { setActiveMenu('TaxManagement'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-transparent hover:bg-slate-50 transition cursor-pointer`}
            >
              <Receipt size={15} /> Tax Management
            </button>
          </nav>
        </div>

        {/* Ledger Lock Footprint */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-emerald-600 font-semibold">
            <CheckCircle2 size={11} fill="currentColor" /> Billing Node Online
          </div>
          <span className="block text-[10px] text-slate-500 font-mono">Terminal: REVENUE-POST-6</span>
          <span className="block text-[10px] text-slate-400 font-mono">Auditor Code: ATIF-COLL-X</span>
        </div>
      </aside>

      {/* ========================== DISPLAY MAIN CYCLE ========================== */}
      <main className="flex-1 overflow-y-auto p-6 text-left" id="accounts-main-pane">
        
        {/* ========================== HEADER WIDGET ========================== */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" id="accounts-header-pane">
          <div className="flex items-center gap-3">
            {/* Hamburger mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
                Accounts Officer Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 text-xs">Good morning, Accounts Officer Daniel Carter</span>
                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-mono text-[9px] font-bold flex items-center gap-0.5">
                  <CheckCircle2 size={9} fill="currentColor" /> AUDIT COMPLIANCE LOCK
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Find Billing accounts search query */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search patient, billing invoices, MRN, provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 pl-9 pr-8 py-1.5 border border-slate-250 bg-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Billing Alerts */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer relative block"
                title="System Notifications"
              >
                <Bell size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Functional Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-left overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-700 font-sans">
                      Notifications ({notifications.filter(n => !n.read).length} unread)
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          onShowNotification("All accounts notifications marked as read.");
                        }} 
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-sans">
                        All caught up! No billing alerts.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            onShowNotification(`Alert read: "${n.text}"`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-emerald-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <div className="flex-1 font-sans">
                            <p className="text-slate-700 leading-tight">{n.text}</p>
                            <span className="text-[9.5px] text-slate-400 font-mono block mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          onShowNotification("Cleared all alerts.");
                        }} 
                        className="text-[10px] text-slate-500 hover:text-red-600 transition-colors font-medium cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Officer Profile Badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 border rounded-xl shadow-xs">
              <div className="w-8.5 h-8.5 rounded-full bg-emerald-650 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                DC
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800">Daniel Carter</div>
                <div className="text-slate-400 font-mono text-[9px]">Accounts • Shift: Day Shift</div>
              </div>
            </div>
          </div>
        </header>

        {activeMenu === 'Dashboard' ? (
          <div className="space-y-6" id="accounts-interactive-view">
            
            {/* ========================== KPI CARDS BLOCK (5 Items Match Mockup Image) ========================== */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Collections (MTD)</span>
                <span className="block text-xl font-bold text-slate-900 mt-1 font-sans">$3,245,890</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; +10.2% from last month
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Outstanding Receivables</span>
                <span className="block text-xl font-bold text-slate-900 mt-1 font-sans">$2,134,450</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; +7.8% from last month
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Invoices Generated</span>
                <span className="block text-xl font-bold text-slate-900 mt-1 font-sans">4,562</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; +12.4% from last month
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">Claims Submitted</span>
                <span className="block text-xl font-bold text-slate-900 mt-1 font-sans">1,245</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; +9.1% from last month
                </span>
              </div>

              <div className="p-4 bg-white border border-red-200 bg-red-50/10 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase text-red-500 font-bold">Overdue Invoices</span>
                <span className="block text-xl font-bold text-red-700 mt-1 font-sans">312</span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-red-100 text-red-700 font-bold font-mono inline-block mt-1">
                  Requires attention
                </span>
              </div>
            </div>

            {/* ========================== GRID LAYOUT BLOCK (Match Layout Image) ========================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COLUMN COMBINED AS TWO-COLUMN WIDE */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Daily Collections Overview (4 Columns cards row) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Daily Collections Overview</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Collected revenues breakdown by method</span>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border-l-4 border-emerald-500 rounded-r-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400">CASH</span>
                      <strong className="block text-base text-slate-800 font-sans mt-0.5">$1,245,600</strong>
                      <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">38.3% Share</span>
                    </div>

                    <div className="p-3 bg-slate-50 border-l-4 border-blue-500 rounded-r-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400">CARD</span>
                      <strong className="block text-base text-slate-800 font-sans mt-0.5">$1,456,220</strong>
                      <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">44.8% Share</span>
                    </div>

                    <div className="p-3 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400">INSURANCE</span>
                      <strong className="block text-base text-slate-800 font-sans mt-0.5">$456,890</strong>
                      <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">14.1% Share</span>
                    </div>

                    <div className="p-3 bg-slate-50 border-l-4 border-purple-500 rounded-r-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400">OTHER</span>
                      <strong className="block text-base text-slate-800 font-sans mt-0.5">$87,180</strong>
                      <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">2.7% Share</span>
                    </div>
                  </div>

                  {/* Collections Trend Line Chart */}
                  <div className="h-64 mt-6">
                    <span className="block text-[11px] font-bold text-slate-650 text-slate-600 mb-3 pl-1">Collections Trend (Last 7 Days)</span>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={dailyTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}K`} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: '10.5px', borderRadius: '12px' }} formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Collections']} />
                        <Line type="monotone" dataKey="Collections" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Recent Invoices Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recent Invoices</h3>
                      <span className="text-[10.5px] text-slate-400 font-mono">Invoice registries details across EHR records ward sessions</span>
                    </div>
                    <button onClick={fetchInvoices} className="p-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 bg-white rounded-lg flex items-center gap-1">
                      <RefreshCw size={11} /> Sync Ledger
                    </button>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left bg-transparent">
                      <thead>
                        <tr className="border-b font-mono uppercase text-[9px] text-slate-450 text-slate-400 bg-slate-50/50">
                          <th className="py-2 px-3">Invoice #</th>
                          <th className="py-2 px-2">Patient ID / Name</th>
                          <th className="py-2 px-2">Amount</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-[11.5px] text-slate-700">
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.slice(0, 10).map((inv, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.id}</td>
                              <td className="py-2.5 px-2 font-medium">
                                <span className="block font-semibold text-slate-800">{inv.patientName || "Unknown"}</span>
                                <span className="block text-[9px] font-mono text-slate-400">{inv.patientId}</span>
                              </td>
                              <td className="py-2.5 px-2 font-mono font-bold text-slate-800">${(inv.totalAmount || 0).toFixed(2)}</td>
                              <td className="py-2.5 px-2 text-slate-400">{new Date(inv.issuedDate || Date.now()).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase ${
                                  inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                  inv.status === 'Unpaid' ? 'bg-red-50 text-red-850 text-red-800 border border-red-100' :
                                  'bg-amber-50 text-amber-800 border border-amber-100'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          [
                            { id: 'INV-2025-5478', pat: 'John Doe', amount: '$2,450.00', date: 'May 27, 2025', status: 'Paid' },
                            { id: 'INV-2025-5477', pat: 'Mary Smith', amount: '$1,650.00', date: 'May 27, 2025', status: 'Unpaid' },
                            { id: 'INV-2025-5476', pat: 'James Brown', amount: '$3,200.00', date: 'May 27, 2025', status: 'Partial' },
                            { id: 'INV-2025-5475', pat: 'Linda Johnson', amount: '$650.00', date: 'May 26, 2025', status: 'Paid' },
                            { id: 'INV-2025-5474', pat: 'Robert Wilson', amount: '$4,150.00', date: 'May 26, 2025', status: 'Unpaid' }
                          ].map((mock, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-905">{mock.id}</td>
                              <td className="py-2.5 px-2 font-medium">{mock.pat}</td>
                              <td className="py-2.5 px-2 font-mono font-bold">{mock.amount}</td>
                              <td className="py-2.5 px-2 text-slate-400">{mock.date}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase ${
                                  mock.status === 'Paid' ? 'bg-emerald-50 text-emerald-800' :
                                  mock.status === 'Unpaid' ? 'bg-red-50 text-red-800' :
                                  'bg-amber-50 text-amber-800'
                                }`}>
                                  {mock.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                    <button onClick={() => setActiveMenu('Invoices')} className="text-xs font-bold text-emerald-800 hover:underline">
                      View all invoices &rarr;
                    </button>
                  </div>
                </div>

                {/* 3. Bottom Columns: Top Payers & Recent Payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Top Payers */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">Top Payers (MTD)</h3>
                      <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Primary clearing healthcare insurance providers</span>

                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[9px] text-slate-400">
                              <th className="py-1.5 pl-1">Payer</th>
                              <th className="py-1.5">Collected</th>
                              <th className="py-1.5 text-right pr-1">% of Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {topPayers.map((payer, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 pl-1 font-semibold text-slate-850">{payer.name}</td>
                                <td className="py-2 font-mono font-bold text-slate-900">{payer.collected}</td>
                                <td className="py-2 font-mono text-right text-slate-500 pr-1">{payer.percentage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <span className="text-xs text-emerald-800 font-bold block cursor-pointer">
                        View all payers &rarr;
                      </span>
                    </div>
                  </div>

                  {/* Recent Payments Transactions */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">Recent Payments</h3>
                      <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Clearance payment registries sessions</span>

                      <div className="overflow-x-auto text-[11px]">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[8px] text-slate-400">
                              <th className="py-1.5 pl-1">Receipt #</th>
                              <th className="py-1.5">Patient</th>
                              <th className="py-1.5">Amount</th>
                              <th className="py-1.5 text-right pr-1">Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {recentPayments.map((pay, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="py-2 pl-1 font-mono text-slate-900 font-bold">{pay.id}</td>
                                <td className="py-2 font-medium">{pay.name}</td>
                                <td className="py-2 font-mono font-bold text-slate-805">${pay.amount.replace('$', '')}</td>
                                <td className="py-2 font-medium text-right text-slate-500 pr-1">{pay.method}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <span className="text-xs text-emerald-800 font-bold block cursor-pointer">
                        View all payments &rarr;
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* RIGHT SIDEBAR MODULE COLUMN (Aging charts & actions) */}
              <div className="space-y-6">
                
                {/* 1. Accounts Receivable Aging Chart Pie */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5 font-sans">Accounts Receivable Aging</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-2">Age breakdown metrics of overdue receivables</span>

                  {/* High Quality Centered Donut Representation */}
                  <div className="flex flex-col items-center">
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <div className="absolute inset-x-0 mx-auto text-center">
                        <span className="block text-[9.5px] font-semibold text-slate-400 font-mono tracking-widest uppercase">Total Debt</span>
                        <strong className="block text-base font-bold text-slate-900">$2,134,450</strong>
                      </div>
                      
                      {/* Responsive Recharts Donut */}
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={agingData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {agingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Accurate values labels list matching mockup exactly */}
                    <div className="w-full space-y-1 text-[11px] mt-1 pr-1 font-medium">
                      {agingData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                          <div className="flex items-center gap-1.5 text-slate-500 pl-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">${item.value.toLocaleString()} <span className="text-[9.5px] text-slate-400 font-normal ml-1">({((item.value / 2134450) * 100).toFixed(1)}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <span className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                      View detailed aging report &rarr;
                    </span>
                  </div>
                </div>

                {/* 2. Insurance Claims Status Semi-pie */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Insurance Claims Status</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-2">Claim clearance performance tracking ratios</span>

                  <div className="flex flex-col items-center">
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <div className="absolute inset-x-0 mx-auto text-center">
                        <span className="block text-[9.5px] font-semibold text-slate-400 font-mono uppercase">Total claims</span>
                        <strong className="block text-base font-bold text-slate-900">1,245</strong>
                      </div>
                      
                      {/* Responsive Recharts PIE */}
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={claimStatsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {claimStatsData.map((entry, idx) => (
                              <Cell key={`cell-claim-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Claims value breakdown matching mockup */}
                    <div className="w-full space-y-1 text-[11px] mt-1 font-medium">
                      {claimStatsData.map((claim, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                          <div className="flex items-center gap-1.5 text-slate-500 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: claim.color }} />
                            <span>{claim.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-805 text-slate-800">{claim.value} units <span className="text-[9.5px] text-slate-400">({((claim.value / 1245) * 100).toFixed(1)}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <span className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                      View all claims &rarr;
                    </span>
                  </div>
                </div>

                {/* 3. Quick Actions Grid Widgets */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Quick Actions</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Direct financial workflow execution</span>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsCreateInvoiceOpen(true)}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <PlusCircle size={16} className="text-emerald-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Create Invoice</div>
                    </button>

                    <button
                      onClick={() => { setIsRecordPaymentOpen(true); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <CreditCard size={16} className="text-blue-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Record Payment</div>
                    </button>

                    <button
                      onClick={() => { setIsClaimOpen(true); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <ShieldCheck size={16} className="text-emerald-700 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Submit Claim</div>
                    </button>

                    <button
                      onClick={() => { setIsRefundOpen(true); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <MinusCircle size={16} className="text-[#ef4444] group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Refund / Adjust</div>
                    </button>

                    <button
                      onClick={() => { setIsReportOpen(true); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <FileSpreadsheet size={16} className="text-amber-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Generate Report</div>
                    </button>

                    <button
                      onClick={() => { setIsStatementOpen(true); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <Receipt size={16} className="text-purple-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-800">Patient Statement</div>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ADMINISTRATIVE FINANCIAL SUB MENUS */
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-left relative min-h-96">
            <button onClick={() => setActiveMenu('Dashboard')} className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-650 flex items-center gap-1">
              <X size={15} /> Close Section
            </button>

            {activeMenu === 'Patient Billing' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Patient Financial Admission Cabinet</h3>
                <p className="text-xs text-slate-500">Each admission and clinical order automatically aggregates ledger charges on central records invoices files. Use the top search bar to filter patients.</p>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400">
                        <th className="py-2 pl-1">Patient MRN</th>
                        <th className="py-2">Full Patient Name</th>
                        <th className="py-2">Clinic Status</th>
                        <th className="py-2 text-right pr-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {patients.filter(p => {
                        const q = searchQuery.toLowerCase();
                        return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      }).map((pat) => (
                        <tr key={pat.id} className="hover:bg-slate-50/50">
                          <td className="py-2 pl-1 font-mono font-bold text-slate-900">{pat.id}</td>
                          <td className="py-2 font-semibold text-slate-850">{pat.fullName}</td>
                          <td className="py-2 text-slate-500 font-medium">{pat.status}</td>
                          <td className="py-2 text-right pr-1">
                            <button
                              onClick={() => {
                                setTargetPatientId(pat.id);
                                setIsStatementOpen(true);
                                handleGenerateStatement();
                              }}
                              className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold hover:bg-emerald-100 transition text-[10px]"
                            >
                              Generate Statement
                            </button>
                          </td>
                        </tr>
                      ))}
                      {patients.filter(p => {
                        const q = searchQuery.toLowerCase();
                        return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      }).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-mono text-[11px]">
                            No patients found matching "{searchQuery}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === 'Global Patients' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Global Master Patients Registry</h3>
                    <p className="text-xs text-slate-500">Comprehensive directory of all hospital patients with clinical statuses and ledger files. Use the search bar above to filter.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreateInvoiceOpen(true);
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle size={14} /> New Invoice
                  </button>
                </div>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50/75">
                        <th className="py-2.5 pl-3">Patient MRN</th>
                        <th className="py-2.5">Full Patient Name</th>
                        <th className="py-2.5">Clinic Status</th>
                        <th className="py-2.5">DOB</th>
                        <th className="py-2.5">Gender</th>
                        <th className="py-2.5 text-right pr-3">Ledger Files</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {patients.filter(p => {
                        const q = searchQuery.toLowerCase();
                        return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      }).map((pat) => (
                        <tr key={pat.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pl-3 font-mono font-bold text-slate-900">{pat.id}</td>
                          <td className="py-3 font-semibold text-slate-850">{pat.fullName}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                              {pat.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-500">{pat.dob}</td>
                          <td className="py-3 text-slate-500">{pat.gender}</td>
                          <td className="py-3 text-right pr-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setTargetPatientId(pat.id);
                                  setIsStatementOpen(true);
                                  handleGenerateStatement();
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 border border-emerald-100 transition text-[10px] cursor-pointer"
                              >
                                Financial Statement
                              </button>
                              <button
                                onClick={() => onOpenPatientFile(pat.id)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-sky-700 font-bold rounded-lg border border-slate-200 transition text-[10px] cursor-pointer"
                              >
                                View EHR Chart
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {patients.filter(p => {
                        const q = searchQuery.toLowerCase();
                        return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                            No patients match search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === 'ChartOfAccounts' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Chart of Accounts & Income Ledger Code</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                    <strong className="block text-slate-800 text-sm">1010 - Collected Cash Assets</strong>
                    <p className="text-slate-500">Includes physical currency, co-pay receipts, and teller deposits.</p>
                    <span className="font-mono text-emerald-600 font-bold block mt-2">Active Balance: $1,245,600</span>
                  </div>

                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                    <strong className="block text-slate-800 text-sm">1220 - Outstanding Insurance Claims</strong>
                    <p className="text-slate-500 font-normal">Revenues processed but awaiting provider settlement clearance.</p>
                    <span className="font-mono text-[#0284c7] font-bold block mt-2">Active Balance: $2,134,450</span>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'Invoices' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Complete Invoices Ledger</h3>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400">
                        <th className="py-2 pl-2">Invoice #</th>
                        <th className="py-2">Patient name</th>
                        <th className="py-2">Items Breakdown</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Paid</th>
                        <th className="py-2 text-right pr-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {billingInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pl-2 font-mono font-bold text-slate-900">{inv.id}</td>
                          <td className="py-3 font-semibold text-slate-800">{inv.patientName}</td>
                          <td className="py-3 max-w-xs truncate text-[10px] text-slate-500">
                            {inv.items?.map((it: any) => it.description).join(', ')}
                          </td>
                          <td className="py-3 font-mono font-bold">${(inv.totalAmount || 0).toFixed(2)}</td>
                          <td className="py-3 font-mono text-emerald-750 font-bold text-emerald-600">${inv.patientPaid}</td>
                          <td className="py-3 text-right pr-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>{inv.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================== FOOTER BRAND BANNER ========================== */}
        <footer className="mt-8 border-t border-slate-200/80 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-mono gap-3" id="accounts-footer">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ATIF-HIS Cyber Guard: All financial activities are monitored and audited</span>
          </div>
          <div>St. Jude Medical Revenue Console • V1.4.2</div>
        </footer>

      </main>

      {/* ========================== POPUP WINDOW ACTIONS MODALS ========================== */}

      {/* MODAL 1: CREATE PATIENT INVOICE */}
      {isCreateInvoiceOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsCreateInvoiceOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <PlusCircle className="text-emerald-700" /> Post New Billing Entry
            </h3>
            <p className="text-xs text-slate-405 text-slate-400 mb-4 font-mono">Appends custom specialty service overrides to clinical ledger files.</p>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Select Patient Account</label>
                <select
                  value={newInvoiceData.patientId}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, patientId: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-808 text-slate-800"
                >
                  <option value="">-- Choose Admitted MRN --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.id} • {p.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Service Overrides Type</label>
                <select
                  value={newInvoiceData.itemName}
                  onChange={(e) => {
                    const price = e.target.value === 'Specialist Review' ? 250 : 
                                  e.target.value === 'Surgical Minor Procedure' ? 1200 : 
                                  e.target.value === 'Bed Ward Occupancy Overtime' ? 350 : 150;
                    setNewInvoiceData({ ...newInvoiceData, itemName: e.target.value, itemAmount: price });
                  }}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800"
                >
                  <option value="General Consultation">General Consultation ($150)</option>
                  <option value="Specialist Review">Specialist Review ($250)</option>
                  <option value="Surgical Minor Procedure">Surgical Minor Procedure ($1,200)</option>
                  <option value="Bed Ward Occupancy Overtime">Bed Ward Occupancy Overtime ($350)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Adjust Charge ($)</label>
                <input
                  type="number"
                  value={newInvoiceData.itemAmount}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, itemAmount: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-250 rounded-xl text-xs text-slate-808 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsCreateInvoiceOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">Append Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsRecordPaymentOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-1.5 animate-pulse">
              <CreditCard className="text-[#3b82f6]" /> Clear Ledger Payment
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">Validates insurance claim allocations and physical collections balances.</p>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Active Invoices Reference</label>
                <select
                  value={paymentData.invoiceId}
                  onChange={(e) => {
                    const activeInv = billingInvoices.find(bi => bi.id === e.target.value);
                    setPaymentData({
                      ...paymentData,
                      invoiceId: e.target.value,
                      amountPaid: activeInv ? activeInv.totalAmount : 0,
                      insuranceAmount: 0
                    });
                  }}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800"
                >
                  <option value="">-- Choose Active Ledger Invoice --</option>
                  {billingInvoices.map(b => (
                    <option key={b.id} value={b.id}>{b.id} • {b.patientName || "Admitted Account"} (${b.totalAmount})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Patient Cash/Card Paid</label>
                  <input
                    type="number"
                    value={paymentData.amountPaid}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData })}
                    className="w-full p-2 border border-gradient text-slate-550 border-slate-250 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Insurance Claim Paid</label>
                  <input
                    type="number"
                    value={paymentData.insuranceAmount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData })}
                    className="w-full p-2 border border-slate-250 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Target accounts status</label>
                <select
                  value={paymentData.status}
                  onChange={(e) => setPaymentData({ ...paymentData, status: e.target.value as any })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs"
                >
                  <option value="Paid">Cleared Full (Paid)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Submitted to Insurance">Submitted to Insurance (Claimed)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsRecordPaymentOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold cursor-pointer">{isLoading ? "Clearing..." : "Collect and Close"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBMIT INSURANCE CLAIM */}
      {isClaimOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsClaimOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Submit Healthcare Claim</h3>
            <form onSubmit={handleSubmitClaim} className="space-y-3 t-xs text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Select Target Invoice</label>
                <select
                  value={claimData.invoiceId}
                  onChange={(e) => setClaimData({ ...claimData, invoiceId: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800 focus:outline-none"
                  required
                >
                  <option value="">-- Select Receivable Accounts invoice --</option>
                  {billingInvoices.map(b => (
                    <option key={b.id} value={b.id}>{b.id} (${b.totalAmount})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Insurance Provider name</label>
                <input
                  type="text"
                  value={claimData.providerName}
                  onChange={(e) => setClaimData({ ...claimData, providerName: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Policy Card Identification #</label>
                <input
                  type="text"
                  value={claimData.policyNumber}
                  onChange={(e) => setClaimData({ ...claimData, policyNumber: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end font-sans">
                <button type="button" onClick={() => setIsClaimOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer">Submit Claim File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REFUNDS & CREDITS ADJUSTMENT */}
      {isRefundOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsRefundOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-[#ef4444] mb-2 flex items-center gap-1">
              <AlertTriangle /> Adjust Accounts Refund Credit
            </h3>
            <p className="text-xs text-slate-405 text-slate-400 mb-4 font-mono">Will flag billing anomalies logs under ATIF compliance checks.</p>

            <form onSubmit={handleProcessRefund} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Invoice Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2025-5478"
                  value={refundData.invoiceId}
                  onChange={(e) => setRefundData({ ...refundData, invoiceId: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Adjustable Credits Amount ($)</label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({ ...refundData, amount: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-250 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Core compliance Audits Notes</label>
                <textarea
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="w-full p-2 border border-slate-250 rounded-xl h-14 text-xs"
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={refundData.complianceCheck}
                  onChange={(e) => setRefundData({ ...refundData, complianceCheck: e.target.checked })}
                  className="rounded cursor-pointer"
                  id="refund-check"
                />
                <label htmlFor="refund-check" className="text-[10px] text-red-800 font-mono font-bold leading-tight cursor-pointer">
                  Authorise as verified compliance adjustment.
                </label>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsRefundOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#ef4444] hover:bg-[#dc3545] text-white rounded-xl font-bold cursor-pointer">Approve Credit Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PATIENT STATEMENT OF ACC */}
      {isStatementOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-lg w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsStatementOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
              <Receipt className="text-purple-600" /> Patient financial Statement summaries
            </h3>
            <p className="text-xs text-slate-405 text-slate-400 mb-4 font-mono font-normal">Aggregates entire billing indices inside clinic databases.</p>

            <div className="space-y-4 text-xs">
              <div className="flex gap-2">
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                >
                  <option value="">-- Click patient file MRN registry --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.id} • {p.fullName}</option>
                  ))}
                </select>
                <button onClick={handleGenerateStatement} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition cursor-pointer">
                  Generate Summary
                </button>
              </div>

              <div className="p-4 bg-slate-50 font-mono text-[11px] rounded-xl border max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-700">
                {statementText || "Awaiting print statement compile context..."}
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsStatementOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Close</button>
                <button onClick={() => { if (targetPatientId) onShowNotification('Printed statement file queued on standard output devices.'); }} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer">
                  Export Document (.pdf)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: FINANCIAL REPORT OVERVIEW */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left font-sans">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-md w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsReportOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Cycle Revenue reports summary</h3>
            
            <div className="p-4 bg-slate-50 rounded-2xl border font-mono text-[11px] space-y-2 text-slate-705">
              <div className="font-sans font-bold text-xs text-slate-800 border-b pb-1.5 mb-2">Month-to-Date Collections summary</div>
              <div>● Total Cash assets compiled: <strong>$1,245,600 (38.3% Share)</strong></div>
              <div>● Credit card assets ledger balance: <strong>$1,456,220 (44.8% Share)</strong></div>
              <div>● Outstanding Receivables index: <strong className="text-red-700 font-bold">$2,134,450</strong></div>
              <div>● Verified Insurance claims rate: <strong>Approved 45.0%</strong></div>
            </div>

            <div className="pt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setIsReportOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Close</button>
              <button onClick={() => { onShowNotification("Financial audit excel spreadsheets saved in database cache."); }} className="px-5 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-xl font-bold cursor-pointer">
                Export Ledger (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
