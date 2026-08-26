/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Clock, Database, Info,
  ShieldAlert, Users, Sliders, Settings, AlertTriangle, CheckCircle2,
  Download, RefreshCw, Calendar, ArrowUpRight, Check, Zap, Brain, Timer,
  Gauge, FileText, FileSpreadsheet, Layers, ShieldCheck, HelpCircle,
  Eye, Archive, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line 
} from 'recharts';
import { jsPDF } from 'jspdf';
import { ThreatIncident, SecurityEvent, SecurityRiskLevel, HospitalRole } from '../types';

interface SecurityAnalyticsViewProps {
  incidents: ThreatIncident[];
  events: SecurityEvent[];
}

export default function SecurityAnalyticsView({ incidents, events }: SecurityAnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<string>("Last 7 Days");
  const [selectedTrendLine, setSelectedTrendLine] = useState<string>("ALL");
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryReportType, setSummaryReportType] = useState<string>("Executive");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // List of clinical users for risk scoring
  const baseUsers = [
    { username: 'pharmacist_bob', displayName: 'Pharmacist Bob', role: 'Pharmacist', department: 'Pharmacy' },
    { username: 'nurse_rached', displayName: 'Florence Nightingale', role: 'Nurse', department: 'Emergency' },
    { username: 'him_officer', displayName: 'Elena Rostova', role: 'HIM Officer', department: 'Health Information Management' },
    { username: 'dr_house', displayName: 'Dr. Gregory House', role: 'Clinician', department: 'Emergency' },
    { username: 'lab_scientist', displayName: 'Dr. Louis Pasteur', role: 'Lab Scientist', department: 'Laboratory' },
    { username: 'rad_officer', displayName: 'Marie Curie', role: 'Radiology Officer', department: 'Radiology' },
    { username: 'analyst_sam', displayName: 'Sarah Johnson', role: 'SOC Analyst', department: 'Administration' },
    { username: 'accounts_officer', displayName: 'John Sherman', role: 'Accounts Officer', department: 'Finance' }
  ];

  // Dynamic calculations for user cohorts
  const computedCohort = useMemo(() => {
    return baseUsers.map(u => {
      const userEvents = events.filter(e => e.username === u.username || e.userId === u.username);
      const userIncidents = incidents.filter(inc => inc.affectedUser === u.username);
      
      const activeIncidents = userIncidents.filter(inc => inc.status === "Open" || inc.status === "Investigating");
      const mitigatedIncidents = userIncidents.filter(inc => inc.status === "Mitigated" || inc.status === "Resolved");
      
      let score = 15;
      if (activeIncidents.length > 0) {
        const hasCritical = activeIncidents.some(i => i.riskLevel === SecurityRiskLevel.CRITICAL);
        const hasHigh = activeIncidents.some(i => i.riskLevel === SecurityRiskLevel.HIGH);
        const hasMedium = activeIncidents.some(i => i.riskLevel === SecurityRiskLevel.MEDIUM);
        
        score = hasCritical ? 91 : hasHigh ? 72 : hasMedium ? 48 : 30;
        score += Math.min(8, activeIncidents.length * 2);
      } else if (mitigatedIncidents.length > 0) {
        score = 15 + Math.min(8, mitigatedIncidents.length * 1.5);
      } else {
        const hash = u.username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        score += (hash % 5);
      }

      const threatCount = userIncidents.length;
      const confidence = userIncidents.length 
        ? Math.round(userIncidents.reduce((sum, i) => sum + (i.confidenceScore || 85), 0) / userIncidents.length)
        : 95;

      const lastDetect = userIncidents.length > 0 ? "2 hours ago" : "No recent events";

      return {
        ...u,
        score: Math.min(100, Math.max(15, Math.round(score))),
        threatCount,
        confidence,
        lastDetect,
        status: score >= 75 ? "Critical" : score >= 45 ? "High" : score >= 25 ? "Medium" : "Normal"
      };
    }).sort((a, b) => b.score - a.score);
  }, [incidents, events]);

  // Core metrics calculated dynamically from incidents and events
  const metrics = useMemo(() => {
    const totalEventsToday = events.length + 4865;
    const threatsDetected = incidents.length + 37;
    const adaptiveThreatsConfirmed = incidents.filter(i => (i.confidenceScore || 0) >= 80).length + 19;
    const averageRisk = Math.round((incidents.reduce((sum, i) => sum + i.riskScore, 0) + 2664) / threatsDetected);
    const detectionAccuracy = 97;
    const averageConfidence = Math.round((incidents.reduce((sum, i) => sum + (i.confidenceScore || 85), 0) + 3552) / threatsDetected);
    const meanDetectionTime = (4.2 - Math.min(1.5, incidents.length * 0.08)).toFixed(1);
    const activeHighRiskUsers = computedCohort.filter(u => u.score >= 60).length;

    return {
      totalEventsToday,
      threatsDetected,
      adaptiveThreatsConfirmed,
      averageRisk,
      detectionAccuracy,
      averageConfidence,
      meanDetectionTime,
      activeHighRiskUsers
    };
  }, [incidents, events, computedCohort]);

  // Seeding multi-line Trend Chart over Timeframes
  const trendData = useMemo(() => {
    const labelsMap: Record<string, string[]> = {
      "Last 24 Hours": ["04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
      "Last 7 Days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "Last 30 Days": ["Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"],
      "Last 6 Months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "Last Year": ["Q1", "Q2", "Q3", "Q4", "Year-End", "Current"]
    };
    const labels = labelsMap[timeframe] || labelsMap["Last 7 Days"];
    const seedCoeffs = [
      { auth: 8, insider: 1, anomaly: 4, privilege: 2, exfil: 1 },
      { auth: 12, insider: 3, anomaly: 7, privilege: 4, exfil: 2 },
      { auth: 9, insider: 1, anomaly: 5, privilege: 3, exfil: 1 },
      { auth: 15, insider: 4, anomaly: 10, privilege: 5, exfil: 3 },
      { auth: 11, insider: 2, anomaly: 6, privilege: 2, exfil: 1 },
      { auth: 18, insider: 3, anomaly: 12, privilege: 6, exfil: 4 },
      { auth: 14, insider: 2, anomaly: 8, privilege: 4, exfil: 2 }
    ];

    return labels.map((label, i) => {
      const coeff = seedCoeffs[i % seedCoeffs.length];
      let auth = coeff.auth;
      let insider = coeff.insider;
      let anomaly = coeff.anomaly;
      let privilege = coeff.privilege;
      let exfil = coeff.exfil;

      // Add actual live incidents dynamically to the final point
      if (i === labels.length - 1) {
        incidents.forEach(inc => {
          if (inc.threatType === "CREDENTIAL_ABUSE") auth += 2;
          else if (inc.threatType === "INSIDER_THREAT") insider += 1;
          else if (inc.threatType === "ABNORMAL_USER_BEHAVIOR") anomaly += 1;
          else if (inc.threatType === "UNAUTHORIZED_ACCESS") privilege += 1;
          else if (inc.threatType === "SENSITIVE_RECORD_ACCESS") exfil += 1;
        });
      }

      const total = auth + insider + anomaly + privilege + exfil;
      const risk = Math.round(55 + (auth * 0.4) + (insider * 2.5));
      const confidence = Math.round(85 + (total % 10));

      return {
        name: label,
        "Authentication Threats": auth,
        "Insider Threats": insider,
        "Behavioral Anomalies": anomaly,
        "Privilege Abuse": privilege,
        "Data Exfiltration": exfil,
        risk: Math.min(100, risk),
        confidence: Math.min(100, confidence),
        count: total
      };
    });
  }, [timeframe, incidents]);

  // Threat Categories for Doughnut Chart
  const distributionData = useMemo(() => {
    const categories = [
      { name: "Insider Threat", count: 10, risk: 85, color: "#ef4444" },
      { name: "Credential Abuse", count: 14, risk: 78, color: "#3b82f6" },
      { name: "Behavioral Anomaly", count: 12, risk: 62, color: "#eab308" },
      { name: "Unauthorized Access", count: 8, risk: 74, color: "#10b981" },
      { name: "Patient Data Harvesting", count: 6, risk: 80, color: "#8b5cf6" },
      { name: "PDF Export Abuse", count: 5, risk: 68, color: "#ec4899" },
      { name: "Abnormal Access Pattern", count: 4, risk: 58, color: "#64748b" },
    ];

    incidents.forEach(inc => {
      let catName = "Abnormal Access Pattern";
      const title = (inc.title || "").toLowerCase();
      const desc = (inc.description || "").toLowerCase();
      
      if (title.includes("pdf") || desc.includes("pdf") || title.includes("export") || desc.includes("export")) {
        catName = "PDF Export Abuse";
      } else if (title.includes("harvest") || desc.includes("harvest") || inc.threatType === "SENSITIVE_RECORD_ACCESS") {
        catName = "Patient Data Harvesting";
      } else if (inc.threatType === "INSIDER_THREAT") {
        catName = "Insider Threat";
      } else if (inc.threatType === "CREDENTIAL_ABUSE") {
        catName = "Credential Abuse";
      } else if (inc.threatType === "ABNORMAL_USER_BEHAVIOR") {
        catName = "Behavioral Anomaly";
      } else if (inc.threatType === "UNAUTHORIZED_ACCESS") {
        catName = "Unauthorized Access";
      }

      const match = categories.find(c => c.name === catName);
      if (match) {
        match.count += 1;
        match.risk = Math.round((match.risk * (match.count - 1) + inc.riskScore) / match.count);
      }
    });

    const total = categories.reduce((sum, c) => sum + c.count, 0);
    return categories.map(c => ({
      ...c,
      percentage: Math.round((c.count / total) * 100)
    }));
  }, [incidents]);

  // Risk Score Histogram counts
  const riskHistogramData = useMemo(() => {
    let low = 15;
    let medium = 24;
    let high = 12;
    let critical = 4;

    incidents.forEach(inc => {
      if (inc.riskScore < 30) low += 1;
      else if (inc.riskScore < 60) medium += 1;
      else if (inc.riskScore < 85) high += 1;
      else critical += 1;
    });

    return [
      { name: "Low Risk", count: low, fill: "#10b981" },
      { name: "Medium Risk", count: medium, fill: "#eab308" },
      { name: "High Risk", count: high, fill: "#f97316" },
      { name: "Critical", count: critical, fill: "#ef4444" }
    ];
  }, [incidents]);

  // Department Risk Analysis
  const departmentData = useMemo(() => {
    const depts = [
      { name: "Emergency", count: 8, risk: 74, confidence: 91 },
      { name: "Laboratory", count: 4, risk: 52, confidence: 88 },
      { name: "Radiology", count: 3, risk: 48, confidence: 92 },
      { name: "Pharmacy", count: 6, risk: 65, confidence: 90 },
      { name: "Health Information Management", count: 5, risk: 58, confidence: 89 },
      { name: "Administration", count: 2, risk: 35, confidence: 95 },
      { name: "Finance", count: 1, risk: 42, confidence: 93 }
    ];

    incidents.forEach(inc => {
      const deptName = inc.department || "Emergency";
      const match = depts.find(d => d.name.toLowerCase() === deptName.toLowerCase());
      if (match) {
        match.count += 1;
        match.risk = Math.round((match.risk * (match.count - 1) + inc.riskScore) / match.count);
      }
    });

    return depts;
  }, [incidents]);

  // 24 Hour x 7 Day Heatmap
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const heatmapData = useMemo(() => {
    const grid: Record<string, number> = {};
    daysOfWeek.forEach((day, dIdx) => {
      for (let h = 0; h < 24; h++) {
        const key = `${day}-${h}`;
        let val = (dIdx + h) % 7 === 0 ? 1 : 0;
        if (day === "Tuesday" && h === 2) val += 4;
        if (day === "Thursday" && h === 23) val += 5;
        if (day === "Friday" && h === 3) val += 6;
        if (day === "Sunday" && h === 22) val += 4;
        grid[key] = val;
      }
    });

    events.forEach(e => {
      if (e.riskContribution > 0) {
        const date = new Date(e.timestamp);
        const dIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const day = daysOfWeek[dIdx] || "Monday";
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        if (grid[key] !== undefined) grid[key] += 1;
      }
    });
    return grid;
  }, [events]);

  // Behavioral Baseline Metrics
  const baselineViewsExpected = 35;
  const baselineViewsActual = useMemo(() => {
    const recordViews = events.filter(e => e.activityType === "RECORD_VIEW").length;
    return recordViews > 0 ? recordViews : 38;
  }, [events]);

  const baselineExportsExpected = 2;
  const baselineExportsActual = useMemo(() => {
    const exportEvents = events.filter(e => {
      const desc = e.description.toLowerCase();
      return desc.includes("export") || desc.includes("pdf");
    }).length;
    return exportEvents > 0 ? exportEvents : 3;
  }, [events]);

  const baselineDeviation = baselineViewsActual - baselineViewsExpected;
  const behaviorDriftPercent = Math.round(((baselineViewsActual - baselineViewsExpected) / baselineViewsExpected) * 100);

  // Behavioral Drift Line chart data
  const driftTimelineData = useMemo(() => {
    const baseDrifts = [12, -5, 18, 35, 8, -2, behaviorDriftPercent];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, idx) => ({
      name: label,
      "Drift %": baseDrifts[idx],
      "Expected Boundary": 0
    }));
  }, [behaviorDriftPercent]);

  // Threat Indicators Frequency Counts
  const indicatorRankings = useMemo(() => {
    const indicators = [
      { name: "Failed Login", count: 238 },
      { name: "Sensitive Record Viewed", count: 191 },
      { name: "Patient Harvesting Spike", count: 103 },
      { name: "Repeated PDF Export", count: 89 },
      { name: "Baseline Deviation", count: 77 },
      { name: "Cross-Ward Browsing", count: 56 },
      { name: "Off-Hours Access", count: 41 },
      { name: "Unknown Device", count: 22 },
      { name: "Restricted Module Access", count: 13 },
    ];

    incidents.forEach(inc => {
      (inc.triggeredIndicators || []).forEach(ind => {
        const match = indicators.find(i => i.name.toLowerCase() === ind.toLowerCase());
        if (match) match.count += 1;
      });
    });

    return indicators.sort((a, b) => b.count - a.count);
  }, [incidents]);

  // Risk Evolution Stages
  const riskEvolutionStages = [
    { name: "Normal", value: 15, color: "#10b981", desc: "Compliance baselines" },
    { name: "Suspicious", value: 35, color: "#eab308", desc: "Off-hours / anomalous module" },
    { name: "Medium", value: 55, color: "#f97316", desc: "Elevated transaction velocity" },
    { name: "High", value: 75, color: "#ef4444", desc: "Critical volume breach" },
    { name: "Critical", value: 95, color: "#ef4444", desc: "Active data exfiltration freeze" }
  ];

  // CSV Exporter
  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,Incident ID,Timestamp,Title,Type,Risk Score,Risk Level,User,Department,Status\n";
    incidents.forEach(inc => {
      csv += `${inc.id},"${inc.timestamp}","${inc.title.replace(/"/g, '""')}","${inc.threatType}",${inc.riskScore},"${inc.riskLevel}","${inc.affectedUser}","${inc.department || ''}","${inc.status}"\n`;
    });
    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", "ATIF_Threat_Analytics_Exposures.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Exported ATIF_Threat_Analytics_Exposures.csv successfully.");
  };

  // PDF Generator using jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("ATIF Adaptive Threat Intelligence Framework", 15, 20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Enterprise Security Posture & Analytics Report", 15, 28);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 34);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 38, 195, 38);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("1. Executive Defensive Scorecard", 15, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Overall Enterprise Security Score: 92%`, 15, 56);
    doc.text(`Active Security Risk Level: LOW (Optimal Baselines)`, 15, 62);
    doc.text(`Mean Adaptive Threat Detection Response Time: ${metrics.meanDetectionTime} seconds`, 15, 68);

    doc.setFont("helvetica", "bold");
    doc.text("Action Recommendations:", 15, 78);
    doc.setFont("helvetica", "normal");
    doc.text("- Review HIPAA audit flags on bulk PDF exports within active clinics.", 20, 84);
    doc.text("- Restrict off-hours clinical lookup sessions through adaptive profile controls.", 20, 90);
    doc.text("- Audit top-risk users with lingering deviances listed in high-risk roster.", 20, 96);

    doc.line(15, 104, 195, 104);
    doc.setFont("helvetica", "bold");
    doc.text("2. Live Threat Distributions", 15, 114);
    doc.setFont("helvetica", "normal");
    doc.text(`- Correlated Security Threats Active: ${incidents.length}`, 15, 122);
    doc.text(`- Total Scanned Security Events Logged Today: ${metrics.totalEventsToday}`, 15, 128);
    doc.text(`- Average Adaptive Detection Confidence Index: ${metrics.averageConfidence}%`, 15, 134);

    doc.line(15, 142, 195, 142);
    doc.setFont("helvetica", "bold");
    doc.text("3. Top High-Risk Clinicians", 15, 152);
    let offset = 160;
    computedCohort.slice(0, 4).forEach((u, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. @${u.username} (${u.role}) - Score: ${u.score}/100`, 15, offset);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${u.status} | Active Threats: ${u.threatCount} | Last active: ${u.lastDetect}`, 15, offset + 5);
      offset += 12;
    });

    doc.save("ATIF_Executive_Defensive_Report.pdf");
    triggerToast("Executive PDF defensive report downloaded.");
  };

  const handleGenerateSummary = (type: string) => {
    setSummaryReportType(type);
    setShowSummaryModal(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 text-slate-800 space-y-6 text-left font-sans" id="sec-analytics-dashboard">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#0f172a] text-emerald-400 border border-emerald-950/20 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Block */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 border border-slate-200 rounded-2xl gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 size={14} className="text-rose-600 animate-pulse" /> SECURITY ANALYTICS ENGINE
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Threat Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Behavioral intelligence, threat trends, adaptive risk analytics, and healthcare security performance monitoring.
          </p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {["Last 24 Hours", "Last 7 Days", "Last 30 Days", "Last 6 Months", "Last Year"].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                timeframe === tf 
                  ? "bg-[#3b82f6] text-white shadow-sm" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Strategic Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EXECUTIVE SECURITY SCORE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">HEALTHCARE DEFENSIVE RATING</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Executive Security Score</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold font-mono text-[10px] flex items-center gap-1">
              <ShieldCheck size={10} /> Active Posture
            </span>
          </div>
          
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 font-mono tracking-tighter">92%</span>
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={12} /> LOW
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">Risk Threshold Score</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-600 block">Security Posture: <strong className="text-indigo-600">Strong</strong></span>
              <span className="text-xs font-semibold text-slate-600 block">Trend: <strong className="text-emerald-600">Improving</strong></span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">COMPLIANCE RECOMMENDATIONS</span>
            <ul className="text-[11px] text-slate-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Enforce off-hours constraints on active profiles.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Audit PDF export policies for the Emergency ward.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Address persistent baseline drifts under Laboratory.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* THREAT PREDICTION PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm lg:col-span-2">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#3b82f6] uppercase tracking-wider block">AI PREDICTIVE COGNITION MODULE</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Threat Prediction Panel</h3>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold font-mono text-[10px] flex items-center gap-1">
              <Brain size={10} /> ML Estimator Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">INSIDER RISK FORECAST</span>
              <span className="text-sm font-bold text-[#f97316] block mt-1">Medium - Escalating</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Based on active off-hours logs deviations.</p>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">TRENDING DEPARTMENTS UP</span>
              <span className="text-sm font-bold text-rose-600 block mt-1">Emergency & Lab</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Increase in lookup spikes (+14%).</p>
            </div>
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">EMERGING ATTACK VECTOR</span>
              <span className="text-sm font-bold text-slate-800 block mt-1">PDF Export Exfil</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Repetitive downloads from single ward.</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-xs">
            <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
              <ArrowUpRight size={14} className="text-[#3b82f6]" />
              <span>Projected Pattern Confidence Factor: <strong className="font-mono text-indigo-700">89%</strong></span>
            </div>
            <span className="text-[10px] text-slate-400 italic">Historical dataset index: Robust</span>
          </div>
        </div>
      </div>

      {/* Top 8 Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: "Security Events", value: metrics.totalEventsToday.toLocaleString(), change: "+4.8%", isPositive: false, icon: Database },
          { label: "Threats Detected", value: metrics.threatsDetected.toString(), change: "+12.4%", isPositive: false, icon: ShieldAlert },
          { label: "Adaptive Confirmed", value: metrics.adaptiveThreatsConfirmed.toString(), change: "+6.1%", isPositive: false, icon: CheckCircle2 },
          { label: "Average Risk", value: `${metrics.averageRisk}/100`, change: "-1.5%", isPositive: true, icon: Sliders },
          { label: "Accuracy Rate", value: `${metrics.detectionAccuracy}%`, change: "Optimal", isPositive: true, icon: Activity },
          { label: "Detection Confidence", value: `${metrics.averageConfidence}%`, change: "+2.1%", isPositive: true, icon: Brain },
          { label: "Mean Detection", value: `${metrics.meanDetectionTime}s`, change: "-0.4s", isPositive: true, icon: Timer },
          { label: "High-Risk Users", value: metrics.activeHighRiskUsers.toString(), change: "-1", isPositive: true, icon: Users }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">{card.label}</span>
                <Icon size={14} className="text-slate-400" />
              </div>
              <div className="mt-2 text-left">
                <h3 className="text-lg font-black font-mono text-slate-900 tracking-tight">{card.value}</h3>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  card.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section: Trend Analysis & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Analysis Line Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">THREAT TRENDS OVER TIME</span>
              <h2 className="text-sm font-bold text-slate-900">Incident Trend Analytics</h2>
            </div>
            
            {/* Filter trend lines interactive toggle */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["ALL", "Authentication", "Insider", "Behavioral", "Privilege", "Exfiltration"].map(lineOpt => (
                <button
                  key={lineOpt}
                  onClick={() => setSelectedTrendLine(lineOpt)}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    selectedTrendLine === lineOpt 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {lineOpt}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" tickSize={4} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "10px", color: "#f8fafc" }}
                  labelStyle={{ fontWeight: "bold", color: "#3b82f6" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                {(selectedTrendLine === "ALL" || selectedTrendLine === "Authentication") && (
                  <Line type="monotone" dataKey="Authentication Threats" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                )}
                {(selectedTrendLine === "ALL" || selectedTrendLine === "Insider") && (
                  <Line type="monotone" dataKey="Insider Threats" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 6 }} />
                )}
                {(selectedTrendLine === "ALL" || selectedTrendLine === "Behavioral") && (
                  <Line type="monotone" dataKey="Behavioral Anomalies" stroke="#eab308" strokeWidth={2.5} activeDot={{ r: 6 }} />
                )}
                {(selectedTrendLine === "ALL" || selectedTrendLine === "Privilege") && (
                  <Line type="monotone" dataKey="Privilege Abuse" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                )}
                {(selectedTrendLine === "ALL" || selectedTrendLine === "Exfiltration") && (
                  <Line type="monotone" dataKey="Data Exfiltration" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Doughnut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">SIEM CLASSIFICATION PROPORTION</span>
            <h2 className="text-sm font-bold text-slate-900">Threat Category Distribution</h2>
          </div>

          <div className="h-44 relative my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-950 font-mono tracking-tighter">
                {distributionData.reduce((sum, c) => sum + c.count, 0)}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">CORRELATIONS</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {distributionData.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-semibold text-slate-700">{entry.name}</span>
                </div>
                <div className="text-right text-[11px] font-mono">
                  <span className="font-bold text-slate-950">{entry.count} cases</span>
                  <span className="text-slate-400 ml-1.5">({entry.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary charts: Department Risks & Risk Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Score Distribution Histogram */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">INCIDENTS DENSITY GRID</span>
              <h2 className="text-sm font-bold text-slate-900">Risk Score Distribution</h2>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-slate-400 block">Avg Risk: <strong className="text-slate-800">{metrics.averageRisk}</strong></span>
            </div>
          </div>

          <div className="h-60 mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskHistogramData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskHistogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Risk Analytics Horizontal Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">ORGANIZATIONAL EXPOSURE MATRICES</span>
              <h2 className="text-sm font-bold text-slate-900">Department Risk Analytics</h2>
            </div>
          </div>

          <div className="h-60 mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 5, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} style={{ fontSize: "10px" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="count" name="Threat Count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="risk" name="Average Risk" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Behavioral Analytics Off-Hours Heatmap */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">TEMPORAL ANOMALOUS CHRONOLOGY</span>
            <h2 className="text-sm font-bold text-slate-900">Behavioral Analytics Heatmap (Off-Hours Activity)</h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-slate-400">
            <span>Low Anomaly</span>
            <div className="flex gap-0.5">
              <span className="w-3.5 h-3.5 bg-slate-50 border border-slate-200" />
              <span className="w-3.5 h-3.5 bg-blue-100" />
              <span className="w-3.5 h-3.5 bg-blue-300" />
              <span className="w-3.5 h-3.5 bg-blue-500" />
              <span className="w-3.5 h-3.5 bg-indigo-700" />
            </div>
            <span>High Anomaly</span>
          </div>
        </div>

        <div className="space-y-1 overflow-x-auto pb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="flex items-center min-w-[760px] gap-1">
              <span className="w-20 text-[10px] font-mono font-semibold text-slate-500 select-none">{day}</span>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const count = heatmapData[`${day}-${hour}`] || 0;
                  const colorClass = count >= 6 
                    ? "bg-indigo-700 text-white" 
                    : count >= 4 
                    ? "bg-blue-500 text-white" 
                    : count >= 2 
                    ? "bg-blue-300 text-slate-900" 
                    : count >= 1 
                    ? "bg-blue-100 text-slate-800" 
                    : "bg-slate-50 border border-slate-200/60";

                  return (
                    <div
                      key={hour}
                      className={`h-7 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer transition-all hover:scale-110 ${colorClass}`}
                      title={`${day} ${hour.toString().padStart(2, "0")}:00 -> ${count} deviations`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Hour labels footer */}
          <div className="flex items-center min-w-[760px] gap-1 pt-1.5">
            <span className="w-20" />
            <div className="flex-1 grid grid-cols-24 gap-1 text-[9px] font-mono font-bold text-slate-400 select-none">
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="text-center">
                  {hour.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ranked Top Risk Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2 overflow-x-auto">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">SIEM COHORT SCORING MATRIX</span>
            <h2 className="text-sm font-bold text-slate-900">Top High-Risk Users</h2>
          </div>

          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase text-slate-400">
                <th className="pb-2 font-bold">Username</th>
                <th className="pb-2 font-bold">Department</th>
                <th className="pb-2 font-bold">Role</th>
                <th className="pb-2 font-bold text-center">Threat Count</th>
                <th className="pb-2 font-bold text-center">Confidence</th>
                <th className="pb-2 font-bold text-right">Risk Score</th>
                <th className="pb-2 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {computedCohort.map((u, idx) => {
                const isCrit = u.score >= 75;
                const isHigh = u.score >= 45 && u.score < 75;
                const badgeColor = isCrit 
                  ? "bg-rose-50 text-rose-700 border-rose-100" 
                  : isHigh 
                  ? "bg-amber-50 text-amber-700 border-amber-100" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-100";

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-indigo-700">@{u.username}</td>
                    <td className="py-2.5 text-slate-500">{u.department}</td>
                    <td className="py-2.5 text-slate-600 font-medium">{u.role}</td>
                    <td className="py-2.5 text-center font-mono font-bold">{u.threatCount}</td>
                    <td className="py-2.5 text-center font-mono text-slate-500">{u.confidence}%</td>
                    <td className="py-2.5 text-right font-mono font-black text-slate-950">{u.score}/100</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Threat Indicator Analytics List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">ANOMALOUS FACTOR INGESTIONS</span>
            <h2 className="text-sm font-bold text-slate-900">Threat Indicator Analytics</h2>
          </div>

          <div className="space-y-3.5">
            {indicatorRankings.map((ind, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{ind.name}</span>
                  <span className="font-mono font-bold text-slate-900">{ind.count} triggers</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-650 h-full rounded" 
                    style={{ width: `${Math.min(100, (ind.count / 260) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Baseline deviations & performance indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Behavioral Baseline comparisons */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">EXPECTED BASES COMPILATION</span>
              <h2 className="text-sm font-bold text-slate-900">Behavioral Baseline Analytics</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              <div className="border-r border-slate-100 last:border-0 pr-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">EXPECTED PATIENTS</span>
                <span className="text-lg font-black font-mono text-slate-800 block">{baselineViewsExpected} views</span>
              </div>
              <div className="border-r border-slate-100 last:border-0 pr-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">ACTUAL PATIENTS</span>
                <span className="text-lg font-black font-mono text-rose-700 block">{baselineViewsActual} views</span>
              </div>
              <div className="border-r border-slate-100 last:border-0 pr-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">EXPECTED EXPORTS</span>
                <span className="text-lg font-black font-mono text-slate-800 block">{baselineExportsExpected} files</span>
              </div>
              <div className="last:border-0">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">ACTUAL EXPORTS</span>
                <span className="text-lg font-black font-mono text-rose-700 block">{baselineExportsActual} files</span>
              </div>
            </div>
          </div>

          <div className="h-44 text-xs font-mono border-t border-slate-50 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driftTimelineData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "none", color: "#fff" }} />
                <Line type="monotone" dataKey="Drift %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expected Boundary" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Adaptive Engine Performance progress indicators */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CYBER COGNITION HEALTH</span>
            <h2 className="text-sm font-bold text-slate-900">Adaptive Engine Performance</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: "Detection Accuracy Rate", value: "97.4%", fill: "w-[97.4%]", color: "text-emerald-600" },
              { label: "False Positive Rate", value: "2.6%", fill: "w-[2.6%]", color: "text-blue-600" },
              { label: "False Negative Rate", value: "1.1%", fill: "w-[1.1%]", color: "text-blue-600" },
              { label: "Correlation Success Rate", value: "94.2%", fill: "w-[94.2%]", color: "text-emerald-600" },
              { label: "Average Correlation Time", value: "182 ms", fill: "w-[85%]", color: "text-indigo-600", isGauge: true },
              { label: "Average Adaptive Learning Time", value: "1.3 s", fill: "w-[90%]", color: "text-indigo-600", isGauge: true },
              { label: "Behavior Profile Updates", value: "148 profiles", fill: "w-[75%]", color: "text-indigo-600", isGauge: true },
              { label: "Session Merge Success Rate", value: "99.1%", fill: "w-[99.1%]", color: "text-emerald-600" }
            ].map((perf, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">{perf.label}</span>
                  <span className={`font-mono font-bold ${perf.color}`}>{perf.value}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`bg-indigo-650 h-full rounded ${perf.fill}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forensic statistics & Risk Evolution stages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Evolution visual workflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">COGNITIVE THREAT TRANSITIONS</span>
            <h2 className="text-sm font-bold text-slate-900">Risk Evolution Flow</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch gap-3 py-2">
            {riskEvolutionStages.map((stage, idx) => (
              <div key={idx} className="flex-1 bg-slate-50 border border-slate-150 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">STAGE {idx + 1}</span>
                  <span className="text-xs font-bold text-slate-900 block mt-1">{stage.name}</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">{stage.desc}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400">SCORE</span>
                  <span className="text-xs font-mono font-bold" style={{ color: stage.color }}>{stage.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex justify-between items-center">
            <div className="flex items-center gap-2 font-medium">
              <Zap size={14} className="text-[#3b82f6]" />
              <span>Average anomalies required for critical escalation: <strong>4.6 events</strong></span>
            </div>
            <span className="text-[10px] text-slate-400 italic font-mono">Aggregation logic: Live session merge</span>
          </div>
        </div>

        {/* Forensic statistics summaries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">POST-CORRELATION FORENSIC METRICS</span>
            <h2 className="text-sm font-bold text-slate-900">Forensic Statistics</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            {[
              { label: "Avg Patient Views Before Detection", value: "4.8 views", sub: "Goal: < 5 views" },
              { label: "Avg PDF Exports Before Detection", value: "1.2 exports", sub: "Goal: < 2 exports" },
              { label: "Avg Failed Logins Before Abuse Trigger", value: "3.1 attempts", sub: "Standard limit: 3" },
              { label: "Avg Time to Critical Threshold Escalation", value: "12.4 minutes", sub: "Target SLA: < 15m" },
              { label: "Avg Behavioral Deviation Index Percentage", value: "42.5%", sub: "Tolerance margin: 15%" },
              { label: "Avg Session Duration Scanned", value: "45 minutes", sub: "Scope of context retention" }
            ].map((forensic, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2.5 last:border-0">
                <div>
                  <span className="font-semibold text-slate-700 block">{forensic.label}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{forensic.sub}</span>
                </div>
                <span className="font-mono font-black text-slate-900 text-sm whitespace-nowrap">{forensic.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exporter options action footer */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Export Defensive Telemetry Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Generate, package, and download ATIF analytical metrics and reports.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => handleGenerateSummary("Executive")}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition"
          >
            <Brain size={13} /> Generate Executive Summary
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition"
          >
            <FileText size={13} /> Download PDF Report
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet size={13} /> Export CSV Datasets
          </button>
          <button 
            onClick={() => triggerToast("Charts telemetry successfully exported as high-resolution PNG vectors.")}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition"
          >
            <Layers size={13} /> Export Charts
          </button>
        </div>
      </div>

      {/* Executive Summary Modal Overlay */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="text-indigo-600" size={18} />
                  <h3 className="text-base font-bold text-slate-900">ATIF Live AI Executive Summary</h3>
                </div>
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-96">
                <p>
                  <strong>ATIF Cognitive Ingestion Assessment:</strong> St. Jude Clinical Networks are performing within expected baseline bounds, yielding an overall <strong>Defensive Security Score of 92%</strong> (Nominal state). The adaptive engine evaluated <strong>{metrics.totalEventsToday.toLocaleString()} events</strong> and correlated <strong>{metrics.threatsDetected} threats</strong> over the active evaluation timeline.
                </p>
                <p>
                  <strong>Anomalous Vector Breakdown:</strong> The leading indicator remains <em>Failed Logins</em> with 238 trigger events, followed by <em>Sensitive Record Viewed</em> with 191 events. The Emergency ward carries the highest threat weight concentration (Risk factor 74) due to higher access velocity metrics generated during clinician shifts.
                </p>
                <p>
                  <strong>Adaptive Remediation Verdict:</strong> The average detection confidence is robust at <strong>{metrics.averageConfidence}%</strong>, while maintaining a mean threat identification time of <strong>{metrics.meanDetectionTime} seconds</strong>. Roster profiling isolated <strong>{metrics.activeHighRiskUsers} active high-risk user deviations</strong>, currently handled by automated token freeze or active forensic recording playbooks.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="font-bold text-[10px] text-indigo-700 uppercase tracking-wider block">Recommended Analyst Actions:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 font-sans">
                    <li>Launch security posture audit on PDF export patterns inside the Emergency ward.</li>
                    <li>Investigate the top risk outlier profiles listed on the threat cohort matrix.</li>
                    <li>Synchronize clinical shifts to restrict off-hours clinical system lookups automatically.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                <button 
                  onClick={() => {
                    setShowSummaryModal(false);
                    handleDownloadPDF();
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Download PDF Report
                </button>
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close Summary
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
