import { 
  Patient, 
  SecurityEvent, 
  ThreatIncident, 
  SecurityPosture, 
  UserBehaviorProfile, 
  ThreatFeedItem, 
  HospitalRole, 
  SecurityRiskLevel 
} from '../types';

export const DEFAULT_PATIENTS_ROSTER: Patient[] = [
  {
    id: "HIS-1092",
    fullName: "George Harris",
    dob: "1983-02-25",
    gender: "Male",
    address: "24 Abbey Road, Liverpool, UK",
    phone: "+44 7700 900077",
    email: "george.harris@hospital-directory.org",
    emergencyContact: "Olivia Harris (+44 7700 900088)",
    allergies: ["Penicillin", "Peanuts"],
    diagnoses: ["Type 2 Diabetes", "Chronic Hypertension"],
    isVip: false,
    isStaff: false,
    sensitivity: "NORMAL",
    admittedWard: "General Medicine",
    admittedBed: "G-01",
    status: "Admitted"
  },
  {
    id: "HIS-2051",
    fullName: "Senator Arthur Vance",
    dob: "1958-11-12",
    gender: "Male",
    address: "712 Capitol Ave, Bethesda, MD",
    phone: "+1 (555) 304-9812",
    email: "senator.vance@senate.gov",
    emergencyContact: "Eleanor Vance (+1 555-304-9811)",
    allergies: [],
    diagnoses: ["Stable Angina", "Gout"],
    isVip: true,
    isStaff: false,
    sensitivity: "HIGHLY_SENSITIVE",
    status: "Checked In"
  },
  {
    id: "HIS-3044",
    fullName: "Dr. Margaret Stone",
    dob: "1975-06-05",
    gender: "Female",
    address: "41 Medical Center Lane, Capital City",
    phone: "+1 (555) 762-0945",
    email: "m.stone@atif-hospital.org",
    emergencyContact: "Thomas Stone (+1 555-762-1110)",
    allergies: ["Sulfonamides"],
    diagnoses: ["Severe Migraine", "Asthma"],
    isVip: false,
    isStaff: true,
    sensitivity: "CONFIDENTIAL",
    status: "In Consultation"
  },
  {
    id: "HIS-4089",
    fullName: "Sarah Connor",
    dob: "1965-05-13",
    gender: "Female",
    address: "732 Cyberdyne Blvd, Los Angeles, CA",
    phone: "+1 (555) 911-3820",
    email: "sconnor@resistance.net",
    emergencyContact: "John Connor (+1 555-911-3800)",
    allergies: ["Adrenaline"],
    diagnoses: ["Post-Traumatic Stress Disorder", "Multiple Fractures (Healed)"],
    isVip: false,
    isStaff: false,
    sensitivity: "HIGHLY_SENSITIVE",
    admittedWard: "Intensive Care Unit",
    admittedBed: "ICU-04",
    status: "Admitted"
  },
  {
    id: "HIS-5012",
    fullName: "David Beckham",
    dob: "1975-05-02",
    gender: "Male",
    address: "18 Golden Mile Way, London, UK",
    phone: "+44 7911 123456",
    email: "david.beckham@hospital-directory.org",
    emergencyContact: "Victoria Beckham (+44 7911 654321)",
    allergies: ["Aspirin"],
    diagnoses: ["Acute Achilles Tendonitis", "Hamstring Strain"],
    isVip: true,
    isStaff: false,
    sensitivity: "RESTRICTED",
    status: "Checked In"
  },
  {
    id: "HIS-6023",
    fullName: "Evelyn Reed",
    dob: "1992-09-18",
    gender: "Female",
    address: "55 Maple Ave, Boston, MA",
    phone: "+1 (555) 234-5678",
    email: "evelyn.reed@hospital-directory.org",
    emergencyContact: "Michael Reed (+1 555-234-8765)",
    allergies: ["Latex"],
    diagnoses: ["Acute Bronchitis", "Seasonal Rhinitis"],
    isVip: false,
    isStaff: false,
    sensitivity: "NORMAL",
    status: "In Consultation"
  },
  {
    id: "HIS-7088",
    fullName: "Marcus Holloway",
    dob: "1988-12-04",
    gender: "Male",
    address: "88 Mission Street, San Francisco, CA",
    phone: "+1 (555) 432-1098",
    email: "marcus.h@hospital-directory.org",
    emergencyContact: "Sitara Dhawan (+1 555-432-8901)",
    allergies: [],
    diagnoses: ["Compound Radius Fracture", "Soft Tissue Contusion"],
    isVip: false,
    isStaff: false,
    sensitivity: "NORMAL",
    admittedWard: "Orthopedic Surgery",
    admittedBed: "ORTHO-02",
    status: "Admitted"
  },
  {
    id: "HIS-8019",
    fullName: "Clara Oswald",
    dob: "1989-11-23",
    gender: "Female",
    address: "42 Coal Hill Lane, London, UK",
    phone: "+44 7822 345678",
    email: "clara.oswald@hospital-directory.org",
    emergencyContact: "Danny Pink (+44 7822 876543)",
    allergies: ["Codeine"],
    diagnoses: ["Mild Concussion", "Cervical Sprain"],
    isVip: false,
    isStaff: false,
    sensitivity: "NORMAL",
    status: "Awaiting Lab"
  }
];

