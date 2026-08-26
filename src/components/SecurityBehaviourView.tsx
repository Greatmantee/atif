/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, Clock, Users, Activity, FileText, AlertCircle, Info, 
  Search, Edit2, RotateCcw, Brain, Check, Save, ShieldAlert,
  SlidersHorizontal, ChevronDown, ChevronUp, Settings, ArrowRight,
  TrendingUp, Compass, Calendar
} from 'lucide-react';
import { UserBehaviorProfile, HospitalRole, BaselineTemplate } from '../types';

interface SecurityBehaviourViewProps {
  profiles: UserBehaviorProfile[];
  onSelectUser?: (username: string) => void;
  onRefresh?: () => void;
}

export default function SecurityBehaviourView({ profiles, onSelectUser, onRefresh }: SecurityBehaviourViewProps) {
  // Dual-mode active tab: 'heatmap' or 'repository'
  const [activeTab, setActiveTab] = useState<'heatmap' | 'repository'>('heatmap');
  
  // Repository sub-tab: 'users' or 'roles'
  const [repoTab, setRepoTab] = useState<'users' | 'roles'>('users');
  
  // Selected Heatmap Cell state
  const [selectedCell, setSelectedCell] = useState<{ day: string; hours: string; anomalous: boolean } | null>(null);
  
  // Search state for users directory
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inline edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserBehaviorProfile>>({});

  // Recalculation sandbox state
  const [sandboxUserId, setSandboxUserId] = useState<string | null>(null);
  const [observedDaily, setObservedDaily] = useState<number>(30);
  const [observedHourly, setObservedHourly] = useState<number>(5);
  const [observedLogins, setObservedLogins] = useState<number>(4);
  const [observedDuration, setObservedDuration] = useState<number>(45);
  const [recalcResult, setRecalcResult] = useState<any>(null);

  // Role templates fetched from API
  const [templates, setTemplates] = useState<BaselineTemplate[]>([]);
  const [editingRole, setEditingRole] = useState<HospitalRole | null>(null);
  const [roleEditForm, setRoleEditForm] = useState<Partial<BaselineTemplate>>({});

  // Toasts / Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load templates on component load or profiles refresh
  useEffect(() => {
    fetch('/api/security/templates')
      .then(r => r.json())
      .then(data => {
        if (data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(err => console.error("Failed to fetch templates", err));
  }, [profiles]);

  // Clear toast feedback automatically
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Mock Days of the week and Time blocks for the custom Heatmap grid
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeBlocks = [
    { label: "00:00 - 04:00", weight: "low" },
    { label: "04:00 - 08:00", weight: "medium" },
    { label: "08:00 - 12:00", weight: "high" },
    { label: "12:00 - 16:00", weight: "maximum" },
    { label: "16:00 - 20:00", weight: "medium" },
    { label: "20:00 - 00:00", weight: "low" }
  ];

  const isAnomalousCell = (dayIndex: number, timeIndex: number) => {
    if (dayIndex === 6 && timeIndex === 0) return true; // Sunday 00:00-04:00
    if (dayIndex === 5 && timeIndex === 5) return true; // Saturday 20:00-00:00
    if (dayIndex === 1 && timeIndex === 0) return true; // Tuesday 00:00-04:00
    return false;
  };

  const getCellClassName = (dayIndex: number, timeIndex: number) => {
    const isAnomalous = isAnomalousCell(dayIndex, timeIndex);
    if (isAnomalous) {
      return "bg-rose-500 border-rose-450 hover:scale-110 cursor-pointer animate-pulse border-2 shadow-[0_0_10px_rgba(244,63,94,0.35)]";
    }

    if (dayIndex >= 5) {
      return timeIndex === 2 || timeIndex === 3 
        ? "bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 cursor-pointer" 
        : "bg-slate-50 border border-slate-100 hover:bg-slate-100 cursor-pointer";
    } else {
      if (timeIndex === 2 || timeIndex === 3) return "bg-indigo-600 border-indigo-505 hover:bg-indigo-700 hover:scale-105 cursor-pointer shadow-[0_0_6px_rgba(79,70,229,0.15)]";
      if (timeIndex === 1 || timeIndex === 4) return "bg-indigo-100 border border-indigo-200 hover:bg-indigo-200 cursor-pointer";
      return "bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-100 cursor-pointer";
    }
  };

  const anomalyQueue = [
    { user: "pharmacist_bob", role: "Clinical Pharmacist", anomaly: "Off-Hours Bulk Prescription Search", severity: "High", time: "Sunday 01:42 AM", code: "BULK_PRESCRIPTION" },
    { user: "nurse_amy", role: "Ward Nurse", anomaly: "Multi-device Account Concurrency Login", severity: "Medium", time: "Saturday 11:20 PM", code: "CONCURRENT_SESSION" },
    { user: "dr_jones", role: "Specialist Physician", anomaly: "Sensitive Billing Audit File Export", severity: "High", time: "Tuesday 02:15 AM", code: "FILE_EX_RBAC" },
    { user: "billing_steve", role: "Billing Finance Manager", anomaly: "Out-of-office Coordinate VPN login", severity: "Low", time: "Thursday 10:45 PM", code: "IP_COORD_FAIL" }
  ];

  // Action Handlers
  const handleStartEdit = (p: UserBehaviorProfile) => {
    setEditingUserId(p.userId);
    setEditForm({ ...p });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  const handleSaveProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/security/profiles/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully updated baseline for @${editForm.username}`);
        setEditingUserId(null);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg("Failed to save behavior profile changes.");
      }
    } catch (e) {
      setErrorMsg("Error contacting security profile API.");
    }
  };

  const handleResetProfile = async (userId: string, username: string) => {
    if (!window.confirm(`Reset behavior baseline for @${username} to standard role default? This wipes custom adjustments.`)) return;
    try {
      const res = await fetch(`/api/security/profiles/${userId}/reset`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Reset behavior baseline for @${username} to standard role default successfully.`);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg("Failed to reset profile.");
      }
    } catch (e) {
      setErrorMsg("Error contacting profile reset API.");
    }
  };

  const handleStartSandbox = (p: UserBehaviorProfile) => {
    setSandboxUserId(p.userId);
    setObservedDaily(p.typicalPatientViewsPerDay || 20);
    setObservedHourly(p.typicalHourlyPatientViews || 3);
    setObservedLogins(p.typicalDailyLogins || 3);
    setObservedDuration(p.averageSessionDurationMin || 30);
    setRecalcResult(null);
  };

  const handleRunRecalculate = async () => {
    if (!sandboxUserId) return;
    try {
      const res = await fetch(`/api/security/profiles/${sandboxUserId}/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observedDailyViews: observedDaily,
          observedHourlyViews: observedHourly,
          observedLogins: observedLogins,
          observedDuration: observedDuration
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setRecalcResult(data.result);
        setSuccessMsg(`Baseline model trained. Confidence shifted to ${data.result.updated.confidence}%.`);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg("Failed to recalculate baseline.");
      }
    } catch (e) {
      setErrorMsg("Error contacting model trainer API.");
    }
  };

  const handleStartRoleEdit = (t: BaselineTemplate) => {
    setEditingRole(t.role);
    setRoleEditForm({ ...t });
  };

  const handleCancelRoleEdit = () => {
    setEditingRole(null);
    setRoleEditForm({});
  };

  const handleSaveRoleTemplate = async (role: HospitalRole) => {
    try {
      const res = await fetch(`/api/security/templates/${encodeURIComponent(role)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleEditForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully updated default policy for ${role}`);
        setEditingRole(null);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg("Failed to save template.");
      }
    } catch (e) {
      setErrorMsg("Error contacting template API.");
    }
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-850 text-left font-sans space-y-6" id="sec-behaviour-panel">
      
      {/* Header with dual mode selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-200 pb-5 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders size={14} className="text-indigo-600" /> Continuous User & Entity Heuristics
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">EHR Behavior Intelligence Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">Continuous heuristics scoring measuring clinician deviations from historical baselines</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'heatmap' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Activity size={13} />
            UEBA Heuristic Heatmap
          </button>
          <button
            onClick={() => setActiveTab('repository')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'repository' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Brain size={13} className="text-indigo-600" />
            Behavior Baseline Repository
          </button>
        </div>
      </div>

      {/* Success/Error Toasts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 text-xs rounded-xl flex items-center gap-2 font-medium">
          <Check size={14} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-220 border-rose-200 text-rose-850 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle size={14} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* RENDER TAB 1: UEBA Heatmap & Line Graphs */}
      {activeTab === 'heatmap' && (
        <>
          {/* Main Grid: Heatmap + Trend SVG double graph */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            
            {/* Heatmap module (col-span-3) */}
            <div className="xl:col-span-3 bg-white p-4 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">SIEM CLINICAL ACTIVITY HEATMAP (24/7 TRACK)</span>
                <span className="text-[10px] text-slate-500">Week 24 Node activity index</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day, dIdx) => (
                  <div key={day} className="text-center">
                    <span className="text-[9px] font-bold font-mono text-slate-500 block mb-1 truncate">{day.slice(0, 3).toUpperCase()}</span>
                    <div className="space-y-2">
                      {timeBlocks.map((t, tIdx) => (
                        <div
                          key={t.label}
                          onClick={() => setSelectedCell({ day, hours: t.label, anomalous: isAnomalousCell(dIdx, tIdx) })}
                          className={`h-9 w-full rounded border transition-all ${getCellClassName(dIdx, tIdx)}`}
                          title={`${day} @ ${t.label}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cell click inspector popup info */}
              {selectedCell ? (
                <div className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${selectedCell.anomalous ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                  <div className="space-y-1 text-left">
                    <p className="font-bold flex items-center gap-1 font-mono uppercase text-[10px]">
                      {selectedCell.anomalous && <AlertCircle size={11} className="text-rose-600 animate-bounce" />}
                      Grid Block Inspected: {selectedCell.day} ({selectedCell.hours})
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {selectedCell.anomalous 
                        ? "Anomalous off-hours EHR activity identified! Subject requested multiple clinical dossiers crossing standard privilege thresholds." 
                        : "Activity baseline normal. Standard staff rosters matching clinical shifts profiles perfectly."}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded cursor-pointer text-slate-700 font-mono"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-[11px] font-mono text-slate-500">
                  <Info size={11} className="inline mr-1" /> Click any grid cell above to investigate localized session telemetry indices in depth.
                </div>
              )}
            </div>

            {/* Double Line SVG Graph: Record access trends (col-span-2) */}
            <div className="xl:col-span-2 bg-white p-4 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <div className="space-y-2 pb-2 border-b border-slate-100 text-left">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">RECORD LOOKUPS CORRELATION GRAPH (BASELINE VS OUTLIER)</span>
                <p className="text-[11px] text-slate-500 leading-snug">Roster views mean threshold deviation over 24H cycles</p>
              </div>

              {/* Clean high-fidelity inline SVG line-graph */}
              <div className="relative py-4 flex items-center justify-center">
                <svg viewBox="0 0 400 180" className="w-full h-auto overflow-visible select-none">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2" />
                  <line x1="40" y1="50" x2="380" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2" />
                  <line x1="40" y1="90" x2="380" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2" />
                  <line x1="40" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2" />
                  <line x1="40" y1="150" x2="380" y2="150" stroke="#cbd5e1" strokeWidth="1" />

                  <path
                    d="M 40,140 Q 90,135 140,75 T 240,65 T 340,130 L 380,140"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  <path
                    d="M 40,140 Q 90,138 140,82 T 240,25 T 340,115 L 380,138"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="4 1"
                    className="animate-pulse"
                  />

                  <circle cx="240" cy="25" r="5" fill="#f43f5e" className="animate-ping" />
                  <circle cx="240" cy="25" r="3" fill="#f43f5e" />
                  <text x="245" y="22" fill="#991b1b" className="text-[9px] font-mono font-bold" fillOpacity="0.9">EXCLUSION THRESHOLD PEAK (+320%)</text>

                  <text x="35" y="153" fill="#94a3b8" className="text-[8px] font-mono" textAnchor="end">00:00</text>
                  <text x="240" y="166" fill="#94a3b8" className="text-[8px] font-mono" textAnchor="middle">12:00 (MIDDAY)</text>
                  <text x="380" y="153" fill="#94a3b8" className="text-[8px] font-mono" textAnchor="start">23:00</text>
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-505 text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <span className="text-indigo-650 text-indigo-600">● Blue: Roster Shift Baseline</span>
                <span className="text-rose-600 font-bold font-mono">● Rose: Observed 24H Cycle outlier telemetry</span>
              </div>
            </div>

          </div>

          {/* Anomaly Queue Workspace table */}
          <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">ACTIVE BEHAVIORAL ANOMALY HEURISTICS QUEUE</span>
              <span className="text-[10px] text-slate-500 font-mono">{anomalyQueue.length} anomalies indexed</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-xs">
              <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold text-slate-650 text-slate-600 border-b border-slate-200 uppercase text-[9px] tracking-wider text-left">
                <span className="col-span-3">Subject Employee</span>
                <span className="col-span-3">Assigned Clinical Role</span>
                <span className="col-span-4">Behavioral Anomaly Found</span>
                <span className="col-span-2 text-right">Scoring Level</span>
              </div>

              <div className="divide-y divide-slate-100">
                {anomalyQueue.map((anom) => (
                  <div 
                    key={anom.user} 
                    onClick={() => onSelectUser && onSelectUser(anom.user)}
                    className="grid grid-cols-12 p-3 hover:bg-slate-50 items-center transition-colors cursor-pointer text-left"
                  >
                    <span className="col-span-3 font-bold text-slate-800 text-[11px] hover:underline">@{anom.user}</span>
                    <span className="col-span-3 text-slate-500">{anom.role}</span>
                    <div className="col-span-4 space-y-0.5 text-left">
                      <span className="text-slate-900 font-medium block font-sans">{anom.anomaly}</span>
                      <span className="text-[9px] text-slate-500 block">{anom.time} ({anom.code})</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold font-mono ${anom.severity === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' : anom.severity === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                        ● {anom.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* RENDER TAB 2: Behavior Baseline Repository */}
      {activeTab === 'repository' && (
        <div className="space-y-6">
          
          {/* Subheader and Sub-Tab Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setRepoTab('users')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${repoTab === 'users' ? 'border-indigo-650 border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Staff Baseline Directory
              </button>
              <button
                onClick={() => setRepoTab('roles')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${repoTab === 'roles' ? 'border-indigo-650 border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Role Template Policies
              </button>
            </div>

            {/* Simple Help Line */}
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Settings size={12} className="text-slate-400" />
              Editable by Hospital Administrators or Security Analysts.
            </span>
          </div>

          {/* SUB-TAB 1: Staff Baseline Directory */}
          {repoTab === 'users' && (
            <div className="space-y-6">
              
              {/* Directory Filter / Controls */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search staff user profiles or roles..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-250 rounded-lg focus:outline-none focus:border-indigo-500 font-sans text-slate-800"
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 justify-end shrink-0">
                  <Activity size={12} className="text-indigo-600" />
                  Showing {filteredProfiles.length} of {profiles.length} baseline profiles
                </div>
              </div>

              {/* Main Directory List */}
              <div className="space-y-4">
                {filteredProfiles.map((p) => {
                  const isEditing = editingUserId === p.userId;
                  const isSandboxed = sandboxUserId === p.userId;

                  return (
                    <div 
                      key={p.userId} 
                      className={`border rounded-xl transition-all overflow-hidden ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : isSandboxed ? 'border-emerald-500 shadow-sm' : 'border-slate-200 hover:border-slate-350 hover:border-slate-300'}`}
                    >
                      {/* Collapsed/Header View */}
                      <div className="bg-slate-50/50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">@{p.username}</span>
                            <span className="text-[10px] px-2 py-0.5 font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full">
                              {p.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Baseline Confidence: 
                            <span className={`ml-1 font-bold ${p.baselineConfidence && p.baselineConfidence >= 85 ? 'text-emerald-600' : p.baselineConfidence && p.baselineConfidence >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {p.baselineConfidence || 90}%
                            </span>
                            <span className="mx-2 text-slate-300">|</span>
                            Last Updated: <span className="font-semibold text-slate-600">{p.lastUpdated ? new Date(p.lastUpdated).toLocaleString() : 'N/A'}</span>
                          </p>
                        </div>

                        {/* Inline Actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => isEditing ? handleCancelEdit() : handleStartEdit(p)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={12} className="text-slate-500" />
                            {isEditing ? 'Cancel' : 'Edit parameters'}
                          </button>
                          <button
                            onClick={() => handleStartSandbox(p)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Brain size={12} className="text-indigo-600" />
                            EMA model recalculation
                          </button>
                          <button
                            onClick={() => handleResetProfile(p.userId, p.username)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw size={12} className="text-rose-500" />
                            Reset default policy
                          </button>
                        </div>
                      </div>

                      {/* EDIT PANEL */}
                      {isEditing && (
                        <div className="p-4 bg-white border-t border-slate-100 space-y-4">
                          <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <SlidersHorizontal size={13} className="text-indigo-600" />
                            Update Individual Expected Behavior Parameters
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                            {/* Shift Start */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Typical Shift Start</label>
                              <input
                                type="text"
                                value={editForm.typicalShiftStart || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalShiftStart: e.target.value })}
                                placeholder="08:00"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                            
                            {/* Shift End */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Typical Shift End</label>
                              <input
                                type="text"
                                value={editForm.typicalShiftEnd || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalShiftEnd: e.target.value })}
                                placeholder="17:00"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>

                            {/* Daily Patient Views */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Typical Views Limit / Day</label>
                              <input
                                type="number"
                                value={editForm.typicalPatientViewsPerDay || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalPatientViewsPerDay: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Hourly Patient Views */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Typical Views / Hour</label>
                              <input
                                type="number"
                                value={editForm.typicalHourlyPatientViews || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalHourlyPatientViews: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Sensitive Rate */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Sensitive Views / Hour</label>
                              <input
                                type="number"
                                value={editForm.typicalSensitiveRecordAccessRate || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalSensitiveRecordAccessRate: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Daily Logins */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Expected Logins / Day</label>
                              <input
                                type="number"
                                value={editForm.typicalDailyLogins || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalDailyLogins: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Session Duration */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Session Duration (Min)</label>
                              <input
                                type="number"
                                value={editForm.averageSessionDurationMin || ''}
                                onChange={(e) => setEditForm({ ...editForm, averageSessionDurationMin: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Working Days */}
                            <div className="space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Working Days</label>
                              <input
                                type="text"
                                value={editForm.normalWorkingDays?.join(", ") || ''}
                                onChange={(e) => setEditForm({ ...editForm, normalWorkingDays: e.target.value.split(",").map(s => s.trim()) })}
                                placeholder="Monday, Tuesday"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            {/* Modules Accessed */}
                            <div className="col-span-1 sm:col-span-2 md:col-span-4 space-y-1">
                              <label className="font-mono text-[11px] font-bold text-slate-500">Typical Modules Scope</label>
                              <input
                                type="text"
                                value={editForm.typicalModulesAccessed?.join(", ") || ''}
                                onChange={(e) => setEditForm({ ...editForm, typicalModulesAccessed: e.target.value.split(",").map(s => s.trim()) })}
                                placeholder="Clinical Intake, Vital Logs, Prescriptions"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveProfile(p.userId)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save size={13} />
                              Save Baseline Customizations
                            </button>
                          </div>
                        </div>
                      )}

                      {/* MODEL TRAINING / EMA SANDBOX */}
                      {isSandboxed && (
                        <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 space-y-4">
                          <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                            <h4 className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Brain size={13} className="text-emerald-600 animate-pulse" />
                              Interactive Adaptive Learning Model Sandbox
                            </h4>
                            <button
                              onClick={() => setSandboxUserId(null)}
                              className="text-emerald-700 hover:text-emerald-950 text-xs font-mono"
                            >
                              Close Sandbox
                            </button>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            Simulate active roster workflows. Modifying these values and executing training simulates 
                            daily behavior and computes adjustments using an <strong>Exponential Moving Average (EMA)</strong>. 
                            If behaviors remain close to baseline over time, the system automatically adapts, reducing risk false-positives while adjusting baseline confidence dynamically.
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-emerald-800">Observed Patient Views / Day</label>
                              <input
                                type="number"
                                value={observedDaily}
                                onChange={(e) => setObservedDaily(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-emerald-800">Observed Views / Hour</label>
                              <input
                                type="number"
                                value={observedHourly}
                                onChange={(e) => setObservedHourly(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-emerald-800">Observed Logins / Day</label>
                              <input
                                type="number"
                                value={observedLogins}
                                onChange={(e) => setObservedLogins(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-emerald-800">Observed Session Duration (Min)</label>
                              <input
                                type="number"
                                value={observedDuration}
                                onChange={(e) => setObservedDuration(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-emerald-100">
                            <div className="text-[10px] font-mono text-emerald-800">
                              EMA Smoothing Coefficient: <strong>λ = 0.10</strong>
                            </div>
                            <button
                              onClick={handleRunRecalculate}
                              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
                            >
                              <Brain size={13} />
                              Train Model (Apply EMA)
                            </button>
                          </div>

                          {/* RECALC RESULT METRIC */}
                          {recalcResult && (
                            <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-3 animate-fade-in text-xs font-mono">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="font-bold text-emerald-850 text-emerald-800 flex items-center gap-1">
                                  <TrendingUp size={13} /> Model Training Matrix Summary
                                </span>
                                <span className="text-[10px] text-slate-500">Learning Formula: X_new = (0.1 * X_obs) + (0.9 * X_old)</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Patient Views/Day</p>
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <span className="text-slate-500">{recalcResult.previous.daily}</span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="font-bold text-indigo-650 text-indigo-600">{recalcResult.updated.daily}</span>
                                  </div>
                                </div>

                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Hourly Access Views</p>
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <span className="text-slate-500">{recalcResult.previous.hourly}</span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="font-bold text-indigo-650 text-indigo-600">{recalcResult.updated.hourly}</span>
                                  </div>
                                </div>

                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Daily Logins Count</p>
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <span className="text-slate-500">{recalcResult.previous.logins}</span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="font-bold text-indigo-650 text-indigo-600">{recalcResult.updated.logins}</span>
                                  </div>
                                </div>

                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Session Duration (m)</p>
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <span className="text-slate-500">{recalcResult.previous.duration}m</span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="font-bold text-indigo-650 text-indigo-600">{recalcResult.updated.duration}m</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-2.5 bg-emerald-50 rounded-lg text-[11px] text-slate-700 leading-snug font-sans">
                                <strong>Confidence Update Score: </strong> 
                                The baseline model confidence rating shifted to <strong className="text-emerald-700">{recalcResult.updated.confidence}%</strong>. 
                                Standard ATIF evaluation rules will weigh deviations on this profile with a multiplier calibrated to this confidence level.
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display Mode / Standard Details Panel */}
                      {!isEditing && !isSandboxed && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-white border-t border-slate-100">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Shift Boundaries:</span>
                            <p className="font-bold text-slate-800">{p.typicalShiftStart || '08:00'} - {p.typicalShiftEnd || '17:00'}</p>
                          </div>
                          
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Views Thresholds:</span>
                            <p className="font-bold text-slate-800">Daily: {p.typicalPatientViewsPerDay || 20} | Hourly: {p.typicalHourlyPatientViews || 3}</p>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Working Days:</span>
                            <p className="font-bold text-slate-800 font-sans truncate" title={p.normalWorkingDays?.join(", ")}>
                              {p.normalWorkingDays?.join(", ") || 'Mon - Fri'}
                            </p>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Est. Session Length:</span>
                            <p className="font-bold text-slate-800">{p.averageSessionDurationMin || 30} mins</p>
                          </div>

                          <div className="col-span-1 sm:col-span-2 md:col-span-4 border-t border-slate-100 pt-2 text-[10px] font-sans text-slate-500 flex gap-2 truncate">
                            <strong className="font-mono text-[9px] uppercase tracking-wider shrink-0 text-slate-600">Clinical Directory Scopes:</strong>
                            <span className="truncate">{p.typicalModulesAccessed?.join(" • ") || "Clinical EHR Dashboard • Vital Signs Logs"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* SUB-TAB 2: Role Template Defaults */}
          {repoTab === 'roles' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={14} className="text-indigo-650" />
                  Role-Based Default Policy Guidelines
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  These templates configure standard baseline models automatically allocated to all staff based on clinical assignment rosters.
                  Modifying a role template propagates baseline rules instantly to all employees assigned to that role who have not been manually overridden with custom individual parameters.
                </p>
              </div>

              {/* Grid of Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((t) => {
                  const isEditingRole = editingRole === t.role;

                  return (
                    <div 
                      key={t.role} 
                      className={`border rounded-xl p-4 space-y-4 bg-white transition-all ${isEditingRole ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-350 hover:border-slate-300'}`}
                    >
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase tracking-wider">Default Roster Template</span>
                          <h4 className="font-sans font-bold text-sm text-slate-900">{t.role}</h4>
                        </div>
                        
                        {!isEditingRole && (
                          <button
                            onClick={() => handleStartRoleEdit(t)}
                            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={11} /> Edit default
                          </button>
                        )}
                      </div>

                      {isEditingRole ? (
                        <div className="space-y-4 text-xs font-sans">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Shift Start</label>
                              <input
                                type="text"
                                value={roleEditForm.typicalShiftStart || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalShiftStart: e.target.value })}
                                placeholder="08:00"
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Shift End</label>
                              <input
                                type="text"
                                value={roleEditForm.typicalShiftEnd || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalShiftEnd: e.target.value })}
                                placeholder="17:00"
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Views Limit / Day</label>
                              <input
                                type="number"
                                value={roleEditForm.typicalDailyPatientViews || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalDailyPatientViews: Number(e.target.value) })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Views / Hour</label>
                              <input
                                type="number"
                                value={roleEditForm.typicalHourlyPatientViews || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalHourlyPatientViews: Number(e.target.value) })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Sensitive Views Rate</label>
                              <input
                                type="number"
                                value={roleEditForm.typicalSensitiveRecordAccessRate || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalSensitiveRecordAccessRate: Number(e.target.value) })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Est. Logins Count</label>
                              <input
                                type="number"
                                value={roleEditForm.typicalDailyLogins || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalDailyLogins: Number(e.target.value) })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Session Length (Min)</label>
                              <input
                                type="number"
                                value={roleEditForm.averageSessionDurationMin || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, averageSessionDurationMin: Number(e.target.value) })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-mono text-[10px] font-bold text-slate-500">Working Days</label>
                              <input
                                type="text"
                                value={roleEditForm.normalWorkingDays?.join(", ") || ''}
                                onChange={(e) => setRoleEditForm({ ...roleEditForm, normalWorkingDays: e.target.value.split(",").map(s => s.trim()) })}
                                placeholder="Mon, Tue, Wed"
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-mono text-[10px] font-bold text-slate-500">Default Authorized Modules</label>
                            <input
                              type="text"
                              value={roleEditForm.typicalModulesAccessed?.join(", ") || ''}
                              onChange={(e) => setRoleEditForm({ ...roleEditForm, typicalModulesAccessed: e.target.value.split(",").map(s => s.trim()) })}
                              placeholder="Clinical, Prescriptions"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                            />
                          </div>

                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <button
                              onClick={handleCancelRoleEdit}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveRoleTemplate(t.role)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer"
                            >
                              Save Template
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 font-mono text-xs text-slate-700">
                          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Shift Window:</span>
                              <strong className="text-slate-900">{t.typicalShiftStart} - {t.typicalShiftEnd}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block uppercase">Days:</span>
                              <strong className="text-slate-900 font-sans">{t.normalWorkingDays.join(", ")}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                            <div className="bg-slate-50/50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8px] text-slate-500 block uppercase">Views/Day</span>
                              <strong className="text-indigo-600">{t.typicalDailyPatientViews}</strong>
                            </div>
                            <div className="bg-slate-50/50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8px] text-slate-500 block uppercase">Views/Hour</span>
                              <strong className="text-indigo-600">{t.typicalHourlyPatientViews}</strong>
                            </div>
                            <div className="bg-slate-50/50 p-1.5 rounded border border-slate-100">
                              <span className="text-[8px] text-slate-500 block uppercase">Sens. Views</span>
                              <strong className="text-rose-600">{t.typicalSensitiveRecordAccessRate}</strong>
                            </div>
                          </div>

                          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-sans">
                            <strong className="font-mono text-[9px] uppercase text-slate-500 block mb-1">Standard Scope:</strong>
                            <p className="text-slate-600 truncate">{t.typicalModulesAccessed.join(" • ")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
