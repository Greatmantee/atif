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
  Heart, Zap, Sparkles, Filter, ChevronDown, CheckSquare, Info, ShieldAlert, Menu
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Patient, SecurityEvent } from '../types';
import ThreatSimulatorView from './ThreatSimulatorView';

interface HospitalAdministratorDashboardViewProps {
  currentUser: any;
  patients: Patient[];
  onRefresh: () => void;
  onOpenPatientFile: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function HospitalAdministratorDashboardView({
  currentUser,
  patients,
  onRefresh,
  onOpenPatientFile,
  onShowNotification
}: HospitalAdministratorDashboardViewProps) {
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('All');

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'System parameter threshold anomaly trigger rate is stabilized at 0%', time: '09:20 AM', read: false },
    { id: '2', text: 'High risk controlled substance prescription received from Dr. House.', time: '09:12 AM', read: false },
    { id: '3', text: 'Weekly compliance integrity report compiled and stored.', time: '08:45 AM', read: true },
    { id: '4', text: 'Disaster recovery automated script validation complete.', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // Real active system settings & telemetry from endpoint
  const [systemSettings, setSystemSettings] = useState({
    bruteForceThreshold: 5,
    anomalyScoringWeight: 60,
    auditLoggingRetention: 90
  });

  const [backups, setBackups] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityEvent[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);

  // Forms modals UI states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isNewDeptOpen, setIsNewDeptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // Add User Form State
  const [newStaffUser, setNewStaffUser] = useState({
    username: '',
    fullName: '',
    role: 'Doctor',
    department: 'General Medicine',
    startHour: 8,
    endHour: 17,
    limit: 50,
    typicalDevice: 'Workstation-Standard',
    typicalIp: '10.20.1.10'
  });

  // Create Department Form State
  const [newDept, setNewDept] = useState({
    name: '',
    location: '',
    capacity: 20
  });

  // Selected report type for "Generate Report" modal
  const [selectedReportType, setSelectedReportType] = useState<string>('Daily Operations Report');
  const [generatedReportText, setGeneratedReportText] = useState<string>('');

  // 7 Days Admission Data from mockup image
  const admissionData = [
    { name: 'May 21', Admissions: 320, Discharges: 240 },
    { name: 'May 22', Admissions: 390, Discharges: 280 },
    { name: 'May 23', Admissions: 310, Discharges: 290 },
    { name: 'May 24', Admissions: 360, Discharges: 310 },
    { name: 'May 25', Admissions: 340, Discharges: 295 },
    { name: 'May 26', Admissions: 380, Discharges: 320 },
    { name: 'May 27', Admissions: 370, Discharges: 312 }
  ];

  const fetchConfiguration = async () => {
    try {
      const res = await fetch('/api/admin/configuration');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSystemSettings(data.settings);
      }
    } catch (e) {
      console.error("Configuration loading failed", e);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        if (data.backups) setBackups(data.backups);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (e) {
      console.warn("Error fetching staff:", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/security/events');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setSecurityLogs(data.events || []);
      }
    } catch (e) {
      console.warn("Error fetching logs:", e);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/security/incidents');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setSecurityIncidents(data.incidents || []);
      }
    } catch (e) {
      console.warn("Error fetching incidents:", e);
    }
  };

  useEffect(() => {
    fetchConfiguration();
    fetchBackups();
    fetchStaff();
    fetchLogs();
    fetchIncidents();
    const interval = setInterval(() => {
      fetchLogs();
      fetchIncidents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });
      if (res.ok) {
        onShowNotification("System parameter configurations updated and verified under ATIF rules.");
        setIsSettingsOpen(false);
      }
    } catch (err) {
      onShowNotification("Failed to save core configurations.");
    }
  };

