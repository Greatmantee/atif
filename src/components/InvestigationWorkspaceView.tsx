import React, { useState } from 'react';
import { 
  Shield, ShieldCheck, Terminal, Cpu, Clock, TrendingUp, Network, ShieldX, 
  AlertCircle, Lock, Users, Clipboard, AlertOctagon, CheckSquare, Server, Eye,
  ChevronDown, ChevronUp, CheckCircle, Ban, Play, RefreshCw, Layers
} from 'lucide-react';
import { ThreatIncident, SecurityEvent } from '../types';
import { 
  ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis 
} from 'recharts';

interface InvestigationWorkspaceViewProps {
  uniqueIncidents: ThreatIncident[];
  selectedIncident: ThreatIncident | null;
  setSelectedIncident: (inc: ThreatIncident | null) => void;
  handleUpdateStatus: (status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved') => void;
  detailTab: string;
  setDetailTab: (tab: 'diagnosis' | 'correlation' | 'session') => void;
  investigatorNote: string;
  setInvestigatorNote: (note: string) => void;
  handleAddIncidentTimelineNote: (e: React.FormEvent) => void;
}

interface Milestone {
  title: string;
  count: number;
  riskAdded: number;
  startTime: string;
  endTime: string;
  description: string;
  category: 'Authentication' | 'Data Access' | 'Exfiltration' | 'Lateral Deviation' | 'General';
  rawEvents: SecurityEvent[];
}

export default function InvestigationWorkspaceView({
  uniqueIncidents,
  selectedIncident,
  setSelectedIncident,
  handleUpdateStatus,
  detailTab,
  setDetailTab,
  investigatorNote,
  setInvestigatorNote,
  handleAddIncidentTimelineNote
}: InvestigationWorkspaceViewProps) {
  // Sort incidents by timestamp descending (newest on top)
  const sortedIncidents = [...uniqueIncidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Local SOC State Managers
  const [evidenceFilter, setEvidenceFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [selectedChartStep, setSelectedChartStep] = useState<number | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<{ [key: number]: boolean }>({});
  const [socFeedback, setSocFeedback] = useState<{ action: string; message: string } | null>(null);

  // Toggle milestone expand/collapse
  const toggleMilestone = (idx: number) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Trigger SOC simulation playbooks
  const triggerSocRemediation = (action: string, detail: string) => {
    setSocFeedback({
      action,
      message: `[SOC PLAYBOOK SUCCESS]: ${detail} applied to user context @${selectedIncident?.affectedUser}. Firewall rules, VPN credentials, and active tokens refreshed.`
    });
    setTimeout(() => {
      setSocFeedback(null);
    }, 5500);
  };

  // Grouping algorithm for raw SecurityEvents into high-level milestones
  const groupEventsIntoMilestones = (events: SecurityEvent[] | undefined): Milestone[] => {
    if (!events || events.length === 0) return [];
    
    const milestones: Milestone[] = [];
    let currentGroup: SecurityEvent[] = [];
    let lastType = "";

    const getGroupType = (activityType: string) => {
      if (activityType === "LOGIN_FAILED") return "AuthFailure";
      if (activityType === "LOGIN_SUCCESS") return "AuthSuccess";
      if (activityType === "RECORD_VIEW") return "Access";
      if (activityType === "PATIENT_RECORD_EXPORTED") return "Export";
      return "Misc";
    };

    for (const e of events) {
      const type = getGroupType(e.activityType);
      if (currentGroup.length === 0) {
        currentGroup.push(e);
        lastType = type;
      } else if (type === lastType && type !== "AuthSuccess") {
        currentGroup.push(e);
      } else {
        milestones.push(buildMilestone(currentGroup, lastType));
        currentGroup = [e];
        lastType = type;
      }
    }
    if (currentGroup.length > 0) {
      milestones.push(buildMilestone(currentGroup, lastType));
    }

    return milestones;
  };

  const buildMilestone = (group: SecurityEvent[], type: string): Milestone => {
    const count = group.length;
    const first = group[0];
    const last = group[group.length - 1];
    const riskAdded = group.reduce((sum, e) => sum + (e.riskContribution || 4), 0);
    
    let title = "Clinical Activity Logged";
    let description = "";
    let category: 'Authentication' | 'Data Access' | 'Exfiltration' | 'Lateral Deviation' | 'General' = "General";
    
    if (type === "AuthFailure") {
      title = count >= 3 ? "Brute-Force Authentication Attempt Flagged" : "Suspicious Failed Authentication Attempt";
      description = `Detected ${count} password authentication failures on account from host ${first.deviceName || 'unknown'} and IP ${first.ipAddress || 'unknown'}.`;
      category = "Authentication";
    } else if (type === "AuthSuccess") {
      title = "System Access Established & Verified";
      description = `Successful user session authentication from device ${first.deviceName || 'unknown'} and IP ${first.ipAddress || 'unknown'}.`;
      category = "Authentication";
    } else if (type === "Access") {
      const sensitiveCount = group.filter(e => e.isSensitiveAccess).length;
      title = count >= 5 ? "Bulk Patient Record Harvesting Spike" : "Clinical Electronic Health File Inspections";
      description = `Inspected EHR clinical files for ${count} patients. ${sensitiveCount} views triggered elevated data sensitivity flags.`;
      category = "Data Access";
    } else if (type === "Export") {
      title = count >= 3 ? "Bulk Patient History Compilation & Export Surge" : "Patient Clinical Records Exported to PDF";
      description = `Compiled EHR clinical data sheets and downloaded ${count} local patient record PDF exports to endpoint client.`;
      category = "Exfiltration";
    } else {
      title = "System Activity Correlated";
      description = `Correlated clinical EHR activity: ${first.description || first.activityType}.`;
      category = "General";
    }

    return {
      title,
      count,
      riskAdded,
      startTime: first.timestamp,
      endTime: last.timestamp,
      description,
      category,
      rawEvents: group
    };
  };

  // Area Chart custom tooltip component for step-by-step risk explanation
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-950 p-3.5 rounded-xl shadow-xl text-left text-xs text-slate-200 max-w-xs space-y-1.5 font-sans leading-relaxed">
          <div className="font-extrabold uppercase text-[10px] text-red-400 tracking-wider flex justify-between">
            <span>{data.event}</span>
            <span>Step {data.stepNum}</span>
          </div>
          <p className="font-medium text-slate-300 text-[11px] leading-snug">{data.reason}</p>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[10px] font-mono">
            <div>Risk Added: <strong className="text-red-400">+{data.riskAdded}</strong></div>
            <div>Current Risk: <strong className="text-red-500">{data.Risk}/100</strong></div>
            <div>Confidence: <strong className="text-blue-400">{data.Confidence}%</strong></div>
            <div>Risk Before: <strong className="text-slate-400">{data.riskBefore}</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-sans uppercase tracking-wider text-[#ef4444] flex items-center gap-1.5 mb-1">
            <ShieldX size={15} /> ATIF Security Operations Center (SOC) Workspace
          </h3>
          <p className="text-xs text-slate-500 font-medium">Explainable Threat Detection, Adaptive Forensics, and Continuous Session Correlation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar: Incident Registry */}
        <div className="xl:col-span-1 border border-slate-200 bg-slate-50/50 p-4 rounded-2xl text-left flex flex-col space-y-3.5 h-[650px]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-600 font-sans">Incident Registry</span>
            <span className="bg-slate-200 text-slate-800 font-bold font-mono px-2 py-0.5 rounded text-[10px]">
              {sortedIncidents.length} Cases
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {sortedIncidents.map((tInc) => (
              <div 
                key={tInc.id}
                onClick={() => {
                  setSelectedIncident(tInc);
                  setSelectedChartStep(null);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-205 ${
                  selectedIncident && selectedIncident.id === tInc.id 
                    ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10' 
                    : 'bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-[9px] font-extrabold text-slate-400">{tInc.id}</span>
                  <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                    tInc.status === 'Resolved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : tInc.status === 'Investigating'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>{tInc.status}</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-snug tracking-tight line-clamp-2">{tInc.title || tInc.threatType}</h4>
                <span className="block text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  User: @{tInc.affectedUser}
                </span>
                <div className="flex justify-between items-center mt-3 border-t pt-2 border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-medium">{new Date(tInc.timestamp).toLocaleDateString()}</span>
                  <span className={`font-mono font-bold text-xs ${tInc.riskScore >= 75 ? 'text-red-600' : 'text-orange-500'}`}>
                    Risk: {tInc.riskScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Investigation Workspace Detail */}
        <div className="xl:col-span-3 space-y-5">
          {selectedIncident ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-left" id="incident-action-panel">
              
              {/* Remediation success state popup feedback */}
              {socFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex gap-2.5 items-center animate-bounce">
                  <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold">{socFeedback.message}</span>
                </div>
              )}

              {/* Header: ID, Title, Status Stage Selectors */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">CASE FILES: {selectedIncident.id}</span>
                    <span className="text-xs font-semibold text-slate-400">Department: {selectedIncident.department || 'Clinical EHR Access'}</span>
                  </div>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 mt-1.5">{selectedIncident.title || selectedIncident.threatType}</h3>
                </div>
                
                {/* Case Actions */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-[9.5px] font-bold font-sans text-slate-500 mr-1.5">SOC STAGE:</span>
                  {(['Open', 'Investigating', 'Mitigated', 'Resolved'] as any[]).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => handleUpdateStatus(stage)}
                      className={`px-2.5 py-1 rounded font-sans text-[10px] font-bold transition uppercase cursor-pointer border ${
                        selectedIncident.status === stage 
                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Merged Incident Warning Banner */}
              {selectedIncident.isMerged && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex gap-3 text-left">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1.5 text-xs text-amber-900">
                    <h4 className="font-extrabold text-sm text-amber-800 uppercase tracking-tight flex items-center gap-1.5">
                      Merged Incident Investigation Case
                    </h4>
                    <p className="font-medium text-amber-800 leading-normal">
                      Preceding brute-force credential abuse ticket <strong>{selectedIncident.originalIncidentId}</strong> was automatically merged into this higher-severity Insider Threat Case <strong>{selectedIncident.id}</strong> at <strong>{selectedIncident.mergeTime ? new Date(selectedIncident.mergeTime).toLocaleString() : new Date().toLocaleString()}</strong>.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200/50 text-[11px] font-semibold text-amber-800/80 leading-normal">
                      <div>Original Case ID: <strong className="text-amber-900">{selectedIncident.originalIncidentId}</strong></div>
                      <div>Merged Into: <strong className="text-amber-900">{selectedIncident.mergedIntoId}</strong></div>
                      <div className="col-span-2">Merge Reason: <span className="text-amber-900 font-bold">{selectedIncident.mergeReason}</span></div>
                    </div>
                    <p className="text-[10px] font-bold text-amber-700/90 italic pt-1.5 flex items-center gap-1">
                      <ShieldCheck size={11} /> All historical login password failures and auth patterns are fully consolidated and preserved inside the unified timeline.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Investigation Summary Bento (at the very top) */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Quick Investigation Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/40 p-4 border border-slate-200 rounded-2xl">
                  <div className="space-y-1 text-left">
                    <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Attack Chain Stage</span>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest border border-rose-200 bg-rose-50 text-rose-700 animate-pulse">
                      {selectedIncident.riskScore >= 75 ? "⚠️ EXFILTRATION / ABUSE" : selectedIncident.riskScore >= 45 ? "🔍 LATERAL DEVIATION" : "🚪 RECONNAISSANCE"}
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Current Risk Score</span>
                    <span className={`text-xl font-extrabold font-mono leading-none ${selectedIncident.riskScore >= 75 ? 'text-red-600' : 'text-orange-500'}`}>
                      {selectedIncident.riskScore}/100
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Detection Confidence</span>
                    <span className="text-xl font-extrabold font-mono text-slate-800 leading-none">
                      {selectedIncident.confidenceScore || 0}%
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Assigned Subject</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      @{selectedIncident.affectedUser}
                    </span>
                  </div>
                </div>

                {/* Refined Session Metrics SOC Grid */}
                <div className="space-y-2">
                  <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Session Forensic Metrics</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Session Start</span>
                      <span className="block text-xs font-bold text-slate-800 mt-1 truncate">
                        {selectedIncident.sessionContext?.loginTime ? new Date(selectedIncident.sessionContext.loginTime).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Detection Time</span>
                      <span className="block text-xs font-bold text-slate-800 mt-1 truncate">
                        {selectedIncident.threatDetectionTime ? new Date(selectedIncident.threatDetectionTime).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Incident Creation</span>
                      <span className="block text-xs font-bold text-slate-800 mt-1 truncate">
                        {selectedIncident.timestamp ? new Date(selectedIncident.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Session Duration</span>
                      <span className="block text-xs font-bold text-slate-900 mt-1 font-mono">
                        {selectedIncident.sessionDuration || "0s"}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Security Events</span>
                      <span className="block text-lg font-extrabold text-slate-900 mt-1 font-mono">
                        {selectedIncident.correlatedEvents?.length || selectedIncident.eventIds?.length || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Patient Views</span>
                      <span className="block text-lg font-extrabold text-slate-900 mt-1 font-mono">
                        {selectedIncident.currentViews || selectedIncident.sessionContext?.uniquePatientsViewed || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">PDF Exports</span>
                      <span className="block text-lg font-extrabold text-slate-900 mt-1 font-mono">
                        {selectedIncident.currentExports || selectedIncident.sessionContext?.patientRecordPdfExportCount || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl text-left">
                      <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Indicators Triggered</span>
                      <span className="block text-lg font-extrabold text-slate-900 mt-1 font-mono">
                        {selectedIncident.triggeredIndicators?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex gap-4 border-b border-slate-200 mb-2 text-xs font-sans font-bold">
                <button
                  onClick={() => setDetailTab('diagnosis')}
                  className={`pb-2.5 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                    detailTab === 'diagnosis'
                      ? 'border-rose-600 text-slate-900 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📋 Executive Case Summary
                </button>
                <button
                  onClick={() => setDetailTab('correlation')}
                  className={`pb-2.5 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                    detailTab === 'correlation'
                      ? 'border-[#3b82f6] text-slate-900 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🛡️ Threat Indicators Checklist
                </button>
                <button
                  onClick={() => setDetailTab('session')}
                  className={`pb-2.5 px-1 font-bold tracking-tight transition border-b-2 uppercase cursor-pointer ${
                    detailTab === 'session'
                      ? 'border-[#8b5cf6] text-slate-900 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🔗 Attack Chain & Milestones
                </button>
              </div>

              {/* TAB 1: Executive Case Summary */}
              {detailTab === 'diagnosis' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left Columns: Investigation Overview & Status */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      {/* Investigation Overview Card */}
                      <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-3 bg-slate-50/30 text-left">
                        <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <Shield size={14} className="text-blue-500" />
                          Explainable Detection Summary
                        </h4>
                        <p className="text-slate-700 leading-relaxed font-sans font-medium">
                          {selectedIncident.explanation || selectedIncident.description || `Adaptive Threat Intelligence detected anomalous clinical records access patterns on account of user @${selectedIncident.affectedUser}.`}
                        </p>
                        
                        {/* Improved Baseline Deviation Section */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60">
                          <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2">EHR Behavioral Baseline Deviation Analysis</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-3 border border-slate-200/85 rounded-xl">
                            <div>
                              <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Patient views metrics</span>
                              <div className="flex justify-between items-baseline mt-1 font-medium text-slate-600">
                                <span>Expected daily Views:</span>
                                <strong className="text-slate-800">{selectedIncident.expectedViews || 0} views</strong>
                              </div>
                              <div className="flex justify-between items-baseline font-medium text-slate-600">
                                <span>Current session views:</span>
                                <strong className="text-slate-800">{selectedIncident.currentViews || 0} views</strong>
                              </div>
                              <div className="flex justify-between items-baseline font-medium text-slate-600 border-t border-dashed mt-1.5 pt-1">
                                <span>Views Deviation:</span>
                                {selectedIncident.expectedViews && selectedIncident.expectedViews > 0 ? (
                                  <span className="font-extrabold text-red-600 font-mono">
                                    {selectedIncident.viewsDeviation}% ({((selectedIncident.currentViews || 0) / selectedIncident.expectedViews).toFixed(1)}× Above Expected)
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">No historical baseline available.</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Clinical Export metrics</span>
                              <div className="flex justify-between items-baseline mt-1 font-medium text-slate-600">
                                <span>Expected daily exports:</span>
                                <strong className="text-slate-800">{selectedIncident.expectedExports || 0} PDF</strong>
                              </div>
                              <div className="flex justify-between items-baseline font-medium text-slate-600">
                                <span>Current session exports:</span>
                                <strong className="text-slate-800">{selectedIncident.currentExports || 0} PDF</strong>
                              </div>
                              <div className="flex justify-between items-baseline font-medium text-slate-600 border-t border-dashed mt-1.5 pt-1">
                                <span>Exports Deviation:</span>
                                {selectedIncident.expectedExports && selectedIncident.expectedExports > 0 ? (
                                  <span className="font-extrabold text-red-600 font-mono">
                                    {selectedIncident.exportsDeviation}% ({((selectedIncident.currentExports || 0) / selectedIncident.expectedExports).toFixed(1)}× Above Normal)
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">No historical baseline available.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Session Threat Status Panel */}
                      <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-3 bg-slate-50/30 text-left">
                        <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <Clock size={14} className="text-violet-500" />
                          Session Threat Status
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-medium text-slate-700 leading-relaxed">
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase">Session Threat State</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              selectedIncident.riskScore >= 75 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {selectedIncident.riskScore >= 75 ? "ACTIVE ROGUE ANOMALY DETECTED" : "UNDER SOC ANALYSIS"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase">Current Attack Phase</span>
                            <span className="text-slate-900 font-bold block uppercase tracking-tight text-xs mt-0.5 text-rose-600">
                              {selectedIncident.riskScore >= 75 ? "🔴 Bulk Data Exfiltration Trigger" : selectedIncident.riskScore >= 45 ? "🟠 Lateral Movement / Deviation" : "🔵 Active Reconnaissance"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase">Login Context IP</span>
                            <span className="font-mono text-slate-800 font-bold block">{selectedIncident.sourceIp || '10.20.12.87'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase">Analyst Decision Authority</span>
                            <span className="text-slate-800 font-bold block">Sarah Johnson (Senior Threat Analyst)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Visual Threat Evolution Area Chart */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-3 bg-white text-left shadow-xs">
                        <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-rose-500" /> Visual Threat Evolution</span>
                          <span className="text-[8.5px] font-mono text-slate-400 font-bold">REAL-TIME TELEMETRY</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans">Hover chart nodes to view event, risk, and reason metadata dynamically.</p>
                        <div className="h-40 w-full pt-2">
                          {(() => {
                            const rawEvolution = selectedIncident.riskEvolution || [];
                            const chartData = rawEvolution.map((item, idx) => ({
                              step: `S${idx + 1}`,
                              stepNum: idx + 1,
                              Risk: item.currentRisk,
                              Confidence: item.confidence,
                              event: item.event,
                              riskAdded: item.riskAdded,
                              riskBefore: item.riskBefore,
                              reason: item.reason
                            }));

                            if (chartData.length === 0) {
                              const timelineSteps = selectedIncident.sessionContext?.threatTimeline || selectedIncident.timeline || [];
                              timelineSteps.forEach((t, index) => {
                                const count = timelineSteps.length || 1;
                                chartData.push({
                                  step: `S${index + 1}`,
                                  stepNum: index + 1,
                                  Risk: Math.round(Math.min(selectedIncident.riskScore, ((index + 1) / count) * selectedIncident.riskScore)),
                                  Confidence: Math.round(Math.min(selectedIncident.confidenceScore || 70, ((index + 1) / count) * (selectedIncident.confidenceScore || 70))),
                                  event: "Clinical Event Logged",
                                  riskAdded: Math.round(selectedIncident.riskScore / count),
                                  riskBefore: Math.round((index / count) * selectedIncident.riskScore),
                                  reason: t.note
                                });
                              });
                            }

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="evolRisk" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="evolConf" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="step" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={8} domain={[0, 100]} tickLine={false} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Area type="monotone" dataKey="Risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#evolRisk)" name="Risk Score" />
                                  <Area type="monotone" dataKey="Confidence" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#evolConf)" name="Confidence %" />
                                </AreaChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>

                        {/* Interactive Clickable Risk Contributors list */}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase mb-1.5">Risk Contributors Steps (Click to Inspect)</span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {(selectedIncident.riskEvolution || []).map((step, idx) => (
                              <div 
                                key={idx}
                                onClick={() => setSelectedChartStep(idx === selectedChartStep ? null : idx)}
                                className={`p-1.5 rounded text-[10.5px] font-medium leading-tight text-left cursor-pointer transition border ${
                                  selectedChartStep === idx 
                                    ? 'bg-red-50 border-red-200 text-red-950 font-bold' 
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'
                                }`}
                              >
                                <div className="flex justify-between items-baseline text-[9px] font-mono font-bold uppercase">
                                  <span>{step.event}</span>
                                  <span className="text-red-600 font-extrabold">+{step.riskAdded} Risk</span>
                                </div>
                                {selectedChartStep === idx && (
                                  <p className="mt-1 font-sans text-[10px] text-slate-600 leading-normal border-t pt-1 border-red-100/60 font-normal">
                                    {step.reason} <span className="block font-bold text-[9px] text-slate-400 mt-0.5">Cumulative Risk: {step.currentRisk}/100 | Confidence: {step.confidence}%</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Evidence Severity Filtering Container */}
                  <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-4 bg-white text-left">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-2 border-slate-100">
                      <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5">
                        <Layers size={14} className="text-rose-600" />
                        Forensic Evidence & Artifacts
                      </h4>
                      {/* Filter Controls */}
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                        {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setEvidenceFilter(lvl)}
                            className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold transition cursor-pointer ${
                              evidenceFilter === lvl 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(() => {
                        const rawItems = selectedIncident.evidenceItems || [];
                        const filtered = rawItems.filter(item => {
                          if (evidenceFilter === 'All') return true;
                          return item.severity === evidenceFilter;
                        });

                        return filtered.length > 0 ? (
                          filtered.map((item) => (
                            <div key={item.id} className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="font-mono text-[9px] text-slate-400 font-extrabold">{item.id} • {item.category}</span>
                                <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                                  item.severity === 'Critical' 
                                    ? 'bg-red-100 text-red-800 border-red-200 animate-pulse' 
                                    : item.severity === 'High' 
                                      ? 'bg-orange-50 text-orange-700 border-orange-100'
                                      : item.severity === 'Medium'
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {item.severity}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-800 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                          ))
                        ) : (
                          <p className="col-span-2 text-slate-400 italic text-center py-2">No evidence logged matching the {evidenceFilter} severity filter.</p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Authentication & Failed Login Verification Card (Preserved Auth details) */}
                  <div className="p-4 border border-slate-200 bg-slate-50/40 rounded-2xl text-xs space-y-4 text-left">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Lock size={14} className="text-emerald-600" />
                      Authentication & Failed Login Verification Registry
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Failed Login Attempts</span>
                        <span className="block text-lg font-extrabold text-red-600 mt-1 font-mono">
                          {selectedIncident.sessionContext?.failedLoginCount || 0} Attempts
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Success After Failures</span>
                        <span className={`block text-xs font-bold mt-2 font-sans ${selectedIncident.sessionContext?.successfulLoginAfterFailures ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {selectedIncident.sessionContext?.successfulLoginAfterFailures ? "Yes (Preserved History)" : "None Recorded"}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Auth Risk Signature</span>
                        <span className={`block text-xs font-bold mt-2 font-sans ${selectedIncident.sessionContext?.failedLoginCount && selectedIncident.sessionContext.failedLoginCount >= 3 ? 'text-red-600' : 'text-slate-600'}`}>
                          {selectedIncident.sessionContext?.failedLoginCount && selectedIncident.sessionContext.failedLoginCount >= 3 ? "HIGH (Abuse Attempt)" : "LOW (Standard Log)"}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Credential Abuse Detected</span>
                        <span className={`block text-xs font-bold mt-2 font-sans ${(selectedIncident.sessionContext?.failedLoginCount || 0) >= 3 ? 'text-red-600' : 'text-slate-600'}`}>
                          {(selectedIncident.sessionContext?.failedLoginCount || 0) >= 3 ? "Brute-Force Pattern!" : "No Anomaly"}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="block text-[8.5px] font-mono text-slate-400 font-bold uppercase">Auth Confidence Rating</span>
                        <span className="block text-lg font-extrabold text-slate-800 mt-1 font-mono">
                          {selectedIncident.sessionContext?.failedLoginCount 
                            ? `${99 - (selectedIncident.sessionContext.failedLoginCount * 15)}%` 
                            : '99%'}
                        </span>
                      </div>
                    </div>

                    {/* Authentication history details list */}
                    <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-[10.5px] font-mono border border-slate-950 max-h-32 overflow-y-auto space-y-1">
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider block font-bold mb-1.5 border-b border-slate-800 pb-1">🔐 System Authentication Audit Trail (Preserved Continuous History)</span>
                      {selectedIncident.sessionContext?.authenticationHistory && selectedIncident.sessionContext.authenticationHistory.length > 0 ? (
                        selectedIncident.sessionContext.authenticationHistory.map((auth: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-baseline py-0.5 border-b border-slate-800/40">
                            <span className={`${auth.status === "FAILURE" ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                              [{auth.timestamp.slice(11,19)}] {auth.status} - Attempt {auth.attemptNumber}
                            </span>
                            <span className="text-slate-500 text-[9px]">IP: {auth.ipAddress} | Host: {auth.deviceName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic py-1 text-center">No preceding password login attempts captured in this unified investigation session.</div>
                      )}
                    </div>
                  </div>

                  {/* Actionable Recommendations Panel */}
                  <div className="p-4 border border-slate-200 rounded-2xl text-xs space-y-3 bg-white text-left shadow-xs">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-emerald-600" />
                      Active Analyst Mitigation Playbooks
                    </h4>
                    <p className="text-slate-500 font-normal leading-normal">
                      The ATIF adaptive engine suggests high-fidelity security playbooks based on triggered indicators. Execute playbooks below to trigger SOC active response.
                    </p>
                    <div className="space-y-2 pb-2">
                      {(selectedIncident.recommendations || []).map((rec, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2 text-slate-700 leading-relaxed font-medium">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* SOC Interactive Playbook Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => triggerSocRemediation("Quarantine", "Quarantine instruction sent to perimeter directory. User VPN account locked and active authentication cookie revoked.")}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 border border-slate-950 active:scale-95 transition"
                      >
                        <Ban size={13} /> Quarantine Account
                      </button>
                      <button 
                        onClick={() => triggerSocRemediation("MFA Challenge", "Mandatory hardware MFA token reset issued. Next clinical EHR login requires visual badge-in verification.")}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 border border-blue-500 active:scale-95 transition"
                      >
                        <Lock size={13} /> Force MFA Challenge
                      </button>
                      <button 
                        onClick={() => triggerSocRemediation("Isolate Host", "Host isolated at switch layer. Clinical records database connections dropped for remote client device.")}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 border border-red-500 active:scale-95 transition"
                      >
                        <Server size={13} /> Isolate Endpoint Host
                      </button>
                    </div>
                  </div>

                  {/* Custom Journal annotations */}
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

              {/* TAB 2: Threat Indicators Checklist */}
              {detailTab === 'correlation' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4 text-xs">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-blue-500" />
                      Grouped Threat Indicators Checklist
                    </h4>
                    <p className="text-slate-500 font-normal leading-normal">
                      The ATIF Engine maps security events against five core behavioral risk domains. Checked indicators indicate matching anomalies identified during active forensic analysis.
                    </p>

                    {(() => {
                      const matchedIndicators = selectedIncident.triggeredIndicators || selectedIncident.sessionContext?.triggeredIndicators || [];
                      
                      const domains = [
                        {
                          name: "Authentication Indicators",
                          icon: "🔐",
                          items: [
                            "Failed Logins Attempt Limit (Brute Force Anomaly)",
                            "Known Host/Host Key Anomaly (Unapproved Device Signature)",
                            "Atypical Off-Hours Remote Access Profile"
                          ]
                        },
                        {
                          name: "Behavioral Indicators",
                          icon: "📈",
                          items: [
                            "Extreme Daily Clinical Views Baseline Outlier",
                            "Cross-Ward Clinical Dossier Crawling",
                            "Suspicious Hospital Shift Baseline Deviation"
                          ]
                        },
                        {
                          name: "Patient Access Indicators",
                          icon: "📋",
                          items: [
                            "Atypical Highly Sensitive VIP Patient Profile Views",
                            "Multiple Concurrent Medical Records Inspected"
                          ]
                        },
                        {
                          name: "Data Exfiltration Indicators",
                          icon: "💾",
                          items: [
                            "Bulk PDF Medical Records Generation",
                            "Repeated Clinical Report Downloads"
                          ]
                        },
                        {
                          name: "Authorization Indicators",
                          icon: "🔑",
                          items: [
                            "Access Restricted System Modules Anomaly"
                          ]
                        }
                      ];

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {domains.map((dom, dIdx) => (
                            <div key={dIdx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                              <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <span>{dom.icon}</span> {dom.name}
                              </h5>
                              <div className="space-y-2">
                                {dom.items.map((it, itIdx) => {
                                  const matches = matchedIndicators.some(mi => {
                                    const miLow = mi.toLowerCase();
                                    const itLow = it.toLowerCase();
                                    return miLow.includes("login") && itLow.includes("failed") ||
                                           miLow.includes("device") && itLow.includes("host") ||
                                           miLow.includes("hours") && itLow.includes("hours") ||
                                           miLow.includes("baseline") && itLow.includes("baseline") ||
                                           miLow.includes("ward") && itLow.includes("ward") ||
                                           miLow.includes("sensitive") && itLow.includes("sensitive") ||
                                           miLow.includes("export") && itLow.includes("export") ||
                                           miLow.includes("repeated") && itLow.includes("repeated") ||
                                           miLow.includes("restricted") && itLow.includes("restricted") ||
                                           miLow.includes("harvest") && itLow.includes("concurrent");
                                  });

                                  return (
                                    <div key={itIdx} className="flex items-start gap-2.5">
                                      <input 
                                        type="checkbox" 
                                        readOnly 
                                        checked={matches}
                                        className={`w-4 h-4 rounded mt-0.5 border transition-all ${
                                          matches ? 'text-red-600 bg-red-100 border-red-300' : 'text-slate-300 border-slate-200'
                                        }`} 
                                      />
                                      <span className={`text-[11.5px] font-medium leading-relaxed ${matches ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}`}>
                                        {it} {matches && <span className="text-[9px] bg-red-50 text-red-700 font-bold font-mono px-1.5 py-0.2 rounded ml-1 border border-red-100 uppercase tracking-widest">Active</span>}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 3: Attack Chain & Milestones */}
              {detailTab === 'session' && (
                <div className="space-y-5 animate-fade-in text-left">
                  
                  {/* Visual Attack Chain Representation */}
                  <div className="p-4 border border-slate-200 bg-white rounded-2xl text-xs space-y-4 text-left">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <Network size={14} className="text-[#8b5cf6]" />
                      Visual Kill Chain & Attack Relationships (Unified Session ID: {selectedIncident.sessionId})
                    </h4>
                    <p className="text-slate-500 font-normal leading-normal">
                      Visual representation of anomalous session escalation timeline stages. Click on nodes to review associated session milestones.
                    </p>

                    {(() => {
                      const fc = selectedIncident.sessionContext?.failedLoginCount || 0;
                      const pv = selectedIncident.sessionContext?.uniquePatientsViewed || 0;
                      const pdf = selectedIncident.sessionContext?.patientRecordPdfExportCount || 0;
                      const res = selectedIncident.sessionContext?.highlySensitiveRecordsViewed || 0;

                      const nodes = [
                        {
                          title: "1. Pre-Authentication Checks",
                          status: fc > 0 ? "WARNING" : "NORMAL",
                          desc: fc > 0 ? `${fc} Failed login attempts` : "Device/IP signature verified",
                          color: fc > 0 ? "border-amber-400 text-amber-700 bg-amber-50" : "border-emerald-200 text-emerald-700 bg-emerald-50"
                        },
                        {
                          title: "2. Successful Session Establishment",
                          status: fc > 0 && selectedIncident.sessionContext?.successfulLoginAfterFailures ? "WARNING" : "NORMAL",
                          desc: fc > 0 && selectedIncident.sessionContext?.successfulLoginAfterFailures ? "Authentication succeeded after locked attempts" : "Standard single-attempt session",
                          color: fc > 0 && selectedIncident.sessionContext?.successfulLoginAfterFailures ? "border-amber-400 text-amber-700 bg-amber-50" : "border-emerald-200 text-emerald-700 bg-emerald-50"
                        },
                        {
                          title: "3. Clinical Patient EHR Queries",
                          status: pv >= 5 ? "BREACH" : pv > 0 ? "WARNING" : "NORMAL",
                          desc: pv > 0 ? `Inspected ${pv} Patient records spanning hospital wards` : "No medical queries logged yet",
                          color: pv >= 5 ? "border-red-400 text-red-700 bg-rose-50" : pv > 0 ? "border-amber-400 text-amber-700 bg-amber-50" : "border-slate-200 text-slate-400 bg-slate-50"
                        },
                        {
                          title: "4. Sensitive Vault Intrusion",
                          status: res > 0 ? "BREACH" : "NORMAL",
                          desc: res > 0 ? `Unauthorized VIP partition accessed (${res} files)` : "Zero sensitive records viewed",
                          color: res > 0 ? "border-red-400 text-red-700 bg-rose-50" : "border-slate-200 text-slate-400 bg-slate-50"
                        },
                        {
                          title: "5. Patient Record Compilation",
                          status: pdf >= 3 ? "CRITICAL" : pdf > 0 ? "BREACH" : "NORMAL",
                          desc: pdf > 0 ? `Compiled and generated ${pdf} Patient clinical PDF reports` : "Zero PDF documents compiled",
                          color: pdf >= 3 ? "border-red-500 text-red-800 bg-red-100 animate-pulse" : pdf > 0 ? "border-red-400 text-red-700 bg-rose-50" : "border-slate-200 text-slate-400 bg-slate-50"
                        },
                        {
                          title: "6. SOC Incident Playbook Launch",
                          status: "ACTIVE",
                          desc: `Incident Case ${selectedIncident.id} generated on Threat Feed`,
                          color: "border-blue-500 text-blue-700 bg-blue-50"
                        }
                      ];

                      return (
                        <div className="flex flex-col md:flex-row justify-between items-stretch gap-3 pt-2 text-left">
                          {nodes.map((node, nIdx) => (
                            <div key={nIdx} className="flex-1 flex flex-col justify-between items-center text-center p-3 rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
                              <div className={`w-full p-2 rounded-xl border text-[10px] font-extrabold font-mono uppercase text-center mb-2.5 ${node.color}`}>
                                {node.status}
                              </div>
                              <div className="space-y-1">
                                <span className="block font-extrabold text-slate-900 text-[10px] uppercase tracking-tight">{node.title}</span>
                                <p className="text-[10px] text-slate-500 leading-normal font-medium">{node.desc}</p>
                              </div>
                              {nIdx < nodes.length - 1 && (
                                <div className="hidden md:block text-slate-300 font-bold text-xl mt-3">&rarr;</div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Refined Chronological Security Milestones Timeline (Grouping verbose events) */}
                  <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl text-xs space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5">
                        <Terminal size={14} className="text-violet-600" />
                        Forensic Milestones & Grouped Audit Trail
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400 font-extrabold uppercase">Preserving Complete Raw Logs Below</span>
                    </div>
                    <p className="text-slate-500 font-normal leading-normal">
                      Verbose database audit logs have been grouped into high-level milestones. Click any milestone card to expand and review the individual raw events beneath it.
                    </p>

                    <div className="space-y-3.5">
                      {(() => {
                        const rawEvents = selectedIncident.correlatedEvents || [];
                        const milestones = groupEventsIntoMilestones(rawEvents);
                        
                        return milestones.length > 0 ? (
                          milestones.map((ms, idx) => {
                            const isExpanded = !!expandedMilestones[idx];
                            return (
                              <div key={idx} className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300">
                                {/* Milestone Card Header */}
                                <div 
                                  onClick={() => toggleMilestone(idx)}
                                  className="p-3.5 flex justify-between items-center cursor-pointer select-none bg-slate-50/30 hover:bg-slate-50/70"
                                >
                                  <div className="space-y-1 max-w-xl">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${
                                        ms.category === 'Authentication' 
                                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                                          : ms.category === 'Exfiltration'
                                            ? 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                                            : ms.category === 'Data Access'
                                              ? 'bg-violet-50 text-violet-700 border-violet-100'
                                              : 'bg-blue-50 text-blue-700 border-blue-100'
                                      }`}>
                                        {ms.category}
                                      </span>
                                      <h5 className="font-extrabold text-xs text-slate-900 tracking-tight leading-tight">{ms.title}</h5>
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{ms.description}</p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 ml-4 font-mono">
                                    <div className="text-right space-y-0.5">
                                      <span className="block text-[10px] font-bold text-slate-500 uppercase">{ms.count} Raw Events</span>
                                      <span className="block text-[9px] font-extrabold text-red-600">+{ms.riskAdded} Risk Added</span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                  </div>
                                </div>

                                {/* Expanded Milestone Raw Events List */}
                                {isExpanded && (
                                  <div className="border-t border-slate-150 p-3 bg-slate-50/40 text-[11px] space-y-2">
                                    <span className="block text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1.5">Raw Chronological Forensic Logs</span>
                                    <div className="space-y-1.5 border-l border-slate-200 ml-2 pl-3">
                                      {ms.rawEvents.map((rawEv) => (
                                        <div key={rawEv.id} className="relative py-1 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 text-slate-700 font-medium border-b border-slate-100 last:border-b-0">
                                          {/* Mini timeline indicator */}
                                          <span className="absolute -left-[16.5px] top-2.5 w-1.5 h-1.5 rounded-full bg-slate-400 border border-white" />
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <strong className="text-slate-950 font-bold">{rawEv.activityType}</strong>
                                              <span className="font-mono text-[9px] text-slate-400 font-bold">({rawEv.id})</span>
                                            </div>
                                            <p className="text-slate-600 text-[10.5px] leading-relaxed">{rawEv.description}</p>
                                          </div>
                                          <div className="text-right font-mono text-[9px] text-slate-400 font-bold self-start sm:self-auto shrink-0 space-y-0.5">
                                            <div>{new Date(rawEv.timestamp).toLocaleTimeString()}</div>
                                            <div>IP: {rawEv.ipAddress} | Risk: +{rawEv.riskContribution || 4}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-slate-500 italic text-center py-2">No preceding actions registered in the chronological milestone registry.</p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Contextual Investigation Notes Log */}
                  <div className="p-4 border border-slate-200 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-3 text-left font-mono">
                    <h4 className="font-extrabold text-white text-xs tracking-tight uppercase border-b border-slate-800 pb-2 flex items-center gap-1.5">
                      <Terminal size={14} className="text-emerald-500" />
                      Contextual Investigation Notes Log
                    </h4>
                    <div className="space-y-2 text-[10.5px]">
                      <div className="text-slate-400">[06:50:01Z] [SYSTEM] SOC Case File initialization created successfully for subject user @{selectedIncident.affectedUser}.</div>
                      <div className="text-slate-400">[06:50:05Z] [SYSTEM] Behavioral baseline profiles queried from internal ATIF baseline repository database.</div>
                      <div className="text-slate-400">[06:50:08Z] [ANALYST_sarah_j] Investigation launched. Verifying authorization levels and hospital ward boundaries for @{selectedIncident.affectedUser}.</div>
                      {selectedIncident.status === "Resolved" && (
                        <div className="text-emerald-400 font-bold">[06:50:12Z] [ANALYST_sarah_j] Case mitigation established. Session revoked, RBAC authorization boundaries updated and restabilized.</div>
                      )}
                      <div className="text-slate-500 italic text-[9.5px] pt-1 border-t border-slate-800">Use standard stage controls above to push additional milestone logs to this central investigation registry.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 italic text-xs leading-normal bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center space-y-3 shadow-xs">
              <ShieldX size={44} className="text-slate-300 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-600 uppercase text-[10px] tracking-wider mb-1">Investigation Session Offline</p>
                <p className="font-medium text-slate-500 max-w-sm">Select an active incident case files dossier from the Incident Registry sidebar directory to launch the investigation workspace.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
