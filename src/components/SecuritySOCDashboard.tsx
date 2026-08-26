/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, Activity, Terminal, Users, Search, Bell, AlertTriangle, 
  HelpCircle, Cpu, RefreshCw, Send, Play, FileText, CheckCircle2, Clock, 
  TrendingUp, TrendingDown, Eye, Check, ChevronRight, X, Sliders, Layers, 
  Database, Network, ShieldX, UserCheck, AlertCircle, Info, Radio, Settings,
  MapPin, AlertOctagon, HelpCircle as HelpIcon, Lock, Menu, Archive, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SecurityPosture, ThreatIncident, SecurityEvent, UserBehaviorProfile, 
  ThreatFeedItem, SecurityRiskLevel, HospitalRole 
} from '../types';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

import SecurityCorrelationView from './SecurityCorrelationView';
import SecurityBehaviourView from './SecurityBehaviourView';
import SecurityIntelView from './SecurityIntelView';
import SecurityUserProfileView from './SecurityUserProfileView';
import SecurityAnalyticsView from './SecurityAnalyticsView';
import ThreatFeedView from './ThreatFeedView';
import SecurityEventsView from './SecurityEventsView';
import ThreatSimulatorView from './ThreatSimulatorView';
import InvestigationWorkspaceView from './InvestigationWorkspaceView';
import SecurityReportsView from './SecurityReportsView';
import ThreatRepositoryView from './ThreatRepositoryView';

interface SecuritySOCDashboardProps {
  posture: SecurityPosture | null;
  incidents: ThreatIncident[];
  events: SecurityEvent[];
  profiles: UserBehaviorProfile[];
  feed: ThreatFeedItem[];
  onRefresh: () => void;
  currentUser?: {
    userId: string;
    username: string;
    fullName: string;
    role: HospitalRole;
    department: string;
    ipAddress: string;
    deviceName: string;
  } | null;
  patients?: any[];
}

