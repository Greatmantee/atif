/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum HospitalRole {
  HIM_OFFICER = "Health Information Management Officer",
  DOCTOR = "Doctor",
  NURSE = "Nurse",
  LAB_SCIENTIST = "Laboratory Scientist",
  RADIOLOGY_OFFICER = "Radiology Officer",
  PHARMACIST = "Pharmacist",
  ACCOUNTS_OFFICER = "Accounts Officer",
  HOSPITAL_ADMIN = "Hospital Administrator",
  SECURITY_ANALYST = "Security Analyst",
  IT_ADMIN = "IT Administrator"
}

export interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  role: HospitalRole;
  department: string;
  normalHours: { start: number; end: number }; // hour of day, e.g. 8 and 17
  typicalDevices: string[];
  typicalIps: string[];
  averageDailyAccessLimit: number; // For anomaly detection
  status?: "Active" | "Suspended";
  password?: string;
}

export interface Patient {
  id: string; // Dynamic HIS-XXXX
  fullName: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
  allergies: string[];
  diagnoses: string[];
  isVip: boolean;             // To trigger Sensitive Record checks (e.g. VIP Senator)
  isStaff: boolean;           // Staff records are also sensitive
  sensitivity?: "NORMAL" | "CONFIDENTIAL" | "RESTRICTED" | "HIGHLY_SENSITIVE"; // record sensitivity classification
  admittedWard?: string;
  admittedBed?: string;
  status: "Checked In" | "In Consultation" | "Admitted" | "Discharged" | "Awaiting Lab" | "Awaiting Radiology";
}

// Medical details
export interface Vitals {
  id: string;
  patientId: string;
  timestamp: string;
  heartRate: number;
  bloodPressure: string; // e.g. "120/80"
  temperature: number;   // Celsius
  respirationRate: number;
  recordedBy: string; // Staff user ID or name
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  timestamp: string;
  createdBy: string;
  role: string;
  noteText: string;
}

export enum LabStatus {
  PENDING = "Pending Sample",
  PROCESSING = "Sample Processing",
  COMPLETED = "Results Released"
}

export interface LabRequest {
  id: string;
  patientId: string;
  testName: string;
  status: LabStatus;
  orderedBy: string;
  orderedDate: string;
  sampleType?: string;
  result?: string;
  completedBy?: string;
  completedDate?: string;
}

export enum RadStatus {
  PENDING = "Awaiting Scan",
  SCANNING = "Scan in Progress",
  COMPLETED = "Report Signed"
}

export interface RadiologyRequest {
  id: string;
  patientId: string;
  imagingType: string; // e.g., "X-Ray Chest", "MRI Brain"
  status: RadStatus;
  orderedBy: string;
  orderedDate: string;
  reportText?: string;
  imageUrl?: string;
  completedBy?: string;
  completedDate?: string;
}

export enum PrescriptionStatus {
  PRESCRIBED = "Prescribed",
  DISPENSED = "Dispensed",
  ADMINISTERED = "Administered"
}

export interface MARRecord {
  id: string;
  timestamp: string;
  status: "Scheduled" | "Administered" | "Missed";
  dose: string;
  administeredBy?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string; // e.g. "TDS", "QD"
  route: string; // e.g., "Oral", "IV"
  duration: string; // e.g. "5 days"
  status: PrescriptionStatus;
  prescribedBy: string;
  prescribedDate: string;
  dispensedBy?: string;
  dispensedDate?: string;
  mar: MARRecord[];
}

export interface WardBed {
  wardName: string;
  bedNumber: string;
  isOccupied: boolean;
  status?: string; // "Available" | "Occupied" | "Maintenance" | "Out of Service"
  patientId?: string;
  currentPatientId?: string;
}

export interface Ward {
  name: string;
  capacity: number;
  availableBeds?: number;
  assignedNurseId?: string; // ID of staff nurse
  occupancy?: number;
  location?: string;
  department?: string;
}