export const DEFAULT_SECURITY_POSTURE: SecurityPosture = {
  overallScore: 94,
  threatCount: { open: 1, total: 2 },
  incidentsByDepartment: {
    "Health Information Management": 1,
    "Outpatient Pharmacy": 1
  },
  systemStatus: "Healthy"
};

export const DEFAULT_INCIDENTS: ThreatIncident[] = [
  {
    id: "INC-2026-0042",
    title: "Off-Hours Bulk VIP Record Query Pattern",
    timestamp: "2026-06-24T03:15:20Z",
    threatType: "INSIDER_THREAT",
    riskScore: 68,
    riskLevel: SecurityRiskLevel.MEDIUM,
    affectedUser: "him_officer",
    eventIds: ["EVT-9003"],
    status: "Investigating",
    timeline: [
      {
        timestamp: "2026-06-24T03:15:20Z",
        action: "Incident Created",
        note: "Automated ATIF rule correlation triggered on off-hours query",
        user: "Sentinel Core"
      }
    ],
    triggeredIndicators: [
      "Access during off-normal clinical shift hours (03:15 AM)",
      "High-sensitivity VIP health record queries (Senator Vance)",
      "Unrecognized access terminal ID"
    ],
    evidence: [
      "EHR query logs for VIP Senator Arthur Vance (HIS-2051)",
      "Terminal IP 192.168.10.45 not in registered HIM ward pool",
      "Bulk export request of 14 clinical notes in 180 seconds"
    ]
  },
  {
    id: "INC-2026-0038",
    title: "Rapid Cross-Department Patient Chart Scanning",
    timestamp: "2026-06-23T14:42:10Z",
    threatType: "ABNORMAL_USER_BEHAVIOR",
    riskScore: 54,
    riskLevel: SecurityRiskLevel.MEDIUM,
    affectedUser: "pharmacist_bob",
    eventIds: ["EVT-9001"],
    status: "Resolved",
    timeline: [
      {
        timestamp: "2026-06-23T14:42:10Z",
        action: "Incident Resolved",
        note: "Pharmacist shift supervisor verified prescription reconciliation review",
        user: "analyst_sam"
      }
    ],
    triggeredIndicators: [
      "Access rate exceeded baseline by 220%",
      "Lookups in non-assigned Inpatient Oncology charts"
    ],
    evidence: [
      "18 distinct patient record views in 6 minutes",
      "No active prescription orders linked to viewed charts"
    ]
  }
];

export const DEFAULT_EVENTS: SecurityEvent[] = [
  {
    id: "EVT-9001",
    timestamp: "2026-06-24T08:30:15Z",
    userId: "EMP-002",
    username: "dr_house",
    role: HospitalRole.DOCTOR,
    ipAddress: "10.20.2.100",
    deviceName: "Clinic Desk PC-11",
    activityType: "RECORD_VIEW",
    description: "Accessed patient record for George Harris (HIS-1092) - Routine Consultation",
    resourceId: "HIS-1092",
    isSensitiveAccess: false,
    riskContribution: 0
  },
  {
    id: "EVT-9002",
    timestamp: "2026-06-24T08:15:40Z",
    userId: "EMP-003",
    username: "nurse_rached",
    role: HospitalRole.NURSE,
    ipAddress: "10.20.3.50",
    deviceName: "Ward Rover Cart-02",
    activityType: "VITALS_RECORD",
    description: "Recorded vitals telemetry for Sarah Connor (HIS-4089)",
    resourceId: "HIS-4089",
    isSensitiveAccess: false,
    riskContribution: 0
  },
  {
    id: "EVT-9003",
    timestamp: "2026-06-24T07:55:12Z",
    userId: "EMP-001",
    username: "him_officer",
    role: HospitalRole.HIM_OFFICER,
    ipAddress: "10.20.1.15",
    deviceName: "Desktop HIM-01",
    activityType: "PATIENT_SEARCH",
    description: "Executed wildcard patient directory lookup for ward census",
    resourceId: "WARD-ALL",
    isSensitiveAccess: false,
    riskContribution: 5
  },
  {
    id: "EVT-9004",
    timestamp: "2026-06-24T07:30:00Z",
    userId: "EMP-009",
    username: "analyst_sam",
    role: HospitalRole.SECURITY_ANALYST,
    ipAddress: "10.20.90.11",
    deviceName: "SOC Dual-Mon Workstation",
    activityType: "SOC_AUDIT_INSPECT",
    description: "Automated SIEM policy audit sweep completed across all 10 endpoints",
    resourceId: "SYS-SIEM",
    isSensitiveAccess: false,
    riskContribution: 0
  }
];

