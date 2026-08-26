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
  FileSpreadsheet, Activity, Image as ImageIcon, Send, Sliders, Dna, FileEdit,
  Heart, Zap, Sparkles, Filter, ChevronDown, CheckSquare, Info, Menu
} from 'lucide-react';
import { Patient, RadiologyRequest, RadStatus, SecurityEvent } from '../types';

interface RadiologyDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function RadiologyDashboardView({
  currentUser,
  patients,
  onRefresh,
  onOpenPatientFile,
  onShowNotification
}: RadiologyDashboardViewProps) {
  // Navigation tabs or active menus
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'Total 4 critical imaging alert flags indexed inside active folder.', time: '09:20 AM', read: false },
    { id: '2', text: 'PACS automated DICOM integrity verification completed.', time: '09:12 AM', read: false },
    { id: '3', text: 'Contrast medium safe supply certificate updated on server.', time: '08:45 AM', read: true },
    { id: '4', text: 'Urgent CT request issued by ER doctor for suspected pulmonary embolism.', time: '08:15 AM', read: false },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // State lists
  const [realRadRequests, setRealRadRequests] = useState<RadiologyRequest[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);
  const [requestTab, setRequestTab] = useState<string>('All');
  
  // Editing Radiology reports
  const [selectedReq, setSelectedReq] = useState<RadiologyRequest | null>(null);
  const [reportText, setReportText] = useState<string>('');
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);

  // PACS simulation acquisition state
  const [uploadedImagesList, setUploadedImagesList] = useState<Array<{ name: string; type: string; date: string }>>([
    { name: "PA_CHEST_RAD2001.dicom", type: "X-Ray PA View", date: "09:05 AM" },
    { name: "MRI_BRAIN_SAG_RAD2002.dicom", type: "MRI T1/T2 Weighted", date: "08:44 AM" }
  ]);
  const [pacsUploadName, setPacsUploadName] = useState<string>('');

  // Critical Finding Form state
  const [criticalPatientId, setCriticalPatientId] = useState<string>('');
  const [criticalExamType, setCriticalExamType] = useState<string>('CT Brain');
  const [criticalDetails, setCriticalDetails] = useState<string>('Suspected acute intracranial hemorrhage');

  const [criticalFindingsFeed, setCriticalFindingsFeed] = useState([
    { exam: "CT Brain", patient: "John Doe (HIS-1001)", finding: "Suspected Hemorrhage", time: "09:15 AM" },
    { exam: "X-Ray Chest", patient: "Mary Smith (HIS-2034)", finding: "Tension Pneumothorax", time: "08:50 AM" },
    { exam: "MRI Spine", patient: "James Brown (HIS-3045)", finding: "Severe Spinal Stenosis", time: "08:35 AM" }
  ]);

  // Fetch real radiology requests from backend
  const fetchRadRequests = () => {
    fetch('/api/radiology/requests')
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
          setRealRadRequests(data.requests || []);
        }
      })
      .catch(err => console.warn("Error fetching rad requests (handled):", err));
  };

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
      .catch(err => console.warn("Error fetching telemetry logs (handled):", err));
  };

  useEffect(() => {
    fetchRadRequests();
    fetchSecurityLogs();
    const interval = setInterval(() => {
      fetchRadRequests();
      fetchSecurityLogs();
    }, 8500);
    return () => clearInterval(interval);
  }, []);

  // Sync search patients
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPatients(patients);
    } else {
      const q = searchQuery.toLowerCase();
      const matched = patients.filter(
        p => p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
      setFilteredPatients(matched);
    }
  }, [searchQuery, patients]);

  // Mock table fallback is matched when backend is unpopulated
  const [mockRadRequests, setMockRadRequests] = useState([
    { id: "IMG-2025-2001", patient: "John Doe (HIS-1001)", patientId: "HIS-1001", exam: "CT Brain", priority: "High", status: "New", requested: "09:20 AM" },
    { id: "IMG-2025-2002", patient: "Mary Smith (HIS-2034)", patientId: "HIS-2034", exam: "X-Ray Chest", priority: "Normal", status: "In Progress", requested: "09:05 AM" },
    { id: "IMG-2025-2003", patient: "James Brown (HIS-3045)", patientId: "HIS-3045", exam: "Ultrasound Abdomen", priority: "High", status: "New", requested: "08:55 AM" },
    { id: "IMG-2025-2004", patient: "Linda Johnson (HIS-4042)", patientId: "HIS-4042", exam: "MRI Knee", priority: "Normal", status: "In Progress", requested: "08:40 AM" },
    { id: "IMG-2025-2005", patient: "Robert Wilson (HIS-5050)", patientId: "HIS-5050", exam: "CT Abdomen", priority: "High", status: "New", requested: "08:30 AM" }
  ]);

  // Merge backend requests with visual mock items for premium look
  const getDisplayRequests = () => {
    const displayList = [...mockRadRequests];
    // inject any backend ones not matching ID
    realRadRequests.forEach(req => {
      if (!displayList.some(d => d.id === req.id || d.patientId === req.patientId)) {
        const pObj = patients.find(p => p.id === req.patientId);
        displayList.push({
          id: req.id,
          patient: pObj ? `${pObj.fullName} (${pObj.id})` : `Patient (${req.patientId})`,
          patientId: req.patientId,
          exam: req.imagingType,
          priority: req.imagingType.toLowerCase().includes('brain') || req.imagingType.toLowerCase().includes('ct') ? 'High' : 'Normal',
          status: req.status === RadStatus.PENDING ? 'New' : req.status === RadStatus.SCANNING ? 'In Progress' : 'Completed',
          requested: req.orderedDate || "Today"
        });
      }
    });

    return displayList.filter(item => {
      if (requestTab === 'All') return true;
      return item.status.toLowerCase() === requestTab.toLowerCase() ||
             (requestTab === 'In Progress' && item.status === 'In Progress');
    });
  };

  const handleOpenReportEditor = (req: any) => {
    // Find matching real request on backend if possible
    const match = realRadRequests.find(r => r.id === req.id) || {
      id: req.id,
      patientId: req.patientId,
      imagingType: req.exam,
      status: RadStatus.PENDING,
      orderedBy: "EHR Default",
      orderedDate: req.requested
    } as any;
    
    setSelectedReq(match);
    setReportText(match.reportText || `INDICATION: Patient presenting with clinical symptoms. Evaluation requested.\n\nCOMPARISON: None.\n\nFINDINGS: Visualized structures appear normal within diagnostic limits. No acute focal lesions or high-contrast structural abnormalities detected.\n\nIMPRESSION: Routine examination within expected pathological boundaries.`);
    setActiveMenu('Reporting');
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setIsSavingReport(true);
    try {
      // POST order if it does not exist on backend (fallback compliance)
      const resCheck = await fetch(`/api/radiology/requests`);
      const bodyCheck = await resCheck.json();
      const loadedList = bodyCheck.requests || [];
      const exists = loadedList.some((r: any) => r.id === selectedReq.id);

      if (!exists) {
        // create on backend first
        await fetch('/api/radiology/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: selectedReq.patientId, imagingType: selectedReq.imagingType })
        });
      }

      // now release result
      const res = await fetch(`/api/radiology/requests/${selectedReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: RadStatus.COMPLETED,
          reportText: reportText,
          imageUrl: "https://images.unsplash.com/photo-1559828605-ff31bf1bb6cc?w=400&q=80"
        })
      });

      if (res.ok) {
        onShowNotification(`Radiology diagnostics release compiled for ${selectedReq.id}. Report signed.`);
        // update mock list state
        setMockRadRequests(mockRadRequests.map(r => r.id === selectedReq.id ? { ...r, status: 'Completed' } : r));
        setSelectedReq(null);
        setReportText('');
        fetchRadRequests();
        setActiveMenu('Dashboard');
      } else {
        onShowNotification("Could not write sign-off reports on server.");
      }
    } catch (err) {
      console.error(err);
      onShowNotification("Failed to write sign-off reports on server.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleAddCriticalFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criticalPatientId || !criticalDetails) {
      onShowNotification("Specify matching Patient and Critical Finding detail.");
      return;
    }
    const matchPat = patients.find(p => p.id === criticalPatientId);
    const label = matchPat ? `${matchPat.fullName} (${matchPat.id})` : `EHR Patient (${criticalPatientId})`;
    
    // add to feed
    setCriticalFindingsFeed([
      { exam: criticalExamType, patient: label, finding: criticalDetails, time: "Just now" },
      ...criticalFindingsFeed
    ]);

    setCriticalPatientId('');
    setCriticalDetails('');
    onShowNotification(`Critical Pathology Finding flagged and logged with red-banner warnings.`);
  };

  const handleUploadPACS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacsUploadName) return;
    const newPacs = {
      name: `${pacsUploadName.replace(/[^a-zA-Z0-9_.-]/g, "_")}.dicom`,
      type: "PACS Imaging Acquisition",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setUploadedImagesList([newPacs, ...uploadedImagesList]);
    setPacsUploadName('');
    onShowNotification(`PACS Image successfully uploaded to core DICOM node: ${newPacs.name}`);
  };

  const handleResetRequest = (id: string) => {
    setMockRadRequests(mockRadRequests.map(r => r.id === id ? { ...r, status: 'In Progress' } : r));
    onShowNotification(`Exam status for ${id} moved to processing worklist.`);
  };

  return (
    <div className="flex bg-[#f8fafc] text-slate-700 min-h-[calc(100vh-6rem)] -m-6 relative font-sans leading-relaxed" id="radiology-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================== LIS/PACS NAVIGATION SIDEBAR ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="radiology-sidebar">
        <div className="p-5 flex-1">
          {/* Section Identifier */}
          <div className="flex items-center justify-between gap-2.5 mb-6">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="text-sky-600 animate-pulse" size={20} fill="currentColor" />
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#0284c7] font-bold block">Hospital Unit</span>
                <span className="text-slate-800 font-bold text-sm tracking-tight block">PACS Imaging - RIS</span>
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

          <nav className="space-y-1.5" id="radiology-navigation-list">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 pl-3">Central Queue</span>

            <button
              onClick={() => { setActiveMenu('Dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Dashboard' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <Activity size={15} /> Primary Dashboard
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('ImagingRequests'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'ImagingRequests' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <Sliders size={15} /> Imaging Requests
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 bg-sky-600 text-white font-bold font-mono rounded-full">32</span>
            </button>

            <button
              onClick={() => { setActiveMenu('Worklist'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Worklist' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Calendar size={15} /> Daily Worklist
            </button>

            <button
              onClick={() => { setActiveMenu('PACS'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'PACS' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <ImageIcon size={15} /> Image Acquisition (PACS)
            </button>

            <button
              onClick={() => { setActiveMenu('ReportingPanel'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'ReportingPanel' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <FileEdit size={15} /> Reporting Queue
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 bg-amber-500 text-white font-bold font-mono rounded-full">14</span>
            </button>

            <button
              onClick={() => { setActiveMenu('PeerReview'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'PeerReview' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <UserCheck size={15} /> Peer Review
            </button>

            <button
              onClick={() => { setActiveMenu('CriticalFindings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'CriticalFindings' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <AlertTriangle size={15} /> Critical Findings
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 bg-red-650 bg-red-600 text-white font-bold font-mono rounded-full">3</span>
            </button>

            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 pt-4 mb-2 pl-3">EHR Operations</span>

            <button
              onClick={() => { setActiveMenu('PatientSearch'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'PatientSearch' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Users size={15} /> Global Patients
            </button>

            <button
              onClick={() => { setActiveMenu('Analytics'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Analytics' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <BarChart3 size={15} /> RIS Analytics
            </button>

            <button
              onClick={() => { setActiveMenu('Telemetry'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Telemetry' ? 'bg-sky-50 text-sky-700 border-sky-200 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <ShieldCheck size={15} fill="currentColor" /> ATIF Audit Logs
            </button>
          </nav>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#0284c7] font-bold">
            <ShieldCheck size={12} fill="currentColor" />
            <span>Cyber-Locked LIS Node</span>
          </div>
          <span className="block text-[10px] text-slate-500 font-mono">Workstation: RAD-PHAR-04</span>
          <span className="block text-[10px] text-slate-400 font-mono">Operator ID: @michaellee</span>
        </div>
      </aside>

      {/* ========================== MAIN SCROLLABLE CONTENT ========================== */}
      <main className="flex-1 overflow-y-auto p-6 text-left" id="radiology-main-pane">
        
        {/* ========================== HEADER ========================== */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" id="rad-header">
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
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Radiology Officer Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 text-xs">Good morning, Radiology Officer Michael Lee</span>
                <span className="px-1.5 py-0.2 bg-sky-105 bg-sky-100 text-sky-800 rounded font-mono text-[9px] font-bold flex items-center gap-1">
                  <CheckCircle size={10} fill="currentColor" /> VERIFIED CREDENTIALS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* PACS/RAD Search bar */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search patient, modality, scan ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-[#0284c7] outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Notifications icon */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer relative block"
                title="System Notifications"
              >
                <Bell size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center">
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
                          onShowNotification("All radiology notifications marked as read.");
                        }} 
                        className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
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
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-sky-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
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

            {/* Profile badge style */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                ML
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800">Michael Lee</div>
                <div className="text-slate-500 font-mono text-[9.5px]">Radiology Officer • Shift: Day</div>
              </div>
            </div>
          </div>
        </header>

        {/* ========================== MAIN ROUTER VIEW ========================== */}

        {activeMenu === 'Dashboard' && (
          <div className="space-y-6" id="rad-central-dashboard">
            {/* KPI Cards (Matches image specs) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="rad-kpi-grid">
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Today's Exams</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">68</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +8 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Completed Exams</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">52</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +6 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Reports Finalized</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">40</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +5 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-red-200 bg-red-50/15 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-red-500 font-bold">Urgent Exams</span>
                <span className="block text-2xl font-bold text-red-700 mt-1 font-sans">7</span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-bold font-mono inline-block mt-1">
                  Requires attention
                </span>
              </div>

              <div className="p-4 bg-white border border-red-200 bg-red-50/15 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-red-500 font-bold">Overdue Reports</span>
                <span className="block text-2xl font-bold text-red-700 mt-1 font-sans">5</span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-bold font-mono inline-block mt-1">
                  Over TAT LIMIT
                </span>
              </div>
            </div>

            {/* Main Interactive Table: Imaging Requests Queue */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Imaging Requests Queue</h3>
                  <span className="text-[10.5px] text-slate-400 font-mono">DICOMPACS unified operational scheduling</span>
                </div>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  {['All', 'New', 'In Progress', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRequestTab(tab)}
                      className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${requestTab === tab ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 uppercase text-[9.5px] font-mono bg-slate-50/40">
                      <th className="py-2.5 px-3">Request ID</th>
                      <th className="py-2.5 px-2">Patient Profile</th>
                      <th className="py-2.5 px-2">Exam Modality</th>
                      <th className="py-2.5 px-2">Priority</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-right">Requested Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {getDisplayRequests().map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <ImageIcon size={12} className="text-sky-600" />
                          {req.id}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => {
                              onOpenPatientFile(req.patientId);
                              onShowNotification(`Viewing patient context ${req.patientId}.`);
                            }}
                            className="text-sky-700 font-bold hover:underline"
                          >
                            {req.patient}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-slate-700 font-medium">{req.exam}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            req.priority === 'High' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-650'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            req.status === 'New' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                            req.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-650'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-mono text-slate-450">
                            <span>{req.requested}</span>
                            {req.status !== 'Completed' ? (
                              <button
                                onClick={() => handleOpenReportEditor(req)}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                              >
                                {req.status === 'New' ? 'Acquire & Scan' : 'Draft Report'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResetRequest(req.id)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-650 font-bold rounded-lg text-[10px] border border-slate-200 transition"
                              >
                                Re-Scan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modality Worklist, Critical Reports, Reporting Queue status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Modality Worklist (Left) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Modality Worklist</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">EHR active scan scheduling modality loads</span>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-transparent">
                      <thead>
                        <tr className="text-slate-400 font-mono border-b uppercase text-[9.5px]">
                          <th className="pb-1.5">Modality</th>
                          <th className="pb-1.5">Today's Exams</th>
                          <th className="pb-1.5">In Progress</th>
                          <th className="pb-1.5">Completed</th>
                          <th className="pb-1.5 text-right">Utilization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-mono font-bold">
                        {[
                          { name: 'CT Scan', today: 18, progress: 7, completed: 13, util: '78%' },
                          { name: 'MRI Core', today: 10, progress: 3, completed: 7, util: '69%' },
                          { name: 'X-Ray PA', today: 22, progress: 8, completed: 14, util: '72%' },
                          { name: 'Ultrasound', today: 12, progress: 4, completed: 8, util: '68%' },
                          { name: 'Fluoroscopy', today: 6, progress: 2, completed: 4, util: '60%' }
                        ].map((mod, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 text-slate-700 font-semibold font-sans">{mod.name}</td>
                            <td className="py-2 text-slate-900">{mod.today}</td>
                            <td className="py-2 text-amber-600">{mod.progress}</td>
                            <td className="py-2 text-emerald-700">{mod.completed}</td>
                            <td className="py-2 text-right text-[#0284c7]">{mod.util}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                  <button onClick={() => setActiveMenu('Analytics')} className="text-xs font-bold text-[#0284c7] hover:underline">
                    View modality utilization report &rarr;
                  </button>
                </div>
              </div>

              {/* Critical Findings Panel (Center) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm">Critical findings alert center</h3>
                    <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[9px] font-bold rounded">RIS EMERGENCY</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">Direct critical clinician path alerts</span>

                  <div className="space-y-2 text-xs">
                    {criticalFindingsFeed.slice(0, 3).map((crit, i) => (
                      <div key={i} className="p-2.5 bg-red-50/30 border border-red-100 hover:bg-red-50/65 transition rounded-xl flex items-start gap-2">
                        <AlertCircle className="text-red-650 shrink-0 mt-0.5" size={14} />
                        <div>
                          <div className="font-bold text-[#1e293b] flex items-center justify-between gap-1 w-full flex-wrap sm:flex-nowrap">
                            <span>{crit.exam} — {crit.patient}</span>
                            <span className="font-mono text-[9px] text-slate-400">{crit.time}</span>
                          </div>
                          <p className="text-red-700 text-[11px] mt-0.5 leading-snug">{crit.finding}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                  <button onClick={() => setActiveMenu('CriticalFindings')} className="text-xs font-bold text-sky-700 hover:underline">
                    Manage critical findings alert loops &rarr;
                  </button>
                </div>
              </div>

              {/* Reporting queue metrics (Right) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Reporting Queue Overview</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">EHR sign-off workflow distribution</span>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-slate-500" />
                        <span className="font-medium text-slate-700">Draft Reports pending</span>
                      </div>
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-lg">14 drafts</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-sky-650" />
                        <span className="font-medium text-slate-700">Awaiting Peer Review</span>
                      </div>
                      <span className="font-mono font-extrabold text-slate-900 bg-sky-100 px-2 py-0.5 rounded-lg">6 reviews</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-600" />
                        <span className="font-medium text-slate-700">Pending Final Signatures</span>
                      </div>
                      <span className="font-mono font-extrabold text-slate-900 bg-emerald-100 px-2 py-0.5 rounded-lg">8 pending</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                  <button onClick={() => setActiveMenu('ReportingPanel')} className="text-xs font-bold text-sky-700 hover:underline cursor-pointer">
                    Open reporting queue &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Completed Exams, Exam Turnaround Analytics, Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Completed Exams List */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Recent Completed Exams</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">Completed diagnostics compiled for physician evaluation</span>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-transparent">
                      <thead>
                        <tr className="text-slate-400 border-b font-mono uppercase text-[9.5px]">
                          <th className="pb-1.5">Patient Reference</th>
                          <th className="pb-1.5">Exam Modality</th>
                          <th className="pb-1.5">Completed At</th>
                          <th className="pb-1.5">Reported By</th>
                          <th className="pb-1.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-sans">
                        {[
                          { pat: "John Doe (HIS-1001)", exam: "CT Brain", time: "09:00 AM", doc: "Dr. Lee", tag: "Reported" },
                          { pat: "Mary Smith (HIS-2034)", exam: "X-Ray Chest", time: "08:45 AM", doc: "Dr. Lee", tag: "Reported" },
                          { pat: "James Brown (HIS-3045)", exam: "US Abdomen", time: "08:30 AM", doc: "Dr. Patel", tag: "Reported" },
                          { pat: "Linda Johnson (HIS-4042)", exam: "MRI Knee", time: "08:20 AM", doc: "Dr. Patel", tag: "Reported" },
                          { pat: "Robert Wilson (HIS-5050)", exam: "CT Abdomen", time: "08:10 AM", doc: "Dr. Lee", tag: "Reported" }
                        ].map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 font-mono font-medium text-slate-700">{item.pat}</td>
                            <td className="py-2 text-slate-800 font-medium">{item.exam}</td>
                            <td className="py-2 font-mono text-slate-500">{item.time}</td>
                            <td className="py-2 text-slate-500">{item.doc}</td>
                            <td className="py-2 text-right">
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-mono text-[9px] rounded font-bold uppercase">Reported</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                  <button onClick={() => onShowNotification('Full list of historical completed radiology exams with reports exports loaded.')} className="text-xs font-bold text-sky-700 hover:underline">
                    View all completed radiology exams &rarr;
                  </button>
                </div>
              </div>

              {/* Turnaround Analytics Svg panel */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Exam Turnaround metrics (Today)</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">Urgent stroke, vascular &amp; cardiovascular TAT logs</span>

                  <div className="grid grid-cols-3 gap-2 border-b pb-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[10px] font-mono text-slate-400 uppercase">Average TAT</span>
                      <span className="block text-base font-bold text-slate-900 mt-1">1h 24m</span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">&darr; 10m from yesterday</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[10px] font-mono text-slate-400 uppercase">TAT Compliance</span>
                      <span className="block text-base font-bold text-slate-900 mt-1">92%</span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">&uarr; 3% from yesterday</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[10px] font-mono text-slate-400 uppercase">Peer Review Rate</span>
                      <span className="block text-base font-bold text-slate-900 mt-1">88%</span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">&uarr; 6% from yesterday</span>
                    </div>
                  </div>

                  {/* Svg line visualization */}
                  <div className="w-full h-24 bg-slate-50/50 rounded-xl border p-2 relative flex flex-col justify-between">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Exams scheduled vs TAT</span>
                      <span>02:00 PM peak</span>
                    </div>
                    <svg className="w-full h-12 overflow-visible">
                      {/* Svg line representing exams utilization */}
                      <path d="M0,35 Q10,20 20,40 T40,15 T60,5 T80,30 T100,5 T120,40 T140,10 T160,25 T180,30 T200,5" fill="none" stroke="#0284c7" strokeWidth="2" className="w-full" style={{ width: '100%' }} />
                      {/* Grid representation */}
                      <line x1="0" y1="24" x2="400" y2="24" stroke="#e2e8f0" strokeDasharray="2" />
                    </svg>
                    <span className="text-[8.5px] font-mono text-slate-400 text-center">RIS turnaround indices stabilized</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                  <button onClick={() => setActiveMenu('Analytics')} className="text-xs font-bold text-sky-700 hover:underline">
                    View detailed clinical LIS analytics &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions & Important Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions checklist style */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Quick Department Actions</h3>
                  <span className="block text-[10px] text-slate-400 font-mono mb-4">Command loops of the clinical PACS interface</span>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveMenu('CriticalFindings')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 rounded-xl text-slate-700 flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <AlertTriangle size={16} className="text-red-650 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Add Critical Finding</div>
                    </button>

                    <button
                      onClick={() => setActiveMenu('PACS')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 rounded-xl text-slate-700 flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <Upload size={16} className="text-sky-600 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Upload PACS Image</div>
                    </button>

                    <button
                      onClick={() => {
                        if (mockRadRequests.length > 0) {
                          handleOpenReportEditor(mockRadRequests[0]);
                        } else {
                          onShowNotification("Queue empty. Add requests first.");
                        }
                      }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 rounded-xl text-slate-700 flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <FileEdit size={16} className="text-blue-600 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Create New Report</div>
                    </button>

                    <button
                      onClick={() => setActiveMenu('PeerReview')}
                      className="p-3 border border-slate-150 hover:bg-slate-50 rounded-xl text-slate-700 flex flex-col gap-2 transition text-left cursor-pointer group"
                    >
                      <UserCheck size={16} className="text-emerald-700 group-hover:scale-105 transition-transform" />
                      <div className="font-semibold text-xs text-slate-800">Request Peer Review</div>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-mono text-center">
                  All radiology transactions are strictly logged under identity limits
                </div>
              </div>

              {/* Red-border compliance warnings */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left">
                <h3 className="font-bold text-slate-900 text-sm mb-0.5">Urgent Department Compliance Alerts</h3>
                <span className="block text-[10px] text-slate-400 font-mono mb-4">Real-time alerts tracking patient security paths</span>

                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="text-red-700 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-red-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>5 reports are overdue</span>
                        <span className="text-[10px] text-red-550 font-mono">20 min ago</span>
                      </div>
                      <p className="text-red-650 mt-1 leading-snug">Ensure timely reporting indices are signed to preserve stroke intervention compliance limit.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="text-amber-800 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-amber-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>7 urgent exams require attention</span>
                        <span className="text-[10px] text-amber-550 font-mono">40 min ago</span>
                      </div>
                      <p className="text-amber-700 mt-1 leading-snug">Inpatient priority CT exams awaiting physical preparation in primary scanner ward.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <Clock className="text-slate-600 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs text-slate-800">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>3 exams awaiting images</span>
                        <span className="text-[10px] text-slate-500 font-mono">1 hr ago</span>
                      </div>
                      <p className="text-slate-500 mt-1 leading-snug">Acquired PA views in queue need to be pushed securely to PACS server node DICOM routing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Security logs timeline for ATIF visibility within department */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 text-left">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Departmental Security &amp; Audit Logs (Live ATIF Core Feed)</h3>
                  <span className="block text-[10px] text-slate-400 font-mono">EHR identity scans and file lookups index</span>
                </div>
                <button onClick={fetchSecurityLogs} className="p-1 px-2.5 border rounded-lg text-[10.5px] font-bold text-slate-650 hover:bg-slate-50">
                  Reload Logs
                </button>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                {securityLogs.length === 0 ? (
                  <div className="py-6 text-slate-400">Loading active security log sequence...</div>
                ) : (
                  securityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 text-[8.5px] font-bold bg-sky-150 bg-sky-100 text-sky-800 rounded font-mono">{log.activityType}</span>
                          <span className="font-bold text-slate-850">@{log.username} ({log.role})</span>
                          <span className="text-slate-500 text-[10px]">IP: {log.ipAddress}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                      </div>
                      <span className="text-slate-450 text-[10px] shrink-0 font-normal">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================== SUBPAGES ========================== */}

        {/* Imaging Requests Tab */}
        {activeMenu === 'ImagingRequests' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-5xl mx-auto" id="rad-pane-requests">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">PACS Radiological Requests Manager</h2>
                <span className="text-xs text-slate-400 font-mono">Inspect schedules, print radiological labels or sign results</span>
              </div>
              <button
                onClick={() => {
                  onShowNotification("A new radiology request simulated.");
                  setMockRadRequests([...mockRadRequests, {
                    id: `IMG-2025-${Math.floor(2006 + Math.random() * 900)}`,
                    patient: "Linda Johnson (HIS-4042)",
                    patientId: "HIS-4042",
                    exam: "X-Ray PA Joint",
                    priority: "Normal",
                    status: "New",
                    requested: "Just now"
                  }]);
                }}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <Plus size={14} /> Simulate Request
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 [10px] font-mono uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Scan ID</th>
                    <th className="py-2.5 px-3">Patient Account</th>
                    <th className="py-2.5 px-3">Exam Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {getDisplayRequests().map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{req.id}</td>
                      <td className="py-3 px-3 font-mono">
                        <button onClick={() => onOpenPatientFile(req.patientId)} className="text-sky-700 hover:underline font-bold">
                          {req.patient}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{req.exam}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          req.priority === 'High' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-650'
                        }`}>{req.priority}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          req.status === 'New' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                          req.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-650 font-bold'
                        }`}>{req.status}</span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        {req.status !== 'Completed' ? (
                          <button
                            onClick={() => handleOpenReportEditor(req)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Acquire / Report
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[10px] px-2">SIGNED REPORT RELEASED</span>
                        )}
                        <button
                          onClick={() => onOpenPatientFile(req.patientId)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-650 font-bold rounded-lg text-[10px] border border-slate-200 transition"
                        >
                          EHR Patient
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active PACS acquisition node */}
        {activeMenu === 'PACS' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="rad-pane-pacs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Image Acquisition Node (PACS Integration)</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Verify live DICOM image packets from hospital modalities</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border rounded-2xl">
                <span className="block font-bold text-slate-800 text-xs mb-3">Manually Push PACS Scan to EHR</span>
                <form onSubmit={handleUploadPACS} className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="text-slate-650 block">Select Patient Record *</label>
                    <select className="w-full px-3.5 py-2 border rounded-xl bg-white text-xs">
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.id} - {p.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-650 block">DICOM Series Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SAG_T2_SPINE"
                      value={pacsUploadName}
                      onChange={(e) => setPacsUploadName(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="p-5 border-2 border-dashed rounded-xl bg-slate-50 text-center text-xs text-slate-450 cursor-pointer">
                    <ImageIcon size={24} className="mx-auto text-slate-400 mb-2" />
                    <span>Upload DICOM series frames</span>
                    <span className="block font-mono text-[9px] text-slate-450 mt-1">DCM, DICOM images up to 120 MB</span>
                  </div>

                  <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition text-xs cursor-pointer">
                    Publish to Core PACS Node
                  </button>
                </form>
              </div>

              <div>
                <span className="block font-bold text-slate-800 text-xs mb-3">PACS Node Upload Sequence</span>
                <div className="space-y-2.5">
                  {uploadedImagesList.map((img, i) => (
                    <div key={i} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-white hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon size={16} className="text-sky-600" />
                        <div>
                          <span className="font-semibold text-slate-800 block">{img.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-mono">{img.type} • Processed {img.date}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-mono text-[9px] rounded font-bold">PACS_OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Critical report findings manager and alert loop */}
        {activeMenu === 'CriticalFindings' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="rad-pane-critical">
            <h2 className="text-base font-bold text-slate-900 mb-1">Critical findings notification desk</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Communicate critical imaging outcomes immediately to primary physicians</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border rounded-2xl">
                <span className="block font-bold text-slate-800 text-xs mb-3">Flag New Critical Pathology</span>
                <form onSubmit={handleAddCriticalFinding} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-650 block">Select Patient *</label>
                    <select
                      value={criticalPatientId}
                      onChange={(e) => setCriticalPatientId(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-xl bg-white"
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.id} - {p.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-650 block">Select Modality / Exam *</label>
                    <select
                      value={criticalExamType}
                      onChange={(e) => setCriticalExamType(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-xl bg-white"
                    >
                      <option value="CT Brain">CT Brain</option>
                      <option value="X-Ray Chest PA">X-Ray Chest PA</option>
                      <option value="MRI Spine Sagital">MRI Spine Sagital</option>
                      <option value="US Abdominal Complete">US Abdominal Complete</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-650 block font-semibold text-red-700">Critical Finding Details *</label>
                    <textarea
                      required
                      placeholder="e.g. Signs of acute ischemia, tension pneumothorax or severe spinal stenosis detected..."
                      value={criticalDetails}
                      onChange={(e) => setCriticalDetails(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2 border border-red-200 rounded-xl outline-none focus:ring-1 focus:ring-red-500 font-sans"
                    />
                  </div>

                  <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer">
                    Trigger Red Alert to Care Team
                  </button>
                </form>
              </div>

              <div>
                <span className="block font-bold text-slate-800 text-xs mb-3">Active Critical Pathology Alerts</span>
                <div className="space-y-3">
                  {criticalFindingsFeed.map((crit, i) => (
                    <div key={i} className="p-3 bg-red-50/50 border border-red-250 rounded-xl text-xs">
                      <div className="flex justify-between items-center font-bold text-red-950">
                        <span>{crit.exam} — {crit.patient}</span>
                        <span className="font-mono text-[9px] text-red-650">{crit.time}</span>
                      </div>
                      <p className="text-red-700 mt-1">{crit.finding}</p>
                      <span className="text-[9.5px] px-1.5 py-0.2 bg-red-200 text-red-900 rounded font-semibold font-mono inline-block mt-2">ACTIVE RESPONSE ENFORCED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Patient Profiles Index */}
        {activeMenu === 'PatientSearch' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-5xl mx-auto" id="rad-pane-profiles">
            <h2 className="text-base font-bold text-slate-900 mb-1">Global Patients Directory</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Master patient demographics, clinical statuses, and full medical histories index</span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-mono uppercase bg-slate-50">
                    <th className="py-2.5 px-3">EHR ID</th>
                    <th className="py-2.5 px-3">Patient Legal Name</th>
                    <th className="py-2.5 px-3">Biological Sex</th>
                    <th className="py-2.5 px-3">Chronological Age</th>
                    <th className="py-2.5 px-3">Security Category</th>
                    <th className="py-2.5 px-3 text-right">EHR Entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredPatients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{pat.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{pat.fullName}</td>
                      <td className="py-3 px-3">{pat.gender}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{pat.dob}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          {pat.isVip && <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold rounded text-[9.5px]">VIP FILE</span>}
                          {pat.isStaff && <span className="px-1.5 py-0.2 bg-blue-105 bg-blue-100 text-blue-800 font-bold rounded text-[9.5px]">STAFF EXEMPT</span>}
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9.5px] uppercase">{pat.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenPatientFile(pat.id)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-sky-700 font-bold rounded-lg border border-slate-200 transition text-[10.5px] cursor-pointer"
                        >
                          View Full Chart &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PACS Report Form Draft Workspace */}
        {activeMenu === 'Reporting' && selectedReq && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left max-w-4xl mx-auto" id="rad-pane-reporting-workspace">
            <div className="flex justify-between items-center border-b pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">PACS Diagnostic Report Sign-off Workspace</h3>
                <span className="text-xs text-slate-450 font-mono">Sign radiological outcomes for active scan {selectedReq.id}</span>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 px-3 border hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition">
                Close Draft
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-700">
              {/* Patient data block */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
                  <span className="block font-bold text-[11px] uppercase tracking-wider font-mono text-[#0284c7]">Active Patient Context Details</span>
                  <div className="grid grid-cols-2 gap-3 leading-snug">
                    <div>
                      <span className="block text-slate-400 font-mono text-[10px]">Patient Reference</span>
                      <strong className="text-slate-800">{patients.find(p => p.id === selectedReq?.patientId)?.fullName || selectedReq?.patientId}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-mono text-[10px]">Medical Record No. (MRN)</span>
                      <strong className="text-slate-850 font-mono font-bold">{selectedReq?.patientId}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-mono text-[10px]">Modality / Requested Exam</span>
                      <strong>{selectedReq?.imagingType || (selectedReq as any)?.exam || ""}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-mono text-[10px]">Assigned Radiologist</span>
                      <strong>Michael Lee (verified)</strong>
                    </div>
                  </div>
                </div>

                {/* Svg preview scan placeholder */}
                <div className="w-full h-56 bg-slate-950 rounded-xl relative flex flex-col justify-center items-center shadow-inner text-slate-400 border border-slate-800">
                  <ImageIcon size={36} className="text-slate-750 animate-pulse text-sky-700 mb-2" />
                  <span className="font-mono text-[11.5px] font-bold text-sky-200">ACTIVE PACS STUDY LOADED</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">DICOM Node Frame 12/24 PA View PA-Weighted</span>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] font-mono text-slate-500">
                    <span>W/L: 450/120</span>
                    <span>TE: 14.8ms • TR: 450ms</span>
                  </div>
                </div>
              </div>

              {/* Form writer */}
              <form onSubmit={handleSaveReport} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 block">Radiological Diagnostic Findings *</label>
                  <textarea
                    required
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={12}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-xs outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                  />
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    type="submit"
                    disabled={isSavingReport}
                    className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isSavingReport ? <RefreshCw className="animate-spin" size={12} /> : <Send size={12} />}
                    Sign &amp; Release Diagnostic Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Audit Logs Trail view */}
        {activeMenu === 'Telemetry' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-left" id="rad-pane-audits">
            <h2 className="text-base font-bold text-slate-900 mb-1">Radiology Identity Cybersecurity Log (ATIF Audit Feed)</h2>
            <span className="block text-xs text-slate-400 font-mono mb-6">Real-time telemetry of clinical lookups, diagnostic studies, and PACS accesses</span>

            <div className="space-y-2.5 font-mono text-xs">
              {securityLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Loading audit history...</div>
              ) : (
                securityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-sky-100 text-[#0284c7] font-bold rounded text-[9px] uppercase tracking-wider">{log.activityType}</span>
                        <span className="font-bold text-slate-900">@{log.username} ({log.role})</span>
                        <span className="text-slate-500">IP: {log.ipAddress}</span>
                        <span className="text-slate-500">Device: {log.deviceName}</span>
                      </div>
                      <p className="text-xs text-slate-650 mt-1 font-sans">{log.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] text-slate-450">{log.timestamp}</span>
                      <span className="text-red-650 font-bold block text-[10.5px]">Risk Score: +{log.riskContribution}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Offline routing placeholders */}
        {(activeMenu === 'Worklist' || activeMenu === 'ReportingPanel' || activeMenu === 'PeerReview' || activeMenu === 'Analytics') && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-12 text-center max-w-2xl mx-auto" id="rad-unimplemented-view">
            <h2 className="text-base font-bold text-slate-900 mb-2">PACSRad Diagnostic Segment Offline</h2>
            <span className="block text-xs text-slate-550 leading-relaxed mb-6">
              You are accessing a secure radiologic workstation block in PACS. This channel logs behavioral telemetry in compliance with HHS HIPAA guidelines. The terminal remains secure.
            </span>
          </div>
        )}

        {/* ========================== FOOTER BRAND ========================== */}
        <footer className="mt-8 border-t border-slate-200/70 pt-4 flex flex-col md:flex-row justify-between items-center text-[10.5px] text-slate-450 font-mono">
          <div className="flex items-center gap-1">
            <Shield className="text-[#0284c7]" size={12} />
            <span>Cybersecurity auditing active via Host Agent ATIF</span>
          </div>
          <span>&copy; 2026 St. Jude LIS System • PACS Integration v4.4.0-ATIF</span>
        </footer>
      </main>
    </div>
  );
}
