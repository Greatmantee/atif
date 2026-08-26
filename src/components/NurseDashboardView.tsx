/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Search, Bell, Shield, Calendar, Clock, CheckCircle, 
  AlertTriangle, ArrowRight, UserCheck, MessageSquare, Clipboard, Layers, Heart,
  UserCheck as UserCheckIcon, Settings, LogOut, ChevronRight, Eye, Send, Check, Plus, Minus,
  Menu, X
} from 'lucide-react';
import { Patient, WardBed, ShiftHandover, Vitals } from '../types';

interface NurseDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (patientId: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function NurseDashboardView({ 
  currentUser, 
  patients, 
  onRefresh, 
  onOpenPatientFile,
  onShowNotification
}: NurseDashboardViewProps) {
  
  // Sidebar tab selection active state
  const [activeMenuTab, setActiveMenuTab] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'System notification: Room 104 Bed B emergency call button pressed.', time: '09:25 AM', read: false },
    { id: '2', text: 'Daily shift handover successfully recorded in EHR audit logs.', time: '09:10 AM', read: false },
    { id: '3', text: 'New medication prescription received from Dr. House.', time: '08:45 AM', read: true },
    { id: '4', text: 'Vital limit threshold alert: SpO2 dipped to 92% for Patient Jane Doe.', time: '08:15 AM', read: false },
    { id: '5', text: 'Workstation security certificate auto-renewal succeeded.', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Search input
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');

  // Shift handover form state
  const [hoReceiver, setHoReceiver] = useState<string>('Clara Barton');
  const [hoNotes, setHoNotes] = useState<string>('All patients stable, 3 medications pending. Bed 12 needs close monitoring.');
  const [hoWard, setHoWard] = useState<string>('General Medicine Ward - G-01');

  // Quick vital observation state
  const [selectedVitalPatientId, setSelectedVitalPatientId] = useState<string>('');
  const [vitalsTemp, setVitalsTemp] = useState<string>('36.5');
  const [vitalsBP, setVitalsBP] = useState<string>('120/80');
  const [vitalsPulse, setVitalsPulse] = useState<string>('80');
  const [vitalsResp, setVitalsResp] = useState<string>('18');
  const [vitalsSpO2, setVitalsSpO2] = useState<string>('98');
  const [vitalsPain, setVitalsPain] = useState<string>('0');
  const [vitalsNotes, setVitalsNotes] = useState<string>('');
  const [isSavingVitals, setIsSavingVitals] = useState<boolean>(false);

  // Beds telemetry and handovers
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [handoversList, setHandoversList] = useState<ShiftHandover[]>([]);

  // Local checkbox lists state (for tasks)
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Take vitals for 5 patients', time: 'Due in 15 min', checked: false },
    { id: 2, text: 'MAR documentation', time: '10 pending', checked: false },
    { id: 3, text: 'Wound dressing - Bed 07', time: 'Due in 30 min', checked: false },
    { id: 4, text: 'IV fluid check - Bed 12', time: 'Due in 45 min', checked: false },
    { id: 5, text: 'Discharge education - Bed 21', time: 'Due in 1 hr', checked: false },
  ]);

  // Medication ledger local records
  const [medsList, setMedsList] = useState([
    { time: '09:00', drug: 'Aspirin 75mg', bed: 'Bed 03 • John Doe', status: 'Due' },
    { time: '09:30', drug: 'Ceftriaxone 1g', bed: 'Bed 07 • Mary Smith', status: 'Due' },
    { time: '10:00', drug: 'Metformin 500mg', bed: 'Bed 12 • James Brown', status: 'Overdue' },
    { time: '10:30', drug: 'Salbutamol Inhaler', bed: 'Bed 15 • Linda Johnson', status: 'Due' },
  ]);

  // Observations mock ledger (mirroring recent records dynamically)
  const [recentObs, setRecentObs] = useState([
    { patient: 'John Doe (Bed 03)', bp: '120/80', temp: '37.1°C', spo2: '98%', time: '08:00 AM' },
    { patient: 'Mary Smith (Bed 07)', bp: '140/90', temp: '37.3°C', spo2: '97%', time: '07:45 AM' },
    { patient: 'James Brown (Bed 12)', bp: '130/65', temp: '36.9°C', spo2: '99%', time: '07:30 AM' },
    { patient: 'Linda Johnson (Bed 15)', bp: '110/70', temp: '37.0°C', spo2: '98%', time: '07:15 AM' },
  ]);

  // Static alerts list matching image reference
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', patient: 'James Brown (Bed 12)', msg: 'Blood glucose high: 245 mg/dL', stamp: '10 min ago' },
    { id: 2, type: 'warning', patient: 'Mary Smith (Bed 07)', msg: 'BP above normal range', stamp: '15 min ago' },
    { id: 3, type: 'critical', patient: 'Robert Wilson (Bed 21)', msg: 'Low oxygen saturation', stamp: '20 min ago' },
  ]);

  useEffect(() => {
    fetchBedsData();
    fetchHandovers();
    if (patients.length > 0 && !selectedVitalPatientId) {
      // Find first checked-in or admitted patient to default
      const defaultPat = patients.find(p => p.status === 'Admitted' || p.status === 'Checked In');
      if (defaultPat) setSelectedVitalPatientId(defaultPat.id);
    }
  }, [patients]);

  const fetchBedsData = async () => {
    try {
      const res = await fetch('/api/beds');
      if (res.ok) {
        const d = await res.json();
        setBeds(d.beds || []);
      }
    } catch (_) {}
  };

  const fetchHandovers = async () => {
    try {
      const res = await fetch('/api/handovers');
      if (res.ok) {
        const d = await res.json();
        setHandoversList(d.handovers || []);
      }
    } catch (_) {}
  };

  const handlePostVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVitalPatientId) {
      onShowNotification("Please select a patient file.");
      return;
    }
    setIsSavingVitals(true);
    try {
      const res = await fetch(`/api/patients/${selectedVitalPatientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heartRate: vitalsPulse,
          bloodPressure: vitalsBP,
          temperature: vitalsTemp,
          respirationRate: vitalsResp,
          notes: `SpO2: ${vitalsSpO2}%, Pain Score: ${vitalsPain}/10. ${vitalsNotes}`
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Vitals observation logged and audited successfully.");
        // Add to local observations list for immediate rendering feedback
        const patName = patients.find(p => p.id === selectedVitalPatientId)?.fullName || 'Patient';
        setRecentObs(prev => [
          { patient: `${patName} (Bed ID: ${selectedVitalPatientId})`, bp: vitalsBP, temp: `${vitalsTemp}°C`, spo2: `${vitalsSpO2}%`, time: 'Just Now' },
          ...prev.slice(0, 3)
        ]);
        setVitalsNotes('');
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Communication error saving vitals: " + err.message);
    } finally {
      setIsSavingVitals(false);
    }
  };

  const handlePostHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverName: hoReceiver,
          wardName: hoWard,
          handoverSummary: hoNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Signed-off handover to ${hoReceiver} for ${hoWard}.`);
        fetchHandovers();
        setHoNotes('');
      }
    } catch (err: any) {
      onShowNotification("Error sealing shift handover: " + err.message);
    }
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  // Filtered patients for the main directory search view
  const globalFilterPatients = patients.filter(p => {
    const q = localSearchQuery.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
  });

  // Render a sidebar list matching the attached image
  const sidebarMenuOptions = [
    { name: 'Dashboard', icon: <Activity size={15} />, section: 'MAIN' },
    { name: 'My Ward', icon: <Clock size={15} />, section: 'MAIN' },
    { name: 'Global Patients', icon: <Users size={15} />, section: 'MAIN', badge: 'NEW' },
    { name: 'Tasks', icon: <Clipboard size={15} />, section: 'MAIN', badge: '12' },
    { name: 'Vitals & Observations', icon: <Heart size={15} />, section: 'PATIENT CARE' },
    { name: 'MAR Chart', icon: <Clipboard size={15} />, section: 'PATIENT CARE' },
    { name: 'Nursing Notes', icon: <Layers size={15} />, section: 'PATIENT CARE' },
    { name: 'Care Plans', icon: <Clipboard size={15} />, section: 'PATIENT CARE' },
    { name: 'Ward Overview', icon: <Clock size={15} />, section: 'WARD MANAGEMENT' },
    { name: 'Bed Management', icon: <Users size={15} />, section: 'WARD MANAGEMENT' },
    { name: 'Shift Handover', icon: <Send size={15} />, section: 'WARD MANAGEMENT' },
    { name: 'Messages', icon: <MessageSquare size={15} />, section: 'COMMUNICATION', badge: '3' },
    { name: 'Notifications', icon: <Bell size={15} />, section: 'COMMUNICATION' },
    { name: 'Reports', icon: <Clipboard size={15} />, section: 'REPORTS' },
    { name: 'Audit Logs', icon: <Shield size={15} />, section: 'REPORTS' },
  ];

  // Dynamic general medicine ward beds analysis
  const genMedBeds = beds.filter(b => b.wardName === 'General Medicine');
  const wardCapacity = genMedBeds.length || 3;
  const occupiedBeds = genMedBeds.filter(b => b.isOccupied).length;
  const availableBeds = wardCapacity - occupiedBeds;
  const occupancyPercentage = Math.round((occupiedBeds / wardCapacity) * 100);

  const completedTasksCount = tasks.filter(t => t.checked).length;
  const totalTasksCount = tasks.length || 1;
  const calculatedShiftProgress = Math.round((completedTasksCount / totalTasksCount) * 100);

  return (
    <div className="flex bg-[#F8FAFC] min-h-[85vh] rounded-3xl overflow-hidden border border-slate-200 mt-4 shadow-sm relative" id="nurse-dashboard-workspace">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 1. STICKY SIDEBAR NAVIGATION */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-150 flex flex-col justify-between shrink-0 text-left font-sans select-none p-4 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="nurse-sidebar">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#059669] text-white rounded-lg">
                <span className="font-mono font-black text-sm">StJ</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-700 tracking-tight block">St. Jude Medical</span>
                <span className="text-[9px] font-mono text-slate-400 block tracking-wider uppercase font-semibold">EHR System</span>
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

          <div className="space-y-4 text-xs">
            {['MAIN', 'PATIENT CARE', 'WARD MANAGEMENT', 'COMMUNICATION', 'REPORTS'].map(sectionName => {
              const items = sidebarMenuOptions.filter(opt => opt.section === sectionName);
              return (
                <div key={sectionName} className="space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 font-mono tracking-widest uppercase block pl-3 py-1">
                    {sectionName}
                  </span>
                  <div className="space-y-0.5">
                    {items.map(item => (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveMenuTab(item.name);
                          if (item.name === 'Global Patients') {
                            setLocalSearchQuery('');
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                          activeMenuTab === item.name
                            ? 'bg-[#EBFDF5] text-[#047857] border-[#A7F3D0]/80 font-bold'
                            : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span className="font-bold text-[11px] font-sans">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black font-mono tracking-wider ${
                            item.badge === 'NEW' 
                              ? 'bg-[#10B981] text-white' 
                              : item.badge === '3' 
                              ? 'bg-rose-500 text-white' 
                              : 'bg-indigo-600 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info containing login status */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-600 tracking-wider">NURSE WORKSPACE</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10.5px] font-bold text-slate-800 leading-tight">Nurse Florence</p>
              <p className="text-[9px] text-slate-400 font-mono">General Hospital</p>
            </div>
            <span className="text-xs text-slate-400">#003</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN SUB-PANEL AREA */}
      <main className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[85vh] text-left">
        
        {/* HEADER SECTION IN EHR IMAGE CONTAINER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
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
              <span className="text-xs font-extrabold text-slate-400 font-mono uppercase tracking-widest block">
                {activeMenuTab} view
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight" id="nurse-welcome-header">
                Nurse Dashboard
              </h2>
              <p className="text-xs text-slate-500 tracking-wide mt-1">
                Good morning, Nurse Florence ☀️ <span className="font-mono text-[11px] text-xs font-semibold pl-2 text-slate-400 border-l border-slate-200">Operator ID: EMP-003</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search patients by name, ID, MRN... (Ctrl + K)"
                value={localSearchQuery}
                onChange={e => {
                  setLocalSearchQuery(e.target.value);
                  if (activeMenuTab !== 'Global Patients' && activeMenuTab !== 'Dashboard') {
                    setActiveMenuTab('Global Patients');
                  }
                }}
                className="w-full bg-white border border-slate-200 text-xs py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors font-sans"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer rounded-xl text-slate-500 relative shrink-0 block"
                title="System Notifications"
              >
                <Bell size={16} />
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
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
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
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-emerald-50/10 font-medium' : ''}`}
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

        {/* 3. CLINI-INTELLIGENT DYNAMIC TAB SWITCHING */}

        {activeMenuTab === 'Dashboard' && (
          <div className="space-y-6 mt-6 animate-fade-in" id="dashboard-tab-content">
            
            {/* COMPLIANCE WARNING BANNER (IMAGE REQUIREMENT) */}
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-inner" id="global-access-banner">
              <div className="flex items-start gap-3 text-left">
                <Shield className="text-emerald-600 shrink-0 mt-0.5" size={17} />
                <div>
                  <h4 className="text-xs font-bold font-sans tracking-wide uppercase text-emerald-800 flex items-center gap-1.5">
                    Global Access Enabled
                  </h4>
                  <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-relaxed font-sans">
                    You can view patient records across all departments. Please ensure proper use and absolute patient confidentiality. All actions are rigorously audited under HIPAA standards.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onShowNotification("EHR Policy Code HIPAA-45-CFR-164.312 enforced.")}
                className="bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer shadow-sm shrink-0 transition-colors"
              >
                View Access Policy
              </button>
            </div>

            {/* KPI STATISTICAL GRID CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="kpi-statistics-grid">
              {[
                { label: 'Patients in Hospital', val: patients.length.toString(), sub: 'Registered records', subColor: 'text-slate-400 font-medium' },
                { label: 'Medications Due', val: medsList.length.toString(), sub: 'For next 6 hours', subColor: 'text-amber-600 font-bold' },
                { label: 'Critical Patients', val: alerts.length.toString(), sub: 'Active triage items', subColor: 'text-rose-500 font-bold' },
                { label: 'Pending Tasks', val: tasks.filter(t => !t.checked).length.toString(), sub: 'Assigned to Florence', subColor: 'text-[#047857]' },
                { label: 'Shift Progress', val: `${calculatedShiftProgress}%`, sub: 'Tasks completed', subColor: 'text-[#059669]' }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-4 border border-slate-200 rounded-2xl hover:shadow-xs transition-shadow">
                  <span className="text-[10.5px] font-bold text-slate-400 block tracking-tight leading-tight">{kpi.label}</span>
                  <span className="text-2xl font-black text-slate-800 tracking-tight mt-1 px-0.5 block">{kpi.val}</span>
                  <span className={`text-[10px] font-semibold mt-1 block ${kpi.subColor}`}>{kpi.sub}</span>
                </div>
              ))}
            </div>

            {/* MAIN TWO-COLUMN CONTENT AREA DISPLAY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT/MAIN DOCK: GENERAL MED WARD + MED DEVIATION LIST */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* WARD SUMMARY OVERVIEW */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">My Ward Overview</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">General Medicine Ward - G-01</p>
                    </div>
                    <span className="bg-[#EBFDF5] text-[#047857] text-[9.5px] font-black font-mono px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Active Shift
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-left mt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Ward Capacity</span>
                      <strong className="text-slate-700 text-[13px] block mt-1">{wardCapacity} Beds</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Occupied</span>
                      <strong className="text-slate-700 text-[13px] block mt-1">{occupiedBeds} ({occupancyPercentage}%)</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Available</span>
                      <strong className="text-[#059669] text-[13px] block mt-1">{availableBeds}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Nurses on Duty</span>
                      <strong className="text-slate-700 text-[13px] block mt-1">4</strong>
                    </div>
                  </div>

                  {/* Bed Occupancy Capacity indicator progress bar */}
                  <div className="pt-2">
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden w-full">
                      <div className="bg-emerald-500 rounded-full h-2" style={{ width: `${occupancyPercentage}%` }} />
                    </div>
                  </div>
                </div>

                {/* MEDICATIONS DUE NEXT 6 HOURS WIDGET */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="medications-due-widget">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Medications Due <span className="font-sans text-[11px] text-slate-400 font-normal pl-1.5">(Next 6 Hours)</span></h3>
                    </div>
                    <button 
                      onClick={() => setActiveMenuTab('MAR Chart')}
                      className="text-[#047857] text-[11px] font-bold hover:underline cursor-pointer"
                    >
                      View all medications &gt;
                    </button>
                  </div>

                  <div className="space-y-2 text-left">
                    {medsList.map((med, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 gap-2">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs font-bold text-slate-500">{med.time}</span>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{med.drug}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{med.bed}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase tracking-wide ${
                          med.status === 'Overdue' 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {med.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ADMITTED WARD PATIENTS TABLE */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="patients-ward-table">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Patients in My Ward</h3>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">Currently assigned bed registers</p>
                    </div>
                    <button 
                      onClick={() => setActiveMenuTab('My Ward')}
                      className="text-[#047857] hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      View all ward patients
                    </button>
                  </div>

                  <div className="overflow-x-auto min-w-full">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-[#F8FAFC] text-slate-400 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-200 font-mono">
                        <tr>
                          <th className="py-3 px-4">Bed</th>
                          <th className="py-3 px-4">Patient</th>
                          <th className="py-3 px-4">Age / Sex</th>
                          <th className="py-3 px-4">Condition</th>
                          <th className="py-3 px-4">Attending Doctor</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-750">
                        {patients.filter(p => p.status === 'Admitted').slice(0, 5).map((p, i) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              {p.admittedBed || `B-${10+i}`}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{p.fullName}</td>
                            <td className="py-3.5 px-4">{p.dob ? `${new Date().getFullYear() - new Date(p.dob).getFullYear()} / ` : "41 / "} {p.gender === 'Male' ? 'M' : p.gender === 'Female' ? 'F' : 'Other'}</td>
                            <td className="py-3.5 px-4 font-mono text-[10.5px] uppercase text-slate-500">
                              {p.diagnoses?.[0] || 'Observe Recovery'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-605 text-slate-600">Dr. Gregory House</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                p.isVip ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {p.isVip ? 'VIP Secure' : 'Stable'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => onOpenPatientFile(p.id)}
                                className="p-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-medium font-sans flex items-center gap-1 mx-auto cursor-pointer"
                                title="Open Medical File Chart"
                              >
                                <Eye size={12} />
                                <span className="text-[10px]">Chart</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {patients.filter(p => p.status === 'Admitted').length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                              No admitted patient registry found. Use Patients Search tab to view directory.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RECENT CLINICAL OBSERVATIONS OBSERVED */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="observations-widget">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Recent Observations</h3>
                    <button 
                      onClick={() => setActiveMenuTab('Vitals & Observations')}
                      className="text-[#047857] hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      View all observations
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentObs.map((obs, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-slate-100/60 transition-colors">
                        <div className="flex justify-between items-center text-[10.5px] border-b border-slate-200/50 pb-1.5">
                          <strong className="text-slate-800 tracking-tight block truncate font-sans">{obs.patient}</strong>
                          <span className="text-slate-400 font-mono block font-semibold text-[9.5px]">{obs.time}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-left">
                          <div>
                            <span className="text-slate-400 block text-[9px] font-sans">BP</span>
                            <span className="text-slate-700 font-bold block">{obs.bp}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] font-sans">Temp</span>
                            <span className="text-slate-700 font-bold block">{obs.temp}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] font-sans">SpO₂</span>
                            <span className="text-slate-700 font-bold block">{obs.spo2}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHIFT HANDOVER FORM WIDGET */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs text-left" id="shift-handover-widget">
                  <div className="pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Shift Handover</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Seal transition notes for relieving clinical team</p>
                  </div>

                  <form onSubmit={handlePostHandover} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">From (Outgoing Nurse)</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser?.fullName || 'Florence Nightingale'}
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-500 font-bold cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">To (Incoming Nurse)</label>
                      <input
                        type="text"
                        required
                        placeholder="Incoming nurse name..."
                        value={hoReceiver}
                        onChange={e => setHoReceiver(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-755 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Summary &amp; Instructions Handover Notes</label>
                      <textarea
                        required
                        value={hoNotes}
                        onChange={e => setHoNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-3 rounded-xl h-20 resize-none focus:outline-none focus:border-emerald-500 leading-relaxed text-slate-700"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-between items-center flex-wrap pt-2 gap-4">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Clock size={12} />
                        <span>Shift Ward: General Medicine G-01</span>
                      </div>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black font-sans uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Check size={13} /> Complete Handover
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* RIGHT SIDEBAR: PENDING TASKS, QUICK ENTRY VITAL STATS, IMPORTANT ALERTS */}
              <div className="space-y-6">
                
                {/* CHECKLIST PENDING CLINICAL TASKS */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="pending-tasks-widget">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Pending Tasks</h3>
                    <span className="bg-rose-50 text-rose-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                      5 Urgencies
                    </span>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-1 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={task.checked}
                          onChange={() => {
                            toggleTask(task.id);
                            onShowNotification(`Task "${task.text}" action updated.`);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-650 focus:ring-emerald-550 h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                        />
                        <div className="text-left select-none flex-1">
                          <p className={`font-bold leading-tight ${task.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.text}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold font-mono">{task.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveMenuTab('Tasks')}
                    className="w-full text-center text-[#047857] hover:underline text-[11px] font-bold block pt-2 border-t border-slate-100/80 cursor-pointer"
                  >
                    View all tasks
                  </button>
                </div>

                {/* INTERACTIVE FORM: VITAL SIGNS QUICK REGISTRATION */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs text-left" id="vital-quick-entry">
                  <div className="pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Vital Signs Quick Entry</h3>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Instantly log patient bed obs metrics</p>
                  </div>

                  <form onSubmit={handlePostVitals} className="space-y-3 font-sans text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-extrabold uppercase">Select Patient</label>
                      <select
                        value={selectedVitalPatientId}
                        onChange={e => setSelectedVitalPatientId(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-xl text-slate-750 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                      >
                        <option value="">Choose Admitted Patient...</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} ({p.id}) - {p.admittedBed || 'OPD'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Temperature">Temp (°C)</label>
                        <input
                          type="text" required value={vitalsTemp} onChange={e=>setVitalsTemp(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Blood Pressure">BP (mmHg)</label>
                        <input
                          type="text" required value={vitalsBP} onChange={e=>setVitalsBP(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Pulse Rate">Pulse (bpm)</label>
                        <input
                          type="text" required value={vitalsPulse} onChange={e=>setVitalsPulse(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Respiration Rate">Resp. Rate (rpm)</label>
                        <input
                          type="text" required value={vitalsResp} onChange={e=>setVitalsResp(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Oxygen Saturation">SpO₂ (%)</label>
                        <input
                          type="text" required value={vitalsSpO2} onChange={e=>setVitalsSpO2(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-400 font-bold uppercase truncate" title="Pain score from 0 to 10">Pain Score (0-10)</label>
                        <input
                          type="text" required value={vitalsPain} onChange={e=>setVitalsPain(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-center rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="block text-[10px] text-slate-400 font-extrabold uppercase">Observations/Notes</label>
                      <input
                        type="text"
                        placeholder="Any notable bedside complaints..."
                        value={vitalsNotes}
                        onChange={e => setVitalsNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-755 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingVitals}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white font-sans font-bold py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors uppercase tracking-wider text-[11px]"
                    >
                      {isSavingVitals ? 'Sending Observation...' : 'Save Observations'}
                    </button>
                  </form>
                </div>

                {/* IMPORTANT CLINICAL ALERTS */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="important-alerts-widget">
                  <div className="pb-1 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Important Alerts</h3>
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  </div>

                  <div className="space-y-3">
                    {alerts.map(al => (
                      <div key={al.id} className="flex gap-2.5 p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors">
                        <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={15} />
                        <div className="text-left font-sans text-[11px] flex-1">
                          <strong className="text-slate-800 font-bold block">{al.patient}</strong>
                          <p className="text-slate-600 mt-0.5 leading-tight">{al.msg}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono font-semibold">{al.stamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveMenuTab('Notifications')}
                    className="w-full text-center text-[#047857] hover:underline text-[11px] font-bold block pt-1 cursor-pointer"
                  >
                    View all alerts
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 4. OTHER SUBTAB VIEWS IMPLEMENTED FOR HIGH SCOPE COMPLETENESS */}

        {activeMenuTab === 'Global Patients' && (
          <div className="mt-6 space-y-4 animate-fade-in" id="global-patients-tab-content">
            <div className="p-4 bg-[#EBFDF5]/40 text-[#047857] border border-[#A7F3D0]/60 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <Shield size={16} />
              <span>Full registry file query enabled. All actions are logged under HIPPA audit logs.</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-450 text-slate-400 uppercase">Hospital Directory</span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">Explore Global Registers</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="text-xs w-full text-left font-sans">
                  <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9.5px] uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="p-4">Patient ID</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">DOB</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4">Ward Bed</th>
                      <th className="p-4">Classification</th>
                      <th className="p-4 text-center">Security Telemetry</th>
                      <th className="p-4 text-right">Observation Chart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {globalFilterPatients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#047857]">{p.id}</td>
                        <td className="p-4 font-bold text-slate-800">{p.fullName}</td>
                        <td className="p-4">{p.dob}</td>
                        <td className="p-4 font-mono">{p.phone || 'N/A'}</td>
                        <td className="p-4 font-mono">
                          {p.admittedWard ? `${p.admittedWard} Bed ${p.admittedBed}` : 'Outpatient OPD'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            p.isVip ? 'bg-indigo-100 text-indigo-700 font-black' : p.isStaff ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.isVip ? 'VIP SENATE' : p.isStaff ? 'HOSP STAFF' : 'GENERAL'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            AUDIT LOGGED
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onOpenPatientFile(p.id)}
                            className="text-[#047857] hover:underline text-xs font-bold font-sans cursor-pointer"
                          >
                            Access File &gt;
                          </button>
                        </td>
                      </tr>
                    ))}
                    {globalFilterPatients.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                          No matching records inside St Jude systems.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RENDER DYNAMIC BESPOKE NURSE VIEWS */}
        {activeMenuTab !== 'Dashboard' && activeMenuTab !== 'Global Patients' && (
          <div className="mt-6 space-y-6 animate-fade-in" id="nurse-subview-panel">
            
            {/* MY WARD */}
            {activeMenuTab === 'My Ward' && (
              <div className="space-y-4" id="my-ward-tab">
                <div className="flex justify-between items-center bg-white p-5 border border-slate-200 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">General Ward Bed Layout</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Physical bed assignments mapping in General Medicine Ward G-01.</p>
                  </div>
                  <span className="bg-emerald-50 text-[#047857] font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                    {beds.filter(b => b.isOccupied).length} / {beds.length || 24} Beds Occupied
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(beds.length > 0 ? beds : Array.from({ length: 24 }).map((_, i) => ({
                    wardName: 'General Med',
                    bedNumber: `G-${String(i+1).padStart(2, '0')}`,
                    isOccupied: i % 3 === 0,
                    status: i % 3 === 0 ? 'Occupied' : 'Available',
                    currentPatientId: i % 3 === 0 ? `HIS-${1000 + i}` : undefined
                  }))).map((bed, i) => (
                    <div 
                      key={i} 
                      className={`p-4 border rounded-2xl text-left space-y-2 relative transition-all ${
                        bed.isOccupied 
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="absolute top-2 right-2 text-[9px] font-bold font-mono px-1.5 py-0.2 bg-slate-50 border rounded uppercase text-slate-400">
                        {bed.bedNumber}
                      </span>
                      <div className="pt-2">
                        <span className={`h-2.5 w-2.5 rounded-full inline-block ${bed.isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-bold font-mono text-slate-500 ml-1.5 uppercase">
                          {bed.isOccupied ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                      
                      {bed.isOccupied ? (
                        <div className="text-xs space-y-1">
                          <p className="font-extrabold text-slate-800 truncate">
                            {patients.find(p => p.id === bed.currentPatientId || p.admittedBed === bed.bedNumber)?.fullName || "Bed Patient"}
                          </p>
                          <span className="text-[9px] font-mono text-rose-600 font-bold block">{bed.currentPatientId || "HIS-ID"}</span>
                          <button
                            onClick={() => {
                              const pid = bed.currentPatientId || patients.find(p => p.admittedBed === bed.bedNumber)?.id;
                              if (pid) onOpenPatientFile(pid);
                            }}
                            className="text-[10px] text-emerald-600 hover:underline font-bold block pt-1 cursor-pointer"
                          >
                            Update vitals &gt;
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-mono">Bed Ready</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS */}
            {activeMenuTab === 'Tasks' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="tasks-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Bedside Clinical Duty List</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Assigned nursing shifts duties, medication rounds, and observations tracking.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-101 transition-colors">
                          <input
                            type="checkbox"
                            checked={task.checked}
                            onChange={() => {
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, checked: !t.checked } : t));
                              onShowNotification(`Completed task item: "${task.text}"`);
                            }}
                            className="rounded border-slate-300 h-4 w-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className={`text-xs font-bold ${task.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.text}
                            </p>
                            <span className="text-[9.5px] font-mono text-slate-400 font-semibold">{task.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Assigned Nurse</h4>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 font-mono text-sm">
                        FN
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{currentUser?.fullName || 'Florence Nightingale'}</h5>
                        <p className="text-[10px] text-slate-400">Ward G-01 Nurse Supervisor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VITALS & OBSERVATIONS */}
            {activeMenuTab === 'Vitals & Observations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="vitals-observations-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Bedside Vitals Records</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Live index matching recently captured respiratory rate, oxygen saturation, temperature, blood pressure and heart rates.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                        <tr>
                          <th className="p-4">Patient / Admitted Bed</th>
                          <th className="p-4">Blood Pressure</th>
                          <th className="p-4">Temperature</th>
                          <th className="p-4">Oxygen Sat %</th>
                          <th className="p-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {recentObs.map((obs, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-800">{obs.patient}</td>
                            <td className="p-4 font-mono font-bold text-emerald-700">{obs.bp}</td>
                            <td className="p-4 font-mono">{obs.temp}</td>
                            <td className="p-4 font-mono font-bold text-indigo-600">{obs.spo2}</td>
                            <td className="p-4 font-mono text-slate-400 text-[10px]">{obs.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase font-mono tracking-wider">Logging Instructions</h4>
                    <p className="text-[11px] text-emerald-600 leading-relaxed font-sans mt-1">
                      Always double-check Patient ID and Bed Assignment labels before saving clinical observations inside central databases to avoid record mismatches.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MAR CHART */}
            {activeMenuTab === 'MAR Chart' && (
              <div className="space-y-4" id="mar-chart-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800">Medication Administration Record (MAR Chart)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Hourly drugs schedule, verifying doses, patients, routes, and nurse signatures.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <table className="text-xs w-full text-left font-sans animate-fade-in animate-pulse">
                    <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="p-4">Due Time</th>
                        <th className="p-4">Medication Generic</th>
                        <th className="p-4">Patient Assignment Bed</th>
                        <th className="p-4">Status Flag</th>
                        <th className="p-4 text-center">Safety Double-Check</th>
                        <th className="p-4 text-right">Nurse Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {medsList.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-600">{med.time}</td>
                          <td className="p-4 font-bold text-slate-800">{med.drug}</td>
                          <td className="p-4 font-semibold text-slate-600">{med.bed}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              med.status === 'Overdue' ? 'bg-rose-50 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {med.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border p-1 rounded uppercase">
                              Verified Allergy-Clean
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              id={`mar-administer-done-${idx}`}
                              onClick={() => {
                                setMedsList(prev => prev.map((m, idx2) => idx2 === idx ? { ...m, status: 'Administered' } : m));
                                onShowNotification(`Signed and administered medication dose: ${med.drug}`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-black uppercase px-3.5 py-1.5 rounded-xl cursor-pointer"
                            >
                              Administer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NURSING NOTES */}
            {activeMenuTab === 'Nursing Notes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="nursing-notes-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Bedside Shift Nursing Notes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Shift handover observation commentaries and nursing notes log.</p>
                  </div>

                  <div className="space-y-3">
                    {patients.filter(p => p.status === 'Admitted').map(p => (
                      <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-slate-350 shadow-xs transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <strong className="text-slate-850 font-bold block">{p.fullName} (Bed {p.admittedBed})</strong>
                          <span className="text-[10px] font-mono text-slate-400">Shift G-01 Ward Note</span>
                        </div>
                        <p className="text-xs text-slate-500 italic font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          Routine wound care and blood pressure observations verified. All lines patent.
                        </p>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-slate-400 font-mono">Auditor logged clinical safety</span>
                          <button
                            id={`nurse-notes-open-${p.id}`}
                            onClick={() => onOpenPatientFile(p.id)}
                            className="text-xs text-emerald-600 hover:underline font-bold"
                          >
                            Add Note
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Shift Notes Compliance</h4>
                    <p className="text-xs text-slate-505 leading-relaxed font-sans">
                      All shift summaries, mobility reports, feeding charts or skin integrity logs must be entered in real-time under patient files.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CARE PLANS */}
            {activeMenuTab === 'Care Plans' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="nurse-care-plans-tab">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3">
                  <div className="flex gap-2 items-center text-emerald-700 border-b pb-2">
                    <Clipboard size={18} />
                    <h3 className="text-sm font-bold text-slate-800">Post-Operative Recovery Plan</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bedside care rules: Check surgical dressing site twice per shift, verify distal pulses, log pain scoring metrics, and supervise initial mobilization cycles with physical therapists.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3">
                  <div className="flex gap-2 items-center text-emerald-700 border-b pb-2">
                    <CheckCircle size={18} />
                    <h3 className="text-sm font-bold text-slate-800">Stroke Rehabilitation &amp; Mobilization</h3>
                  </div>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Bedside care rules: Prevent skin breakdown via 2-hourly turning cycle schedule, execute clean swallowing checks before any solid food administration, and evaluate passive range of motion joints activities.
                  </p>
                </div>
              </div>
            )}

            {/* WARD OVERVIEW */}
            {activeMenuTab === 'Ward Overview' && (
              <div className="space-y-4 font-sans text-xs text-left" id="ward-overview-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800 text-left">Ward G-01 Clinical Metrics Overview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time occupancy rates, nurse duty counts and scheduled patient transitions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  <div className="bg-white border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">General Capacity</span>
                    <strong className="text-2xl text-slate-800 font-extrabold block text-slate-900">24 Beds Available</strong>
                  </div>
                  <div className="bg-white border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">Total Admitted Nurses</span>
                    <strong className="text-2xl text-emerald-700 block text-emerald-750">6 Active</strong>
                  </div>
                  <div className="bg-white border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">Awaiting Admissions</span>
                    <strong className="text-2xl text-slate-800 block">3 Patients</strong>
                  </div>
                  <div className="bg-white border p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">Scheduled Discharges</span>
                    <strong className="text-2xl text-slate-800 block">2 Patients</strong>
                  </div>
                </div>
              </div>
            )}

            {/* BED MANAGEMENT */}
            {activeMenuTab === 'Bed Management' && (
              <div className="space-y-4 text-left" id="bed-management-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl text-left">
                  <h3 className="text-sm font-bold text-slate-800">Interactive Bed Assignment &amp; Transfers</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage patient bed placements, transfers, and discharge coordinates in General Ward G-01.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="p-4">Bed Reference</th>
                        <th className="p-4">Occupancy Status</th>
                        <th className="p-4">Admitted Patient Record</th>
                        <th className="p-4">Ward Section</th>
                        <th className="p-4 text-right">Emergency Transfer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {beds.map((bed, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-emerald-700">{bed.bedNumber}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              bed.isOccupied ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-750'
                            }`}>
                              {bed.isOccupied ? 'OCCUPIED' : 'VACANT READY'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-850">
                            {patients.find(p=>p.admittedBed === bed.bedNumber)?.fullName || (bed.isOccupied ? "Bob Vance" : "None Allocated")}
                          </td>
                          <td className="p-4 text-slate-400 font-mono">Section {bed.bedNumber.startsWith('G-0') ? 'A (Criticals)' : 'B (General)'}</td>
                          <td className="p-4 text-right">
                            <button
                              id={`bed-action-panel-btn-${idx}`}
                              onClick={() => {
                                const matchedP = patients.find(p=>p.admittedBed === bed.bedNumber);
                                if (matchedP) {
                                  onOpenPatientFile(matchedP.id);
                                } else {
                                  onShowNotification("Admit patient via Dashboard Quick Vitals form first to assign bed coordinates.");
                                }
                              }}
                              className="text-emerald-750 hover:underline font-black font-sans text-xs cursor-pointer text-emerald-600"
                            >
                              Manage Placement &gt;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SHIFT HANDOVER */}
            {activeMenuTab === 'Shift Handover' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="shift-handover-tab">
                <div className="lg:col-span-2 space-y-4 animate-fade-in animate-pulse">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Shift Transition Logs</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Logged handovers submitted between supervisor nurses.</p>
                  </div>

                  <div className="space-y-3">
                    {handoversList.map((ho, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2 hover:border-slate-350 transition-all text-xs">
                        <div className="flex justify-between items-center text-slate-400 font-mono border-b pb-1">
                          <span>From: <strong className="text-slate-800 font-sans">{ho.senderName}</strong></span>
                          <span>To: <strong className="text-slate-800 font-sans">{ho.receiverName}</strong></span>
                        </div>
                        <p className="text-slate-605 text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">{ho.handoverSummary}</p>
                        <p className="text-[10px] text-right text-slate-400 font-mono">{ho.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 border border-indigo-100 p-5 rounded-2xl">
                    <h4 className="text-xs font-bold text-indigo-800 uppercase font-mono tracking-wider">Handover Guidelines</h4>
                    <p className="text-[11px] text-indigo-600 leading-relaxed font-sans mt-2">
                      Ensure all critical vitals, patient alarms, or high-alert scheduled medication administrations are thoroughly briefed to incoming nursing teams.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {activeMenuTab === 'Messages' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in" id="messages-tab">
                <div className="lg:col-span-2 space-y-4 text-xs">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Bedside Clinical Intercom Messages</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Direct messaging channel linked to laboratory scientists, ward supervisors, and on-duty doctors.</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3.5">
                    {[
                      { from: "Dr. House", role: "Primary Physician", text: "Please prep Bed G-12 Jane Brown for urgent lumbar scan and complete HbA1c panel sample collection.", time: "10 mins ago" },
                      { from: "Lab Scientist", role: "Biochemistry Supervisor", text: "HbA1c complete blood panel released digitally. Please access EHR chart for HIS-3044.", time: "25 mins ago" },
                    ].map((msg, idx) => (
                      <div key={idx} className="bg-slate-50 border p-3.5 rounded-2xl text-left hover:bg-slate-100 transition-all space-y-1">
                        <div className="flex justify-between items-center text-slate-400 font-mono">
                          <span>From: <strong className="text-slate-800 font-sans">{msg.from} ({msg.role})</strong></span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-sans">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Send Intercom Msg</h4>
                    <textarea 
                      placeholder="Type urgent paging memo here..."
                      className="w-full text-xs p-3 border rounded-xl h-20 resize-none focus:outline-none"
                    />
                    <button 
                      onClick={() => onShowNotification("Intercom clinical memo broadcasted to duty staff pager.")}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-700 font-sans text-xs uppercase"
                    >
                      Broadcast Memo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeMenuTab === 'Notifications' && (
              <div className="space-y-4 text-left" id="notifications-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl text-left">
                  <h3 className="text-sm font-bold text-slate-800">Critical Alarms &amp; Notifications Feed</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ward alert telemetry tracking. Alarms trigger when critical vitals fall outside normal ranges.</p>
                </div>

                <div className="space-y-3">
                  {alerts.map((al, idx) => (
                    <div key={idx} className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl flex justify-between items-start text-xs">
                      <div className="flex gap-3 items-center">
                        <AlertTriangle className="text-rose-600 shrink-0" size={16} />
                        <div>
                          <h4 className="font-extrabold text-slate-800">{al.patient}</h4>
                          <em className="text-slate-500 mt-0.5 not-italic font-sans font-semibold">{al.msg}</em>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{al.stamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeMenuTab === 'Reports' && (
              <div className="space-y-4 text-left font-sans" id="nurse-reports-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800">Ward Supervisor Shifts Workload Logs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">HIPAA compliant activity summaries, bed occupancies, and MAR medicine administration audits.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-xs">
                  <div className="bg-white border p-4 rounded-xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Shift Patient Load</span>
                    <strong className="text-xl font-extrabold block">21 Active Bed-Days</strong>
                  </div>
                  <div className="bg-white border p-4 rounded-xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest block font-bold">MAR Round Complete</span>
                    <strong className="text-xl font-extrabold text-emerald-700 block text-emerald-800">98% Compliance</strong>
                  </div>
                  <div className="bg-white border p-4 rounded-xl space-y-1 hover:border-slate-350 shadow-xs transition-colors">
                    <span className="text-[9.5px] font-mono text-slate-400 block font-bold uppercase tracking-widest text-slate-400">Handover Notes Signed</span>
                    <strong className="text-xl font-extrabold text-indigo-700 block">4 Shifts Compiled</strong>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIT LOGS */}
            {activeMenuTab === 'Audit Logs' && (
              <div className="space-y-4" id="audit-logs-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center text-left">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Bedside Clinical Audit Trails</h3>
                    <p className="text-xs text-slate-400 mt-0.5">St Jude EHR secure audit ledger. HIPAA compliance logs monitor all observations and drug edits.</p>
                  </div>
                  <span className="bg-emerald-50 text-[#047857] px-3.5 py-1.5 rounded-full font-mono text-[9.5px] font-bold border border-emerald-100 uppercase">
                    HIPAA Audited Secure Node
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs text-left">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="p-4">Action Timestamp</th>
                        <th className="p-4">Staff Nurse Signature</th>
                        <th className="p-4">EHR Folder Patient</th>
                        <th className="p-4">Audit Action Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-600 font-medium">
                      <tr>
                        <td className="p-4">2026-06-22 08:35:12</td>
                        <td className="p-4 text-slate-800">Florence Nightingale</td>
                        <td className="p-4 font-bold text-emerald-700">HIS-1001 (Robert Kelly)</td>
                        <td className="p-4 text-[9.5px]">BEDSIDE VITALS LOGGED — SECURE CHANNEL</td>
                      </tr>
                      <tr>
                        <td className="p-4">2026-06-22 08:12:00</td>
                        <td className="p-4 text-slate-800">Florence Nightingale</td>
                        <td className="p-4 font-bold text-emerald-700">HIS-2022 (Jane Doe)</td>
                        <td className="p-4 text-[9.5px]">MEDICATION ROUND ADMINISTERED — SIGNED RX</td>
                      </tr>
                      <tr>
                        <td className="p-4">2026-06-22 07:45:33</td>
                        <td className="p-4 text-slate-800">Florence Nightingale</td>
                        <td className="p-4 font-bold text-emerald-700">HIS-3044 (John Smith)</td>
                        <td className="p-4 text-[9.5px]">SHIFT HANDOVER NOTES SUBMITTED — SECURE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