export const DEFAULT_PROFILES: UserBehaviorProfile[] = [
  {
    userId: "EMP-001",
    username: "him_officer",
    role: HospitalRole.HIM_OFFICER,
    averageWeeklyViews: 240,
    currentWeekViews: 260,
    loginHoursDistribution: { 8: 10, 9: 15, 10: 20, 11: 20, 12: 15, 13: 15, 14: 15, 15: 15, 16: 10, 17: 5 },
    recentIps: ["10.20.1.15", "10.20.1.16"],
    recentDevices: ["Desktop HIM-01", "ChromeOS HIM-Terminal"],
    typicalLoginHours: { start: 8, end: 17 },
    typicalDepartment: "Health Information Management",
    typicalPatientViewsPerDay: 40,
    typicalDailyPdfExports: 5,
    typicalDevices: ["Desktop HIM-01", "ChromeOS HIM-Terminal"],
    typicalIps: ["10.20.1.15", "10.20.1.16"],
    averageSessionDurationMin: 45,
    averageDailyActivityCount: 60
  },
  {
    userId: "EMP-002",
    username: "dr_house",
    role: HospitalRole.DOCTOR,
    averageWeeklyViews: 180,
    currentWeekViews: 175,
    loginHoursDistribution: { 7: 5, 8: 15, 9: 20, 10: 20, 11: 15, 12: 10, 13: 10, 14: 15, 15: 15, 16: 15, 17: 10, 18: 5 },
    recentIps: ["10.20.2.100", "10.20.2.102"],
    recentDevices: ["Consultation-Tab 04", "Clinic Desk PC-11"],
    typicalLoginHours: { start: 7, end: 19 },
    typicalDepartment: "Clinical Consultation",
    typicalPatientViewsPerDay: 30,
    typicalDailyPdfExports: 2,
    typicalDevices: ["Consultation-Tab 04", "Clinic Desk PC-11"],
    typicalIps: ["10.20.2.100", "10.20.2.102"],
    averageSessionDurationMin: 30,
    averageDailyActivityCount: 45
  },
  {
    userId: "EMP-009",
    username: "analyst_sam",
    role: HospitalRole.SECURITY_ANALYST,
    averageWeeklyViews: 500,
    currentWeekViews: 520,
    loginHoursDistribution: { 0: 5, 1: 5, 2: 5, 3: 5, 8: 10, 9: 10, 10: 10, 14: 10, 15: 10, 20: 10 },
    recentIps: ["10.20.90.11", "10.20.90.12"],
    recentDevices: ["SOC Dual-Mon Workstation", "SOC Laptop Secure"],
    typicalLoginHours: { start: 0, end: 24 },
    typicalDepartment: "Security Operations Center (SOC)",
    typicalPatientViewsPerDay: 0,
    typicalDailyPdfExports: 10,
    typicalDevices: ["SOC Dual-Mon Workstation", "SOC Laptop Secure"],
    typicalIps: ["10.20.90.11", "10.20.90.12"],
    averageSessionDurationMin: 120,
    averageDailyActivityCount: 150
  },
  {
    userId: "EMP-010",
    username: "it_admin",
    role: HospitalRole.IT_ADMIN,
    averageWeeklyViews: 300,
    currentWeekViews: 310,
    loginHoursDistribution: { 0: 5, 8: 10, 9: 15, 10: 15, 11: 15, 14: 15, 15: 15, 22: 10 },
    recentIps: ["10.20.100.1"],
    recentDevices: ["SysAdmin Secure ThinkPad", "Server room KVM Console"],
    typicalLoginHours: { start: 0, end: 24 },
    typicalDepartment: "IT Infrastructure and DevOps",
    typicalPatientViewsPerDay: 0,
    typicalDailyPdfExports: 0,
    typicalDevices: ["SysAdmin Secure ThinkPad", "Server room KVM Console"],
    typicalIps: ["10.20.100.1"],
    averageSessionDurationMin: 90,
    averageDailyActivityCount: 80
  }
];

export const DEFAULT_FEED: ThreatFeedItem[] = [
  {
    id: "THREAT-FEED-01",
    timestamp: "2026-06-24T08:00:00Z",
    source: "HHS Health-ISAC Advisory",
    indicator: "Ransomware campaign targeting unpatched clinical PACS imaging servers",
    severity: "High",
    description: "Ensure PACS DICOM port 104 is protected behind firewall & isolated from guest WiFi"
  },
  {
    id: "THREAT-FEED-02",
    timestamp: "2026-06-24T07:15:00Z",
    source: "ATIF Adaptive Context Engine",
    indicator: "Shift-boundary credential re-use anomaly detected in Inpatient Ward A",
    severity: "High",
    description: "Automate session termination upon scheduled shift handover completion"
  },
  {
    id: "THREAT-FEED-03",
    timestamp: "2026-06-24T06:30:00Z",
    source: "CISA Cybersecurity Bulletin",
    indicator: "Credential stuffing attempts against healthcare patient portals",
    severity: "Medium",
    description: "Activate ATIF rate-limiting & IP reputation scoring on /api/auth/login"
  }
];