export interface BillingItem {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface BillingInvoice {
  id: string;
  patientId: string;
  items: BillingItem[];
  totalAmount: number;
  insuranceClaimed: number;
  patientPaid: number;
  status: "Unpaid" | "Partially Paid" | "Paid" | "Submitted to Insurance" | "Void";
  issuedDate: string;
}

export interface ShiftHandover {
  id: string;
  timestamp: string;
  senderName: string;
  receiverName: string;
  wardName: string;
  handoverSummary: string;
}

// SECURITY ENGINES / ATIF DATA TYPES

export enum SecurityRiskLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical"
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: HospitalRole;
  ipAddress: string;
  deviceName: string;
  activityType: string; // "LOGIN_SUCCESS" | "LOGIN_FAILED" | "RECORD_VIEW" | "RECORD_MODIFY" | "PRESCRIPTION_CREATE" | "LAB_ACCESS" | "BILL_ACTION" | "USER_MODIFY"
  description: string;
  resourceId?: string; // Patient ID or other target ID
  isSensitiveAccess: boolean; // VIP record or staff record view
  riskContribution: number;  // Dynamic risk increment (e.g. +10, +25)
  sessionId?: string; // Session ID inherited by consecutive events
}

export interface SessionThreatContext {
  sessionId: string;
  user: string;
  role: string;
  department: string;
  loginTime: string;
  authenticationHistory: { activityType: string; timestamp: string }[];
  failedLoginCount: number;
  successfulLoginAfterFailures: boolean;
  knownDevice: boolean;
  knownIp: boolean;
  patientViews: number;
  uniquePatientsViewed: number;
  sensitiveRecordsViewed: number;
  highlySensitiveRecordsViewed: number;
  crossWardAccessCount: number;
  patientRecordPdfExportCount: number;
  repeatedExportCount: number;
  currentBaselineDeviation: number;
  triggeredIndicators: string[];
  currentRiskScore: number;
  currentConfidenceScore: number;
  currentThreatClassification: string;
  threatTimeline: { timestamp: string; action: string; note: string; user: string }[];
  incidentId?: string;
}

export interface ThreatIncident {
  id: string;
  sessionContext?: SessionThreatContext;
  timestamp: string;
  title: string;
  threatType: "UNAUTHORIZED_ACCESS" | "CREDENTIAL_ABUSE" | "INSIDER_THREAT" | "SENSITIVE_RECORD_ACCESS" | "ABNORMAL_USER_BEHAVIOR";
  riskScore: number;
  riskLevel: SecurityRiskLevel;
  affectedUser: string; // Staff username
  affectedPatient?: string; // Patient ID
  eventIds: string[];
  status: "Open" | "Investigating" | "Mitigated" | "Resolved";
  timeline: { timestamp: string; action: string; note: string; user: string }[];
  aiAnalysis?: string; // Generated on-demand via Gemini API
  department?: string;
  sourceIp?: string;
  description?: string;
  confidenceScore?: number;        // Adaptive detection confidence percentage (0-100)
  evidence?: string[];             // Core pieces of collected security evidence
  triggeredIndicators?: string[];  // List of matching ATIF behavioral indicators
  affectedUserRole?: HospitalRole; // Cached role of the user
  clinicalContext?: string;        // The clinical context or workflow description
  explanation?: string;            // Explainable detection summary detailing why the rule adaptive engine triggered
  expectedBehavior?: string;
  currentBehavior?: string;
  deviationPercentage?: number;
  deviationReason?: string;
  expectedLogin?: string;
  actualLogin?: string;
  expectedDevice?: string;
  actualDevice?: string;
  sessionId?: string;              // Associated Session ID for the correlation
  correlatedEvents?: SecurityEvent[]; // Correlated event chain supporting this threat
  riskContributions?: { [activityType: string]: number }; // Risk breakdown per event type
  riskBreakdown?: { name: string; score: number }[];
  confidenceBreakdown?: { name: string; score: number }[];
  viewsDeviation?: number;
  exportsDeviation?: number;
  expectedViews?: number;
  expectedExports?: number;
  currentViews?: number;
  currentExports?: number;
  isMerged?: boolean;
  mergeText?: string;
  mergedBehaviors?: string[];
  mergedIntoId?: string;
  originalIncidentId?: string;
  mergeTime?: string;
  mergeReason?: string;
  analyst?: string;
  riskEvolution?: {
    timestamp: string;
    event: string;
    riskBefore: number;
    riskAdded: number;
    currentRisk: number;
    reason: string;
    confidence: number;
  }[];
  evidenceItems?: {
    id: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    timestamp: string;
    category: string;
  }[];
  recommendations?: string[];
  threatDetectionTime?: string;
  sessionDuration?: string;
}