  const handleTriggerBackup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        onShowNotification(`EHR central backup generated: ${data.backup?.filename}`);
        fetchBackups();
      }
    } catch (err) {
      onShowNotification("Backup routine execution failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUser.username || !newStaffUser.fullName) {
      onShowNotification("Please provide both full name and unique username.");
      return;
    }
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newStaffUser.username,
          fullName: newStaffUser.fullName,
          role: newStaffUser.role,
          department: newStaffUser.department,
          startHour: newStaffUser.startHour,
          endHour: newStaffUser.endHour,
          devices: [newStaffUser.typicalDevice],
          ips: [newStaffUser.typicalIp],
          limit: newStaffUser.limit
        })
      });

      if (res.ok) {
        const data = await res.json();
        onShowNotification(`Credential directory updated. Raised enrollment trigger for employee ${data.staff?.id}`);
        setIsAddUserOpen(false);
        setNewStaffUser({
          username: '',
          fullName: '',
          role: 'Doctor',
          department: 'General Medicine',
          startHour: 8,
          endHour: 17,
          limit: 50,
          typicalDevice: 'Workstation-Standard',
          typicalIp: '10.20.1.10'
        });
        fetchStaff();
      } else {
        const err = await res.json();
        onShowNotification(err.error || "Could not register new staff member.");
      }
    } catch (error) {
      onShowNotification("Failed to write credential index to EHR system.");
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentStatus: string) => {
    try {
      const isSuspended = currentStatus === 'Suspended';
      const res = await fetch(
        isSuspended ? `/api/admin/staff/${staffId}/reset` : `/api/admin/staff/${staffId}`,
        {
          method: isSuspended ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: isSuspended ? undefined : JSON.stringify({ status: 'Suspended' })
        }
      );
      if (res.ok) {
        onShowNotification(`Personnel account status updated successfully.`);
        fetchStaff();
      } else {
        onShowNotification("Failed to update staff member status.");
      }
    } catch (e) {
      console.error(e);
      onShowNotification("Communication failure updating credential index.");
    }
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name) return;
    onShowNotification(`Core service layout updated: Department "${newDept.name}" created at ${newDept.location || 'Wing B'}.`);
    setIsNewDeptOpen(false);
    setNewDept({ name: '', location: '', capacity: 20 });
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setGlobalAnnouncement(announcementText);
    onShowNotification(`Global department broadcast broadcasted to all logged-in active terminals.`);
    setAnnouncementText('');
  };

  const handleGenerateReport = () => {
    const time = new Date().toLocaleTimeString();
    let text = "";
    if (selectedReportType === 'Daily Operations Report') {
      text = `ST. JUDE MEDICAL - CENTRAL RECORDS OPERATION REPORT\nGenerated At: ${time}\n\nAll departments operating at stabilized levels.\n- Active Patient Census: ${patients.length} admitted\n- ER Intake: 42 patients today\n- Total Active Admissions: 312\n- Incident Rate: Low (0 open threats)\n- Shift handover logs are up-to-date.`;
    } else if (selectedReportType === 'Patient Census Report') {
      text = `PATIENT CENSUS DETAILED METRICS\nGenerated At: ${time}\n\n- Active Inpatients: ${patients.filter(p => p.status === 'Admitted').length}\n- Outpatient Registry: ${patients.filter(p => p.status === 'Discharged').length}\n- VIP Status Enforced Records Checked: ${patients.filter(p => p.isVip).length} tracking active\n- Laboratory/Radiology awaiting queues: ${patients.filter(p => p.status.includes('Awaiting')).length}`;
    } else if (selectedReportType === 'Staff Performance Report') {
      text = `STAFF INTEGRATION & PERFORMANCE STATS\nGenerated At: ${time}\n\n- Active Enrolled Officers: ${staffList.length}\n- Day Shift Utilization: 92%\n- Average Daily EHR records access requests per staff member: 28.5 (Within normal threshold of 30)\n- Anomalous behaviors flagged: None.`;
    } else if (selectedReportType === 'Financial Summary Report') {
      text = `REVENUE CYCLE MANAGEMENT SUMMARY (MTD)\nGenerated At: ${time}\n\n- Month-to-date Collections: $3,245,890\n- Primary accounts outstanding receivables: $2,134,450\n- Insurance claim approvals rate: 45.0%\n- Total invoices generated: 4,562`;
    } else {
      text = `DEPARTMENT UTILIZATION REPORT\nGenerated At: ${time}\n\nEmergency Ward: 78% occupancy\nICU Critical Unit: 75% occupancy\nInpatient Medical-Surgical Bed: 72% occupancy\nRadiology & Medical Imaging Capacity: 70% used\nLaboratory Throughput: 68% utilized\nPharmacy Stock Intake: 62%`;
    }
    setGeneratedReportText(text);
  };

  return (
    <div className="flex bg-[#f8fafc] text-slate-700 min-h-[calc(100vh-6rem)] -m-6 relative font-sans leading-relaxed" id="hospital-admin-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================== STICKY SIDEBAR (Executive Console) ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="admin-sidebar">
        <div className="p-5 flex-1">
          {/* Logo & Platform ID */}
          <div className="flex items-center justify-between gap-2.5 mb-6">
            <div className="flex items-center gap-2.5">
              <Shield className="text-[#0284c7]" size={22} fill="currentColor" />
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#0284c7] font-bold block">EHR System</span>
                <span className="text-slate-800 font-bold text-sm tracking-tight block">St. Jude Medical</span>
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

          <nav className="space-y-1.5" id="admin-navigation-list">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-2 pl-3">Platform Administration</span>

            <button
              onClick={() => { setActiveMenu('Dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${activeMenu === 'Dashboard' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2.5">
                <Activity size={15} /> Dashboard
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('Patients'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Patients' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Users size={15} /> Patients Directory
            </button>

            <button
              onClick={() => { setActiveMenu('Facility Overview'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Facility Overview' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Layers size={15} /> Facility Overview
            </button>

            <button
              onClick={() => { setActiveMenu('UserManagement'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'UserManagement' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <UserPlus size={15} /> User Management
            </button>

            <button
              onClick={() => { setActiveMenu('Roles'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Roles' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <UserCheck size={15} /> Role & Permissions
            </button>

            <button
              onClick={() => { setIsNewDeptOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <Plus size={15} /> Add Department
            </button>

            <button
              onClick={() => { setIsSettingsOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <Settings size={15} /> System Settings
            </button>

            <button
              onClick={() => { setActiveMenu('Workflows'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Workflows' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Sliders size={15} /> Workflows
            </button>

            <button
              onClick={() => { setActiveMenu('Monitoring'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'Monitoring' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Dna size={15} /> System Monitoring
            </button>

            <button
              onClick={() => { setIsReportOpen(true); handleGenerateReport(); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent transition cursor-pointer"
            >
              <BarChart3 size={15} /> Reports & Analytics
            </button>

            <button
              onClick={() => { setActiveMenu('AuditLogs'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border transition-all cursor-pointer ${activeMenu === 'AuditLogs' ? 'bg-sky-50 text-sky-700 border-sky-100 font-bold' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <Clipboard size={15} /> Audit Logs
            </button>

            <button
              onClick={() => { setActiveMenu('ATIF'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 border border-transparent hover:bg-slate-50 transition cursor-pointer`}
            >
              <ShieldAlert size={15} className="text-red-500" /> Security & ATIF
            </button>
          </nav>
        </div>

        {/* Console Footprint */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#0284c7] font-semibold">
            <CheckCircle size={11} fill="currentColor" /> Admin Lock Node
          </div>
          <span className="block text-[10px] text-slate-500 font-mono">Workstation: EHR-ADMIN-MAIN</span>
          <span className="block text-[10px] text-slate-400 font-mono">Token Life: Permanent Shift</span>
        </div>
      </aside>

      {/* ========================== SCROLLABLE DISPLAY ENGINE ========================== */}
      <main className="flex-1 overflow-y-auto p-6 text-left" id="admin-main-pane">
        
        {/* ========================== HEADER WIDGET (Image Match) ========================== */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" id="admin-header-pane">
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
                Hospital Administrator Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 text-xs">Good morning, Administrator Emma Williams</span>
                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-mono text-[9px] font-bold flex items-center gap-0.5">
                  <CheckCircle size={9} fill="currentColor" /> VERIFIED CREDENTIALS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Global Search Bar */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search staff, profiles, configuration, MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 pl-9 pr-8 py-1.5 border border-slate-250 bg-white rounded-xl text-xs focus:ring-2 focus:ring-[#0284c7] outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Notifications Alert Center */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)} 
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer relative block"
                title="System Notifications"
              >
                <Bell size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8.5px] font-bold w-4 h-4 flex items-center justify-center">
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
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-sky-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-red-500' : 'bg-slate-300'}`} />
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

            {/* Executive Avatar styled exactly */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 border rounded-xl shadow-xs">
              <div className="w-8.5 h-8.5 rounded-full bg-sky-650 bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                EW
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800">Emma Williams</div>
                <div className="text-slate-400 font-mono text-[9px]">Admin • Shift: Day Shift</div>
              </div>
            </div>
          </div>
        </header>

        {/* Global announcement Banner if active */}
        {globalAnnouncement && (
          <div className="p-4 bg-amber-550 bg-amber-500 text-white text-xs font-semibold rounded-2xl mb-6 shadow-sm flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Bell size={16} fill="currentColor" />
              <span><strong>BROADCAST ANNOUNCEMENT:</strong> {globalAnnouncement}</span>
            </div>
            <button onClick={() => setGlobalAnnouncement(null)} className="hover:text-amber-100">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Active Emergency Maintenance banner */}
        {isMaintenanceMode && (
          <div className="p-4 bg-[#ef4444] text-white text-xs font-semibold rounded-2xl mb-6 shadow-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span><strong>EMERGENCY SIMULATED SYSTEM MAINTENANCE MODE ACTIVE:</strong> Non-essential services restricted. Access speeds regulated. Simulated backup schedules running in RAM.</span>
          </div>
        )}

        {/* ========================== KEY OPERATIONS VIEW REDIRECTS ========================== */}
        {activeMenu === 'Dashboard' ? (
          <div className="space-y-6" id="admin-interactive-contents">
            
            {/* ========================== KPI CARDS BLOCK (6 Items Match Mockup) ========================== */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4" id="admin-central-kpis">
              <div className="p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Patients</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">24,532</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +320 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Admissions</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">312</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +18 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Staff</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">1,245</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span className="text-[11px]">&uarr;</span> +12 from yesterday
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Departments</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">28</span>
                <span className="text-[10px] text-slate-500 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  <span>●</span> No change
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">System Uptime</span>
                <span className="block text-2xl font-bold text-slate-900 mt-1 font-sans">99.98%</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold block mt-1 flex items-center gap-0.5">
                  <span>●</span> Operational
                </span>
              </div>

              <div className="p-4 bg-white border border-red-200 bg-red-50/10 rounded-2xl shadow-xs text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-red-500 font-bold">Alerts</span>
                <span className="block text-2xl font-bold text-red-700 mt-1 font-sans">7</span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-bold font-mono inline-block mt-1">
                  Requires attention
                </span>
              </div>
            </div>

            {/* ========================== GRID LAYOUT BLOCK (Match Layout Image) ========================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COLUMN COMBINED AS TWO-COLUMN WIDE ON LARGE SCREEN */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Hospital Overview & Recharts Sub-sections */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Hospital Overview</h3>
                      <span className="text-[10.5px] text-slate-400 font-mono">Real-time occupancy & admission metrics</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#0284c7] font-semibold">MTD Analysis</span>
                  </div>

                  {/* Operational Bed Grid (4 Items Row) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400 uppercase">Total Beds</span>
                      <strong className="block text-lg text-slate-800 font-sans mt-0.5">420</strong>
                      <span className="text-[9px] text-[#0284c7] font-semibold block">Occupied 312 (74%)</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400 uppercase font-semibold">ICU Beds</span>
                      <strong className="block text-lg text-slate-800 font-sans mt-0.5">48</strong>
                      <span className="text-[9px] text-red-650 text-red-600 font-semibold block">Occupied 36 (75%)</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400 uppercase">ER Visits (Today)</span>
                      <strong className="block text-lg text-slate-800 font-sans mt-0.5">156</strong>
                      <span className="text-[9px] text-emerald-600 font-semibold block">+22 from yesterday</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[9.5px] font-mono text-slate-400 uppercase">Surgeries (Today)</span>
                      <strong className="block text-lg text-slate-800 font-sans mt-0.5">28</strong>
                      <span className="text-[9px] text-emerald-600 font-semibold block">+5 from yesterday</span>
                    </div>
                  </div>

                  {/* Patient Admissions Chart (Last 7 Days) */}
                  <div className="h-64">
                    <span className="block text-[11px] font-bold text-slate-600 mb-3 text-left">Patient Admissions & Discharges (Last 7 Days)</span>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={admissionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: '10.5px', borderRadius: '12px' }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '10.5px', marginTop: '10px' }} />
                        <Line type="monotone" dataKey="Admissions" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Discharges" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Department Performance List Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Department Performance</h3>
                      <span className="text-[10.5px] text-slate-400 font-mono">Cross-departmental utilization index</span>
                    </div>
                    <button onClick={onRefresh} className="p-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 bg-white rounded-lg transition-all flex items-center gap-1">
                      <RefreshCw size={11} /> Refresh Records
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-transparent">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[9px] bg-slate-50/40">
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-2">Occupancy/Usage</th>
                          <th className="py-2 px-2">Patients/Today</th>
                          <th className="py-2 px-2">Staff On Duty</th>
                          <th className="py-2 px-3 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-[11.5px] text-slate-700">
                        {[
                          { name: 'Emergency', occupancy: '78%', volume: 156, staff: 42, rating: 'Good' },
                          { name: 'Inpatient Wards', occupancy: '72%', volume: 312, staff: 126, rating: 'Good' },
                          { name: 'ICU', occupancy: '75%', volume: 36, staff: 28, rating: 'Good' },
                          { name: 'Surgery', occupancy: '65%', volume: 28, staff: 34, rating: 'Good' },
                          { name: 'Laboratory', occupancy: '68%', volume: 248, staff: 24, rating: 'Average' },
                          { name: 'Radiology', occupancy: '70%', volume: 184, staff: 18, rating: 'Good' },
                          { name: 'Pharmacy', occupancy: '62%', volume: 312, staff: 16, rating: 'Good' },
                          { name: 'Outpatient', occupancy: '71%', volume: 428, staff: 38, rating: 'Good' }
                        ].map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-2 px-3 font-semibold text-slate-800">{d.name}</td>
                            <td className="py-2 px-2 font-mono text-slate-600 font-bold">{d.occupancy}</td>
                            <td className="py-2 px-2 font-semibold">{d.volume}</td>
                            <td className="py-2 px-2 text-slate-500 font-semibold">{d.staff}</td>
                            <td className="py-2 px-3 text-right">
                              <span className={`px-2 py-0.2 rounded-md font-bold text-[9px] ${
                                d.rating === 'Good' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                              }`}>
                                {d.rating}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 text-center">
                    <button onClick={() => { setIsReportOpen(true); handleGenerateReport(); }} className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer">
                      View full performance report &rarr;
                    </button>
                  </div>
                </div>

                {/* 3. Bottom operational grid rows: Key Reports & Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key Reports */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">Key Reports</h3>
                      <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Centralized operational compilation records</span>

                      <div className="space-y-2">
                        {[
                          'Daily Operations Report',
                          'Patient Census Report',
                          'Staff Performance Report',
                          'Department Utilization Report',
                          'Financial Summary Report'
                        ].map((report, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedReportType(report);
                              setIsReportOpen(true);
                              handleGenerateReport();
                              onShowNotification(`Prepared visual compile context for ${report}`);
                            }}
                            className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/60 border rounded-xl flex items-center gap-2.5 text-xs text-slate-700 transition font-medium cursor-pointer text-left"
                          >
                            <FileText size={14} className="text-slate-400" />
                            <span>{report}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => { setIsReportOpen(true); }} className="text-xs font-bold text-sky-700 hover:underline">
                        View all reports &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">Financial Summary (MTD)</h3>
                      <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Financial health indicator cycles</span>

                      <div className="space-y-3 mt-2">
                        <div className="p-3 bg-slate-50 hover:bg-slate-100/40 border rounded-xl flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Total Revenue</span>
                          <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            $3,245,890 <span className="text-[10px] text-emerald-600">&uarr; 8.5%</span>
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 hover:bg-slate-100/40 border rounded-xl flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Total Expenses</span>
                          <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            $2,678,450 <span className="text-[10px] text-emerald-600">&uarr; 6.2%</span>
                          </span>
                        </div>

                        <div className="p-3 bg-slate-100/60 border border-emerald-150 rounded-xl flex justify-between items-center text-xs">
                          <span className="text-emerald-800 font-semibold">Net Profit</span>
                          <span className="font-mono font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                            $567,440 <span className="text-[10px] text-emerald-600">&uarr; 12.1%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <span className="text-xs text-[#0284c7] font-bold block cursor-pointer">
                        View financial dashboard &rarr;
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT SIDEBAR MODULE COLUMN (Image Match) */}
              <div className="space-y-6">
                
                {/* 1. System Alerts Feed */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">System Alerts</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Direct active notification triggers</span>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex items-start gap-2.5 hover:bg-red-50/70 transition">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                      <div className="text-xs">
                        <div className="flex justify-between items-center w-full font-semibold text-slate-800">
                          <span className="text-red-700 font-bold">High system load detected</span>
                          <span className="font-mono text-[9.5px] text-slate-400">2 min ago</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">EHR terminal database access requests spikes detected at 02:50 PM peak hours.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl flex items-start gap-2.5 hover:bg-amber-50/75 transition">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                      <div className="text-xs">
                        <div className="flex justify-between items-center w-full font-semibold text-slate-800">
                          <span className="text-amber-800 font-bold">7 pending critical results</span>
                          <span className="font-mono text-[9.5px] text-slate-400">15 min ago</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">Clinical critical lab result alerts filed on ward beds are waiting for physician countersign.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl flex items-start gap-2.5 hover:bg-amber-50/75 transition">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                      <div className="text-xs">
                        <div className="flex justify-between items-center w-full font-semibold text-slate-800">
                          <span className="text-amber-800">3 departments pending reports</span>
                          <span className="font-mono text-[9.5px] text-slate-400">25 min ago</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">Pharmacy, ward surgery indices did not submit operational census logs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <button onClick={() => onShowNotification('Core syslog filters registered 14 clinical telemetry items.')} className="text-xs font-bold text-sky-700 hover:underline">
                      View all alerts &rarr;
                    </button>
                  </div>
                </div>

                {/* 2. Pending Approvals Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Pending Approvals</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Direct configuration approvals cycle</span>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:bg-slate-100/80 transition text-xs cursor-pointer">
                      <div className="flex items-center gap-2 text-slate-650">
                        <UserPlus size={14} />
                        <span>User Access Requests</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-[10px]">12 open</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:bg-slate-100/80 transition text-xs cursor-pointer">
                      <div className="flex items-center gap-2 text-slate-650">
                        <UserCheck size={14} />
                        <span>Role Change Requests</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-[10px]">8 units</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:bg-slate-100/80 transition text-xs cursor-pointer">
                      <div className="flex items-center gap-2 text-slate-650">
                        <Layers size={14} />
                        <span>Department Requests</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-[10px]">5 requests</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:bg-slate-100/80 transition text-xs cursor-pointer">
                      <div className="flex items-center gap-2 text-slate-650">
                        <Settings size={14} />
                        <span>System Configuration Changes</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-[10px]">3 changes</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <button onClick={() => onShowNotification('Awaiting administrative authority keys validation.')} className="text-xs font-bold text-sky-700 hover:underline">
                      View all approvals &rarr;
                    </button>
                  </div>
                </div>

                {/* 3. Recent System Activity (EHR & Telemetry Logs) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Recent System Activity</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4 font-normal">Real-time syslog activity logs</span>

                  <div className="space-y-4">
                    <div className="flex gap-2 text-xs">
                      <div className="font-mono font-bold text-slate-450 shrink-0 text-[10px] w-14">09:15 AM</div>
                      <div className="relative pl-3 border-l-2 border-[#10b981]">
                        <div className="font-bold text-slate-800">New user registered</div>
                        <p className="text-slate-400 font-mono text-[9.5px]">Dr. James Peterson (Cardiology)</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <div className="font-mono font-bold text-slate-450 shrink-0 text-[10px] w-14">09:02 AM</div>
                      <div className="relative pl-3 border-l-2 border-[#3b82f6]">
                        <div className="font-bold text-slate-800">Role updated</div>
                        <p className="text-slate-400 font-mono text-[9.5px]">Nurse Sarah Connor (Operating Room)</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <div className="font-mono font-bold text-slate-450 shrink-0 text-[10px] w-14">08:45 AM</div>
                      <div className="relative pl-3 border-l-2 border-[#a855f7]">
                        <div className="font-bold text-slate-800">Department created</div>
                        <p className="text-slate-400 font-mono text-[9.5px]">Rehabilitation Center</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <div className="font-mono font-bold text-slate-450 shrink-0 text-[10px] w-14">08:30 AM</div>
                      <div className="relative pl-3 border-l-2 border-slate-350">
                        <div className="font-bold text-slate-800">System backup completed</div>
                        <p className="text-slate-400 font-mono text-[9.5px]">All modules</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <div className="font-mono font-bold text-slate-450 shrink-0 text-[10px] w-14">08:10 AM</div>
                      <div className="relative pl-3 border-l-2 border-[#0284c7]">
                        <div className="font-bold text-slate-800">Security scan completed</div>
                        <p className="text-slate-400 font-mono text-[9.5px]">No threats detected</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4 text-center">
                    <button onClick={fetchLogs} className="text-xs font-bold text-sky-700 hover:underline cursor-pointer">
                      View all activity &rarr;
                    </button>
                  </div>
                </div>

                {/* 4. Quick Actions Widget Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">Quick Actions</h3>
                  <span className="block text-[10.5px] text-slate-400 font-mono mb-4">Centralized execution actions triggers</span>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsAddUserOpen(true)}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <UserPlus size={16} className="text-sky-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">Add New User</div>
                    </button>

                    <button
                      onClick={() => setIsNewDeptOpen(true)}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <Plus size={16} className="text-[#10b981] group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">Create Dept</div>
                    </button>

                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <Settings size={16} className="text-purple-600 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">System Settings</div>
                    </button>

                    <button
                      onClick={() => { setIsReportOpen(true); handleGenerateReport(); }}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                    >
                      <FileSpreadsheet size={16} className="text-amber-550 text-amber-500 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">Generate Report</div>
                    </button>

                    <button
                      onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                      className={`p-3 border transition rounded-xl text-left cursor-pointer group ${isMaintenanceMode ? 'bg-red-50 border-red-200' : 'border-slate-150 hover:bg-slate-50'}`}
                    >
                      <AlertTriangle size={16} className="text-[#ef4444] group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">Maintenance Mode</div>
                    </button>

                    <button
                      onClick={() => handleTriggerBackup()}
                      className="p-3 border border-slate-150 hover:bg-slate-50 transition rounded-xl text-left cursor-pointer group"
                      disabled={isLoading}
                    >
                      <Database size={16} className="text-amber-700 group-hover:scale-105 transition-transform mb-1.5" />
                      <div className="font-bold text-xs text-slate-850">{isLoading ? "Backing up..." : "System Backup"}</div>
                    </button>
                  </div>

                  {/* Broadcast announcement action widget bottom panel */}
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Broadcast Staff Announcement</span>
                    <form onSubmit={handleBroadcastAnnouncement} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Type clinic notification details..."
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        className="flex-1 p-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none placeholder:text-slate-400"
                      />
                      <button type="submit" className="px-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition cursor-pointer">
                        <Send size={12} className="rotate-45" />
                      </button>
                    </form>
                  </div>

                </div>

              </div>

            </div>

          </div>
        ) : (
          /* SECTION ROUTER VIEWS DIRECTLY ADHERED TO NAVIGATION ACTIONS */
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-left relative min-h-96">
            <button onClick={() => setActiveMenu('Dashboard')} className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X size={15} /> Close Block
            </button>
            
            {activeMenu === 'ATIF' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="text-red-500 animate-pulse" /> ATIF Threat Simulation & Forensics Audit Registry
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous monitoring, correlation, and response baseline audit registry. View real-time security postures and run heuristics analysis on simulated incidents in sandbox mode.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <ThreatSimulatorView 
                    currentUser={currentUser}
                    patients={patients}
                    incidents={securityIncidents}
                    events={securityLogs}
                    onRefresh={() => { fetchLogs(); fetchIncidents(); }}
                  />
                </div>
              </div>
            )}

            {activeMenu === 'AuditLogs' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">System Administrative Audit Trail</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400">
                        <th className="py-2">Event ID</th>
                        <th className="py-2">Timestamp</th>
                        <th className="py-2">User</th>
                        <th className="py-2">Role</th>
                        <th className="py-2">Activity Type</th>
                        <th className="py-2 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600">
                      {securityLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-900 font-bold">{log.id}</td>
                          <td className="py-2.5 font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2.5 font-semibold">{log.username}</td>
                          <td className="py-2.5 text-[10px] bg-slate-100 px-1.5 rounded inline-block mt-1 uppercase font-bold text-slate-500">{log.role}</td>
                          <td className="py-2.5 font-mono text-[#0284c7] font-bold">{log.activityType}</td>
                          <td className="py-2.5 text-right text-slate-700">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === 'Facility Overview' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Centralized Clinic Facility Layout Beds</h3>
                <p className="text-xs text-slate-500">Manage ward coordinates, beds capacity, and staff availability.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Emergency Ward', 'ICU', 'Pediatrics Wing B', 'Obstetrics Wards', 'Surgical Ward', 'Isolation Wing C'].map((ward, i) => (
                    <div key={i} className="p-4 bg-slate-50 border rounded-2xl text-xs gap-3">
                      <strong className="block text-slate-800 text-sm">{ward}</strong>
                      <div className="flex justify-between mt-2 text-slate-500">
                        <span>Total Beds: 35</span>
                        <span className="text-emerald-600 font-bold">Occupancy: 82%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMenu === 'Roles' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Hospital Personnel Directory Roles</h3>
                <p className="text-xs text-slate-500">Direct active control overview over role definitions.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400">
                        <th className="py-2">Employee ID</th>
                        <th className="py-2">Full Name</th>
                        <th className="py-2">Role Title</th>
                        <th className="py-2">Working Hours</th>
                        <th className="py-2">Daily Threshold</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-900 font-bold">{st.id}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{st.fullName}</td>
                          <td className="py-2.5 text-slate-600 font-medium">{st.role}</td>
                          <td className="py-2.5 font-mono text-slate-500">{st.normalHours?.start}:00 - {st.normalHours?.end}:00</td>
                          <td className="py-2.5 font-mono font-bold text-[#0284c7]">{st.averageDailyAccessLimit} views</td>
                          <td className="py-2.5 text-right">
                            <span className="px-2 py-0.2 bg-emerald-50 text-emerald-800 rounded font-bold uppercase text-[9px]">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Patients Directory View */}
            {activeMenu === 'Patients' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="text-sky-600" size={18} /> Patients Directory
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View, search, and manage all patient EHR chart dossiers across departments.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRefresh()}
                      className="p-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 bg-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={11} /> Sync Census
                    </button>
                  </div>
                </div>

                {/* Patient filter & local search */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Filter patients by name or MRN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    {['All', 'Admitted', 'Checked In', 'Awaiting Lab', 'Awaiting Radiology', 'VIP'].map((tab) => {
                      const isSel = (tab === 'All' && !searchQuery.startsWith('status:') && searchQuery !== 'is:vip') || 
                                    (tab === 'VIP' && searchQuery === 'is:vip') ||
                                    (tab !== 'All' && tab !== 'VIP' && searchQuery === `status:${tab}`);
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            if (tab === 'All') setSearchQuery('');
                            else if (tab === 'VIP') setSearchQuery('is:vip');
                            else setSearchQuery(`status:${tab}`);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50/50">
                        <th className="py-2.5 px-3">Patient Name / MRN</th>
                        <th className="py-2.5 px-3">DOB / Gender</th>
                        <th className="py-2.5 px-3">Location / Bed</th>
                        <th className="py-2.5 px-3">Sensitivity</th>
                        <th className="py-2.5 px-3">Clinic Status</th>
                        <th className="py-2.5 px-3 text-right">EHR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600">
                      {patients
                        .filter(p => {
                          const query = searchQuery.trim().toLowerCase();
                          if (!query) return true;
                          if (query === 'is:vip') return p.isVip || p.sensitivity === 'HIGHLY_SENSITIVE';
                          if (query.startsWith('status:')) {
                            const st = query.replace('status:', '').toLowerCase();
                            return p.status.toLowerCase() === st;
                          }
                          return p.fullName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
                        })
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{p.fullName}</div>
                              <div className="font-mono text-[10px] text-[#0284c7] font-bold">{p.id}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-medium">
                              <div>{p.dob}</div>
                              <div className="text-[10px]">{p.gender}</div>
                            </td>
                            <td className="py-3 px-3">
                              {p.admittedWard ? (
                                <div>
                                  <span className="font-semibold text-slate-700">{p.admittedWard}</span>
                                  <span className="text-slate-400 font-mono block text-[10px]">Bed {p.admittedBed}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not admitted</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] inline-flex items-center gap-1 ${
                                p.isVip || p.sensitivity === 'HIGHLY_SENSITIVE'
                                  ? 'bg-red-50 text-red-800 border border-red-100 animate-pulse'
                                  : p.sensitivity === 'RESTRICTED' || p.sensitivity === 'CONFIDENTIAL'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              }`}>
                                <Shield size={10} fill="currentColor" />
                                {p.sensitivity || (p.isVip ? 'HIGHLY_SENSITIVE' : 'NORMAL')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9.5px] ${
                                p.status === 'Admitted'
                                  ? 'bg-blue-50 text-blue-800'
                                  : p.status === 'Checked In'
                                  ? 'bg-slate-100 text-slate-700'
                                  : p.status === 'In Consultation'
                                  ? 'bg-indigo-50 text-indigo-800'
                                  : p.status === 'Discharged'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-amber-50 text-amber-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onOpenPatientFile(p.id)}
                                className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100/80 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-sky-100"
                              >
                                <Eye size={12} /> View EHR Chart
                              </button>
                            </td>
                          </tr>
                        ))}
                      {patients.filter(p => {
                        const query = searchQuery.trim().toLowerCase();
                        if (!query) return true;
                        if (query === 'is:vip') return p.isVip || p.sensitivity === 'HIGHLY_SENSITIVE';
                        if (query.startsWith('status:')) {
                          const st = query.replace('status:', '').toLowerCase();
                          return p.status.toLowerCase() === st;
                        }
                        return p.fullName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                            No patients found matching current search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* User Management View */}
            {activeMenu === 'UserManagement' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <UserPlus className="text-sky-600" size={18} /> Hospital Personnel User Management
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify credentials, audit authorization limits, enroll staff, or suspend credentials dynamically.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddUserOpen(true)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Plus size={13} /> Enroll New Staff
                    </button>
                    <button
                      onClick={() => fetchStaff()}
                      className="p-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 bg-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} /> Sync Staff
                    </button>
                  </div>
                </div>

                {/* Staff list filter & search */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search staff by name or department..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
                    />
                    {staffSearchQuery && (
                      <button onClick={() => setStaffSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    {['All', 'Doctor', 'Nurse', 'Laboratory Scientist', 'Radiology Officer', 'Pharmacist', 'Accounts Officer'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setStaffRoleFilter(role)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          staffRoleFilter === role 
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {role === 'Laboratory Scientist' ? 'Lab' : role === 'Radiology Officer' ? 'Radiology' : role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50/50">
                        <th className="py-2.5 px-3">Employee ID / Username</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Role & Department</th>
                        <th className="py-2.5 px-3">Shift Hours</th>
                        <th className="py-2.5 px-3">Daily Access Threshold</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600">
                      {staffList
                        .filter(st => {
                          const nameMatch = st.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
                                            st.department.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                            st.username.toLowerCase().includes(staffSearchQuery.toLowerCase());
                          const roleMatch = staffRoleFilter === 'All' || st.role === staffRoleFilter;
                          return nameMatch && roleMatch;
                        })
                        .map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-900">{st.id}</div>
                              <div className="text-[10px] text-slate-400">@{st.username}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{st.fullName}</td>
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-700">{st.role}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{st.department}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {st.normalHours?.start}:00 - {st.normalHours?.end}:00
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#0284c7]">
                              {st.averageDailyAccessLimit} views / day
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                st.status === 'Suspended' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {st.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleToggleStaffStatus(st.id, st.status || 'Active')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  st.status === 'Suspended'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100/80 border-red-200'
                                }`}
                              >
                                {st.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {staffList.filter(st => {
                        const nameMatch = st.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
                                          st.department.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                          st.username.toLowerCase().includes(staffSearchQuery.toLowerCase());
                        const roleMatch = staffRoleFilter === 'All' || st.role === staffRoleFilter;
                        return nameMatch && roleMatch;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                            No hospital staff members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workflows View */}
            {activeMenu === 'Workflows' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sliders className="text-indigo-600" size={18} /> Administrative & Clinical Workflows
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time operational status, average service duration metrics, and pipeline queues.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: "Triage-to-Clinician Flow", desc: "Patient check-in to active consultant review", duration: "14 mins avg", load: "Steady", percent: 85, color: "text-emerald-600" },
                    { title: "Lab Request Pipeline", desc: "Sample extraction to release of HIS clinical results", duration: "22 mins avg", load: "Optimal", percent: 92, color: "text-emerald-600" },
                    { title: "Radiology PACs Scan Queue", desc: "Imaging request through scanning to radiologist signature", duration: "35 mins avg", load: "Busy", percent: 65, color: "text-amber-600" },
                    { title: "Pharmacy Dispensing Loop", desc: "E-prescription verification to local medication dispersal", duration: "8 mins avg", load: "Optimal", percent: 95, color: "text-emerald-600" },
                    { title: "Admissions & Bed Assignment", desc: "Inpatient roster clearance to actual ward bed loading", duration: "18 mins avg", load: "Normal", percent: 88, color: "text-emerald-600" },
                    { title: "Billing Ledger Reconciliation", desc: "Discharge checkout to invoice aggregation and claims submit", duration: "5 mins avg", load: "Steady", percent: 99, color: "text-emerald-600" }
                  ].map((wf, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs text-slate-800 font-bold block">{wf.title}</strong>
                          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 bg-white border border-slate-150 rounded ${wf.color}`}>{wf.load}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{wf.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/40 space-y-2">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-400 font-medium">Clearance Rate</span>
                          <span className="font-mono font-bold text-slate-700">{wf.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${wf.percent}%` }} />
                        </div>
                        <span className="block text-[10px] font-mono text-slate-400 text-right font-medium">Duration: {wf.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Systems Monitoring View */}
            {activeMenu === 'Monitoring' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Dna className="text-purple-600 animate-pulse" size={18} /> Live EHR Systems Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time container ingress statistics, query throughput rates, and security enforcement.
                  </p>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-50 border rounded-2xl text-left">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Processor Core Load</span>
                    <strong className="text-xl text-slate-800 block mt-1">14.2%</strong>
                    <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">● Dynamic Scaling Active</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl text-left">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Allocated JVM Memory</span>
                    <strong className="text-xl text-slate-800 block mt-1">2.41 GB <span className="text-slate-400 text-xs">/ 8GB</span></strong>
                    <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">● GC stabilized</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl text-left">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Mean API Response</span>
                    <strong className="text-xl text-slate-800 block mt-1">12 ms</strong>
                    <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">● HTTP ingress stable</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl text-left">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Database Pool</span>
                    <strong className="text-xl text-slate-800 block mt-1">42 conns</strong>
                    <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">● Max cap 250 conns</span>
                  </div>
                </div>

                {/* Simulation charts or systems log */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Database Query Speed Chart */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left">
                    <span className="text-xs font-bold text-slate-700 block mb-3">API Requests / Ingress Load (Queries per second)</span>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: '10:00', load: 45 },
                          { name: '10:10', load: 56 },
                          { name: '10:20', load: 85 },
                          { name: '10:30', load: 110 },
                          { name: '10:40', load: 95 },
                          { name: '10:50', load: 125 },
                          { name: '11:00', load: 140 }
                        ]} margin={{ left: -25, right: 10, top: 5, bottom: 5 }}>
                          <XAxis dataKey="name" fontSize={9} />
                          <YAxis fontSize={9} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <Tooltip />
                          <Line type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Active Security Policy enforcement */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-2">Policy Enforcement Status</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">ATIF Sandbox Engine</span>
                          <span className="text-emerald-600 font-bold font-mono">ENFORCED</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Off-Hours Alert Filter</span>
                          <span className="text-emerald-600 font-bold font-mono">ACTIVE (20:00-06:00)</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">EHR Database Encryption</span>
                          <span className="text-emerald-600 font-bold font-mono">AES-256 GCM</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Audit Trail Mirroring</span>
                          <span className="text-emerald-600 font-bold font-mono">SYNCHRONIZED</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/40 text-center">
                      <button
                        onClick={() => {
                          setIsMaintenanceMode(!isMaintenanceMode);
                          onShowNotification(`Simulated system maintenance mode toggled.`);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isMaintenanceMode 
                            ? 'bg-red-600 hover:bg-red-750 text-white' 
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        {isMaintenanceMode ? "Deactivate Maintenance Mode" : "Activate Emergency Maintenance Mode"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================== FOOTER BRAND BANNER ========================== */}
        <footer className="mt-8 border-t border-slate-200/80 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-mono gap-3" id="admin-footer">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ATIF-HIS Cyber Guard: All activities are monitored and audited</span>
          </div>
          <div>St. Jude Medical EHR Executive Console • V2.8.5</div>
        </footer>

      </main>

      {/* ========================== POPUP DIALOGS & ACTION FORM MODALS ========================== */}

      {/* MODAL 1: ADD USER FORM */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-md w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsAddUserOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
              <UserPlus className="text-sky-600" /> New Hospital Staff Enrollment
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">Generates automated audit trails on enrollment.</p>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Full Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. James Peterson"
                  value={newStaffUser.fullName}
                  onChange={(e) => setNewStaffUser({ ...newStaffUser, fullName: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">User ID / Username</label>
                  <input
                    type="text"
                    placeholder="doctor_james"
                    value={newStaffUser.username}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Hospital Role Title</label>
                  <select
                    value={newStaffUser.role}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, role: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Laboratory Scientist">Laboratory Scientist</option>
                    <option value="Radiology Officer">Radiology Officer</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Accounts Officer">Accounts Officer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Ward Department</label>
                  <input
                    type="text"
                    value={newStaffUser.department}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, department: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Access View Rate Limit</label>
                  <input
                    type="number"
                    value={newStaffUser.limit}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, limit: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Shift Starts (Hour)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={newStaffUser.startHour}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, startHour: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 font-mono">Shift Ends (Hour)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={newStaffUser.endHour}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, endHour: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer">Register Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DEPARTMENT FORM */}
      {isNewDeptOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsNewDeptOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Create Clinic service Unit</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono text-slate-500">Registers an independent operational center in RIS directories.</p>
            
            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rehabilitation Specialty Unit"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1 font-mono">Wing coordinates</label>
                <input
                  type="text"
                  value={newDept.location}
                  onChange={(e) => setNewDept({ ...newDept, location: e.target.value })}
                  placeholder="South Wing Floor 3"
                  className="w-full p-2 border border-slate-250 bg-white rounded-xl text-xs text-slate-800"
                />
              </div>
              <div className="pt-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsNewDeptOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#10b981] hover:bg-[#0da472] text-white rounded-xl font-bold cursor-pointer">Build Wing Division</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SYSTEM CONFIG PARAMETERS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-md w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
              <Settings className="text-purple-600" /> Administrative Parameter Configs
            </h3>
            <p className="text-xs text-slate-405 text-slate-400 mb-4 font-mono">Regulates system-wide threshold constraints.</p>

            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1 font-mono flex justify-between">
                  <span>Brute Force Login Attempt Gate</span>
                  <span className="text-purple-700 font-extrabold">{systemSettings.bruteForceThreshold} tries</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={systemSettings.bruteForceThreshold}
                  onChange={(e) => setSystemSettings({ ...systemSettings, bruteForceThreshold: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 font-mono flex justify-between">
                  <span>ATIF Privilege Abuse Scoring Weight</span>
                  <span className="text-purple-700 font-extrabold">{systemSettings.anomalyScoringWeight}% weight</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={systemSettings.anomalyScoringWeight}
                  onChange={(e) => setSystemSettings({ ...systemSettings, anomalyScoringWeight: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 font-mono flex justify-between">
                  <span>Audit Logs Storage Retention Limit</span>
                  <span className="text-purple-700 font-extrabold">{systemSettings.auditLoggingRetention} Days</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="365"
                  value={systemSettings.auditLoggingRetention}
                  onChange={(e) => setSystemSettings({ ...systemSettings, auditLoggingRetention: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer">Commit Parameters</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REPORT COPIER PANEL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-3xl border border-slate-150 max-w-lg w-full shadow-2xl p-6 relative">
            <button onClick={() => setIsReportOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={18} />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
              <BarChart3 className="text-amber-500" /> Compiled executive Analysis reports
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">Central audit report generation engine.</p>

            <div className="space-y-4 text-xs">
              <div className="flex gap-2">
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                >
                  <option value="Daily Operations Report">Daily Operations Report</option>
                  <option value="Patient Census Report">Patient Census Report</option>
                  <option value="Staff Performance Report">Staff Performance Report</option>
                  <option value="Department Utilization Report">Department Utilization Report</option>
                  <option value="Financial Summary Report">Financial Summary Report</option>
                </select>
                <button onClick={handleGenerateReport} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition cursor-pointer">
                  Compile State
                </button>
              </div>

              <div className="p-4 bg-slate-50 font-mono text-[11px] rounded-xl border max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-705">
                {generatedReportText || "Awaiting compile action..."}
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsReportOpen(false)} className="px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Close</button>
                <button onClick={() => { onShowNotification(`Export trigger raised for ${selectedReportType}. PDF queued.`); }} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer">
                  Export Document (.pdf)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
