/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Radio, Database, Info, Terminal, ShieldX, Play, FileText } from 'lucide-react';
import { ThreatIncident } from '../types';

interface CuratedThreatRule {
  id: string;
  threat: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  confidence: number;
  status: string;
  description: string;
  ruleYaml: string;
  indicators: string[];
  mitigation: string;
}

interface SecurityIntelViewProps {
  incidents: ThreatIncident[];
}

export default function SecurityIntelView({ incidents }: SecurityIntelViewProps) {
  // Master Repository of threat profiles from CISA and HC3 Bulletins
  const threatRules: CuratedThreatRule[] = [
    {
      id: "T1110-C",
      threat: "Credential Spraying (Brute Force Enforcer)",
      category: "Unauthorized Access",
      severity: "Critical",
      confidence: 96,
      status: "ACTIVE",
      description: "Detects rapid successive login attempts on diverse user accounts from a singular IP interface, breaching historical clinician shift baselines. This threat seeks clinical account takeovers to initiate systematic data harvesting or ransomware loaders.",
      ruleYaml: `rule T1110_Credential_Spraying_EHR {
  meta:
    description = "Detects brutal force password stuffing"
    framework = "MITRE ATT&CK T1110"
  strings:
    $fail_event = "LOGIN_FAILED"
  condition:
    count($fail_event) > 10 over 60s from same($ipAddress)
}`,
      indicators: ["185.112.144.22", "91.240.118.99", "User-Agent: Mozilla/5.0 (Python-Scrapy)"],
      mitigation: "Execute source coordinate block, enforce a 30-minute system lockdown on targets, flush active user sessions, and prompt direct biometric or hardware-token MFA challenges."
    },
    {
      id: "T1148-I",
      threat: "HIPAA Harvesting Insider (Bulk Patient Scraping)",
      category: "Insider Threat",
      severity: "High",
      confidence: 94,
      status: "ACTIVE",
      description: "Identifies an authorized clinician account accessing a quantity of patient records exceeding their historical weekly average by 300%+ within an active shift. This represents credential theft or systematic data theft prior to departure.",
      ruleYaml: `rule T1148_Healthcare_Insider_Harvesting {
  meta:
    description = "Triggers on massive record access deviations"
    framework = "HIPAA Compliance Section 164.308"
  strings:
    $view_event = "RECORD_VIEW"
  condition:
    count($view_event) > activeUser.averageWeeklyViews * 1.5 within 300s
}`,
      indicators: ["Device: WARD_LAPTOP_04", "Endpoint: /api/patients/bulk-export", "Volume: >25 unique file queries/min"],
      mitigation: "Lock target user credentials in active directory, flag session tokens for prompt revocation, and dispatch an automated escalation ticket to the compliance officer."
    },
    {
      id: "T1078-A",
      threat: "Anomalous Coordinate/Concurrent Access Session",
      category: "Sensitive Record Access",
      severity: "Medium",
      confidence: 88,
      status: "ACTIVE",
      description: "Triggered when a clinician session originates from geographically impossible coordinates or concurrent locations within a brief timeframe, indicating a compromised VPN channel.",
      ruleYaml: `rule T1078_Geographic_Concurrent_Anomalous {
  meta:
    description = "Detects rapid travel coordinate inconsistencies"
    framework = "MITRE ATT&CK T1078"
  condition:
    session.ips.count > 1 and distanceBetween(session.ips) > 500km within 30m
}`,
      indicators: ["IP: 82.102.23.4 (Proxy)", "IP: 104.244.75.12 (Offices)", "VPN Session concurrent: True"],
      mitigation: "Purge earlier location sessions, trigger a required password reset cascade, and enforce strict RBAC context lookups forcing validation."
    },
    {
      id: "T1046-P",
      threat: "PACS Storage Port Interface Scanner",
      category: "Abnormal User Behavior",
      severity: "Medium",
      confidence: 85,
      status: "MONITORED",
      description: "Detects active port scanning queries on traditional clinical storage endpoints like PACS port 104 or database systems on port 5432, aiming to map vulnerable healthcare hardware systems.",
      ruleYaml: `rule T1046_Network_PACS_System_Mappers {
  meta:
    description = "Detects port probes against clinical nodes"
    framework = "MITRE ATT&CK T1046"
  condition:
    network.ports.probed contains (104, 5432) and srcRole != "SysteAdmin"
}`,
      indicators: ["Host: 10.0.4.15", "Activity: TCP SYN Scan", "Target Ports: 104, 443, 5432"],
      mitigation: "Establish dynamic network firewall isolate boundaries, quarantine source clinical hardware interfaces, and logs full trace traffic histories."
    }
  ];

  const [selectedRuleId, setSelectedRuleId] = useState<string>("T1110-C");
  const activeRule = threatRules.find(r => r.id === selectedRuleId) || threatRules[0];

  // Derive relevant incidents in St Jude Database matching active rule
  const matchedIncidents = incidents.filter(inc => {
    if (activeRule.category === "Unauthorized Access" && inc.threatType === "CREDENTIAL_ABUSE") return true;
    if (activeRule.category === "Insider Threat" && inc.threatType === "INSIDER_THREAT") return true;
    if (activeRule.category === "Sensitive Record Access" && inc.threatType === "SENSITIVE_RECORD_ACCESS") return true;
    if (activeRule.category === "Abnormal User Behavior" && inc.threatType === "ABNORMAL_USER_BEHAVIOR") return true;
    return false;
  });

  return (
    <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl p-5 text-left font-sans space-y-6" id="sec-intel-panel">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
            <Radio size={14} className="text-rose-600 animate-pulse" /> Global Healthcare Threat Intelligence Observatory
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">ATIF Signature Repository & Ruleset</h2>
          <p className="text-xs text-slate-500 mt-0.5">Defensive parameters mapped to HIPAA standards, HPH/HC3 bulletins and MITRE frameworks</p>
        </div>

        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-slate-55 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-slate-500 text-[11px] flex items-center gap-1">
            <Database size={11} className="text-rose-600" /> Signatures Synced: 4 / 64 active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Repos table (col-span-3) */}
        <div className="lg:col-span-3 bg-white p-4 border border-slate-200 rounded-2xl space-y-4">
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">THREAT REGULATORY SIGNATURES INDEX</span>
          
          <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-xs">
            <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold text-slate-600 border-b border-slate-200 uppercase text-[9px] tracking-wider text-left">
              <span className="col-span-4">Adversary Vector (ID)</span>
              <span className="col-span-3">Category</span>
              <span className="col-span-2">Severity</span>
              <span className="col-span-2 text-center">Confidence</span>
              <span className="col-span-1 text-center">Rule</span>
            </div>

            <div className="divide-y divide-slate-100 text-left">
              {threatRules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`grid grid-cols-12 p-3 hover:bg-slate-50 items-center transition-colors cursor-pointer ${rule.id === selectedRuleId ? 'bg-indigo-50 border-l-2 border-indigo-650 pl-2 text-slate-900 font-bold' : 'text-slate-705 text-slate-700'}`}
                >
                  <div className="col-span-4 font-bold text-[11px]">
                    <span className="truncate block">{rule.threat}</span>
                    <span className="text-[9.5px] text-slate-450 text-slate-400 font-normal">{rule.id}</span>
                  </div>

                  <span className="col-span-3 text-slate-500 text-[11px] truncate">{rule.category}</span>

                  <div className="col-span-2">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] font-mono uppercase ${rule.severity === 'Critical' ? 'bg-rose-50 border border-rose-100 text-rose-700' : rule.severity === 'High' ? 'bg-amber-50 border border-amber-150 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {rule.severity}
                    </span>
                  </div>

                  <span className="col-span-2 text-center text-[11px] font-mono font-medium">{rule.confidence}%</span>

                  <span className={`col-span-1 text-center text-[10px] font-bold font-mono ${rule.status === 'ACTIVE' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                    {rule.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] leading-relaxed text-slate-650 font-serif">
            <span className="font-bold text-indigo-700 block font-mono text-[10px] mb-0.5 uppercase">[HC3 TACTICAL INTEL FEED COMPLIANCE NOTE]</span>
            "Section 164.308 security rules specify constant network integrity calibrations. Mapped signatures continuously translate raw security queries into active playbooks for fast incident routing."
          </div>
        </div>

        {/* Right Side: Rule details panel (col-span-2) */}
        <div className="lg:col-span-2 bg-white p-4 border border-slate-200 rounded-2xl flex flex-col justify-between text-xs space-y-4 text-left">
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">SIGNATURE DETAILS FORENSICS</span>
              <span className="text-rose-700 font-bold font-mono text-[10px]">{activeRule.id}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">{activeRule.threat}</h3>
              <p className="text-slate-655 text-slate-600 text-[11px] leading-relaxed">{activeRule.description}</p>
            </div>

            {/* YAML Rule Logic Code block */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Terminal size={11} className="text-indigo-650" /> SIEM Correlation Detection Rule Logic (YARA/SQL)
              </span>
              <pre className="p-2.5 bg-slate-50 border border-slate-200 text-[10px] font-mono text-indigo-705 text-indigo-700 rounded-lg overflow-x-auto leading-normal whitespace-pre">
                {activeRule.ruleYaml}
              </pre>
            </div>

            {/* IoCs (Indicators) */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Indicators of Compromise (IoCs)</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[9.5px]">
                {activeRule.indicators.map((ioc, idx) => (
                  <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded leading-none">
                    {ioc}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended HHS Remediation */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1 text-[11px]">
              <span className="font-bold text-indigo-700 uppercase tracking-wider block font-mono text-[10px]">HHS HHS-HCO Recommended Mitigation</span>
              <p className="text-indigo-905 text-indigo-900 leading-normal">{activeRule.mitigation}</p>
            </div>

            {/* Correlated Active Incidents in our DB */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-mono">CORRELATED REAL-TIME ALERTS IN DATABASE</span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {matchedIncidents.map(inc => (
                  <div key={inc.id} className="p-1.5 bg-rose-50 border border-rose-150 rounded flex justify-between font-mono text-[10px]">
                    <span className="font-bold text-rose-700">● {inc.id}</span>
                    <span className="text-slate-605 text-slate-600">{inc.affectedUser} (Score: {inc.riskScore})</span>
                  </div>
                ))}
                {matchedIncidents.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic">No matching incidents triggered in the live database currently.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button className="w-full py-1.5 bg-slate-50 border border-slate-200 text-slate-500 font-bold font-mono text-[10.5px] rounded-lg cursor-not-allowed flex items-center justify-center gap-1">
              <ShieldX size={11} className="text-rose-600 animate-pulse" /> Manual Signature Override Disabled (HIPAA Mandates)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
