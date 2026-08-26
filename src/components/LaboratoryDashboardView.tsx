/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Search, Bell, Shield, Calendar, Clock, CheckCircle, 
  AlertTriangle, ArrowRight, UserCheck, MessageSquare, Clipboard, Layers, 
  Settings, LogOut, ChevronRight, Eye, Check, Plus, AlertCircle, RefreshCw, 
  X, Beaker, Dna, Save, Filter, FileText, Upload, Trash, ShieldCheck, Menu
} from 'lucide-react';
import { Patient, LabRequest, LabStatus, SecurityEvent } from '../types';

interface LaboratoryDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (patientId: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function LaboratoryDashboardView({
  currentUser,
  patients,
  onRefresh,
  onOpenPatientFile,
  onShowNotification
}: LaboratoryDashboardViewProps) {
  // Navigation Section Sub-Routing
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'System notification: LAB-3044 (Potassium) triggered a metabolic critical low limit alert.', time: '09:25 AM', read: false },
    { id: '2', text: 'Specimen centrifuge validation completed for Batch LIS-902.', time: '09:10 AM', read: false },
    { id: '3', text: 'Daily analyzer calibration audit logs committed to server.', time: '08:45 AM', read: true },
    { id: '4', text: 'Critical diagnostic reagent inventory low limit triggered (Hemoglobin kit).', time: '08:15 AM', read: false },
    { id: '5', text: 'Workstation security certificate auto-renewal succeeded.', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Search models
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [sampleSearch, setSampleSearch] = useState<string>('');

  // Queue sub-filters
  const [requestsTab, setRequestsTab] = useState<'New' | 'In Progress' | 'Review' | 'Completed'>('New');

  // Selected request for the results writing workbook (initial default or loaded onClick)
  const [selectedLabRequest, setSelectedLabRequest] = useState<LabRequest | null>(null);
  
  // Real database entities
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Results entry form states
  const [hemoglobinValue, setHemoglobinValue] = useState<string>('12.5');
  const [wbcValue, setWbcValue] = useState<string>('6.2');
  const [plateletValue, setPlateletValue] = useState<string>('210');
  const [urineGlucose, setUrineGlucose] = useState<string>('Negative');
  const [malariaResult, setMalariaResult] = useState<string>('No Parasites Seen');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [customTestType, setCustomTestType] = useState<string>('');
  const [customResultText, setCustomResultText] = useState<string>('');

  // Load backend samples & LIS telemetry
  const loadLabDetails = async () => {
    setIsLoading(true);
    try {
      const labRes = await fetch('/api/lab/requests');
      if (labRes.ok && labRes.headers.get('content-type')?.includes('application/json')) {
        const labData = await labRes.json();
        setLabRequests(labData.requests || []);
      }

      const secRes = await fetch('/api/security/events');
      if (secRes.ok && secRes.headers.get('content-type')?.includes('application/json')) {
        const secData = await secRes.json();
        setSecurityLogs(secData.events || []);
      }
    } catch (e) {
      console.warn('Failed to load LIS database metrics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLabDetails();
  }, []);

  useEffect(() => {
    if (labRequests.length > 0 && !selectedLabRequest) {
      // Find a pending laboratory request
      const pendingRequest = labRequests.find(r => r.status === LabStatus.PENDING) || labRequests[0];
      setSelectedLabRequest(pendingRequest);
    }
  }, [labRequests]);

  // Update sample status to 'COLLECTED' or 'RECEIVED'
  const handleUpdateSampleStatus = async (reqId: string, nextStatus: LabStatus, sampleType?: string) => {
    try {
      const res = await fetch(`/api/lab/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          sampleType: sampleType || 'Whole Blood'
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Sample ${reqId} barcode registered. Status updated to ${nextStatus}.`);
        loadLabDetails();
        onRefresh();
      }
    } catch (e) {
      onShowNotification('Unable to dispatch sample registry updates.');
    }
  };

  // Submit filled test results back to the corporate records database
  const handleCommitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabRequest) {
      onShowNotification('Please select a pending lab request to commit.');
      return;
    }

    // Format results based on the test type requested
    let resultSummary = '';
    const testName = selectedLabRequest.testName.toLowerCase();
    
    if (testName.includes('count') || testName.includes('fbc') || testName.includes('blood')) {
      resultSummary = `Hb: ${hemoglobinValue} g/dL (13-17) [LOW], WBC: ${wbcValue} 10^9/L (4-11) [NORMAL], PLT: ${plateletValue} 10^9/L (150-450) [NORMAL]. Notes: ${additionalNotes || 'Analyzed on automated counter'}`;
    } else if (testName.includes('malaria')) {
      resultSummary = `Malaria Parasite Screen: ${malariaResult}. Notes: ${additionalNotes || 'Committed under dual microscopy analysis.'}`;
    } else if (testName.includes('urinalysis') || testName.includes('urine')) {
      resultSummary = `Urinalysis Glucose: ${urineGlucose}, Protein: Negative, pH: 6.0, Ketones: Negative. Notes: ${additionalNotes || 'Dipstick evaluation completed'}`;
    } else {
      resultSummary = customResultText || `Resulted: ${chemicalReferenceInterpretation()} • Operator Notes: ${additionalNotes || 'standard test process'}`;
    }

    try {
      const res = await fetch(`/api/lab/requests/${selectedLabRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: LabStatus.COMPLETED,
          result: resultSummary
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Lab diagnostics for LAB-${selectedLabRequest.id} certified. Results released in EHR index.`);
        loadLabDetails();
        setSelectedLabRequest(null);
        setAdditionalNotes('');
        setCustomResultText('');
        onRefresh();
      }
    } catch (err) {
      onShowNotification('Error publishing diagnostic results data.');
    }
  };

  // Alert simulation for critical metabolic anomalies
  const handleNotifyPhysician = () => {
    // Notify trigger
    onShowNotification('CRITICAL ALARM: Primary Physician Gregory House notified of critical potassium level. Message telemetry logged.');
    
    // Request Patient file lookup on background to force dynamic incident correlation on SIEM
    fetch('/api/patients/HIS-3044').then(() => {
      // This forces telemetry check on the patient
    });
  };

  const chemicalReferenceInterpretation = () => {
    return 'Analyzed successfully. No critical references breached.';
  };

  // Row selection filters
  const visiblePatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(globalSearch.toLowerCase()) || 
    p.id.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const activeRequestsList = labRequests.filter(req => {
    const p = patients.find(pat => pat.id === req.patientId);
    const pName = p ? p.fullName.toLowerCase() : '';
    const tName = req.testName.toLowerCase();
    
    const matchesSearch = pName.includes(sampleSearch.toLowerCase()) || 
                          req.id.toLowerCase().includes(sampleSearch.toLowerCase()) ||
                          tName.includes(sampleSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (requestsTab === 'New') {
      return req.status === LabStatus.PENDING;
    } else if (requestsTab === 'In Progress') {
      return req.status === LabStatus.PROCESSING;
    } else if (requestsTab === 'Review') {
      return req.status === LabStatus.PROCESSING; // Awaiting reviewer oversight
    } else {
      return req.status === LabStatus.COMPLETED;
    }
  });

  return (
    <div className="flex bg-slate-50 min-h-[85vh] rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative" id="laboratory-scientist-dashboard-view">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* LIS NAVIGATION INSPIRED SIDEBAR */}
      {/* ========================================================= */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 font-sans select-none transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="laboratory-sidebar">
        <div className="p-5 flex-1">
          {/* Logo block */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Beaker className="text-blue-600 animate-pulse" size={20} />
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#0284c7] font-bold block">St. Jude Medical LIS</span>
                <span className="text-slate-800 font-bold text-sm tracking-tight block">Pathology Laboratory</span>
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

          <nav className="space-y-1">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 pl-3">Central Panel Queue</span>
            <button
              onClick={() => { setActiveMenu('Dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Dashboard' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <Activity size={15} />
                Dashboard
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('Requests'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Requests' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <FileText size={15} />
                Incoming Requests
              </span>
              <span className={`text-[9.5px] px-1.5 py-0.2 font-bold font-mono rounded ${activeMenu === 'Requests' ? 'bg-sky-205 bg-sky-200 text-sky-800' : 'bg-sky-100 text-sky-800'}`}>34</span>
            </button>

            <button
              onClick={() => { setActiveMenu('Tracking'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Tracking' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <Layers size={15} />
                Sample Tracking
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('Results'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Results' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-905 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle size={15} />
                Results Entry Form
              </span>
            </button>

            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 pt-4 mb-2 pl-3">LIS Operations</span>

            <button
              onClick={() => { setActiveMenu('Patients'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Patients' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Search size={15} />
              Global Patient Records
            </button>

            <button
              onClick={() => { setActiveMenu('Reports'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Reports' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Dna size={15} />
              Diagnostic Analytics
            </button>

            <button
              onClick={() => { setActiveMenu('Telemetry'); loadLabDetails(); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Telemetry' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Shield size={15} />
              ATIF Audit Logs
            </button>
          </nav>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-sky-700 font-bold">
            <Shield size={12} fill="currentColor" />
            <span>Cybersecure Terminal</span>
          </div>
          <span className="block text-[10px] text-slate-500 font-mono">Workstation: LAB-SCI-44</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* PRIMARY WORKSPACE CONTENT CANVAS */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0" id="laboratory-scientist-main-canvas">
        
        {/* HEADER INFORMATION RIDGE */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <h1 className="text-xl font-bold text-slate-850" id="laboratory-heading-label">{activeMenu}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping inline-block" />
                Good morning, Lab Scientist {currentUser?.fullName || 'Tunde'} • Day Shift
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search tests */}
            <div className="relative flex-1 sm:w-64 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search test name or patient family name..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>

            {/* Quick Sample input */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search sample barcode ID..."
                value={sampleSearch}
                onChange={(e) => setSampleSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 pl-4 pr-10 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <Dna className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={13} style={{ animationDuration: '6s' }} />
            </div>

            {/* Bell alarm */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200 relative cursor-pointer block"
                title="System Notifications"
              >
                <Bell size={15} className="text-slate-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center font-mono">
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
                          onShowNotification("All notifications marked as read.");
                        }} 
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-sans">
                        All caught up! No active alerts.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            onShowNotification(`Alert read: "${n.text}"`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-blue-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
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
          </div>
        </header>

        {/* WORKSPACE REGULAR ROUTING GRID */}
        <div className="p-6 flex-1 overflow-auto space-y-6">

          {/* ==================== WORKSPACE: DASHBOARD ==================== */}
          {activeMenu === 'Dashboard' && (
            <>
              {/* Live KPI CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="laboratory-live-kpis">
                <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-450 block">Pending Tests</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">34</div>
                  <span className="text-[10px] font-mono text-blue-600 flex items-center gap-0.5 mt-1 font-semibold">
                    +6 from yesterday
                  </span>
                </div>
                <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-450 block">Samples Received</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">42</div>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-0.5 mt-1 font-semibold">
                    +8 from yesterday
                  </span>
                </div>
                <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-450 block">Results Released</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">56</div>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-0.5 mt-1 font-semibold flex items-center">
                    +14 from yesterday
                  </span>
                </div>
                <div className="bg-white border border-rose-100 p-4 rounded-2xl shadow-xs bg-rose-50/10">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-rose-500 block">Urgent Tests</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">7</div>
                  <span className="text-[10px] font-mono text-rose-600 flex items-center gap-0.5 mt-1 font-bold">
                    Needs attention
                  </span>
                </div>
                <div className="bg-white border border-rose-100 p-4 rounded-2xl shadow-xs bg-rose-50/10">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-rose-500 block font-bold">Delayed Tests</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">5</div>
                  <span className="text-[10px] font-mono text-rose-600 flex items-center gap-0.5 mt-1 font-bold">
                    Over TAT limit
                  </span>
                </div>
              </div>

              {/* GRID ROW 2: INCOMING REQUESTS QUEUE & CURRENT SPECIMEN DETAILS */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Incoming Requests table Card */}
                <div className="xl:col-span-8 bg-white border border-slate-150 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Incoming Lab Requests</h2>
                        <p className="text-[11px] text-slate-400">Process specimen requisitions triggered in clinical consults.</p>
                      </div>

                      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                        {(['New', 'In Progress', 'Review', 'Completed'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setRequestsTab(tab)}
                            className={`px-3 py-1 rounded-lg text-[10.5px] font-semibold cursor-pointer transition-all ${requestsTab === tab ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            {tab === 'New' ? 'Pending (21)' : tab === 'In Progress' ? 'In Progress (12)' : tab === 'Review' ? 'Awaiting Review' : 'Completed (56)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-450 font-mono text-[10px] uppercase">
                            <th className="py-2 px-1">Patient Subject</th>
                            <th className="py-2 px-1">Test Profile</th>
                            <th className="py-2 px-1">Clinician</th>
                            <th className="py-2 px-1">Status</th>
                            <th className="py-2 px-1">Priority</th>
                            <th className="py-2 px-1 text-right">EHR Entry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans text-[11.5px] text-slate-700">
                          {activeRequestsList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">No sample processes logging in this section segment.</td>
                            </tr>
                          ) : (
                            activeRequestsList.slice(0, 5).map((req) => {
                              const patient = patients.find(p => p.id === req.patientId);
                              const isVIP = patient?.isVip;
                              return (
                                <tr 
                                  key={req.id} 
                                  className={`hover:bg-slate-50/80 cursor-pointer transition-all ${selectedLabRequest?.id === req.id ? 'bg-blue-50/15' : ''}`}
                                  onClick={() => setSelectedLabRequest(req)}
                                >
                                  <td className="py-3 px-1 font-semibold">
                                    <span className="block text-slate-800 hover:underline">{patient ? patient.fullName : 'Confidential'}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{req.patientId}</span>
                                  </td>
                                  <td className="py-3 px-1 font-mono text-slate-650 font-bold">{req.testName}</td>
                                  <td className="py-3 px-1 text-slate-500">Dr. {req.orderedBy || 'Gregory House'}</td>
                                  <td className="py-3 px-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      req.status === LabStatus.PENDING ? 'bg-rose-100 text-rose-800' :
                                      req.status === LabStatus.PROCESSING ? 'bg-blue-100 text-blue-800' :
                                      'bg-slate-150 text-slate-600'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${isVIP ? 'bg-amber-100 text-amber-800 border' : 'bg-slate-100 text-slate-555 text-slate-600'}`}>
                                      {isVIP ? 'CRITICAL VIP' : 'Normal'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-1 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (patient) onOpenPatientFile(patient.id);
                                      }}
                                      className="px-2 py-1 border hover:bg-slate-100 rounded text-[10px] text-slate-500"
                                    >
                                      View EHR Chart
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <button 
                      onClick={() => setActiveMenu('Requests')}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      View all incoming requests ({labRequests.length}) <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Specimen tracking dashboard details card */}
                <div className="xl:col-span-4 bg-white border border-slate-150 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-slate-100 pb-3 mb-3">
                      <h2 className="text-sm font-bold text-slate-850">Sample Tracking</h2>
                      <p className="text-[11px] text-slate-400">Specimen logging barcode detail verification.</p>
                    </div>

                    {selectedLabRequest ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border font-mono">
                          <span className="block text-[10px] text-slate-400 uppercase">Barcode Tracking ID</span>
                          <span className="block font-bold text-slate-800 text-xs mt-0.5">LAB-2026-{(selectedLabRequest.id || '0012')}</span>
                          <div className="mt-2 text-xs">
                            <span className="text-slate-500 block">Patient Subject:</span>
                            <span className="font-bold text-slate-750 block">{patients.find(pt=>pt.id === selectedLabRequest.patientId)?.fullName || 'Confidential'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4 text-xs font-sans">
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-450">Sample Bio-Type:</span>
                            <span className="font-mono font-bold text-slate-700">Whole Blood (Purple EDTA)</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-450">Draw Scheduled:</span>
                            <span className="font-mono text-slate-755 font-semibold">Today, 08:45 AM</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-450">Draw Collector Office:</span>
                            <span className="text-slate-700 font-semibold">Inpatient Phlebotomy Samson A.</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-450">EHR Dispatch status:</span>
                            <span className="text-rose-600 font-bold uppercase">{selectedLabRequest.status}</span>
                          </div>
                        </div>

                        {selectedLabRequest.status === LabStatus.PENDING && (
                          <div className="space-y-2 pt-2">
                            <span className="block text-[10.5px] font-mono text-slate-400 uppercase">Draw Actions</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleUpdateSampleStatus(selectedLabRequest.id, LabStatus.PROCESSING, 'Whole Blood')}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] rounded-xl transition-all cursor-pointer text-center"
                              >
                                Receive Blood Sample
                              </button>
                              <button
                                onClick={() => handleUpdateSampleStatus(selectedLabRequest.id, LabStatus.PROCESSING, 'Capillary Serum')}
                                className="px-3 py-2 bg-white border hover:bg-slate-50 text-slate-650 font-bold text-[10.5px] rounded-xl transition-all font-mono"
                              >
                                Serum Separator Tube (SST)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-slate-400 italic text-xs">
                        Select a sample in the incoming request queue to prompt bio-analysis or receive samples.
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setActiveMenu('Tracking')}
                    className="w-full bg-slate-50 border hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold font-mono text-center cursor-pointer mt-4"
                  >
                    View barcoded tube catalog
                  </button>
                </div>

              </div>

              {/* GRID ROW 3: PROCESSING STACKS, RESULTS FORM, CRITICAL LEVEL ALERTS */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Test Processing Queue running */}
                <div className="xl:col-span-3 bg-white border border-slate-150 rounded-2xl shadow-xs p-5">
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Analyzers Processing</h2>
                    <p className="text-[10px] text-slate-400">Specimens currently spinning inside automated chemistry units.</p>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-2.5 bg-blue-50/35 border border-blue-100/50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-blue-900">Full Blood Count (FBC)</span>
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      </div>
                      <span className="text-[10px] text-slate-500 block">J. Doe (HIS-1001) • Draw 09:25</span>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1">
                        <div className="bg-blue-500 h-full w-[70%] animate-pulse" />
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50/35 border border-blue-100/50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-blue-900">Liver Profiles (LFT)</span>
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      </div>
                      <span className="text-[10px] text-slate-500 block">M. Smith (HIS-2034) • Draw 09:20</span>
                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-1">
                        <div className="bg-blue-500 h-full w-[45%] animate-pulse" />
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50/35 border border-blue-100/50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-blue-900">Malaria Parasitology</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-500 block">J. Brown (HIS-3045) • Draw 09:10</span>
                      <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">✓ Complete • Pending Entry</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Urinalysis strip reader</span>
                        <span className="h-2 w-2 rounded-full bg-slate-450 bg-slate-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 block">L. Johnson (HIS-4042) • Draw 09:05</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Results Entry form sheet */}
                <form onSubmit={handleCommitResults} className="xl:col-span-5 bg-white border border-slate-150 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center bg-white">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Analytical Results Entry Workbook</h2>
                        <p className="text-[11px] text-slate-400">Validate values and release outcomes to patient charts.</p>
                      </div>
                      <Layers size={15} className="text-slate-400" />
                    </div>

                    {selectedLabRequest ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-blue-600 uppercase block font-bold">Active Worksheet Target</span>
                            <span className="font-bold text-slate-800 block text-xs mt-0.5">{selectedLabRequest.testName}</span>
                            <span className="text-[10.5px] text-slate-500 font-mono block">Patient: {patients.find(pt=>pt.id===selectedLabRequest.patientId)?.fullName || 'EHR Record'}</span>
                          </div>
                          <span className="text-[10px] font-mono border bg-white px-2 py-0.5 rounded font-bold">LAB-{selectedLabRequest.id}</span>
                        </div>

                        {/* Condition forms based on test types */}
                        <div className="space-y-3">
                          {selectedLabRequest.testName.toLowerCase().includes('blood') || selectedLabRequest.testName.toLowerCase().includes('count') || selectedLabRequest.testName.toLowerCase().includes('fbc') ? (
                            <div className="space-y-3 text-xs">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="font-mono font-bold text-[10.5px]">Hemoglobin (g/dL)</label>
                                  <input type="text" value={hemoglobinValue} onChange={(e)=>setHemoglobinValue(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none" />
                                  <span className="text-[9.5px] text-slate-400 block font-mono">Ref: 13.0 - 17.0</span>
                                </div>
                                <div className="space-y-1">
                                  <label className="font-mono font-bold text-[10.5px]">WBC count (10^9/L)</label>
                                  <input type="text" value={wbcValue} onChange={(e)=>setWbcValue(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none" />
                                  <span className="text-[9.5px] text-slate-400 block font-mono">Ref: 4.0 - 11.0</span>
                                </div>
                                <div className="space-y-1">
                                  <label className="font-mono font-bold text-[10.5px]">Platelets (10^9/L)</label>
                                  <input type="text" value={plateletValue} onChange={(e)=>setPlateletValue(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none" />
                                  <span className="text-[9.5px] text-slate-400 block font-mono">Ref: 150 - 450</span>
                                </div>
                              </div>
                            </div>
                          ) : selectedLabRequest.testName.toLowerCase().includes('malaria') ? (
                            <div className="space-y-2 text-xs">
                              <label className="font-semibold block">Malaria Parasite Microscopic Finding</label>
                              <select value={malariaResult} onChange={(e)=>setMalariaResult(e.target.value)} className="w-full bg-slate-50 border p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="No Parasites Seen">No Parasites Seen (Negative)</option>
                                <option value="Plasmodium Falciparum + (Mild)">Plasmodium Falciparum + (Mild)</option>
                                <option value="Plasmodium Falciparum ++ (Moderate)">Plasmodium Falciparum ++ (Moderate)</option>
                                <option value="Plasmodium Falciparum +++ (Severe)">Plasmodium Falciparum +++ (Severe)</option>
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-3 text-xs">
                              <div className="space-y-1">
                                <label className="font-semibold">Diagnostic Findings Statement</label>
                                <textarea
                                  required
                                  rows={2}
                                  placeholder="Enter complete clinical findings description..."
                                  value={customResultText}
                                  onChange={(e)=>setCustomResultText(e.target.value)}
                                  className="w-full bg-slate-55 bg-slate-50 border p-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 text-xs">
                            <label className="font-semibold block">Reviewer Interpretation & Notes</label>
                            <input 
                              type="text" 
                              placeholder="Any comments, reference exclusions, or critical notes..."
                              value={additionalNotes}
                              onChange={(e)=>setAdditionalNotes(e.target.value)}
                              className="w-full bg-slate-50 border p-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-slate-400 italic text-xs">
                        Select an active requisition in the requests table grid to prompt results certification.
                      </div>
                    )}
                  </div>

                  {selectedLabRequest && (
                    <button
                      type="submit"
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Save size={14} />
                      Verify and Release Certified Result
                    </button>
                  )}
                </form>

                {/* Highly specialized red-themed Critical level alarms panel */}
                <div className="xl:col-span-4 bg-white border border-rose-200 bg-rose-50/5 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="border-b border-rose-100 pb-3 mb-3">
                      <h2 className="text-xs font-bold font-mono text-rose-600 tracking-wider uppercase flex items-center gap-1.5">
                        <AlertCircle size={15} />
                        Critical Diagnostic Panic Alert
                      </h2>
                      <p className="text-[11px] text-slate-500">Panic metabolic indicators requiring immediate physician tracking.</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl space-y-1.5 header-sub">
                        <div className="text-[10px] font-mono text-rose-700 tracking-wide uppercase font-bold">Test Analytes: Serum Potassium (K+)</div>
                        <p className="text-2xl font-black text-rose-600 my-0">2.1 mmol/L</p>
                        <p className="text-[11.5px] text-rose-800 font-mono">Panic Range Low • Ref: 3.5 - 5.1 mmol/L</p>
                      </div>

                      <div className="text-slate-650 space-y-1">
                        <p className="font-semibold">Subject Recipient Details:</p>
                        <div className="bg-slate-50 p-2.5 rounded-xl border font-mono text-[11px] tracking-tight space-y-0.5">
                          <span className="block text-slate-800 font-bold">Mary Smith (HIS-2034)</span>
                          <span className="block text-slate-500">Ward Admissions: Female Medical Bed G-22</span>
                          <span className="block text-slate-450 block">Physician: Dr. Adams G.</span>
                        </div>
                      </div>

                      <p className="text-[10.5.px] text-slate-500 italic">Policy directive: LIS requires phlebotomy supervisor notify attending clinic head within 15 minutes of analyte verification.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleNotifyPhysician}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 shadow-md shadow-rose-600/10"
                  >
                    <Bell size={13} fill="currentColor" />
                    Notify Attending Attachee
                  </button>
                </div>

              </div>

              {/* GRID ROW 4: DATA SPLINES VISUALISATION TRACKER & COMPLETED RELEASES */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Visual SVG line trends tracker card */}
                <div className="xl:col-span-8 bg-white border border-slate-150 rounded-2xl p-5">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Laboratory Analytics</h2>
                      <p className="text-[11px] text-slate-400">Turnaround processing volumes and critical metabolic audit statistics.</p>
                    </div>

                    <div className="flex gap-4 text-xs font-mono">
                      <span className="text-blue-600">Avg TAT: <strong>1h 45m</strong></span>
                      <span className="text-emerald-600">Certified Today: <strong>98 tests</strong></span>
                    </div>
                  </div>

                  {/* SVG line chart */}
                  <div className="relative h-44 w-full">
                    <svg className="h-full w-full" viewBox="0 0 600 150" id="lab-svg-trend-chart">
                      {/* Grid dividers */}
                      <line x1="50" y1="20" x2="550" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="70" x2="550" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="120" x2="550" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                      {/* X and Y coordinates */}
                      <text x="30" y="25" fill="#94a3b8" className="text-[9px] font-mono text-center">150</text>
                      <text x="30" y="75" fill="#94a3b8" className="text-[9px] font-mono text-center">75</text>
                      <text x="30" y="125" fill="#94a3b8" className="text-[9px] font-mono text-center">0</text>

                      {/* Timeline scales */}
                      <text x="60" y="145" fill="#94a3b8" className="text-[9px] font-mono text-center">08:00</text>
                      <text x="180" y="145" fill="#94a3b8" className="text-[9px] font-mono text-center">10:00</text>
                      <text x="300" y="145" fill="#94a3b8" className="text-[9px] font-mono text-center">12:00</text>
                      <text x="420" y="145" fill="#94a3b8" className="text-[9px] font-mono text-center">14:00</text>
                      <text x="540" y="145" fill="#94a3b8" className="text-[9px] font-mono text-center">16:00</text>

                      {/* Trend spline curve (Polyline) */}
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3.5"
                        points="60,110 120,75 180,95 240,40 300,65 360,25 420,80 480,50 540,115"
                      />

                      {/* Highlighted circles on nodes */}
                      <circle cx="240" cy="40" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="360" cy="25" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Completed results ledger list */}
                <div className="xl:col-span-4 bg-white border border-slate-150 rounded-2xl p-5">
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800">Recently Released results</h2>
                    <p className="text-[10.5px] text-slate-450">Verified diagnostic parameters released to the active clinic wards.</p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {labRequests.filter(req => req.status === LabStatus.COMPLETED).slice(0, 5).map((req, idx) => (
                      <div key={req.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-[11px] font-mono">
                        <div>
                          <span className="font-bold text-slate-800 block">LAB-{req.id} • {req.testName}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">Patient: {patients.find(p=>p.id === req.patientId)?.fullName || 'Confidential'}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-800 font-bold rounded">RELEASED</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ==================== WORKSPACE: REQUESTS REPOSITORY ==================== */}
          {activeMenu === 'Requests' && (
            <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-md font-bold text-slate-800">Specimen and Diagnostics Requisitions</h2>
                  <p className="text-xs text-slate-500">View complete historical or newly ordered laboratory procedures.</p>
                </div>
                <button
                  onClick={loadLabDetails}
                  className="p-2 border rounded-xl hover:bg-slate-50 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  Reload Requests
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-slate-400 font-mono text-[10px] uppercase bg-slate-50">
                      <th className="py-2.5 px-3">Req ID</th>
                      <th className="py-2.5 px-3">Patient subject</th>
                      <th className="py-2.5 px-3">Requisition Profile Name</th>
                      <th className="py-2.5 px-3">attending clinician</th>
                      <th className="py-2.5 px-3">commissioned Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Commit Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-750">
                    {labRequests.map(req => {
                      const p = patients.find(pat => pat.id === req.patientId);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{req.id}</td>
                          <td className="py-3 px-3">
                            <span className="block font-semibold">{p ? p.fullName : 'Confidential Record'}</span>
                            <span className="text-[10px] text-slate-450 font-mono">{req.patientId}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{req.testName}</td>
                          <td className="py-3 px-3 text-slate-650">Dr. {req.orderedBy}</td>
                          <td className="py-3 px-3 text-slate-450 font-mono">{req.orderedDate}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === LabStatus.COMPLETED ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {req.status !== LabStatus.COMPLETED ? (
                              <button
                                onClick={() => { setSelectedLabRequest(req); setActiveMenu('Dashboard'); }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10.5px] cursor-pointer"
                              >
                                Enter Results
                              </button>
                            ) : (
                              <span className="font-mono text-slate-450 bg-emerald-50 text-emerald-800 text-[10px] inline-block font-bold border border-emerald-250 px-2 py-0.5 rounded">Committed Outcome</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== PANEL: GLOBAL EHR CLIENT DIRECTORY ==================== */}
          {activeMenu === 'Patients' && (
            <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h2 className="text-md font-bold text-slate-800">EHR Global Diagnostic Subject Directory</h2>
                <p className="text-xs text-slate-500">Laboratory scientist read access is authorized across patients to review baseline test analytics.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-mono text-[10px] uppercase bg-slate-50">
                      <th className="py-2.5 px-3">Subject ID</th>
                      <th className="py-2.5 px-3">Full Legal Name</th>
                      <th className="py-2.5 px-3">DOB / Age</th>
                      <th className="py-2.5 px-3">Diagnoses Index</th>
                      <th className="py-2.5 px-3 font-bold">Coded Allergies</th>
                      <th className="py-2.5 px-3 text-right">Clinical History Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-755">
                    {visiblePatients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/55">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.id}</td>
                        <td className="py-3 px-3 font-semibold">{p.fullName}</td>
                        <td className="py-3 px-3 font-mono">{p.dob}</td>
                        <td className="py-3 px-3 text-slate-650">{p.diagnoses.join(', ') || 'No diagnoses indexed'}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {p.allergies.map((a, i) => (
                              <span key={i} className="px-1.5 py-0.2 bg-rose-50 text-rose-700 font-mono font-bold rounded text-[9.5px] border uppercase">{a}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenPatientFile(p.id)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px]"
                          >
                            Open Records File
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== PANEL: CYBER ATIF SIEM Logs ==================== */}
          {activeMenu === 'Telemetry' && (
            <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="border-b pb-4 flex justify-between items-center sm:items-start flex-col sm:flex-row gap-3">
                <div>
                  <h2 className="text-md font-bold text-slate-850">ATIF-HIS: Laboratory Diagnostic Security Telemetry</h2>
                  <p className="text-xs text-slate-500">Active monitoring logs demonstrating network SIEM telemetry feeds on analytical records.</p>
                </div>
                <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10.5px] rounded-lg font-bold">
                  Telemetry Channel Connected
                </div>
              </div>

              <div className="space-y-2 font-mono">
                {securityLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs">No active laboratory audit logs fetched.</div>
                ) : (
                  securityLogs.filter(e => (e.role as any) === 'Laboratory Scientist' || (e.role as any) === 'Lab Scientist' || e.activityType === 'LAB_ACCESS').slice(0, 15).map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800">{log.id}</span>
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-mono text-[9px] rounded font-bold uppercase">{log.activityType}</span>
                          <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-600 mt-1 font-sans">{log.description}</p>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 text-right shrink-0">
                        <span>Workstation: {log.deviceName}</span>
                        <span className="block">IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Specimen Tube Tracking Register (Fully Interactive) */}
          {activeMenu === 'Tracking' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white p-5 border border-slate-200 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Dna className="text-sky-650 animate-pulse text-sky-600" size={18} />
                    Active Specimen Tube tracking register
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Control barcodes reception, draw updates and serum separation processes inside the LIS queue.</p>
                </div>
                <div className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold border border-sky-100 uppercase">
                  Barcode Scanner Active on Port 3000
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 font-mono">Incoming Specimen Queue ({labRequests.filter(r => r.status !== LabStatus.COMPLETED).length})</span>
                    <button onClick={loadLabDetails} className="p-1 px-2.5 bg-white border hover:bg-slate-50 rounded-xl text-[10.5px] font-bold flex items-center gap-1 cursor-pointer">
                      <RefreshCw size={11} /> Refresh Tubes
                    </button>
                  </div>
                  <div className="divide-y max-h-120 overflow-y-auto">
                    {labRequests.filter(r => r.status !== LabStatus.COMPLETED).length === 0 ? (
                      <div className="p-12 text-center text-slate-400 italic text-xs">
                        No specimens awaiting tracking or spin processing at this moment.
                      </div>
                    ) : (
                      labRequests.filter(r => r.status !== LabStatus.COMPLETED).map((req, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-50/70 transition-all flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">LAB-{req.id}</span>
                              <strong className="text-slate-800">{patients.find(p => p.id === req.patientId)?.fullName || "Confidential"}</strong>
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-mono text-slate-500">{req.testName}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">Sample Type Desired: <strong className="text-slate-750 font-bold">{req.sampleType || 'Whole Blood'}</strong></p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {req.status === LabStatus.PENDING ? (
                              <button
                                onClick={() => handleUpdateSampleStatus(req.id, LabStatus.PROCESSING, 'EDTA Tube')}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10.5px] font-bold cursor-pointer"
                              >
                                Draw Specimen & Spin
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 font-bold rounded-lg text-[9.5px] font-mono">
                                In Centrifuge (Processing)
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-5 rounded-3xl space-y-3">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase font-mono tracking-widest">LIS tube centrifuge controls</h4>
                    <p className="text-[11px] text-indigo-650 leading-relaxed font-sans">
                      Spun specimens must follow speed parameters: Complete Blood Count tubes go direct to automatic analyzer; Chemistry tubes undergo 3500 RPM separator centrifugation.
                    </p>
                    <button
                      onClick={() => {
                        onShowNotification("Standard Centrifuge Rotations Calibrated. Multi-tube lock engaged.");
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider cursor-pointer"
                    >
                      Calibrate Centrifuge Spin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIS Results Entry Form Session (Fully Interactive) */}
          {activeMenu === 'Results' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white p-5 border border-slate-200 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clipboard className="text-[#0284c7] animate-pulse" size={18} />
                    LIS diagnostic result publishing workbook
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Direct manual interface to verify, audit, and commit laboratory assay findings to the EHR database.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const pending = labRequests.find(r => r.status === LabStatus.PROCESSING || r.status === LabStatus.PENDING);
                      if (pending) {
                        setSelectedLabRequest(pending);
                        onShowNotification(`Loaded results workbook for patient: ${patients.find(p => p.id === pending.patientId)?.fullName || "Confidential"}`);
                      } else {
                        onShowNotification("No active pending specimens found inside the LIS queue.");
                      }
                    }}
                    className="p-1 px-3 bg-white border text-xs font-bold hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Load Pending Case
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border rounded-3xl p-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Active Specimen Requisitions</h4>
                  <div className="space-y-2 divide-y divide-slate-50 max-h-120 overflow-y-auto">
                    {labRequests.length === 0 ? (
                      <p className="text-xs italic text-slate-400">No requisitions available</p>
                    ) : (
                      labRequests.map((req, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setSelectedLabRequest(req);
                            if (req.testName.toLowerCase().includes('count')) {
                              setHemoglobinValue('13.8');
                              setWbcValue('6.8');
                              setPlateletValue('250');
                            }
                          }}
                          className={`p-3 rounded-2xl text-xs text-left transition-all cursor-pointer ${
                            selectedLabRequest?.id === req.id 
                              ? 'bg-sky-50 border border-sky-200 shadow-xs' 
                              : 'bg-slate-50 hover:bg-slate-100/70 border border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-mono font-bold text-[10px] text-slate-400">LAB-{req.id}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase ${
                              req.status === LabStatus.COMPLETED ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}>{req.status}</span>
                          </div>
                          <strong className="text-slate-805 text-slate-800 block truncate">{patients.find(p => p.id === req.patientId)?.fullName || "Confidential"}</strong>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono font-bold uppercase">{req.testName}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {selectedLabRequest ? (
                    <form onSubmit={handleCommitResults} className="bg-white border rounded-3xl p-5 space-y-4">
                      <div className="border-b pb-3 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">CASE DIRECTORY: LAB-{selectedLabRequest.id}</span>
                          <strong className="block text-slate-900 text-sm">{patients.find(p => p.id === selectedLabRequest.patientId)?.fullName || "Confidential"} — {selectedLabRequest.testName}</strong>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 border border-emerald-100 rounded-full text-[9px] font-mono font-bold">
                          REPLICATIVE LOCK SAFE
                        </span>
                      </div>

                      {/* Diagnostic Assay Parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {selectedLabRequest.testName.toLowerCase().includes('count') || selectedLabRequest.testName.toLowerCase().includes('blood') || selectedLabRequest.testName.toLowerCase().includes('fbc') ? (
                          <>
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Hemoglobin Count (g/dL) [Ref: 12-16]</label>
                              <input 
                                type="text" 
                                value={hemoglobinValue} 
                                onChange={(e) => setHemoglobinValue(e.target.value)} 
                                className="w-full p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">White Blood Cells (10^9/L) [Ref: 4-11]</label>
                              <input 
                                type="text" 
                                value={wbcValue} 
                                onChange={(e) => setWbcValue(e.target.value)} 
                                className="w-full p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Platelets Assay (10^9/L) [Ref: 150-450]</label>
                              <input 
                                type="text" 
                                value={plateletValue} 
                                onChange={(e) => setPlateletValue(e.target.value)} 
                                className="w-full p-2 border border-slate-200 bg-white rounded-xl"
                              />
                            </div>
                          </>
                        ) : selectedLabRequest.testName.toLowerCase().includes('urinalysis') || selectedLabRequest.testName.toLowerCase().includes('urine') ? (
                          <>
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Urinalysis Glucose Level</label>
                              <select 
                                value={urineGlucose} 
                                onChange={(e) => setUrineGlucose(e.target.value)} 
                                className="w-full p-2 border border-slate-200 bg-white rounded-xl"
                              >
                                <option value="Negative">Negative</option>
                                <option value="Trace">Trace (+)</option>
                                <option value="Moderately Elevated">Moderate (++)</option>
                                <option value="Highly Elevated">High (+++)</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-2">
                            <label className="block text-slate-500 font-mono font-bold mb-1">Assay Result Findings Description</label>
                            <textarea 
                              value={customResultText} 
                              onChange={(e) => setCustomResultText(e.target.value)} 
                              placeholder="Type qualitative diagnostic details, e.g. 'No Parasites Seen', 'Culture Sterile at 48 Hours'..."
                              className="w-full p-3 border border-slate-200 bg-white rounded-xl h-20 resize-none focus:outline-none focus:ring-1"
                            />
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-slate-500 font-mono font-bold mb-1">Confirmatory Pathologist Comments</label>
                          <input 
                            type="text" 
                            placeholder="Add secondary confirmatory notes or laboratory device calibration reference..."
                            value={additionalNotes} 
                            onChange={(e) => setAdditionalNotes(e.target.value)} 
                            className="w-full p-2 border border-slate-250 bg-white rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                        {selectedLabRequest.status === LabStatus.COMPLETED ? (
                          <p className="text-emerald-600 font-bold font-mono">This lab result is already committed and published.</p>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              onClick={() => setSelectedLabRequest(null)}
                              className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-bold cursor-pointer"
                            >
                              Cancel Case
                            </button>
                            <button 
                              type="submit" 
                              className="px-5 py-2 bg-slate-900 border text-white hover:bg-slate-850 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Save size={13} /> Authorize and Publish Result
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="bg-slate-50 border p-12 rounded-3xl text-center text-slate-400 italic text-xs h-64 flex flex-col justify-center items-center">
                      <Clipboard className="text-slate-300 mb-2 animate-bounce" size={24} />
                      Select a patient requisition from the sidebar to authorize assay results manually.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'Reports' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white p-5 border border-slate-200 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-emerald-650 text-emerald-600 animate-pulse" size={18} />
                    Laboratory workload diagnostic reports
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Statistical outputs, assay counts, average turnaround times, and clinical quality compliance charts.</p>
                </div>
                <button 
                  onClick={() => onShowNotification('Full day shift lab performance audit generated and saved to clinical network directory.')} 
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 font-bold border text-white rounded-xl text-xs transition-all cursor-pointer"
                >
                  Export Workload Spreadsheet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                <div className="bg-white p-5 border rounded-3xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Average TAT (Turnaround Time)</span>
                  <strong className="text-2xl font-extrabold block text-slate-900">14.2 Minutes</strong>
                  <span className="text-[10.5px] text-emerald-600 font-mono font-bold">● 4.6% Improvement vs last shift</span>
                </div>
                <div className="bg-white p-5 border rounded-3xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Turnover Volume Daily</span>
                  <strong className="text-2xl font-extrabold block text-slate-905">68 Panels Done</strong>
                  <span className="text-[10.5px] text-slate-500 font-mono">Completed by Tunde & Day Shift staff</span>
                </div>
                <div className="bg-white p-5 border rounded-3xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Abnormal Vitals Flags</span>
                  <strong className="text-2xl font-extrabold text-rose-700 block text-rose-800">12 Patients Flagged</strong>
                  <span className="text-[10.5px] text-red-500 font-bold font-mono">Requires critical notifications log</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* REAR POLICY Sentinel STATEMENT */}
        <footer className="bg-slate-50 border-t border-slate-200 py-3 px-6 text-slate-400 text-[10.5px] font-mono flex flex-col md:flex-row justify-between items-center gap-2">
          <span>Standard: LIS Hospital-wide specimen query access per ATIF specifications.</span>
          <span className="flex items-center gap-1.5 text-blue-600 font-bold">
            <ShieldCheck size={14} className="text-emerald-600" />
            Audit Logging & Threat Engine monitored by Central LIS Sentinel
          </span>
        </footer>

      </main>

    </div>
  );
}