export interface BaselineTemplate {
  role: HospitalRole;
  typicalShiftStart: string;
  typicalShiftEnd: string;
  typicalDailyPatientViews: number;
  typicalHourlyPatientViews: number;
  typicalSensitiveRecordAccessRate: number;
  typicalDailyLogins: number;
  averageSessionDurationMin: number;
  typicalModulesAccessed: string[];
  normalWorkingDays: string[];
  baselineConfidence: number;
}

export interface UserBehaviorProfile {
  userId: string;
  username: string;
  role: HospitalRole;
  averageWeeklyViews: number;
  currentWeekViews: number;
  loginHoursDistribution: { [hour: number]: number }; // logs hour weight
  recentIps: string[];
  recentDevices: string[];
  
  // Refined adaptive behavior profiling baseline
  typicalLoginHours?: { start: number; end: number };
  typicalDepartment?: string;
  typicalPatientViewsPerDay?: number;
  typicalDailyPdfExports?: number;
  typicalDevices?: string[];
  typicalIps?: string[];
  averageSessionDurationMin?: number;
  averageDailyActivityCount?: number;

  // Additional behavior baseline repository fields
  typicalShiftStart?: string;
  typicalShiftEnd?: string;
  typicalHourlyPatientViews?: number;
  typicalSensitiveRecordAccessRate?: number;
  typicalDailyLogins?: number;
  typicalModulesAccessed?: string[];
  normalWorkingDays?: string[];
  baselineConfidence?: number;
  lastUpdated?: string;
}

export interface SecurityPosture {
  overallScore: number; // 0 to 100
  threatCount: { open: number; total: number };
  incidentsByDepartment: { [dept: string]: number };
  systemStatus: "Healthy" | "Elevated Threat" | "Active Threat" | "Compromised";
}

export interface ThreatFeedItem {
  id: string;
  timestamp: string;
  source: string; // e.g. "US-CERT", "HC3", "HHS"
  indicator: string; // e.g. IP block, malware signature
  description: string;
  severity: "Low" | "Medium" | "High";
}

export interface SimulationReport {
  simulationName: string;
  targetUser: string;
  targetRole: HospitalRole;
  generatedEvents: SecurityEvent[];
  baselineDailyViews: number;
  observedDailyViews: number;
  baselineDeviationPercent: number;
  triggeredIndicators: string[];
  riskScore: number;
  confidenceScore: number;
  detectionTimeMs: number;
  threatGenerated: string; // "Unauthorized Access", "Credential Abuse", "Insider Threat", "Sensitive Patient Record Access", "None"
  incidentId?: string;
  expectedLogin?: string;
  actualLogin?: string;
  expectedDevice?: string;
  actualDevice?: string;
  sensitivityLevel?: string;
  clinicalContext?: string;
}

export interface SimulationHistoryItem {
  id: string;
  timestamp: string;
  name: string;
  targetUser: string;
  targetRole: HospitalRole;
  threatGenerated: string; // "Unauthorized Access", "Credential Abuse", "Insider Threat", "Sensitive Patient Record Access", "None"
  incidentId?: string;
  riskScore: number;
  confidenceScore: number;
  executionTimeMs: number;
  status: "Completed" | "Failed" | "Running";
  report?: SimulationReport;
  eventsCount: number;
}

