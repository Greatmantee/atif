/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Bell, Shield, Calendar, Clock, CheckCircle,
  AlertTriangle, ArrowRight, UserCheck, MessageSquare, Clipboard, Layers,
  Settings, LogOut, ChevronRight, Eye, Check, Plus, AlertCircle, RefreshCw,
  X, FileText, Upload, Trash, ShieldCheck, BarChart3, Database, HelpCircle,
  FileSpreadsheet, Share2, FileSymlink, Sparkles, FolderClosed, Hash, Tag,
  LayoutDashboard, Play, ArrowUpRight, BarChart, Menu
} from 'lucide-react';
import { Patient, SecurityEvent } from '../types';

interface HIMDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function HIMDashboardView({
  currentUser,
  patients,
  onRefresh,
  onOpenPatientFile,
  onShowNotification
}: HIMDashboardViewProps) {
  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'Total 8 unchecked document indexing alerts inside queue.', time: '09:30 AM', read: false },
    { id: '2', text: 'EHR Access Policy Enforcement audit log verified.', time: '09:15 AM', read: false },
    { id: '3', text: 'Suspicious credential login attempts cleared by SOC.', time: '08:50 AM', read: true },
    { id: '4', text: 'Centrifuge lab spec processing completed for Patient HIS-1001.', time: '08:44 AM', read: false },
    { id: '5', text: 'Secure backup successfully committed to disaster recovery vault.', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // States
  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [requestTab, setRequestTab] = useState<string>('All');

  // Verification states
  const [verifiedPatientIds, setVerifiedPatientIds] = useState<string[]>([]);
  const [verifyingPatient, setVerifyingPatient] = useState<Patient | null>(null);
  const [idMatchChecked, setIdMatchChecked] = useState(false);
  const [biometricMatchChecked, setBiometricMatchChecked] = useState(false);
  const [contactVerifiedChecked, setContactVerifiedChecked] = useState(false);

  // Form registration states
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('1990-01-01');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmergency, setRegEmergency] = useState('');
  const [regAllergies, setRegAllergies] = useState('');
  const [regIsVip, setRegIsVip] = useState(false);
  const [regIsStaff, setRegIsStaff] = useState(false);

  // Release of Information state
  const [roiRecipient, setRoiRecipient] = useState('');
  const [roiType, setRoiType] = useState('To Insurance');
  const [roiReason, setRoiReason] = useState('Insurance Claim Audit');
  const [roiPatientId, setRoiPatientId] = useState('');

  // Scanning simulation state
  const [scannedFileList, setScannedFileList] = useState<Array<{ name: string; size: string; date: string }>>([
    { name: "Scanned_Consent_HIS-1001.pdf", size: "1.2 MB", date: "09:12 AM" },
    { name: "Prior_EHR_Release_HIS-2034.pdf", size: "4.8 MB", date: "08:44 AM" }
  ]);
  const [tempFile, setTempFile] = useState<string>('');

  // Fetch security audit logs
  const fetchSecurityLogs = () => {
    fetch('/api/security/events')
      .then(res => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data) {
          setSecurityLogs(data.events || []);
        }
      })
      .catch(err => console.warn("Error fetching logs (handled):", err));
  };

  useEffect(() => {
    fetchSecurityLogs();
    const interval = setInterval(fetchSecurityLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync patient list with search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPatients(patients);
    } else {
      const q = searchQuery.toLowerCase();
      const matched = patients.filter(
        p => p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
      );
      setFilteredPatients(matched);
    }
  }, [searchQuery, patients]);

  // Actions
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regDob || !regPhone) {
      onShowNotification("Please provide full name, DOB and phone number.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName,
          dob: regDob,
          gender: regGender,
          address: regAddress,
          phone: regPhone,
          email: regEmail,
          emergencyContact: regEmergency,
          allergies: regAllergies ? regAllergies.split(',').map(s => s.trim()) : [],
          isVip: regIsVip,
          isStaff: regIsStaff
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Registered ${regName} safely as ${data.patient.id}!`);
        // reset fields
        setRegName('');
        setRegDob('1990-01-01');
        setRegGender('Male');
        setRegAddress('');
        setRegPhone('');
        setRegEmail('');
        setRegEmergency('');
        setRegAllergies('');
        setRegIsVip(false);
        setRegIsStaff(false);
        onRefresh();
        setActiveMenu('Dashboard');
      } else {
        onShowNotification("Error during backend registration.");
      }
    } catch (err) {
      console.error(err);
      onShowNotification("Failed to connect to core EHR registration API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roiPatientId || !roiRecipient) {
      onShowNotification("Patient ID and Recipient are mandatory.");
      return;
    }
    // Record audit via fetching sensitive info
    fetch(`/api/patients/${roiPatientId}`)
      .then(res => {
        if (res.ok) {
          onShowNotification(`Medical Record compiled and released to "${roiRecipient}" under compliance standards.`);
          setRoiPatientId('');
          setRoiRecipient('');
          fetchSecurityLogs();
        } else {
          onShowNotification(`Could not retrieve Patient File for ID: ${roiPatientId}`);
        }
      });
  };

  const handleVerifyIdentity = (patientId: string) => {
    const patientObj = patients.find(p => p.id === patientId);
    if (patientObj) {
      setVerifyingPatient(patientObj);
      setIdMatchChecked(false);
      setBiometricMatchChecked(false);
      setContactVerifiedChecked(false);
    } else {
      onShowNotification(`Could not find patient record for ID: ${patientId}`);
    }
  };

  const handleConfirmVerification = () => {
    if (!verifyingPatient) return;
    setVerifiedPatientIds(prev => {
      if (!prev.includes(verifyingPatient.id)) {
        return [...prev, verifyingPatient.id];
      }
      return prev;
    });
    onShowNotification(`Identity verification certified for Patient ${verifyingPatient.fullName}. Double-charting clearance complete.`);
    setVerifyingPatient(null);
  };

  const handleScanDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempFile) return;
    const newDoc = {
      name: `${tempFile.replace(/[^a-zA-Z0-9_.-]/g, "_")}_scanned.pdf`,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setScannedFileList([newDoc, ...scannedFileList]);
    setTempFile('');
    onShowNotification(`Successfully scanned and indexed document: ${newDoc.name}`);
  };

  // Mock Request data
  const [requests, setRequests] = useState([
    { id: "REQ-2025-1001", type: "Medical Record", patient: "John Doe (HIS-1001)", patientId: "HIS-1001", requestedBy: "Dr. Gregory House", status: "New", received: "09:15 AM" },
    { id: "REQ-2025-1002", type: "Discharge Summary", patient: "Mary Smith (HIS-2034)", patientId: "HIS-2034", requestedBy: "Dr. Adams", status: "In Progress", received: "08:45 AM" },
    { id: "REQ-2025-1003", type: "Lab Reports", patient: "James Brown (HIS-3045)", patientId: "HIS-3045", requestedBy: "Dr. Stone", status: "In Progress", received: "08:30 AM" },
    { id: "REQ-2025-1004", type: "Imaging Reports", patient: "Linda Johnson (HIS-4042)", patientId: "HIS-4042", requestedBy: "Dr. Adams", status: "New", received: "08:20 AM" },
    { id: "REQ-2025-1005", type: "Complete Chart", patient: "Robert Wilson (HIS-5050)", patientId: "HIS-5050", requestedBy: "Insurance Co.", status: "Completed", received: "Yesterday" }
  ]);

  const filteredRequests = requests.filter(r => {
    if (requestTab === 'All') return true;
    return r.status.toLowerCase() === requestTab.toLowerCase();
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    onShowNotification(`Request ${id} status updated to: ${newStatus}`);
  };

  return (
    <div className="flex bg-[#f8fafc] text-slate-700 min-h-[calc(100vh-6rem)] -m-6 relative font-sans leading-relaxed" id="him-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================== SIDEBAR NAVIGATION ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="him-sidebar">
        <div className="p-5 flex-1">
          {/* Section Identifier */}
          <div className="flex items-center justify-between gap-2.5 mb-6">
            <div className="flex items-center gap-2.5">
              <Clipboard className="text-[#10b981] animate-pulse" size={20} fill="currentColor" />
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#059669] font-bold block">Hospital Unit</span>
                <span className="text-slate-800 font-bold text-sm tracking-tight block">Health Information Dept</span>
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

          <nav className="space-y-1.5" id="him-sidebar-navigation-items">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 pl-3">EHR Directory</span>
            
            <button
              onClick={() => { setActiveMenu('Dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Dashboard' ? 'bg-[#f0fdf4] text-[#047857] border-[#bbf7d0] font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={15} /> Primary Dashboard
            </button>

            <button
               onClick={() => { setActiveMenu('Registration'); setMobileMenuOpen(false); }}
               className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Registration' ? 'bg-[#f0fdf4] text-[#047857] border-[#bbf7d0] font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
             >
               <UserPlus size={15} /> Patient Registration
             </button>

             <button
               onClick={() => { setActiveMenu('ChartAssembly'); setMobileMenuOpen(false); }}
               className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'ChartAssembly' ? 'bg-[#f0fdf4] text-[#047857] border-[#bbf7d0] font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
             >
               <span className="flex items-center gap-2.5">
                 <Layers size={15} /> Chart Assembly
               </span>
               <span className="text-[9.5px] px-1.5 py-0.2 bg-[#ef4444] text-white font-bold font-mono rounded-full">18</span>
             </button>

            <button
              onClick={() => { setActiveMenu('PatientIndex'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'PatientIndex' ? 'bg-[#f0fdf4] text-[#047857] border-[#bbf7d0] font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Users size={15} /> Patient Index
            </button>

            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 pt-4 mb-2 pl-3">Advanced HIM Tools</span>

            <button
              onClick={() => { setActiveMenu('DocumentManagement'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'DocumentManagement' ? 'bg-[#f0fdf4] text-[#047857] border-[#bbf7d0] font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Upload size={15} /> Document Management
            </button>


          </nav>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#047857] font-bold">
            <ShieldCheck size={12} fill="currentColor" />
            <span>Identity Secured Session</span>
          </div>
          <span className="block text-[10px] text-slate-500 font-mono">Terminal: HIM-ST-04</span>
          <span className="block text-[10px] text-slate-400 font-mono">Operator ID: @johnsons</span>
        </div>
      </aside>

      {/* ========================== MAIN CONTAINER ========================== */}
      <main className="flex-1 overflow-y-auto p-6" id="him-main-pane">
        {/* ========================== HEADER ========================== */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" id="him-dashboard-header">
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
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2" id="him-title">
                HIM Officer Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 text-xs">Good morning, {currentUser?.fullName || 'Elena Rostova'}</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono text-[9px] font-bold flex items-center gap-1">
                  <CheckCircle size={10} fill="currentColor" /> VERIFIED CREDENTIALS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Real Search bar */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search patients by name, ID, dob..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-[#10b981] outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 font-bold text-xs">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Notification alert bells */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)} 
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer relative"
                title="System Notifications"
              >
                <Bell size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[8.5px] font-bold w-4 h-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Functional Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-left overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-700">
                      Notifications ({notifications.filter(n => !n.read).length} unread)
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          onShowNotification("All notifications marked as read.");
                        }} 
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        All caught up! No active notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            onShowNotification(`Notification marked as read: "${n.text}"`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-emerald-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <div className="flex-1">
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
                          onShowNotification("Cleared all notifications.");
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

            {/* Active profile badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                {currentUser?.fullName ? currentUser.fullName.split(' ').map((n: string) => n[0]).join('') : 'ER'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800">{currentUser?.fullName || 'Elena Rostova'}</div>
                <div className="text-slate-500 font-mono text-[9px] leading-tight space-y-0.5">
                  <div className="font-medium text-slate-600">{currentUser?.role || 'Health Information Management Officer'}</div>
                  <div className="text-slate-400">IP: {currentUser?.ipAddress || '10.20.1.15'} | Host: {currentUser?.deviceName || 'Desktop HIM-01'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ========================== CONTENT ROUTER ========================== */}

        {activeMenu === 'Dashboard' && (
          <div className="space-y-6" id="him-central-dashboard">
            {/* KPI Cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="him-kpi-cards">
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xs transition-all text-left cursor-pointer" onClick={() => setActiveMenu('PatientIndex')}>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Registered EHR Files</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">{patients.length}</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> Active MPI Master Index
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xs transition-all text-left cursor-pointer" onClick={() => setActiveMenu('ChartAssembly')}>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Charts In Assembly</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">18</span>
                <span className="text-[10px] text-amber-600 font-bold font-mono block mt-1 hover:underline">
                  View full queue &rarr;
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xs transition-all text-left cursor-pointer" onClick={() => setActiveMenu('DocumentManagement')}>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Digitized Patient Sheets</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">{scannedFileList.length + 154}</span>
                <span className="text-[10px] text-[#059669] font-bold font-mono block mt-1">
                  Securely scanned &amp; archived
                </span>
              </div>
            </div>

            {/* Central Queue: Master Patient Index (MPI) & Chart Assembly Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Master Patient Index (MPI) Overview */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Master Patient Index (MPI) Overview</h3>
                      <span className="text-[10.5px] text-slate-400 font-mono">Durable healthcare identity and biological audit repository</span>
                    </div>
                    <button onClick={() => setActiveMenu('Registration')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer">
                      <Plus size={12} /> Register File
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9.5px] font-mono bg-slate-50/50">
                          <th className="py-2.5 px-3">EHR ID</th>
                          <th className="py-2.5 px-2">Patient Name</th>
                          <th className="py-2.5 px-2">DOB</th>
                          <th className="py-2.5 px-2">Primary Contact</th>
                          <th className="py-2.5 px-2">Status Flag</th>
                          <th className="py-2.5 px-2 text-right">Integrity Audit</th>
                          <th className="py-2.5 px-2 text-right">Explore EHR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-sans">
                        {patients.slice(0, 5).map((pat) => (
                          <tr key={pat.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {pat.id}
                            </td>
                            <td className="py-3 px-2 font-medium">
                              <button
                                onClick={() => onOpenPatientFile(pat.id)}
                                className="text-sky-700 hover:underline font-bold text-xs"
                              >
                                {pat.fullName}
                              </button>
                            </td>
                            <td className="py-3 px-2 text-slate-500 font-mono">{pat.dob}</td>
                            <td className="py-3 px-2 text-slate-500 font-mono">{pat.phone}</td>
                            <td className="py-3 px-2">
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-[9px] uppercase font-bold">
                                {pat.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              {verifiedPatientIds.includes(pat.id) ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-[#047857] font-bold bg-[#f0fdf4] border border-[#bbf7d0] px-1.5 py-0.5 rounded">
                                  <CheckCircle size={9} /> Verified
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerifyIdentity(pat.id)}
                                  className="px-2 py-0.5 border text-slate-600 rounded-md text-[10px] hover:bg-slate-100 transition cursor-pointer"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => onOpenPatientFile(pat.id)}
                                className="text-[#0284C7] hover:underline text-xs font-bold font-sans cursor-pointer inline-flex items-center gap-1"
                              >
                                Explore EHR <ArrowRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                  <button onClick={() => setActiveMenu('PatientIndex')} className="text-xs font-bold text-[#059669] hover:underline cursor-pointer">
                    View full patient directory &rarr;
                  </button>
                </div>
              </div>

              {/* Chart Assembly Queue panel widget (Right) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Chart Assembly Queue</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">EHR assembly and quantitative sheet analysis</span>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 mb-4 flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">18 Charts in Assembly</span>
                      <span className="block text-[9.5px] text-slate-500 font-mono">Next up: Robert Wilson (HIS-5050)</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 border border-slate-100 bg-white hover:bg-slate-50 transitionrounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        <span className="font-semibold text-slate-700">Awaiting Documents</span>
                      </div>
                      <span className="font-mono text-[10.5px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded-lg">8 charts</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 border border-slate-100 bg-white hover:bg-slate-50 transitionrounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="font-semibold text-slate-700">In Assembly</span>
                      </div>
                      <span className="font-mono text-[10.5px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded-lg">6 charts</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 border border-slate-100 bg-white hover:bg-slate-50 transitionrounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-slate-700">Ready for Review</span>
                      </div>
                      <span className="font-mono text-[10.5px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded-lg">4 charts</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                  <button onClick={() => setActiveMenu('ChartAssembly')} className="text-xs font-bold text-[#059669] hover:underline cursor-pointer">
                    View full assembly queue &rarr;
                  </button>
                </div>
              </div>
            </div>            {/* Document Management & Archival Summary */}
            <div className="grid grid-cols-1 gap-6">
              {/* Document Management */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Document Management &amp; Archival Status</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Indexing and scanning verification status for digital charts</span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                    <div className="flex items-center justify-between border-b pb-2 md:border-b-0 md:pb-0 md:border-r md:pr-4 border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-105 bg-slate-50 text-slate-605 rounded-lg border">
                          <FileText size={15} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Scanned Documents</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-slate-800">1,248</span>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2 md:border-b-0 md:pb-0 md:border-r md:pr-4 border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                          <CheckCircle size={15} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Indexed &amp; Audited</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#059669]">1,126</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-red-50 text-red-800 rounded-lg border border-red-100">
                          <AlertTriangle size={15} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Requires Attention / Rejected</span>
                      </div>
                      <span className="font-mono text-base font-semibold text-[#ef4444] bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">12</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 text-center mt-4">
                  <button onClick={() => setActiveMenu('DocumentManagement')} className="text-xs font-bold text-[#059669] hover:underline cursor-pointer">
                    Manage department documents &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed Timeline */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Recent Activity Feed</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Latest master health record operations</span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative pl-6 border-l-2 border-emerald-350">
                      <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-505 bg-[#10b981] border-2 border-white ring-4 ring-emerald-50"></span>
                      <span className="block font-mono text-[9.5px] text-slate-400">09:15 AM</span>
                      <span className="block text-xs font-semibold text-slate-800">Identity verified</span>
                      <span className="block text-[11px] text-slate-500 leading-tight">Patient EHR signature successfully match validated against biometrics</span>
                    </div>

                    <div className="relative pl-6 border-l-2 border-emerald-350">
                      <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-[#10b981] border-2 border-white ring-4 ring-emerald-50"></span>
                      <span className="block font-mono text-[9.5px] text-slate-400">09:02 AM</span>
                      <span className="block text-xs font-semibold text-slate-800">Chart assembled successfully</span>
                      <span className="block text-[11px] text-slate-500 leading-tight">Mary Smith (HIS-2034) processed in compliance</span>
                    </div>

                    <div className="relative pl-6 border-l-2 border-blue-350">
                      <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50"></span>
                      <span className="block font-mono text-[9.5px] text-slate-400">08:45 AM</span>
                      <span className="block text-xs font-semibold text-slate-800">Biometric Template Registered</span>
                      <span className="block text-[11px] text-slate-500 leading-tight">Durable biometric template linked securely on registration</span>
                    </div>

                    <div className="relative pl-6">
                      <span className="absolute -left-1 top-0.5 w-2 h-2 rounded-full bg-slate-400"></span>
                      <span className="block font-mono text-[9.5px] text-slate-400">08:30 AM</span>
                      <span className="block text-xs font-semibold text-slate-700">Document indexed in system</span>
                      <span className="block text-[11px] text-slate-500 leading-tight">Radiology Report — Linda Johnson</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Alerts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Important Alerts Pane */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left">
                <h3 className="font-bold text-slate-900 text-sm mb-0.5">Important Compliance Alerts</h3>
                <span className="block text-[10.5px] text-slate-400 font-mono mb-4">EHR operational blocks in real-time</span>

                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="text-red-700 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-red-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>3 files lacking contact details</span>
                        <span className="text-[10px] text-red-500 font-mono">20 min ago</span>
                      </div>
                      <p className="text-red-600 mt-1 leading-snug">Missing contact numbers on registration forms. Contact clinics directly to collect missing fields.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="text-amber-800 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-amber-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>23 documents pending quality checks</span>
                        <span className="text-[10px] text-amber-500 font-mono">35 min ago</span>
                      </div>
                      <p className="text-amber-700 mt-1 leading-snug">Ensure timely indexing and diagnostic medical codes match primary physicians' file data.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <Clock className="text-slate-600 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-slate-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>5 charts require completion</span>
                        <span className="text-[10px] text-slate-500 font-mono">1 hr ago</span>
                      </div>
                      <p className="text-slate-500 mt-1 leading-snug">Missing documents and discharge papers need to be aggregated. Assemble chart queue.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Quick Department Actions</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Launch standard Health Information workflows</span>

                  <div className="grid grid-cols-2 gap-3" id="him-quick-actions-grid">
                    <button
                      onClick={() => setActiveMenu('Registration')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 text-slate-700 rounded-xl flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <UserPlus size={16} className="text-[#10b981] group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Register Patient File</div>
                    </button>

                    <button
                      onClick={() => setActiveMenu('DocumentManagement')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 text-slate-700 rounded-xl flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <Upload size={16} className="text-sky-600 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Scan &amp; Upload Document</div>
                    </button>

                    <button
                      onClick={() => { setActiveMenu('ChartAssembly'); setMobileMenuOpen(false); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 text-slate-700 rounded-xl flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <Layers size={16} className="text-violet-600 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Assemble Patient Chart</div>
                    </button>

                    <button
                      onClick={() => setActiveMenu('PatientIndex')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 text-slate-700 rounded-xl flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <UserCheck size={16} className="text-indigo-600 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Verify Patient Identity</div>
                    </button>
                  </div>
                </div>

                <div className="text-center border-t border-slate-100 pt-3 mt-4 text-[10.5px] text-slate-400 font-mono">
                  All transactions audited by ATIF Host Agent
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================== SUBPAGES ========================== */}

        {/* Registration form */}
        {activeMenu === 'Registration' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="him-pane-registration">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 text-[#047857] rounded-xl border border-emerald-100">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Patient Registration Portal</h2>
                <span className="text-xs text-slate-400 font-mono">Create a durable electronic health record file securely (MPI integrated)</span>
              </div>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Fitzgerald Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">DOB *</label>
                    <input
                      type="date"
                      required
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Biological Gender</label>
                    <select
                      value={regGender}
                      onChange={(e: any) => setRegGender(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Telephone Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 0192"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-slate-700 block">Residential Address</label>
                  <input
                    type="text"
                    placeholder="123 Clinical Way, Apt 4B, Metro Hospital"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Emergency Contact Name &amp; Phone</label>
                  <input
                    type="text"
                    placeholder="Jane Doe (Spouse) +1 (555) 0122"
                    value={regEmergency}
                    onChange={(e) => setRegEmergency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Allergies (comma-separated list)</label>
                  <input
                    type="text"
                    placeholder="Penicillin, Peanuts, Latex"
                    value={regAllergies}
                    onChange={(e) => setRegAllergies(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none"
                  />
                </div>
              </div>

              {/* Patient Attributes flags (Sensitive/VIP record tracking) */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono">Sensitive Integrity Flagging (ATIF Core Engine)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={regIsVip}
                      onChange={(e) => setRegIsVip(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-700 block">Flag as Sensitive / VIP Patient Record</span>
                      <span className="text-[10px] text-slate-500">Raises real-time alarms on unauthorized clinician views of high-profile entities.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={regIsStaff}
                      onChange={(e) => setRegIsStaff(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-700 block">Flag as Hospital Employee Record</span>
                      <span className="text-[10px] text-slate-500">Maintains strict confidentiality limits and insider conflict screening.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveMenu('Dashboard')}
                  className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <UserPlus size={14} />}
                  Sign &amp; File Patient EHR
                </button>
              </div>
            </form>
          </div>
        )}
      
        {/* Chart Assembly Queue */}
        {activeMenu === 'ChartAssembly' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="him-pane-assembly">
            <h2 className="text-base font-bold text-slate-900 mb-1">EHR Quantitative Chart Assembly Tracker</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Aggregate primary physician notes, clinical assessments, discharge digests, and lab data</span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-150 text-xs">
                <span className="font-bold text-slate-800 block border-b pb-2 mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Awaiting Documents (8 Charts)
                </span>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/60 transition">
                    <span className="font-mono font-bold text-slate-800 block">Robert Wilson (HIS-5050)</span>
                    <span className="text-[10px] text-red-600 block mt-1">Missing: Discharge Note</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/60 transition">
                    <span className="font-mono font-bold text-slate-800 block">Linda Johnson (HIS-4042)</span>
                    <span className="text-[10px] text-amber-600 block mt-1">Pending: MRI Consent</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-150 text-xs">
                <span className="font-bold text-slate-800 block border-b pb-2 mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  In Assembly (6 Charts)
                </span>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/60 transition">
                    <span className="font-mono font-bold text-slate-800 block">Mary Smith (HIS-2034)</span>
                    <span className="text-slate-500 block text-[10px] mt-1">Status: Consolidating PDF indexes</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-150 text-xs">
                <span className="font-bold text-slate-[#047857] block border-b pb-2 mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  Ready for Review (4 Charts)
                </span>
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl hover:bg-emerald-100/50 transition">
                    <span className="font-mono font-bold text-emerald-900 block">John Doe (HIS-1001)</span>
                    <span className="text-emerald-700 block text-[10px] mt-1">Ready for compliance supervisor signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Index */}
        {activeMenu === 'PatientIndex' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-5xl mx-auto" id="him-pane-index">
            <h2 className="text-base font-bold text-slate-900 mb-1">Master Patient Index (MPI) Repository</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Verify biological identity metrics, address matches, and clinical flags</span>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-mono uppercase bg-slate-50">
                      <th className="py-3 px-3">EHR ID</th>
                      <th className="py-3 px-3">Full Name</th>
                      <th className="py-3 px-3">Date of Birth</th>
                      <th className="py-3 px-3">Primary Phone</th>
                      <th className="py-3 px-3">Status Flags</th>
                      <th className="py-3 px-3 text-right">Integrity Audit</th>
                      <th className="py-3 px-3 text-right">Explore EHR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredPatients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{pat.id}</td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 hover:underline">
                          <button onClick={() => onOpenPatientFile(pat.id)} className="text-sky-700 font-bold">
                            {pat.fullName}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 font-mono">{pat.dob}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-500">{pat.phone}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex gap-1">
                            {pat.isVip && (
                              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold rounded text-[9px]">VIP</span>
                            )}
                            {pat.isStaff && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold rounded text-[9px]">STAFF</span>
                            )}
                            <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 font-mono text-[9px] rounded font-bold uppercase">{pat.status}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {verifiedPatientIds.includes(pat.id) ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] text-[#047857] font-bold bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-lg">
                              <CheckCircle size={12} /> Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyIdentity(pat.id)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition text-[10.5px] cursor-pointer"
                            >
                              Verify Identity
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => onOpenPatientFile(pat.id)}
                            className="text-[#0284C7] hover:underline text-xs font-bold font-sans cursor-pointer inline-flex items-center gap-1"
                          >
                            Explore EHR <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Document Management Scanning */}
        {activeMenu === 'DocumentManagement' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="him-pane-document-scan">
            <h2 className="text-base font-bold text-slate-900 mb-1">EHR Document Scanning &amp; Index Portal</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Secure physical papers into patient archives</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form simulator */}
              <div className="p-5 border rounded-2xl">
                <span className="block font-bold text-slate-800 text-xs mb-3">Initiate Document Scan</span>
                <form onSubmit={handleScanDocument} className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-650 block">Select Patient Archive *</label>
                    <select className="w-full px-3.5 py-2 border rounded-xl bg-white text-xs">
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.id} - {p.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-650 block">Document Name (Placeholder) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Consent_Immunology_Form"
                      value={tempFile}
                      onChange={(e) => setTempFile(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 text-center text-xs text-slate-450 cursor-pointer">
                    <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                    <span>Drag and drop signed clinical sheets here</span>
                    <span className="block font-mono text-[9.5px] text-slate-400 mt-1">PDF, TIFF, JPEG up to 15 MB</span>
                  </div>

                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs cursor-pointer">
                    Scan, Index &amp; Store (EHR Sync)
                  </button>
                </form>
              </div>

              {/* Scanned files history */}
              <div>
                <span className="block font-bold text-slate-800 text-xs mb-3">Indexed Documents (This Shift)</span>
                <div className="space-y-2.5">
                  {scannedFileList.map((file, i) => (
                    <div key={i} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-white hover:bg-slate-50/70 transition">
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-emerald-600" />
                        <div>
                          <span className="font-semibold text-slate-800 block">{file.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-mono">{file.size} • Uploaded {file.date}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-mono text-[9px] rounded font-bold">INDEXED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Identity Verification Workstation Checklist Modal */}
        {verifyingPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-emerald-600" size={18} />
                  <span className="font-bold text-slate-800 text-sm font-sans">Identity Certification Workstation</span>
                </div>
                <button 
                  onClick={() => setVerifyingPatient(null)} 
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-emerald-50/55 border border-emerald-100 rounded-xl p-3 flex gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 font-bold font-mono text-sm shrink-0 uppercase">
                    {verifyingPatient.fullName.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-sans">{verifyingPatient.fullName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      EHR ID: <span className="font-bold text-slate-700">{verifyingPatient.id}</span> • DOB: {verifyingPatient.dob}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Phone Contact: {verifyingPatient.phone}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Mandatory Integrity Verification Audits
                  </label>
                  
                  {/* Audit Item 1 */}
                  <label className="flex gap-3 items-start p-3 border border-slate-150 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={idMatchChecked} 
                      onChange={(e) => setIdMatchChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" 
                    />
                    <div className="text-xs font-sans">
                      <p className="font-semibold text-slate-800">Verify Government Photo ID</p>
                      <p className="text-slate-400 text-[10px] leading-snug mt-0.5">
                        Matched physical or digital driver's license/passport face with patient's appearance and recorded name.
                      </p>
                    </div>
                  </label>

                  {/* Audit Item 2 */}
                  <label className="flex gap-3 items-start p-3 border border-slate-150 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={biometricMatchChecked} 
                      onChange={(e) => setBiometricMatchChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" 
                    />
                    <div className="text-xs font-sans">
                      <p className="font-semibold text-slate-800">Biometric Palm/Fingerprint Authentication</p>
                      <p className="text-slate-400 text-[10px] leading-snug mt-0.5">
                        Patient completed active biometric signature or physical touchless palm scan on workstation matching local register.
                      </p>
                    </div>
                  </label>

                  {/* Audit Item 3 */}
                  <label className="flex gap-3 items-start p-3 border border-slate-150 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      checked={contactVerifiedChecked} 
                      onChange={(e) => setContactVerifiedChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" 
                    />
                    <div className="text-xs font-sans">
                      <p className="font-semibold text-slate-800">EHR Demographics Alignment</p>
                      <p className="text-slate-400 text-[10px] leading-snug mt-0.5">
                        Confirmed physical address, clinical emergency contact, and drug/food allergies verbally with patient.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  onClick={() => setVerifyingPatient(null)} 
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmVerification}
                  disabled={!(idMatchChecked && biometricMatchChecked && contactVerifiedChecked)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 ${
                    (idMatchChecked && biometricMatchChecked && contactVerifiedChecked) 
                      ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck size={14} /> Certify &amp; Verify Identity
                </button>
              </div>
            </div>
          </div>
        )}



        {/* ========================== FOOTER BRAND ========================== */}
        <footer className="mt-8 border-t border-slate-200/70 pt-4 flex flex-col md:flex-row justify-between items-center text-[10.5px] text-slate-450 font-mono" id="him-footer">
          <div className="flex items-center gap-1">
            <Shield className="text-[#10b981]" size={12} />
            <span>Operational auditing verified by ATIF Host Agent</span>
          </div>
          <span className="mt-2 md:mt-0">&copy; 2026 St. Jude Medical System • Version 4.4.0-ATIF</span>
        </footer>
      </main>
    </div>
  );
}