export default function SecuritySOCDashboard({ 
  posture, 
  incidents, 
  events, 
  profiles, 
  feed, 
  onRefresh,
  currentUser = null,
  patients = []
}: SecuritySOCDashboardProps) {

  // Sidebar Tabs list matches the specification image perfectly
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Search input filters
  const [threatSearch, setThreatSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Selected Incident state - initialized to trigger Explainable Detection Panel 
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'diagnosis' | 'correlation' | 'session'>('diagnosis');
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Behavior Charts toggle filters inside User Behavior Analytics
  const [behaviorFilter, setBehaviorFilter] = useState<'Login Trends' | 'Record Access' | 'Anomalies' | 'Device Usage'>('Login Trends');
  
  // Interactive correlation graph toggle
  const [activeCorrelationNode, setActiveCorrelationNode] = useState<'abuse' | 'insider'>('abuse');

  // Notification panel toggle
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: '1', text: 'Failed Logins audit: 4 consecutive login attempts on @nurse_florence', time: '09:30 AM', read: false },
    { id: '2', text: 'Sensitive Access alert: @doctor_house lookup VIP Senator dossier', time: '09:12 AM', read: false },
    { id: '3', text: 'Weekly system patch deployment pipeline validated (162 systems green)', time: '08:45 AM', read: true },
    { id: '4', text: 'Anomalous record download rate reported by EHR API gateway.', time: '08:20 AM', read: false },
    { id: '5', text: 'Firewall policy audit: outbound TLS 1.3 handshake verification success.', time: '08:00 AM', read: true },
  ]);

  // Trigger brief floating notifications
  const triggerNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string>('pharmacist_bob');

  // Safe deduplication of incidents (sorted descending by timestamp)
  const uniqueIncidents = Array.from(new Map(incidents.map(i => [i.id, i])).values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const liveThreatFeed = uniqueIncidents.slice(0, 5).map(inc => {
    let timeStr = 'Just now';
    try {
      const date = new Date(inc.timestamp);
      timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      // fallback
    }

    const risk = inc.riskLevel; // "Low" | "Medium" | "High" | "Critical"
    let color = 'text-blue-500 bg-blue-100/10';
    if (risk === 'Critical') color = 'text-red-500 bg-red-100/10';
    else if (risk === 'High') color = 'text-orange-500 bg-orange-100/10';
    else if (risk === 'Medium') color = 'text-amber-500 bg-amber-100/10';

    return {
      time: timeStr,
      type: inc.title || inc.threatType,
      user: inc.affectedUser,
      confidence: `${inc.riskScore}%`,
      risk: risk,
      color: color
    };
  });

  const liveThreatIntelFeed = uniqueIncidents.slice(0, 7).map(inc => {
    let timeStr = 'Just now';
    try {
      const date = new Date(inc.timestamp);
      timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      // fallback
    }

    const risk = inc.riskLevel; // "Low" | "Medium" | "High" | "Critical"
    let color = 'bg-blue-500/10 text-blue-700 font-bold border border-blue-500/20';
    if (risk === 'Critical') color = 'bg-red-500/10 text-red-700 font-bold border border-red-500/20';
    else if (risk === 'High') color = 'bg-orange-500/10 text-orange-700 font-bold border border-orange-500/20';
    else if (risk === 'Medium') color = 'bg-amber-500/10 text-amber-700 font-bold border border-amber-500/20';

    return {
      type: inc.title || inc.threatType,
      severity: risk,
      confidence: `${inc.riskScore}%`,
      status: inc.status,
      time: timeStr,
      color: color
    };
  });

  const liveIncidentsList = uniqueIncidents.map(inc => {
    let analystName = "Sarah Johnson";
    if (inc.timeline && inc.timeline.length > 0) {
      const lastAction = inc.timeline[inc.timeline.length - 1];
      if (lastAction.user && lastAction.user !== "ATIF Engine" && lastAction.user !== "ATIF Adaptive Engine v1.4") {
        analystName = lastAction.user;
      }
    }
    return {
      id: inc.id,
      type: inc.title || inc.threatType,
      severity: inc.riskLevel,
      status: inc.status,
      analyst: analystName,
      time: new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      rawIncident: inc
    };
  });

  const computedTopRiskUsers = profiles.map(profile => {
    const userIncidents = uniqueIncidents.filter(inc => inc.affectedUser.toLowerCase() === profile.username.toLowerCase());
    const activeIncident = userIncidents.find(inc => inc.status === "Open" || inc.status === "Investigating");
    
    let score = 0;
    let status = "";
    if (activeIncident) {
      score = activeIncident.riskScore;
      status = activeIncident.riskLevel; // Critical, High, etc.
    } else {
      // Baseline score
      score = profile.currentWeekViews > profile.averageWeeklyViews 
        ? Math.min(100, Math.round((profile.currentWeekViews / Math.max(1, profile.averageWeeklyViews)) * 52)) 
        : Math.min(100, Math.round((profile.currentWeekViews / Math.max(1, profile.averageWeeklyViews)) * 25));
      
      status = score > 75 ? "Critical" : score > 50 ? "High" : score > 25 ? "Medium" : "Low";
    }

    let displayName = profile.username;
    if (profile.username === 'him_officer') displayName = 'Elena Rostova';
    else if (profile.username === 'dr_house') displayName = 'Dr. Gregory House';
    else if (profile.username === 'nurse_rached') displayName = 'Nurse Florence Nightingale';
    else if (profile.username === 'pharmacist_bob') displayName = 'Pharmacist Bob';
    else if (profile.username === 'lab_scientist') displayName = 'Dr. Louis Pasteur';
    else if (profile.username === 'rad_officer') displayName = 'Marie Curie';
    else if (profile.username === 'analyst_sam') displayName = 'Sarah Johnson';

    return {
      user: displayName,
      username: profile.username,
      role: profile.role,
      score: score,
      status: status,
      trend: activeIncident ? 'up' : 'neutral'
    };
  }).sort((a, b) => b.score - a.score);

  const activeProfile = profiles.find(p => p.username.toLowerCase() === selectedProfileUsername.toLowerCase()) || profiles[0] || {
    userId: 'mock-id',
    username: 'pharmacist_bob',
    role: HospitalRole.PHARMACIST,
    averageWeeklyViews: 50,
    currentWeekViews: 65,
    loginHoursDistribution: {},
    recentIps: ['10.20.10.15'],
    recentDevices: ['PC-PHARM']
  };

  // Set initial selected Incident to give the analyst immediate explainable insight
  useEffect(() => {
    if (uniqueIncidents.length > 0 && !selectedIncident) {
      // Prioritize an open or unresolved item
      const initial = uniqueIncidents.find(i => i.status !== 'Resolved') || uniqueIncidents[0];
      setSelectedIncident(initial);
    }
  }, [uniqueIncidents]);

  // Handle status update of selected incident via API
  const handleUpdateStatus = async (newStatus: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved') => {
    if (!selectedIncident) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/security/incidents/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          note: `Analyst Sarah Johnson switched stage index to ${newStatus}.`
        })
      });
      if (res.ok) {
        triggerNotification(`Incident ${selectedIncident.id} status modified to ${newStatus}.`);
        onRefresh();
        // Update local object
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      } else {
        triggerNotification("Could not write SOC trace action logs.");
      }
    } catch (e) {
      triggerNotification("EHR database accounts communication failure.");
    } finally {
      setIsLoading(false);
    }
  };

  // Log custom analyst comment / activity timeline event
  const handleAddIncidentTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !investigatorNote.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/security/incidents/${selectedIncident.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "Analyst Note Added",
          note: investigatorNote
        })
      });
      if (res.ok) {
        triggerNotification("Analysis log added to forensic audit trail.");
        setInvestigatorNote('');
        onRefresh();
        // Reload details locally by appending
        const updatedTimeline = [
          ...(selectedIncident.timeline || []),
          { 
            timestamp: new Date().toISOString(), 
            action: "Analyst Note Added", 
            note: investigatorNote, 
            user: "Sarah Johnson" 
          }
        ];
        setSelectedIncident({ ...selectedIncident, timeline: updatedTimeline });
      } else {
        triggerNotification("Could not record timeline log entry.");
      }
    } catch (err) {
      triggerNotification("Failed to post journal entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const departmentRiskMap = [
    { name: 'Emergency', value: 78, color: '#f43f5e' },
    { name: 'Radiology', value: 52, color: '#f97316' },
    { name: 'Laboratory', value: 46, color: '#f59e0b' },
    { name: 'Pharmacy', value: 31, color: '#22c55e' },
    { name: 'Outpatient', value: 29, color: '#10b981' },
    { name: 'Administration', value: 22, color: '#3b82f6' }
  ];

  // Recharts Trends Mock data
  const behaviorMockTrends = [
    { name: 'May 21', Logins: 620, FailedLogins: 45, Records: 1250, Anomalies: 2 },
    { name: 'May 22', Logins: 780, FailedLogins: 52, Records: 1480, Anomalies: 5 },
    { name: 'May 23', Logins: 540, FailedLogins: 68, Records: 1120, Anomalies: 9 },
    { name: 'May 24', Logins: 890, FailedLogins: 38, Records: 1750, Anomalies: 4 },
    { name: 'May 25', Logins: 410, FailedLogins: 42, Records: 920, Anomalies: 1 },
    { name: 'May 26', Logins: 720, FailedLogins: 55, Records: 1390, Anomalies: 7 },
    { name: 'May 27', Logins: 690, FailedLogins: 61, Records: 1310, Anomalies: 6 }
  ];

  // Map user selections or query searches
  const getSelectedIncidentExplanation = () => {
    if (!selectedIncident) return {
      threat: 'No incident selected',
      confidence: '0%',
      riskScore: 0,
      user: 'N/A',
      indicators: ['Select an incident from the Incident Queue to review automated logic explainbacks.']
    };

    const isMock = !selectedIncident.affectedUser;
    
    if (selectedIncident.threatType === 'CREDENTIAL_ABUSE' || selectedIncident.type === 'Credential Abuse') {
      return {
        threat: 'Credential Abuse',
        confidence: '91%',
        riskScore: '89',
        user: selectedIncident.affectedUser || 'Dr. Gregory House',
        indicators: [
          'Multiple successive LOGIN_FAILED events detected on account.',
          'Subsequent immediate LOGIN_SUCCESS from unregistered device.',
          'Logins occurring completely outside assigned shift schedule.',
          'Originating IP address flagged as geographical VPN proxy.',
          'Attempts to bypass multiple secondary LDAP directories.'
        ]
      };
    } else if (selectedIncident.threatType === 'INSIDER_THREAT' || selectedIncident.type === 'Insider Threat') {
      return {
        threat: 'Insider Threat',
        confidence: '88%',
        riskScore: '87',
        user: selectedIncident.affectedUser || 'Nurse Florence',
        indicators: [
          'User accessed 42 patient records within 15 minutes.',
          'Normal baseline performance: 8 records/day.',
          'Accessed dossier files across 4 unrelated departments.',
          'Sought lookup pathways for designated VIP patient directories.',
          'System interaction sequence deviates 320% from clinical means.'
        ]
      };
    } else if (selectedIncident.threatType === 'SENSITIVE_RECORD_ACCESS' || selectedIncident.type === 'Sensitive Record Access' || selectedIncident.type === 'Privilege Abuse') {
      return {
        threat: 'Privilege Abuse / Sensitive Record Lookup',
        confidence: '84%',
        riskScore: '82',
        user: selectedIncident.affectedUser || 'radiology.admin',
        indicators: [
          'Direct lookup request targeting restricted core audit folders.',
          'Requested record holds designated VIP/Executive status flags.',
          'No corresponding patient intake orders or lab referrals on file.',
          'Device fingerprint differs from typical desk terminals.',
          'Activity performed outside approved clinical workspace hours.'
        ]
      };
    }

    return {
      threat: selectedIncident.title || selectedIncident.type || 'Anomalous Behavioral Alert',
      confidence: '81%',
      riskScore: selectedIncident.riskScore || '75',
      user: selectedIncident.affectedUser || 'Unknown user',
      indicators: [
        'Heuristic scoring module triggered abnormal sequence deviation.',
        `Risk level classified as high with score weight: ${selectedIncident.riskScore || 75}/100.`,
        'Compliance breach tracking flagged HIPAA access anomalies.'
      ]
    };
  };

  const currentExplain = getSelectedIncidentExplanation();

  const activeThreatsCount = incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;
  const criticalAlertsCount = incidents.filter(i => (i.riskLevel === SecurityRiskLevel.CRITICAL || i.riskScore >= 75) && i.status !== 'Resolved' && i.status !== 'Mitigated').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Mitigated').length;
  const highRiskUsersCount = new Set(incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Mitigated').map(i => i.affectedUser)).size;
  const securityEventsCount = events.length;
  const threatIntelHitsCount = feed.length;

  const socPostureScore = Math.max(40, 100 - (openIncidentsCount * 5) - (criticalAlertsCount * 12));
  const socThreatLevel = socPostureScore >= 95 ? "SAFE" : socPostureScore >= 80 ? "MODERATE" : socPostureScore >= 60 ? "ELEVATED" : "CRITICAL";
  const socThreatColor = socPostureScore >= 95 ? "text-emerald-500" : socPostureScore >= 80 ? "text-amber-500" : socPostureScore >= 60 ? "text-orange-500" : "text-red-500";
  const socStrokeColor = socPostureScore >= 95 ? "#10b981" : socPostureScore >= 80 ? "#f59e0b" : socPostureScore >= 60 ? "#f97316" : "#ef4444";

  return (
    <div className="flex bg-[#fafbfe] text-slate-700 min-h-screen -m-6 relative font-sans" id="security-analyst-dashboard-root">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-35 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-emerald-400 border border-emerald-500/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3 font-mono text-xs max-w-sm"
          >
            <ShieldCheck className="text-emerald-500 animate-pulse shrink-0" size={18} />
            <div>
              <p className="font-semibold text-white uppercase tracking-wider text-[10px]">ATIF SOC Auditor Notice</p>
              <p className="text-slate-350 text-[11px] mt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================== STICKY SIDEBAR (SENTINEL DARK STYLE) ========================== */}
      <aside className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-68 bg-[#0b0e14] text-slate-400 border-r border-[#1e293b]/50 flex flex-col justify-between shrink-0 select-none pb-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'}`} id="security-sidebar">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 flex items-center justify-between border-b border-[#1e293b]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-[#0b0e14] shadow-sm">
                <Shield size={18} className="stroke-slate-950 fill-none" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-white text-sm font-bold block tracking-tight">St. Jude Medical</span>
                <span className="text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wider block">EHR System</span>
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
            <span className="block text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold mb-3 pl-1.5">SECURITY OPERATIONS</span>
            <nav className="space-y-1 block" id="security-nav-list">
              {[
                { name: 'Dashboard', icon: Layers },
                { name: 'Threat Analytics', icon: BarChart3 },
                { name: 'Threat Feed', icon: Activity },
                { name: 'ATIF Investigation Workspace', icon: ShieldX },
                { name: 'Risk Profiles', icon: Users },
                { name: 'Security Events', icon: Database },
                { name: 'Threat Correlation', icon: Network },
                { name: 'Behavior Analytics', icon: Sliders },
                { name: 'Threat Repository', icon: Settings },
                { name: 'Threat Intelligence', icon: Radio },
                { name: 'Threat Simulator', icon: Play },
                { name: 'Audit Logs', icon: FileText },
                { name: 'Reports', icon: Info }
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
                        ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/10' 
                        : 'hover:bg-slate-800/10 hover:text-slate-200 bg-transparent text-slate-400'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ATIF Live Watch Flag Footprint (Sentinel Theme) */}
        <div className="p-4 mx-4 bg-[#111827] border border-[#1e293b]/40 rounded-xl space-y-2 mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 uppercase font-black tracking-widest leading-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            ATIF Status: ACTIVE
          </div>
          <span className="block text-[10px] text-slate-400 font-mono">Last Updated</span>
          <span className="block text-[10px] text-emerald-400/90 font-mono tracking-tight font-bold">10:12:34 AM</span>
        </div>
      </aside>

      {/* ========================== MAIN MONITOR PANEL ========================== */}
      <main className="flex-1 overflow-y-auto p-6 text-left" id="security-main-workspace">
        
        {/* ========================== HEADER BAR ========================== */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-200 pb-5" id="security-header">
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
              <h1 className="text-xl font-extrabold font-sans tracking-tight text-slate-900 flex items-center gap-2">
                Security Analyst Dashboard
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">St. Jude Health Cybersecurity Operations Space • Guard Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
            {/* Threat Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Threat Search" 
                value={threatSearch}
                onChange={(e) => setThreatSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
              />
            </div>

            {/* Event Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Event Search" 
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
              />
            </div>

            {/* Patient Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Patient Search" 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
              />
            </div>

            {/* Reset SOC Data Button */}
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all security incidents, threat feed alerts, and event logs to their original baseline deployment state?")) {
                  fetch('/api/security/clear-all', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      setSelectedIncident(null);
                      setNotifications([
                        { id: '1', text: 'SOC Database completely reset to fresh hospital deployment baselines.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }), read: false }
                      ]);
                      triggerNotification("All SOC database incidents, threats, and event logs have been successfully reset to baseline states!");
                      onRefresh();
                    })
                    .catch(err => {
                      console.error("Failed to reset SOC data:", err);
                      triggerNotification("Error resetting SOC database state.");
                    });
                }
              }}
              className="p-1.5 px-2.5 border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono uppercase shrink-0"
              title="Reset SOC Data / Fresh Hospital Deployment"
            >
              <RefreshCw size={13} className="text-rose-500 hover:rotate-90 transition-transform animate-spin-hover" />
              <span>Reset SOC</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer relative block"
                title="System Notifications"
              >
                <Bell size={15} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-left overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-700 font-sans">
                      Active SOC Alert Feed ({notifications.filter(n => !n.read).length} unread)
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          triggerNotification("All alerts marked as read.");
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
                        No active threats or alerts in queue.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            triggerNotification(`Alert acknowledged: "${n.text.substring(0, 30)}..."`);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-red-50/10 font-medium' : ''}`}
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
                          triggerNotification("Cleared all alert feeds.");
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

            {/* Profile badge (Matching exactly) */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 border rounded-xl shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                SJ
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-bold text-slate-800">Sarah Johnson</div>
                <div className="text-slate-400 font-mono text-[9px]">Security Analyst • SOC Station</div>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' ? (
          <div className="space-y-6" id="dashboard-layout-viewport">
            
            {/* ========================== KPI CARDS BLOCK (7 Items including SOC STATUS Circle) ========================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              
              <button 
                onClick={() => {
                  setActiveTab('Threat Feed');
                  triggerNotification('Navigated to Threat Feed telemetry catalog');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-red-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-red-600 transition-colors">Active Threats</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">{activeThreatsCount}</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-1 flex items-center gap-0.5">
                  {activeThreatsCount > 0 ? "⚠️ Real-time detections" : "🟢 No active threats"}
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('ATIF Investigation Workspace');
                  triggerNotification('Active playbooks loaded for open Critical cases');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-rose-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-rose-600 transition-colors">Critical Alerts</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">{criticalAlertsCount}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold font-mono inline-block mt-1 uppercase rounded">
                  {criticalAlertsCount > 0 ? "Immediate attention" : "System Secure"}
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('ATIF Investigation Workspace');
                  triggerNotification('Incident Queue workspace active');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-orange-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-orange-600 transition-colors">Open Incidents</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">{openIncidentsCount}</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-1">
                  {openIncidentsCount > 0 ? `${openIncidentsCount} escalated on SIEM` : "All cases mitigated"}
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('Risk Profiles');
                  triggerNotification('Clinician risk profile list directory loaded');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-amber-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-amber-600 transition-colors">High Risk Users</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">{highRiskUsersCount}</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-1">
                  {highRiskUsersCount > 0 ? "Passive monitoring" : "Zero outliers detected"}
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('Security Events');
                  triggerNotification('Displaying raw clinical transaction logs');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left col-span-1 transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-indigo-650 transition-colors">Security Events</span>
                <span className="block text-xl font-extrabold text-slate-900 mt-1.5 font-sans">{securityEventsCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">
                  In telemetry logs
                </span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('Threat Intelligence');
                  triggerNotification('HHS/HC3 Cyber Intelligence signature bank loaded');
                }}
                className="p-4 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 rounded-2xl shadow-sm text-left transition-all cursor-pointer group"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-emerald-600 transition-colors">Threat Intel Hits</span>
                <span className="block text-2xl font-extrabold text-slate-900 mt-1 font-sans">{threatIntelHitsCount}</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono block mt-1">
                  &uarr; Live signatures
                </span>
              </button>

              {/* Seventh Item: Beautiful SOC status with circular posture gauge */}
              <button 
                onClick={() => {
                  onRefresh();
                  triggerNotification("Executing live posture sync. Threat databases up to date.");
                }}
                className="p-3 bg-[#0f172a] text-white border border-slate-800 hover:border-emerald-500 hover:bg-slate-900 rounded-2xl shadow-sm flex flex-col justify-between items-center text-center transition-all cursor-pointer"
              >
                <span className="block text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold tracking-widest leading-none">SOC STATUS</span>
                
                {/* Dial representation */}
                <div className="relative w-11 h-11 flex items-center justify-center my-0.5 bg-slate-800/20 rounded-full border border-slate-800">
                   <svg className="w-10 h-10 transform -rotate-90">
                     <circle cx="20" cy="20" r="16" stroke={socStrokeColor} strokeWidth="2.5" fill="transparent" strokeOpacity="0.1" />
                     <circle 
                       cx="20" cy="20" r="16" 
                       stroke={socStrokeColor} strokeWidth="3" fill="transparent" 
                       strokeDasharray="100"
                       strokeDashoffset={100 - socPostureScore}
                       strokeLinecap="round"
                     />
                   </svg>
                   <span className="absolute text-[9.5px] font-mono font-bold text-white">{socPostureScore}%</span>
                </div>
                <div className="leading-none mt-0.5">
                  <span className="block text-[8px] font-mono opacity-60 uppercase text-slate-400">Threat level</span>
                  <span className={`font-mono text-[9px] font-bold uppercase ${socPostureScore >= 95 ? 'text-emerald-400' : socPostureScore >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>{socThreatLevel}</span>
                </div>
              </button>

            </div>

            {/* ========================== MAIN GRID WORKSPACE MODULES ========================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COMBINED COCKPIT COLUMNS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Horizontal row of Live Threat Feed and Threat Intel Feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Module 1: Live Threat Feed Timeline */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Threat Feed
                        </h3>
                        <span className="text-[10px] uppercase font-mono font-bold text-red-500 tracking-wider">● LIVE</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Latest correlated threat events detected across EHR nodes</p>

                      <div className="space-y-4 font-sans text-xs relative pl-4 border-l border-slate-100">
                        {liveThreatFeed.length > 0 ? (
                          liveThreatFeed.map((f, i) => (
                            <div key={i} className="relative group">
                              {/* Dot indicator */}
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-white border-slate-900 flex items-center justify-center transition-all group-hover:scale-125" />
                              
                              <div className="flex flex-col text-[11.5px] leading-relaxed">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-400">{f.time}</span>
                                  <span className="font-bold text-slate-800">{f.type}</span>
                                </div>
                                <span className="block text-slate-500 text-[10.5px]">User: <strong className="text-slate-700">{f.user}</strong></span>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                  <span className="font-mono opacity-70">Confidence: {f.confidence}</span>
                                  <span>&bull;</span>
                                  <span className={`font-mono font-bold ${f.risk === 'Critical' ? 'text-red-600' : f.risk === 'High' ? 'text-orange-500' : 'text-amber-500'}`}>Risk: {f.risk}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 font-mono py-2 text-[11px]">
                            No active threats or alerts in queue.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('Threat Feed')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                        View all threats &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Module 2: Threat Intelligence Feed Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Threat Intelligence Feed</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Hunted indicators of compromise (IOC) metrics repository</p>

                      <div className="overflow-x-auto text-[11px] font-sans">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50/50">
                              <th className="py-2 pl-2">Threat Type</th>
                              <th className="py-2">Severity</th>
                              <th className="py-2">Conf.</th>
                              <th className="py-2 text-right pr-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {liveThreatIntelFeed.length > 0 ? (
                              liveThreatIntelFeed.map((intel, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition">
                                  <td className="py-2.5 pl-2 font-semibold text-slate-800 leading-none">
                                    {intel.type}
                                    <span className="block text-[8.5px] font-mono text-slate-400 mt-1">{intel.time}</span>
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono uppercase ${
                                      intel.severity === 'Critical' ? 'bg-red-50 text-red-700' :
                                      intel.severity === 'High' ? 'bg-orange-50 text-orange-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>
                                      {intel.severity}
                                    </span>
                                  </td>
                                  <td className="py-2.5 font-mono text-slate-500 font-semibold">{intel.confidence}</td>
                                  <td className="py-2.5 text-right pr-2">
                                    <span className="font-mono text-[9px] text-slate-400">{intel.status}</span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-slate-400 font-mono text-[10.5px]">
                                  No active intelligence feeds logged in registry cache.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('Threat Intelligence')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                        View all threats &rarr;
                      </button>
                    </div>
                  </div>

                </div>

                {/* Module 5: User Behaviour Analytics (Recharts graph) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">User Behaviour Analytics <span className="text-slate-400 font-normal text-xs font-mono ml-1.5">(Last 7 Days)</span></h3>
                      <p className="text-[10.5px] text-slate-400 font-mono">Dynamic profiling of authentication behaviors and records requests</p>
                    </div>
                    {/* Toggles */}
                    <div className="flex items-center gap-1.5 bg-slate-55 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['Login Trends', 'Record Access', 'Anomalies', 'Device Usage'] as any[]).map((tabOpt) => (
                        <button
                          key={tabOpt}
                          onClick={() => setBehaviorFilter(tabOpt)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-extrabold transition-all cursor-pointer ${
                            behaviorFilter === tabOpt 
                              ? 'bg-white text-slate-905 shadow-xs text-slate-800' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tabOpt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Recharts Chart selection */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="95%">
                      <LineChart data={behaviorMockTrends} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9.5} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis fontSize={9.5} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                        {behaviorFilter === 'Login Trends' && (
                          <>
                            <Line type="monotone" name="Successful Logins" dataKey="Logins" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                            <Line type="monotone" name="Failed Logins" dataKey="FailedLogins" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          </>
                        )}
                        {behaviorFilter === 'Record Access' && (
                          <Line type="monotone" name="Total EHR Record Lookups" dataKey="Records" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        )}
                        {behaviorFilter === 'Anomalies' && (
                          <Line type="monotone" name="Detected Behavioral Deviations" dataKey="Anomalies" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        )}
                        {behaviorFilter === 'Device Usage' && (
                          <Line type="monotone" name="Logins per Desk Station" dataKey="Logins" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Module 7: Incident Queue & Explainable Detection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Incident Queue (Left side) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Incident Queue</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Central triage workspace. Highlights display logic parameters</p>

                      <div className="overflow-x-auto text-[10.5px] font-sans">
                        <table className="w-full text-left bg-transparent">
                          <thead>
                            <tr className="border-b font-mono uppercase text-[8.5px] text-slate-400 bg-slate-50/50">
                              <th className="py-2 pl-2">Incident ID</th>
                              <th className="py-2">Type</th>
                              <th className="py-2 text-right pr-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {liveIncidentsList.length > 0 ? (
                              liveIncidentsList.map((inc) => {
                                const isSelected = selectedIncident && selectedIncident.id === inc.id;
                                return (
                                  <tr 
                                    key={inc.id}
                                    onClick={() => setSelectedIncident(inc.rawIncident)}
                                    className={`hover:bg-slate-50 transition cursor-pointer ${isSelected ? 'bg-emerald-50/50 border border-emerald-100' : ''}`}
                                  >
                                    <td className="py-3 pl-2 font-mono font-bold text-slate-900">{inc.id}</td>
                                    <td className="py-3 font-semibold text-slate-800">
                                      {inc.type}
                                      <span className="block text-[8.5px] text-slate-400 font-mono mt-0.5">Assigned: {inc.analyst}</span>
                                    </td>
                                    <td className="py-3 text-right pr-2">
                                      <span className={`px-1.5 py-0.2 rounded font-mono text-[8.5px] font-bold uppercase ${
                                        inc.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' : 
                                        inc.severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 
                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        {inc.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-400 font-mono text-[10.5px]">
                                  No incidents logged in the triage queue.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                      <button onClick={() => setActiveTab('ATIF Investigation Workspace')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                        Open all incident cases &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Explainable Detection Panel (Right side, matching incident table selection!) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Explainable Detection</h4>
                        <span className="bg-red-50 text-red-700 border border-red-100 font-mono text-[8.5px] font-bold uppercase px-2 py-0.5 rounded">
                          CRITICAL RISK
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-mono mb-4">Machine-generated diagnostic logs of the flagged threat anomalies</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100 text-xs font-semibold">
                          <span className="text-slate-400 font-mono">THREAT:</span>
                          <strong className="text-slate-900 uppercase font-bold text-indigo-950 font-sans tracking-tight">{currentExplain.threat}</strong>
                        </div>
                        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100 text-xs font-semibold">
                          <span className="text-slate-400 font-mono">CONFIDENCE SCORE:</span>
                          <strong className="text-slate-800 font-mono font-bold text-red-600">{currentExplain.confidence}</strong>
                        </div>
                        <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100 text-xs font-semibold">
                          <span className="text-slate-400 font-mono">COMBINED RISK:</span>
                          <strong className="text-slate-950 font-mono font-bold text-rose-700 text-base">{currentExplain.riskScore} / 100</strong>
                        </div>

                        {/* Interactive triggers reasons lists */}
                        <div className="space-y-4 pt-1.5">
                          <span className="block text-[8.5px] uppercase font-mono text-[#0284c7] font-bold">Why was this flagged?</span>
                          <ul className="space-y-2 text-[11px] leading-relaxed text-slate-650">
                            {currentExplain.indicators.map((indStr, indexInd) => (
                              <li key={indexInd} className="flex gap-2 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                                <span>{indStr}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-4 text-[10px]">
                          <p className="font-mono text-slate-400 leading-none">Affected User Token</p>
                          <p className="font-bold text-slate-700 text-[11px] mt-1 font-sans">@{currentExplain.user} (Clinical Staff Directory)</p>
                          <p className="text-slate-450 font-mono text-[9px] mt-0.5">First Detected: May 27, 2025 10:06 AM</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 text-center pb-1">
                      <button 
                        onClick={() => {
                          triggerNotification(`Forensic session opened for user ${currentExplain.user}.`);
                          setActiveTab('Behavior Analytics');
                        }}
                        className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                      >
                        <Sliders size={12} className="text-emerald-700" /> View full behavior analysis
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* RIGHT SIDEBAR MODULES COLUMN (Risk Heatmap, Top Risk Users, and Threat Correlation Graph) */}
              <div className="space-y-6">
                
                {/* Module 3: Top Risk Users */}
                <div className="bg-[#0f172a] text-white border border-slate-800 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-white text-sm tracking-tight">Top Risk Users</h3>
                  <p className="text-[10px] text-slate-400 font-mono mb-4">Calculated risk ratings across internal staff registries</p>

                  <div className="space-y-3 text-xs leading-none">
                    {computedTopRiskUsers.map((userObj, uIdx) => {
                      const handleSelectTopUser = (username: string) => {
                        setSelectedProfileUsername(username);
                        setActiveTab('Risk Profiles');
                        triggerNotification(`Navigated to forensic profile of @${username}`);
                      };

                      return (
                        <div 
                          key={uIdx} 
                          onClick={() => handleSelectTopUser(userObj.username)}
                          className="flex justify-between items-center py-2 border-b border-slate-800/60 pb-2.5 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center font-bold font-mono text-[10.5px] text-emerald-400 uppercase">
                              {userObj.user.slice(0, 2)}
                            </div>
                            <div className="text-left">
                              <span className="block font-bold text-slate-100">{userObj.user}</span>
                              <span className="block text-[9.5px] text-slate-400 mt-1 font-mono">{userObj.role}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-extrabold font-mono ${
                              userObj.score > 90 ? 'text-rose-500' : userObj.score > 70 ? 'text-orange-400' : 'text-amber-400'
                            }`}>
                              {userObj.score}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 mt-4 text-center">
                    <button onClick={() => setActiveTab('Risk Profiles')} className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer bg-transparent border-none">
                      View all risk users
                    </button>
                  </div>
                </div>

                {/* Module 4: Department Risk Heatmap */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Department Risk Heatmap</h3>
                  <p className="text-[10.5px] text-slate-400 font-mono mb-4">Combined security violation index ratings by location</p>

                  <div className="space-y-2.5 text-xs">
                    {departmentRiskMap.map((bar, barIdx) => (
                      <div key={barIdx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-semibold">
                          <span className="text-slate-500">{bar.name}</span>
                          <span className="font-mono font-bold text-slate-800">{bar.value}</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-50"
                            style={{ 
                              width: `${bar.value}%`, 
                              backgroundColor: bar.color 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <button onClick={() => setActiveTab('Risk Profiles')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                      View full heatmap &rarr;
                    </button>
                  </div>
                </div>

                {/* Module 6: Interactive Threat Correlation Graph Web (SVG) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Threat Correlation Graph</h3>
                    
                    {/* Map Selection toggle */}
                    <div className="flex bg-slate-100 border p-0.5 rounded-lg text-[9px] font-bold font-mono">
                      <button 
                        onClick={() => setActiveCorrelationNode('abuse')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${activeCorrelationNode === 'abuse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                      >
                        Abuse
                      </button>
                      <button 
                        onClick={() => setActiveCorrelationNode('insider')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${activeCorrelationNode === 'insider' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                      >
                        Insider
                      </button>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-400 font-mono mb-4">HUNT correlations engine rules linked mapping</p>

                  {/* Visual SVG correlating logic maps */}
                  <div className="relative border border-slate-100 rounded-xl bg-slate-50/50 p-2 overflow-hidden h-52 flex items-center justify-center">
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Anchor lines radiating from center */}
                      <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                      <line x1="50%" y1="50%" x2="50%" y2="20%" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                      <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                      <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                      <line x1="50%" y1="50%" x2="80%" y2="75%" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                      
                      {/* Active green links */}
                      <line x1="50%" y1="50%" x2="50%" y2="20%" stroke="#10b981" strokeWidth={1.5} className="animate-pulse" />
                      <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#10b981" strokeWidth={1.5} className="animate-pulse" />
                      <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="#10b981" strokeWidth={1.5} className="animate-pulse" />
                    </svg>

                    {/* Nodes overlay absolute positioned */}
                    
                    {/* Node 1: Failed Login (Top left) */}
                    <div 
                      onClick={() => triggerNotification("Failed Logins contributes parameter weight +25 risk.")}
                      className="absolute left-4 top-4 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[9px] font-mono shadow-xs text-slate-800 flex items-center gap-1 shrink-0 select-none cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all text-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{activeCorrelationNode === 'abuse' ? 'Failed Login' : 'Bulk Access'}</span>
                    </div>

                    {/* Node 2: New Device (Top Center) */}
                    <div 
                      onClick={() => triggerNotification("Unapproved Device access triggers security incident level 10.")}
                      className="absolute left-1/2 -translate-x-1/2 top-4 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[9px] font-mono shadow-xs text-slate-800 flex items-center gap-1 shrink-0 select-none cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all text-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{activeCorrelationNode === 'abuse' ? 'New Device' : 'Sensitive Record'}</span>
                    </div>

                    {/* Node 3: Off-Hours (Top Right) */}
                    <div 
                      onClick={() => triggerNotification("Off-hours clinical access triggers automated forensic recording.")}
                      className="absolute right-4 top-4 bg-white border border-[#3b82f6]/20 px-2 py-1 rounded-lg text-[9px] font-mono shadow-xs text-slate-850 flex items-center gap-1 shrink-0 select-none cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all text-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 bg-amber-500" />
                      <span>{activeCorrelationNode === 'abuse' ? 'Off-Hours Login' : 'Cross-Depts'}</span>
                    </div>

                    {/* Node Center: Central threat triggered */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-red-650 bg-red-600 text-white border border-red-500 p-3 rounded-full text-center shadow-lg hover:scale-105 transition-all cursor-pointer">
                      <ShieldX size={18} className="mx-auto" />
                      <span className="block text-[8.5px] uppercase font-mono font-bold font-black tracking-wider leading-none mt-1">
                        {activeCorrelationNode === 'abuse' ? 'Credential Abuse' : 'Insider Threat'}
                      </span>
                    </div>

                    {/* Node 4: Privilege Escalation (Bottom Left) */}
                    <div 
                      onClick={() => triggerNotification("Attempted root directory bypass yields critical vulnerability status.")}
                      className="absolute left-4 bottom-4 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[9px] font-mono shadow-xs text-slate-850 flex items-center gap-1 shrink-0 select-none cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all text-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                      <span>Privilege Escalation</span>
                    </div>

                    {/* Node 5: Data Exfiltration (Bottom Right) */}
                    <div 
                      onClick={() => triggerNotification("Large-scale export patterns automatically freezes clinician directory tokens.")}
                      className="absolute right-4 bottom-4 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[9px] font-mono shadow-xs text-[#ef4444] font-bold flex items-center gap-1 shrink-0 select-none cursor-pointer hover:border-red-400 hover:scale-105 transition-all text-center"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
                      <span>Data Exfiltration</span>
                    </div>

                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                    <button onClick={() => setActiveTab('Threat Correlation')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer bg-transparent border-none">
                      View full correlation map &rarr;
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ========================== ADMINISTRATIVE INTEGRATED SUB VIEWS ========================== */
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm text-left relative min-h-96">

            {activeTab === 'Threat Simulator' && (
              <ThreatSimulatorView 
                currentUser={currentUser}
                patients={patients}
                incidents={incidents}
                events={events}
                onRefresh={onRefresh}
                onInvestigateId={(incidentId) => {
                  setActiveTab('ATIF Investigation Workspace');
                  const foundInc = uniqueIncidents.find(i => i.id === incidentId) || uniqueIncidents[0];
                  if (foundInc) {
                    setSelectedIncident(foundInc);
                  }
                  triggerNotification(`Simulation playbook loaded for incident ID: ${incidentId}`);
                }}
              />
            )}

            {activeTab === 'Threat Intelligence' && (
              <SecurityIntelView incidents={uniqueIncidents} />
            )}

            {activeTab === 'Behavior Analytics' && (
              <SecurityBehaviourView 
                profiles={profiles} 
                onSelectUser={(username) => {
                  setSelectedProfileUsername(username);
                  setActiveTab('Risk Profiles');
                }} 
              />
            )}

            {activeTab === 'Risk Profiles' && (
              <SecurityUserProfileView 
                profile={activeProfile} 
                profiles={profiles}
                onSelectProfile={(username) => setSelectedProfileUsername(username)}
                incidents={uniqueIncidents} 
                events={events} 
                onNavigateToInvestigation={(inc) => {
                  setSelectedIncident(inc);
                  setActiveTab('ATIF Investigation Workspace');
                  triggerNotification(`Transited to ATIF Investigation Workspace for ${inc.id}.`);
                }}
              />
            )}

            {activeTab === 'Threat Analytics' && (
              <SecurityAnalyticsView incidents={uniqueIncidents} events={events} />
            )}

            {activeTab === 'Threat Correlation' && (
              <SecurityCorrelationView 
                incidents={uniqueIncidents}
                onRefresh={onRefresh}
                onInvestigateId={(incidentId) => {
                  setActiveTab('ATIF Investigation Workspace');
                  const foundInc = uniqueIncidents.find(i => i.id === incidentId) || uniqueIncidents[0];
                  if (foundInc) {
                    setSelectedIncident(foundInc);
                  }
                  triggerNotification(`Forensics playbook loaded for incident ID: ${incidentId}`);
                }} 
              />
            )}

            {activeTab === 'Threat Feed' && (
              <ThreatFeedView 
                incidents={uniqueIncidents} 
                onRefresh={onRefresh} 
                onOpenInvestigation={(inc) => {
                  setSelectedIncident(inc);
                  setActiveTab('ATIF Investigation Workspace');
                }}
              />
            )}

            {activeTab === 'Security Events' && (
              <SecurityEventsView events={events} onRefresh={onRefresh} />
            )}

            {activeTab === 'Audit Logs' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 font-sans uppercase tracking-widest text-[#0284c7] flex items-center gap-1.5">
                  <Database size={15} /> raw clinical telemetry SIEM archive
                </h3>
                <p className="text-xs text-slate-500">Continuous feed of transactions and record accesses across St. Jude Central EHR. Processed automatically by the ATIF Threat Correlation engine.</p>
                
                <div className="overflow-x-auto text-[11px] font-sans">
                  <table className="w-full text-left bg-transparent">
                    <thead>
                      <tr className="border-b font-mono uppercase text-[9px] text-slate-400 bg-slate-50">
                        <th className="py-2.5 pl-2">Timestamp</th>
                        <th className="py-2.5">User Role</th>
                        <th className="py-2.5">IP / Device</th>
                        <th className="py-2.5">Transaction Type</th>
                        <th className="py-2.5 pr-2">Security Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {events.filter((evVal) => {
                        const sQuery = eventSearch.toLowerCase();
                        return evVal.activityType.toLowerCase().includes(sQuery) || 
                               evVal.username.toLowerCase().includes(sQuery) ||
                               evVal.description.toLowerCase().includes(sQuery);
                      }).slice(0, 40).map((evVal) => (
                        <tr key={evVal.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pl-2 font-mono text-slate-400">{new Date(evVal.timestamp).toLocaleTimeString()}</td>
                          <td className="py-3 font-semibold text-slate-800 leading-none">
                            @{evVal.username}
                            <span className="block text-[8.5px] font-mono text-slate-400 mt-1">{evVal.role}</span>
                          </td>
                          <td className="py-3 font-mono text-slate-500 leading-none">
                            {evVal.ipAddress}
                            <span className="block text-[8.5px] text-slate-400 mt-1">{evVal.deviceName}</span>
                          </td>
                          <td className="py-3 font-mono font-bold text-[#0284c7]">{evVal.activityType}</td>
                          <td className="py-3 pr-2 text-slate-600 leading-relaxed max-w-sm">{evVal.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ATIF Investigation Workspace' && (
              <InvestigationWorkspaceView 
                uniqueIncidents={uniqueIncidents}
                selectedIncident={selectedIncident}
                setSelectedIncident={setSelectedIncident}
                handleUpdateStatus={handleUpdateStatus}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                investigatorNote={investigatorNote}
                setInvestigatorNote={setInvestigatorNote}
                handleAddIncidentTimelineNote={handleAddIncidentTimelineNote}
              />
            )}

            {activeTab === 'Incident Response' && (
              <div className="hidden space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-widest text-[#ef4444] flex items-center gap-1.5 mb-1">
                    <ShieldX size={15} /> Incident RESPONSE CENTER
                  </h3>
                  <p className="text-xs text-slate-500">Incident ticket triage, security status overrides, and explainable forensic timelines log.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left list */}
                  <div className="md:col-span-1 border-r pr-6 space-y-2 max-h-120 overflow-y-auto">
                    {uniqueIncidents.map((tInc) => (
                      <div 
                        key={tInc.id}
                        onClick={() => setSelectedIncident(tInc)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedIncident && selectedIncident.id === tInc.id 
                            ? 'bg-red-50 border-red-200 shadow-xs' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-mono text-[9px] font-bold text-slate-400">{tInc.id}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            tInc.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}>{tInc.status}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 truncate leading-tight">{tInc.title || tInc.threatType}</h4>
                        <span className="block text-[9px] text-slate-500 font-mono mt-1">User: @{tInc.affectedUser}</span>
                        <div className="flex justify-between items-baseline mt-2 border-t pt-1 border-slate-100 text-[9px]">
                          <span className="text-slate-400">{new Date(tInc.timestamp).toLocaleDateString()}</span>
                          <span className="font-mono font-bold text-rose-700">Level: {tInc.riskLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Detail sheet */}
                  <div className="md:col-span-2 space-y-4">
                    {selectedIncident ? (
                      <div className="space-y-4" id="incident-action-panel">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100">
                          <div>
                            <span className="font-mono text-xs text-slate-400 uppercase font-semibold">INCIDENT CASE: {selectedIncident.id}</span>
                            <h3 className="font-extrabold text-base tracking-tight text-slate-900 mt-0.5">{selectedIncident.title || selectedIncident.threatType}</h3>
                          </div>
                          
                          {/* Case Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">STAGE:</span>
                            {(['Open', 'Investigating', 'Mitigated', 'Resolved'] as any[]).map((stage) => (
                              <button
                                key={stage}
                                onClick={() => handleUpdateStatus(stage)}
                                className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold transition uppercase cursor-pointer border ${
                                  selectedIncident.status === stage 
                                    ? 'bg-red-604 bg-red-600 text-white border-red-500' 
                                    : 'bg-white text-slate-605 border-slate-200 hover:bg-slate-50 text-slate-650'
                                }`}
                              >
                                {stage}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Detail Sub-Tabs */}
                        <div className="flex gap-4 border-b border-slate-100 mb-4 text-xs font-mono">
                          <button
                            onClick={() => setDetailTab('diagnosis')}
                            className={`pb-2 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                              detailTab === 'diagnosis'
                                ? 'border-red-600 text-slate-900 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            📋 Executive Case Summary
                          </button>
                          <button
                            onClick={() => setDetailTab('correlation')}
                            className={`pb-2 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                              detailTab === 'correlation'
                                ? 'border-[#3b82f6] text-slate-900 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            🛡️ ATIF Correlation Analysis
                          </button>
                          <button
                            onClick={() => setDetailTab('session')}
                            className={`pb-2 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                              detailTab === 'session'
                                ? 'border-[#8b5cf6] text-slate-900 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            🌐 Live Session Context
                          </button>
                        </div>

                        {detailTab === 'diagnosis' && (
                          <div className="space-y-4">
                            {/* ATIF ADAPTIVE THREAT PROFILE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Main Diagnosis */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 leading-relaxed col-span-2">
                                <p className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse"></span>
                                  ATIF Engine Core Diagnosis:
                                </p>
                                <p className="text-slate-700 leading-relaxed font-sans font-medium">
                                  {selectedIncident.explanation || selectedIncident.aiAnalysis || `Suspicious activity detected on account @${selectedIncident.affectedUser}.`}
                                </p>
                              </div>

                              {/* Confidence & Clinical Context */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                                <p className="font-bold text-slate-800 uppercase font-mono tracking-wider">Security Context & Confidence:</p>
                                <div className="space-y-1.5 font-sans">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">Confidence Score:</span>
                                    <span className="font-mono font-bold text-rose-700">{selectedIncident.confidenceScore || 75}%</span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">Affected User Role:</span>
                                    <span className="font-mono font-bold text-slate-700">{selectedIncident.affectedUserRole || "Unknown Role"}</span>
                                  </div>
                                  <div className="pt-1.5 border-t border-slate-200">
                                    <span className="text-slate-500 block mb-1">Clinical Context Check:</span>
                                    <span className="font-semibold text-slate-700">{selectedIncident.clinicalContext || "N/A - Context verification not applicable"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Indicators and Evidence */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                                <p className="font-bold text-slate-800 uppercase font-mono tracking-wider">Triggered Risk Indicators:</p>
                                {selectedIncident.triggeredIndicators && selectedIncident.triggeredIndicators.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {selectedIncident.triggeredIndicators.map((ind: string, idx: number) => (
                                      <span key={idx} className="bg-red-50 text-red-800 text-[9px] font-medium font-mono px-2 py-0.5 rounded border border-red-100">
                                        {ind}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 italic">No static flags triggered; classified purely via behavior model.</p>
                                )}
                                <div className="pt-2 border-t border-slate-200">
                                  <p className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[10px] mb-1">Forensic Evidence Pieces:</p>
                                  {selectedIncident.evidence && selectedIncident.evidence.length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-1 text-slate-600 font-sans">
                                      {selectedIncident.evidence.map((evid: string, idx: number) => (
                                        <li key={idx} className="leading-snug">{evid}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-500 italic text-slate-400">No micro evidence pieces logged.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Custom Journal additions */}
                            <div className="space-y-3 pt-3">
                              <h4 className="font-bold text-xs uppercase text-slate-400 font-mono tracking-wider">Investigator's Forensic Notes</h4>
                              
                              <div className="space-y-2 text-xs">
                                {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                                  selectedIncident.timeline.map((actLog: any, actIdx: number) => (
                                    <div key={actIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                      <div className="flex justify-between items-baseline font-mono text-[9px] mb-1">
                                        <span className="font-semibold text-slate-700">{actLog.user || 'Sarah Johnson'}</span>
                                        <span className="text-slate-400">{new Date(actLog.timestamp || Date.now()).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="font-bold text-slate-800 text-[10.5px]">{actLog.action}</p>
                                      <p className="text-slate-600 mt-1 leading-relaxed">{actLog.note}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-slate-400 text-xs italic pl-1 leading-normal">No forensic annotations recorded in central audit. Add details below to document case files.</p>
                                )}
                              </div>

                              <form onSubmit={handleAddIncidentTimelineNote} className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  value={investigatorNote}
                                  onChange={(e) => setInvestigatorNote(e.target.value)}
                                  placeholder="Enter audit notation, case lock code, containment parameters..."
                                  className="flex-1 px-3 py-1.5 border border-slate-250 bg-white rounded-xl text-xs placeholder:text-slate-400 text-slate-700 w-full"
                                />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                                >
                                  Add Note
                                </button>
                              </form>
                            </div>
                          </div>
                        )}

                        {detailTab === 'correlation' && (
                          // NEW ATIF CORRELATION ANALYSIS DASHBOARD
                          <div className="space-y-5 text-xs">
                            {/* Classification, Session, Confidence Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                <span className="font-mono text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Threat Classification</span>
                                <div className="mt-1">
                                  <span className="bg-rose-50 text-rose-800 border border-rose-100 font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded inline-block">
                                    {selectedIncident.threatType || "ABNORMAL_BEHAVIOR"}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 block mt-1.5">
                                    Session: {selectedIncident.sessionId || "ATIF-SESSION-" + (selectedIncident.id ? selectedIncident.id.replace(/\D/g, '') : "94103")}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                <span className="font-mono text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Correlation Confidence</span>
                                <div className="mt-1 flex items-baseline gap-1.5">
                                  <span className="font-mono font-black text-rose-700 text-lg leading-none">
                                    {selectedIncident.confidenceScore || 85}%
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                                    {selectedIncident.confidenceScore && selectedIncident.confidenceScore >= 90 ? "High Confidence" : "Medium-High"}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                <span className="font-mono text-[8.5px] font-bold text-[#3b82f6] uppercase tracking-widest block">Adaptive Risk Score</span>
                                <div className="mt-1 flex items-baseline gap-1">
                                  <span className="font-mono font-black text-[#1e293b] text-xl leading-none">
                                    {selectedIncident.riskScore || 75}
                                  </span>
                                  <span className="text-slate-400 font-mono">/ 100</span>
                                </div>
                              </div>
                            </div>

                            {/* Correlation Explanation */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <p className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                <Cpu size={13} className="text-[#3b82f6]" />
                                Explainable Correlation Summary:
                              </p>
                              <p className="text-slate-700 leading-relaxed font-sans font-medium">
                                {selectedIncident.explanation || `Anomalous activity sequence correlated in real-time under session ID ${selectedIncident.sessionId || 'ATIF-SESSION-94103'}. Multiple combined risk metrics exceed adaptive baselines for user @${selectedIncident.affectedUser || 'staff_member'}.`}
                              </p>
                            </div>

                            {/* Behavioral Baseline Comparison */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                              <p className="font-bold text-slate-800 uppercase font-mono tracking-wider">Behavior Baseline Deviation Comparison:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-2.5 bg-white border border-slate-150 rounded-xl space-y-1">
                                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">Temporal Alignment (Shift Hours)</span>
                                  <div className="flex justify-between text-xs pt-1">
                                    <span className="text-slate-500">Typical Baseline:</span>
                                    <span className="font-mono font-semibold text-slate-700">{selectedIncident.expectedLogin || "08:00 - 17:00"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Active Access Hour:</span>
                                    <span className="font-mono font-bold text-rose-700">{selectedIncident.actualLogin || "Off-Shift hour"}</span>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-white border border-slate-150 rounded-xl space-y-1">
                                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">Physical Hardware Signature</span>
                                  <div className="flex justify-between text-xs pt-1">
                                    <span className="text-slate-500">Typical Hardware:</span>
                                    <span className="font-mono font-semibold text-slate-700">{selectedIncident.expectedDevice || "Authorized Terminal"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Active Client Signature:</span>
                                    <span className="font-mono font-bold text-rose-700">{selectedIncident.actualDevice || "Unknown Terminal"}</span>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-white border border-slate-150 rounded-xl space-y-1">
                                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">Expected vs Active Patient Views</span>
                                  <div className="flex justify-between text-xs pt-1">
                                    <span className="text-slate-500">Expected Views:</span>
                                    <span className="font-mono font-semibold text-slate-700 font-medium">
                                      {selectedIncident.expectedViews !== undefined ? `${selectedIncident.expectedViews}/day` : (selectedIncident.expectedBehavior || "15 records")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Current Views:</span>
                                    <span className="font-mono font-bold text-rose-700">
                                      {selectedIncident.currentViews !== undefined ? selectedIncident.currentViews : (selectedIncident.currentBehavior?.split(" ")[0] || "0")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100">
                                    <span className="text-slate-400 font-mono">Views Deviation:</span>
                                    <span className="font-mono font-bold text-amber-600">
                                      {selectedIncident.viewsDeviation !== undefined ? `+${selectedIncident.viewsDeviation}%` : "0%"}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-white border border-slate-150 rounded-xl space-y-1">
                                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">Expected vs Active PDF Exports</span>
                                  <div className="flex justify-between text-xs pt-1">
                                    <span className="text-slate-500">Expected Exports:</span>
                                    <span className="font-mono font-semibold text-slate-700 font-medium">
                                      {selectedIncident.expectedExports !== undefined ? `${selectedIncident.expectedExports}/day` : "0.1/day"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Current Exports:</span>
                                    <span className="font-mono font-bold text-rose-700">
                                      {selectedIncident.currentExports !== undefined ? selectedIncident.currentExports : "0"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100">
                                    <span className="text-slate-400 font-mono">Exports Deviation:</span>
                                    <span className="font-mono font-bold text-amber-600">
                                      {selectedIncident.exportsDeviation !== undefined ? `+${selectedIncident.exportsDeviation}%` : "0%"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Threat Indicators Checklist */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <p className="font-bold text-slate-800 uppercase font-mono tracking-wider">ATIF Behavioral Risk Indicators Matched:</p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {["Failed Login", "Successful Login", "Patient Search", "Patient Record View", "Sensitive Record Viewed", "PDF Export", "Unknown Device", "Unknown IP", "Off-Hours Login", "Restricted Module Access"].map((ind) => {
                                  const isMatched = selectedIncident.triggeredIndicators?.includes(ind) || 
                                    (selectedIncident.threatType === 'CREDENTIAL_ABUSE' && ["Failed Login", "Successful Login", "Patient Search", "Immediate Patient Access"].includes(ind)) ||
                                    (selectedIncident.threatType === 'INSIDER_THREAT' && ["Successful Login", "Patient Record View", "PDF Export"].includes(ind)) ||
                                    (selectedIncident.threatType === 'UNAUTHORIZED_ACCESS' && ["Successful Login", "Restricted Module Access", "Sensitive Record Viewed"].includes(ind));

                                  return (
                                    <span
                                      key={ind}
                                      className={`px-2.5 py-1.5 rounded-xl border font-mono text-[10px] font-bold flex items-center gap-1.5 transition ${
                                        isMatched
                                          ? "bg-rose-50 text-rose-800 border-rose-200"
                                          : "bg-white text-slate-350 border-slate-200 opacity-50"
                                      }`}
                                    >
                                      {isMatched ? "✓" : "○"} {ind}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Interactive Correlation Graph Visual Event Chain */}
                            {(() => {
                              const displayEvents = selectedIncident.correlatedEvents || [
                                { id: '1', timestamp: new Date(new Date(selectedIncident.timestamp).getTime() - 15 * 60 * 1000).toISOString(), activityType: 'LOGIN_FAILED', description: 'Failed authentication PIN attempt', ipAddress: selectedIncident.sourceIp || '10.20.10.12', riskContribution: 15 },
                                { id: '2', timestamp: new Date(new Date(selectedIncident.timestamp).getTime() - 14 * 60 * 1000).toISOString(), activityType: 'LOGIN_FAILED', description: 'Failed authentication PIN attempt', ipAddress: selectedIncident.sourceIp || '10.20.10.12', riskContribution: 15 },
                                { id: '3', timestamp: new Date(new Date(selectedIncident.timestamp).getTime() - 10 * 60 * 1000).toISOString(), activityType: 'LOGIN_SUCCESS', description: `Established workspace session as @${selectedIncident.affectedUser || 'staff'}`, ipAddress: selectedIncident.sourceIp || '10.20.10.12', riskContribution: 10 },
                                { id: '4', timestamp: new Date(new Date(selectedIncident.timestamp).getTime() - 8 * 60 * 1000).toISOString(), activityType: 'RECORD_VIEW', description: 'Bypassed standard directory folder scopes', ipAddress: selectedIncident.sourceIp || '10.20.10.12', riskContribution: 25 },
                                { id: '5', timestamp: selectedIncident.timestamp, activityType: 'PATIENT_RECORD_EXPORTED', description: 'Exfiltrated patient clinical dossier to PDF', ipAddress: selectedIncident.sourceIp || '10.20.10.12', riskContribution: 35 }
                              ];

                              return (
                                <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl text-xs space-y-4">
                                  <div className="flex justify-between items-center">
                                    <p className="font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                      <Cpu size={14} className="text-[#3b82f6] animate-pulse" />
                                      ATIF Neural Event Correlation Graph:
                                    </p>
                                    <span className="text-[10px] bg-indigo-900 text-indigo-200 border border-indigo-700 font-mono font-bold px-2 py-0.5 rounded uppercase">
                                      Active Session Flow
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center relative pt-2">
                                    {displayEvents.map((ev: any, idx: number) => (
                                      <React.Fragment key={ev.id || idx}>
                                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 relative group hover:border-[#3b82f6] transition text-[10px]">
                                          <div className="flex justify-between items-center font-mono">
                                            <span className="text-slate-500 font-extrabold text-[8.5px]">STEP 0{idx + 1}</span>
                                            <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                                              ev.activityType.includes('FAIL')
                                                ? 'bg-red-950 text-red-400 border border-red-900'
                                                : ev.activityType.includes('SUCCESS')
                                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                                                  : 'bg-blue-950 text-blue-400 border border-blue-900'
                                            }`}>
                                              {ev.activityType}
                                            </span>
                                          </div>
                                          <p className="font-bold text-slate-200 truncate mt-0.5" title={ev.description}>{ev.description}</p>
                                          <div className="flex justify-between items-baseline font-mono text-[9px] text-slate-400 mt-1">
                                            <span>{ev.ipAddress || '10.20.10.12'}</span>
                                            <span className="text-rose-400 font-bold">+{ev.riskContribution || 15} Risk</span>
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Explainable AI Risk and Confidence Contribution Breakdown Tables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Risk Breakdown Table */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                <p className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[10px]">Risk Contribution Table:</p>
                                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                                  <table className="w-full text-left font-mono text-[10.5px]">
                                    <thead className="bg-slate-100 border-b border-slate-150 text-slate-500">
                                      <tr>
                                        <th className="p-2 font-bold uppercase">Triggered Contributor</th>
                                        <th className="p-2 font-bold uppercase text-right">Points</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {selectedIncident.riskBreakdown && selectedIncident.riskBreakdown.length > 0 ? (
                                        selectedIncident.riskBreakdown.map((item: any, idx: number) => (
                                          <tr key={idx}>
                                            <td className="p-2 font-sans font-medium">{item.name}</td>
                                            <td className="p-2 text-right text-rose-600 font-bold">+{item.score}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">Authentication Failures (LOGIN_FAILED)</td>
                                            <td className="p-2 text-right text-rose-600 font-bold">+{selectedIncident.riskContributions?.LOGIN_FAILED || 45}</td>
                                          </tr>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">Session Authentications (LOGIN_SUCCESS)</td>
                                            <td className="p-2 text-right text-emerald-600 font-bold">+{selectedIncident.riskContributions?.LOGIN_SUCCESS || 10}</td>
                                          </tr>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">EHR Record Inspection (RECORD_VIEW)</td>
                                            <td className="p-2 text-right text-rose-600 font-bold">+{selectedIncident.riskContributions?.RECORD_VIEW || 30}</td>
                                          </tr>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">Clinical Profile Compilation (PATIENT_RECORD_EXPORTED)</td>
                                            <td className="p-2 text-right text-rose-600 font-bold">+{selectedIncident.riskContributions?.PATIENT_RECORD_EXPORTED || 25}</td>
                                          </tr>
                                        </>
                                      )}
                                      <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                                        <td className="p-2 uppercase font-mono">Total Risk Score</td>
                                        <td className="p-2 text-right text-[#1e293b] font-black">{selectedIncident.riskScore || 0} / 100</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Confidence Breakdown Table */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                <p className="font-bold text-slate-800 uppercase font-mono tracking-wider text-[10px]">Confidence Contribution Table:</p>
                                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                                  <table className="w-full text-left font-mono text-[10.5px]">
                                    <thead className="bg-slate-100 border-b border-slate-150 text-slate-500">
                                      <tr>
                                        <th className="p-2 font-bold uppercase">Confidence Element</th>
                                        <th className="p-2 font-bold uppercase text-right">Contribution</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {selectedIncident.confidenceBreakdown && selectedIncident.confidenceBreakdown.length > 0 ? (
                                        selectedIncident.confidenceBreakdown.map((item: any, idx: number) => (
                                          <tr key={idx}>
                                            <td className="p-2 font-sans font-medium">{item.name}</td>
                                            <td className="p-2 text-right text-indigo-600 font-bold">
                                              {item.name === "Base" ? `${item.score}%` : `+${item.score}%`}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">Investigation Baseline</td>
                                            <td className="p-2 text-right text-indigo-600 font-bold">50%</td>
                                          </tr>
                                          <tr>
                                            <td className="p-2 font-sans font-medium">Anomalous Activity Sequence</td>
                                            <td className="p-2 text-right text-indigo-600 font-bold">+{selectedIncident.confidenceScore ? selectedIncident.confidenceScore - 50 : 25}%</td>
                                          </tr>
                                        </>
                                      )}
                                      <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                                        <td className="p-2 uppercase font-mono">Final Confidence</td>
                                        <td className="p-2 text-right text-indigo-800 font-black">{selectedIncident.confidenceScore || 50}%</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {detailTab === 'session' && (() => {
                          const context = selectedIncident.sessionContext || {
                            sessionId: selectedIncident.sessionId || ("ATIF-SESSION-" + (selectedIncident.id ? selectedIncident.id.replace(/\D/g, '') : "94103")),
                            user: selectedIncident.affectedUser || "unknown_user",
                            role: selectedIncident.affectedUserRole || "NURSE",
                            department: "Emergency Care",
                            loginTime: selectedIncident.timestamp || new Date().toISOString(),
                            authenticationHistory: [
                              { activityType: "LOGIN_SUCCESS", timestamp: selectedIncident.timestamp }
                            ],
                            failedLoginCount: selectedIncident.threatType === 'CREDENTIAL_ABUSE' ? 3 : 0,
                            successfulLoginAfterFailures: selectedIncident.threatType === 'CREDENTIAL_ABUSE',
                            knownDevice: selectedIncident.threatType !== 'CREDENTIAL_ABUSE',
                            knownIp: selectedIncident.threatType !== 'CREDENTIAL_ABUSE',
                            patientViews: selectedIncident.threatType === 'INSIDER_THREAT' ? 8 : (selectedIncident.threatType === 'SENSITIVE_RECORD_ACCESS' ? 2 : 1),
                            uniquePatientsViewed: selectedIncident.threatType === 'INSIDER_THREAT' ? 6 : 1,
                            sensitiveRecordsViewed: selectedIncident.threatType === 'SENSITIVE_RECORD_ACCESS' ? 1 : 0,
                            highlySensitiveRecordsViewed: selectedIncident.threatType === 'SENSITIVE_RECORD_ACCESS' ? 1 : 0,
                            crossWardAccessCount: selectedIncident.threatType === 'INSIDER_THREAT' ? 3 : 1,
                            patientRecordPdfExportCount: selectedIncident.threatType === 'INSIDER_THREAT' ? 2 : 0,
                            repeatedExportCount: selectedIncident.threatType === 'INSIDER_THREAT' ? 1 : 0,
                            currentBaselineDeviation: selectedIncident.deviationPercentage || (selectedIncident.threatType === 'INSIDER_THREAT' ? 280 : 120),
                            triggeredIndicators: selectedIncident.triggeredIndicators || (
                              selectedIncident.threatType === 'CREDENTIAL_ABUSE'
                                ? ["Failed Login", "Repeated Failed Login", "Successful Login After Failures"]
                                : selectedIncident.threatType === 'INSIDER_THREAT'
                                  ? ["Successful Login", "Patient Record View", "Patient Record Export", "Repeated Export", "Baseline Deviation", "Patient Harvesting Spike"]
                                  : ["Successful Login", "Sensitive Record Viewed", "Highly Sensitive Record"]
                            ),
                            currentRiskScore: selectedIncident.riskScore || 75,
                            currentConfidenceScore: selectedIncident.confidenceScore || 85,
                            currentThreatClassification: selectedIncident.title || selectedIncident.threatType,
                            threatTimeline: selectedIncident.correlatedEvents?.map((ev: any) => ({
                              timestamp: ev.timestamp,
                              activityType: ev.activityType,
                              description: ev.description,
                              ipAddress: ev.ipAddress,
                              deviceName: ev.deviceName || "Unspecified",
                              riskContribution: ev.riskContribution || 15
                            })) || [
                              { timestamp: selectedIncident.timestamp, activityType: selectedIncident.threatType, description: selectedIncident.explanation, riskContribution: selectedIncident.riskScore }
                            ]
                          };

                          const allPossibleIndicators = [
                            "Failed Login",
                            "Repeated Failed Login",
                            "Successful Login After Failures",
                            "Sensitive Record Viewed",
                            "Highly Sensitive Record",
                            "Patient Record Export",
                            "Repeated Export",
                            "Bulk Export",
                            "Cross-Ward Browsing",
                            "Baseline Deviation",
                            "Off-Hours Activity",
                            "Patient Harvesting Spike",
                            "Restricted Module Access"
                          ];

                          return (
                            <div className="space-y-6 text-xs text-slate-700 animate-fadeIn" id="atif-live-session-context">
                              {/* Alert Warning Box */}
                              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4 rounded-2xl flex items-start gap-3">
                                <span className="text-violet-600 text-lg leading-none shrink-0 mt-0.5">🌐</span>
                                <div>
                                  <h4 className="font-bold text-violet-900 text-xs font-sans tracking-tight">Active Live Session Threat Context Engine</h4>
                                  <p className="text-[11px] text-violet-700 leading-relaxed mt-0.5 font-sans">
                                    ATIF continuously monitors this active user session context in real-time, accumulating security telemetry, calculating dynamic deviation levels, and tracking indicator weights chronologically.
                                  </p>
                                </div>
                              </div>

                              {/* Grid: Session Details & Device Networks */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Session Details */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                  <h4 className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <span>👤</span> Session Metadata Profile
                                  </h4>
                                  <div className="space-y-2 font-sans text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Session ID:</span>
                                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{context.sessionId}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Affected User:</span>
                                      <span className="font-semibold text-slate-900">@{context.user}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Organization Role:</span>
                                      <span className="font-bold text-slate-800">{context.role}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Department Assigned:</span>
                                      <span className="font-semibold text-slate-700">{context.department || "Clinical Care"}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-500 font-medium">Authentication Time:</span>
                                      <span className="font-mono text-slate-600">{new Date(context.loginTime).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Network Profiler */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                  <h4 className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <span>🖥️</span> Device & Network Signature
                                  </h4>
                                  <div className="space-y-2 font-sans text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Client Address IP:</span>
                                      <span className="font-mono font-bold text-slate-700">{selectedIncident.sourceIp || "10.20.10.12"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">IP Veracity:</span>
                                      {context.knownIp ? (
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-1.5 py-0.2 rounded font-sans">Verified Known IP</span>
                                      ) : (
                                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-1.5 py-0.2 rounded font-sans">Anomalous IP Signature</span>
                                      )}
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                      <span className="text-slate-500 font-medium">Active Workplace Station:</span>
                                      <span className="font-mono font-bold text-slate-700">{selectedIncident.deviceName || selectedIncident.actualDevice || "Station-94103"}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-500 font-medium">Workstation Trust:</span>
                                      {context.knownDevice ? (
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-1.5 py-0.2 rounded font-sans">Verified Workspace Device</span>
                                      ) : (
                                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-1.5 py-0.2 rounded font-sans">Unregistered Hostname</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Authentication Profiler & Patient views */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Authentication History */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                  <h4 className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <span>🔑</span> Authentication Verification
                                  </h4>
                                  <div className="space-y-2.5 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white p-2.5 border border-slate-200 rounded-xl text-center">
                                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Failed Logins</span>
                                        <span className={`text-xl font-mono font-extrabold ${context.failedLoginCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                          {context.failedLoginCount}
                                        </span>
                                      </div>
                                      <div className="bg-white p-2.5 border border-slate-200 rounded-xl text-center">
                                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Auth Loop Success</span>
                                        <span className={`text-[11px] font-sans font-bold block mt-1.5 uppercase ${context.successfulLoginAfterFailures ? 'text-emerald-700 bg-emerald-50 border border-emerald-100 py-0.5 rounded' : 'text-slate-500 bg-slate-100 py-0.5 rounded'}`}>
                                          {context.successfulLoginAfterFailures ? "Completed After Fails" : "Standard Direct Success"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Patient Views & PDF Exports */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                  <h4 className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <span>📋</span> EHR Access Analytics
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-white p-2 border border-slate-150 rounded-xl">
                                      <span className="text-[9px] text-slate-400 font-mono uppercase block">Total Views</span>
                                      <span className="text-base font-mono font-extrabold text-slate-800 block mt-0.5">{context.patientViews}</span>
                                    </div>
                                    <div className="bg-white p-2 border border-slate-150 rounded-xl">
                                      <span className="text-[9px] text-slate-400 font-mono uppercase block">Unique Patients</span>
                                      <span className="text-base font-mono font-extrabold text-slate-800 block mt-0.5">{context.uniquePatientsViewed}</span>
                                    </div>
                                    <div className="bg-white p-2 border border-slate-150 rounded-xl">
                                      <span className="text-[9px] text-rose-500 font-mono uppercase font-extrabold block">PDF Exports</span>
                                      <span className="text-base font-mono font-extrabold text-rose-700 block mt-0.5">{context.patientRecordPdfExportCount}</span>
                                    </div>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-150 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-slate-500 font-medium">Sensitive Records Viewed:</span>
                                      <span className="font-bold font-mono text-slate-800">{context.sensitiveRecordsViewed}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-slate-500 font-medium">Highly Sensitive Record Level:</span>
                                      <span className="font-bold font-mono text-rose-700">{context.highlySensitiveRecordsViewed}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                                      <span className="text-slate-500 font-medium">Baseline Variance Indicator:</span>
                                      <span className="font-bold font-mono text-amber-600">+{context.currentBaselineDeviation}% Anomaly Rate</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Weighted Risk Indicators Panel */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                <h4 className="font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                  <span>🚨</span> Adaptive Risk Indicators Checklist
                                </h4>
                                <p className="text-[10.5px] text-slate-400 font-mono">
                                  The engine checks user activity against 13 weighted criteria. Triggered conditions are highlighted in real-time.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                                  {allPossibleIndicators.map((ind) => {
                                    const isChecked = context.triggeredIndicators.some((ti: string) => ti.toLowerCase().replace(/[^a-z]/g, '') === ind.toLowerCase().replace(/[^a-z]/g, ''));
                                    return (
                                      <div
                                        key={ind}
                                        className={`p-2 rounded-xl border flex items-center gap-2.5 transition ${
                                          isChecked
                                            ? 'bg-red-50 border-red-200 text-red-900 font-bold shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                          isChecked ? 'bg-red-600 border-red-600 text-white' : 'border-slate-300 bg-slate-50'
                                        }`}>
                                          {isChecked && <span className="text-[10px] leading-none font-bold">✓</span>}
                                        </div>
                                        <span className="text-[10.5px] truncate font-sans tracking-tight">{ind}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Adaptive Engine Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200 pt-3 mt-4 text-center">
                                  <div className="p-2 bg-white rounded-xl border border-slate-150">
                                    <span className="text-[9px] text-slate-400 font-mono uppercase block">Active Context Risk</span>
                                    <span className="text-lg font-mono font-black text-rose-700 mt-0.5 block">{context.currentRiskScore} / 100</span>
                                  </div>
                                  <div className="p-2 bg-white rounded-xl border border-slate-150">
                                    <span className="text-[9px] text-slate-400 font-mono uppercase block">Confidence Score</span>
                                    <span className="text-lg font-mono font-black text-indigo-700 mt-0.5 block">{context.currentConfidenceScore}%</span>
                                  </div>
                                  <div className="p-2 bg-white rounded-xl border border-slate-150">
                                    <span className="text-[9px] text-slate-400 font-mono uppercase block">Adaptive Classification</span>
                                    <span className="text-[10.5px] font-sans font-bold text-slate-800 mt-1 block uppercase truncate px-1">{context.currentThreatClassification || "ABNORMAL_BEHAVIOR"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Chronological Threat Timeline */}
                              <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-4">
                                <h4 className="font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                  <span>⏳</span> Chronological Threat Maturity Timeline
                                </h4>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  The step-by-step maturity of threat signals captured sequentially within this session context.
                                </p>

                                <div className="relative border-l border-slate-800 pl-4 space-y-4 pt-2">
                                  {context.threatTimeline && context.threatTimeline.length > 0 ? (
                                    context.threatTimeline.map((step: any, sIdx: number) => (
                                      <div key={sIdx} className="relative text-[11px] leading-relaxed">
                                        {/* Colored Dot on Timeline */}
                                        <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                                          step.activityType?.includes('FAIL')
                                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                            : step.activityType?.includes('SUCCESS')
                                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                              : 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                                        }`} />

                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-baseline gap-1 font-sans">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] bg-slate-800 text-slate-300 font-mono font-bold uppercase px-1.5 py-0.2 rounded">
                                              {step.activityType}
                                            </span>
                                            <strong className="text-slate-100 font-extrabold tracking-tight">Step {sIdx + 1} Captured</strong>
                                          </div>
                                          <span className="font-mono text-slate-500 text-[10px]">
                                            {new Date(step.timestamp || Date.now()).toLocaleTimeString()}
                                          </span>
                                        </div>

                                        <p className="text-slate-300 mt-1 font-sans font-medium">{step.description}</p>
                                        <div className="flex gap-4 items-baseline text-[9.5px] text-slate-500 font-mono mt-1 border-t border-slate-950 pt-1">
                                          <span>Device: {step.deviceName || "Unspecified"}</span>
                                          <span>IP: {step.ipAddress || "10.20.10.12"}</span>
                                          {step.riskContribution && (
                                            <span className="text-rose-400 font-bold">+{step.riskContribution} Risk Score</span>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-500 italic">No events captured in the timeline sequence.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 italic text-xs leading-normal">
                        Select an incident case files log from the sidebar container registry.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Threat Repository' && (
              <ThreatRepositoryView 
                incidents={incidents}
                onRefresh={onRefresh}
                triggerNotification={triggerNotification}
              />
            )}

            {activeTab === 'Reports' && (
              <SecurityReportsView 
                posture={posture}
                incidents={incidents}
                events={events}
                profiles={profiles}
                feed={feed}
                onRefresh={onRefresh}
                triggerNotification={triggerNotification}
                currentUser={currentUser}
                patients={patients}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
