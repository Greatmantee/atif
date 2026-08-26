/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Search, Bell, Shield, Calendar, Clock, CheckCircle, 
  AlertTriangle, ArrowRight, UserCheck, MessageSquare, Clipboard, Layers, 
  UserCheck as UserCheckIcon, Settings, LogOut, ChevronRight, Eye, Send, Check, Plus,  
  BookOpen, FileText, Beaker, Image as ImageIcon, Pill, CreditCard, ChevronDown, RefreshCw,
  Menu, X
} from 'lucide-react';
import { Patient, LabRequest, LabStatus, RadiologyRequest, RadStatus, Prescription, PrescriptionStatus } from '../types';

interface DoctorDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (patientId: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function DoctorDashboardView({ 
  currentUser, 
  patients, 
  onRefresh, 
  onOpenPatientFile,
  onShowNotification 
}: DoctorDashboardViewProps) {

  // Sidebar navigation active state
  const [activeMenuTab, setActiveMenuTab] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'Critical lab alert: John Doe (HIS-1001) has critical potassium value.', time: '09:25 AM', read: false },
    { id: '2', text: 'New prescription request from Nurse Florence for Patient HIS-1002.', time: '09:10 AM', read: false },
    { id: '3', text: 'Consultation scheduling synchronized with central reception.', time: '08:45 AM', read: true },
    { id: '4', text: 'Controlled substance audit logs certified for Ward G-01.', time: '08:15 AM', read: false },
    { id: '5', text: 'Security authorization key validated successfully.', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Search input
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');

  // Selected date displayed in header picker
  const [selectedDate, setSelectedDate] = useState<string>('May 29, 2026');

  // Interactive quick action overlay states
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null); // 'consult' | 'lab' | 'rad' | 'rx' | 'admit' | 'discharge'
  const [actionPatientId, setActionPatientId] = useState<string>('');

  // Form states for quick actions
  const [consultNoteText, setConsultNoteText] = useState<string>('');
  const [labRequestedName, setLabRequestedName] = useState<string>('HbA1c Glycated Hemoglobin');
  const [radRequestedType, setRadRequestedType] = useState<string>('X-Ray Chest PA View');
  const [rxDrugName, setRxDrugName] = useState<string>('');
  const [rxDosage, setRxDosage] = useState<string>('500mg');
  const [rxFreq, setRxFreq] = useState<string>('BD (twice daily)');
  const [rxRoute, setRxRoute] = useState<string>('Oral');
  const [rxDuration, setRxDuration] = useState<string>('5 days');
  
  // Admission states
  const [admitWardName, setAdmitWardName] = useState<string>('General Medicine Ward - G-01');
  const [admitBedNumber, setAdmitBedNumber] = useState<string>('G-05');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reminders check list state
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Review 12 pending lab results', checked: false },
    { id: 2, text: 'Review 7 pending imaging results', checked: false },
    { id: 3, text: '3 prescriptions need follow-up', checked: false },
    { id: 4, text: '2 patients awaiting discharge', checked: false },
    { id: 5, text: 'Update care plans for chronic patients', checked: false },
  ]);

  const [allPrescriptions, setAllPrescriptions] = useState<any[]>([]);
  const [allLabRequests, setAllLabRequests] = useState<any[]>([]);
  const [allRadiologyRequests, setAllRadiologyRequests] = useState<any[]>([]);

  const fetchDoctorData = async () => {
    try {
      const rx = await fetch('/api/prescriptions').then(r => r.json());
      if (rx.prescriptions) setAllPrescriptions(rx.prescriptions);
      
      const lab = await fetch('/api/lab/requests').then(r => r.json());
      if (lab.requests) setAllLabRequests(lab.requests);

      const rad = await fetch('/api/radiology/requests').then(r => r.json());
      if (rad.requests) setAllRadiologyRequests(rad.requests);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [activeMenuTab, patients]);

  useEffect(() => {
    if (patients.length > 0 && !actionPatientId) {
      const defaultPat = patients[0];
      if (defaultPat) setActionPatientId(defaultPat.id);
    }
  }, [patients]);

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  };

  // Perform a new clinic consultation clinical note action
  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId || !consultNoteText) {
      onShowNotification("Please provide a patient ID and consulting note text.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${actionPatientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText: consultNoteText })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification("Consultation clinical report committed and security audited.");
        setConsultNoteText('');
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Error committing report: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Laboratory analytic analysis
  const handleOrderLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lab/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: actionPatientId,
          testName: labRequestedName
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Pathology laboratory test order (${labRequestedName}) issued successfully.`);
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Lab error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Radiology imaging
  const handleOrderRadiology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/radiology/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: actionPatientId,
          imagingType: radRequestedType
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`PACS Radiology capture (${radRequestedType}) ordered successfully.`);
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Radiology issue: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Write new patient drug Prescription
  const handleWritePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId || !rxDrugName) {
      onShowNotification("Please complete medication drug details.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: actionPatientId,
          medication: rxDrugName,
          dosage: rxDosage,
          frequency: rxFreq,
          route: rxRoute,
          duration: rxDuration
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Authorized clinical prescription for ${rxDrugName} created.`);
        setRxDrugName('');
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Rx error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admit patient to ward asset
  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${actionPatientId}/admission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admit',
          wardName: admitWardName,
          bedNumber: admitBedNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Patient assigned ward admission: ${admitWardName} Bed ${admitBedNumber}.`);
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Admission issue: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discharged patient files release
  const handleDischargePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPatientId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${actionPatientId}/admission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discharge' })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Released patient file from ward occupancy allocation.`);
        setActiveActionModal(null);
        onRefresh();
      }
    } catch (err: any) {
      onShowNotification("Discharge issue: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clinical listings based on search box
  const globalFilterPatients = patients.filter(p => {
    const q = localSearchQuery.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
  });

  // Sidebar list matching attached image
  const sidebarMenuOptions = [
    { name: 'Dashboard', icon: <Activity size={15} />, section: 'MAIN' },
    { name: 'Clinic Queue', icon: <Clock size={15} />, section: 'MAIN' },
    { name: 'My Patients', icon: <Users size={15} />, section: 'MAIN' },
    { name: 'Global Patients', icon: <Users size={15} />, section: 'MAIN', badge: 'NEW' },
    { name: 'Appointments', icon: <Calendar size={15} />, section: 'MAIN' },
    { name: 'Patient Search', icon: <Search size={15} />, section: 'CLINICAL' },
    { name: 'Consultations', icon: <Clipboard size={15} />, section: 'CLINICAL' },
    { name: 'Clinical Notes', icon: <FileText size={15} />, section: 'CLINICAL' },
    { name: 'Diagnoses', icon: <Layers size={15} />, section: 'CLINICAL' },
    { name: 'Lab Requests', icon: <Beaker size={15} />, section: 'REQUESTS' },
    { name: 'Imaging Requests', icon: <ImageIcon size={15} />, section: 'REQUESTS' },
    { name: 'Prescriptions', icon: <Pill size={15} />, section: 'TREATMENT' },
    { name: 'Care Plans', icon: <Clipboard size={15} />, section: 'TREATMENT' },
    { name: 'Reports', icon: <Clipboard size={15} />, section: 'ADMIN' },
    { name: 'Analytics', icon: <Activity size={15} />, section: 'ADMIN' },
  ];

  return (
    <div className="flex bg-[#F8FAFC] min-h-[85vh] rounded-3xl overflow-hidden border border-slate-200 mt-4 shadow-sm relative" id="doctor-dashboard-workspace">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 1. STICKY SIDEBAR NAVIGATION */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-150 flex flex-col justify-between shrink-0 text-left font-sans select-none p-4 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="doctor-sidebar">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#0284C7] text-white rounded-lg">
                <span className="font-mono font-black text-sm">StJ</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-700 tracking-tight block font-sans">St. Jude Medical</span>
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
            {['MAIN', 'CLINICAL', 'REQUESTS', 'TREATMENT', 'ADMIN'].map(sectionName => {
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
                            ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]/80 font-bold'
                            : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span className="font-bold text-[11px] font-sans">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-[#10B981] text-white text-[8.5px] font-black font-mono tracking-wider">
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

        {/* Footer identity tag */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-sky-600 tracking-wider">DOCTOR WORKSPACE</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
            <div className="text-left min-w-0">
              <p className="text-[10.5px] font-bold text-slate-800 leading-tight truncate">Dr. Gregory House</p>
              <p className="text-[9px] text-slate-400 font-mono">Physician Consultant</p>
            </div>
            <span className="text-xs text-slate-400">#001</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN SUB-PANEL AREA */}
      <main className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[85vh] text-left">
        
        {/* HEADER SECTION */}
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
              <h2 className="text-2xl font-black text-slate-900 tracking-tight" id="doctor-welcome-header">
                Doctor Dashboard
              </h2>
              <p className="text-xs text-slate-500 tracking-wide mt-1">
                Good morning, Dr. Gregory House <span className="font-mono text-[11px] text-xs font-semibold pl-2 text-slate-400 border-l border-slate-200">Operator ID: dr_house</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search patients by name, ID, MR... (Ctrl + K)"
                value={localSearchQuery}
                onChange={e => {
                  setLocalSearchQuery(e.target.value);
                  if (activeMenuTab !== 'Global Patients' && activeMenuTab !== 'Dashboard') {
                    setActiveMenuTab('Global Patients');
                  }
                }}
                className="w-full bg-white border border-slate-200 text-xs py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:border-sky-500 transition-colors font-sans"
              />
            </div>
            
            <div className="flex items-center gap-1 border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-600 bg-white self-stretch hover:bg-slate-50 relative">
              <Calendar size={13} className="text-slate-400" />
              <span>{selectedDate}</span>
              <ChevronDown size={12} className="text-slate-400" />
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
            
            {/* KPI STATISTICAL GRID CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="kpi-statistics-grid">
              {[
                { label: "Today's Patients", val: '18', sub: '+4 from yesterday', subColor: 'text-[#0284C7]' },
                { label: 'In Consultation', val: '5', sub: 'View queue', subColor: 'text-[#0369A1] hover:underline cursor-pointer' },
                { label: 'Lab Results', val: '12', sub: 'Pending review', subColor: 'text-slate-400 font-semibold' },
                { label: 'Imaging Results', val: '7', sub: 'Pending review', subColor: 'text-slate-400 font-semibold' },
                { label: 'Critical Alerts', val: '3', sub: 'Requires attention', subColor: 'text-rose-500 font-bold' }
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
              
              {/* LEFT/MAIN COLUMN (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* CONSULTATION QUEUE */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="consultation-queue">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Consultation Queue</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Active patients checked-in today</p>
                    </div>
                    <button 
                      onClick={() => setActiveMenuTab('Clinic Queue')}
                      className="text-sky-600 hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      View full queue &gt;
                    </button>
                  </div>

                  <div className="space-y-2.5 text-left">
                    {[
                      { name: 'Senator Arthur Vance', age: '45 yrs', gender: 'Male', dept: 'General Medicine', status: 'Checked In', time: '08:15 AM' },
                      { name: 'Dr. Margaret Stone', age: '62 yrs', gender: 'Female', dept: 'Waiting', status: 'Waiting', time: '08:30 AM' },
                      { name: 'Zendaya Coleman', age: '28 yrs', gender: 'Female', dept: 'General Medicine', status: 'Checked In', time: '08:45 AM' },
                      { name: 'Thomas A. Anderson', age: '30 yrs', gender: 'Male', dept: 'New Patient', status: 'Purple Alert', time: '09:00 AM' },
                      { name: 'Warrant Officer Ellen Ripley', age: '42 yrs', gender: 'Female', dept: 'General Medicine', status: 'Checked In', time: '09:15 AM' }
                    ].map((pat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0369A1] text-xs shrink-0">
                            {pat.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block leading-tight">{pat.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{pat.age}, {pat.gender}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider ${
                            pat.dept === 'Waiting' 
                              ? 'bg-amber-105 bg-amber-50 text-amber-700' 
                              : pat.dept === 'New Patient' 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : 'bg-slate-100 text-slate-655 text-slate-600'
                          }`}>
                            {pat.dept}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">{pat.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TWO COLUMN GRID : PENDING LAB RESULTS & PENDING IMAGING */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* PENDING LAB RESULTS */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-850 text-slate-800">Pending Lab Results</h3>
                      <button onClick={() => setActiveMenuTab('Lab Requests')} className="text-sky-600 font-bold text-[11px] hover:underline cursor-pointer">View All</button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { patient: 'Mary Smith', tests: 'CBC, UEC, LFT', date: 'May 28', pri: 'High Priority' },
                        { patient: 'James Brown', tests: 'HbA1c, FBS', date: 'May 28', pri: 'High Priority' },
                        { patient: 'Linda Johnson', tests: 'CRP, ESR', date: 'May 28', pri: 'Normal Priority' },
                        { patient: 'Robert Wilson', tests: 'ABG, Electrolytes', date: 'May 27', pri: 'Normal Priority' }
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-start text-xs hover:bg-slate-100/60 transition-colors">
                          <div className="text-left font-sans">
                            <strong className="text-slate-800 block text-xs font-bold leading-tight">{item.patient}</strong>
                            <span className="text-[10px] text-slate-500 font-mono tracking-tight block mt-1">{item.tests}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">Requested: {item.date}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-wider ${
                            item.pri === 'High Priority' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.pri}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PENDING IMAGING RESULTS */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-850 text-slate-800">Pending Imaging Results</h3>
                      <button onClick={() => setActiveMenuTab('Imaging Requests')} className="text-sky-600 font-bold text-[11px] hover:underline cursor-pointer">View All</button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { patient: 'John Doe', image: 'Chest X-Ray', date: 'May 29', pri: 'High Priority' },
                        { patient: 'Mary Smith', image: 'ECG', date: 'May 28', pri: 'Normal Priority' },
                        { patient: 'James Brown', image: 'Abdominal Ultrasound', date: 'May 28', pri: 'Normal Priority' }
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-start text-xs hover:bg-slate-100/60 transition-colors">
                          <div className="text-left font-sans">
                            <strong className="text-slate-800 block text-xs font-bold leading-tight">{item.patient}</strong>
                            <span className="text-[10px] text-slate-500 font-mono tracking-tight block mt-1">{item.image}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">Requested: {item.date}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-wider ${
                            item.pri === 'High Priority' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.pri}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RECENT CONSULTATIONS */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="recent-consults-table">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Recent Consultations</h3>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans">Direct access to patient medical registries</p>
                    </div>
                    <button 
                      onClick={() => setActiveMenuTab('Consultations')}
                      className="text-[#0369A1] hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      View all consultations
                    </button>
                  </div>

                  <div className="overflow-x-auto min-w-full">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-[#F8FAFC] text-slate-400 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-200 font-mono">
                        <tr>
                          <th className="py-3 px-4">Patient</th>
                          <th className="py-3 px-4">Age / Sex</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Diagnosis</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Last Visit</th>
                          <th className="py-3 px-4 text-center">Chart</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-750">
                        {patients.slice(0, 5).map((p, i) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{p.fullName}</td>
                            <td className="py-3.5 px-4">
                              {p.dob ? `${new Date().getFullYear() - new Date(p.dob).getFullYear()}` : '38'}&nbsp;/&nbsp;
                              {p.gender === 'Male' ? 'M' : p.gender === 'Female' ? 'F' : 'O'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-sans">
                              {i % 2 === 0 ? 'Consultation' : 'Follow Up'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] uppercase text-slate-550">
                              {p.diagnoses?.[0] || 'Observe Baseline'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                i === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-705 text-emerald-700'
                              }`}>
                                {i === 1 ? 'In Progress' : 'Completed'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">May 29, 08:00 AM</td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => onOpenPatientFile(p.id)}
                                className="p-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-medium font-sans flex items-center gap-1 mx-auto cursor-pointer"
                                title="Open Patient EHR File"
                              >
                                <Eye size={12} />
                                <span className="text-[10px]">Access</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT SIDEBAR COLUMN */}
              <div className="space-y-6">
                
                {/* TODAY'S SCHEDULE TIMELINE */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs text-left" id="todays-schedule">
                  <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Today's Schedule</h3>
                    <button onClick={() => setActiveMenuTab('Appointments')} className="text-sky-600 hover:underline text-[11.5px] font-bold cursor-pointer">View Full</button>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    {[
                      { time: '08:00 AM - 08:20 AM', type: 'Consultation', title: 'Senator Arthur Vance', badge: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
                      { time: '08:30 AM - 08:50 AM', type: 'Follow Up', title: 'Dr. Margaret Stone', badge: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
                      { time: '08:45 AM - 09:05 AM', type: 'Consultation', title: 'Zendaya Coleman', badge: 'Upcoming', color: 'bg-amber-100 text-amber-800' },
                      { time: '09:00 AM - 09:20 AM', type: 'New Patient', title: 'Thomas A. Anderson', badge: 'Upcoming', color: 'bg-amber-100 text-amber-800' },
                      { time: '09:15 AM - 09:35 AM', type: 'Consultation', title: 'Ellen Ripley', badge: 'Upcoming', color: 'bg-amber-100 text-amber-800' }
                    ].map((sched, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="font-mono text-[9px] text-slate-400 font-semibold">{sched.time}</span>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">{sched.type}</span>
                            <strong className="text-slate-850 font-bold block text-xs truncate max-w-[140px] text-slate-800">{sched.title}</strong>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono tracking-wide font-black ${sched.color}`}>
                            {sched.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CLINICAL ACTION CENTER (QUICK ACTIONS LIST) */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs" id="quick-action-cards">
                  <div className="pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">My Actions</h3>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Quick order placement</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'consult', title: 'New Consultation', sTitle: 'Start new patient consultation', icon: <FileText size={16} />, color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/50' },
                      { id: 'lab', title: 'Request Lab Test', sTitle: 'Create laboratory request', icon: <Beaker size={16} />, color: 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100/50' },
                      { id: 'rad', title: 'Request Imaging', sTitle: 'Create radiology request', icon: <ImageIcon size={16} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50' },
                      { id: 'rx', title: 'Write Prescription', sTitle: 'Create new prescription', icon: <Pill size={16} />, color: 'bg-indigo-50 border-indigo-200 text-indigo-705 text-indigo-700 hover:bg-indigo-100/50' },
                      { id: 'admit', title: 'Admit Patient', sTitle: 'Admission request', icon: <UserCheckIcon size={16} />, color: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100/50' },
                      { id: 'discharge', title: 'Discharge Patient', sTitle: 'Create discharge summary', icon: <LogOut size={16} />, color: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/50' }
                    ].map(card => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setActiveActionModal(card.id);
                        }}
                        className={`w-full p-3 border rounded-xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${card.color}`}
                      >
                        <div className="p-2 bg-white rounded-xl shadow-xs">
                          {card.icon}
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold block text-slate-800">{card.title}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{card.sTitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CLINICAL REMINDERS */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-xs text-left" id="clinical-reminders">
                  <div className="pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 font-sans">Clinical Reminders</h3>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    {reminders.map(rem => (
                      <div key={rem.id} className="flex items-start gap-3 p-1 hover:bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={rem.checked}
                          onChange={() => {
                            toggleReminder(rem.id);
                            onShowNotification(`Reminder action updated.`);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-sky-650 focus:ring-sky-550 h-3.5 w-3.5 cursor-pointer accent-sky-600"
                        />
                        <span className={`font-bold leading-tight select-none ${rem.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {rem.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 4. OTHER SUBTAB VIEWS IMPLEMENTED FOR DOCTOR ACCESIBILITY */}

        {activeMenuTab === 'Global Patients' && (
          <div className="mt-6 space-y-4 animate-fade-in" id="global-patients-tab-content">
            <div className="p-4 bg-sky-50 text-sky-800 border border-sky-200 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <Shield size={16} />
              <span>Full clinical file access enabled across all hospital directories. Standard HIPPA logging actively tracks visits.</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Hospital Directory</span>
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
                      <th className="p-4 text-center">Security Status</th>
                      <th className="p-4 text-right">Observation Chart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {globalFilterPatients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#0284C7]">{p.id}</td>
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
                            className="text-[#0284C7] hover:underline text-xs font-bold font-sans cursor-pointer"
                          >
                            Explore EHR &gt;
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

        {/* ACTIVE MODULATOR DIALOG OVERLAYS FOR THE QUICK ACTIONS */}
        {activeActionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="action-portal-modal">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <div>
                  <span className="text-[9px] font-mono font-bold text-sky-600 uppercase tracking-widest block">Action Form</span>
                  <h3 className="text-md font-bold text-slate-800 mt-1 uppercase font-mono">
                    {activeActionModal === 'consult' ? 'Clinical Consult Note Entry' : 
                     activeActionModal === 'lab' ? 'Laboratory Pathology Order' :
                     activeActionModal === 'rad' ? 'PACS Radiology Order' :
                     activeActionModal === 'rx' ? 'New Medication Prescription' :
                     activeActionModal === 'admit' ? 'Ward Asset Admission' : 'Release Patient File'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="p-1 px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-550 text-xs font-bold font-sans rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="p-6 text-left">
                
                {/* SELECT CLINICAL TARGET PATIENT */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase">Patient File Target</label>
                    <select
                      value={actionPatientId}
                      onChange={e => setActionPatientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl focus:outline-none font-sans"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.id}) - {p.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeActionModal === 'consult' && (
                    <form onSubmit={handleCreateConsultation} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Comprehensive Consult Note</label>
                        <textarea
                          required
                          placeholder="State clinical symptoms, physical examinations, working differential diagnoses, and plan..."
                          value={consultNoteText}
                          onChange={e => setConsultNoteText(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-3.5 rounded-2xl h-36 resize-none focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-sky-600 hover:bg-sky-700 font-sans font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Committing note...' : 'Commit Note & Audit'}
                      </button>
                    </form>
                  )}

                  {activeActionModal === 'lab' && (
                    <form onSubmit={handleOrderLab} className="space-y-4 font-sans text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Pathology Analysis Target</label>
                        <select
                          value={labRequestedName}
                          onChange={e => setLabRequestedName(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl cursor-pointer"
                        >
                          <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                          <option value="CBC with Diff (Hemogram)">CBC with Diff (Hemogram)</option>
                          <option value="UEC Electrolytes & Kidney Profile">UEC Electrolytes & Kidney Profile</option>
                          <option value="LFT Hepatic Enzyme Analysis">LFT Hepatic Enzyme Analysis</option>
                          <option value="Lipid Profile Cholesterol Metrics">Lipid Profile Cholesterol Metrics</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-sky-600 hover:bg-sky-700 font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Ordering test...' : 'Issue Pathology Order'}
                      </button>
                    </form>
                  )}

                  {activeActionModal === 'rad' && (
                    <form onSubmit={handleOrderRadiology} className="space-y-4 font-sans text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Imaging Scan PA view</label>
                        <select
                          value={radRequestedType}
                          onChange={e => setRadRequestedType(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl cursor-pointer"
                        >
                          <option value="X-Ray Chest PA View">X-Ray Chest PA View</option>
                          <option value="MRI Brain Sagittal T1/T2">MRI Brain Sagittal T1/T2</option>
                          <option value="CT Abdomen & Pelvis with Contrast">CT Abdomen & Pelvis with Contrast</option>
                          <option value="Ultrasound Abdomen & Liver scan">Ultrasound Abdomen & Liver scan</option>
                          <option value="ECG Cardiology Grid">ECG Cardiology Grid</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-sky-600 hover:bg-sky-700 font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Ordering scan...' : 'Issue Radiology Order'}
                      </button>
                    </form>
                  )}

                  {activeActionModal === 'rx' && (
                    <form onSubmit={handleWritePrescription} className="space-y-4 font-sans text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-extrabold uppercase">Drug Molecule / Generic name</label>
                        <input
                          type="text" required placeholder="Aspirin / Metformin / Ceftriaxone..."
                          value={rxDrugName} onChange={e => setRxDrugName(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Dosage</label>
                          <input
                            type="text" value={rxDosage} onChange={e=>setRxDosage(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Frequency</label>
                          <select
                            value={rxFreq} onChange={e=>setRxFreq(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-center cursor-pointer"
                          >
                            <option value="QD (once daily)">QD (once daily)</option>
                            <option value="BD (twice daily)">BD (twice daily)</option>
                            <option value="TDS (three times daily)">TDS (three times daily)</option>
                            <option value="QDS (four times daily)">QDS (four times daily)</option>
                            <option value="PRN (as required)">PRN (as required)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Route</label>
                          <select 
                            value={rxRoute} onChange={e=>setRxRoute(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-center cursor-pointer"
                          >
                            <option value="Oral">Oral</option>
                            <option value="Intravenous (IV)">Intravenous (IV)</option>
                            <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                            <option value="Inhalation">Inhalation</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Duration</label>
                          <input
                            type="text" value={rxDuration} onChange={e=>setRxDuration(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-center"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0284C7] hover:bg-sky-700 font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Signing Rx...' : 'Sign Prescription Rx'}
                      </button>
                    </form>
                  )}

                  {activeActionModal === 'admit' && (
                    <form onSubmit={handleAdmitPatient} className="space-y-4 font-sans text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Ward Room</label>
                        <select
                          value={admitWardName}
                          onChange={e => setAdmitWardName(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl cursor-pointer"
                        >
                          <option value="General Medicine Ward - G-01">General Medicine Ward - G-01</option>
                          <option value="Cardiology Care Segment">Cardiology Care Segment</option>
                          <option value="Paediatrics Inpatient">Paediatrics Inpatient</option>
                          <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Bed Register Allocation</label>
                        <input
                          type="text" required placeholder="G-05"
                          value={admitBedNumber} onChange={e => setAdmitBedNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl font-mono text-center font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAdmitPatient}
                        className="w-full bg-[#0284C7] hover:bg-sky-700 font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Assigning Bed...' : 'Admit Patient To Ward'}
                      </button>
                    </form>
                  )}

                  {activeActionModal === 'discharge' && (
                    <form onSubmit={handleDischargePatient} className="space-y-4 font-sans text-xs">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                        Confirm clinical release for the selected patient? Outstanding ward allocations and bed telemetry registers will be discharged immediately.
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-rose-600 hover:bg-rose-700 font-bold text-white text-xs py-3 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {isSubmitting ? 'Discharging...' : 'Confirm Clinical Discharge'}
                      </button>
                    </form>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. CLINIC SUBVIEWS TO REPLACE PLACEHOLDERS FOR HIGH FIDELITY SCOPE */}
        {activeMenuTab !== 'Dashboard' && activeMenuTab !== 'Global Patients' && (
          <div className="mt-6 space-y-6 animate-fade-in" id="doctor-subview-panel">
            
            {/* CLINIC QUEUE */}
            {activeMenuTab === 'Clinic Queue' && (
              <div className="space-y-4" id="clinical-queue-tab">
                <div className="flex justify-between items-center bg-white p-5 border border-slate-200 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Clinic Wait Room Queue</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Patients currently checked-in and awaiting active clinical consultation.</p>
                  </div>
                  <span className="bg-sky-50 text-sky-700 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-sky-200">
                    {patients.filter(p => p.status === 'Checked In' || p.status === 'In Consultation').length} Active Patients
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                        <tr>
                          <th className="p-4">Patient ID</th>
                          <th className="p-4">Full Name</th>
                          <th className="p-4">DOB / Age</th>
                          <th className="p-4">Classification</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Allergies</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {patients.filter(p => p.status === 'Checked In' || p.status === 'In Consultation').map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-sky-600">{p.id}</td>
                            <td className="p-4 font-bold text-slate-800">{p.fullName}</td>
                            <td className="p-4 font-mono">{p.dob}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                p.isVip ? 'bg-indigo-100 text-indigo-700' : p.isStaff ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {p.isVip ? 'VIP SENATE' : p.isStaff ? 'HOSP STAFF' : 'GENERAL'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                p.status === 'In Consultation' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 max-w-[150px] truncate text-slate-500" title={p.allergies.join(', ')}>
                              {p.allergies.length > 0 ? p.allergies.join(', ') : 'None Reported'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                id={`open-patient-chart-button-${p.id}`}
                                onClick={() => onOpenPatientFile(p.id)}
                                className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold font-sans uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer animate-pulse"
                              >
                                Begin Consult
                              </button>
                            </td>
                          </tr>
                        ))}
                        {patients.filter(p => p.status === 'Checked In' || p.status === 'In Consultation').length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                              No awaiting patients in registration queue right now.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MY PATIENTS */}
            {activeMenuTab === 'My Patients' && (
              <div className="space-y-4" id="my-patients-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800">Clinician Assigned Patients</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick folder inventory directory of clinical records assigned to Dr. House.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-left hover:border-sky-350 transition-all flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-sky-600">{p.id}</span>
                            <h4 className="text-sm font-bold text-slate-800 block">{p.fullName}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.isVip ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.isVip ? 'VIP' : 'GEN'}
                          </span>
                        </div>
                        <ul className="text-[11px] space-y-1 text-slate-500 font-mono">
                          <li>• Gender: <span className="text-slate-700 font-sans font-medium">{p.gender}</span></li>
                          <li>• DOB: <span className="text-slate-700">{p.dob}</span></li>
                          <li>• Contact: <span className="text-slate-700">{p.phone}</span></li>
                          <li>• Status: <span className="text-slate-700 font-sans font-medium">{p.status}</span></li>
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-slate-101 mt-4 flex justify-between items-center">
                        <span className="text-[9.5px] text-slate-400 font-mono">St Jude EHR System</span>
                        <button
                          id={`my-patients-view-file-${p.id}`}
                          onClick={() => onOpenPatientFile(p.id)}
                          className="text-sky-600 hover:underline font-bold text-xs"
                        >
                          Access File &gt;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPOINTMENTS */}
            {activeMenuTab === 'Appointments' && (
              <div className="space-y-4" id="appointments-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Consultation Calendar &amp; Schedule</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Today is {selectedDate}. Scheduled out-patient clinic encounters.</p>
                  </div>
                  <span className="bg-sky-50 text-sky-700 font-mono text-[10px] font-extrabold px-3 py-1 rounded-full border border-sky-101">
                    5 Visits Scheduled
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Scheduled Slots</h4>
                    {[
                      { time: "09:00 AM", patient: "Senator Robert Kelly", patientId: "HIS-1001", type: "Urgent VIP Review", status: "Checked In" },
                      { time: "10:30 AM", patient: "Jane Doe", patientId: "HIS-2022", type: "Routine Follow-up", status: "Awaiting Arrival" },
                      { time: "11:15 AM", patient: "John Smith", patientId: "HIS-3044", type: "Lab Diagnostic Review", status: "Checked In" },
                      { time: "02:00 PM", patient: "Alice Cooper", patientId: "HIS-5051", type: "Care Plan Adjustment", status: "Awaiting Arrival" },
                      { time: "03:30 PM", patient: "Bob Dylan", patientId: "HIS-7080", type: "Geriatric Welfare Exam", status: "Awaiting Arrival" },
                    ].map((slot, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-xs">
                        <div className="flex gap-4 items-center flex-1">
                          <span className="px-3 py-1.5 font-mono text-xs font-bold bg-slate-50 border border-slate-202 rounded-xl text-slate-600 min-w-[85px] text-center">
                            {slot.time}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-slate-800">{slot.patient}</h5>
                              <span className="text-[9.5px] font-mono text-slate-400 font-bold">({slot.patientId})</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{slot.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                            slot.status === 'Checked In' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {slot.status}
                          </span>
                          <button
                            id={`appt-access-chart-button-${slot.patientId}`}
                            onClick={() => onOpenPatientFile(slot.patientId)}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 text-slate-650 transition-all cursor-pointer"
                            title="Open patient EHR"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MINI CALENDAR & COMPLIANCE WIDGET */}
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-800 border-b pb-2">Calendar Quick Controls</h4>
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] mt-3 font-mono">
                        {['S','M','T','W','T','F','S'].map((d, idx) => (
                          <span key={idx} className="font-extrabold text-slate-400 uppercase">{d}</span>
                        ))}
                        {Array.from({ length: 31 }).map((_, d) => (
                          <span key={d} className={`p-1 rounded-md text-center cursor-pointer ${
                            d === 28 ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-600'
                          }`}>
                            {d + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PATIENT SEARCH */}
            {activeMenuTab === 'Patient Search' && (
              <div className="space-y-4" id="patient-search-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl text-left">
                  <h3 className="text-sm font-bold text-slate-800">Dynamic Patient Directory Lookup</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Audit-log tracked query environment for active records catalog.</p>

                  <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                      <input
                        type="text"
                        placeholder="Search patient name, ID, dob, category (VIP, Staff) etc."
                        value={localSearchQuery}
                        onChange={e => setLocalSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 rounded-xl text-xs"
                      />
                    </div>
                    {localSearchQuery && (
                      <button 
                        onClick={() => setLocalSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                        <tr>
                          <th className="p-4">Patient ID</th>
                          <th className="p-4">Full Name</th>
                          <th className="p-4">DOB</th>
                          <th className="p-4">Classification</th>
                          <th className="p-4">Allergies</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4 text-right">EHR Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {patients.filter(p => {
                          if (!localSearchQuery) return true;
                          const q = localSearchQuery.toLowerCase();
                          return p.fullName.toLowerCase().includes(q) ||
                            p.id.toLowerCase().includes(q) ||
                            p.dob.includes(q) ||
                            p.gender.toLowerCase().includes(q);
                        }).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-sky-600">{p.id}</td>
                            <td className="p-4 font-bold text-slate-800">{p.fullName}</td>
                            <td className="p-4 font-mono">{p.dob}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                p.isVip ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {p.isVip ? 'VIP SENATOR' : 'GENERAL'}
                              </span>
                            </td>
                            <td className="p-4 truncate max-w-[130px]">{p.allergies.join(', ') || 'N/A'}</td>
                            <td className="p-4 font-mono">{p.phone}</td>
                            <td className="p-4 text-right">
                              <button
                                id={`search-explore-button-${p.id}`}
                                onClick={() => onOpenPatientFile(p.id)}
                                className="text-sky-600 hover:underline font-bold"
                              >
                                Explore EHR &gt;
                              </button>
                            </td>
                          </tr>
                        ))}
                        {patients.filter(p => {
                          if (!localSearchQuery) return true;
                          const q = localSearchQuery.toLowerCase();
                          return p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                        }).length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                              No clinical folder registers match your query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CONSULTATIONS */}
            {activeMenuTab === 'Consultations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="consultations-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Dynamic Patient Consultations Index</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Chronological list of patient entries logged under consultations.</p>
                  </div>

                  <div className="space-y-3">
                    {patients.map(p => (
                      <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2.5">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div>
                            <span className="text-[10px] font-mono text-sky-600 font-bold block">{p.id}</span>
                            <h4 className="text-xs font-bold text-slate-800">{p.fullName}</h4>
                          </div>
                          <button
                            id={`consults-open-chart-${p.id}`}
                            onClick={() => onOpenPatientFile(p.id)}
                            className="text-xs text-sky-600 hover:underline font-extrabold cursor-pointer"
                          >
                            Add consultation report
                          </button>
                        </div>
                        <div className="text-xs space-y-1.5">
                          <p className="font-semibold text-slate-500">
                            Prevailing Diagnoses: <span className="text-slate-800 font-bold">{p.diagnoses.join(', ') || 'None committed yet.'}</span>
                          </p>
                          <p className="font-semibold text-slate-500">
                            Admission status: <span className="text-slate-700">{p.status}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 border-b pb-2">Consultation Guidelines</h3>
                    <ul className="text-xs text-slate-500 space-y-2 leading-relaxed font-sans">
                      <li>1. All entries must describe symptoms, clinical objective findings, assessments, and diagnostic plans.</li>
                      <li>2. Prescription medicines should be documented via the Treatment index or quick action buttons.</li>
                      <li>3. HIPAA secure telemetry tracks all consult revisions.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* CLINICAL NOTES */}
            {activeMenuTab === 'Clinical Notes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="clinical-notes-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800">Hospital Bedside Note Log</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Chronology of recorded entries linked to patient files.</p>
                  </div>

                  <div className="space-y-3">
                    {patients.map(p => (
                      <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <strong className="text-slate-800 text-xs">{p.fullName} ({p.id})</strong>
                          <span className="text-slate-400">Audit Status: SECURE</span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {p.diagnoses.length > 0 ? `Consulted for: ${p.diagnoses.join(', ')} ...` : "Routine out-patient clinical supervision notes pending."}
                        </p>
                        <div className="flex justify-between items-center pt-1.5 text-[10px] text-sky-600">
                          <span>Recorded by St Jude staff physicians</span>
                          <button
                            id={`notes-open-ehr-${p.id}`}
                            onClick={() => onOpenPatientFile(p.id)}
                            className="underline font-bold cursor-pointer"
                          >
                            Open EHR Note Panel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-sky-800 uppercase font-mono tracking-wider">Fast Bedside Notes</h4>
                    <p className="text-[11px] text-sky-600 leading-relaxed font-sans mt-1">
                      Bedside notes are committed statically under patient files in order of patient observations. Click on any patient EHR to write directly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DIAGNOSES */}
            {activeMenuTab === 'Diagnoses' && (
              <div className="space-y-4" id="diagnoses-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800">EHR Diagnoses &amp; Allergies Directory</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive tracking log mapping patient clinical problems with reported drug allergies.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                        <tr>
                          <th className="p-4">Patient ID</th>
                          <th className="p-4">Full Name</th>
                          <th className="p-4">Prevailing Diagnoses</th>
                          <th className="p-4">Active Allergies</th>
                          <th className="p-4">Admitted Bed</th>
                          <th className="p-4 text-right">EHR Links</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {patients.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-sky-600">{p.id}</td>
                            <td className="p-4 font-bold text-slate-800">{p.fullName}</td>
                            <td className="p-4">
                              <div className="flex gap-1.5 flex-wrap">
                                {p.diagnoses.map((diag, dxIdx) => (
                                  <span key={dxIdx} className="bg-sky-50 text-[#0c4a6e] px-2 py-0.5 rounded text-[10px] font-semibold border border-sky-100">
                                    {diag}
                                  </span>
                                ))}
                                {p.diagnoses.length === 0 && (
                                  <span className="text-slate-400 text-[10px] italic font-mono">No Diagnoses Logged</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[10.5px]">
                              <div className="flex gap-1 flex-wrap">
                                {p.allergies.map((all, alIdx) => (
                                  <span key={alIdx} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {all}
                                  </span>
                                ))}
                                {p.allergies.length === 0 && (
                                  <span className="text-slate-400">None</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono">{p.admittedBed ? `Bed: ${p.admittedBed}` : 'Outpatient'}</td>
                            <td className="p-4 text-right">
                              <button
                                id={`diag-modify-button-${p.id}`}
                                onClick={() => onOpenPatientFile(p.id)}
                                className="text-sky-600 hover:underline font-bold"
                              >
                                Adjust &gt;
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

            {/* LAB REQUESTS */}
            {activeMenuTab === 'Lab Requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="lab-requests-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Diagnostic Laboratory Requisitions</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Order pipeline status checked with laboratory scientists.</p>
                    </div>
                    <button
                      id="dr-order-new-lab-btn"
                      onClick={() => { setActiveActionModal('lab'); }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer font-bold transition-all"
                    >
                      <Plus size={14} /> New Lab Requisition
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full text-left font-sans">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-4">Req-ID</th>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Test Description</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Result Release Notes</th>
                            <th className="p-4">Ordered Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {allLabRequests.map((req, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-sky-600">{req.id}</td>
                              <td className="p-4 font-bold text-slate-700">
                                {patients.find(p=>p.id === req.patientId)?.fullName || req.patientId}
                              </td>
                              <td className="p-4 font-mono text-[10.5px]">{req.testName}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                                  req.status === 'Results Released' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-4 max-w-[150px] truncate font-sans text-slate-600 font-medium">
                                {req.result || "Awaiting Laboratory Analysis"}
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-400">{req.orderedDate}</td>
                            </tr>
                          ))}
                          {allLabRequests.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                                No lab test requests have been ordered currently.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* LAUNCH ORDER ASSISTANT */}
                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl text-left space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Quick Lab Order Guide</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Select any patient inside the main dashboard action menu or search tabs to issue custom biochemical panels, urinalysis checks, PCR assays or complete blood counts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* IMAGING REQUESTS */}
            {activeMenuTab === 'Imaging Requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="imaging-requests-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Radiology PACS Diagnostic Orders</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Status feed of PACS imagery requests, scans, and specialist radiological opinions.</p>
                    </div>
                    <button
                      id="dr-order-new-rad-btn"
                      onClick={() => { setActiveActionModal('rad'); }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer font-bold transition-all"
                    >
                      <Plus size={14} /> New Radiology Order
                    </button>
                  </div>

                  <div className="space-y-3">
                    {allRadiologyRequests.map((req, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-start shadow-xs hover:border-slate-350">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex gap-2 items-center">
                            <span className="font-mono text-[10.5px] text-sky-600 font-extrabold">{req.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase ${
                              req.status === 'Report Signed' ? 'bg-sky-100 text-sky-700' : 'bg-slate-101 text-slate-400'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800">
                            Scan Type: {req.imagingType} — Patient ID: <span className="text-slate-500 font-mono">({req.patientId})</span>
                          </h4>
                          <div className="text-xs text-slate-505 leading-relaxed max-w-md">
                            Findings: <span className="text-slate-705 font-medium">{req.reportText || "Scan and interpretation in progress."}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{req.orderedDate}</span>
                      </div>
                    ))}
                    {allRadiologyRequests.length === 0 && (
                      <div className="p-8 bg-white text-center text-slate-400 border border-slate-202 rounded-2xl font-mono">
                        No radiology orders placed in St Jude currently.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 font-mono uppercase">Clinical Imaging Compliance</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      All diagnostic medical images (MRI, CT, X-Ray PA) are cataloged under DICOM/PACS standards, fully encrypted and routed safely inside secure hospital tunnels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PRESCRIPTIONS */}
            {activeMenuTab === 'Prescriptions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left" id="prescriptions-tab">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Authorized Clinical Prescriptions</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Dispensation and administration checks issued on the clinical floor.</p>
                    </div>
                    <button
                      id="dr-write-rx-btn"
                      onClick={() => { setActiveActionModal('rx'); }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer font-bold transition-all"
                    >
                      <Plus size={14} /> Write Prescription (Rx)
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full text-left font-sans">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-4">Rx-ID</th>
                            <th className="p-4">Patient Name</th>
                            <th className="p-4">Medication Details</th>
                            <th className="p-4">Dosage / Interval</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Issued Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {allPrescriptions.map((rx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-sky-600">{rx.id || `RX-${idx + 33}`}</td>
                              <td className="p-4 font-bold text-slate-800">
                                {patients.find(p => p.id === rx.patientId)?.fullName || rx.patientId}
                              </td>
                              <td className="p-4 font-semibold text-slate-700">{rx.medication}</td>
                              <td className="p-4 font-mono uppercase text-slate-500">
                                {rx.dosage} - {rx.frequency} ({rx.route})
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                                  rx.status === 'Dispensed' ? 'bg-indigo-105 text-indigo-700 bg-indigo-100' : rx.status === 'Administered' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {rx.status}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-400">{rx.prescribedDate}</td>
                            </tr>
                          ))}
                          {allPrescriptions.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                                No active clinical pharmaceutical prescriptions logged.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 font-mono tracking-wider uppercase">Prescribing Guidelines</h4>
                    <p className="text-xs text-slate-505 leading-relaxed font-sans">
                      Validate reported allergies on the Electronic Health Record panel before prescribing antibiotic therapy, narcotic analgesics or immunosuppressive compounds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CARE PLANS */}
            {activeMenuTab === 'Care Plans' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="care-plans-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <div className="border-b pb-2 flex gap-2 items-center text-slate-800">
                    <FileText className="text-sky-600" size={18} />
                    <h3 className="text-sm font-bold">Cardiology &amp; CKD Care Pathway</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chronic kidney disease care protocol: Monitor double-daily bedside blood pressure limits, strict urine outputs charting, daily weight logs, and administer furosemide loop diuretics under nurse MAR tracking.
                  </p>
                  <ul className="text-xs space-y-1.5 font-mono text-slate-400">
                    <li>• Target BP: <strong className="text-slate-700 font-sans">&lt;130/80 mmHg</strong></li>
                    <li>• Fluid Goal: <strong className="text-slate-700 font-sans">Max 1.5 Litres/24h</strong></li>
                    <li>• Bloods Review: <strong className="text-slate-700 font-sans">Serum Potassium twice weekly</strong></li>
                  </ul>
                </div>

                <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <div className="border-b pb-2 flex gap-2 items-center text-slate-800">
                    <Pill className="text-sky-600" size={18} />
                    <h3 className="text-sm font-bold">Diabetic Glycemic Control Protocol</h3>
                  </div>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Bedside sliding scale insulin: Check finger-stick blood glucose levels pre-meals and at bedtime. Administer short-acting subcutaneous insulin as mapped by clinical glucose parameters.
                  </p>
                  <ul className="text-xs space-y-1.5 font-mono text-slate-400">
                    <li>• BSL Checking Frequency: <strong className="text-slate-700 font-sans">Four times daily</strong></li>
                    <li>• Target Range: <strong className="text-slate-700 font-sans">4.0 - 7.0 mmol/L</strong></li>
                    <li>• Emergency Alert: <strong className="text-rose-600 font-sans">&lt;3.5 or &gt;15.0 mmol/L</strong></li>
                  </ul>
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeMenuTab === 'Reports' && (
              <div className="space-y-4" id="clinical-reports-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl flex max-w-full justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Clinician Activity &amp; Audit Logs Reports</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Summary reports detailing doctor encounters, diagnostics ordered and authorized prescriptions.</p>
                  </div>
                  <button 
                    onClick={() => { onShowNotification("HIPAA activity log report compiled. Sending copy to HIM storage."); }}
                    className="p-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Generate HIPAA Export
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white border p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Current Month</span>
                    <strong className="text-2xl text-slate-850 font-sans block truncate">142 Encounters</strong>
                    <p className="text-[11px] text-slate-500">Validated bedside clinic queues and admitted ward folders accessed.</p>
                  </div>
                  <div className="bg-white border p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Diagnostics Request Total</span>
                    <strong className="text-2xl text-sky-700 font-sans block truncate">59 Lab Orders</strong>
                    <p className="text-[11px] text-slate-500">Biochemical panels, blood serum cultures and DICOM images signed.</p>
                  </div>
                  <div className="bg-white border p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Prescription Volume</span>
                    <strong className="text-2xl text-emerald-700 font-sans block truncate">38 Issued RXs</strong>
                    <p className="text-[11px] text-slate-500">Pharmaceutical compound authorizations issued under doctor's license.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {activeMenuTab === 'Analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="clinical-analytics-tab">
                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 border-b pb-2 font-mono uppercase tracking-wider">Live Clinical Pipeline Load</h3>
                  <div className="space-y-3 font-sans text-xs">
                    <div>
                      <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>Clinic Consultation Wait Times</span>
                        <span className="font-mono text-sky-650">Awaiting 15 Mins</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5 align-middle">
                        <div className="bg-sky-600 h-full rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>Laboratories Pipeline Turnaround</span>
                        <span className="font-mono text-amber-600">Sample Processing (Avg 45 Mins)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-amber-600 h-full rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>Radiology PA DICOM Scans</span>
                        <span className="font-mono text-sky-650">Sign-off Average (35 Mins)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-[#0f172a] h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 border-b pb-2 font-mono uppercase tracking-wider">Diagnostic Distribution</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { disease: "Essential Hypertension", percentage: "44%", count: "11 cases", color: "bg-sky-600" },
                      { disease: "Type II Diabetes Mellitus", percentage: "32%", count: "8 cases", color: "bg-indigo-600" },
                      { disease: "Acute Nephritis Syndrome", percentage: "16%", count: "4 cases", color: "bg-emerald-600" },
                      { disease: "Severe Drug Allergies", percentage: "8%", count: "2 cases", color: "bg-rose-600" },
                    ].map((diag, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-slate-50 py-1.5">
                        <div className="flex gap-2 items-center">
                          <span className={`${diag.color} h-2.5 w-2.5 rounded-full`} />
                          <span className="text-slate-700 font-bold">{diag.disease}</span>
                        </div>
                        <div className="font-mono font-bold text-slate-500">
                          {diag.count} ({diag.percentage})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
