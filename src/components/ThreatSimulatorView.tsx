/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, CheckCircle, Database, Activity, Radio, Shield, 
  Terminal, ArrowRight, RefreshCw, Trash2, FileText, Users, 
  Sliders, PlayCircle, X, Download, Zap, Info, ShieldAlert,
  AlertTriangle, AlertOctagon, HelpCircle, LayoutGrid, Plus, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { HospitalRole, Patient, SecurityEvent, ThreatIncident, SimulationHistoryItem, SimulationReport } from '../types';

interface ThreatSimulatorViewProps {
  currentUser: {
    userId: string;
    username: string;
    fullName: string;
    role: HospitalRole;
    department: string;
    ipAddress: string;
    deviceName: string;
  } | null;
  patients: Patient[];
  incidents: ThreatIncident[];
  events: SecurityEvent[];
  onRefresh: () => void;
  onInvestigateId?: (incidentId: string) => void;
}

export default function ThreatSimulatorView({
  currentUser,
  patients,
  incidents,
  events,
  onRefresh,
  onInvestigateId
}: ThreatSimulatorViewProps) {
  const isReadOnly = currentUser?.role === HospitalRole.HOSPITAL_ADMIN;
  
  // App state
  const [staff, setStaff] = useState<any[]>([]);
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('CREDENTIAL_ABUSE');
  
  // Scenario Configs
  const [targetUser, setTargetUser] = useState<string>('dr_house');
  const [failedAttempts, setFailedAttempts] = useState<number>(4);
  const [useUnknownDevice, setUseUnknownDevice] = useState<boolean>(true);
  const [useUnknownIp, setUseUnknownIp] = useState<boolean>(true);
  const [offHoursLogin, setOffHoursLogin] = useState<boolean>(true);
  const [delayBetweenSteps, setDelayBetweenSteps] = useState<number>(800); // ms

  // Unauthorized Access Configs
  const [unauthorizedUser, setUnauthorizedUser] = useState<string>('accounts_alice');
  const [restrictedModule, setRestrictedModule] = useState<string>('Clinical Notes');

  // Insider Threat Configs
  const [insiderUser, setInsiderUser] = useState<string>('nurse_rached');
  const [recordsViewCount, setRecordsViewCount] = useState<number>(6);
  const [exportPdfReport, setExportPdfReport] = useState<boolean>(true);

  // Sensitive Patient Access Configs
  const [sensitiveUser, setSensitiveUser] = useState<string>('pharmacist_bob');
  const [targetPatientId, setTargetPatientId] = useState<string>('');
  const [clinicalJustification, setClinicalJustification] = useState<string>('No Active Outpatient Order Context');

  // Custom Simulation Configs
  const [customActions, setCustomActions] = useState<any[]>([
    { activityType: 'LOGIN_SUCCESS', description: 'User session authenticated', isSensitiveAccess: false, riskContribution: 0 },
    { activityType: 'PATIENT_SEARCH', description: 'Patient records folder search', isSensitiveAccess: false, riskContribution: 5 },
    { activityType: 'RECORD_VIEW', description: 'Viewed patient electronic clinical summary', isSensitiveAccess: false, riskContribution: 10 }
  ]);
  const [newActionType, setNewActionType] = useState<string>('RECORD_VIEW');
  const [newActionDesc, setNewActionDesc] = useState<string>('');
  const [newActionSensitive, setNewActionSensitive] = useState<boolean>(false);
  const [newActionRisk, setNewActionRisk] = useState<number>(10);

  // Active Simulation running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [lastSteps, setLastSteps] = useState<any[]>([]);
  
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const speedMultiplierRef = useRef<number>(1);
  const activeSessionIdRef = useRef<string>('');

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [simulationSteps, setSimulationSteps] = useState<any[]>([]);
  const [simulatedEvents, setSimulatedEvents] = useState<SecurityEvent[]>([]);
  const [triggeredIncidents, setTriggeredIncidents] = useState<ThreatIncident[]>([]);
  const [currentPipelineStage, setCurrentPipelineStage] = useState<string>('IDLE'); // "SIMULATOR" | "SIEM" | "BASELINE" | "SCORING" | "CORRELATION" | "FEED" | "IDLE"
  const [startTime, setStartTime] = useState<number>(0);
  const [activeSimName, setActiveSimName] = useState<string>('');

  // Selected report modal state
  const [selectedReport, setSelectedReport] = useState<SimulationHistoryItem | null>(null);

  useEffect(() => {
    fetchStaff();
    fetchSimulationHistory();
  }, []);

  useEffect(() => {
    if (patients.length > 0 && !targetPatientId) {
      const vip = patients.find((p: any) => p.isVip || p.isStaff);
      setTargetPatientId(vip ? vip.id : patients[0].id);
    }
  }, [patients]);

  const fetchStaff = async () => {
    try {
      const staffRes = await fetch('/api/staff');
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : (staffData.staff || []));
      }
    } catch (e) {
      console.error("Error fetching staff for simulator:", e);
    }
  };

  const fetchSimulationHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/simulations');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : (data.simulations || []));
      }
    } catch (e) {
      console.error("Error fetching simulation history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (isReadOnly) return;
    if (window.confirm("Are you sure you want to clear the Simulation audit history?")) {
      try {
        await fetch('/api/security/simulations/clear', { method: 'POST' });
        setHistory([]);
      } catch (e) {
        console.error("Failed to clear simulation logs:", e);
      }
    }
  };

  // Compile actions for built-in template scenarios
  const buildScenarioSteps = () => {
    const steps: any[] = [];
    const ip = useUnknownIp ? '185.190.140.22' : '10.20.1.104';
    const device = useUnknownDevice ? 'Home Mobile iPad' : 'Authorized Office Workstation';
    
    if (selectedTemplate === 'CREDENTIAL_ABUSE') {
      const userObj = staff.find(s => s.username === targetUser) || { id: 'EMP-002', fullName: 'Gregory House', role: HospitalRole.DOCTOR };
      
      // Log failed login steps
      for (let i = 0; i < failedAttempts; i++) {
        steps.push({
          userId: userObj.id,
          username: targetUser,
          role: userObj.role,
          activityType: 'LOGIN_FAILED',
          description: `Authentication failed (Invalid password guess). Step ${i + 1} of ${failedAttempts}. Source IP: ${ip}`,
          ipAddress: ip,
          deviceName: device,
          isSensitiveAccess: false,
          riskContribution: 10
        });
      }

      // Successful login step
      steps.push({
        userId: userObj.id,
        username: targetUser,
        role: userObj.role,
        activityType: 'LOGIN_SUCCESS',
        description: `Successful user authentication established after ${failedAttempts} failed attempts from anomalous device.`,
        ipAddress: ip,
        deviceName: device,
        isSensitiveAccess: false,
        riskContribution: 25
      });

      // Suspicious post-login view step
      steps.push({
        userId: userObj.id,
        username: targetUser,
        role: userObj.role,
        activityType: 'RECORD_VIEW',
        description: `Electronic patient record view on VIP senator file (unconfirmed context).`,
        ipAddress: ip,
        deviceName: device,
        isSensitiveAccess: true,
        riskContribution: 30
      });
    } 
    else if (selectedTemplate === 'UNAUTHORIZED_ACCESS') {
      const userObj = staff.find(s => s.username === unauthorizedUser) || { id: 'EMP-007', fullName: 'Alice Sterling', role: HospitalRole.ACCOUNTS_OFFICER };
      
      steps.push({
        userId: userObj.id,
        username: unauthorizedUser,
        role: userObj.role,
        activityType: 'LOGIN_SUCCESS',
        description: `User authenticated on standard internal network zone.`,
        ipAddress: '10.20.7.10',
        deviceName: 'Finance-Workstation-02',
        isSensitiveAccess: false,
        riskContribution: 0
      });

      steps.push({
        userId: userObj.id,
        username: unauthorizedUser,
        role: userObj.role,
        activityType: 'MODULE_ACCESS',
        description: `Attempted navigation to restricted medical EHR module: ${restrictedModule}.`,
        ipAddress: '10.20.7.10',
        deviceName: 'Finance-Workstation-02',
        isSensitiveAccess: false,
        riskContribution: 15
      });

      steps.push({
        userId: userObj.id,
        username: unauthorizedUser,
        role: userObj.role,
        activityType: 'ACCESS_DENIED',
        description: `Access denied by RBAC rule: Accounts Officer has no permissions to read clinical dossier logs.`,
        ipAddress: '10.20.7.10',
        deviceName: 'Finance-Workstation-02',
        isSensitiveAccess: false,
        riskContribution: 30
      });

      // Direct clinical dossier patient view breach
      const vipPatient = patients.find(p => p.isVip || p.isStaff) || { id: 'HIS-001', fullName: 'Harold Potter' };
      steps.push({
        userId: userObj.id,
        username: unauthorizedUser,
        role: userObj.role,
        activityType: 'RECORD_VIEW',
        description: `Bypassed core clinical check to view medical file of patient: ${vipPatient.fullName}.`,
        ipAddress: '10.20.7.10',
        deviceName: 'Finance-Workstation-02',
        isSensitiveAccess: true,
        resourceId: vipPatient.id,
        riskContribution: 45
      });
    }
    else if (selectedTemplate === 'INSIDER_THREAT') {
      const userObj = staff.find(s => s.username === insiderUser) || { id: 'EMP-003', fullName: 'Mildred Rached', role: HospitalRole.NURSE };
      
      steps.push({
        userId: userObj.id,
        username: insiderUser,
        role: userObj.role,
        activityType: 'LOGIN_SUCCESS',
        description: `Clinical user session initiated. Off-hours status: ${offHoursLogin ? 'True' : 'False'}`,
        ipAddress: offHoursLogin ? '172.56.21.84' : '10.20.3.11',
        deviceName: offHoursLogin ? 'Personal iPad Pro' : 'Ward Desk iMac-04',
        isSensitiveAccess: false,
        riskContribution: offHoursLogin ? 15 : 0
      });

      steps.push({
        userId: userObj.id,
        username: insiderUser,
        role: userObj.role,
        activityType: 'PATIENT_SEARCH',
        description: `Cross-ward global patient diagnostic register database query.`,
        ipAddress: offHoursLogin ? '172.56.21.84' : '10.20.3.11',
        deviceName: offHoursLogin ? 'Personal iPad Pro' : 'Ward Desk iMac-04',
        isSensitiveAccess: false,
        riskContribution: 10
      });

      // Generate bulk patient record views
      const limit = Math.min(recordsViewCount, patients.length || 5);
      for (let i = 0; i < limit; i++) {
        const patientObj = patients[i] || { id: `HIS-00${i+1}`, fullName: 'Sample Patient', isVip: i === 0, isStaff: false };
        steps.push({
          userId: userObj.id,
          username: insiderUser,
          role: userObj.role,
          activityType: 'RECORD_VIEW',
          description: `Viewed electronic clinical history dossier for patient: ${patientObj.fullName}.`,
          ipAddress: offHoursLogin ? '172.56.21.84' : '10.20.3.11',
          deviceName: offHoursLogin ? 'Personal iPad Pro' : 'Ward Desk iMac-04',
          isSensitiveAccess: patientObj.isVip || patientObj.isStaff || false,
          resourceId: patientObj.id,
          riskContribution: (patientObj.isVip || patientObj.isStaff) ? 20 : 8
        });
      }

      if (exportPdfReport) {
        steps.push({
          userId: userObj.id,
          username: insiderUser,
          role: userObj.role,
          activityType: 'PATIENT_RECORD_EXPORTED',
          description: `Compiled bulk clinical dashboard database and downloaded as PDF report. Deviation index elevated.`,
          ipAddress: offHoursLogin ? '172.56.21.84' : '10.20.3.11',
          deviceName: offHoursLogin ? 'Personal iPad Pro' : 'Ward Desk iMac-04',
          isSensitiveAccess: true,
          riskContribution: 40
        });
      }
    }
    else if (selectedTemplate === 'SENSITIVE_RECORD_ACCESS') {
      const userObj = staff.find(s => s.username === sensitiveUser) || { id: 'EMP-006', fullName: 'Robert Apothecary', role: HospitalRole.PHARMACIST };
      const targetPatient = patients.find(p => p.id === targetPatientId) || { id: 'HIS-001', fullName: 'Harold Potter', isVip: true };

      steps.push({
        userId: userObj.id,
        username: sensitiveUser,
        role: userObj.role,
        activityType: 'LOGIN_SUCCESS',
        description: `Pharmacist authenticated on central dispenser terminal.`,
        ipAddress: '10.20.6.30',
        deviceName: 'Pharmacy dispenser workstation',
        isSensitiveAccess: false,
        riskContribution: 0
      });

      steps.push({
        userId: userObj.id,
        username: sensitiveUser,
        role: userObj.role,
        activityType: 'RECORD_VIEW',
        description: `Direct EHR retrieval of sensitive record (Patient ID: ${targetPatient.id}, Name: ${targetPatient.fullName}). Clinical Context: ${clinicalJustification}.`,
        ipAddress: '10.20.6.30',
        deviceName: 'Pharmacy dispenser workstation',
        isSensitiveAccess: true,
        resourceId: targetPatient.id,
        riskContribution: 35
      });
    }
    else {
      // CUSTOM SCENARIO
      const userObj = staff.find(s => s.username === targetUser) || { id: 'EMP-001', fullName: 'Elena Rostova', role: HospitalRole.HIM_OFFICER };
      customActions.forEach((act, idx) => {
        steps.push({
          userId: userObj.id,
          username: targetUser,
          role: userObj.role,
          activityType: act.activityType,
          description: `${act.description} (Custom sequence #${idx + 1})`,
          ipAddress: useUnknownIp ? '185.190.140.22' : '10.20.1.15',
          deviceName: useUnknownDevice ? 'Home Mobile iPad' : 'Authorized Office Workstation',
          isSensitiveAccess: act.isSensitiveAccess,
          riskContribution: act.riskContribution,
          resourceId: act.resourceId
        });
      });
    }

    return steps;
  };

  const handleRunSimulation = async () => {
    if (isReadOnly || isRunning) return;

    const steps = buildScenarioSteps();
    if (steps.length === 0) {
      alert("Please add at least one step or configuration for the custom simulation scenario builder.");
      return;
    }

    setLastSteps(steps);

    // Create unique Session ID for correlation
    const sessionIdVal = `ATIF-SESSION-${Math.floor(10000 + Math.random() * 89900)}`;
    setActiveSessionId(sessionIdVal);
    activeSessionIdRef.current = sessionIdVal;

    // Initialize Active Simulation states
    setIsRunning(true);
    isRunningRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setSimulationSteps(steps);
    setCurrentStepIndex(0);
    setSimulatedEvents([]);
    setTriggeredIncidents([]);
    setStartTime(Date.now());
    
    const templateName = selectedTemplate === 'CREDENTIAL_ABUSE' ? 'Credential Abuse Simulator'
                     : selectedTemplate === 'UNAUTHORIZED_ACCESS' ? 'Restricted Boundary Breach'
                     : selectedTemplate === 'INSIDER_THREAT' ? 'Insider Threat Exfiltration'
                     : selectedTemplate === 'SENSITIVE_RECORD_ACCESS' ? 'Sensitive Patient Record Audit'
                     : 'Custom Attack Sequence Simulation';
                     
    setActiveSimName(templateName);
    setCurrentPipelineStage('SIMULATOR');

    executeStepSequentially(steps, 0, [], []);
  };

  const executeStepSequentially = async (steps: any[], index: number, eventAccumulator: SecurityEvent[], incidentAccumulator: ThreatIncident[]) => {
    if (!isRunningRef.current) {
      return;
    }

    if (isPausedRef.current) {
      setTimeout(() => {
        executeStepSequentially(steps, index, eventAccumulator, incidentAccumulator);
      }, 200);
      return;
    }

    if (index >= steps.length) {
      await finalizeSimulation(eventAccumulator, incidentAccumulator);
      return;
    }

    setCurrentStepIndex(index);
    const step = { 
      ...steps[index], 
      sessionId: activeSessionIdRef.current,
      timestamp: new Date().toISOString()
    };

    // Animate the processing pipeline
    setTimeout(() => setCurrentPipelineStage('SIEM'), 100);
    setTimeout(() => setCurrentPipelineStage('BASELINE'), 300);
    setTimeout(() => setCurrentPipelineStage('SCORING'), 500);
    setTimeout(() => setCurrentPipelineStage('CORRELATION'), 650);

    try {
      const res = await fetch('/api/security/simulations/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step)
      });

      if (res.ok) {
        const data = await res.json();
        
        // Add generated event
        const updatedEvents = [...eventAccumulator, data.event];
        setSimulatedEvents(updatedEvents);

        // Add any newly triggered incidents
        let updatedIncidents = [...incidentAccumulator];
        if (data.newIncidents && data.newIncidents.length > 0) {
          updatedIncidents = [...updatedIncidents, ...data.newIncidents];
          setTriggeredIncidents(updatedIncidents);
          setCurrentPipelineStage('FEED');
        }

        // Delay before moving to the next step
        const delay = Math.max(100, delayBetweenSteps / speedMultiplierRef.current);
        setTimeout(() => {
          executeStepSequentially(steps, index + 1, updatedEvents, updatedIncidents);
        }, delay);
      } else {
        console.error("Step execution failed:", step);
        setIsRunning(false);
        isRunningRef.current = false;
        setCurrentPipelineStage('IDLE');
        alert("Simulation step execution failed. Check console or server logs.");
      }
    } catch (e) {
      console.error("Failed to run simulation step:", e);
      setIsRunning(false);
      isRunningRef.current = false;
      setCurrentPipelineStage('IDLE');
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };

  const handleResume = () => {
    setIsPaused(false);
    isPausedRef.current = false;
  };

  const handleStop = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentPipelineStage('IDLE');
  };

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentStepIndex(-1);
    setSimulationSteps([]);
    setSimulatedEvents([]);
    setTriggeredIncidents([]);
    setCurrentPipelineStage('IDLE');
    setActiveSessionId('');
    activeSessionIdRef.current = '';
  };

  const handleSpeedMultiplierChange = (val: number) => {
    setSpeedMultiplier(val);
    speedMultiplierRef.current = val;
  };

  const handleRandomScenario = () => {
    if (isReadOnly || isRunning) return;
    
    const templates = ['CREDENTIAL_ABUSE', 'UNAUTHORIZED_ACCESS', 'INSIDER_THREAT', 'SENSITIVE_RECORD_ACCESS'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    setSelectedTemplate(randomTemplate);
    
    setUseUnknownIp(Math.random() > 0.4);
    setUseUnknownDevice(Math.random() > 0.4);
    setOffHoursLogin(Math.random() > 0.5);
    
    if (randomTemplate === 'CREDENTIAL_ABUSE') {
      const candidates = ['dr_house', 'nurse_rached', 'rad_officer'];
      setTargetUser(candidates[Math.floor(Math.random() * candidates.length)]);
      setFailedAttempts(Math.floor(3 + Math.random() * 3));
    } else if (randomTemplate === 'UNAUTHORIZED_ACCESS') {
      const candidates = ['accounts_alice', 'pharmacist_bob', 'lab_scientist'];
      setUnauthorizedUser(candidates[Math.floor(Math.random() * candidates.length)]);
      const modules = ['Clinical Notes', 'Radiology Reports', 'Pharmacy Dispensation', 'Nursing Care Dashboard'];
      setRestrictedModule(modules[Math.floor(Math.random() * modules.length)]);
    } else if (randomTemplate === 'INSIDER_THREAT') {
      const candidates = ['nurse_rached', 'dr_house', 'rad_officer'];
      setInsiderUser(candidates[Math.floor(Math.random() * candidates.length)]);
      setRecordsViewCount(Math.floor(5 + Math.random() * 6));
      setExportPdfReport(Math.random() > 0.3);
    } else if (randomTemplate === 'SENSITIVE_RECORD_ACCESS') {
      const candidates = ['pharmacist_bob', 'lab_scientist', 'him_officer'];
      setSensitiveUser(candidates[Math.floor(Math.random() * candidates.length)]);
      if (patients.length > 0) {
        const vips = patients.filter((p: any) => p.isVip || p.isStaff || p.sensitivity === "HIGHLY_SENSITIVE" || p.sensitivity === "RESTRICTED");
        if (vips.length > 0) {
          setTargetPatientId(vips[Math.floor(Math.random() * vips.length)].id);
        }
      }
      const justifications = [
        'No Active Outpatient Order Context',
        'Routine VIP Care Baseline Checking',
        'Cross-Department Inquiry',
        'Unscheduled Emergency Trauma Assessment'
      ];
      setClinicalJustification(justifications[Math.floor(Math.random() * justifications.length)]);
    }
    
    setTimeout(() => {
      handleRunSimulation();
    }, 100);
  };

  const handleReplayPreviousSession = () => {
    if (isReadOnly || isRunning) return;
    if (lastSteps.length === 0) {
      alert("No previous session found in this browser state. Run a simulation first!");
      return;
    }
    
    const steps = [...lastSteps];
    const sId = `ATIF-SESSION-${Math.floor(10000 + Math.random() * 89900)}`;
    setActiveSessionId(sId);
    activeSessionIdRef.current = sId;
    
    setIsRunning(true);
    isRunningRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setSimulationSteps(steps);
    setCurrentStepIndex(0);
    setSimulatedEvents([]);
    setTriggeredIncidents([]);
    setStartTime(Date.now());
    
    setActiveSimName(activeSimName || "Replayed Session Simulation");
    setCurrentPipelineStage('SIMULATOR');
    
    executeStepSequentially(steps, 0, [], []);
  };

  const finalizeSimulation = async (events: SecurityEvent[], incidents: ThreatIncident[]) => {
    const duration = Date.now() - startTime;
    setIsRunning(false);
    setCurrentPipelineStage('IDLE');
    
    // Determine the main threat generated
    const incident = incidents[0]; // Take the first detected threat if any
    const threatGenerated = incident ? incident.title : "None";
    const incidentId = incident ? incident.id : undefined;
    const maxScore = incident ? incident.riskScore : Math.max(0, ...events.map(e => e.riskContribution));
    const confidence = incident ? (incident.confidenceScore || 75) : 0;

    // Retrieve default baseline for the user to compare
    const activeUser = events[0]?.username || targetUser;
    const userProfile = staff.find(s => s.username === activeUser) || { id: 'EMP-002', fullName: 'Gregory House', role: HospitalRole.DOCTOR, averageDailyAccessLimit: 15 };
    const baselineDailyViews = userProfile.averageDailyAccessLimit || 15;
    
    // Calculate observed views count during simulation
    const observedDailyViews = events.filter(e => e.activityType === 'RECORD_VIEW').length;
    const deviationPercent = observedDailyViews > 0 
      ? Math.round(((observedDailyViews - baselineDailyViews) / baselineDailyViews) * 100)
      : (selectedTemplate === 'INSIDER_THREAT' ? 180 : (selectedTemplate === 'CREDENTIAL_ABUSE' ? 150 : (selectedTemplate === 'UNAUTHORIZED_ACCESS' ? 200 : 250)));

    const report: SimulationReport = {
      simulationName: activeSimName,
      targetUser: events[0]?.username || 'simulated_user',
      targetRole: events[0]?.role || HospitalRole.NURSE,
      generatedEvents: events,
      baselineDailyViews,
      observedDailyViews,
      baselineDeviationPercent: deviationPercent,
      triggeredIndicators: incident ? (incident.triggeredIndicators || ["Off-Hours Access Deviation"]) : ["None Detected"],
      riskScore: maxScore,
      confidenceScore: confidence,
      detectionTimeMs: duration > 1000 ? Math.round(duration / 100) * 100 : duration,
      threatGenerated,
      incidentId,
      expectedLogin: selectedTemplate === 'CREDENTIAL_ABUSE' ? "08:00 - 17:00" : "Normal clinical shifts",
      actualLogin: offHoursLogin ? "02:15 AM (ANOMALOUS OFF-HOURS)" : "Normal working hours",
      expectedDevice: "Authorized Office Desktop",
      actualDevice: useUnknownDevice ? "Home iPad / External Remote Console" : "Authorized Desk iMac-04",
      sensitivityLevel: selectedTemplate === 'SENSITIVE_RECORD_ACCESS' ? "HIGHLY_SENSITIVE (VIP Patient Dossier)" : "NORMAL",
      clinicalContext: selectedTemplate === 'SENSITIVE_RECORD_ACCESS' ? clinicalJustification : "Simulation testing script"
    };

    const newHistoryItem: SimulationHistoryItem = {
      id: `SIM-${Math.floor(1000 + Math.random() * 8999)}`,
      timestamp: new Date().toISOString(),
      name: activeSimName,
      targetUser: report.targetUser,
      targetRole: report.targetRole,
      threatGenerated,
      incidentId,
      riskScore: report.riskScore,
      confidenceScore: report.confidenceScore,
      executionTimeMs: duration,
      status: "Completed",
      eventsCount: events.length,
      report
    };

    try {
      const res = await fetch('/api/security/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHistoryItem)
      });
      if (res.ok) {
        // Refresh dashboard data
        fetchSimulationHistory();
        onRefresh();
        
        // Open the simulation report instantly for feedback!
        setSelectedReport(newHistoryItem);
      }
    } catch (e) {
      console.error("Failed to store simulation audit:", e);
    }
  };

  const handleAddCustomAction = () => {
    const newAct = {
      activityType: newActionType,
      description: newActionDesc || `Simulated ${newActionType.replace('_', ' ').toLowerCase()}`,
      isSensitiveAccess: newActionSensitive,
      riskContribution: newActionRisk
    };
    setCustomActions([...customActions, newAct]);
    setNewActionDesc('');
  };

  const handleRemoveCustomAction = (index: number) => {
    const updated = [...customActions];
    updated.splice(index, 1);
    setCustomActions(updated);
  };

  const handleExportPDF = (item: SimulationHistoryItem) => {
    if (!item.report) return;
    
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ATIF Threat Simulation Forensics Report", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report ID: ${item.id}`, 20, 30);
    doc.text(`Timestamp: ${new Date(item.timestamp).toLocaleString()}`, 20, 36);
    doc.text(`Scenario Name: ${item.name}`, 20, 42);
    doc.text(`Target User: @${item.targetUser} (${item.targetRole})`, 20, 48);
    
    doc.line(20, 54, 190, 54);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("1. Detection Analysis Summary", 20, 64);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Threat Correlated: ${item.threatGenerated}`, 20, 71);
    doc.text(`Adaptive Risk Score: ${item.riskScore}/100`, 20, 77);
    doc.text(`Detection Confidence: ${item.confidenceScore}%`, 20, 83);
    doc.text(`Execution/Triage Duration: ${item.report.detectionTimeMs} ms`, 20, 89);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("2. Baseline Comparison Matrix", 20, 102);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Expected Daily Patient Views: ${item.report.baselineDailyViews} views`, 20, 109);
    doc.text(`Observed Simulated Patient Views: ${item.report.observedDailyViews} views`, 20, 115);
    doc.text(`Baseline Deviation Index: ${item.report.baselineDeviationPercent}%`, 20, 121);
    doc.text(`Expected Login Window: ${item.report.expectedLogin}`, 20, 127);
    doc.text(`Simulated Login Window: ${item.report.actualLogin}`, 20, 133);
    doc.text(`Expected Devices: ${item.report.expectedDevice}`, 20, 139);
    doc.text(`Observed Devices: ${item.report.actualDevice}`, 20, 145);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("3. Matching ATIF Behavioral Indicators", 20, 158);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    item.report.triggeredIndicators.forEach((ind, index) => {
      doc.text(`- ${ind}`, 20, 165 + (index * 6));
    });

    doc.line(20, 200, 190, 200);
    doc.setFontSize(9);
    doc.text("St. Jude Medical Central Health System • ATIF Sandbox Module", 20, 208);
    
    doc.save(`atif-forensics-report-${item.id}.pdf`);
  };

  // Get dynamic average stats for KPI cards
  const completedCount = history.length;
  const runningCount = isRunning ? 1 : 0;
  const totalEvents = history.reduce((sum, item) => sum + (item.eventsCount || 0), 0) + simulatedEvents.length;
  const totalThreats = history.filter(item => item.threatGenerated !== 'None').length;
  const avgDetectionTime = completedCount > 0
    ? (history.reduce((sum, item) => sum + (item.executionTimeMs || 0), 0) / completedCount / 1000).toFixed(1) + 's'
    : '0s';

  return (
    <div className="space-y-6 text-left" id="threat-simulation-engine-main">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#101927] p-6 rounded-2xl border border-[#1e293b]/50 text-slate-200 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest">
              ATIF Sandbox
            </div>
            {isReadOnly && (
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 font-mono text-[10px] font-bold uppercase">
                Read-Only Access
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">EHR Behavior & Threat Simulation Engine</h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Simulate granular clinical transactions, network authorizations, and user actions. The Adaptive Threat Intelligence Framework (ATIF) will ingest these actions to profile anomalies and correlate threats organically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSimulationHistory}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-[#1e293b] rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Reload database telemetry"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Sync Data
          </button>
          {!isReadOnly && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 hover:border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 size={13} /> Clear History
            </button>
          )}
        </div>
      </div>

      {/* Top KPI Cards (Bento Style) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="sim-kpi-grid">
        {[
          { label: 'Running Simulations', value: runningCount, icon: Activity, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Completed Runs', value: completedCount, icon: CheckCircle, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Generated SIEM Events', value: totalEvents, icon: Database, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Detected Security Threats', value: totalThreats, icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10' },
          { label: 'Average Detection Time', value: avgDetectionTime, icon: Zap, color: 'text-amber-400 bg-amber-500/10' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-xl p-4 flex flex-col justify-between h-24 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono font-medium tracking-wider uppercase">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.color}`}>
                  <Icon size={12} />
                </div>
              </div>
              <span className="text-xl font-bold text-white tracking-tight mt-1">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Main Core Panels layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sim-panels-wrapper">
        
        {/* LEFT PANEL: Simulation Templates (4 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-xl p-4 shadow-sm text-left">
            <div className="flex items-center gap-2 border-b border-[#1e293b]/30 pb-3 mb-3">
              <Sliders className="text-emerald-500" size={15} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Simulation Templates</h3>
            </div>
            
            <div className="space-y-1.5">
              {[
                { id: 'CREDENTIAL_ABUSE', name: 'Credential Abuse', desc: 'Simulates brute-force, off-hours access, and mobile logins.' },
                { id: 'UNAUTHORIZED_ACCESS', name: 'Unauthorized Access', desc: 'Simulates role scope violations and denied routes.' },
                { id: 'INSIDER_THREAT', name: 'Insider Threat', desc: 'Simulates clinical bulk harvesting and PDF exfiltration.' },
                { id: 'SENSITIVE_RECORD_ACCESS', name: 'Sensitive Record Access', desc: 'Simulates target access on classified VIP profiles.' },
                { id: 'CUSTOM', name: 'Custom Simulation', desc: 'Build an ordered timeline chain with custom events.' }
              ].map((tpl) => {
                const isActive = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      if (!isRunning) setSelectedTemplate(tpl.id);
                    }}
                    disabled={isRunning}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-1 ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold' 
                        : 'bg-transparent border-[#1e293b]/30 hover:border-[#1e293b] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-semibold block">{tpl.name}</span>
                    <span className="text-[10px] text-slate-400 leading-normal block font-normal">{tpl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Scenario Builder (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-xl p-5 shadow-sm min-h-[380px] flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between border-b border-[#1e293b]/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="text-emerald-500" size={16} />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Scenario Configuration</h3>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-slate-800 text-slate-400 font-bold uppercase border border-[#1e293b]/40">
                  {selectedTemplate.replace('_', ' ')}
                </span>
              </div>

              {/* Template Parameters Container */}
              <div className="space-y-4 text-xs">
                {selectedTemplate === 'CREDENTIAL_ABUSE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Target User Profile</label>
                        <select
                          value={targetUser}
                          onChange={(e) => setTargetUser(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          <option value="dr_house">Gregory House (Doctor)</option>
                          <option value="nurse_rached">Mildred Rached (Nurse)</option>
                          <option value="pharmacist_bob">Robert Apothecary (Pharmacist)</option>
                          <option value="accounts_alice">Alice Sterling (Accounts Officer)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Failed Login Attempts</label>
                        <select
                          value={failedAttempts}
                          onChange={(e) => setFailedAttempts(Number(e.target.value))}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          {[2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num} Times</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-[#1e293b]/20">
                        <div>
                          <p className="font-semibold text-slate-200">Unrecognized Remote Device</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Simulate access via non-baseline mobile hardware.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={useUnknownDevice}
                          onChange={(e) => setUseUnknownDevice(e.target.checked)}
                          disabled={isRunning || isReadOnly}
                          className="w-4 h-4 accent-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer text-left"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-[#1e293b]/20">
                        <div>
                          <p className="font-semibold text-slate-200">Anomalous IP Signature</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Route requests through external untrusted subnets.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={useUnknownIp}
                          onChange={(e) => setUseUnknownIp(e.target.checked)}
                          disabled={isRunning || isReadOnly}
                          className="w-4 h-4 accent-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer text-left"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedTemplate === 'UNAUTHORIZED_ACCESS' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Intruding User</label>
                        <select
                          value={unauthorizedUser}
                          onChange={(e) => setUnauthorizedUser(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          <option value="accounts_alice">Alice Sterling (Accounts Officer)</option>
                          <option value="pharmacist_bob">Robert Apothecary (Pharmacist)</option>
                          <option value="it_admin">EMP-IT (IT Administrator)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Restricted Module</label>
                        <select
                          value={restrictedModule}
                          onChange={(e) => setRestrictedModule(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          <option value="Clinical Notes">EHR Patient Clinical Notes</option>
                          <option value="Intensive Care Unit">ICU Bed Telemetry</option>
                          <option value="Pharmacology Dispenser">Controlled Substances Ledger</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[11px] text-slate-400 leading-relaxed mt-2 text-left">
                      <div className="flex gap-2 text-rose-400 font-bold mb-1">
                        <ShieldAlert size={14} />
                        <span>ATIF Enforcement Boundary:</span>
                      </div>
                      This simulation validates that clinical access filters block non-clinical workers from sensitive folders and triggers an unauthorized perimeter violation alert.
                    </div>
                  </>
                )}

                {selectedTemplate === 'INSIDER_THREAT' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Authorized Insider User</label>
                        <select
                          value={insiderUser}
                          onChange={(e) => setInsiderUser(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          <option value="nurse_rached">Mildred Rached (Nurse)</option>
                          <option value="dr_house">Gregory House (Doctor)</option>
                          <option value="him_officer">Elena Rostova (HIM Officer)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Records Viewed Count</label>
                        <select
                          value={recordsViewCount}
                          onChange={(e) => setRecordsViewCount(Number(e.target.value))}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          {[3, 5, 6, 8, 10].map(num => (
                            <option key={num} value={num}>{num} Dossiers</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-[#1e293b]/20">
                        <div>
                          <p className="font-semibold text-slate-200">Anomalous Off-Hours Timing</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Run tasks at 02:15 AM (deviating from roster start/end).</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={offHoursLogin}
                          onChange={(e) => setOffHoursLogin(e.target.checked)}
                          disabled={isRunning || isReadOnly}
                          className="w-4 h-4 accent-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer text-left"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-[#1e293b]/20">
                        <div>
                          <p className="font-semibold text-slate-200">PDF Document Export (Exfiltration)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Trigger a bulk file compiled download action.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={exportPdfReport}
                          onChange={(e) => setExportPdfReport(e.target.checked)}
                          disabled={isRunning || isReadOnly}
                          className="w-4 h-4 accent-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer text-left"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedTemplate === 'SENSITIVE_RECORD_ACCESS' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Accessing User</label>
                      <select
                        value={sensitiveUser}
                        onChange={(e) => setSensitiveUser(e.target.value)}
                        disabled={isRunning || isReadOnly}
                        className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                      >
                        <option value="pharmacist_bob">Robert Apothecary (Pharmacist)</option>
                        <option value="nurse_rached">Mildred Rached (Nurse)</option>
                        <option value="accounts_alice">Alice Sterling (Accounts Officer)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Target Patient Record</label>
                        <select
                          value={targetPatientId}
                          onChange={(e) => setTargetPatientId(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.fullName} ({p.isVip ? 'VIP' : p.isStaff ? 'Staff' : 'Normal'})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Clinical Workflow Justification</label>
                        <select
                          value={clinicalJustification}
                          onChange={(e) => setClinicalJustification(e.target.value)}
                          disabled={isRunning || isReadOnly}
                          className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                        >
                          <option value="No Active Outpatient Order Context">Missing Active Order Match</option>
                          <option value="Scheduled Ward Care Delivery">Scheduled Ward Medication Round</option>
                          <option value="Clinical Audit Review Request">Executive Quality Review</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-slate-400 leading-relaxed mt-2 text-left">
                      <div className="flex gap-2 text-amber-400 font-bold mb-1">
                        <Info size={14} />
                        <span>Adaptive Triage Note:</span>
                      </div>
                      Retrievals of restricted VIP records are evaluated against patient sensitivity labels and the active user context. Accesses without active orders trigger high-confidence incidents.
                    </div>
                  </>
                )}

                {selectedTemplate === 'CUSTOM' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Select Target Operator</label>
                      <select
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                        disabled={isRunning || isReadOnly}
                        className="w-full bg-slate-900 border border-[#1e293b]/50 rounded-lg p-2 text-slate-200 focus:outline-none"
                      >
                        <option value="dr_house">Gregory House (Doctor)</option>
                        <option value="nurse_rached">Mildred Rached (Nurse)</option>
                        <option value="accounts_alice">Alice Sterling (Accounts Officer)</option>
                        <option value="it_admin">EMP-IT (IT Admin)</option>
                      </select>
                    </div>

                    {/* Custom action list */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Scenario Action Timeline</label>
                      <div className="bg-slate-950/80 border border-[#1e293b]/40 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                        {customActions.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic block p-4 text-center">No steps configured. Add custom actions below.</span>
                        ) : (
                          customActions.map((act, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#0b0e14]/60 border border-[#1e293b]/20 px-2.5 py-1.5 rounded-lg text-[10.5px]">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[9px]">{idx + 1}</span>
                                <span className="font-mono text-emerald-400">{act.activityType}</span>
                                <span className="text-slate-450 truncate max-w-44 text-left">— {act.description}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveCustomAction(idx)}
                                className="text-rose-400 hover:text-rose-500 transition-colors p-1"
                                disabled={isRunning || isReadOnly}
                                title="Remove Step"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Custom Action Builder inputs */}
                    {!isReadOnly && (
                      <div className="p-3 bg-slate-900/60 border border-[#1e293b]/30 rounded-xl space-y-2.5 text-left">
                        <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider leading-none">Add Activity Step</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newActionType}
                            onChange={(e) => setNewActionType(e.target.value)}
                            className="bg-slate-950 border border-[#1e293b]/40 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none text-left"
                          >
                            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                            <option value="RECORD_VIEW">RECORD_VIEW</option>
                            <option value="PATIENT_SEARCH">PATIENT_SEARCH</option>
                            <option value="PATIENT_RECORD_EXPORTED">RECORD_EXPORTED</option>
                            <option value="MODULE_ACCESS">MODULE_ACCESS</option>
                            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
                          </select>
                          <input
                            type="text"
                            value={newActionDesc}
                            onChange={(e) => setNewActionDesc(e.target.value)}
                            placeholder="Description (optional)..."
                            className="bg-slate-950 border border-[#1e293b]/40 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <label className="flex items-center gap-1.5 text-slate-400">
                            <input
                              type="checkbox"
                              checked={newActionSensitive}
                              onChange={(e) => setNewActionSensitive(e.target.checked)}
                              className="accent-emerald-500 rounded bg-slate-900"
                            />
                            Is Sensitive File?
                          </label>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-slate-400">Risk weight:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newActionRisk}
                              onChange={(e) => setNewActionRisk(Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-[#1e293b]/40 rounded px-1.5 py-0.5 text-center font-mono text-[11px]"
                            />
                          </div>

                          <button
                            onClick={handleAddCustomAction}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded flex items-center gap-1 transition-all"
                          >
                            <Plus size={11} /> Append
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Control Panel */}
            <div className="pt-5 border-t border-[#1e293b]/30 mt-6 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider leading-none">Simulation Control Panel</p>
                {activeSessionId && (
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-[#1e293b]/30">
                    SID: {activeSessionId.substring(0, 15)}
                  </span>
                )}
              </div>

              {/* Main Actions Row */}
              <div className="flex flex-wrap gap-2">
                {!isRunning ? (
                  <button
                    onClick={handleRunSimulation}
                    disabled={isReadOnly || buildScenarioSteps().length === 0}
                    className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                      isReadOnly || buildScenarioSteps().length === 0
                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14]'
                    }`}
                  >
                    <Play size={13} fill="currentColor" /> Deploy Simulation
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={handleResume}
                        className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-[#0b0e14] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Play size={13} fill="currentColor" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border border-[#1e293b]/40"
                      >
                        <span className="w-1.5 h-3 border-x-2 border-white inline-block mr-0.5" /> Pause
                      </button>
                    )}

                    <button
                      onClick={handleStop}
                      className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <X size={13} /> Stop
                    </button>
                  </>
                )}

                <button
                  onClick={handleReset}
                  disabled={!isRunning && simulatedEvents.length === 0}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    !isRunning && simulatedEvents.length === 0
                      ? 'bg-slate-950 border border-[#1e293b]/20 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 border border-[#1e293b]/50 text-slate-300 cursor-pointer'
                  }`}
                >
                  <RefreshCw size={13} className={isRunning ? 'animate-spin' : ''} /> Reset
                </button>
              </div>

              {/* Speed Control Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400">Simulation Speed</span>
                  <div className="flex bg-slate-950 border border-[#1e293b]/40 rounded-lg p-0.5">
                    {[1, 2, 5, 10].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleSpeedMultiplierChange(val)}
                        className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-md transition-all ${
                          speedMultiplier === val
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400">Tactical Deployments</span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={handleRandomScenario}
                      disabled={isRunning || isReadOnly}
                      className="py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Zap size={10} /> Random
                    </button>
                    <button
                      onClick={handleReplayPreviousSession}
                      disabled={isRunning || isReadOnly || lastSteps.length === 0}
                      className="py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Layers size={10} /> Replay
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 pt-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                {isRunning 
                  ? `Executing event ${currentStepIndex + 1} of ${simulationSteps.length} (at ${speedMultiplier}x)`
                  : `Sequence duration: ~${Math.round((buildScenarioSteps().length * delayBetweenSteps) / 1000)} seconds`
                }
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Simulation Timeline (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-xl p-4 shadow-sm h-[380px] flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-2 border-b border-[#1e293b]/30 pb-3 mb-3">
                <Terminal className="text-emerald-500 animate-pulse" size={15} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Timeline Monitor</h3>
              </div>

              {/* Steps Timeline view */}
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {simulationSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2">
                    <Activity size={32} className="stroke-slate-700 opacity-60" />
                    <span className="text-[11px] leading-relaxed max-w-[200px] block text-center">No active deployment script running. Select parameters and click deploy.</span>
                  </div>
                ) : (
                  simulationSteps.map((step, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const isPending = idx > currentStepIndex;
                    
                    let badgeColor = 'border-slate-800 text-slate-500 bg-slate-900/40';
                    if (isPassed) badgeColor = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
                    else if (isActive) badgeColor = 'border-amber-500/30 text-amber-400 bg-amber-500/10 animate-pulse';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-[11px] transition-all flex gap-3 text-left ${
                          isActive 
                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 font-medium'
                            : isPassed
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                            : 'bg-[#06090e]/40 border-slate-900 text-slate-500'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`w-5 h-5 rounded-lg border font-mono font-black flex items-center justify-center text-[10px] ${badgeColor}`}>
                            {idx + 1}
                          </span>
                          {idx < simulationSteps.length - 1 && (
                            <div className={`w-0.5 h-7 border-l-2 border-dashed ${isPassed ? 'border-emerald-500/20' : 'border-slate-800'}`} />
                          )}
                        </div>

                        <div className="space-y-0.5 flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider block">
                              {step.activityType}
                            </span>
                            {isActive && <span className="text-[9px] text-amber-400 font-mono animate-pulse">EXECUTING...</span>}
                            {isPassed && <span className="text-[9px] text-emerald-500 font-mono">COMPLETE</span>}
                          </div>
                          <p className="text-slate-400 leading-normal text-[10px] font-sans pr-1 text-left">{step.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Simulated status alerts */}
            {simulatedEvents.length > 0 && (
              <div className="p-2.5 bg-slate-950/80 border border-[#1e293b]/40 rounded-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-slate-400">Events raised:</span>
                  <span className="text-white font-bold">{simulatedEvents.length}</span>
                </div>
                {triggeredIncidents.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-rose-400 font-black">
                    <AlertTriangle size={11} className="animate-bounce" />
                    ATIF ALERT TRIGGERED!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRAPHICAL PIPELINE VISUALIZATION (Bento Panel) */}
      <div className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-2xl p-6 shadow-sm text-left" id="sim-pipeline-diagram">
        <div className="flex items-center gap-2 border-b border-[#1e293b]/30 pb-3 mb-5">
          <Activity className="text-emerald-500" size={16} />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">ATIF Sandbox Detection Processing Pipeline</h3>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          {[
            { id: 'SIMULATOR', label: '1. Behavior Simulator', desc: 'Granular Healthcare Activities Injection', icon: Sliders },
            { id: 'SIEM', label: '2. Security Log (SIEM)', desc: 'Real Telemetry Events Persistent Generation', icon: Database },
            { id: 'BASELINE', label: '3. Profile Baseline', desc: 'UBA Repository Expected Activity Checks', icon: Users },
            { id: 'SCORING', label: '4. Adaptive Scoring', desc: 'Weighted Risk Vector Accumulation', icon: Radio },
            { id: 'CORRELATION', label: '5. Correlation Engine', desc: 'Multi-Indicator Rules Compiling Node', icon: Shield },
            { id: 'FEED', label: '6. Incident Management', desc: 'Threat Feed Compilation & Playbooks', icon: AlertTriangle }
          ].map((node, index) => {
            const isActive = currentPipelineStage === node.id;
            const Icon = node.icon;
            
            let colorClass = 'border-[#1e293b]/40 bg-slate-950/50 text-slate-500';
            if (isActive) {
              colorClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/20';
            }

            return (
              <React.Fragment key={node.id}>
                <div className={`p-4 rounded-xl border flex-1 w-full md:w-auto transition-all text-center ${colorClass}`}>
                  <div className="flex justify-center mb-2">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-900 text-slate-500'}`}>
                      <Icon size={14} />
                    </div>
                  </div>
                  <p className="font-mono text-[10.5px] font-bold text-slate-200 tracking-tight leading-none text-center">{node.label}</p>
                  <p className="text-[9px] text-slate-450 leading-tight mt-1 max-w-[130px] mx-auto text-center">{node.desc}</p>
                </div>
                {index < 5 && (
                  <ArrowRight size={14} className="text-slate-700 hidden md:block shrink-0 animate-pulse" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* SIMULATION HISTORY TABLE (Bottom Panel) */}
      <div className="bg-[#0b0e14] border border-[#1e293b]/40 rounded-2xl p-5 shadow-sm text-left" id="sim-history-panel">
        <div className="flex items-center justify-between border-b border-[#1e293b]/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="text-emerald-500" size={15} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Simulation Audit Log History</h3>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Total Simulation Runs: {history.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300 text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1e293b]/30 font-mono text-[9px] text-slate-400 uppercase bg-[#090c11]">
                <th className="p-3 pl-4">ID / Timestamp</th>
                <th className="p-3">Scenario Name</th>
                <th className="p-3">Target Profile</th>
                <th className="p-3">Threat Correlated</th>
                <th className="p-3 text-center">Threat Risk</th>
                <th className="p-3 text-center">Confidence</th>
                <th className="p-3 text-center">Duration</th>
                <th className="p-3 text-right pr-4">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/20">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    No simulation audits recorded. Run a simulation to populate the log database.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const hasIncident = item.threatGenerated !== 'None';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 pl-4 font-mono text-[10px]">
                        <span className="text-emerald-400 font-bold block">{item.id}</span>
                        <span className="text-slate-500 mt-0.5 block text-left">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white text-left">{item.name}</td>
                      <td className="p-3 text-slate-350 text-left">
                        <span className="font-medium text-slate-200 block">@{item.targetUser}</span>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">{item.targetRole}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-left">
                        {hasIncident ? (
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {item.threatGenerated}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-left">None Correlated</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {hasIncident ? (
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            item.riskScore >= 75 ? 'bg-red-500/10 text-red-400' 
                            : item.riskScore >= 45 ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {item.riskScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">{item.riskScore}</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{item.confidenceScore}%</td>
                      <td className="p-3 text-center font-mono text-slate-400">
                        {(item.executionTimeMs / 1000).toFixed(1)}s
                      </td>
                      <td className="p-3 text-right pr-4">
                        <button
                          onClick={() => setSelectedReport(item)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText size={11} /> Forensics Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIMULATION FORENSIC REPORT MODAL */}
      <AnimatePresence>
        {selectedReport && selectedReport.report && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0e14] border border-[#1e293b] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between text-left"
              id="simulation-report-modal"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#1e293b]/40 flex justify-between items-center bg-slate-900/50 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight font-sans text-left font-sans">
                      ATIF Simulation Forensics Integrity Report
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 text-left">Report ID: {selectedReport.id} • Registered: {new Date(selectedReport.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Close Report Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Core Content */}
              <div className="p-6 space-y-6 text-xs text-slate-200 text-left" id="print-report-area">
                {/* Visual Identity & Title Card */}
                <div className="flex flex-col md:flex-row justify-between border-b border-[#1e293b]/20 pb-4 gap-4 text-left">
                  <div className="space-y-1 text-left">
                    <h4 className="text-base font-bold text-white tracking-tight text-left">{selectedReport.name}</h4>
                    <p className="text-slate-400 text-left">Simulation Target Operator: <span className="text-emerald-400 font-mono">@{selectedReport.targetUser}</span> ({selectedReport.targetRole})</p>
                  </div>
                  <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-1.5 text-left">
                    <span className="px-3 py-1 bg-slate-800 rounded font-mono text-[10px] font-bold text-slate-400 border border-[#1e293b] text-left">
                      COMPLETED RUN
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono text-left">Forensic Analyst ID: {currentUser?.username || "analyst_sam"}</span>
                  </div>
                </div>

                {/* Analytical Stats Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-[#1e293b]/20 space-y-1 text-left">
                    <span className="text-[9px] text-slate-450 uppercase font-mono block text-left">Threat Classification</span>
                    <span className="text-xs font-bold text-white font-sans block truncate text-left">
                      {selectedReport.threatGenerated !== 'None' ? selectedReport.threatGenerated : "No Threats Detected"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-[#1e293b]/20 space-y-1 text-left">
                    <span className="text-[9px] text-slate-450 uppercase font-mono block text-left">ATIF Adaptive Risk Score</span>
                    <span className={`text-xs font-mono font-black block text-left ${
                      selectedReport.riskScore >= 75 ? 'text-rose-400' : selectedReport.riskScore >= 45 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {selectedReport.riskScore} / 100
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-[#1e293b]/20 space-y-1 text-left">
                    <span className="text-[9px] text-slate-450 uppercase font-mono block text-left">Detection Confidence</span>
                    <span className="text-xs font-mono font-black text-slate-200 block text-left">
                      {selectedReport.confidenceScore}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-[#1e293b]/20 space-y-1 text-left">
                    <span className="text-[9px] text-slate-450 uppercase font-mono block text-left">Triage Elapsed Time</span>
                    <span className="text-xs font-mono font-black text-slate-200 block text-left">
                      {selectedReport.report.detectionTimeMs} ms
                    </span>
                  </div>
                </div>

                {/* Explainable Detection Summary */}
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] uppercase font-black text-left">
                    <Zap size={13} /> Explainable Detection Summary
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-350 font-sans text-left">
                    {selectedReport.threatGenerated !== 'None' ? (
                      `ATIF successfully correlated multiple behavioral indicators on user account @${selectedReport.targetUser}. The user's typical daily access limit baseline is ${selectedReport.report.baselineDailyViews} file views, but the observed simulation view count was ${selectedReport.report.observedDailyViews} file views—indicating a deviation spike of ${selectedReport.report.baselineDeviationPercent}%. The access timed at ${selectedReport.report.actualLogin} from unestablished device '${selectedReport.report.actualDevice}', crossing clinical boundaries with justification flag: '${selectedReport.report.clinicalContext}'.`
                    ) : (
                      `The simulation executed clean, expected baseline clinical workflows for @${selectedReport.targetUser}. No indicators deviated from expected limits, resulting in a zero-threat classification.`
                    )}
                  </p>
                </div>

                {/* Comparison parameters - Expected vs Observed Baseline Repository */}
                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider leading-none text-left">Baseline Comparison Matrix</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="p-3 bg-slate-950 border border-[#1e293b]/40 rounded-xl space-y-2 text-left">
                      <p className="text-[9.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-[#1e293b]/30 pb-1.5 text-left">Expected Baseline Parameters</p>
                      <div className="space-y-1.5 text-[10.5px] text-left">
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Working Shift Hours:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.expectedLogin}</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Standard Access Devices:</span>
                          <span className="font-mono text-slate-300">Authorized Office Desktop</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Baseline Patient Views/Day:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.baselineDailyViews} views</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Workflow Authorization:</span>
                          <span className="font-mono text-slate-300">In-Ward Matched Active Order Context</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-[#1e293b]/40 rounded-xl space-y-2 text-left">
                      <p className="text-[9.5px] font-mono text-rose-400 font-bold uppercase tracking-wider border-b border-[#1e293b]/30 pb-1.5 text-left">Observed Simulation Parameters</p>
                      <div className="space-y-1.5 text-[10.5px] text-left">
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Simulated Access Hours:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.actualLogin}</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Simulated Access Device:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.actualDevice}</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Simulated Patient Views/Day:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.observedDailyViews} views</span>
                        </div>
                        <div className="flex justify-between text-left">
                          <span className="text-slate-500">Workflow Authorization:</span>
                          <span className="font-mono text-slate-300">{selectedReport.report.clinicalContext}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Triggered Indicators and evidence list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider leading-none text-left">Correlated ATIF Indicators</p>
                    <div className="bg-slate-950 border border-[#1e293b]/40 rounded-xl p-3 h-28 overflow-y-auto space-y-1 text-left">
                      {selectedReport.report.triggeredIndicators.map((ind, i) => (
                        <div key={i} className="flex items-center gap-1.5 font-mono text-[10.5px] text-rose-300 text-left">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {ind}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider leading-none text-left">Collected SIEM Events Telemetry</p>
                    <div className="bg-slate-950 border border-[#1e293b]/40 rounded-xl p-3 h-28 overflow-y-auto space-y-1 text-left">
                      {selectedReport.report.generatedEvents.map((evt, i) => (
                        <div key={i} className="flex justify-between text-[10px] font-mono text-slate-400 truncate text-left">
                          <span>• {evt.activityType}</span>
                          <span className="text-[9px] text-slate-500 text-right">({new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Controls */}
              <div className="p-5 border-t border-[#1e293b]/40 flex justify-between items-center bg-slate-900/50 text-left">
                <div className="text-[10px] font-mono text-slate-400 text-left">
                  {selectedReport.incidentId ? (
                    <button
                      onClick={() => {
                        setSelectedReport(null);
                        if (onInvestigateId) onInvestigateId(selectedReport.incidentId!);
                      }}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Linked Incident ID: {selectedReport.incidentId} (Click to open forensic workbook)
                    </button>
                  ) : (
                    <span>No incident raised. Simulation is archived.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF(selectedReport)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-[#1e293b] rounded-xl text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={13} /> Export PDF
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-[#0b0e14] text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
