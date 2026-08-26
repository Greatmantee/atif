import React, { useState } from 'react';
import { 
  Activity, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, Send, 
  UserCheck, Shield, ChevronRight, X, Clock, AlertCircle, PlayCircle, Plus, 
  HelpCircle, UserPlus, Flame, CheckCircle, Terminal, HardDrive, RefreshCw,
  Search, Filter, Calendar, ChevronDown, ChevronLeft, Inbox, Eye, MoreVertical, 
  Download, LayoutGrid, Settings, User, Briefcase
} from 'lucide-react';
import { ThreatIncident, SecurityRiskLevel } from '../types';

interface ThreatFeedViewProps {
  incidents: ThreatIncident[];
  onRefresh: () => void;
  onOpenInvestigation: (incident: ThreatIncident) => void;
}

export default function ThreatFeedView({ incidents, onRefresh, onOpenInvestigation }: ThreatFeedViewProps) {
  const [selectedIncident, setSelectedIncident] = useState<ThreatIncident | null>(null);
  
  // New manual creation dialog toggle and states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newThreatType, setNewThreatType] = useState('ABNORMAL_USER_BEHAVIOR');
  const [newRiskScore, setNewRiskScore] = useState(55);
  const [newAffectedUser, setNewAffectedUser] = useState('');
  const [newDepartment, setNewDepartment] = useState('EHR clinical workflow');
  const [newSourceIp, setNewSourceIp] = useState('10.20.12.87');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment dialog / input state
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Resolution dialog / input state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  // Auto Refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  // Handle Manual Threat Creation
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          threatType: newThreatType,
          riskScore: newRiskScore,
          affectedUser: newAffectedUser,
          department: newDepartment,
          sourceIp: newSourceIp,
          description: newDescription
        })
      });
      if (response.ok) {
        setShowCreateModal(false);
        // reset form
        setNewTitle('');
        setNewAffectedUser('');
        setNewDescription('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Analyst Assignment
  const handleAssign = async (id: string, analyst: string) => {
    try {
      const response = await fetch(`/api/security/incidents/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analystName: analyst })
      });
      if (response.ok) {
        setShowAssignDropdown(false);
        setSelectedIncident(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Case Resolution
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const response = await fetch(`/api/security/incidents/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Resolved',
          note: resolutionNote || "Threat anomaly mitigated and baseline controls restabilized."
        })
      });
      if (response.ok) {
        setShowResolveModal(false);
        setResolutionNote('');
        setSelectedIncident(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Map database incidents to triage item formats (sorted descending by timestamp)
  const sortedIncidents = [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const dbMapped = sortedIncidents.map(inc => {
    let location = 'Lagos, NG';
    if (inc.sourceIp === '10.20.12.87') location = 'Lagos, NG';
    
    let formattedTime = '10:24:15 AM';
    try {
      formattedTime = new Date(inc.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {}

    let displaySeverity = 'Low';
    if (inc.riskLevel === SecurityRiskLevel.CRITICAL) displaySeverity = 'Critical';
    else if (inc.riskLevel === SecurityRiskLevel.HIGH) displaySeverity = 'High';
    else if (inc.riskLevel === SecurityRiskLevel.MEDIUM) displaySeverity = 'Medium';

    return {
      id: inc.id,
      time: formattedTime,
      threatType: inc.title,
      severity: displaySeverity,
      user: inc.affectedUser,
      department: inc.department || 'EHR consultation',
      ipAddress: inc.sourceIp || '10.20.12.87',
      location: location,
      eventDescription: inc.title,
      eventDetails: inc.description || 'Threat anomaly detected by ATIF core',
      riskScore: inc.riskScore,
      status: inc.status,
      rawIncident: inc
    };
  });

  const allThreats = dbMapped;

  const filteredThreats = allThreats.filter(threat => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      threat.threatType.toLowerCase().includes(q) ||
      threat.user.toLowerCase().includes(q) ||
      threat.department.toLowerCase().includes(q) ||
      threat.ipAddress.toLowerCase().includes(q) ||
      threat.location.toLowerCase().includes(q) ||
      threat.eventDescription.toLowerCase().includes(q) ||
      threat.eventDetails.toLowerCase().includes(q) ||
      threat.status.toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalItems = filteredThreats.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedThreats = filteredThreats.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Dynamic threat export to CSV
  const handleExportThreats = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Timestamp,Incident ID,Threat Type,User,Department,Source IP,Risk Score,Status,Description"].join(",") + "\n"
      + incidents.map(i => {
          return `"${i.timestamp || ''}","${i.id || ''}","${i.title || ''}","${i.affectedUser || ''}","${(i.department || '').replace(/"/g, '""')}","${i.sourceIp || ''}","${i.riskScore || ''}","${i.status || ''}","${(i.description || '').replace(/"/g, '""')}"`;
        }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "atif_threat_incidents_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalThreatsCount = incidents.length;
  const criticalThreatsCount = incidents.filter(i => i.riskLevel === SecurityRiskLevel.CRITICAL || i.riskScore >= 75).length;
  const highThreatsCount = incidents.filter(i => i.riskLevel === SecurityRiskLevel.HIGH || (i.riskScore >= 50 && i.riskScore < 75)).length;
  const mediumThreatsCount = incidents.filter(i => i.riskLevel === SecurityRiskLevel.MEDIUM || (i.riskScore >= 25 && i.riskScore < 50)).length;
  const lowThreatsCount = incidents.filter(i => i.riskLevel === SecurityRiskLevel.LOW || (i.riskScore > 0 && i.riskScore < 25)).length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Mitigated').length;

  const kpis = [
    {
      title: 'Total Threats',
      value: totalThreatsCount,
      trend: totalThreatsCount > 0 ? 'Live signature detections' : 'Perimeter secure',
      trendUp: totalThreatsCount > 0,
      trendColor: totalThreatsCount > 0 ? 'text-amber-500' : 'text-emerald-500',
      icon: Shield,
      iconBg: 'bg-blue-50/70 border-blue-100 text-blue-500',
    },
    {
      title: 'Critical',
      value: criticalThreatsCount,
      trend: criticalThreatsCount > 0 ? 'Immediate action required' : '0 active cases',
      trendUp: criticalThreatsCount > 0,
      trendColor: 'text-red-500',
      icon: AlertTriangle,
      iconBg: 'bg-red-50/70 border-red-100 text-red-500',
    },
    {
      title: 'High',
      value: highThreatsCount,
      trend: highThreatsCount > 0 ? 'Investigating anomalies' : '0 outliers',
      trendUp: highThreatsCount > 0,
      trendColor: 'text-orange-500',
      icon: Flame,
      iconBg: 'bg-orange-50/70 border-orange-100 text-orange-500',
    },
    {
      title: 'Medium',
      value: mediumThreatsCount,
      trend: 'Mitigation pending',
      trendUp: mediumThreatsCount > 0,
      trendColor: 'text-sky-500',
      icon: Activity,
      iconBg: 'bg-sky-50/70 border-sky-100 text-sky-500',
    },
    {
      title: 'Low',
      value: lowThreatsCount,
      trend: 'Standard baseline',
      trendUp: false,
      trendColor: 'text-emerald-500',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50/70 border-emerald-100 text-emerald-500',
    },
    {
      title: 'Open Incidents',
      value: openIncidentsCount,
      link: 'View all incidents',
      icon: Inbox,
      iconBg: 'bg-purple-50/70 border-purple-100 text-purple-500',
    }
  ];

  const getSeverityBadgeClass = (severity: string) => {
    switch(severity) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-100';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'New':
        return 'text-red-600 border border-red-200 bg-red-50/50';
      case 'Investigating':
        return 'text-amber-600 border border-amber-200 bg-amber-50/50';
      case 'Monitoring':
        return 'text-blue-600 border border-blue-200 bg-blue-50/50';
      case 'Closed':
      case 'Resolved':
        return 'text-emerald-600 border border-emerald-200 bg-emerald-50/50';
      default:
        return 'text-slate-600 border border-slate-200 bg-slate-50/50';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6" id="threat-feed-module-view">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Threat Feed</h1>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium">
            <span>Dashboard</span>
            <span className="text-slate-300 mx-1">&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Threat Feed</span>
          </div>
        </div>

        {/* Header Options */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search threats, users, IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 shadow-xs"
            />
          </div>

          {/* Filters */}
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
            <Filter size={14} className="text-slate-400" />
            <span>Filters</span>
          </button>

          {/* Last 24 Hours */}
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
            <Calendar size={14} className="text-slate-400" />
            <span>Last 24 Hours</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>

          {/* Custom threat report trigger */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Report Custom Threat
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 text-left">
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <IconComponent size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-500 font-medium truncate">{kpi.title}</span>
                <span className="block text-xl font-extrabold text-slate-900 leading-tight mt-0.5">{kpi.value}</span>
                {kpi.trend ? (
                  <span className={`text-[10px] ${kpi.trendColor} font-medium block mt-0.5 whitespace-nowrap`}>
                    {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-600 font-semibold hover:underline block mt-0.5 cursor-pointer whitespace-nowrap">
                    {kpi.link}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Threat Cards Triage Grid */}
      <div className="space-y-4">
        <div className="px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm tracking-tight">SIEM Real-time Threat Triage Queue</h2>
            <span className="px-1.5 py-0.5 bg-red-500 text-white font-extrabold font-mono text-[9px] rounded uppercase animate-pulse">LIVE</span>
          </div>

          <div className="flex items-center gap-3.5 ml-auto sm:ml-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-semibold">Auto Refresh</span>
              <button 
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1 text-slate-400">
              <button 
                onClick={handleExportThreats}
                className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition cursor-pointer" 
                title="Export File"
              >
                <Download size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Threat Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedThreats.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 italic text-xs">
              No threats matched current search parameters. System perimeter fully validated.
            </div>
          ) : (
            paginatedThreats.map((threat) => {
              const inc = threat.rawIncident;
              if (!inc) return null;
              
              return (
                <div 
                  key={inc.id} 
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md text-left ${
                    inc.riskLevel === SecurityRiskLevel.CRITICAL 
                      ? 'border-red-200 hover:border-red-400' 
                      : inc.riskLevel === SecurityRiskLevel.HIGH 
                        ? 'border-orange-200 hover:border-orange-400' 
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Severity and Risk / Confidence scores */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{inc.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getSeverityBadgeClass(threat.severity)}`}>
                        {threat.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[8px] font-mono text-slate-400 uppercase font-bold">Risk Score</span>
                        <span className={`text-sm font-extrabold font-mono ${getRiskScoreColor(inc.riskScore)}`}>
                          {inc.riskScore}/100
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div className="text-right">
                        <span className="block text-[8px] font-mono text-slate-400 uppercase font-bold">Confidence</span>
                        <span className="text-sm font-extrabold font-mono text-slate-800">
                          {inc.confidenceScore || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Title, Description, Metadata */}
                  <div className="p-5 flex-1 space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                        {inc.title}
                      </h3>
                      {/* Short AI generated summary (1-2 lines) */}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                        {inc.explanation || inc.description || "Adaptive threat detection: anomalous medical records queries spanning multiple secure hospital partitions."}
                      </p>
                    </div>

                    {/* Meta bento grid */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/30 border border-slate-100 rounded-xl p-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">Assigned Subject</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          @{inc.affectedUser}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">Department Partition</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {inc.department || "Clinical EHR Access"}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">First Detected</span>
                        <span className="font-mono text-slate-500 text-[10px] block">
                          {formatDate(inc.timestamp)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">Last Updated</span>
                        <span className="font-mono text-slate-500 text-[10px] block">
                          {inc.timeline && inc.timeline.length > 0 
                            ? formatDate(inc.timeline[inc.timeline.length - 1].timestamp) 
                            : formatDate(inc.timestamp)}
                        </span>
                      </div>
                      <div className="space-y-0.5 col-span-2 border-t border-slate-100 pt-2 mt-1 flex justify-between items-center text-[10.5px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">Threat Stage</span>
                          <span className="font-bold text-rose-600 uppercase text-[9px] font-mono tracking-wider block mt-0.5">
                            {inc.riskScore >= 75 ? "⚠️ LATERAL BREACH / HARVESTING" : inc.riskScore >= 50 ? "🔍 BASLINE DEVIATION" : "🚪 PRE-AUTH ACCESS"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block font-mono">Incident Status</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 uppercase ${getStatusBadgeClass(inc.status)}`}>
                            {inc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Analyst Assigned Display */}
                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
                      <span className="font-medium">Assigned Analyst:</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {inc.analyst || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-wrap gap-2 items-center justify-between">
                    {/* Primary Button */}
                    <button
                      onClick={() => onOpenInvestigation(inc)}
                      className="flex-1 min-w-[120px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye size={12} />
                      Open Investigation
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Mark Under Investigation */}
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`/api/security/incidents/${inc.id}/status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Investigating', note: "Case marked under active SOC analysis." })
                            });
                            onRefresh();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        disabled={inc.status === 'Investigating' || inc.status === 'Resolved'}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs"
                        title="Mark Under Investigation"
                      >
                        Investigate
                      </button>

                      {/* Assign Analyst */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setSelectedIncident(inc);
                            setShowAssignDropdown(!showAssignDropdown);
                          }}
                          disabled={inc.status === 'Resolved'}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs"
                          title="Assign Analyst"
                        >
                          <UserPlus size={13} />
                        </button>
                        {showAssignDropdown && selectedIncident?.id === inc.id && (
                          <div className="absolute right-0 bottom-full mb-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1 text-xs text-left divide-y divide-slate-100">
                            {['Sarah Johnson', 'James Wilson', 'Elena Rostova', 'Sam Wilson'].map((analyst) => (
                              <button
                                key={analyst}
                                type="button"
                                onClick={() => handleAssign(inc.id, analyst)}
                                className="w-full text-left px-2 py-1.5 hover:bg-slate-50 font-medium text-slate-700 block transition cursor-pointer border-none bg-transparent"
                              >
                                {analyst}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Resolve */}
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setShowResolveModal(true);
                        }}
                        disabled={inc.status === 'Resolved'}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-sans">
          <div>
            {totalItems > 0 ? (
              <>Showing <strong className="text-slate-800 font-bold">{(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)}</strong> of <strong className="text-slate-800 font-bold">{totalItems}</strong> threats</>
            ) : (
              "No threats recorded in feed database."
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-slate-400 font-mono select-none px-0.5">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                          currentPage === p
                            ? "bg-slate-900 text-white font-bold"
                            : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition cursor-pointer disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none text-xs font-semibold cursor-pointer shadow-xs"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manual Threat Creator Dialog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden text-left animate-slide-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Shield className="text-rose-600" size={15} />
                Report Anomaly/Threat Alert
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Threat Indicator Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Bulk Medical Record Harvesting Pattern"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Threat Category</label>
                  <select 
                    value={newThreatType} 
                    onChange={(e) => setNewThreatType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
                    <option value="CREDENTIAL_ABUSE">Credential Abuse</option>
                    <option value="INSIDER_THREAT">Insider Threat</option>
                    <option value="SENSITIVE_RECORD_ACCESS">Sensitive Record Access</option>
                    <option value="ABNORMAL_USER_BEHAVIOR">Abnormal User Behavior</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Initial Risk (Score)</label>
                  <input 
                    type="number"
                    min={1}
                    max={100}
                    value={newRiskScore}
                    onChange={(e) => setNewRiskScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Offending Username</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. nurse_florence"
                  value={newAffectedUser}
                  onChange={(e) => setNewAffectedUser(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Department context</label>
                  <input 
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Source IP Asset</label>
                  <input 
                    type="text"
                    value={newSourceIp}
                    onChange={(e) => setNewSourceIp(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">Forensic Description / Audit Notes</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Provide supporting forensic log patterns, anomalous baseline parameters and department impact details..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Submit Incident Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Resolution Confirmation modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden text-left animate-slide-up">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="text-emerald-600" size={15} />
                Resolve Incident Case
              </h3>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleResolve} className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 leading-normal">
                You are about to transition Case <strong>{selectedIncident?.id}</strong> to <strong>Resolved</strong> status. Provide a summary of remediation controls implemented.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider block">mitigation details / Resolution log</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="e.g. Credentials successfully reset, user completed formal RBAC verification, perimeter baselines recalibrated."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Confirm and Mitigate Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
