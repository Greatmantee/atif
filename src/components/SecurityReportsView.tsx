/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Share2, Archive, Trash2, Eye, Plus, Calendar, Filter, 
  Search, RefreshCw, BarChart3, ChevronRight, CheckCircle, AlertTriangle, 
  Clock, Shield, User, FileSpreadsheet, Layers, Send, Printer, Info, Check, Zap, 
  Building2, TrendingUp, Cpu, Lock, AlertOctagon, UserCheck, CheckCircle2, ShieldAlert,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { 
  SecurityPosture, ThreatIncident, SecurityEvent, UserBehaviorProfile, 
  ThreatFeedItem, SecurityRiskLevel, HospitalRole 
} from '../types';

interface SecurityReportsViewProps {
  posture: SecurityPosture | null;
  incidents: ThreatIncident[];
  events: SecurityEvent[];
  profiles: UserBehaviorProfile[];
  feed: ThreatFeedItem[];
  onRefresh: () => void;
  triggerNotification: (msg: string) => void;
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

export interface ATIFReport {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  generationDate: string;
  department: string;
  status: 'Ready' | 'Archived' | 'Draft';
  format: 'PDF' | 'CSV' | 'Excel' | 'JSON' | 'Print';
  fileSize: string;
  pages: number;
  incidentId?: string;
  
  // Specific report details
  metadata: {
    title: string;
    subtitle: string;
    engineVersion: string;
    integrityHash: string;
    verificationCode: string;
    archiveId: string;
    orgName: string;
  };
  executiveSummary: string;
  threatSummary?: string;
  investigationSummary?: string;
  behaviorAnalysis?: string;
  riskAnalysis?: string;
  recommendations: string[];
  
  // Details for INCIDENT_INVESTIGATION
  incidentNumber?: string;
  threatClassification?: string;
  threatSeverity?: string;
  riskScore?: number;
  confidenceScore?: number;
  affectedUser?: string;
  sessionID?: string;
  detectionTime?: string;
  resolutionTime?: string;
  threatIndicators?: string[];
  behavioralIndicators?: string[];
  evidenceSummary?: string;
  timeline?: { timestamp: string; action: string; note: string; user: string }[];
  analystNotes?: string;
  finalRecommendation?: string;

  // Details for EXECUTIVE_SUMMARY
  overallSecurityScore?: number;
  threatTrends?: string;
  topThreatCategories?: { category: string; count: number }[];
  deptRiskComparison?: { dept: string; score: number }[];
  mostTargetedDepts?: string[];
  highRiskUsers?: string[];
  threatGrowthRate?: string;
  detectionAccuracy?: string;
  averageResponseTime?: string;

  // Details for BEHAVIOR_ANALYSIS
  behaviorBaseline?: string;
  actualBehavior?: string;
  deviationPercentage?: number;
  patientAccessStats?: string;
  pdfExportStats?: string;
  authSummary?: string;
  behaviorDrift?: string;
  behavioralRiskRating?: string;
  adaptiveClassification?: string;

  // Details for COMPLIANCE_AUDIT
  hipaaSecurityCompliance?: string;
  patientDataAccessSummary?: string;
  unauthorizedAccessAttempts?: number;
  patientRecordExportSummary?: string;
  auditTrailCompleteness?: string;
  incidentDocumentation?: string;
  accessAccountability?: string;
  systemIntegrityVerification?: string;
  complianceRating?: string;
}

export default function SecurityReportsView({
  posture,
  incidents,
  events,
  profiles,
  feed,
  onRefresh,
  triggerNotification,
  currentUser = null,
  patients = []
}: SecurityReportsViewProps) {

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Generator selections
  const [selectedType, setSelectedType] = useState('Incident Investigation Report');
  const [genDateRange, setGenDateRange] = useState('Last 7 Days');
  const [genDept, setGenDept] = useState('All Departments');
  const [genCategory, setGenCategory] = useState('All Categories');
  const [genRiskLevel, setGenRiskLevel] = useState('All Levels');
  const [genStatus, setGenStatus] = useState('All Statuses');
  const [genAnalyst, setGenAnalyst] = useState('All Analysts');
  const [genUserRole, setGenUserRole] = useState('All Roles');
  const [genConfidence, setGenConfidence] = useState('All Scores');
  const [genFormat, setGenFormat] = useState<'PDF' | 'CSV' | 'Excel' | 'JSON' | 'Print'>('PDF');

  // Auto report scheduler states
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [schedulerFrequency, setSchedulerFrequency] = useState('Weekly');
  const [schedulerReports, setSchedulerReports] = useState({
    daily: true,
    weekly: true,
    monthly: false,
    quarterly: false,
    annual: false
  });

  // Active Selected Report for Preview
  const [selectedReportId, setSelectedReportId] = useState<string | null>('STJ-REP-2026-001');

  // Interactive share state modal simulation
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareReportObj, setShareReportObj] = useState<ATIFReport | null>(null);

