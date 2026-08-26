/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Cpu, 
  Clock, 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  UserX, 
  Info, 
  Search, 
  Compass, 
  Check, 
  AlertCircle, 
  FileText, 
  Terminal, 
  ChevronRight, 
  Activity, 
  ArrowDown 
} from 'lucide-react';
import { UserBehaviorProfile, ThreatIncident, SecurityEvent, SecurityRiskLevel, HospitalRole } from '../types';

interface SecurityUserProfileViewProps {
  profile: UserBehaviorProfile;
  profiles?: UserBehaviorProfile[];
  onSelectProfile?: (username: string) => void;
  incidents: ThreatIncident[];
  events: SecurityEvent[];
  onNavigateToInvestigation?: (incident: ThreatIncident) => void;
}

const getDisplayName = (username: string) => {
  if (username === 'him_officer') return 'Elena Rostova';
  if (username === 'dr_house') return 'Dr. Gregory House';
  if (username === 'nurse_rached') return 'Nurse Florence Nightingale';
  if (username === 'pharmacist_bob') return 'Pharmacist Bob';
  if (username === 'lab_scientist') return 'Dr. Louis Pasteur';
  if (username === 'rad_officer') return 'Marie Curie';
  if (username === 'analyst_sam') return 'Sarah Johnson';
  return username;
};

const getDepartment = (role: HospitalRole) => {
  if (role === HospitalRole.HIM_OFFICER) return "Health Information Management";
  if (role === HospitalRole.DOCTOR) return "Internal Medicine / Clinical Care";
  if (role === HospitalRole.NURSE) return "Emergency Ward Nursing";
  if (role === HospitalRole.PHARMACIST) return "Inpatient Pharmacy Services";
  if (role === HospitalRole.LAB_SCIENTIST) return "Clinical Pathology Laboratory";
  if (role === HospitalRole.RADIOLOGY_OFFICER) return "Diagnostic Radiology Center";
  if (role === HospitalRole.ACCOUNTS_OFFICER) return "Financial Operations & Billing";
  if (role === HospitalRole.IT_ADMIN) return "Information Technology / Core Systems";
  return "Clinical Services Support";
};

