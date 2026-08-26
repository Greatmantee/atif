/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, ShieldAlert, Cpu, ArrowRight, Zap, Info, Play, CheckCircle } from 'lucide-react';
import { ThreatIncident } from '../types';

interface SecurityCorrelationViewProps {
  onInvestigateId?: (incidentId: string) => void;
  incidents?: ThreatIncident[];
  onRefresh?: () => void;
}

export default function SecurityCorrelationView({ onInvestigateId, incidents, onRefresh }: SecurityCorrelationViewProps) {
  const [selectedChain, setSelectedChain] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSuccess, setSimulationSuccess] = useState<boolean>(false);

  // Attack chain presets representing SIEM correlation stories
  const attackChains = [
    {
      id: 0,
      title: "Tactical Exfiltration Chain (Insider Data Harvesting)",
      adversary: "Unauthorized Clinician / Scraping Script",
      confidence: 94,
      severity: "High",
      impact: "HIPAA Breach / Patient Data Disclosure",
      steps: [
        { name: "Successful VPN Login", desc: "Access from unregistered household host", timestamp: "01:23:40", details: "IP: 185.220.101.44 (Tor exit node proxy detected)", status: "COMPLETED", icon: "network" },
        { name: "RBAC Violation Attempt", desc: "Clinician requests administrative ledger directories", timestamp: "01:25:12", details: "Endpoint: /api/admin/system-logs. Access DENIED.", status: "MITIGATED", icon: "shield" },
        { name: "High Frequency Scraping", desc: "Accessing 48 patient records in under 3 minutes", timestamp: "01:26:05", details: "Exceeded role average baseline lookup threshold by 450%", status: "TRIGGERED", icon: "cpu" },
        { name: "Bulk Export Triggered", desc: "EHR report exfiltration script initiated", timestamp: "01:27:11", details: "Classification: Insider Threat (Code: BULK_VIEW)", status: "ALERT_GENERATED", icon: "zap" }
      ],
      remediation: "Purge active user token session immediately, trigger manual MFA challenge re-assertion, and block source remote proxy IP."
    },
    {
      id: 1,
      title: "Credential Spraying & Brute Force Intrusion",
      adversary: "External Ransomware Pre-cursor",
      confidence: 88,
      severity: "Critical",
      impact: "Clinical Node Takeover / Database Compromise",
      steps: [
        { name: "Brute Force Logins failed", desc: "15 consecutive login failures observed", timestamp: "03:10:02", details: "User targets: pharmacist_bob, nurse_amy, dr_jones", status: "COMPLETED", icon: "network" },
        { name: "Bypass Account Takeover", desc: "Successful login authenticated on pharmacist_bob", timestamp: "03:12:15", details: "Credential stuffing exploit / password spraying", status: "COMPLETED", icon: "shield" },
        { name: "Off-Hours Clinical Access", desc: "Unauthorized prescriptions creation attempts", timestamp: "03:14:40", details: "Target: 5 restricted narcotic orders", status: "TRIGGERED", icon: "cpu" },
        { name: "System Config Modification", desc: "Attempted to modify syslog audit retention variables", timestamp: "03:15:22", details: "Blocked by ATIF integrity engine (File: server.ts)", status: "MITIGATED", icon: "zap" }
      ],
      remediation: "Enforce complete corporate device locking, suspend user pharmacist_bob, flag IP network route for edge hardware block."
    },
    {
      id: 2,
      title: "Collusive Multi-Account Clinical Data Harvesting",
      adversary: "Accounts Officer (@accounts_alice) & IT Admin (@it_admin)",
      confidence: 97,
      severity: "Critical",
      impact: "HIPAA Non-Compliance / Restricted VIP Records Leak",
      steps: [
        { name: "Anomalous Off-Hours Auth", desc: "User @accounts_alice logged in from home IP at 02:00 AM", timestamp: "02:00:15", details: "Device: Home Tablet Asset. Outside scheduled shift hours.", status: "COMPLETED", icon: "network" },
        { name: "Role Boundary Violation", desc: "Accessed VIP Harold Potter restricted file", timestamp: "02:01:40", details: "Accounts role accessed medical charts with no clinical mandate.", status: "COMPLETED", icon: "shield" },
        { name: "Tor Routing Credential Abuse", desc: "IT admin @it_admin authenticated via Tor Exit Proxy", timestamp: "02:05:10", details: "IP: 185.220.101.99. Elevated geographical anomaly.", status: "TRIGGERED", icon: "cpu" },
        { name: "DLP PDF Export Exfiltration", desc: "Direct file compile of patient report (Harold Potter)", timestamp: "02:06:30", details: "Target: HIS-6043. Incident INC-2026-9901 correlated.", status: "ALERT_GENERATED", icon: "zap" }
      ],
      remediation: "Immediately terminate active sessions for @accounts_alice and @it_admin, enforce MFA rotation, block IP 185.220.101.99, and audit access on clinical database segment."
    }
  ];

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationSuccess(false);
    try {
      const response = await fetch('/api/security/simulate-multi-user-threat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setSimulationSuccess(true);
        setSelectedChain(2); // Auto-focus the newly injected coordinated threat story
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error("Failed to run simulated coordinated threat.");
      }
    } catch (err) {
      console.error("Error executing simulation request:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const activeChain = attackChains[selectedChain];

  return (
    <div className="space-y-6">
      {/* Simulation Trigger Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white rounded-2xl p-5 shadow-lg text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider">
              ATIF Attack Simulation & Threat Sandbox
            </span>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Zap size={15} className="text-amber-400" /> Multi-Account Collaborative Threat Simulator
            </h3>
            <p className="text-xs text-slate-300">
              Simulates a complex multi-stage attack involving <strong>different user accounts</strong> performing separate, correlated actions. The resulting incident INC-2026-9901 contains <strong>two or more security indicators</strong>.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`px-4 py-2 font-mono text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isSimulating 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 hover:shadow-indigo-500/10'
              }`}
            >
              {isSimulating ? (
                <>
                  <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Injecting SIEM Telemetry...
                </>
              ) : (
                <>
                  <Play size={12} className="text-emerald-300 fill-emerald-300" /> Execute Multi-User Threat Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual pipeline steps of the scenario */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 border-t border-slate-800 pt-4">
          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono font-bold">
              <span className="w-4 h-4 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-[9px]">1</span>
              @accounts_alice auth
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">Off-hours authentication from unrecognized home network asset (02:00 AM).</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono font-bold">
              <span className="w-4 h-4 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-[9px]">2</span>
              RBAC Scope Boundary Breach
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">Non-clinical account views restricted VIP patient Harold Potter's medical file.</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono font-bold">
              <span className="w-4 h-4 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-[9px]">3</span>
              @it_admin proxy login
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">Administrative login routed via a high reputation-risk Tor exit node proxy.</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl border-dashed border-indigo-500/30 bg-indigo-950/10">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold">
              <span className="w-4 h-4 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-[9px]">4</span>
              DLP PDF Exfil correlated
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">IT admin exports dossier; multiple indicators combine to raise critical Incident INC-2026-9901.</p>
          </div>
        </div>

        {simulationSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <span><strong>Simulation Executed:</strong> Coordinated events injected! Incident <strong>INC-2026-9901</strong> is active in the Threat Feed and Security Events audit tabs.</span>
            </span>
            <button 
              onClick={() => onInvestigateId && onInvestigateId("INC-2026-9901")}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              Open Playbook Forensics
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 text-slate-800 text-left font-sans rounded-2xl p-5" id="sec-correlation-panel">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-4 gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Network size={14} className="text-rose-600" /> Custom ATIF SIEM Correlation Engine
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">Multi-Stage Interactive Attack Chains</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chronologically links independent events into high-fidelity incident vectors</p>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            {attackChains.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChain(c.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${selectedChain === c.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                Story {c.id + 1} ({c.confidence}% Confidence)
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center Columns: Visual Attack Chain Nodes & Directed Links */}
          <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">CORRELATED EVENT GRAVITY FLOW</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                  activeChain.severity === 'Critical' 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {activeChain.severity} Impact Level
                </span>
              </div>

              {/* Interactive horizontal SVG attack nodes */}
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 py-4">
                {/* SVG Glowing Line path background connecting step components */}
                <div className="hidden md:block absolute left-6 right-6 top-[40px] h-[3px] bg-slate-100 z-0">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full transition-all duration-1000"
                    style={{ width: '100%' }}
                  />
                </div>

                {activeChain.steps.map((step, idx) => {
                  const isLast = idx === activeChain.steps.length - 1;
                  const statusColor = 
                    step.status === 'COMPLETED' ? 'text-emerald-700 border-emerald-300 bg-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.15)]' :
                    step.status === 'MITIGATED' ? 'text-indigo-700 border-indigo-200 bg-indigo-50' :
                    step.status === 'TRIGGERED' ? 'text-amber-700 border-amber-250 bg-amber-50 animate-pulse' :
                    'text-rose-700 border-rose-220 bg-rose-50 animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.25)]';

                  return (
                    <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1">
                      {/* Glowing Node Bubble */}
                      <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-sm tracking-wider font-mono shrink-0 transition-all ${statusColor}`}>
                        {idx + 1}
                      </div>

                      <div className="text-left md:text-center font-sans space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 font-mono tracking-tight">{step.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 md:max-w-[130px]">{step.desc}</p>
                        <span className="text-[9px] text-slate-400 font-mono block">{step.timestamp}</span>
                      </div>

                      {!isLast && (
                        <div className="md:hidden flex justify-center py-1">
                          <ArrowRight size={14} className="text-slate-400 transform rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><Info size={11} className="text-slate-400" /> Hovering nodes unlocks chronological forensics hashes.</span>
              <span>SIEM Nodes correlated: {activeChain.steps.length}</span>
            </div>
          </div>

          {/* Right Column: Narrative Story detail panel */}
          <div className="lg:col-span-1 bg-white p-4 border border-slate-200 rounded-2xl flex flex-col justify-between text-xs space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">NARRATIVE AUDIT STATEMENT</span>
                <span className="text-indigo-600 font-bold font-mono">{activeChain.confidence}% Confidence</span>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{activeChain.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono">Mapped actor category: {activeChain.adversary}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
                <div>
                  <span className="text-[10px] font-mono text-rose-700 font-bold uppercase block">[EXPLAINABLE SIEM DIAGNOSIS]</span>
                  <p className="text-slate-600 leading-snug text-[11px] mt-1 font-serif italic">
                    "Correlation engine analyzed {activeChain.steps.length} distinct system boundaries logs. Mapped atomic steps confirm step-wise compromise cascade, elevating general incident threshold parameters into full compliance breach threat."
                  </p>
                </div>

                <div className="text-[10px] text-slate-550 text-slate-500 border-t border-slate-200 pt-2 font-mono">
                  <strong>Potential breach impact:</strong> {activeChain.impact}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] space-y-1.5 text-left">
                <span className="text-indigo-700 font-semibold font-mono flex items-center gap-1 uppercase tracking-wider text-[10px]">
                  <Cpu size={12} /> Playbook Action Plan (Remediation)
                </span>
                <p className="text-indigo-900 leading-relaxed font-sans">{activeChain.remediation}</p>
              </div>
            </div>

            <div className="pt-2">
              {(() => {
                const targetIncidentId = selectedChain === 2 ? "INC-2026-9901" : ((incidents || []).find(i => i.status === "Open" || i.status === "Investigating")?.id || (incidents || [])[0]?.id);
                return (
                  <button
                    onClick={() => targetIncidentId && onInvestigateId && onInvestigateId(targetIncidentId)}
                    disabled={!targetIncidentId}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-[11px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed"
                    title={targetIncidentId ? `Launch investigation for ${targetIncidentId}` : "No active incidents to investigate"}
                  >
                    <ShieldAlert size={12} /> {targetIncidentId ? `Launch active playbook response: ${targetIncidentId}` : 'No active incidents to investigate'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