  // Initialize report library with high-fidelity records linked to real or standard framework parameters
  const [reports, setReports] = useState<ATIFReport[]>([
    {
      id: 'STJ-REP-2026-001',
      name: 'Critical Insider Threat Investigation Summary',
      type: 'Incident Investigation Report',
      generatedBy: 'system_engine',
      generationDate: '2026-06-29 14:32',
      department: 'HIM Office',
      status: 'Ready',
      format: 'PDF',
      fileSize: '342 KB',
      pages: 4,
      incidentNumber: 'STJ-INC-2026-001',
      threatClassification: 'Insider Threat - Unauthorized Access',
      threatSeverity: 'Critical',
      riskScore: 92,
      confidenceScore: 95,
      affectedUser: 'nurse_rached',
      sessionID: 'SESS-8442-9912',
      detectionTime: '2026-06-29 09:12 AM',
      resolutionTime: 'Under Investigation',
      threatIndicators: ['Multiple Cross-Ward Views', 'Sustained Off-Hours Action', 'High Patient Record PDF Export Volume'],
      behavioralIndicators: ['Standard Deviation +420%', 'Access Outside Shift Schedule', 'Unauthorized VIP Record Download'],
      evidenceSummary: 'Analyzed session logs for nurse_rached. Patient views rose to 31 records within a 2-hour window, bypassing active directory boundaries. PDF exports detected containing patient EHR histories.',
      analystNotes: 'Initial indicators logged via SIEM. Forensic correlation validates repeated views across Ward A and Ward C without corresponding patient ward assignation.',
      finalRecommendation: 'Revoke standard EHR lookup credentials immediately. Audit the role profile permissions for HIM and nursing staff in the specific ward node.',
      metadata: {
        title: 'ATIF Incident Forensics Report',
        subtitle: 'Adaptive Threat Intelligence Framework Core Diagnostics',
        engineVersion: 'ATIF-v2.8.4',
        integrityHash: 'sha256:8f4bc891ad9f010e01ab887c',
        verificationCode: 'STJ-VERIFY-9982',
        archiveId: 'ARC-2026-0811',
        orgName: 'St. Jude Central EHR Health System'
      },
      executiveSummary: 'This formal forensic incident report documents a high-risk access anomaly. The adaptive threat intelligence engine detected a sustained insider behavior pattern deviating drastically from typical nursing baseline operations.',
      recommendations: [
        'Review user access permissions.',
        'Investigate repeated PDF export activity.',
        'Monitor off-hours authentication attempts.'
      ]
    },
    {
      id: 'STJ-REP-2026-002',
      name: 'HIPAA & SOC Compliance Security Audit',
      type: 'Compliance Audit Report',
      generatedBy: 'thankgodebi52',
      generationDate: '2026-06-28 10:15',
      department: 'IT Administration',
      status: 'Ready',
      format: 'Excel',
      fileSize: '1.2 MB',
      pages: 12,
      metadata: {
        title: 'Healthcare HIPAA Compliance Assessment',
        subtitle: 'Audit Log Integrity & Access Accountability Report',
        engineVersion: 'ATIF-v2.8.4',
        integrityHash: 'sha256:77bcda8a02bd3f4eef922384a',
        verificationCode: 'STJ-VERIFY-2283',
        archiveId: 'ARC-2026-0812',
        orgName: 'St. Jude Central EHR Health System'
      },
      executiveSummary: 'This quarterly health system assessment audits active access logs against HIPAA Security Rule Title II standards. Core controls reviewed include unique user identification, audit controls, transmission security, and access authorization processes.',
      hipaaSecurityCompliance: 'Pass - All active security layers conform to Administrative Safeguard §164.308.',
      patientDataAccessSummary: 'Total patient record lookup events audited: 1,842. Standard authorization indices confirmed for 98.4% of queries.',
      unauthorizedAccessAttempts: 4,
      patientRecordExportSummary: 'Total PDF and report exports logged: 84 instances. Each export matched active clinician credentials.',
      auditTrailCompleteness: '99.8% System Log Completeness. Backup server synchronization checked cleanly.',
      incidentDocumentation: 'All flagged events escalated directly to ATIF incident dashboard with accompanying metadata.',
      accessAccountability: 'Role-based access matrix aligned with Minimum Necessary policy requirements.',
      systemIntegrityVerification: 'Cryptographic hash checks confirm no retroactive log modifications.',
      complianceRating: 'A - Compliant',
      recommendations: [
        'Reduce excessive patient record exports.',
        'Review department baseline behavior.',
        'Review user access permissions.'
      ]
    },
    {
      id: 'STJ-REP-2026-003',
      name: 'Executive Monthly Security Health Report',
      type: 'Executive Summary Report',
      generatedBy: 'system_engine',
      generationDate: '2026-06-27 18:00',
      department: 'Executive Administration',
      status: 'Ready',
      format: 'PDF',
      fileSize: '512 KB',
      pages: 6,
      overallSecurityScore: 88,
      threatTrends: 'Downward - Threat levels reduced by 14% month-over-month due to adaptive micro-segmentation policies.',
      topThreatCategories: [
        { category: 'Credential Abuse', count: 18 },
        { category: 'Insider Anomaly', count: 12 },
        { category: 'Unauthorized Search', count: 8 },
        { category: 'Clinical Spill', count: 4 }
      ],
      deptRiskComparison: [
        { dept: 'Clinical Nursing', score: 42 },
        { dept: 'HIM Office', score: 55 },
        { dept: 'Pharmacy', score: 28 },
        { dept: 'Laboratory', score: 15 }
      ],
      mostTargetedDepts: ['Clinical Nursing', 'HIM Office'],
      highRiskUsers: ['nurse_rached', 'pharmacist_bob'],
      threatGrowthRate: '+3.2% annual threat density expansion',
      detectionAccuracy: '99.2% true-positive validation rate',
      averageResponseTime: '4.8 minutes to automatic containment',
      metadata: {
        title: 'Executive Healthcare Security Report',
        subtitle: 'High-Level Organizational Risk and Security Posture Analytics',
        engineVersion: 'ATIF-v2.8.4',
        integrityHash: 'sha256:0d12e847c29be19002bbecf4',
        verificationCode: 'STJ-VERIFY-1120',
        archiveId: 'ARC-2026-0813',
        orgName: 'St. Jude Central EHR Health System'
      },
      executiveSummary: 'This executive health report highlights St. Jude Central\'s macro security metrics. The threat-defense mesh successfully contained four insider incidents and verified log completeness, supporting strategic risk planning.',
      recommendations: [
        'Conduct user awareness training.',
        'Review department baseline behavior.',
        'Review user access permissions.'
      ]
    },
    {
      id: 'STJ-REP-2026-004',
      name: 'EHR Department Anomaly Baseline Analysis',
      type: 'Behavior Analysis Report',
      generatedBy: 'system_engine',
      generationDate: '2026-06-26 09:00',
      department: 'Clinical Nursing',
      status: 'Ready',
      format: 'JSON',
      fileSize: '128 KB',
      pages: 3,
      behaviorBaseline: 'Daily typical patient record views: 12-18 views per nurse. Peak logins between 08:00 AM and 05:00 PM.',
      actualBehavior: 'Spiked to 42 views on 2026-06-25, specifically targetting high-risk VIP and staff records.',
      deviationPercentage: 233,
      patientAccessStats: 'Active access queries shifted to off-shift hours (11:00 PM to 02:00 AM).',
      pdfExportStats: 'Total pdf export activities: 8 documents compiled.',
      authSummary: 'Single session login from known clinical terminal, followed by immediate IP swap to wireless node.',
      behaviorDrift: 'Substantial structural drift logged over 72-hour profiling timeline.',
      behavioralRiskRating: 'High Risk Deviation Index',
      adaptiveClassification: 'Anomalous Clinician Access Pattern',
      metadata: {
        title: 'ATIF User Profiling Baseline',
        subtitle: 'Dynamic Departmental Baseline Audit Log Analysis',
        engineVersion: 'ATIF-v2.8.4',
        integrityHash: 'sha256:2fa9de7b312bca01eef19ac82',
        verificationCode: 'STJ-VERIFY-4491',
        archiveId: 'ARC-2026-0814',
        orgName: 'St. Jude Central EHR Health System'
      },
      executiveSummary: 'This report documents structural behavioral drifts across core nursing directories. Bypasses in scheduling and ward routing are parsed dynamically to reconstruct access baselines.',
      recommendations: [
        'Monitor off-hours authentication attempts.',
        'Review department baseline behavior.',
        'Conduct user awareness training.'
      ]
    }
  ]);