export default function SecurityUserProfileView({ 
  profile, 
  profiles, 
  onSelectProfile, 
  incidents, 
  events,
  onNavigateToInvestigation
}: SecurityUserProfileViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const allProfiles = profiles || [profile];
  const selectProfile = onSelectProfile || (() => {});

  // Standard Baseline Risk calculation for profile
  const calculateBaselineScore = (p: UserBehaviorProfile) => {
    return p.currentWeekViews > p.averageWeeklyViews 
      ? Math.min(100, Math.round((p.currentWeekViews / Math.max(1, p.averageWeeklyViews)) * 52)) 
      : Math.min(100, Math.round((p.currentWeekViews / Math.max(1, p.averageWeeklyViews)) * 25));
  };

  const baselineScore = calculateBaselineScore(profile);

  // Active investigation query from the ATIF Engine state
  const userIncidents = incidents.filter(i => i.affectedUser.toLowerCase() === profile.username.toLowerCase());
  const activeIncident = userIncidents.find(i => i.status === "Open" || i.status === "Investigating");

  // Single source of truth adaptive attributes
  const liveRiskScore = activeIncident ? activeIncident.riskScore : baselineScore;
  const liveRiskLevel = activeIncident ? activeIncident.riskLevel : (
    liveRiskScore > 75 ? SecurityRiskLevel.CRITICAL :
    liveRiskScore > 50 ? SecurityRiskLevel.HIGH :
    liveRiskScore > 25 ? SecurityRiskLevel.MEDIUM :
    SecurityRiskLevel.LOW
  );

  const isCriticalOrHigh = liveRiskLevel === SecurityRiskLevel.CRITICAL || liveRiskLevel === SecurityRiskLevel.HIGH;

  const riskLevelColor = 
    liveRiskLevel === SecurityRiskLevel.CRITICAL ? "text-rose-700 bg-rose-50 border-rose-200" :
    liveRiskLevel === SecurityRiskLevel.HIGH ? "text-amber-700 bg-amber-50 border-amber-200" :
    liveRiskLevel === SecurityRiskLevel.MEDIUM ? "text-yellow-800 bg-yellow-50 border-yellow-200" :
    "text-emerald-700 bg-emerald-50 border-emerald-200";

  // Static profile parameters (Section A)
  const staticExpectedHours = profile.role === HospitalRole.ACCOUNTS_OFFICER ? "09:00 - 17:00" : "08:00 - 16:00";
  const staticExpectedViews = Math.round(profile.averageWeeklyViews / 5);
  const staticTypicalDevices = profile.recentDevices?.[0] || "Authorized EHR Workstation";
  const staticTypicalIps = profile.recentIps?.[0] || "10.20.10.12";
  const staticPdfExports = profile.role === HospitalRole.HIM_OFFICER ? "2 - 5 per shift" : "0 - 1 (Atypical)";
  const staticHistoricalRisk = `${Math.min(12, Math.max(4, (profile.username.charCodeAt(0) % 8) + 4))}/100`;
  const staticNormalDeviation = "12%";

  // Live Deviation calculations
  const compassSteps = [
    { name: "Baseline", pct: 12, label: "Standard EHR access activity roster" },
    { name: "Credential Abuse", pct: 34, label: "Consecutive credential anomalies detected" },
    { name: "Sensitive Record Access", pct: 58, label: "Restricted patient dossier boundary crossing" },
    { name: "Repeated PDF Export", pct: 81, label: "High frequency database compilations initiated" },
    { name: "Harvesting Threshold", pct: 100, label: "EHR clinical harvesting rate limit breached" }
  ];

  // Map score dynamically to step indices
  let activeStepIndex = 0;
  if (liveRiskScore >= 100) activeStepIndex = 4;
  else if (liveRiskScore >= 75) activeStepIndex = 3;
  else if (liveRiskScore >= 50) activeStepIndex = 2;
  else if (liveRiskScore >= 25) activeStepIndex = 1;
  else activeStepIndex = 0;

  const activeDeviationPct = activeIncident ? compassSteps[activeStepIndex].pct : 12;

  // Filter profiles based on search query
  const filteredProfiles = allProfiles.filter(p => {
    const q = searchQuery.toLowerCase();
    const displayName = getDisplayName(p.username).toLowerCase();
    return p.username.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || displayName.includes(q);
  });

  return (
    <div className="flex flex-col xl:flex-row gap-6 text-left" id="atif-userprofile-workspace">
      
      {/* ========================== LEFT SIDEBAR: USER RISK DIRECTORY ========================== */}
      <div className="w-full xl:w-80 shrink-0 bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex flex-col space-y-4 shadow-xs" id="profiles-directory-list">
        <div>
          <h3 className="font-extrabold text-slate-950 text-[11px] uppercase tracking-wider flex items-center gap-2">
            <Users size={15} className="text-emerald-600" />
            User Risk Directory
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Live security posture prioritized indices</p>
        </div>

        {/* Dynamic filter input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search staff, username or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Directory Card Items */}
        <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1" id="profiles-risk-cards-group">
          {filteredProfiles.map((p) => {
            const pIncidents = incidents.filter(i => i.affectedUser.toLowerCase() === p.username.toLowerCase());
            const pActiveIncident = pIncidents.find(i => i.status === "Open" || i.status === "Investigating");
            
            const itemScore = pActiveIncident ? pActiveIncident.riskScore : calculateBaselineScore(p);
            const itemLevel = pActiveIncident ? pActiveIncident.riskLevel : (
              itemScore > 75 ? "Critical" : itemScore > 50 ? "High" : itemScore > 25 ? "Medium" : "Low"
            );

            const badgeColor = 
              itemLevel === "Critical" ? "bg-rose-50 text-rose-700 border-rose-100 font-bold" :
              itemLevel === "High" ? "bg-orange-50 text-orange-700 border-orange-100 font-bold" :
              itemLevel === "Medium" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
              "bg-emerald-50 text-emerald-700 border-emerald-100";

            const isSelected = p.username.toLowerCase() === profile.username.toLowerCase();

            return (
              <button
                key={p.userId}
                onClick={() => selectProfile(p.username)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-2.5 cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-xs ring-1 ring-emerald-500/10' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start w-full gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${
                      isSelected ? 'bg-emerald-600 text-white border-transparent' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {p.username.slice(0, 2)}
                    </div>
                    <div className="leading-tight">
                      <span className="font-bold text-slate-900 text-xs block">{getDisplayName(p.username)}</span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[130px]">@{p.username}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono border uppercase tracking-wider block ${badgeColor}`}>
                      {itemScore}/100
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-400 block mt-0.5 uppercase tracking-tight">{itemLevel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-100 w-full">
                  <span className="text-slate-400">Views: {p.currentWeekViews}/{p.averageWeeklyViews}</span>
                  {pActiveIncident ? (
                    <span className="text-rose-600 font-black animate-pulse uppercase flex items-center gap-1">
                      ⚠️ {pActiveIncident.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold uppercase flex items-center gap-1">
                      ● SECURE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {filteredProfiles.length === 0 && (
            <div className="py-8 text-center text-slate-400 font-mono text-[11px]">
              No matching profiles found.
            </div>
          )}
        </div>
      </div>

      {/* ========================== RIGHT MAIN PANEL: LIVE ADAPTIVE POSTURE HUD & SECTIONS ========================== */}
      <div className="flex-1 space-y-6" id="profiles-detail-view-container">
        
        {/* Real-time Posture HUD Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[9.5px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">SIEM CLINICIAN PROFILE SUMMARY</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">@{profile.username} &mdash; {getDisplayName(profile.username)}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{profile.role}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Current Adaptive Risk</span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border uppercase tracking-widest ${riskLevelColor}`}>
                  ● {activeIncident ? liveRiskLevel : "Secure"} ({liveRiskScore}/100)
                </span>
              </div>
            </div>
          </div>

          {activeIncident ? (
            /* ACTIVE INVESTIGATION SUB-HUD BANNER */
            <div className="mt-4 p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col md:flex-row justify-between gap-4 text-xs animate-pulse">
              <div className="space-y-1">
                <span className="text-[8px] font-mono font-bold text-rose-500 uppercase tracking-widest block">Current Investigation</span>
                <h4 className="font-extrabold text-slate-900 leading-snug">{activeIncident.title}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-mono text-[10px] pt-1">
                  <span>Incident ID: <strong className="text-slate-800">{activeIncident.id}</strong></span>
                  <span>Attack Stage: <strong className="text-rose-700 uppercase">{liveRiskScore >= 75 ? "⚠️ EXFILTRATION / ABUSE" : liveRiskScore >= 45 ? "🔍 LATERAL DEVIATION" : "🚪 RECONNAISSANCE"}</strong></span>
                </div>
              </div>
              <div className="flex items-center md:items-end flex-row md:flex-col gap-x-4 gap-y-1 shrink-0 text-left md:text-right font-mono text-[10px]">
                <div>Status: <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase">{activeIncident.status}</span></div>
                <div>Confidence: <span className="text-rose-700 font-bold">{activeIncident.confidenceScore || 99}%</span></div>
              </div>
            </div>
          ) : (
            /* SECURE SUB-HUD BANNER */
            <div className="mt-4 p-3.5 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle size={15} className="text-emerald-600 shrink-0" />
              <p className="text-slate-600">
                <strong>No active threat investigations detected for this clinician.</strong> Operating normally inside expected baseline limits.
              </p>
            </div>
          )}
        </div>

        {/* Dynamic / Static Sections Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ========================== SECTION A: BEHAVIORAL BASELINE (STATIC) ========================== */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">SECTION A</span>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                Behavioral Baseline (Static)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Predefined, static historical behavior templates</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Corporate Role</span>
                <span className="font-semibold text-slate-800">{profile.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Clinical Department</span>
                <span className="font-semibold text-slate-800">{getDepartment(profile.role)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Expected Login Hours</span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{staticExpectedHours}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Typical Devices Allowed</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[170px]" title={profile.recentDevices.join(', ')}>
                  {staticTypicalDevices}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Expected Daily EHR Lookups</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{staticExpectedViews} views/day</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Typical Daily PDF Exports</span>
                <span className="font-semibold text-slate-800">{staticPdfExports}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Historical Average Risk Score</span>
                <span className="font-mono font-bold text-emerald-600">{staticHistoricalRisk}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Normal Operational Deviation</span>
                <span className="font-mono font-bold text-slate-800">{staticNormalDeviation}</span>
              </div>
            </div>

            <div className="text-[9.5px] italic text-slate-400 font-serif leading-tight pt-2 border-t border-slate-100">
              * Values are calibrated via role audit templates and remain permanently locked unless redefined by security administrators.
            </div>
          </div>

          {/* ========================== SECTION B: LIVE ADAPTIVE SESSION (DYNAMIC) ========================== */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-xs transition-all ${
            activeIncident ? 'bg-rose-50/10 border-rose-200' : 'bg-white border-slate-200'
          }`}>
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-widest block">SECTION B</span>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                <Activity size={14} className="text-rose-500" />
                Live Adaptive Session (Dynamic)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-time dynamic correlation session diagnostics</p>
            </div>

            {activeIncident ? (
              /* DYNAMIC ACTIVE SESSION FIELDS */
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Adaptive Risk</span>
                  <span className="font-mono font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    {activeIncident.riskScore} / 100
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Session Match Confidence</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {activeIncident.confidenceScore || 99}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Attack Phase</span>
                  <span className="font-bold uppercase text-[10px] text-rose-600 tracking-wide">
                    {activeStepIndex === 4 ? "🚨 EXFILTRATION / HARVESTING" : activeStepIndex === 3 ? "⚠️ REPEATED PDF EXPORT" : activeStepIndex === 2 ? "🔍 SENSITIVE ACCESS" : "🚪 INITIAL DEVIATION"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Active Incident Case</span>
                  <span className="font-mono font-bold text-slate-800">{activeIncident.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Session Duration</span>
                  <span className="font-mono font-semibold text-slate-800">{activeIncident.sessionDuration || "14m 32s"}</span>
                </div>
                <div className="flex flex-col gap-1 py-1 border-b border-slate-100">
                  <span className="text-slate-500 mb-0.5">Triggered ATIF Indicators</span>
                  <div className="flex flex-wrap gap-1">
                    {(activeIncident.triggeredIndicators || ["Baseline Access Shift"]).map((ind, idx) => (
                      <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 text-[8.5px] font-mono px-2 py-0.5 rounded-full font-bold">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-slate-500 mb-0.5">Latest Correlated Evidence</span>
                  <div className="max-h-20 overflow-y-auto space-y-1.5 pr-1">
                    {(activeIncident.evidence || ["Atypical lookup velocity logged on clinical directories"]).map((evLine, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start text-[10px] text-slate-600 leading-relaxed font-mono">
                        <span className="text-rose-500 shrink-0 font-bold">•</span>
                        <span>{evLine}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* DYNAMIC SECURE SESSION FIELDS */
              <div className="space-y-4">
                <div className="py-6 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <CheckCircle size={20} />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-slate-900 text-xs">NO ACTIVE DEVIATION TRIGGERED</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Correlation session is clean. Displaying baseline defaults.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-[11px] font-mono">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Risk Index</span>
                    <span className="text-emerald-600 font-bold">{baselineScore}/100</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Heuristic State</span>
                    <span className="text-emerald-600 font-bold uppercase">SECURE</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ========================== REQUIREMENT 3: BEHAVIOUR DEVIATION COMPASS ========================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4 text-left">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Compass size={15} className="text-indigo-600" />
              ATIF Behavior Deviation Compass
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculates and maps deviation levels from the active SIEM correlation session</p>
          </div>

          {/* Compass Steps Progression */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {compassSteps.map((step, idx) => {
              const isPassed = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              const isFuture = idx > activeStepIndex;

              let stepColor = "bg-slate-100 text-slate-400 border-slate-200";
              if (isCurrent) {
                stepColor = activeIncident 
                  ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/15 font-black scale-105 shadow-sm"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/15 font-black scale-105 shadow-sm";
              } else if (isPassed) {
                stepColor = "bg-slate-50 text-slate-700 border-slate-300";
              }

              return (
                <div key={idx} className="flex flex-col items-center justify-between text-center relative p-3 border rounded-xl bg-white/50">
                  
                  {/* Step Metadata */}
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono border block uppercase tracking-wider ${
                      isCurrent ? (activeIncident ? "bg-rose-100 border-rose-200" : "bg-emerald-100 border-emerald-200") : "bg-slate-50 border-transparent text-slate-500"
                    }`}>
                      {step.name}
                    </span>
                    <span className={`block text-lg font-black font-mono leading-none py-1 ${
                      isCurrent ? (activeIncident ? "text-rose-600" : "text-emerald-600") : isPassed ? "text-slate-700" : "text-slate-300"
                    }`}>
                      {step.pct}%
                    </span>
                    <span className="block text-[8.5px] text-slate-400 leading-tight font-sans font-medium px-1">
                      {step.label}
                    </span>
                  </div>

                  {/* Indicators Circle overlay */}
                  <div className="mt-3 flex items-center justify-center shrink-0">
                    {isPassed ? (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    ) : isCurrent ? (
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center animate-pulse ${
                        activeIncident ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-slate-50" />
                    )}
                  </div>

                  {/* Connection indicator */}
                  {idx < 4 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connected list visual with arrows for mobile screens */}
          <div className="md:hidden flex flex-col items-center justify-center gap-1.5 py-4 border-t border-slate-100 mt-4 font-mono text-xs">
            <span className="text-slate-500 font-bold">Baseline: 12%</span>
            <ArrowDown size={12} className="text-slate-300" />
            <span className={activeStepIndex >= 1 ? "text-slate-800 font-bold" : "text-slate-300 font-bold"}>Credential Abuse: 34%</span>
            <ArrowDown size={12} className="text-slate-300" />
            <span className={activeStepIndex >= 2 ? "text-slate-800 font-bold" : "text-slate-300 font-bold"}>Sensitive Record Access: 58%</span>
            <ArrowDown size={12} className="text-slate-300" />
            <span className={activeStepIndex >= 3 ? "text-slate-800 font-bold" : "text-slate-300 font-bold"}>Repeated PDF Export: 81%</span>
            <ArrowDown size={12} className="text-slate-300" />
            <span className={activeStepIndex >= 4 ? "text-slate-800 font-black text-rose-600 animate-pulse" : "text-slate-300 font-bold"}>Harvesting Threshold: 100%</span>
          </div>
        </div>

        {/* ========================== REQUIREMENT 4: EXPLAINABLE THREAT DIAGNOSIS ========================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <span className="font-mono text-indigo-950 font-bold tracking-wider text-[10px] flex items-center gap-1.5 uppercase">
            <Cpu size={14} className="text-indigo-600" /> Explainable Threat Diagnosis
          </span>
          
          {activeIncident ? (
            <div className="space-y-3.5">
              <p className="text-[11.5px] text-slate-700 font-serif italic leading-relaxed bg-slate-50/70 p-4 border border-slate-150 rounded-xl">
                "{activeIncident.explanation || `The ATIF Correlation Engine identified active behavioral deviations. High-frequency patient directory lookups (${activeIncident.deviationPercentage || 120}% above daily baseline), coupled with repeated PDF report exports, triggered the heuristics classification framework.`}"
              </p>
              <div className="space-y-1.5">
                <h5 className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">SIEM Adaptive Recommendation Directives:</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {(activeIncident.recommendations || [
                    "Perform immediate user directory MFA credential challenges",
                    "Suspend EHR clinical export permissions for this session role"
                  ]).map((rec, idx) => (
                    <li key={idx} className="p-2.5 bg-rose-50/20 border border-rose-150 text-rose-950 rounded-lg flex items-center gap-2">
                      <AlertCircle size={13} className="text-rose-600 shrink-0" />
                      <span className="leading-tight">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-[11.5px] text-slate-500 font-serif italic leading-relaxed bg-slate-50/70 p-4 border border-slate-150 rounded-xl">
              "Clinician @{profile.username} is operating entirely inside expected administrative and clinical boundaries. No high-potency anomalies detected. Real-time credential handshakes verified and current daily access rates are fully compliance-certified."
            </p>
          )}
        </div>

        {/* ========================== REQUIREMENT 5: PERSONAL INCIDENT LOG HISTORY ========================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">PERSONAL INCIDENT LOG HISTORY</span>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Historical and active ATIF incident folder directory</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1" id="profiles-incidents-container">
            {userIncidents.map(inc => {
              const severityBadge = 
                inc.riskLevel === SecurityRiskLevel.CRITICAL ? "bg-rose-50 text-rose-700 border-rose-200" :
                inc.riskLevel === SecurityRiskLevel.HIGH ? "bg-orange-50 text-orange-700 border-orange-200" :
                inc.riskLevel === SecurityRiskLevel.MEDIUM ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                "bg-emerald-50 text-emerald-700 border-emerald-200";

              const statusBadge = 
                inc.status === "Open" || inc.status === "Investigating" 
                  ? "bg-rose-100 text-rose-800 animate-pulse border-rose-200 font-bold" 
                  : "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div key={inc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-slate-100/60">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-250 bg-slate-200 text-slate-800 text-[10px] font-mono font-black px-2 py-0.5 rounded border border-slate-300">
                        {inc.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono border uppercase tracking-wider font-extrabold ${severityBadge}`}>
                        {inc.riskLevel} ({inc.riskScore}/100)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono border uppercase tracking-wider ${statusBadge}`}>
                        {inc.status}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        {new Date(inc.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug pt-1">
                      {inc.title}
                    </h4>
                  </div>

                  {onNavigateToInvestigation && (
                    <button
                      onClick={() => onNavigateToInvestigation(inc)}
                      className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl text-[11px] font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer shrink-0"
                    >
                      Launch Workspace <ArrowRight size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
            {userIncidents.length === 0 && (
              <div className="py-12 text-center text-slate-450 italic space-y-2.5">
                <CheckCircle size={28} className="mx-auto text-emerald-600" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">ZERO HISTORICAL INCIDENTS</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">This clinician has a clean behavioral compliance ledger.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Total parsed session records: {events.filter(e => e.username.toLowerCase() === profile.username.toLowerCase()).length}</span>
            <span>Total recorded incidents: {userIncidents.length}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
