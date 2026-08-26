/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, Settings, Users, UserPlus, UserCheck, Database, ShieldAlert, 
  Cpu, Activity, Clock, ShieldCheck, Play, Server, AlertOctagon, 
  RefreshCw, CheckCircle, Trash2, Edit2, Lock, Unlock, FileText, 
  Check, Plus, Folder, LayoutGrid, HeartPulse, HardDrive, Terminal,
  PlusCircle, RefreshCcw, Wifi, AlertTriangle, Monitor, Shield, Info, X, ChevronRight, BarChart3, Radio, Search, Bell, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StaffUser, HospitalRole, SecurityPosture, Ward, WardBed } from '../types';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

import ThreatSimulatorView from './ThreatSimulatorView';

interface ITParametersDashboardProps {
  staffMembers: StaffUser[];
  onRefresh: () => void;
  currentUser: any;
  posture: SecurityPosture | null;
  incidentsCount: number;
  eventsCount: number;
  incidents?: any[];
  events?: any[];
  patients?: any[];
}

interface BackupDetail {
  id: string;
  timestamp: string;
  filename: string;
  size: string;
  status: string;
  createdBy: string;
}

export default function ITParametersDashboard({ 
  staffMembers, 
  onRefresh, 
  currentUser, 
  posture,
  incidentsCount,
  eventsCount,
  incidents = [],
  events = [],
  patients = []
}: ITParametersDashboardProps) {

  // Selected Tab matches sidebar spec
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification center states
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'System backup validation complete. All blocks matching checksum.', time: '09:25 AM', read: false },
    { id: '2', text: '5 suspicious brute force LDAP attempts locked by PAM gateway.', time: '09:10 AM', read: false },
    { id: '3', text: 'Network route optimization for LIS segment committed.', time: '08:45 AM', read: true },
    { id: '4', text: 'Central log router reported high syslog buffer utilization.', time: '08:15 AM', read: false },
    { id: '5', text: 'Public API server health check returned green (100% SLA).', time: '08:00 AM', read: true },
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Policy configuration parameters state
  const [bruteForceThreshold, setBruteForceThreshold] = useState<number>(3);
  const [anomalyScoringWeight, setAnomalyScoringWeight] = useState<number>(1.2);
  const [auditLoggingRetention, setAuditLoggingRetention] = useState<number>(90);
  const [isDeployingConfig, setIsDeployingConfig] = useState<boolean>(false);
  const [configSuccessMessage, setConfigSuccessMessage] = useState<string | null>(null);

  // User management states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User creation form states
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<HospitalRole>(HospitalRole.DOCTOR);
  const [newUserDepartment, setNewUserDepartment] = useState('Medical Consultations');
  const [newUserLimit, setNewUserLimit] = useState(30);
  const [newUserStartHour, setNewUserStartHour] = useState(8);
  const [newUserEndHour, setNewUserEndHour] = useState(17);
  const [newUserDevices, setNewUserDevices] = useState('Clinic-Desk-PC-12');
  const [newUserIps, setNewUserIps] = useState('10.20.2.110');

  // Edit staff configuration toggles
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState('');

  // Wards andbeds management
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [selectedWardName, setSelectedWardName] = useState<string>('');
  const [newWardName, setNewWardName] = useState('');
  const [newWardDept, setNewWardDept] = useState('Inpatient Medicine');
  const [newWardLocation, setNewWardLocation] = useState('East Wing, 3rd Floor');

  // Backups state
  const [backups, setBackups] = useState<BackupDetail[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Syslog terminal ticker for IT admins
  const [itSyslogs, setItSyslogs] = useState<Array<{ id: string; time: string; action: string; desc: string }>>([
    { id: "SYS-728", time: new Date(Date.now() - 30 * 60000).toLocaleTimeString(), action: "LDAP_SYNC", desc: "Successfully synchronized directory catalog with active domain controller" },
    { id: "SYS-727", time: new Date(Date.now() - 55 * 60000).toLocaleTimeString(), action: "BACKUP_VERIFY", desc: "Weekly automatic SQL dump checks: PASSED index health integration" },
    { id: "SYS-726", time: new Date(Date.now() - 170 * 60000).toLocaleTimeString(), action: "CERT_ROTATE", desc: "SSL terminal gateway connection rotated. Port 443 active." }
  ]);

  useEffect(() => {
    fetchSystemConfig();
    fetchBackups();
    fetchBedsAndWards();
  }, []);

  // Fetch Policy configurations from backend
  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/admin/configuration');
      if (res.ok) {
        const data = await res.json();
        setBruteForceThreshold(data.bruteForceThreshold || 3);
        setAnomalyScoringWeight(data.anomalyScoringWeight || 1.2);
        setAuditLoggingRetention(data.auditLoggingRetention || 90);
      }
    } catch (e) {
      console.error("Config fetch parameters warning:", e);
    }
  };

  // Fetch backups dump from server
  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error("Backup listing logs fault:", err);
    }
  };

  // Fetch beds and wards lists
  const fetchBedsAndWards = async () => {
    try {
      const p1 = fetch('/api/admin/wards').then(r => r.json());
      const p2 = fetch('/api/admin/beds').then(r => r.json());
      const [dataW, dataB] = await Promise.all([p1, p2]);
      setWards(dataW.wards || []);
      setBeds(dataB.beds || []);
      if (dataW.wards && dataW.wards.length > 0) {
        setSelectedWardName(dataW.wards[0].name);
      }
    } catch (e) {
      console.log("Wards sync warning:", e);
    }
  };

  // Trigger floating status notifications
  const triggerNotification = (successMsg: string | null, errorMsg: string | null = null) => {
    if (successMsg) {
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
    if (errorMsg) {
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  // Policy Settings override API
  const handleDeployConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeployingConfig(true);
    setConfigSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bruteForceThreshold, anomalyScoringWeight, auditLoggingRetention })
      });
      if (res.ok) {
        triggerNotification("Security algorithms threshold configurations saved securely.");
        onRefresh();
      } else {
        triggerNotification(null, "Authentication overrides deployment failed.");
      }
    } catch (err) {
      triggerNotification(null, "EHR configuration server timeout.");
    } finally {
      setIsDeployingConfig(false);
    }
  };

  // Trigger manual SQL/EHR hot file backup via API
  const handlePerformHotBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      if (res.ok) {
        triggerNotification("Incremental SQL schemas backup mirrored to Offsite hot vault.");
        fetchBackups();
        onRefresh();
        // Append syslogs
        setItSyslogs(prev => [
          { id: `SYS-${Math.floor(Math.random() * 200) + 800}`, time: new Date().toLocaleTimeString(), action: "BACKUP_RUN", desc: "Manual system database backup run completed. Encrypted in cloud archives." },
          ...prev
        ]);
      } else {
        triggerNotification(null, "Backup storage server is active but rejected mirroring request.");
      }
    } catch (err) {
      triggerNotification(null, "Backup process failed: remote server timeout.");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Create User Account in directory
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName || !newUserUsername) {
      triggerNotification(null, "Username and Full Name properties are required.");
      return;
    }
    try {
      const payload = {
        fullName: newUserFullName,
        username: newUserUsername.trim().toLowerCase(),
        role: newUserRole,
        department: newUserDepartment,
        averageDailyAccessLimit: Number(newUserLimit),
        normalHours: { start: Number(newUserStartHour), end: Number(newUserEndHour) },
        typicalDevices: newUserDevices.split(',').map(s => s.trim()),
        typicalIps: newUserIps.split(',').map(i => i.trim())
      };
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerNotification(`New staff profile @${payload.username} registered in EHR records.`);
        setIsCreatingUser(false);
        // Reset form
        setNewUserFullName('');
        setNewUserUsername('');
        onRefresh();
      } else {
        const d = await res.json();
        triggerNotification(null, d.error || "Failed to commit directory records.");
      }
    } catch (err) {
      triggerNotification(null, "User creation service channel interrupted.");
    }
  };

  // Edit User details & status
  const handleUpdateUserStatus = async (staff: StaffUser, newStatus: 'Active' | 'Suspended') => {
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: staff.username,
          fullName: staff.fullName,
          role: staff.role,
          department: staff.department,
          status: newStatus 
        })
      });
      if (res.ok) {
        triggerNotification(`Staff user @${staff.username} account state changed to ${newStatus}.`);
        onRefresh();
        setSelectedStaff(null);
      } else {
        triggerNotification(null, "Failed to modify staff authentication role.");
      }
    } catch (e) {
      triggerNotification(null, "User parameters server timeout.");
    }
  };

  // Clear credentials lock / password reset
  const handlePasswordReset = async (staffId: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/reset`, { method: 'POST' });
      if (res.ok) {
        triggerNotification(`Temporary credentials generated. Password and shift logs reset for user @${username}.`);
        onRefresh();
        setSelectedStaff(null);
      } else {
        triggerNotification(null, "Account password override operation failed.");
      }
    } catch (err) {
      triggerNotification(null, "Credential reset service timeout.");
    }
  };

  // Create Wards
  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWardName) return;
    try {
      const res = await fetch('/api/admin/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWardName, department: newWardDept, location: newWardLocation, capacity: 6 })
      });
      if (res.ok) {
        triggerNotification(`Ward ${newWardName} instantiated in bed manager registry.`);
        setNewWardName('');
        fetchBedsAndWards();
        onRefresh();
      }
    } catch (e) {
      triggerNotification(null, "Ward manager communication failure.");
    }
  };

  // Safe variables computation
  const activeSessionsCount = 12;
  const filteredStaffFiles = staffMembers.filter((sm) => {
    const q = searchTerm.toLowerCase();
    return sm.username.toLowerCase().includes(q) || 
           sm.fullName.toLowerCase().includes(q) || 
           sm.department.toLowerCase().includes(q);
  });

  // Recharts Chart Health Mock Metrics
  const systemPerformanceMetrics = [
    { name: '08:00', CPU: 12, Memory: 41, Disk: 32 },
    { name: '09:00', CPU: 24, Memory: 44, Disk: 34 },
    { name: '10:00', CPU: 38, Memory: 49, Disk: 35 },
    { name: '11:00', CPU: 28, Memory: 45, Disk: 35 },
    { name: '12:00', CPU: 18, Memory: 38, Disk: 35 },
    { name: '13:00', CPU: 21, Memory: 39, Disk: 36 },
    { name: '14:00', CPU: 42, Memory: 51, Disk: 37 }
  ];

  // Recharts Patch Management statuses mock
  const patchStatusMock = [
    { name: 'Updated', value: 162, color: '#10b981' },
    { name: 'Pending', value: 48, color: '#eab308' },
    { name: 'Failed', value: 10, color: '#ef4444' },
    { name: 'N/A', value: 5, color: '#94a3b8' }
  ];

  // Recharts 7-Day Syslog Health Trends
  const systemHealthTrends = [
    { name: 'May 21', Logins: 580, Failed: 42, Alerts: 3 },
    { name: 'May 22', Logins: 710, Failed: 38, Alerts: 1 },
    { name: 'May 23', Logins: 620, Failed: 59, Alerts: 8 },
    { name: 'May 24', Logins: 830, Failed: 31, Alerts: 2 },
    { name: 'May 25', Logins: 420, Failed: 48, Alerts: 0 },
    { name: 'May 26', Logins: 690, Failed: 52, Alerts: 6 },
    { name: 'May 27', Logins: 740, Failed: 67, Alerts: 5 }
  ];

  // Device records matching specification
  const deviceInventoryMock = [
    { name: 'DOC-WKS-012', type: 'Workstation', user: 'Dr. Gregory House', status: 'Online', health: 'Good', ip: '192.168.10.25' },
    { name: 'NUR-TBL-045', type: 'Tablet', user: 'Nurse Florence', status: 'Online', health: 'Good', ip: '192.168.10.87' },
    { name: 'LAB-PC-018', type: 'Desktop', user: 'Lab Tech Tunde', status: 'Online', health: 'Good', ip: '192.168.10.45' },
    { name: 'PACS-SRV-01', type: 'Server', user: 'Radiology Dept', status: 'Online', health: 'Good', ip: '192.168.10.66' },
    { name: 'PHARM-PC-07', type: 'Desktop', user: 'Pharm. Adewale', status: 'Online', health: 'Good', ip: '192.168.10.74' }
  ];

  const activeSessionsMock = [
    { user: 'Dr. Gregory House', device: 'DOC-WKS-012', ip: '192.168.10.25', location: 'Consult Room 2', time: '10:12 AM' },
    { user: 'Nurse Florence', device: 'NUR-TBL-045', ip: '192.168.10.87', location: 'Ward 3', time: '10:11 AM' },
    { user: 'Lab Tech Tunde', device: 'LAB-PC-018', ip: '192.168.10.45', location: 'Laboratory', time: '10:09 AM' },
    { user: 'Radiology Admin', device: 'RAD-WKS-03', ip: '192.168.10.66', location: 'Radiology', time: '10:05 AM' },
    { user: 'James Wilson', device: 'ADMIN-PC-01', ip: '192.168.10.5', location: 'IT Office', time: '10:02 AM' }
  ];

  const serversTableMock = [
    { name: 'EHR-APP-01', cpu: '23%', memory: '45%', disk: '40%', status: 'Healthy' },
    { name: 'EHR-DB-01', cpu: '31%', memory: '52%', disk: '48%', status: 'Healthy' },
    { name: 'PACS-SRV-01', cpu: '28%', memory: '49%', disk: '35%', status: 'Healthy' },
    { name: 'LAB-SRV-01', cpu: '18%', memory: '36%', disk: '30%', status: 'Healthy' },
    { name: 'FILE-SRV-01', cpu: '22%', memory: '41%', disk: '55%', status: 'Warning' }
  ];

  const systemServicesMock = [
    { name: 'EHR Service', status: 'Operational', color: 'bg-emerald-500' },
    { name: 'Laboratory Service', status: 'Operational', color: 'bg-emerald-500' },
    { name: 'Radiology Service', status: 'Operational', color: 'bg-emerald-500' },
    { name: 'Pharmacy System', status: 'Operational', color: 'bg-emerald-500' },
    { name: 'Billing System', status: 'Operational', color: 'bg-emerald-500' },
    { name: 'Email Service', status: 'Operational', color: 'bg-emerald-500' }
  ];

  return (
    <div className="flex bg-[#fafbfe] text-slate-700 min-h-screen -m-6 relative font-sans" id="it-administrator-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Toast Notifiers Banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-[#10b981] border border-emerald-500/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3 font-mono text-xs max-w-sm"
          >
            <CheckCircle className="text-emerald-500 animate-pulse shrink-0" size={18} />
            <div>
              <p className="font-semibold text-white uppercase tracking-wider text-[10px]">Cyber Guard Audit Notification</p>
              <p className="text-slate-300 text-[11px] mt-0.5">{successMessage}</p>
            </div>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-rose-950 border border-rose-800 text-rose-300 shadow-2xl rounded-2xl p-4 flex items-center gap-3 font-mono text-xs max-w-sm"
          >
            <AlertOctagon className="text-rose-500 animate-pulse shrink-0" size={18} />
            <div>
              <p className="font-semibold text-white uppercase tracking-wider text-[10px]">System Failure Log</p>
              <p className="text-rose-200 text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================== STICKY SIDEBAR (ADMIN BLUE vCENTER STYLE) ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-[#0f172a] text-slate-400 border-r border-[#1e293b]/50 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="it-settings-sidebar">
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-[#1e293b]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-[#0f172a] shadow-sm">
                <Server size={18} className="stroke-indigo-955 fill-none animate-pulse" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-white text-sm font-bold block tracking-tight">St. Jude Medical</span>
                <span className="text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider block">IT Admin Station</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Close Menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4">
            <span className="block text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold mb-3 pl-1.5">IT OPERATIONS</span>
            <nav className="space-y-1 block" id="it-nav-list">
              {[
                { name: 'Dashboard', icon: LayoutGrid },
                { name: 'Threat Simulator', icon: Play },
                { name: 'User Management', icon: Users },
                { name: 'Device Management', icon: Monitor },
                { name: 'Infrastructure', icon: Cpu },
                { name: 'Servers', icon: HardDrive },
                { name: 'Network', icon: Wifi },
                { name: 'Database Management', icon: Database },
                { name: 'Backups', icon: Folder },
                { name: 'Patch Management', icon: Shield },
                { name: 'System Health', icon: HeartPulse },
                { name: 'Audit Logs', icon: FileText },
                { name: 'Security Events', icon: ShieldAlert },
                { name: 'Reports', icon: BarChart3 },
                { name: 'Settings', icon: Sliders }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/10' 
                        : 'hover:bg-slate-800/20 hover:text-slate-200 bg-transparent text-slate-400'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-400'} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footprint Indicator */}
        <div className="p-4 mx-4 bg-[#111827] border border-[#1e293b]/40 rounded-xl space-y-1.5 mt-auto">
          <p className="text-[9px] font-mono text-slate-500 leading-normal">
            All system modification parameters, directory additions, and config overrides are monitored and logged directly to ATIF Telemetry.
          </p>
        </div>
      </aside>

      {/* ========================== MAIN WORKSPACE COCKPIT ========================== */}
      <main className="flex-1 overflow-y-auto p-6 text-left" id="it-main-workspace">
        
        {/* ========================== MAIN HEADER ========================== */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-200 pb-5" id="it-header">
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
              <h1 className="text-xl font-extrabold font-sans tracking-tight text-slate-900">
                IT Administrator Dashboard
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">St. Jude Health IT Operations Center • Central Records Directory Services</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Real Search Inputs */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="User Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder:text-slate-400 text-slate-700 w-36 focus:outline-none focus:ring-1 focus:ring-indigo-505"
              />
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Device Search" 
                className="pl-8 pr-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder:text-slate-400 text-slate-700 w-36 focus:outline-none focus:ring-1 focus:ring-indigo-505"
              />
            </div>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer relative shrink-0 block"
                title="System Notifications"
              >
                <Bell size={15} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center">
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
                          setSuccessMessage("All IT notifications marked as read.");
                        }} 
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
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
                            setSuccessMessage(`Alert read: "${n.text}"`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-indigo-50/10 font-medium' : ''}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-indigo-600' : 'bg-slate-300'}`} />
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
                          setSuccessMessage("Cleared all system notifications.");
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

            {/* Profile badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 border rounded-xl shadow-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                JW
              </div>
              <div className="text-left leading-tight text-xs">
                <div className="font-bold text-slate-800">James Wilson</div>
                <div className="text-slate-400 font-mono text-[9px]">IT Operations • Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' ? (
          <div className="space-y-6" id="it-dashboard-layout-view">
            
            {/* ========================== KPI OPERATIONAL CARDS (6 items) ========================== */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Active Users</span>
                <span className="block text-2xl font-extrabold text-[#3b82f6] mt-1 font-sans">1,245</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; +18 online now
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Online Devices</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">823</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold block mt-1">
                  &uarr; +27 desk tablets
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Servers Online</span>
                <span className="block text-2.5xl text-2xl font-extrabold text-[#10b981] mt-1 font-sans">24 / 24</span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold font-mono inline-block mt-1 uppercase">
                  All systems operating
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Network Health</span>
                <span className="block text-3xl font-black text-[#10b981] tracking-tight font-mono mt-1">99.8%</span>
                <span className="text-[10px] text-[#10b981] font-mono block mt-1">
                  Excellent cluster load
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left font-sans">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Failed Logins</span>
                <span className="block text-2.5xl text-2xl font-extrabold text-slate-800 tracking-tight font-mono mt-1">67</span>
                <span className="text-[10px] text-indigo-600 font-bold font-mono block mt-0.5">
                  &uarr; +12% vs yest
                </span>
              </div>

              <div className="p-4 bg-[#0f172a] text-white border border-slate-800 rounded-2xl shadow-sm text-left">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">System Alerts</span>
                <span className="block text-2xl font-extrabold text-[#f59e0b] mt-1 font-sans">12</span>
                <span className="text-[9px] text-[#eab308] font-bold block mt-1 uppercase tracking-tight">
                  Requires attention
                </span>
              </div>

            </div>

            {/* ========================== OPERATIONAL MULTI-GRID VIEWPORTS ========================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COMBINED COLUMNS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Horizontal row of Infrastructure and Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Module 1: Infrastructure Overview */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Infrastructure Overview</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Central virtualization node status and cluster registries</p>

                      <div className="grid grid-cols-2 gap-3.5 my-1 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-none">
                          <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold mb-1.5">Servers cluster</span>
                          <span className="font-bold text-slate-800 text-xs">24 / 24 Online</span>
                          <span className="block text-[8px] text-emerald-600 font-semibold font-mono mt-1">● HEALTHY NORMAL</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-none">
                          <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold mb-1.5">Databases core</span>
                          <span className="font-bold text-slate-800 text-xs">12 / 12 Loaded</span>
                          <span className="block text-[8px] text-emerald-600 font-semibold font-mono mt-1">● MIRRORING ACTIVE</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-none">
                          <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold mb-1.5">Storage Nodes</span>
                          <span className="font-bold text-slate-800 text-xs">18 / 20 Volumes</span>
                          <span className="block text-[8px] text-amber-500 font-semibold font-mono mt-1">▲ SAN SPACE WARNING</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-none">
                          <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold mb-1.5">Network Cards</span>
                          <span className="font-bold text-slate-800 text-xs">32 / 32 Devices</span>
                          <span className="block text-[8px] text-emerald-600 font-semibold font-mono mt-1">● 10GBPS INTERCONNECT</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('Infrastructure')} className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none">
                        View infrastructure map &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Module 2: System Health Monitor Chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-baseline gap-1.5">
                      System Health Monitor <span className="text-[10px] text-slate-400 font-mono font-normal">Real-Time</span>
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-mono mb-4">Active virtualization CPU, Memory, and Disk allocations load</p>

                    <div className="h-44 my-1">
                      <ResponsiveContainer width="100%" height="95%">
                        <LineChart data={systemPerformanceMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                          <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ fontSize: '10.5px', borderRadius: '12px' }} />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} />
                          <Line type="monotone" name="CPU Usage %" dataKey="CPU" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" name="Memory Usage %" dataKey="Memory" stroke="#10b981" strokeWidth={2} />
                          <Line type="monotone" name="Disk I/O %" dataKey="Disk" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Module 3: Recently Active Users & Live Device Inventory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Recently Active Users Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">User Directory Services</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Latest catalog synchronization with active clinical workers registry</p>

                      <div className="overflow-x-auto text-[10.5px] font-sans">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[8.5px] text-slate-400 bg-slate-50">
                              <th className="py-2 pl-2">User Name</th>
                              <th className="py-2">Role assigned</th>
                              <th className="py-2 text-right pr-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {staffMembers.slice(0, 5).map((sm) => (
                              <tr key={sm.id} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 pl-2 font-semibold text-slate-850">
                                  {sm.fullName}
                                  <span className="block text-[8.5px] font-mono text-slate-400 mt-0.5">@{sm.username}</span>
                                </td>
                                <td className="py-2.5 font-mono text-[9px] text-indigo-950 font-bold">
                                  {sm.role.replace("Role.", "")}
                                </td>
                                <td className="py-2.5 text-right pr-2">
                                  <button 
                                    onClick={() => {
                                      setSelectedStaff(sm);
                                      setActiveTab('User Management');
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-semibold cursor-pointer border"
                                  >
                                    AD Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('User Management')} className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none">
                        View all users &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Device Inventory (Online) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Device Inventory (Online)</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Active mobile tablet grids, workstations, and imaging terminals</p>

                      <div className="overflow-x-auto text-[10.5px] font-sans">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[8.5px] text-slate-400 bg-slate-50">
                              <th className="py-2 pl-2">Device Name</th>
                              <th className="py-2">Type / owner</th>
                              <th className="py-2 text-right pr-2">Health</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {deviceInventoryMock.map((dev, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 pl-2 font-mono font-semibold text-slate-850">
                                  {dev.name}
                                  <span className="block text-[8.5px] font-mono text-slate-400 mt-0.5">{dev.ip}</span>
                                </td>
                                <td className="py-2.5">
                                  <span className="font-semibold text-slate-800">{dev.type}</span>
                                  <span className="block text-[9px] text-slate-500 mt-0.5 font-sans">User: {dev.user}</span>
                                </td>
                                <td className="py-2.5 text-right pr-2">
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono font-bold uppercase">{dev.health}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('Device Management')} className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none">
                        View all devices &rarr;
                      </button>
                    </div>
                  </div>

                </div>

                {/* Module 6: Active Sessions (IP table) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Active User Sessions <span className="text-slate-450 font-mono text-xs font-normal ml-1.5">(AD Gateway)</span></h3>
                  <p className="text-[10.5px] text-slate-400 font-mono mb-4">Continuous ledger of authenticated network connection origins</p>

                  <div className="overflow-x-auto text-[10.5px] font-sans">
                    <table className="w-full text-left bg-transparent">
                      <thead>
                        <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50">
                          <th className="py-2.5 pl-2">User Authenticated</th>
                          <th className="py-2.5">Connected Device / IP</th>
                          <th className="py-2.5">Workspace Location</th>
                          <th className="py-2.5 text-right pr-2">Login Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {activeSessionsMock.map((sess, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 pl-2 font-semibold text-slate-850">
                              @{sess.user.toLowerCase().replace(" ", "")}
                              <span className="block text-[8.5px] font-sans text-slate-400 mt-0.5">{sess.user}</span>
                            </td>
                            <td className="py-2.5 font-mono text-indigo-950 font-bold leading-none">
                              {sess.device}
                              <span className="block text-[8.5px] font-mono text-slate-400 font-normal mt-1">{sess.ip}</span>
                            </td>
                            <td className="py-2.5 font-semibold text-slate-700">{sess.location}</td>
                            <td className="py-2.5 text-right pr-2 text-slate-400 font-mono">{sess.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT SIDEBAR MODULES COCKPIT */}
              <div className="space-y-6">
                
                {/* Module 4: Disaster Recovery status card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <Folder size={17} className="text-indigo-600" /> Backup & Recovery Vault
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-mono mb-4">Local PostgreSQL binary mirrors hot offsite standby backups</p>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl leading-relaxed flex gap-2.5">
                        <Database size={15} className="text-indigo-650 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-mono text-[9px] text-indigo-400 block font-bold leading-none uppercase">Last automatic check</span>
                          <span className="block font-bold text-slate-800 text-[11px] mt-1 pr-1 truncate">{backups.length > 0 ? backups[0].filename : 'SQL_AUTO_MIRROR.dump'}</span>
                          <span className="block font-mono text-[9px] text-indigo-905 text-indigo-600 font-semibold mt-0.5">Status: Successful verification checks</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="p-2.5 border rounded-xl bg-slate-50 text-left">
                          <span className="text-[8px] font-mono text-slate-400 block">NEXT AUTO MATRIX</span>
                          <span className="font-bold text-slate-700">Daily 02:00 AM</span>
                        </div>
                        <div className="p-2.5 border rounded-xl bg-slate-50 text-left">
                          <span className="text-[8px] font-mono text-slate-400 block">MIRROR TARGET</span>
                          <span className="font-bold text-slate-700">Cloud Standby</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePerformHotBackup}
                    disabled={isCreatingBackup}
                    className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-4 transition border border-slate-900 leading-none h-9 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-150"
                  >
                    <RefreshCw size={12} className={isCreatingBackup ? 'animate-spin' : ''} />
                    {isCreatingBackup ? 'Performing backup vault mirror...' : 'Run EHR hot system backups'}
                  </button>
                </div>

                {/* Module 5: Patch Management donut chart */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-[#0f172a] text-sm tracking-tight">Active Software Patches</h3>
                  <p className="text-[10.5px] text-[#94a3b8] font-mono mb-4">Latest core patches distribution status across hospital systems</p>

                  <div className="flex justify-between items-center h-40">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={patchStatusMock}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={52}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {patchStatusMock.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-1/2 space-y-2 text-[10.5px]">
                      {patchStatusMock.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b pb-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-650">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-900 font-bold">{item.value} Sys</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-1.5 text-center">
                    <button onClick={() => setActiveTab('Patch Management')} className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none">
                      View all patch statuses &rarr;
                    </button>
                  </div>
                </div>

                {/* Module 7: Server Health Monitor Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-[#0f172a] text-sm tracking-tight">Server Monitoring</h3>
                  <p className="text-[10.5px] text-[#94a3b8] font-mono mb-4">Central EHR physical processing matrices and performance health</p>

                  <div className="space-y-2 text-xs">
                    {serversTableMock.map((srv, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-155 flex justify-between items-center leading-none text-left">
                        <div className="leading-tight">
                          <span className="font-bold text-slate-800 font-mono text-[11px] block">{srv.name}</span>
                          <span className="block font-mono text-[8.5px] text-slate-400 mt-1">CPU: {srv.cpu} • RAM: {srv.memory} • HDD: {srv.disk}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold uppercase ${
                          srv.status === 'Healthy' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>{srv.status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#f1f5f9] pt-3 mt-4 text-center">
                    <button onClick={() => setActiveTab('Servers')} className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer bg-transparent border-none">
                      Manage all app servers
                    </button>
                  </div>
                </div>

                {/* Module 8: System Services Status */}
                <div className="bg-[#0f172a] text-white border border-slate-800 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-white text-sm tracking-tight">Active Platform Services</h3>
                  <p className="text-[10px] text-slate-400 font-mono mb-4">Core EHR system protocols operational status ledger</p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    {systemServicesMock.map((serv, idx) => (
                      <div key={idx} className="p-2 bg-[#1e293b]/60 rounded-lg border border-slate-800 flex justify-between items-center shrink-0">
                        <span className="text-slate-300 font-semibold truncate pr-1">{serv.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${serv.color} inline-block`} />
                          <span className="text-[8px] text-slate-400 uppercase font-bold">LIVE</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-3 mt-4 text-center">
                    <button onClick={() => triggerNotification("Services parameters dashboard verified. All modules online.")} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer bg-transparent border-none leading-none">
                      Refresh continuous services checks
                    </button>
                  </div>
                </div>

                {/* Module 9: System Health Analytics Trend Map (7-day line chart) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">System Health Analytics</h3>
                  <p className="text-[10.5px] text-slate-400 font-mono mb-4">Failed logins, alerts trends over past week cycle metrics</p>

                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="95%">
                      <AreaChart data={systemHealthTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" name="Uncaught Logs Alerts" dataKey="Alerts" stroke="#f59e0b" fillOpacity={0} />
                        <Area type="monotone" name="Failed Logins" dataKey="Failed" stroke="#ef4444" fill="url(#colorFailed)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ========================== ADMINISTRATIVE ACTIVE TAB VIEWPORT CONTROLS ========================== */
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm text-left relative min-h-96">

            {activeTab === 'Threat Simulator' && (
              <ThreatSimulatorView 
                currentUser={currentUser}
                patients={patients}
                incidents={incidents}
                events={events}
                onRefresh={onRefresh}
              />
            )}

            {/* AD Directory / Users Sync panel */}
            {activeTab === 'User Management' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a] font-mono uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={16} /> Active Directory Catalog sync
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Add, edit, toggle suspension states, reset password hashes for users in St. Jude Health internal directories.</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsCreatingUser(!isCreatingUser);
                      setSelectedStaff(null);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={12} /> {isCreatingUser ? "Cancel addition" : "Register new staff"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {isCreatingUser ? (
                    /* CREATE USER FORM */
                    <form onSubmit={handleCreateUser} className="md:col-span-1 p-5 border rounded-2xl bg-slate-50/50 space-y-4 max-w-sm">
                      <h4 className="font-bold text-xs uppercase text-slate-400 font-mono tracking-wider tracking-widest">Register New Clinical Identity</h4>
                      
                      <div className="space-y-1 text-xs">
                        <label className="font-semibold text-slate-500">FullName Profile</label>
                        <input
                          type="text" required
                          value={newUserFullName}
                          onChange={(e) => setNewUserFullName(e.target.value)}
                          placeholder="e.g. Dr. Robert Chase"
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-semibold text-slate-500">Directory Account ID (@username)</label>
                        <input
                          type="text" required
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                          placeholder="e.g. dr.chase"
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-semibold text-slate-500">Hospital Role Designation</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as HospitalRole)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                        >
                          <option value={HospitalRole.DOCTOR}>Doctor (Clinician)</option>
                          <option value={HospitalRole.NURSE}>Nurse (Wards)</option>
                          <option value={HospitalRole.LAB_SCIENTIST}>Laboratory Scientist</option>
                          <option value={HospitalRole.RADIOLOGY_OFFICER}>Radiology Officer</option>
                          <option value={HospitalRole.PHARMACIST}>Pharmacist</option>
                          <option value={HospitalRole.HIM_OFFICER}>Health Information Management Officer</option>
                          <option value={HospitalRole.ACCOUNTS_OFFICER}>Accounts Officer</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-semibold text-slate-500">Shift Department Namespace</label>
                        <input
                          type="text"
                          value={newUserDepartment}
                          onChange={(e) => setNewUserDepartment(e.target.value)}
                          placeholder="e.g. Emergency Medicine"
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-500">Shift Start HOUR (0-23)</label>
                          <input type="number" value={newUserStartHour} onChange={(e) => setNewUserStartHour(Number(e.target.value))} className="w-full border p-1.5 rounded-lg bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-500">Shift End HOUR (0-23)</label>
                          <input type="number" value={newUserEndHour} onChange={(e) => setNewUserEndHour(Number(e.target.value))} className="w-full border p-1.5 rounded-lg bg-white" />
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                        Deploy credentials to LDAP
                      </button>
                    </form>
                  ) : selectedStaff ? (
                    /* DEPLOY USER ACTIONS AND DETAILS */
                    <div className="md:col-span-1 p-5 border border-slate-200 rounded-2xl bg-indigo-50/15 text-left text-xs space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold leading-none mb-1">User catalog details</span>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{selectedStaff.fullName}</h4>
                        <span className="block font-mono text-[9px] text-[#4f46e5] font-semibold mt-1">Account reference: @{selectedStaff.username}</span>
                      </div>

                      <div className="space-y-2 border-t pt-3 border-slate-100">
                        <p className="font-bold text-[9px] font-mono text-slate-400 uppercase leading-none">Security Directives</p>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handlePasswordReset(selectedStaff.id, selectedStaff.username)}
                            className="flex-1 py-1 px-2.5 bg-white border rounded-xl text-[9px] font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Unlock size={11} className="text-amber-500" /> Temp Password
                          </button>
                          
                          {selectedStaff.status === "Suspended" ? (
                            <button 
                              onClick={() => handleUpdateUserStatus(selectedStaff, "Active")}
                              className="flex-1 py-1 px-2.5 bg-emerald-50 text-emerald-800 border-emerald-200 border rounded-xl text-[9px] font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserCheck size={11} className="text-emerald-600" /> Unlock user
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateUserStatus(selectedStaff, "Suspended")}
                              className="flex-1 py-1 px-2.5 bg-rose-50 text-rose-850 border-rose-200 border rounded-xl text-[9px] font-bold hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer font-black"
                            >
                              <Lock size={11} className="text-rose-600 font-extrabold" /> Suspend account
                            </button>
                          )}
                        </div>

                        <div className="bg-slate-50 border p-3 rounded-xl space-y-2 font-mono text-[9px]">
                          <p className="font-bold text-slate-400 leading-none">Active Telemetry Baselines</p>
                          <p>Department: {selectedStaff.department}</p>
                          <p>Risk Threshold: {selectedStaff.averageDailyAccessLimit || 30} record accesses/day</p>
                          <p>Shift coordinates: {selectedStaff.normalHours?.start}:00 - {selectedStaff.normalHours?.end}:00 UTC</p>
                          <p className="truncate">Devices: {selectedStaff.typicalDevices?.join(', ') || 'CorporatePC'}</p>
                          <p className="truncate">Allowed IPs: {selectedStaff.typicalIps?.join(', ') || '10.20.1.*'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-1 p-5 border border-dashed rounded-2xl text-slate-400 flex items-center justify-center text-xs italic text-center h-48 leading-relaxed">
                      Select any clinician registry from the list mapping column to view details, suspend access, unlock status, or configure baselines.
                    </div>
                  )}

                  {/* Right side list column */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-105 flex justify-between items-center">
                      <span className="text-[10.5px] text-slate-500 font-semibold font-mono">AD Synchronized Directory entries count: {filteredStaffFiles.length} profiles</span>
                      <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">LDAP CAT0 NORMAL</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto border rounded-2xl bg-white text-xs">
                      {filteredStaffFiles.map((sm) => (
                        <div 
                          key={sm.id} 
                          onClick={() => {
                            setSelectedStaff(sm);
                            setIsCreatingUser(false);
                          }}
                          className={`flex justify-between items-center p-3 hover:bg-slate-50 transition cursor-pointer leading-none pr-5 text-left ${selectedStaff?.id === sm.id ? 'bg-indigo-50/35 border-l-2 border-l-indigo-500' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center font-bold font-mono text-[10.5px] text-indigo-650 uppercase">
                              {sm.fullName.slice(0, 2)}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-805 text-slate-800">{sm.fullName}</span>
                              <span className="block text-[9.5px] text-indigo-600 font-mono mt-1">@{sm.username}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div className="text-right">
                              <span className="block text-[10px] font-semibold text-slate-600 font-mono">{sm.role}</span>
                              <span className="block text-[8.5px] text-slate-400 font-mono mt-1">{sm.department}</span>
                            </div>

                            {sm.status === "Suspended" ? (
                              <span className="px-1.5 py-0.2 bg-red-50 text-red-700 border border-red-105 rounded font-mono text-[8.5px] font-bold uppercase shrink-0">Suspended</span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-105 rounded font-mono text-[8.5px] font-bold uppercase shrink-0">Active</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Config & Security Thresholds settings */}
            {activeTab === 'Settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a] font-mono uppercase tracking-widest flex items-center gap-1.5 border-b pb-3 mb-2">
                    <Sliders size={16} className="text-[#3b82f6]" /> COMPLIANCE GATEWAY THRESHOLDS
                  </h3>
                  <p className="text-xs text-slate-500">Configure parameters utilized by the ATIF Threat intelligence daemon to calculate network threat risk scores and flag clinical profile outlier queries.</p>
                </div>

                <form onSubmit={handleDeployConfig} className="p-5 border rounded-2xl bg-slate-55 bg-slate-50 max-w-lg space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-850 text-slate-800">Failed Logins Trigger Threshold Attempts</label>
                    <input 
                      type="number" 
                      value={bruteForceThreshold} 
                      onChange={(e) => setBruteForceThreshold(Number(e.target.value))}
                      className="w-full border p-2.5 rounded-xl bg-white focus:outline-none" 
                    />
                    <p className="text-[9.5px] text-slate-400">Specifies successive failed credential hashes block on a device footprint before escalating incident status indices.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-850 text-slate-800">Security Heuristic Anomaly Coefficient Multiplier</label>
                    <input 
                      type="number" step="0.1"
                      value={anomalyScoringWeight} 
                      onChange={(e) => setAnomalyScoringWeight(Number(e.target.value))}
                      className="w-full border p-2.5 rounded-xl bg-white focus:outline-none" 
                    />
                    <p className="text-[9.5px] text-slate-400">Scaling index used to evaluate transaction frequency deviations compared to historical clinician baselines.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-850 text-slate-800">Audit Records Logs Retention Period (Days)</label>
                    <input 
                      type="number" 
                      value={auditLoggingRetention} 
                      onChange={(e) => setAuditLoggingRetention(Number(e.target.value))}
                      className="w-full border p-2.5 rounded-xl bg-white focus:outline-none" 
                    />
                    <p className="text-[9.5px] text-slate-400">Number of daily transactions retained in clinical cold vaults for forensic lookups compliance compliance verification.</p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isDeployingConfig}
                    className="px-5 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-205"
                  >
                    <ShieldCheck size={14} /> Deploy Configuration changes
                  </button>
                </form>
              </div>
            )}

            {/* Backups Storage logs */}
            {activeTab === 'Backups' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-905 text-slate-900 font-mono uppercase tracking-widest flex items-center gap-2">
                      <Folder size={16} className="text-indigo-600" /> Database Mirror snapshot lists
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Mirror schedules, cold file vault directories, and backups archive list.</p>
                  </div>
                  <button 
                    onClick={handlePerformHotBackup}
                    disabled={isCreatingBackup}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer border"
                  >
                    <RefreshCw size={12} className={isCreatingBackup ? 'animate-spin' : ''} />
                    Perform manual standby backups sync
                  </button>
                </div>

                <div className="divide-y border rounded-2xl bg-white text-xs font-mono">
                  {backups.map((bak, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between items-center leading-none pr-5 text-left hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <Folder size={18} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 text-[11px] font-sans block">{bak.filename}</span>
                          <span className="block text-[8.5px] text-slate-400 mt-1 font-mono">Vault Path Target: /mirror/standby/{bak.id} • Created: {new Date(bak.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-indigo-700">{bak.size}</span>
                        <span className="block text-[8px] text-emerald-600 font-bold uppercase font-mono mt-1">● COMPRESSED GZIP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General logs tab */}
            {(activeTab === 'Audit Logs' || activeTab === 'Security Events') && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-indigo-950 flex items-center gap-1.5 select-none">
                  <Terminal size={15} /> IT syslogs operations controller
                </h3>
                <p className="text-xs text-slate-500">Continuous ledger of directory changes, security policies deploy status, clinical backups checks, and infrastructure modifications recorded by Cyber Guard.</p>
                
                <div className="border border-slate-205 rounded-2xl p-4 bg-slate-900 text-emerald-400 font-mono text-[10.5px] space-y-2.5 max-h-96 overflow-y-auto shadow-inner text-left leading-relaxed">
                  <p className="text-slate-500 border-b border-slate-800 pb-1.5 select-none font-bold">// CONTINUOUS SYSLOG STREAM - ST_JUDE CLIENT v82.253</p>
                  {itSyslogs.map((log) => (
                    <div key={log.id} className="hover:bg-slate-800/20 p-1 rounded">
                      <span className="text-slate-500">[{log.time}]</span> <span className="text-indigo-400 font-bold font-black uppercase text-[#38bdf8]">{log.action}:</span> <span className="text-slate-200">{log.desc}</span>
                    </div>
                  ))}
                  <div className="text-[#34d399] leading-snug">STJ-HISD SYSLOG ENGINE: Status normal. Port 3000 mapping validated. Continuous ATIF audits logging.</div>
                </div>
              </div>
            )}

            {/* Static fallback for other tabs to provide pristine visual density */}
            {!['User Management', 'Settings', 'Backups', 'Audit Logs', 'Security Events'].includes(activeTab) && (
              <div className="space-y-6 py-6 text-center text-slate-400 italic text-xs leading-normal">
                <Monitor size={48} className="mx-auto text-slate-300 mb-3" />
                <p>This tab represents a dedicated operational segment of the St. Jude Health IT operations pipeline.</p>
                <p className="font-semibold text-slate-500">Configure triggers, sync nodes, and review metrics charts directly within the master Dashboard overview.</p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