  // Static stats matching the "TOP SUMMARY CARDS" section exactly
  const summaryStats = useMemo(() => {
    // Basic counting
    const totalGenerated = reports.length + 124; // Let's start with 128 (dynamically incremented)
    const exportedCount = 84 + (reports.filter(r => r.status === 'Ready').length - 4);

    return {
      total: totalGenerated,
      incidents: 42 + reports.filter(r => r.type === 'Incident Investigation Report' && r.id.startsWith('DYN-')).length,
      daily: 31,
      weekly: 18,
      monthly: 12,
      executive: 9 + reports.filter(r => r.type === 'Executive Summary Report' && r.id.startsWith('DYN-')).length,
      compliance: 16 + reports.filter(r => r.type === 'Compliance Audit Report' && r.id.startsWith('DYN-')).length,
      exported: exportedCount
    };
  }, [reports]);

  // Handle Search and Filter
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = 
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.affectedUser && r.affectedUser.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'ALL' || r.type === filterType;
      const matchDept = filterDept === 'ALL' || r.department === filterDept;
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;

      return matchSearch && matchType && matchDept && matchStatus;
    });
  }, [reports, searchTerm, filterType, filterDept, filterStatus]);

  // List of distinct types for filter dropdown
  const reportTypesList = [
    'Incident Investigation Report',
    'Threat Intelligence Report',
    'Threat Analytics Report',
    'Behavior Analysis Report',
    'Risk Assessment Report',
    'Executive Summary Report',
    'Department Security Report',
    'Compliance Audit Report',
    'Threat Repository Report',
    'Threat Simulator Results'
  ];

  // List of departments for filter
  const departmentsList = [
    'All Departments',
    'HIM Office',
    'Clinical Nursing',
    'Pharmacy',
    'Laboratory',
    'Radiology',
    'IT Administration',
    'Executive Administration'
  ];

  // Get current active selected report object
  const activeReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  // Trigger Report Generation dynamically from the ATIF database and existing system modules
  const handleGenerateReport = () => {
    // We construct a dynamic report that incorporates actual information from posture, incidents, events, profiles, and feed
    const reportId = `STJ-REP-${new Date().getFullYear()}-${String(reports.length + 1).padStart(3, '0')}`;
    
    // We fetch a real incident to populate, if available, otherwise fallback
    const matchedIncident = incidents.find(inc => {
      if (genRiskLevel !== 'All Levels' && inc.riskLevel !== genRiskLevel) return false;
      if (genDept !== 'All Departments' && inc.department !== genDept) return false;
      return true;
    }) || incidents[0];

    const targetUser = matchedIncident ? matchedIncident.affectedUser : (profiles[0]?.username || 'nurse_rached');
    const targetDept = matchedIncident ? (matchedIncident.department || 'Clinical Nursing') : 'Clinical Nursing';
    const riskScore = matchedIncident ? matchedIncident.riskScore : 78;
    const severity = matchedIncident ? matchedIncident.riskLevel : 'High';
    const classification = matchedIncident ? matchedIncident.title : 'Anomalous EHR Records Access';

    // Build the dynamic recommendations based on ATIF parameters
    const generatedRecommendations: string[] = [];
    if (riskScore > 80) {
      generatedRecommendations.push('Review user access permissions.');
      generatedRecommendations.push('Investigate repeated PDF export activity.');
    } else {
      generatedRecommendations.push('Review department baseline behavior.');
      generatedRecommendations.push('Conduct user awareness training.');
    }
    if (severity === 'Critical' || severity === 'High') {
      generatedRecommendations.push('Monitor off-hours authentication attempts.');
      generatedRecommendations.push('Reduce excessive patient record exports.');
    }

    // Prepare a unique digital integrity signature hash
    const integrityHash = `sha256:${Math.random().toString(16).substr(2, 24)}`;
    const verificationCode = `STJ-VERIFY-${Math.floor(1000 + Math.random() * 9000)}`;
    const archiveId = `ARC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport: ATIFReport = {
      id: reportId,
      name: `Dynamic ${selectedType} - ${genDept} (${genDateRange})`,
      type: selectedType,
      generatedBy: currentUser?.username || 'thankgodebi52',
      generationDate: new Date().toISOString().replace('T', ' ').substr(0, 16),
      department: genDept === 'All Departments' ? 'IT Administration' : genDept,
      status: 'Ready',
      format: genFormat,
      fileSize: `${Math.floor(80 + Math.random() * 500)} KB`,
      pages: selectedType.includes('Compliance') ? 12 : selectedType.includes('Executive') ? 6 : 4,
      incidentNumber: matchedIncident?.id || 'STJ-INC-2026-004',
      threatClassification: classification,
      threatSeverity: severity,
      riskScore: riskScore,
      confidenceScore: matchedIncident?.confidenceScore || 88,
      affectedUser: targetUser,
      sessionID: matchedIncident?.sessionId || 'SESS-7741-2091',
      detectionTime: matchedIncident?.timestamp || '2026-06-29 11:20 AM',
      resolutionTime: matchedIncident?.status === 'Resolved' ? 'Resolved & Closed' : 'Active Investigation Workspace',
      threatIndicators: matchedIncident?.triggeredIndicators || ['Cross-Ward Lookup', 'Anomalous Session Load'],
      behavioralIndicators: matchedIncident?.evidence || ['EHR baseline deviation +180%', 'Shift schedule mismatch'],
      evidenceSummary: matchedIncident?.description || `ATIF real-time logs detected access deviation on user @${targetUser} accessing ${events.length} records.`,
      analystNotes: `Report compiled on demand by ${currentUser?.fullName || 'Security Analyst'} utilizing live framework pipelines. Verified compliance criteria.`,
      finalRecommendation: `Implement immediate role restrictions on credential path of @${targetUser} pending clinical workflow validation.`,
      
      // Executive summary metrics from dynamic posture and incidents
      overallSecurityScore: posture?.overallScore || 84,
      threatTrends: `Elevated Activity - Active monitoring lists ${incidents.filter(i => i.status === 'Open').length} open threats currently.`,
      topThreatCategories: [
        { category: 'Insider Threat', count: incidents.filter(i => i.threatType === 'INSIDER_THREAT').length || 4 },
        { category: 'Credential Abuse', count: incidents.filter(i => i.threatType === 'CREDENTIAL_ABUSE').length || 5 },
        { category: 'Unauthorized Access', count: incidents.filter(i => i.threatType === 'UNAUTHORIZED_ACCESS').length || 3 }
      ],
      deptRiskComparison: Object.entries(posture?.incidentsByDepartment || {}).map(([dept, count]) => ({
        dept,
        score: count * 15 + 10
      })),
      mostTargetedDepts: Object.keys(posture?.incidentsByDepartment || {}).slice(0, 2),
      highRiskUsers: profiles.filter(p => p.currentWeekViews > p.averageWeeklyViews).map(p => p.username).slice(0, 3),
      threatGrowthRate: `${incidents.length > 5 ? '+6.4%' : '+2.1%'} dynamic weekly trend fluctuation`,
      detectionAccuracy: '99.4% true positive threshold accuracy',
      averageResponseTime: '5.2 minutes average automated quarantine',

      // Behavior Analysis items
      behaviorBaseline: `Weekly typical access views: ${profiles[0]?.averageWeeklyViews || 15} views. Typical Devices: ${profiles[0]?.recentDevices?.join(', ') || 'Clinical Terminal'}.`,
      actualBehavior: `Weekly actual views spiked to: ${profiles[0]?.currentWeekViews || 44} views in active billing interval.`,
      deviationPercentage: profiles[0] ? Math.round(((profiles[0].currentWeekViews - profiles[0].averageWeeklyViews) / profiles[0].averageWeeklyViews) * 100) : 193,
      patientAccessStats: `Unique patient records accessed: ${events.filter(e => e.activityType === 'RECORD_VIEW').length} directories.`,
      pdfExportStats: 'PDF compilation trigger count: 4 total events audited.',
      authSummary: `Active user terminal: ${profiles[0]?.recentDevices?.[0] || 'Nurse Node 4B'}. IP: ${profiles[0]?.recentIps?.[0] || '10.12.44.11'}.`,
      behaviorDrift: 'Subtle anomaly drift mapped along active clinician workflow coordinates.',
      behavioralRiskRating: riskScore > 75 ? 'Critical Behavior Deviation' : 'Standard Baseline Profile',
      adaptiveClassification: classification,

      // Compliance specific
      hipaaSecurityCompliance: posture?.overallScore && posture.overallScore > 80 ? 'Fully Compliant Safeguards Active' : 'Urgent Review Safeguards Indicated',
      patientDataAccessSummary: `Total monitored patient records logged: ${patients.length || 15} files.`,
      unauthorizedAccessAttempts: incidents.length,
      patientRecordExportSummary: `Total exported pdf reports: ${events.filter(e => e.activityType?.includes('EXPORT')).length || 2} logged instances.`,
      auditTrailCompleteness: '100% Core Audit Trail integrity verified across ATIF blocks.',
      incidentDocumentation: `All ${incidents.length} recorded anomalies fully classified in security logs.`,
      accessAccountability: 'Role Based Access Control mapped strictly to EHR login sessions.',
      systemIntegrityVerification: 'Cryptographic log signatures confirm unaltered system directories.',
      complianceRating: posture?.overallScore && posture.overallScore > 85 ? 'Compliance Grade: A' : 'Compliance Grade: B (Needs Attention)',

      metadata: {
        title: `Adaptive ${selectedType}`,
        subtitle: `Dynamic Assessment generated from Real-Time ATIF Pipelines`,
        engineVersion: 'ATIF-v2.8.4',
        integrityHash,
        verificationCode,
        archiveId,
        orgName: 'St. Jude Central EHR Health System'
      },
      executiveSummary: `This detailed cybersecurity report has been generated dynamically on demand from the live ATIF EHR security engine. It reflects audit logs, behavioral baselines, active user profiles, and incident histories within the framework database.`,
      recommendations: generatedRecommendations
    };

    setReports(prev => [newReport, ...prev]);
    setSelectedReportId(reportId);
    triggerNotification(`Successfully generated dynamic report ${reportId} (${genFormat} format).`);
  };

  // Archive report
  const handleArchiveReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'Archived' } : r));
    triggerNotification(`Report ${id} successfully moved to the secure ATIF offline archive.`);
  };

  // Delete report
  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    triggerNotification(`Report ${id} permanently purged from system directory.`);
  };

  // Share report
  const openShareModal = (report: ATIFReport) => {
    setShareReportObj(report);
    setShareEmail('');
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) return;
    setIsShareModalOpen(false);
    triggerNotification(`Secure encrypted link for report ${shareReportObj?.id} transmitted to ${shareEmail}.`);
  };

  // Client-side Download function utilizing jsPDF or TXT fallback
  const handleDownloadReport = (report: ATIFReport) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Primary colors matching ATIF theme (dark blue and dark slate)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("ADAPTIVE THREAT INTELLIGENCE FRAMEWORK", 15, 18);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Official System Security Report - ${report.id}`, 15, 26);
      doc.text(`Generated: ${report.generationDate}`, 15, 31);

      // Document details
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(report.name, 15, 55);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Report Type: ${report.type}  |  Department: ${report.department}  |  By: ${report.generatedBy}`, 15, 62);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 67, 195, 67);

      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("1. EXECUTIVE SUMMARY", 15, 76);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      const splitSummary = doc.splitTextToSize(report.executiveSummary, 180);
      doc.text(splitSummary, 15, 83);

      let verticalCursor = 83 + (splitSummary.length * 5) + 8;

      // Incident Report specific details
      if (report.type.includes('Incident') && report.incidentNumber) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("2. INCIDENT FORENSIC OVERVIEW", 15, verticalCursor);
        verticalCursor += 6;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Incident Code: ${report.incidentNumber}`, 15, verticalCursor);
        doc.text(`Severity Level: ${report.threatSeverity} (Risk Score: ${report.riskScore})`, 15, verticalCursor + 5);
        doc.text(`Target User: @${report.affectedUser}`, 15, verticalCursor + 10);
        doc.text(`Confidence Score: ${report.confidenceScore}%`, 15, verticalCursor + 15);
        verticalCursor += 22;

        if (report.evidenceSummary) {
          doc.setFont('Helvetica', 'bold');
          doc.text("Incident Evidence Summary:", 15, verticalCursor);
          verticalCursor += 5;
          doc.setFont('Helvetica', 'normal');
          const splitEvidence = doc.splitTextToSize(report.evidenceSummary, 180);
          doc.text(splitEvidence, 15, verticalCursor);
          verticalCursor += (splitEvidence.length * 5) + 5;
        }
      }

      // Compliance Report specific details
      if (report.type.includes('Compliance') && report.complianceRating) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("2. COMPLIANCE AUDIT AUDITING METRICS", 15, verticalCursor);
        verticalCursor += 6;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Compliance Rating: ${report.complianceRating}`, 15, verticalCursor);
        doc.text(`HIPAA Safegards: ${report.hipaaSecurityCompliance}`, 15, verticalCursor + 5);
        doc.text(`Audit Trail Completeness: ${report.auditTrailCompleteness}`, 15, verticalCursor + 10);
        doc.text(`Unauthorized Access Attempts Checked: ${report.unauthorizedAccessAttempts}`, 15, verticalCursor + 15);
        verticalCursor += 22;
      }

      // Recommendations list
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("3. ATIF ENGINE RECOMMENDATIONS", 15, verticalCursor);
      verticalCursor += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      report.recommendations.forEach((rec, index) => {
        doc.text(`• ${rec}`, 20, verticalCursor);
        verticalCursor += 5;
      });

      verticalCursor += 10;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, verticalCursor, 195, verticalCursor);
      verticalCursor += 6;

      // Digital Integrity Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`ATIF Digital Signature Hash: ${report.metadata.integrityHash}`, 15, verticalCursor);
      doc.text(`Verification Code: ${report.metadata.verificationCode}  |  Archive ID: ${report.metadata.archiveId}`, 15, verticalCursor + 4);
      doc.text(`Organization: ${report.metadata.orgName}  |  Engine: ${report.metadata.engineVersion}`, 15, verticalCursor + 8);

      doc.save(`${report.id}_ATIF_REPORT.pdf`);
      triggerNotification(`Completed secure local compilation of ${report.id}. PDF exported successfully.`);
    } catch (err) {
      console.error("PDF generation failed, falling back to JSON download", err);
      // Fallback text download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${report.id}_ATIF_REPORT.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerNotification(`Compiled report successfully. Exported JSON fallback.`);
    }
  };

  // Prepare recharts statistics based on actual live dataset + some consistent demonstration coordinates
  const statsMonthlyGenerated = [
    { name: 'Jan', count: 18 },
    { name: 'Feb', count: 22 },
    { name: 'Mar', count: 15 },
    { name: 'Apr', count: 28 },
    { name: 'May', count: 21 },
    { name: 'Jun', count: reports.length + 20 }
  ];

  const statsReportTypes = [
    { name: 'Incident', value: reports.filter(r => r.type.includes('Incident')).length + 15 },
    { name: 'Behavioral', value: reports.filter(r => r.type.includes('Behavior')).length + 10 },
    { name: 'Compliance', value: reports.filter(r => r.type.includes('Compliance')).length + 12 },
    { name: 'Executive', value: reports.filter(r => r.type.includes('Executive')).length + 8 },
    { name: 'Others', value: 14 }
  ];

  const statsActiveAnalysts = [
    { name: 'system_engine', reports: reports.filter(r => r.generatedBy === 'system_engine').length + 85 },
    { name: 'thankgodebi52', reports: reports.filter(r => r.generatedBy !== 'system_engine').length + 20 },
    { name: 'it_sec_admin', reports: 12 },
    { name: 'him_supervisor', reports: 8 }
  ];

  const statsFormatsUsed = [
    { name: 'PDF', value: reports.filter(r => r.format === 'PDF').length + 64 },
    { name: 'Excel', value: reports.filter(r => r.format === 'Excel').length + 18 },
    { name: 'CSV', value: 12 },
    { name: 'JSON', value: reports.filter(r => r.format === 'JSON').length + 8 },
    { name: 'Print', value: 5 }
  ];

  const statsDeptDistribution = [
    { name: 'HIM Office', value: reports.filter(r => r.department === 'HIM Office').length + 14 },
    { name: 'Nursing', value: reports.filter(r => r.department === 'Clinical Nursing').length + 18 },
    { name: 'Pharmacy', value: reports.filter(r => r.department === 'Pharmacy').length + 8 },
    { name: 'IT Admin', value: reports.filter(r => r.department === 'IT Administration').length + 22 },
    { name: 'Others', value: 12 }
  ];

  const COLORS = ['#0f172a', '#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 text-slate-800" id="atif-reports-center">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Generate, archive, export, and review adaptive threat intelligence reports and healthcare security assessments.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button 
            onClick={onRefresh}
            className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-slate-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (Exactly Eight Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="report-summary-cards">
        {[
          { title: 'Total Reports Generated', value: summaryStats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { title: 'Incident Reports', value: summaryStats.incidents, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50/50' },
          { title: 'Daily Reports', value: summaryStats.daily, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { title: 'Weekly Reports', value: summaryStats.weekly, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50/50' },
          { title: 'Monthly Reports', value: summaryStats.monthly, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { title: 'Executive Reports', value: summaryStats.executive, icon: Cpu, color: 'text-slate-900', bg: 'bg-slate-100/50' },
          { title: 'Compliance Reports', value: summaryStats.compliance, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50/50' },
          { title: 'Reports Exported', value: summaryStats.exported, icon: Download, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-slate-100 bg-white flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.title}</p>
              <h3 className="text-xl font-black text-slate-950 tracking-tight font-mono mt-0.5">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* CORE WORKSPACE: GENERATOR & LIBRARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: REPORT GENERATOR & RECENT FEED */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* A. REPORT GENERATOR PANEL */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 text-left" id="report-generator-panel">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono text-[#2563eb]">
                Report Generator
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Report Type</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {reportTypesList.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* GRID OF FILTERS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date Range</label>
                  <select 
                    value={genDateRange}
                    onChange={(e) => setGenDateRange(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="Today">Today</option>
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Custom Range">Custom Range</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department</label>
                  <select 
                    value={genDept}
                    onChange={(e) => setGenDept(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    {departmentsList.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Threat Category</label>
                  <select 
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
                    <option value="CREDENTIAL_ABUSE">Credential Abuse</option>
                    <option value="INSIDER_THREAT">Insider Threat</option>
                    <option value="SENSITIVE_RECORD_ACCESS">Sensitive Access</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Risk Level</label>
                  <select 
                    value={genRiskLevel}
                    onChange={(e) => setGenRiskLevel(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Incident Status</label>
                  <select 
                    value={genStatus}
                    onChange={(e) => setGenStatus(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Analyst</label>
                  <select 
                    value={genAnalyst}
                    onChange={(e) => setGenAnalyst(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Analysts">All Analysts</option>
                    <option value="system_engine">ATIF Core Engine</option>
                    <option value="thankgodebi52">thankgodebi52</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">User Role</label>
                  <select 
                    value={genUserRole}
                    onChange={(e) => setGenUserRole(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Doctor">Doctor</option>
                    <option value="HIM_OFFICER">HIM Officer</option>
                    <option value="PHARMACIST">Pharmacist</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Threat Confidence</label>
                  <select 
                    value={genConfidence}
                    onChange={(e) => setGenConfidence(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50"
                  >
                    <option value="All Scores">All Scores</option>
                    <option value="90%+">High (&gt;90%)</option>
                    <option value="70%+">Medium (&gt;70%)</option>
                  </select>
                </div>
              </div>

              {/* REPORT FORMAT */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700">Report Format</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['PDF', 'CSV', 'Excel', 'JSON', 'Print'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setGenFormat(fmt)}
                      className={`py-1.5 px-1 border text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                        genFormat === fmt 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* GENERATE BUTTON */}
              <button
                onClick={handleGenerateReport}
                className="w-full mt-3 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-100 transition-all active:scale-98"
              >
                <Zap className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>

          {/* B. AUTOMATIC REPORT SCHEDULING */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 text-left" id="report-scheduling-panel">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono text-[#4f46e5]">
                  Automated Scheduling
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={schedulerEnabled} 
                  onChange={() => setSchedulerEnabled(!schedulerEnabled)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-[10px] text-slate-500 italic leading-normal">
                Configure St. Jude Central automatic assessment rules pipelines for compliance backup.
              </p>

              <div className="space-y-2">
                {[
                  { key: 'daily', label: 'Daily Reports', desc: 'Runs every day at 23:59 UTC' },
                  { key: 'weekly', label: 'Weekly Reports', desc: 'Runs Sunday night at 00:00 UTC' },
                  { key: 'monthly', label: 'Monthly Reports', desc: 'First day of month' },
                  { key: 'quarterly', label: 'Quarterly Reports', desc: 'HHS Compliance audits' },
                  { key: 'annual', label: 'Annual Reports', desc: 'Year-end Board review' }
                ].map((sched) => (
                  <label key={sched.key} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      disabled={!schedulerEnabled}
                      checked={schedulerReports[sched.key as keyof typeof schedulerReports]}
                      onChange={() => setSchedulerReports(prev => ({ ...prev, [sched.key]: !prev[sched.key as keyof typeof schedulerReports] }))}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    />
                    <div>
                      <span className={`font-bold block ${!schedulerEnabled ? 'text-slate-400' : 'text-slate-800'}`}>
                        {sched.label}
                      </span>
                      <span className="text-[9px] text-slate-400 block">{sched.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* C. RECENT REPORTS (Dynamic summary checklist) */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 text-left" id="recent-reports-panel">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono text-[#059669]">
                Recent Reports
              </h2>
            </div>
            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Daily Threat Summary', date: 'Generated Today', format: 'PDF', risk: 'Low Anomaly' },
                { name: 'Executive Monthly Security Report', date: 'Yesterday', format: 'PDF', risk: '88% Security Index' },
                { name: 'Critical Insider Threat Investigation', date: '2 Days Ago', format: 'PDF', risk: 'Incident Active' },
                { name: 'Department Risk Assessment', date: '3 Days Ago', format: 'JSON', risk: 'HIM Audit Spikes' }
              ].map((rec, index) => (
                <div key={index} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex justify-between items-center transition-all">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-950 truncate max-w-[150px]">{rec.name}</p>
                    <p className="text-[9px] text-slate-400">{rec.date} • {rec.format}</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-600">
                    {rec.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: SEARCHABLE REPORT LIBRARY */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* A. REPORT LIBRARY SEARCH ARCHIVE & CONTAINER */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4 text-left" id="report-library-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono text-[#2563eb]">
                  Report Library Archive
                </h2>
              </div>

              {/* INLINE ARCHIVE SEARCH FILTERS */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Archive..."
                    className="pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs w-40 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-slate-200 rounded-xl bg-slate-50 py-1.5 px-2.5 text-xs"
                >
                  <option value="ALL">All Types</option>
                  <option value="Incident Investigation Report">Incidents</option>
                  <option value="Compliance Audit Report">Compliance</option>
                  <option value="Executive Summary Report">Executive</option>
                  <option value="Behavior Analysis Report">Behavioral</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-200 rounded-xl bg-slate-50 py-1.5 px-2.5 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Ready">Ready</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* PREVIOUSLY GENERATED REPORTS GRID */}
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-150 rounded-2xl text-center text-xs text-slate-400">
                  <AlertTriangle className="h-5 w-5 mx-auto text-slate-300 mb-2" />
                  No reports matched your active archive filters. Reset criteria to view reports.
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                      selectedReportId === report.id 
                        ? 'border-blue-600 bg-blue-50/15 ring-2 ring-blue-600/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1.5 text-xs text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {report.id}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          report.status === 'Archived' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {report.format} • {report.fileSize}
                        </span>
                      </div>
                      
                      <h3 className="font-extrabold text-slate-950 text-xs tracking-tight">
                        {report.name}
                      </h3>
                      
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Type: <span className="font-semibold text-slate-700">{report.type}</span> | Dept: <span className="font-semibold text-slate-700">{report.department}</span>
                      </p>
                      
                      <p className="text-[9px] text-slate-400">
                        Generated: {report.generationDate} by <span className="font-mono text-slate-500 font-bold">{report.generatedBy}</span>
                      </p>
                    </div>

                    {/* CARD QUICK ACTIONS */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedReportId(report.id)}
                        className="p-2 border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl bg-white text-slate-500 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="View Report Cover & Metrics"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="p-2 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-xl bg-white text-slate-500 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => openShareModal(report)}
                        className="p-2 border border-slate-200 hover:border-violet-500 hover:text-violet-600 rounded-xl bg-white text-slate-500 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="Share Encrypted Link"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </button>
                      {report.status !== 'Archived' && (
                        <button
                          onClick={() => handleArchiveReport(report.id)}
                          className="p-2 border border-slate-200 hover:border-amber-500 hover:text-amber-600 rounded-xl bg-white text-slate-500 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                          title="Archive Report"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 border border-slate-200 hover:border-red-500 hover:text-red-600 rounded-xl bg-white text-slate-500 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="Purge Report"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* B. REPORT STATISTICS CHARTS (Fully Compliant layout) */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-5 text-left" id="report-statistics-panel">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono text-[#2563eb]">
                Framework Reports Performance & Statistics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Chart 1: Reports Generated Per Month */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Monthly Assessment Output Trends</h4>
                <div className="h-40 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsMonthlyGenerated} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Most Generated Report Types */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Distribution by Report Type</h4>
                <div className="h-40 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsReportTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statsReportTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={24} iconSize={7} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Most Active Analysts */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Compilation Activity by Analyst</h4>
                <div className="h-40 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsActiveAnalysts} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Export Formats Used */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Audited Document Formats Exported</h4>
                <div className="h-40 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsFormatsUsed}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={45}
                        dataKey="value"
                      >
                        {statsFormatsUsed.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={24} iconSize={7} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Additional reporting performance indices */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 border rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Generation Time</span>
                <span className="font-mono text-base font-black text-blue-600 mt-0.5 block">2.4 seconds</span>
              </div>
              <div className="p-3 border rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Log Parser Speed</span>
                <span className="font-mono text-base font-black text-emerald-600 mt-0.5 block">14,200 EPS</span>
              </div>
              <div className="p-3 border rounded-xl col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Compliance Score</span>
                <span className="font-mono text-base font-black text-indigo-600 mt-0.5 block">100% HIPAA</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. REPORT PREVIEW PANEL (Stands Alone at the Bottom as a Gorgeous Full-Fidelity Display) */}
      <div className="border border-slate-200 rounded-3xl bg-slate-50 p-6 text-left space-y-6" id="report-preview-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-widest font-mono">Live Interactive Preview Panel</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-500" />
              Currently Previewing: {activeReport.id}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadReport(activeReport)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Download className="h-3.5 w-3.5" />
              Export Document ({activeReport.format})
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
              title="Print Version Output"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PHYSICAL PAPER CONTAINER LAYOUT */}
        <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl mx-auto shadow-2xl p-8 md:p-12 relative overflow-hidden font-sans text-slate-800">
          
          {/* SYSTEM WATERMARK */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 select-none pointer-events-none opacity-[0.02] text-slate-900 font-black text-8xl tracking-widest text-center">
            ATIF ENGINE SECURE<br />ST. JUDE CENTRAL
          </div>

          {/* WATERMARK LABEL */}
          <div className="absolute top-4 right-4 text-[9px] font-mono font-bold tracking-wider text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">
            ATIF Official Record
          </div>

          {/* A. REPORT COVER / HEADER */}
          <div className="border-b-4 border-slate-900 pb-6 flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-black tracking-widest text-slate-950 font-mono uppercase">ST. JUDE CENTRAL HEALTH SYSTEM</span>
              </div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight font-sans leading-tight mt-1">
                {activeReport.metadata.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {activeReport.metadata.subtitle}
              </p>
            </div>
            
            {/* HOSPITAL LOGO MOCK */}
            <div className="text-right space-y-1 text-[10px] font-mono">
              <div className="font-extrabold text-blue-600">ATIF-SECURE-NODE</div>
              <div className="text-slate-400">ID: {activeReport.metadata.archiveId}</div>
              <div className="text-slate-400">HHS-SAFEGUARD-II</div>
            </div>
          </div>

          {/* B. REPORT METADATA GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Report Code</span>
              <span className="font-mono font-extrabold text-slate-950">{activeReport.id}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Compilation Time</span>
              <span className="font-mono text-slate-900">{activeReport.generationDate}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Triggered Analyst</span>
              <span className="font-mono text-slate-900 font-bold">{activeReport.generatedBy}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Audited Department</span>
              <span className="text-slate-900 font-bold">{activeReport.department}</span>
            </div>
          </div>

          {/* C. EXECUTIVE SUMMARY */}
          <div className="py-6 space-y-3 border-b border-slate-100 text-xs text-left">
            <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">1. EXECUTIVE SUMMARY</h3>
            <p className="text-slate-700 leading-relaxed text-justify">
              {activeReport.executiveSummary}
            </p>
          </div>

          {/* D. DYNAMIC TEMPLATE RENDERING */}
          <div className="py-6 text-xs text-left">
            
            {/* IF INCIDENT INVESTIGATION TYPE */}
            {activeReport.type.includes('Incident') && (
              <div className="space-y-5" id="incident-report-template">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">2. INCIDENT DIAGNOSTIC FORENSICS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl bg-slate-50 space-y-2.5">
                    <h4 className="font-bold text-slate-900">Core Incident Parameters</h4>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Incident Number:</span>
                        <span className="font-bold">{activeReport.incidentNumber}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Threat Category:</span>
                        <span className="font-bold">{activeReport.threatClassification}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Severity Metric:</span>
                        <span className="font-bold text-red-600">{activeReport.threatSeverity}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">ATIF Risk Index:</span>
                        <span className="font-bold">{activeReport.riskScore}/100</span>
                      </div>
                      <div className="flex justify-between pb-0">
                        <span className="text-slate-400">Detection Confidence:</span>
                        <span className="font-bold text-blue-600">{activeReport.confidenceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl bg-slate-50 space-y-2.5">
                    <h4 className="font-bold text-slate-900">User Session Context</h4>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Target User Account:</span>
                        <span className="font-bold">@{activeReport.affectedUser}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Department Node:</span>
                        <span className="font-bold">{activeReport.department}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">EHR Session ID:</span>
                        <span className="font-bold">{activeReport.sessionID}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">EHR Detection Time:</span>
                        <span className="font-bold">{activeReport.detectionTime}</span>
                      </div>
                      <div className="flex justify-between pb-0">
                        <span className="text-slate-400">Resolution Status:</span>
                        <span className="font-bold text-emerald-600">{activeReport.resolutionTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavioral indicators checklist */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900">System Behavioral Indicators Map</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeReport.threatIndicators?.map((ind, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg bg-white">
                        <AlertOctagon className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="font-mono text-[10px] text-slate-700">{ind}</span>
                      </div>
                    ))}
                    {activeReport.behavioralIndicators?.map((bind, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg bg-white">
                        <Sliders className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-mono text-[10px] text-slate-700">{bind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence timeline */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="font-bold text-slate-900">Forensic Audit Trail & Evidence</h4>
                  <div className="p-4 border rounded-xl bg-slate-50/50">
                    <p className="text-slate-700 leading-normal mb-2 italic">
                      "{activeReport.evidenceSummary}"
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      *Live timeline logs validated against HHS cryptographic EHR audit checksum blocks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* IF EXECUTIVE SUMMARY TYPE */}
            {activeReport.type.includes('Executive') && (
              <div className="space-y-5" id="executive-report-template">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">2. ENTERPRISE POSTURE METRICS</h3>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 border rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Overall Security Score</span>
                    <span className="font-mono text-xl font-extrabold text-blue-600 mt-0.5 block">{activeReport.overallSecurityScore}/100</span>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">True Detection Accuracy</span>
                    <span className="font-mono text-xl font-extrabold text-emerald-600 mt-0.5 block">{activeReport.detectionAccuracy}</span>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Avg Containment Time</span>
                    <span className="font-mono text-xl font-extrabold text-indigo-600 mt-0.5 block">{activeReport.averageResponseTime}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900">High Risk Organizational Verticals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 border rounded-xl space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Most Targeted Departments</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeReport.mostTargetedDepts?.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 font-bold text-[9px] rounded-full">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3.5 border rounded-xl space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Identified Anomaly Profiles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeReport.highRiskUsers?.map((u, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-[9px] rounded-full font-mono">
                            @{u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-xl bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-slate-900">Strategic Posture Assessment</h4>
                  <p className="text-slate-700 leading-normal">{activeReport.threatTrends}</p>
                  <p className="text-[9px] font-mono text-slate-400">Trend Index: {activeReport.threatGrowthRate}</p>
                </div>
              </div>
            )}

            {/* IF BEHAVIOR ANALYSIS TYPE */}
            {activeReport.type.includes('Behavior') && (
              <div className="space-y-5" id="behavior-report-template">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">2. ADAPTIVE BEHAVIOR baseline ASSESSMENT</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl space-y-2.5 bg-slate-50">
                    <h4 className="font-bold text-slate-900">EHR Typical Access Baseline</h4>
                    <p className="text-slate-600 italic leading-relaxed font-mono text-[11px]">{activeReport.behaviorBaseline}</p>
                  </div>
                  <div className="p-4 border rounded-xl space-y-2.5 bg-slate-50">
                    <h4 className="font-bold text-slate-900">Actual Active Period Behavior</h4>
                    <p className="text-slate-600 italic leading-relaxed font-mono text-[11px]">{activeReport.actualBehavior}</p>
                  </div>
                </div>

                <div className="p-4 border rounded-xl space-y-2.5">
                  <h4 className="font-bold text-slate-900">Statistical Deviation Indicators</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 border rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase">Deviation Percent</span>
                      <span className="font-mono text-sm font-black text-red-600">+{activeReport.deviationPercentage}%</span>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase">EHR Access Scope</span>
                      <span className="font-mono text-xs font-bold text-slate-700">VIP & Restricted</span>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase">Drift Classification</span>
                      <span className="font-mono text-xs font-bold text-amber-600">Off-Shift Drift</span>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <span className="text-[9px] text-slate-400 block uppercase">Security Risk index</span>
                      <span className="font-mono text-xs font-bold text-slate-700">{activeReport.behavioralRiskRating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 border rounded-xl bg-slate-50/50 font-mono text-[10px] space-y-1">
                  <h5 className="font-bold text-slate-800">Authentication & Network Audit</h5>
                  <p className="text-slate-600">{activeReport.authSummary}</p>
                  <p className="text-slate-600">{activeReport.patientAccessStats}</p>
                </div>
              </div>
            )}

            {/* IF COMPLIANCE AUDIT TYPE */}
            {activeReport.type.includes('Compliance') && (
              <div className="space-y-5" id="compliance-report-template">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">2. HIPAA Safeguards compliance AUDIT</h3>

                <div className="p-4 border rounded-xl bg-emerald-50/50 border-emerald-100 space-y-1">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Overall Health System Evaluation Summary
                  </h4>
                  <p className="text-slate-700 leading-normal text-[11px]">{activeReport.hipaaSecurityCompliance}</p>
                  <span className="font-mono text-[10px] text-emerald-700 block font-black uppercase mt-1">Audit Score: {activeReport.complianceRating}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl space-y-2.5 bg-slate-50">
                    <h4 className="font-bold text-slate-900">EHR Safeguards Validation Matrix</h4>
                    <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                      <div>• Audit Trail Completeness Check: <span className="font-bold text-slate-800">{activeReport.auditTrailCompleteness}</span></div>
                      <div>• Incident Documentation Check: <span className="font-bold text-slate-800">{activeReport.incidentDocumentation}</span></div>
                      <div>• Unique Identifier Authentication: <span className="font-bold text-slate-800">{activeReport.accessAccountability}</span></div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl space-y-2.5 bg-slate-50">
                    <h4 className="font-bold text-slate-900">HHS Access Log Statistics</h4>
                    <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                      <div>• Record Lookups Monitored: <span className="font-bold text-slate-800">{activeReport.patientDataAccessSummary}</span></div>
                      <div>• PDF Exports Logged: <span className="font-bold text-slate-800">{activeReport.patientRecordExportSummary}</span></div>
                      <div>• Attempted Breaches/Blocked: <span className="font-bold text-slate-800">{activeReport.unauthorizedAccessAttempts} attempts</span></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-400 text-center bg-white italic">
                  *This audit record complies strictly with HHS administrative safeguard criteria set forth in HIPAA § 164.308.
                </div>
              </div>
            )}

            {/* IF GENERAL THREAT TREND OR OTHER TYPES */}
            {!activeReport.type.includes('Incident') && !activeReport.type.includes('Executive') && !activeReport.type.includes('Behavior') && !activeReport.type.includes('Compliance') && (
              <div className="space-y-4" id="threat-trend-template">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">2. SYSTEM INTELLIGENCE SUMMARY</h3>
                <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-900">Report Context Logs</h4>
                  <p className="text-slate-700 leading-normal italic">
                    "This adaptive security audit was compiled successfully from live EHR databases. Data indices validated by St. Jude Central secure directory hash loops."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 border rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold">Risk Weight Factor</span>
                    <span className="font-mono text-sm font-extrabold text-blue-600 block mt-0.5">1.5 Base Index</span>
                  </div>
                  <div className="p-3 border rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold">Threat Indicator Density</span>
                    <span className="font-mono text-sm font-extrabold text-amber-600 block mt-0.5">Moderate Trace Profile</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* E. RECOMMENDATION ENGINE */}
          <div className="py-6 border-t border-slate-200 text-xs text-left space-y-3.5" id="recommendation-engine-results">
            <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider font-mono">3. ADAPTIVE ATIF ENGINE RECOMMENDATIONS</h3>
            
            <div className="space-y-2">
              {activeReport.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 border border-slate-100 rounded-xl bg-blue-50/10">
                  <div className="p-1 rounded bg-blue-50 text-blue-600 mt-0.5 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{rec}</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      {rec.includes('access') && 'Verify active user role maps, clinical assignation index, and credentials.'}
                      {rec.includes('PDF') && 'Audit active printspool pipelines. Check user device registry for compliance.'}
                      {rec.includes('off-hours') && 'Enforce strict 2FA handshakes during non-standard shift schedules.'}
                      {rec.includes('department') && 'Recalibrate neural clustering baseline indexes for clinical staff.'}
                      {rec.includes('training') && 'Schedule educational refresher regarding confidential medical files access policy.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* F. DIGITAL SIGNATURE PANEL */}
          <div className="mt-8 pt-8 border-t border-slate-300 text-[10px] font-mono text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-6" id="digital-signature-panel">
            <div className="space-y-1 text-left">
              <div>ATIF Security Engine Version: <span className="text-slate-700 font-extrabold">{activeReport.metadata.engineVersion}</span></div>
              <div>Verification Hash: <span className="text-slate-700 select-all font-bold">{activeReport.metadata.integrityHash}</span></div>
              <div>Repository Archive Index ID: <span className="text-slate-700 font-bold">{activeReport.metadata.verificationCode} / {activeReport.metadata.archiveId}</span></div>
            </div>
            
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-right min-w-[180px] space-y-1">
              <div className="text-[8px] text-slate-400 uppercase font-black">Cryptographic Authenticator</div>
              <div className="font-bold text-slate-900 text-[11px] italic">@Security_Analyst_ATIF</div>
              <div className="text-[8px] text-slate-400 font-mono">Timestamp: {activeReport.generationDate}</div>
              <div className="text-[7px] text-blue-600 uppercase font-bold tracking-widest mt-0.5">Digitally Checked & Secured</div>
            </div>
          </div>

          {/* PAGE FOOTER WATERMARK */}
          <div className="mt-12 text-center text-[9px] font-mono text-slate-300">
            CONFIDENTIAL • FOR INTERNAL USE ONLY • ST. JUDE HEALTH SYSTEM INFORMATION SYSTEM
          </div>

        </div>
      </div>

      {/* SHARE MODAL DIALOG MOCK */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full text-left space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="text-sm font-bold text-slate-950 font-mono uppercase tracking-widest text-[#3b82f6] flex items-center gap-1.5">
                  <Share2 className="h-4 w-4" />
                  Share Encrypted Document
                </h3>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleShareSubmit} className="space-y-4 text-xs">
                <p className="text-slate-500 leading-normal">
                  Transmitting <span className="font-bold text-slate-900">{shareReportObj?.id}</span>. This transmission encrypts report files via AES-256 TLS boundaries.
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Recipient Analyst Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. supervisor@stjude.org"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full border p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-50 cursor-pointer font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow"
                  >
                    Transmit Secured Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
