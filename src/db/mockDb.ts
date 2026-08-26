/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import {
  HospitalRole,
  StaffUser,
  Patient,
  Vitals,
  ClinicalNote,
  LabRequest,
  LabStatus,
  RadiologyRequest,
  RadStatus,
  Prescription,
  PrescriptionStatus,
  MARRecord,
  WardBed,
  Ward,
  BillingInvoice,
  BillingItem,
  ShiftHandover,
  SecurityEvent,
  ThreatIncident,
  SessionThreatContext,
  UserBehaviorProfile,
  SecurityPosture,
  SecurityRiskLevel,
  ThreatFeedItem,
  BaselineTemplate,
  SimulationHistoryItem,
  SimulationReport
} from "../types.js";

// Database storage file path
const DB_FILE = path.join(process.cwd(), "atif_his_db.json");
const BACKUP_FILE = path.join(process.cwd(), "atif_his_db.json.backup");

export function getPatientSensitivity(patient: any): "NORMAL" | "CONFIDENTIAL" | "RESTRICTED" | "HIGHLY_SENSITIVE" {
  if (patient.sensitivity) return patient.sensitivity;
  if (patient.isStaff) return "HIGHLY_SENSITIVE";
  if (patient.isVip) return "RESTRICTED";

  const diagnoses = (patient.diagnoses || []).map((d: string) => d.toLowerCase());
  const hasPsychiatric = diagnoses.some((d: string) => 
    d.includes("post-traumatic") || d.includes("stress") || d.includes("depersonalization") || 
    d.includes("insomnia") || d.includes("bipolar") || d.includes("schizo") || 
    d.includes("psychiatric") || d.includes("depression") || d.includes("anxiety") || 
    d.includes("mental")
  );
  const hasHiv = diagnoses.some((d: string) => 
    d.includes("hiv") || d.includes("aids") || d.includes("immunodeficiency") || 
    d.includes("human immunodeficiency")
  );
  const hasResearch = diagnoses.some((d: string) => 
    d.includes("research") || d.includes("trial") || d.includes("protocol") || 
    d.includes("experimental")
  );

  if (hasPsychiatric || hasHiv) return "HIGHLY_SENSITIVE";
  if (hasResearch) return "RESTRICTED";

  return "NORMAL";
}

export interface BackupDetail {
  id: string;
  timestamp: string;
  filename: string;
  size: string;
  status: string;
  createdBy: string;
}

export interface SystemSettings {
  bruteForceThreshold: number;
  anomalyScoringWeight: number;
  auditLoggingRetention: number;
  organizationalDefaults?: {
    defaultConfidence: number;
    emaSmoothingFactor: number;
    offHoursRiskWeight: number;
    unrecognizedDeviceRiskWeight: number;
    unrecognizedIpRiskWeight: number;
  };
}

export interface DatabaseSchema {
  staff: StaffUser[];
  patients: Patient[];
  vitals: Vitals[];
  clinicalNotes: ClinicalNote[];
  labRequests: LabRequest[];
  radiologyRequests: RadiologyRequest[];
  prescriptions: Prescription[];
  beds: WardBed[];
  wards: Ward[];
  billing: BillingInvoice[];
  handovers: ShiftHandover[];
  securityEvents: SecurityEvent[];
  incidents: ThreatIncident[];
  behaviorProfiles: UserBehaviorProfile[];
  threatFeed: ThreatFeedItem[];
  systemSettings: SystemSettings;
  baselineTemplates?: BaselineTemplate[];
  backups: BackupDetail[];
  simulations?: SimulationHistoryItem[];
}

// Default Seed Data
const DEFAULT_STAFF: StaffUser[] = [
  {
    id: "EMP-001",
    username: "him_officer",
    fullName: "Elena Rostova",
    role: HospitalRole.HIM_OFFICER,
    department: "Health Information Management",
    normalHours: { start: 8, end: 17 },
    typicalDevices: ["Desktop HIM-01", "ChromeOS HIM-Terminal"],
    typicalIps: ["10.20.1.15", "10.20.1.16"],
    averageDailyAccessLimit: 40,
    status: "Active"
  },
  {
    id: "EMP-002",
    username: "dr_house",
    fullName: "Dr. Gregory House",
    role: HospitalRole.DOCTOR,
    department: "Clinical Consultation",
    normalHours: { start: 7, end: 19 },
    typicalDevices: ["Consultation-Tab 04", "Clinic Desk PC-11"],
    typicalIps: ["10.20.2.100", "10.20.2.102"],
    averageDailyAccessLimit: 30,
    status: "Active"
  },
  {
    id: "EMP-003",
    username: "nurse_rached",
    fullName: "Nurse Florence Nightingale",
    role: HospitalRole.NURSE,
    department: "Inpatient Ward A",
    normalHours: { start: 6, end: 22 },
    typicalDevices: ["Ward Rover Cart-02", "Nurse Terminal Ward-A"],
    typicalIps: ["10.20.3.50", "10.20.3.51"],
    averageDailyAccessLimit: 50,
    status: "Active"
  },
  {
    id: "EMP-004",
    username: "lab_scientist",
    fullName: "Dr. Louis Pasteur",
    role: HospitalRole.LAB_SCIENTIST,
    department: "Pathology Laboratory",
    normalHours: { start: 8, end: 18 },
    typicalDevices: ["Lab Spectrometer PC", "Biotech Lab-Terminal"],
    typicalIps: ["10.20.4.12"],
    averageDailyAccessLimit: 25,
    status: "Active"
  },
  {
    id: "EMP-005",
    username: "rad_officer",
    fullName: "Marie Curie",
    role: HospitalRole.RADIOLOGY_OFFICER,
    department: "Medical Imaging",
    normalHours: { start: 8, end: 17 },
    typicalDevices: ["MRI workstation 01", "X-Ray PC Workstation"],
    typicalIps: ["10.20.5.21"],
    averageDailyAccessLimit: 25,
    status: "Active"
  },
  {
    id: "EMP-006",
    username: "pharmacist_bob",
    fullName: "Robert Apothecary",
    role: HospitalRole.PHARMACIST,
    department: "Outpatient Pharmacy",
    normalHours: { start: 8, end: 20 },
    typicalDevices: ["Pharmacy dispense-PC-01", "Inventory handheld-3"],
    typicalIps: ["10.20.6.30"],
    averageDailyAccessLimit: 35,
    status: "Active"
  },
  {
    id: "EMP-007",
    username: "accounts_alice",
    fullName: "Alice Sterling",
    role: HospitalRole.ACCOUNTS_OFFICER,
    department: "Billing and Finance",
    normalHours: { start: 8, end: 17 },
    typicalDevices: ["Finance-Workstation-02"],
    typicalIps: ["10.20.7.10"],
    averageDailyAccessLimit: 20,
    status: "Active"
  },
  {
    id: "EMP-008",
    username: "hospital_admin",
    fullName: "Chief Dr. Elizabeth Blackburn",
    role: HospitalRole.HOSPITAL_ADMIN,
    department: "Executive Board",
    normalHours: { start: 9, end: 17 },
    typicalDevices: ["Executive Macbook Pro", "Hosp Admin-Tablet 01"],
    typicalIps: ["10.20.10.5", "192.168.1.15"], // Can access from home IP occasionally
    averageDailyAccessLimit: 15,
    status: "Active"
  },
  {
    id: "EMP-009",
    username: "analyst_sam",
    fullName: "Samuel Security",
    role: HospitalRole.SECURITY_ANALYST,
    department: "Security Operations Center (SOC)",
    normalHours: { start: 0, end: 24 }, // Allowed 24/7
    typicalDevices: ["SOC Dual-Mon Workstation", "SOC Laptop Secure"],
    typicalIps: ["10.20.90.11", "10.20.90.12"],
    averageDailyAccessLimit: 150, // high limits as monitoring
    status: "Active"
  },
  {
    id: "EMP-010",
    username: "it_admin",
    fullName: "Linus Tech-Administrator",
    role: HospitalRole.IT_ADMIN,
    department: "IT Infrastructure and DevOps",
    normalHours: { start: 0, end: 24 },
    typicalDevices: ["SysAdmin Secure ThinkPad", "Server room KVM Console"],
    typicalIps: ["10.20.100.1"],
    averageDailyAccessLimit: 100,
    status: "Active"
  }
];

const DEFAULT_PATIENTS: Patient[] = [];
/*
const OLD_DEFAULT_PATIENTS: Patient[] = [
  {
    id: "HIS-1092",
    fullName: "George Harris",
    dob: "1983-02-25",
    gender: "Male",
    address: "24 Abbey Road, Liverpool, UK",
    phone: "+44 7700 900077",
    email: "george@thebeatles.com",
    emergencyContact: "Olivia Harris (+44 7700 900088)",
    allergies: ["Penicillin", "Peanuts"],
    diagnoses: ["Type 2 Diabetes", "Chronic Hypertension"],
    isVip: false,
    isStaff: false,
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
    isVip: true, // TRIGGER FOR SENSITIVE ACCESS
    isStaff: false,
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
    isStaff: true, // TRIGGER FOR SENSITIVE ACCESS (Hospital employee medical record)
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
    admittedWard: "Intensive Care Unit",
    admittedBed: "ICU-02",
    status: "Admitted"
  },
  {
    id: "HIS-5112",
    fullName: "Bruce Wayne",
    dob: "1972-04-17",
    gender: "Male",
    address: "Wayne Manor, Gotham City",
    phone: "+1 (555) 100-2286",
    email: "b.wayne@waynecorp.com",
    emergencyContact: "Alfred Pennyworth (+1 555-100-2287)",
    allergies: ["Shellfish", "Bee Venom"],
    diagnoses: ["Recurrent Joint Sprains", "Concussion History"],
    isVip: true, // SENSITIVE RECORD (Billionaire Philanthropist)
    isStaff: false,
    status: "Discharged"
  },
  {
    id: "HIS-6023",
    fullName: "Zendaya Coleman",
    dob: "1996-09-01",
    gender: "Female",
    address: "902 Sunset Blvd, Los Angeles, CA",
    phone: "+1 (310) 555-8291",
    email: "z.c@hollywoodagency.com",
    emergencyContact: "Robert Coleman (+1 310-555-9001)",
    allergies: ["Pollen"],
    diagnoses: ["Acute Bronchitis"],
    isVip: true, // SENSITIVE RECORD (Celebrity Patient)
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6024",
    fullName: "Thomas A. Anderson",
    dob: "1971-09-11",
    gender: "Male",
    address: "Room 101, Adams Street, Chicago, IL",
    phone: "+1 (312) 555-0100",
    email: "neo@metacortex.com",
    emergencyContact: "Trinity Sparks (+1 312-555-0199)",
    allergies: ["Sulfur"],
    diagnoses: ["Depersonalization", "Chronic Insomnia"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6025",
    fullName: "Warrant Officer Ellen Ripley",
    dob: "2092-01-07",
    gender: "Female",
    address: "Wey-Yut Corp Quarters, Sector 4",
    phone: "+1 (800) 555-2179",
    email: "ripley@nostromo.org",
    emergencyContact: "Amanda Ripley (+1 800-555-0112)",
    allergies: ["Xenotoxins"],
    diagnoses: ["Hypothermia Prophylaxis", "Post-Traumatic Stress Disorder"],
    isVip: true,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6026",
    fullName: "Luke Skywalker",
    dob: "1977-05-25",
    gender: "Male",
    address: "Lars Moisture Farm, Tatooine",
    phone: "+1 (555) 218-3901",
    email: "luke@rebelalliance.net",
    emergencyContact: "Leia Organa (+1 555-890-4321)",
    allergies: [],
    diagnoses: ["Prosthetic Hand Calibration", "General Exhaustion"],
    isVip: true,
    isStaff: false,
    admittedWard: "General Medicine",
    admittedBed: "G-02",
    status: "Admitted"
  },
  {
    id: "HIS-6027",
    fullName: "Peter Parker",
    dob: "2001-08-10",
    gender: "Male",
    address: "20 Ingram St, Forest Hills, Queens, NY",
    phone: "+1 (718) 555-3456",
    email: "p.parker@dailybugle.com",
    emergencyContact: "May Parker (+1 718-555-7890)",
    allergies: ["Aspirin"],
    diagnoses: ["Acute Urticaria", "Muscle Spasms"],
    isVip: false,
    isStaff: true, // Hospital Lab Assistant role simulation
    status: "Checked In"
  },
  {
    id: "HIS-6028",
    fullName: "Clark Kent",
    dob: "1979-11-03",
    gender: "Male",
    address: "344 Clinton St, Apt 3B, Metropolis",
    phone: "+1 (212) 555-8392",
    email: "ckent@dailyplanet.com",
    emergencyContact: "Martha Kent (+1 785-555-1201)",
    allergies: ["Kryptonite"],
    diagnoses: ["None - General Wellness Evaluation"],
    isVip: false,
    isStaff: false,
    status: "Discharged"
  },
  {
    id: "HIS-6029",
    fullName: "Tony Stark",
    dob: "1970-05-29",
    gender: "Male",
    address: "10880 Malibu Point, Malibu, CA",
    phone: "+1 (310) 555-4636",
    email: "tstark@starkindustries.com",
    emergencyContact: "Pepper Potts (+1 310-555-4600)",
    allergies: ["Palladium"],
    diagnoses: ["Cardiomegaly", "Metal Fragment Monitoring"],
    isVip: true,
    isStaff: false,
    status: "In Consultation"
  },
  {
    id: "HIS-6030",
    fullName: "Princess Leia Organa",
    dob: "1956-10-21",
    gender: "Female",
    address: "Royal Palace, Alderaan",
    phone: "+1 (555) 890-4321",
    email: "leia@rebelalliance.net",
    emergencyContact: "Luke Skywalker (+1 555-218-3901)",
    allergies: [],
    diagnoses: ["Mild Hypertension", "Adrenal Fatigue"],
    isVip: true,
    isStaff: false,
    admittedWard: "General Medicine",
    admittedBed: "G-03",
    status: "Admitted"
  },
  {
    id: "HIS-6031",
    fullName: "John Doe",
    dob: "1980-01-01",
    gender: "Male",
    address: "Transient / Unknown",
    phone: "+1 (555) 000-0000",
    email: "unknown-patient@atif-hospital.org",
    emergencyContact: "None Recorded",
    allergies: [],
    diagnoses: ["Amnesia", "Lacerations"],
    isVip: false,
    isStaff: false,
    status: "Discharged"
  },
  {
    id: "HIS-6032",
    fullName: "Jane Smith",
    dob: "1990-05-15",
    gender: "Female",
    address: "100 Maple Avenue, Springfield, OR",
    phone: "+1 (503) 555-1234",
    email: "janesmith@or-telecom.com",
    emergencyContact: "John Smith (+1 503-555-4321)",
    allergies: ["Penicillin"],
    diagnoses: ["Pregnancy Consultation", "Iron Deficiency Anemia"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6033",
    fullName: "Dr. Indiana Jones",
    dob: "1899-07-01",
    gender: "Male",
    address: "Marshall College Dept of Archaeology, Bedford, NY",
    phone: "+1 (914) 555-7890",
    email: "indy@marshall.edu",
    emergencyContact: "Marion Ravenwood (+1 914-555-7891)",
    allergies: ["Ophidiophobia (Clinical Snake Terror)"],
    diagnoses: ["Osteoarthritis", "Moderate Dehydration"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6034",
    fullName: "Hermione Granger",
    dob: "1979-09-19",
    gender: "Female",
    address: "8 Hampstead Garden Suburb, London, UK",
    phone: "+44 20 7946 0123",
    email: "hermione@ministryofmagic.org",
    emergencyContact: "Mr. Granger (+44 20 7946 0124)",
    allergies: [],
    diagnoses: ["Mental Fatigue", "Sleep Deprivation"],
    isVip: false,
    isStaff: false,
    status: "Discharged"
  },
  {
    id: "HIS-6035",
    fullName: "Arthur Dent",
    dob: "1978-03-08",
    gender: "Male",
    address: "Country Cottage, Cottington, UK",
    phone: "+44 1632 960042",
    email: "arthur.dent@bbc.co.uk",
    emergencyContact: "Ford Prefect (+44 1632 960084)",
    allergies: ["Tea Deficiency"],
    diagnoses: ["Chronic Confusion", "Accidental Teleportation Anxiety"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6036",
    fullName: "Neo Sparks",
    dob: "1999-03-31",
    gender: "Male",
    address: "Nebuchadnezzar Quarters, Deck 4",
    phone: "+1 (555) 555-0101",
    email: "neo.sparks@resistance.net",
    emergencyContact: "Trinity (+1 555-555-0102)",
    allergies: [],
    diagnoses: ["Neural Connector Infection", "Minor Fever"],
    isVip: false,
    isStaff: false,
    admittedWard: "Intensive Care Unit",
    admittedBed: "ICU-01",
    status: "Admitted"
  },
  {
    id: "HIS-6037",
    fullName: "Walter White",
    dob: "1958-09-07",
    gender: "Male",
    address: "3828 Piermont Dr, Albuquerque, NM",
    phone: "+1 (505) 555-1481",
    email: "w.white@jpmorgan.com",
    emergencyContact: "Skyler White (+1 505-555-1480)",
    allergies: [],
    diagnoses: ["Bronchogenic Carcinoma Stage III", "Mild Pleural Effusion"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6038",
    fullName: "Sherlock Holmes",
    dob: "1854-01-06",
    gender: "Male",
    address: "221B Baker Street, London, UK",
    phone: "+44 20 7946 0999",
    email: "s.holmes@consultingdetective.co.uk",
    emergencyContact: "Dr. John Watson (+44 20 7946 0998)",
    allergies: ["Cocaine"],
    diagnoses: ["Substance Misuse History", "Acute Mental Hyperactivity"],
    isVip: true,
    isStaff: false,
    status: "In Consultation"
  },
  {
    id: "HIS-6039",
    fullName: "Katniss Everdeen",
    dob: "1990-05-08",
    gender: "Female",
    address: "The Seam, District 12, Panem",
    phone: "+1 (555) 112-2334",
    email: "mockingjay@panem.gov",
    emergencyContact: "Primrose Everdeen (+1 555-112-2335)",
    allergies: [],
    diagnoses: ["Superficial Laceration Left Shoulder", "Mild Malnutrition"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6040",
    fullName: "Commander James Bond",
    dob: "1968-04-13",
    gender: "Male",
    address: "30 Wellington Square, Chelsea, London",
    phone: "+44 20 7946 0007",
    email: "j.bond@mi6.gov.uk",
    emergencyContact: "Moneypenny (+44 20 7946 0010)",
    allergies: ["Analytical Venom"],
    diagnoses: ["Multiple Healing Soft Tissue Contusions", "Mild Chronic Hepatomegaly"],
    isVip: true,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6041",
    fullName: "Bilbo Baggins",
    dob: "1937-09-21",
    gender: "Male",
    address: "Bag End, Underhill, Hobbiton",
    phone: "+1 (555) 111-2222",
    email: "bilbo@shire.org",
    emergencyContact: "Frodo Baggins (+1 555-111-2223)",
    allergies: ["Morgul Spores"],
    diagnoses: ["Geriatric General Checkup", "Cognitive Decline Evaluation"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6042",
    fullName: "Rose Tyler",
    dob: "1987-04-27",
    gender: "Female",
    address: "73 Bucknall House, Powell Estate, London",
    phone: "+44 20 7946 0884",
    email: "rose.tyler@torchwood.org.uk",
    emergencyContact: "Jackie Tyler (+44 20 7946 0885)",
    allergies: [],
    diagnoses: ["Mild Temporal Distortion Resonance"],
    isVip: false,
    isStaff: true, // Hospital Admin Intern role simulation
    status: "Checked In"
  },
  {
    id: "HIS-6043",
    fullName: "Harry Potter",
    dob: "1980-07-31",
    gender: "Male",
    address: "4 Privet Drive, Little Whinging, Surrey",
    phone: "+1 (555) 934-3940",
    email: "h.potter@auror.ministry.gov",
    emergencyContact: "Hermione Granger (+44 20 7946 0123)",
    allergies: ["Basilisk Venom"],
    diagnoses: ["Frontal Bone Keloid Irritation", "Mild Myopia"],
    isVip: true,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6044",
    fullName: "Buffy Summers",
    dob: "1981-01-19",
    gender: "Female",
    address: "1630 Revello Drive, Sunnydale, CA",
    phone: "+1 (555) 619-3820",
    email: "buffy@slayer.org",
    emergencyContact: "Giles Rupert (+1 555-619-3800)",
    allergies: [],
    diagnoses: ["Repetitive Strain Injury - Wrists", "Polytraumata Tendency"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6045",
    fullName: "Michael Scott",
    dob: "1965-03-15",
    gender: "Male",
    address: "1725 Slough Avenue, Scranton, PA",
    phone: "+1 (570) 555-3841",
    email: "mscott@dundermifflin.com",
    emergencyContact: "Dwight Schrute (+1 570-555-0145)",
    allergies: ["George Foreman Grill Steam"],
    diagnoses: ["Foot Soles Localized Thermal Burn 1st Degree"],
    isVip: false,
    isStaff: false,
    status: "Discharged"
  },
  {
    id: "HIS-6046",
    fullName: "Dorothy Gale",
    dob: "1902-07-01",
    gender: "Female",
    address: "Uncle Henry Farm, Kansas",
    phone: "+1 (555) 781-4210",
    email: "dorothy@emeraldcity.org",
    emergencyContact: "Aunt Em (+1 555-781-4211)",
    allergies: ["Poppy Pollen"],
    diagnoses: ["Transient Syncope post Tornado Incident"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  },
  {
    id: "HIS-6047",
    fullName: "Marty McFly",
    dob: "1968-06-12",
    gender: "Male",
    address: "9303 Lyon Drive, Hill Valley, CA",
    phone: "+1 (555) 880-1201",
    email: "outatime@delorean.tech",
    emergencyContact: "Dr. Emmett Brown (+1 555-880-1985)",
    allergies: [],
    diagnoses: ["Mild Tinnitus", "Temporal Disorientation"],
    isVip: false,
    isStaff: false,
    status: "Checked In"
  }
];
*/

const DEFAULT_VITALS: Vitals[] = [];
const DEFAULT_NOTES: ClinicalNote[] = [];
const DEFAULT_LAB_REQUESTS: LabRequest[] = [];
const DEFAULT_RADIOLOGY: RadiologyRequest[] = [];
const DEFAULT_PRESCRIPTIONS: Prescription[] = [];
const DEFAULT_BILLING: BillingInvoice[] = [];
/*
const OLD_DEFAULT_VITALS: Vitals[] = [
  {
    id: "VIT-001",
    patientId: "HIS-1092",
    timestamp: "2026-06-21T08:30:00Z",
    heartRate: 74,
    bloodPressure: "135/85",
    temperature: 36.8,
    respirationRate: 16,
    recordedBy: "Nurse Florence Nightingale",
    notes: "Patient feels comfortable, glucose index level checked (110mg/dL)"
  },
  {
    id: "VIT-002",
    patientId: "HIS-4089",
    timestamp: "2026-06-21T09:12:00Z",
    heartRate: 88,
    bloodPressure: "115/70",
    temperature: 37.2,
    respirationRate: 18,
    recordedBy: "Nurse Florence Nightingale",
    notes: "Restless but vitals are fully stable post check-in"
  },
  {
    id: "VIT-003",
    patientId: "HIS-6026",
    timestamp: "2026-06-21T09:45:00Z",
    heartRate: 70,
    bloodPressure: "120/80",
    temperature: 36.5,
    respirationRate: 14,
    recordedBy: "Nurse Florence Nightingale",
    notes: "Prosthetic hand nerve impulses stable, heart rate perfect."
  },
  {
    id: "VIT-004",
    patientId: "HIS-6036",
    timestamp: "2026-06-21T10:10:00Z",
    heartRate: 95,
    bloodPressure: "110/75",
    temperature: 38.4,
    respirationRate: 20,
    recordedBy: "Nurse Florence Nightingale",
    notes: "Mild fever detected, neural connection port slight inflammation."
  },
  {
    id: "VIT-005",
    patientId: "HIS-6030",
    timestamp: "2026-06-21T10:15:00Z",
    heartRate: 82,
    bloodPressure: "140/90",
    temperature: 36.8,
    respirationRate: 16,
    recordedBy: "Nurse Florence Nightingale",
    notes: "Patient resting comfortably. Blood pressure slightly elevated."
  }
];

const DEFAULT_NOTES: ClinicalNote[] = [
  {
    id: "NOT-001",
    patientId: "HIS-1092",
    timestamp: "2026-06-21T08:45:00Z",
    createdBy: "dr_house",
    role: "Doctor",
    noteText: "Checked patient history. Diabetes under control. Suggested minor modification in daily Metformin scheduling. Heart sounds are S1 S2 normal."
  },
  {
    id: "NOT-002",
    patientId: "HIS-6026",
    timestamp: "2026-06-21T10:15:00Z",
    createdBy: "dr_house",
    role: "Doctor",
    noteText: "Intact prosthetic mechanical interface without localized peripheral nerve irritation. Reflexes normal. General state stable after active space flight."
  },
  {
    id: "NOT-003",
    patientId: "HIS-6036",
    timestamp: "2026-06-21T10:30:00Z",
    createdBy: "dr_house",
    role: "Doctor",
    noteText: "Fever and neural port inflammation. Ordered Strep A panel and suggested anti-neural-viral agent. Fluid intake to be increased."
  }
];

const DEFAULT_LAB_REQUESTS: LabRequest[] = [
  {
    id: "LAB-8001",
    patientId: "HIS-1092",
    testName: "HbA1c Glycated Hemoglobin",
    status: LabStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T09:00:00Z",
    sampleType: "Blood Plasma",
    result: "6.8% (Good glycated control range, target < 7%)",
    completedBy: "lab_scientist",
    completedDate: "2026-06-21T11:30:00Z"
  },
  {
    id: "LAB-8002",
    patientId: "HIS-2051",
    testName: "Serum Uric Acid Assessment",
    status: LabStatus.PROCESSING,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T10:15:00Z",
    sampleType: "Serum"
  },
  {
    id: "LAB-8003",
    patientId: "HIS-6023",
    testName: "Sputum Culture & Strep A Panel",
    status: LabStatus.PENDING,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T11:45:00Z"
  },
  {
    id: "LAB-8004",
    patientId: "HIS-6036",
    testName: "Neural Port Swab Culture",
    status: LabStatus.PENDING,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T12:00:00Z"
  }
];

const DEFAULT_RADIOLOGY: RadiologyRequest[] = [
  {
    id: "RAD-9001",
    patientId: "HIS-4089",
    imagingType: "X-Ray Left Humeral Shaft",
    status: RadStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T09:30:00Z",
    reportText: "No signs of active stress fractures. Intact bone texture post surgery recovery.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80",
    completedBy: "rad_officer",
    completedDate: "2026-06-21T10:45:00Z"
  },
  {
    id: "RAD-9002",
    patientId: "HIS-2051",
    imagingType: "CT Scan Coronary Angiogram",
    status: RadStatus.PENDING,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T11:15:00Z"
  },
  {
    id: "RAD-9003",
    patientId: "HIS-6029",
    imagingType: "Chest CT (Arc Reactor Alignment Visual)",
    status: RadStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-21T12:00:00Z",
    reportText: "Arc reactor unit seated beautifully, minor adjacent sternal bone thickening noted, otherwise healthy.",
    completedBy: "rad_officer",
    completedDate: "2026-06-21T13:00:00Z"
  }
];

const DEFAULT_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-501",
    patientId: "HIS-1092",
    medication: "Metformin Hydrochloride",
    dosage: "500mg",
    frequency: "BD (Twice Daily)",
    route: "Oral",
    duration: "30 days",
    status: PrescriptionStatus.DISPENSED,
    prescribedBy: "dr_house",
    prescribedDate: "2026-06-21T08:50:00Z",
    dispensedBy: "pharmacist_bob",
    dispensedDate: "2026-06-21T12:00:00Z",
    mar: [
      { id: "MAR-001", timestamp: "2026-06-21T13:00:00Z", status: "Administered", dose: "500mg", administeredBy: "Nurse Florence Nightingale", notes: "Taken with food. Glucose stable" },
      { id: "MAR-002", timestamp: "2026-06-22T08:00:00Z", status: "Scheduled", dose: "500mg" }
    ]
  },
  {
    id: "RX-502",
    patientId: "HIS-3044",
    medication: "Sumatriptan Succinate",
    dosage: "5000 mcg",
    frequency: "Stat (Immediately)",
    route: "Nasal Spray",
    duration: "1 day",
    status: PrescriptionStatus.PRESCRIBED,
    prescribedBy: "dr_house",
    prescribedDate: "2026-06-21T13:40:00Z",
    mar: []
  },
  {
    id: "RX-503",
    patientId: "HIS-6036",
    medication: "Anti-Neural-Viral Complex",
    dosage: "100mg",
    frequency: "TDS (Thrice Daily)",
    route: "Intravenous",
    duration: "7 days",
    status: PrescriptionStatus.PRESCRIBED,
    prescribedBy: "dr_house",
    prescribedDate: "2026-06-21T14:00:00Z",
    mar: []
  }
];

const DEFAULT_BEDS: WardBed[] = [
  { wardName: "General Medicine", bedNumber: "G-01", isOccupied: true, patientId: "HIS-1092" },
  { wardName: "General Medicine", bedNumber: "G-02", isOccupied: true, patientId: "HIS-6026" },
  { wardName: "General Medicine", bedNumber: "G-03", isOccupied: true, patientId: "HIS-6030" },
  { wardName: "Intensive Care Unit", bedNumber: "ICU-01", isOccupied: true, patientId: "HIS-6036" },
  { wardName: "Intensive Care Unit", bedNumber: "ICU-02", isOccupied: true, patientId: "HIS-4089" },
  { wardName: "Pediatric Ward", bedNumber: "P-01", isOccupied: false },
  { wardName: "Pediatric Ward", bedNumber: "P-02", isOccupied: false }
];

const DEFAULT_WARDS: Ward[] = [
  { name: "General Medicine", capacity: 3, availableBeds: 0, assignedNurseId: "EMP-003" },
  { name: "Intensive Care Unit", capacity: 2, availableBeds: 0, assignedNurseId: "EMP-003" },
  { name: "Pediatric Ward", capacity: 2, availableBeds: 2, assignedNurseId: "EMP-003" }
];

const DEFAULT_BILLING: BillingInvoice[] = [
  {
    id: "INV-7001",
    patientId: "HIS-1092",
    items: [
      { id: "BI-01", description: "Inpatient Bed Daily Allocation (General Ward)", amount: 120.00, timestamp: "2026-06-21T08:00:00Z" },
      { id: "BI-04", description: "Physician Inpatient Ward Evaluation", amount: 75.00, timestamp: "2026-06-21T09:00:00Z" },
      { id: "BI-03", description: "Glucose Lab Panel (HbA1c Assessment)", amount: 45.00, timestamp: "2026-06-12T11:30:00Z" }
    ],
    totalAmount: 240.00,
    insuranceClaimed: 180.00,
    patientPaid: 60.00,
    status: "Paid",
    issuedDate: "2026-06-21T12:00:00Z"
  },
  {
    id: "INV-7002",
    patientId: "HIS-4089",
    items: [
      { id: "BI-10", description: "Intensive Care Unit Day Care Ward Charge", amount: 450.00, timestamp: "2026-06-21T09:12:00Z" },
      { id: "BI-11", description: "Radiology X-Ray Skeleton Humeral High Resolution", amount: 110.00, timestamp: "2026-06-21T10:45:00Z" }
    ],
    totalAmount: 560.00,
    insuranceClaimed: 0.00,
    patientPaid: 0.00,
    status: "Unpaid",
    issuedDate: "2026-06-21T11:00:00Z"
  },
  {
    id: "INV-7003",
    patientId: "HIS-6026",
    items: [
      { id: "BI-20", description: "General Ward Double Occupancy Accommodation Daily Charge", amount: 180.00, timestamp: "2026-06-21T10:00:00Z" },
      { id: "BI-21", description: "Prosthetic Calibration Assessment", amount: 220.00, timestamp: "2026-06-21T10:15:00Z" }
    ],
    totalAmount: 400.00,
    insuranceClaimed: 300.00,
    patientPaid: 100.00,
    status: "Paid",
    issuedDate: "2026-06-21T12:30:00Z"
  }
];
*/

const DEFAULT_HANDOVERS: ShiftHandover[] = [
  {
    id: "HO-001",
    timestamp: "2026-06-21T14:00:00Z",
    senderName: "Nurse Florence Nightingale",
    receiverName: "Nurse Clara Barton",
    wardName: "General Medicine",
    handoverSummary: "Patient George Harris in bed G-01 is doing stable. HbA1c results released, doctor evaluated. Next medication run is scheduled tomorrow morning at 08:00."
  }
];

const RAW_PATIENTS_SPECS: {
  id: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  isVip?: boolean;
  isStaff?: boolean;
  admittedWard?: string;
  admittedBed?: string;
  status?: "Checked In" | "In Consultation" | "Admitted" | "Discharged" | "Awaiting Lab" | "Awaiting Radiology";
  diagnoses: string[];
  allergies: string[];
  address?: string;
}[] = [
  // 1-10
  { id: "HIS-1001", fullName: "John Doe Kelly", gender: "Male", age: 45, isVip: true, status: "In Consultation", diagnoses: ["Stable Angina", "Essential Hypertension"], allergies: ["Penicillin"] },
  { id: "HIS-1002", fullName: "Jane Doe", gender: "Female", age: 39, status: "Checked In", diagnoses: ["Acute Asthmatic Bronchitis"], allergies: [] },
  { id: "HIS-1004", fullName: "James Carter", gender: "Male", age: 32, status: "Awaiting Lab", diagnoses: ["Acute Appendicitis"], allergies: ["Sulfa Drugs"] },
  { id: "HIS-1092", fullName: "George Harris", gender: "Male", age: 61, admittedWard: "General Medicine", admittedBed: "G-01", diagnoses: ["Type 2 Diabetes", "Chronic Hypertension"], allergies: ["Penicillin", "Peanuts"] },
  { id: "HIS-2022", fullName: "Robert Johnson", gender: "Male", age: 55, status: "Checked In", diagnoses: ["Gastroesophageal Reflux Disease (GERD)"], allergies: [] },
  { id: "HIS-2034", fullName: "Mary Smith", gender: "Female", age: 34, status: "Awaiting Lab", diagnoses: ["Severe Iron Deficiency Anemia"], allergies: ["Aspirin"] },
  { id: "HIS-2051", fullName: "Arthur Vance", gender: "Male", age: 68, isVip: true, status: "Checked In", diagnoses: ["Stable Angina", "Acute Gouty Arthritis"], allergies: [] },
  { id: "HIS-3044", fullName: "Margaret Stone", gender: "Female", age: 51, isStaff: true, status: "In Consultation", diagnoses: ["Severe Migraine Headache", "Asthma"], allergies: ["Sulfonamides"] },
  { id: "HIS-3045", fullName: "James Brown", gender: "Male", age: 72, status: "Checked In", diagnoses: ["Chronic Kidney Disease Stage 3", "Osteoarthritis of Knee"], allergies: [] },
  { id: "HIS-4042", fullName: "Linda Johnson", gender: "Female", age: 29, status: "Awaiting Radiology", diagnoses: ["Acute Pharyngitis", "Mild Dehydration"], allergies: [] },

  // 11-20
  { id: "HIS-4089", fullName: "Sarah Conner", gender: "Female", age: 61, admittedWard: "Intensive Care Unit", admittedBed: "ICU-02", diagnoses: ["Severe Post-Traumatic Stress Disorder", "Healed Multiple Skeletal Fractures"], allergies: ["Adrenaline"] },
  { id: "HIS-5050", fullName: "Robert Wilson", gender: "Male", age: 65, status: "Checked In", diagnoses: ["Type 2 Diabetes", "Hyperlipidemia"], allergies: [] },
  { id: "HIS-5051", fullName: "Alice Cooper", gender: "Female", age: 47, status: "Awaiting Lab", diagnoses: ["Acute Cholecystitis"], allergies: ["Codeine"] },
  { id: "HIS-5112", fullName: "Bruce Wayland", gender: "Male", age: 54, isVip: true, status: "Checked In", diagnoses: ["Acute Mild Concussion", "Multiple Soft Tissue Contusions"], allergies: [] },
  { id: "HIS-6023", fullName: "William Shepard", gender: "Male", age: 48, status: "Checked In", diagnoses: ["Community-Acquired Pneumonia"], allergies: [] },
  { id: "HIS-6024", fullName: "Albert Ellis", gender: "Male", age: 59, status: "Checked In", diagnoses: ["Generalized Anxiety Disorder"], allergies: [] },
  { id: "HIS-6025", fullName: "Marie Carter", gender: "Female", age: 41, status: "Checked In", diagnoses: ["Hypothyroidism", "Vitamin D Deficiency"], allergies: [] },
  { id: "HIS-6026", fullName: "Arthur Denton", gender: "Male", age: 38, admittedWard: "General Medicine", admittedBed: "G-02", diagnoses: ["Phantom Limb Pain", "Peripheral Neuropathy"], allergies: [] },
  { id: "HIS-6027", fullName: "Ellen Ripley", gender: "Female", age: 35, status: "Checked In", diagnoses: ["Acute Severe Fatigue", "Hyperventilation"], allergies: [] },
  { id: "HIS-6028", fullName: "Lucas Sky", gender: "Male", age: 24, status: "Checked In", diagnoses: ["Right Hand Laceration", "Mild Wrist Sprain"], allergies: [] },

  // 21-30
  { id: "HIS-6029", fullName: "Leah Orson", gender: "Female", age: 28, status: "Checked In", diagnoses: ["Mild Intercostal Muscle Strain"], allergies: [] },
  { id: "HIS-6030", fullName: "Clark Kendall", gender: "Male", age: 33, admittedWard: "General Medicine", admittedBed: "G-03", diagnoses: ["Acute Environmental Allergy Rhinitis"], allergies: ["Lead"] },
  { id: "HIS-6031", fullName: "Bruce Bennett", gender: "Male", age: 46, status: "Checked In", diagnoses: ["Intermittent Explosive Disorder", "Mild Lumbar Strain"], allergies: [] },
  { id: "HIS-6032", fullName: "Peter Palmer", gender: "Male", age: 22, status: "Checked In", diagnoses: ["Allergic Contact Dermatitis"], allergies: ["Spider Venom"] },
  { id: "HIS-6033", fullName: "Anthony Starkey", gender: "Male", age: 50, status: "Checked In", diagnoses: ["Chronic Coronary Artery Disease", "Mild Sternal Tenderness"], allergies: [] },
  { id: "HIS-6034", fullName: "Stephen Rodgers", gender: "Male", age: 98, status: "Checked In", diagnoses: ["Chronic Osteoarthritis", "Slight Bradycardia"], allergies: [] },
  { id: "HIS-6035", fullName: "Natalia Romero", gender: "Female", age: 36, status: "Checked In", diagnoses: ["Right Shoulder Sprain"], allergies: [] },
  { id: "HIS-6036", fullName: "Sheridan Holmes", gender: "Male", age: 43, admittedWard: "Intensive Care Unit", admittedBed: "ICU-01", diagnoses: ["Fever of Unknown Origin", "Localized Superficial Skin Inflammation"], allergies: ["Morphine"] },
  { id: "HIS-6037", fullName: "John Watson", gender: "Male", age: 45, isStaff: true, status: "Checked In", diagnoses: ["Chronic Post-Traumatic Shoulder Pain"], allergies: [] },
  { id: "HIS-6038", fullName: "Winston Chambers", gender: "Male", age: 74, status: "Checked In", diagnoses: ["Chronic Obstructive Pulmonary Disease (COPD)"], allergies: [] },

  // 31-40
  { id: "HIS-6039", fullName: "Elizabeth Bennett", gender: "Female", age: 26, status: "Checked In", diagnoses: ["Mild Seasonal Influenza"], allergies: [] },
  { id: "HIS-6040", fullName: "William Darcy", gender: "Male", age: 31, status: "Checked In", diagnoses: ["Mild Tension Headache"], allergies: [] },
  { id: "HIS-6041", fullName: "Jane Elrod", gender: "Female", age: 27, status: "Checked In", diagnoses: ["Acute Tonsillitis"], allergies: [] },
  { id: "HIS-6042", fullName: "Rose Taylor", gender: "Female", age: 25, isStaff: true, status: "Checked In", diagnoses: ["Mild Temporal Vertigo"], allergies: [] },
  { id: "HIS-6043", fullName: "Harold Potter", gender: "Male", age: 23, isVip: true, status: "Checked In", diagnoses: ["Mild Myopia", "Keloid Scar Irritation"], allergies: [] },
  { id: "HIS-6044", fullName: "Elizabeth Summers", gender: "Female", age: 24, status: "Checked In", diagnoses: ["Wrist Tendonitis", "Contusions of Ankle"], allergies: [] },
  { id: "HIS-6045", fullName: "Michael Scott", gender: "Male", age: 42, status: "Discharged", diagnoses: ["Foot Sole Localized Thermal Burn 1st Degree"], allergies: ["George Foreman Grill Steam"] },
  { id: "HIS-6046", fullName: "Dorothy Gates", gender: "Female", age: 30, status: "Checked In", diagnoses: ["Transient Syncope post Mild Concussion"], allergies: ["Poppy Pollen"] },
  { id: "HIS-6047", fullName: "Martin Miller", gender: "Male", age: 28, status: "Checked In", diagnoses: ["Mild Tinnitus", "Temporal Disorientation"], allergies: [] },
  { id: "HIS-7080", fullName: "Robert Dylan", gender: "Male", age: 85, status: "Checked In", diagnoses: ["Geriatric Frailty", "Cognitive Decline"], allergies: [] },

  // 41-50
  { id: "HIS-8001", fullName: "Thomas Anderson", gender: "Male", age: 35, status: "Checked In", diagnoses: ["Chronic Sleep Deprivation", "Tension Headache"], allergies: [] },
  { id: "HIS-8002", fullName: "Patricia Miller", gender: "Female", age: 62, status: "In Consultation", diagnoses: ["Rheumatoid Arthritis", "Osteoporosis"], allergies: ["Sulfa"] },
  { id: "HIS-8003", fullName: "Christopher Davis", gender: "Male", age: 58, status: "Checked In", diagnoses: ["Atrial Fibrillation", "Hyperlipidemia"], allergies: [] },
  { id: "HIS-8004", fullName: "Barbara Garcia", gender: "Female", age: 49, status: "Checked In", diagnoses: ["Hypothyroidism", "Iron Deficiency Anemia"], allergies: [] },
  { id: "HIS-8005", fullName: "Matthew Rodriguez", gender: "Male", age: 41, status: "Checked In", diagnoses: ["Gastroesophageal Reflux Disease (GERD)"], allergies: ["Aspirin"] },
  { id: "HIS-8006", fullName: "Elizabeth Martinez", gender: "Female", age: 53, status: "In Consultation", diagnoses: ["Type 2 Diabetes", "Mild Obesity"], allergies: [] },
  { id: "HIS-8007", fullName: "Andrew Hernandez", gender: "Male", age: 30, status: "Checked In", diagnoses: ["Allergic Asthma", "Seasonal Allergic Rhinitis"], allergies: ["Grass Pollen"] },
  { id: "HIS-8008", fullName: "Jennifer Lopez", gender: "Female", age: 45, status: "Checked In", diagnoses: ["Acute Sinusitis"], allergies: [] },
  { id: "HIS-8009", fullName: "Joshua Gonzalez", gender: "Male", age: 27, status: "Checked In", diagnoses: ["Lumbar Muscle Strain"], allergies: [] },
  { id: "HIS-8010", fullName: "Maria Wilson", gender: "Female", age: 66, status: "Checked In", diagnoses: ["Chronic Hypertension", "Osteoarthritis of Hip"], allergies: ["Penicillin"] },

  // 51-60
  { id: "HIS-8011", fullName: "Kevin Anderson", gender: "Male", age: 50, status: "Checked In", diagnoses: ["Gouty Arthritis", "Mild Hypertension"], allergies: [] },
  { id: "HIS-8012", fullName: "Susan Thomas", gender: "Female", age: 57, status: "Checked In", diagnoses: ["Chronic Fatigue Syndrome"], allergies: [] },
  { id: "HIS-8013", fullName: "Brian Taylor", gender: "Male", age: 33, status: "Checked In", diagnoses: ["Acute Gastroenteritis", "Mild Dehydration"], allergies: [] },
  { id: "HIS-8014", fullName: "Margaret Moore", gender: "Female", age: 71, status: "Checked In", diagnoses: ["Chronic Heart Failure Stage B", "Atrial Fibrillation"], allergies: [] },
  { id: "HIS-8015", fullName: "Edward Jackson", gender: "Male", age: 60, status: "Checked In", diagnoses: ["Type 2 Diabetes", "Peripheral Neuropathy"], allergies: [] },
  { id: "HIS-8016", fullName: "Dorothy Martin", gender: "Female", age: 68, status: "Checked In", diagnoses: ["Chronic Stable Angina"], allergies: [] },
  { id: "HIS-8017", fullName: "Ronald Lee", gender: "Male", age: 44, status: "Checked In", diagnoses: ["Hyperlipidemia", "Fatty Liver Disease"], allergies: [] },
  { id: "HIS-8018", fullName: "Lisa Perez", gender: "Female", age: 38, status: "Checked In", diagnoses: ["Migraine with Aura"], allergies: [] },
  { id: "HIS-8019", fullName: "Timothy Thompson", gender: "Male", age: 52, status: "Checked In", diagnoses: ["Essential Hypertension"], allergies: [] },
  { id: "HIS-8020", fullName: "Nancy White", gender: "Female", age: 47, status: "Checked In", diagnoses: ["Anxiety Disorder", "Irritable Bowel Syndrome"], allergies: [] },

  // 61-70
  { id: "HIS-8021", fullName: "Jason Harris", gender: "Male", age: 39, status: "Checked In", diagnoses: ["Chronic Insomnia"], allergies: [] },
  { id: "HIS-8022", fullName: "Karen Sanchez", gender: "Female", age: 55, status: "Checked In", diagnoses: ["Hypothyroidism"], allergies: [] },
  { id: "HIS-8023", fullName: "Jeffrey Clark", gender: "Male", age: 63, status: "Checked In", diagnoses: ["Benign Prostatic Hyperplasia (BPH)"], allergies: [] },
  { id: "HIS-8024", fullName: "Betty Ramirez", gender: "Female", age: 70, status: "Checked In", diagnoses: ["Osteoarthritis of Hand", "Hypertension"], allergies: [] },
  { id: "HIS-8025", fullName: "Ryan Lewis", gender: "Male", age: 29, status: "Checked In", diagnoses: ["Patellar Tendonitis"], allergies: [] },
  { id: "HIS-8026", fullName: "Helen Robinson", gender: "Female", age: 64, status: "Checked In", diagnoses: ["Chronic Kidney Disease Stage 2"], allergies: [] },
  { id: "HIS-8027", fullName: "Jacob Walker", gender: "Male", age: 31, status: "Checked In", diagnoses: ["Acute Bronchitis"], allergies: [] },
  { id: "HIS-8028", fullName: "Sandra Young", gender: "Female", age: 56, status: "Checked In", diagnoses: ["Type 2 Diabetes"], allergies: [] },
  { id: "HIS-8029", fullName: "Gary Allen", gender: "Male", age: 67, status: "Checked In", diagnoses: ["Chronic Stable Angina", "Hypertension"], allergies: [] },
  { id: "HIS-8030", fullName: "Donna King", gender: "Female", age: 50, status: "Checked In", diagnoses: ["Asthma", "Allergic Rhinitis"], allergies: [] },

  // 71-80
  { id: "HIS-8031", fullName: "Nicholas Wright", gender: "Male", age: 43, status: "Checked In", diagnoses: ["GERD", "Obesity Class I"], allergies: [] },
  { id: "HIS-8032", fullName: "Ruth Scott", gender: "Female", age: 73, status: "Checked In", diagnoses: ["Osteoporosis", "Vitamin D Deficiency"], allergies: [] },
  { id: "HIS-8033", fullName: "Eric Torres", gender: "Male", age: 36, status: "Checked In", diagnoses: ["Chronic Low Back Pain"], allergies: [] },
  { id: "HIS-8034", fullName: "Carol Nguyen", gender: "Female", age: 42, status: "Checked In", diagnoses: ["Iron Deficiency Anemia"], allergies: [] },
  { id: "HIS-8035", fullName: "Stephen Hill", gender: "Male", age: 51, status: "Checked In", diagnoses: ["Hyperlipidemia", "Prediabetes"], allergies: [] },
  { id: "HIS-8036", fullName: "Michelle Flores", gender: "Female", age: 48, status: "Checked In", diagnoses: ["Chronic Migraine"], allergies: [] },
  { id: "HIS-8037", fullName: "Jonathan Green", gender: "Male", age: 54, status: "Checked In", diagnoses: ["Atrial Fibrillation"], allergies: [] },
  { id: "HIS-8038", fullName: "Amanda Adams", gender: "Female", age: 37, status: "Checked In", diagnoses: ["Hypothyroidism", "Generalized Anxiety"], allergies: [] },
  { id: "HIS-8039", fullName: "Larry Nelson", gender: "Male", age: 65, status: "Checked In", diagnoses: ["COPD Mild"], allergies: [] },
  { id: "HIS-8040", fullName: "Melissa Baker", gender: "Female", age: 46, status: "Checked In", diagnoses: ["Rheumatoid Arthritis"], allergies: [] }
];

RAW_PATIENTS_SPECS.forEach((s, idx) => {
  const pId = s.id;
  const birthYear = 2026 - s.age;
  const dob = `${birthYear}-05-15`;
  const phone = `+1 (555) ${s.age * 7 + 100}-${pId.replace("HIS-", "")}`;
  const email = `${s.fullName.toLowerCase().replace(/\s+/g, ".")}@hospital-directory.org`;
  const emergencyContact = `Spouse / Contact (${phone})`;
  const status = s.admittedWard ? "Admitted" : (s.status || "Checked In");
  
  let sensitivity: "NORMAL" | "CONFIDENTIAL" | "RESTRICTED" | "HIGHLY_SENSITIVE" = "NORMAL";
  if (s.isVip) sensitivity = "HIGHLY_SENSITIVE";
  else if (s.isStaff) sensitivity = "CONFIDENTIAL";

  DEFAULT_PATIENTS.push({
    id: pId,
    fullName: s.fullName,
    dob,
    gender: s.gender,
    address: s.address || `${s.age % 100 + 10} Oak Ridge Blvd, Capital City`,
    phone,
    email,
    emergencyContact,
    allergies: s.allergies,
    diagnoses: s.diagnoses,
    isVip: s.isVip || false,
    isStaff: s.isStaff || false,
    sensitivity,
    admittedWard: s.admittedWard,
    admittedBed: s.admittedBed,
    status
  });

  const vit1Id = `VIT-${idx}-1`;
  const vit2Id = `VIT-${idx}-2`;
  
  let hr = 72 + (idx % 12);
  let bp = "120/80";
  let temp = 36.6 + (idx % 5) * 0.1;
  let resp = 14 + (idx % 4);
  
  if (s.diagnoses.join().includes("Fever") || s.diagnoses.join().includes("Pneumonia")) {
    temp = 38.4;
    hr = 96;
    resp = 20;
  } else if (s.diagnoses.join().includes("Hypertension")) {
    bp = "145/92";
  }

  DEFAULT_VITALS.push({
    id: vit1Id,
    patientId: pId,
    timestamp: "2026-06-24T08:30:00Z",
    heartRate: hr,
    bloodPressure: bp,
    temperature: Number(temp.toFixed(1)),
    respirationRate: resp,
    recordedBy: "Nurse Florence Nightingale",
    notes: `Initial baseline clinical assessment for ${s.fullName}.`
  });

  let hr2 = hr - 2;
  let bp2 = bp;
  let temp2 = temp > 37.5 ? temp - 0.8 : temp;
  if (bp === "145/92") bp2 = "130/82";

  DEFAULT_VITALS.push({
    id: vit2Id,
    patientId: pId,
    timestamp: "2026-06-25T09:45:00Z",
    heartRate: hr2,
    bloodPressure: bp2,
    temperature: Number(temp2.toFixed(1)),
    respirationRate: resp,
    recordedBy: "Nurse Florence Nightingale",
    notes: `Routine follow-up vitals. Parameters stabilizing.`
  });

  DEFAULT_NOTES.push({
    id: `NOT-${idx}-1`,
    patientId: pId,
    timestamp: "2026-06-24T09:00:00Z",
    createdBy: idx % 2 === 0 ? "dr_house" : "dr_pasteur",
    role: "Doctor",
    noteText: `Clinical intake file for ${s.fullName}. Patient was evaluated for active symptoms associated with ${s.diagnoses.join(" and ")}. Clear pulmonary fields and active perfusion noted on examination. Suggest diagnostic workup including lab work and radiology mapping.`
  });

  DEFAULT_NOTES.push({
    id: `NOT-${idx}-2`,
    patientId: pId,
    timestamp: "2026-06-25T11:15:00Z",
    createdBy: "Nurse Florence Nightingale",
    role: "Nurse",
    noteText: `Shift nurse progress report. Patient is fully alert, cooperative, and oriented x3. Adhering perfectly to current care plan and medical regimen. Tolerating oral intake and prescribed therapies without acute distress. Encouraged gentle ambulation.`
  });

  DEFAULT_LAB_REQUESTS.push({
    id: `LAB-${idx}-1`,
    patientId: pId,
    testName: "Complete Blood Count (CBC) with Diff",
    status: LabStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-24T08:30:00Z",
    sampleType: "Whole Blood",
    result: "WBC: 6.5 K/uL (Normal), RBC: 4.6 M/uL (Normal), Hb: 14.5 g/dL (Normal), Hct: 42% (Normal), Platelets: 220 K/uL (Normal). No hematologic anomalies.",
    completedBy: "lab_scientist",
    completedDate: "2026-06-24T11:30:00Z"
  });

  let specificLab = "Comprehensive Metabolic Panel (CMP)";
  let specificLabResult = "Sodium: 139 mEq/L, Potassium: 4.1 mEq/L, Chloride: 102 mEq/L, Bicarbonate: 24 mEq/L, BUN: 14 mg/dL, Creatinine: 0.9 mg/dL (Normal renal baseline).";
  if (s.diagnoses.join().includes("Diabetes")) {
    specificLab = "HbA1c Glycated Hemoglobin";
    specificLabResult = "HbA1c: 6.8% (Good glycaemic control, target < 7.0%).";
  } else if (s.diagnoses.join().includes("Gout")) {
    specificLab = "Serum Uric Acid Level";
    specificLabResult = "Uric Acid: 8.2 mg/dL (Elevated, consistent with acute flare).";
  } else if (s.diagnoses.join().includes("Hypothyroidism")) {
    specificLab = "TSH and Free T4 Assay";
    specificLabResult = "TSH: 2.8 uIU/mL (Normal), Free T4: 1.2 ng/dL (Euthyroid state maintained).";
  } else if (s.diagnoses.join().includes("Kidney")) {
    specificLab = "Renal Function Panel";
    specificLabResult = "eGFR: 52 mL/min/1.73m2, Creatinine: 1.4 mg/dL (Chronic Stage 2/3 baseline).";
  }

  DEFAULT_LAB_REQUESTS.push({
    id: `LAB-${idx}-2`,
    patientId: pId,
    testName: specificLab,
    status: idx % 3 === 0 ? LabStatus.PROCESSING : LabStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-25T10:00:00Z",
    sampleType: "Serum",
    result: idx % 3 === 0 ? undefined : specificLabResult,
    completedBy: idx % 3 === 0 ? undefined : "lab_scientist",
    completedDate: idx % 3 === 0 ? undefined : "2026-06-25T13:00:00Z"
  });

  DEFAULT_RADIOLOGY.push({
    id: `RAD-${idx}-1`,
    patientId: pId,
    imagingType: s.diagnoses.join().includes("Pneumonia") || s.diagnoses.join().includes("Bronchitis") || s.diagnoses.join().includes("Asthma") ? "Chest X-Ray PA and Lateral View" : "Ultrasound Abdomen Complete",
    status: RadStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-24T10:00:00Z",
    reportText: s.diagnoses.join().includes("Pneumonia") 
      ? "Infiltration in right lower lung lobe consistent with acute localized pneumonia. No pleural effusions or cardiac enlargement noted." 
      : "No acute intra-abdominal abnormalities. Solid visceral organs present with normal size, echogenicity and architecture.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80",
    completedBy: "rad_officer",
    completedDate: "2026-06-24T13:30:00Z"
  });

  DEFAULT_RADIOLOGY.push({
    id: `RAD-${idx}-2`,
    patientId: pId,
    imagingType: s.diagnoses.join().includes("Fracture") || s.diagnoses.join().includes("Osteoarthritis") || s.diagnoses.join().includes("Pain") ? "X-Ray Affected Joint/Bone" : "MRI Brain Screening",
    status: idx % 4 === 1 ? RadStatus.PENDING : RadStatus.COMPLETED,
    orderedBy: "dr_house",
    orderedDate: "2026-06-25T11:00:00Z",
    reportText: idx % 4 === 1 ? undefined : "Intact bony structure and cortical alignment without active focal lesions. Joint spaces are adequately preserved.",
    completedBy: idx % 4 === 1 ? undefined : "rad_officer",
    completedDate: idx % 4 === 1 ? undefined : "2026-06-25T14:30:00Z"
  });

  let primaryMeds = "Atorvastatin Calcium";
  let doseStr = "20mg";
  let routeStr = "Oral";
  let freqStr = "QD (Once Daily)";
  
  if (s.diagnoses.join().includes("Diabetes")) {
    primaryMeds = "Metformin Hydrochloride";
    doseStr = "500mg";
    freqStr = "BD (Twice Daily)";
  } else if (s.diagnoses.join().includes("Hypertension")) {
    primaryMeds = "Lisinopril";
    doseStr = "10mg";
    freqStr = "QD (Once Daily)";
  } else if (s.diagnoses.join().includes("Asthma")) {
    primaryMeds = "Albuterol Inhaler";
    doseStr = "90 mcg";
    freqStr = "PRN (As Needed)";
    routeStr = "Inhalation";
  } else if (s.diagnoses.join().includes("GERD")) {
    primaryMeds = "Omeprazole Delayed Release";
    doseStr = "20mg";
    freqStr = "QD (Once Daily)";
  } else if (s.diagnoses.join().includes("Hypothyroidism")) {
    primaryMeds = "Levothyroxine Sodium";
    doseStr = "75 mcg";
    freqStr = "QD (Once Daily)";
  }

  DEFAULT_PRESCRIPTIONS.push({
    id: `RX-${idx}-1`,
    patientId: pId,
    medication: primaryMeds,
    dosage: doseStr,
    frequency: freqStr,
    route: routeStr,
    duration: "30 days",
    status: PrescriptionStatus.DISPENSED,
    prescribedBy: "dr_house",
    prescribedDate: "2026-06-24T09:15:00Z",
    dispensedBy: "pharmacist_bob",
    dispensedDate: "2026-06-24T12:00:00Z",
    mar: [
      { id: `MAR-${idx}-1a`, timestamp: "2026-06-24T13:00:00Z", status: "Administered", dose: doseStr, administeredBy: "Nurse Florence Nightingale", notes: "First dose tolerated well, no acute reaction." },
      { id: `MAR-${idx}-1b`, timestamp: "2026-06-25T13:00:00Z", status: "Administered", dose: doseStr, administeredBy: "Nurse Florence Nightingale" }
    ]
  });

  DEFAULT_PRESCRIPTIONS.push({
    id: `RX-${idx}-2`,
    patientId: pId,
    medication: "Acetaminophen Extra Strength",
    dosage: "500mg",
    frequency: "QDS (Four Times Daily)",
    route: "Oral",
    duration: "7 days",
    status: PrescriptionStatus.PRESCRIBED,
    prescribedBy: "dr_house",
    prescribedDate: "2026-06-25T10:45:00Z",
    mar: []
  });

  DEFAULT_BILLING.push({
    id: `INV-${idx}-1`,
    patientId: pId,
    items: [
      { id: `BI-${idx}-1a`, description: "Clinical Physician Inpatient Intake Consultation Fee", amount: 150.00, timestamp: "2026-06-24T09:00:00Z" },
      { id: `BI-${idx}-1b`, description: "General Chemistry Blood Laboratory Assay", amount: 75.00, timestamp: "2026-06-24T11:30:00Z" },
      { id: `BI-${idx}-1c`, description: "Standard Diagnostic Radiographic Study Fee", amount: 120.00, timestamp: "2026-06-24T13:30:00Z" }
    ],
    totalAmount: 345.00,
    insuranceClaimed: s.isVip ? 0.00 : 276.00,
    patientPaid: s.isVip ? 345.00 : 69.00,
    status: "Paid",
    issuedDate: "2026-06-24T15:00:00Z"
  });

  DEFAULT_BILLING.push({
    id: `INV-${idx}-2`,
    patientId: pId,
    items: [
      { id: `BI-${idx}-2a`, description: "Routine Daily Ward Bed Accommodation & Clinical Nursing Charge", amount: 110.00, timestamp: "2026-06-25T10:00:00Z" }
    ],
    totalAmount: 110.00,
    insuranceClaimed: 0.00,
    patientPaid: 0.00,
    status: s.admittedWard ? "Unpaid" : "Submitted to Insurance",
    issuedDate: "2026-06-25T12:00:00Z"
  });
});

const DEFAULT_BEDS: WardBed[] = [
  { wardName: "General Medicine", bedNumber: "G-01", isOccupied: true, patientId: "HIS-1092" },
  { wardName: "General Medicine", bedNumber: "G-02", isOccupied: true, patientId: "HIS-6026" },
  { wardName: "General Medicine", bedNumber: "G-03", isOccupied: true, patientId: "HIS-6030" },
  { wardName: "Intensive Care Unit", bedNumber: "ICU-01", isOccupied: true, patientId: "HIS-6036" },
  { wardName: "Intensive Care Unit", bedNumber: "ICU-02", isOccupied: true, patientId: "HIS-4089" },
  { wardName: "Pediatric Ward", bedNumber: "P-01", isOccupied: false },
  { wardName: "Pediatric Ward", bedNumber: "P-02", isOccupied: false }
];

const DEFAULT_WARDS: Ward[] = [
  { name: "General Medicine", capacity: 3, availableBeds: 0, assignedNurseId: "EMP-003" },
  { name: "Intensive Care Unit", capacity: 2, availableBeds: 0, assignedNurseId: "EMP-003" },
  { name: "Pediatric Ward", capacity: 2, availableBeds: 2, assignedNurseId: "EMP-003" }
];

const DEFAULT_SECURITY_EVENTS: SecurityEvent[] = [];

const DEFAULT_INCIDENTS: ThreatIncident[] = [];

const DEFAULT_TEMPLATES: BaselineTemplate[] = [
  {
    role: HospitalRole.DOCTOR,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "16:00",
    typicalDailyPatientViews: 30,
    typicalHourlyPatientViews: 5,
    typicalSensitiveRecordAccessRate: 3,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 45,
    typicalModulesAccessed: ["Patients", "Consultations", "Prescriptions", "Laboratory", "Radiology", "Admissions"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 90
  },
  {
    role: HospitalRole.NURSE,
    typicalShiftStart: "07:00",
    typicalShiftEnd: "19:00",
    typicalDailyPatientViews: 45,
    typicalHourlyPatientViews: 8,
    typicalSensitiveRecordAccessRate: 1,
    typicalDailyLogins: 6,
    averageSessionDurationMin: 35,
    typicalModulesAccessed: ["Vitals", "MAR", "Nursing Notes", "Admissions", "Patients"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    baselineConfidence: 85
  },
  {
    role: HospitalRole.LAB_SCIENTIST,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "16:00",
    typicalDailyPatientViews: 20,
    typicalHourlyPatientViews: 3,
    typicalSensitiveRecordAccessRate: 0,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 30,
    typicalModulesAccessed: ["Laboratory", "Results", "Patients"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 92
  },
  {
    role: HospitalRole.RADIOLOGY_OFFICER,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "16:00",
    typicalDailyPatientViews: 25,
    typicalHourlyPatientViews: 3,
    typicalSensitiveRecordAccessRate: 0,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 30,
    typicalModulesAccessed: ["Radiology", "Imaging Reports", "Patients"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 92
  },
  {
    role: HospitalRole.PHARMACIST,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "18:00",
    typicalDailyPatientViews: 40,
    typicalHourlyPatientViews: 4,
    typicalSensitiveRecordAccessRate: 1,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 25,
    typicalModulesAccessed: ["Pharmacy", "Prescriptions", "Inventory", "Patients"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    baselineConfidence: 88
  },
  {
    role: HospitalRole.ACCOUNTS_OFFICER,
    typicalShiftStart: "09:00",
    typicalShiftEnd: "17:00",
    typicalDailyPatientViews: 10,
    typicalHourlyPatientViews: 1,
    typicalSensitiveRecordAccessRate: 0,
    typicalDailyLogins: 2,
    averageSessionDurationMin: 30,
    typicalModulesAccessed: ["Billing", "Invoices", "Payments"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 94
  },
  {
    role: HospitalRole.HIM_OFFICER,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "17:00",
    typicalDailyPatientViews: 80,
    typicalHourlyPatientViews: 10,
    typicalSensitiveRecordAccessRate: 3,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 40,
    typicalModulesAccessed: ["Registration", "Patient Records", "Admissions"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 85
  },
  {
    role: HospitalRole.HOSPITAL_ADMIN,
    typicalShiftStart: "09:00",
    typicalShiftEnd: "17:00",
    typicalDailyPatientViews: 3,
    typicalHourlyPatientViews: 1,
    typicalSensitiveRecordAccessRate: 0,
    typicalDailyLogins: 2,
    averageSessionDurationMin: 45,
    typicalModulesAccessed: ["User Management", "Department Management", "Reports", "Audit Logs"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 95
  },
  {
    role: HospitalRole.IT_ADMIN,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "18:00",
    typicalDailyPatientViews: 1,
    typicalHourlyPatientViews: 1,
    typicalSensitiveRecordAccessRate: 0,
    typicalDailyLogins: 3,
    averageSessionDurationMin: 40,
    typicalModulesAccessed: ["Infrastructure", "Users", "Servers", "Devices", "Security Settings"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 95
  },
  {
    role: HospitalRole.SECURITY_ANALYST,
    typicalShiftStart: "08:00",
    typicalShiftEnd: "18:00",
    typicalDailyPatientViews: 5,
    typicalHourlyPatientViews: 1,
    typicalSensitiveRecordAccessRate: 1,
    typicalDailyLogins: 4,
    averageSessionDurationMin: 50,
    typicalModulesAccessed: ["Threat Feed", "Security Events", "Incidents", "Threat Intelligence", "Security Analytics"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    baselineConfidence: 90
  }
];

export function getDefaultBaselineForRole(role: HospitalRole): Partial<UserBehaviorProfile> {
  const match = DEFAULT_TEMPLATES.find(t => t.role === role);
  if (match) {
    const shiftParts = match.typicalShiftStart.split(":");
    const startHour = parseInt(shiftParts[0]) || 8;
    const endParts = match.typicalShiftEnd.split(":");
    const endHour = parseInt(endParts[0]) || 17;
    return {
      typicalShiftStart: match.typicalShiftStart,
      typicalShiftEnd: match.typicalShiftEnd,
      typicalLoginHours: { start: startHour, end: endHour },
      typicalPatientViewsPerDay: match.typicalDailyPatientViews,
      typicalHourlyPatientViews: match.typicalHourlyPatientViews,
      typicalDailyLogins: match.typicalDailyLogins,
      typicalSensitiveRecordAccessRate: match.typicalSensitiveRecordAccessRate,
      typicalModulesAccessed: match.typicalModulesAccessed,
      normalWorkingDays: match.normalWorkingDays,
      averageSessionDurationMin: match.averageSessionDurationMin,
      baselineConfidence: match.baselineConfidence
    };
  }
  return {
    typicalShiftStart: "08:00",
    typicalShiftEnd: "17:00",
    typicalLoginHours: { start: 8, end: 17 },
    typicalPatientViewsPerDay: 15,
    typicalHourlyPatientViews: 2,
    typicalDailyLogins: 2,
    typicalSensitiveRecordAccessRate: 0,
    typicalModulesAccessed: ["Patients"],
    normalWorkingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    averageSessionDurationMin: 30,
    baselineConfidence: 80
  };
}

const DEFAULT_BEHAVIOR: UserBehaviorProfile[] = [
  {
    userId: "EMP-001",
    username: "him_officer",
    role: HospitalRole.HIM_OFFICER,
    averageWeeklyViews: 120,
    currentWeekViews: 42,
    loginHoursDistribution: { 8: 10, 9: 15, 10: 12, 11: 18, 12: 10, 13: 8, 14: 15, 15: 12, 16: 15, 17: 5 },
    recentIps: ["10.20.1.15", "10.20.1.16"],
    recentDevices: ["Desktop HIM-01", "ChromeOS HIM-Terminal"]
  },
  {
    userId: "EMP-002",
    username: "dr_house",
    role: HospitalRole.DOCTOR,
    averageWeeklyViews: 80,
    currentWeekViews: 28,
    loginHoursDistribution: { 7: 5, 8: 10, 9: 12, 10: 15, 11: 18, 12: 12, 13: 15, 14: 10, 15: 15, 16: 12, 17: 8, 18: 5 },
    recentIps: ["10.20.2.100"],
    recentDevices: ["Clinic Desk PC-11"]
  },
  {
    userId: "EMP-003",
    username: "nurse_rached",
    role: HospitalRole.NURSE,
    averageWeeklyViews: 150,
    currentWeekViews: 55,
    loginHoursDistribution: { 6: 5, 7: 15, 8: 20, 12: 15, 15: 15, 18: 20, 21: 10 },
    recentIps: ["10.20.3.50"],
    recentDevices: ["Ward Rover Cart-02"]
  },
  {
    userId: "EMP-006",
    username: "pharmacist_bob",
    role: HospitalRole.PHARMACIST,
    averageWeeklyViews: 90,
    currentWeekViews: 31,
    loginHoursDistribution: { 8: 8, 9: 10, 10: 12, 11: 12, 12: 10, 13: 10, 14: 10, 15: 8, 16: 12, 17: 15, 18: 10, 19: 5 },
    recentIps: ["10.20.6.30"],
    recentDevices: ["Pharmacy dispense-PC-01"]
  }
];

const DEFAULT_THREAT_FEED: ThreatFeedItem[] = [];

// Database controller
export class Database {
  private data: DatabaseSchema;
  private activeSessions: { [username: string]: string } = {};
  private sessionLastActivity: { [username: string]: number } = {};
  private initialSecurityBackup: {
    securityEvents: any[];
    incidents: any[];
    threatFeed: any[];
    simulations: any[];
    behaviorProfiles: any[];
  } | null = null;

  constructor() {
    this.data = this.load();
    this.healPatientSensitivities();
    this.healBehaviorProfiles();

    // Check if a backup of the original database file exists, if not, create it
    try {
      if (fs.existsSync(DB_FILE) && !fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.incidents && parsed.incidents.length > 0) {
          fs.writeFileSync(BACKUP_FILE, raw, "utf-8");
          console.log("Original database backup saved successfully.");
        }
      }
    } catch (e) {
      console.error("Failed to create backup database file:", e);
    }

    // Populate initialSecurityBackup in-memory from the backup file if available, or current file
    try {
      let sourceData = this.data;
      if (fs.existsSync(BACKUP_FILE)) {
        const rawBackup = fs.readFileSync(BACKUP_FILE, "utf-8");
        sourceData = JSON.parse(rawBackup);
      }
      this.initialSecurityBackup = {
        securityEvents: JSON.parse(JSON.stringify(sourceData.securityEvents || [])),
        incidents: JSON.parse(JSON.stringify(sourceData.incidents || [])),
        threatFeed: JSON.parse(JSON.stringify(sourceData.threatFeed || [])),
        simulations: JSON.parse(JSON.stringify(sourceData.simulations || [])),
        behaviorProfiles: JSON.parse(JSON.stringify(sourceData.behaviorProfiles || []))
      };
    } catch (e) {
      console.error("Failed to initialize security backup state:", e);
    }

    this.persist();
  }

  private healPatientSensitivities() {
    if (this.data.patients) {
      for (const p of this.data.patients) {
        p.sensitivity = getPatientSensitivity(p);
      }
    }
  }

  private healBehaviorProfiles() {
    if (!this.data.behaviorProfiles) {
      this.data.behaviorProfiles = [];
    }
    for (const staff of this.data.staff) {
      let profile = this.data.behaviorProfiles.find(p => p.userId === staff.id);
      if (!profile) {
        profile = {
          userId: staff.id,
          username: staff.username,
          role: staff.role,
          averageWeeklyViews: staff.averageDailyAccessLimit * 5,
          currentWeekViews: 0,
          loginHoursDistribution: {},
          recentIps: [...staff.typicalIps],
          recentDevices: [...staff.typicalDevices]
        };
        this.data.behaviorProfiles.push(profile);
      }
      
      // Ensure all adaptive baseline fields are initialized
      if (!profile.typicalLoginHours) {
        profile.typicalLoginHours = { start: staff.normalHours.start, end: staff.normalHours.end };
      }
      if (!profile.typicalDepartment) {
        profile.typicalDepartment = staff.department;
      }
      if (!profile.typicalPatientViewsPerDay) {
        profile.typicalPatientViewsPerDay = Math.max(5, Math.round(staff.averageDailyAccessLimit * 0.7));
      }
      if (!profile.typicalDevices || profile.typicalDevices.length === 0) {
        profile.typicalDevices = [...staff.typicalDevices];
      }
      if (!profile.typicalIps || profile.typicalIps.length === 0) {
        profile.typicalIps = [...staff.typicalIps];
      }
      if (!profile.averageSessionDurationMin) {
        profile.averageSessionDurationMin = staff.role === HospitalRole.NURSE || staff.role === HospitalRole.DOCTOR ? 45 : 30;
      }
      if (!profile.averageDailyActivityCount) {
        profile.averageDailyActivityCount = Math.round(staff.averageDailyAccessLimit * 1.5);
      }

      // Predefined behavioral baseline repository fields
      const defaults = getDefaultBaselineForRole(staff.role);
      if (!profile.typicalShiftStart) {
        profile.typicalShiftStart = defaults.typicalShiftStart;
      }
      if (!profile.typicalShiftEnd) {
        profile.typicalShiftEnd = defaults.typicalShiftEnd;
      }
      if (profile.typicalHourlyPatientViews === undefined) {
        profile.typicalHourlyPatientViews = defaults.typicalHourlyPatientViews;
      }
      if (profile.typicalSensitiveRecordAccessRate === undefined) {
        profile.typicalSensitiveRecordAccessRate = defaults.typicalSensitiveRecordAccessRate;
      }
      if (profile.typicalDailyLogins === undefined) {
        profile.typicalDailyLogins = defaults.typicalDailyLogins;
      }
      if (!profile.typicalModulesAccessed) {
        profile.typicalModulesAccessed = defaults.typicalModulesAccessed;
      }
      if (!profile.normalWorkingDays) {
        profile.normalWorkingDays = defaults.normalWorkingDays;
      }
      if (profile.baselineConfidence === undefined) {
        profile.baselineConfidence = defaults.baselineConfidence;
      }
      if (!profile.lastUpdated) {
        profile.lastUpdated = new Date().toISOString();
      }
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        
        if (!parsed.patients || parsed.patients.length < 80) {
          throw new Error("Triggering fresh database recreation with exactly 80 rich EHR patients.");
        }
        
        let modified = false;

        // Ensure all staff members have a password
        if (parsed.staff) {
          for (const s of parsed.staff) {
            if (!s.password) {
              s.password = s.username;
              modified = true;
            }
          }
        }

        // Filter out any demo incidents, demo security events, and demo threat feeds from the persisted database
        if (parsed.securityEvents) {
          const originalLength = parsed.securityEvents.length;
          parsed.securityEvents = parsed.securityEvents.filter((ev: any) => !ev.id.startsWith("SEC-EV-00") && ev.id !== "SEC-EV-901");
          if (parsed.securityEvents.length !== originalLength) {
            modified = true;
          }
        }
        if (parsed.incidents) {
          const originalLength = parsed.incidents.length;
          const analystUsernames = new Set<string>();
          if (parsed.staff) {
            for (const s of parsed.staff) {
              if (s.role === HospitalRole.SECURITY_ANALYST) {
                analystUsernames.add(s.username.toLowerCase());
              }
            }
          }
          parsed.incidents = parsed.incidents.filter((inc: any) => {
            if (inc.id === "INC-2026-101" || inc.id.startsWith("THR-") || inc.id === "THR-101") {
              return false;
            }
            if (inc.affectedUser && (analystUsernames.has(inc.affectedUser.toLowerCase()) || inc.affectedUser.toLowerCase() === "analyst_sam")) {
              return false;
            }
            return true;
          });
          if (parsed.incidents.length !== originalLength) {
            modified = true;
          }
        }
        if (parsed.threatFeed && parsed.threatFeed.length > 0) {
          parsed.threatFeed = [];
          modified = true;
        }

        // Ensure standard fields
        if (!parsed.systemSettings) {
          parsed.systemSettings = {
            bruteForceThreshold: 3,
            anomalyScoringWeight: 1.2,
            auditLoggingRetention: 90
          };
          modified = true;
        }
        if (!parsed.backups) {
          parsed.backups = [
            {
              id: "BKP-001",
              timestamp: "2026-06-20T23:00:00Z",
              filename: "stjude_prod_backup_20260620.sql",
              size: "142 MB",
              status: "Completed",
              createdBy: "it_admin"
            }
          ];
          modified = true;
        }

        if (!parsed.patients || parsed.patients.length < 30) {
          console.log(`Database has only ${parsed.patients ? parsed.patients.length : 0} patients. Auto-populating 30 patients.`);
          if (!parsed.patients) parsed.patients = [];
          const existingIds = new Set(parsed.patients.map((p: any) => p.id));
          for (const patient of DEFAULT_PATIENTS) {
            if (!existingIds.has(patient.id)) {
              parsed.patients.push(patient);
            }
          }
          modified = true;
        }

        // Heal any duplicate incident IDs in persisted/pre-existing data
        if (parsed.incidents) {
          const seenIncidentIds = new Set<string>();
          for (const incident of parsed.incidents) {
            if (seenIncidentIds.has(incident.id)) {
              let uniqueId = "";
              let isDup = true;
              while (isDup) {
                const randNum = Math.floor(1000 + Math.random() * 8999);
                uniqueId = `INC-${new Date().getFullYear()}-${randNum}`;
                isDup = parsed.incidents.some((i: any) => i.id === uniqueId) || seenIncidentIds.has(uniqueId);
              }
              incident.id = uniqueId;
              modified = true;
            }
            seenIncidentIds.add(incident.id);
          }
        }

        // Heal any duplicate security event IDs in persisted/pre-existing data
        if (parsed.securityEvents) {
          const seenEventIds = new Set<string>();
          for (const ev of parsed.securityEvents) {
            if (seenEventIds.has(ev.id)) {
              let uniqueId = "";
              let isDup = true;
              while (isDup) {
                const randNum = Math.floor(100000 + Math.random() * 899999);
                uniqueId = `SEC-EV-${randNum}`;
                isDup = parsed.securityEvents.some((e: any) => e.id === uniqueId) || seenEventIds.has(uniqueId);
              }
              ev.id = uniqueId;
              modified = true;
            }
            seenEventIds.add(ev.id);
          }
        }

        if (!parsed.baselineTemplates) {
          parsed.baselineTemplates = DEFAULT_TEMPLATES;
          modified = true;
        }
        if (!parsed.systemSettings.organizationalDefaults) {
          parsed.systemSettings.organizationalDefaults = {
            defaultConfidence: 90,
            emaSmoothingFactor: 0.1,
            offHoursRiskWeight: 1.5,
            unrecognizedDeviceRiskWeight: 1.5,
            unrecognizedIpRiskWeight: 1.5
          };
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load local DB file, setting defaults", e);
    }

    // Ensure default staff members have passwords
    const staffWithPasswords = DEFAULT_STAFF.map(s => ({
      ...s,
      password: s.password || s.username
    }));

    const initialDb: DatabaseSchema = {
      staff: staffWithPasswords,
      patients: DEFAULT_PATIENTS,
      vitals: DEFAULT_VITALS,
      clinicalNotes: DEFAULT_NOTES,
      labRequests: DEFAULT_LAB_REQUESTS,
      radiologyRequests: DEFAULT_RADIOLOGY,
      prescriptions: DEFAULT_PRESCRIPTIONS,
      beds: DEFAULT_BEDS,
      wards: DEFAULT_WARDS,
      billing: DEFAULT_BILLING,
      handovers: DEFAULT_HANDOVERS,
      securityEvents: DEFAULT_SECURITY_EVENTS,
      incidents: DEFAULT_INCIDENTS,
      behaviorProfiles: DEFAULT_BEHAVIOR,
      threatFeed: DEFAULT_THREAT_FEED,
      systemSettings: {
        bruteForceThreshold: 3,
        anomalyScoringWeight: 1.2,
        auditLoggingRetention: 90,
        organizationalDefaults: {
          defaultConfidence: 90,
          emaSmoothingFactor: 0.1,
          offHoursRiskWeight: 1.5,
          unrecognizedDeviceRiskWeight: 1.5,
          unrecognizedIpRiskWeight: 1.5
        }
      },
      baselineTemplates: DEFAULT_TEMPLATES,
      backups: [
        {
          id: "BKP-001",
          timestamp: "2026-06-20T23:00:00Z",
          filename: "stjude_prod_backup_20260620.sql",
          size: "142 MB",
          status: "Completed",
          createdBy: "it_admin"
        }
      ]
    };
    this.saveData(initialDb);
    return initialDb;
  }

  private saveData(db: DatabaseSchema) {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to local DB file", e);
    }
  }

  persist() {
    this.saveData(this.data);
  }

  // GETTERS
  getStaff(): StaffUser[] { return this.data.staff; }
  getPatients(): Patient[] { return this.data.patients; }
  getVitals(): Vitals[] { return this.data.vitals; }
  getClinicalNotes(): ClinicalNote[] { return this.data.clinicalNotes; }
  getLabRequests(): LabRequest[] { return this.data.labRequests; }
  getRadiologyRequests(): RadiologyRequest[] { return this.data.radiologyRequests; }
  getPrescriptions(): Prescription[] { return this.data.prescriptions; }
  getBeds(): WardBed[] { return this.data.beds; }
  getWards(): Ward[] { return this.data.wards; }
  getBilling(): BillingInvoice[] { return this.data.billing; }
  getHandovers(): ShiftHandover[] { return this.data.handovers; }

  // STAFF MANAGEMENT OPERATIONS
  addStaff(s: StaffUser) {
    this.data.staff.push(s);
    this.persist();
  }

  updateStaff(id: string, updates: Partial<StaffUser>) {
    const idx = this.data.staff.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.staff[idx] = { ...this.data.staff[idx], ...updates };
      this.persist();
    }
  }

  deleteStaff(id: string) {
    this.data.staff = this.data.staff.filter(s => s.id !== id);
    this.persist();
  }

  // WARD & BED MANAGEMENT OPERATIONS
  addWard(w: Ward) {
    this.data.wards.push(w);
    this.persist();
  }

  updateWard(name: string, updates: Partial<Ward>) {
    const idx = this.data.wards.findIndex(w => w.name === name);
    if (idx !== -1) {
      this.data.wards[idx] = { ...this.data.wards[idx], ...updates };
      this.persist();
    }
  }

  addBed(bed: WardBed) {
    this.data.beds.push(bed);
    this.recalculateWardCapacities();
    this.persist();
  }

  updateBed(wardName: string, bedNumber: string, updates: Partial<WardBed>) {
    const idx = this.data.beds.findIndex(b => b.wardName === wardName && b.bedNumber === bedNumber);
    if (idx !== -1) {
      this.data.beds[idx] = { ...this.data.beds[idx], ...updates };
      this.recalculateWardCapacities();
      this.persist();
    }
  }
  getSecurityEvents(): SecurityEvent[] { return this.data.securityEvents; }
  getIncidents(): ThreatIncident[] { return this.data.incidents; }
  getBehaviorProfiles(): UserBehaviorProfile[] { return this.data.behaviorProfiles; }
  getThreatFeed(): ThreatFeedItem[] { return this.data.threatFeed; }

  clearAllSecurityData() {
    let restored = false;
    if (this.initialSecurityBackup && this.initialSecurityBackup.incidents && this.initialSecurityBackup.incidents.length > 0) {
      this.data.securityEvents = JSON.parse(JSON.stringify(this.initialSecurityBackup.securityEvents));
      this.data.incidents = JSON.parse(JSON.stringify(this.initialSecurityBackup.incidents));
      this.data.threatFeed = JSON.parse(JSON.stringify(this.initialSecurityBackup.threatFeed));
      this.data.simulations = JSON.parse(JSON.stringify(this.initialSecurityBackup.simulations || []));
      
      if (this.initialSecurityBackup.behaviorProfiles && this.initialSecurityBackup.behaviorProfiles.length > 0) {
        this.data.behaviorProfiles = JSON.parse(JSON.stringify(this.initialSecurityBackup.behaviorProfiles));
      }
      restored = true;
      console.log("SOC database successfully reset to pristine initial backup state.");
    }

    if (!restored) {
      this.data.securityEvents = [];
      this.data.incidents = [];
      this.data.threatFeed = [];
      this.data.simulations = [];
      
      if (this.data.behaviorProfiles) {
        this.data.behaviorProfiles.forEach(p => {
          p.currentWeekViews = 0;
          p.loginHoursDistribution = {};
        });
      }
    }
    
    this.persist();
  }

  getBaselineTemplates(): BaselineTemplate[] {
    if (!this.data.baselineTemplates) {
      this.data.baselineTemplates = [...DEFAULT_TEMPLATES];
    }
    return this.data.baselineTemplates;
  }

  updateBaselineTemplate(role: HospitalRole, updates: Partial<BaselineTemplate>) {
    if (!this.data.baselineTemplates) {
      this.data.baselineTemplates = [...DEFAULT_TEMPLATES];
    }
    const idx = this.data.baselineTemplates.findIndex(t => t.role === role);
    if (idx !== -1) {
      this.data.baselineTemplates[idx] = { ...this.data.baselineTemplates[idx], ...updates };
      
      // Sync default values for all users of this role who are still on defaults
      this.data.behaviorProfiles.forEach(p => {
        if (p.role === role) {
          const defaults = getDefaultBaselineForRole(role);
          if (p.typicalShiftStart === defaults.typicalShiftStart) p.typicalShiftStart = updates.typicalShiftStart;
          if (p.typicalShiftEnd === defaults.typicalShiftEnd) p.typicalShiftEnd = updates.typicalShiftEnd;
          if (p.typicalPatientViewsPerDay === defaults.typicalPatientViewsPerDay) p.typicalPatientViewsPerDay = updates.typicalDailyPatientViews;
          if (p.typicalHourlyPatientViews === defaults.typicalHourlyPatientViews) p.typicalHourlyPatientViews = updates.typicalHourlyPatientViews;
          if (p.typicalSensitiveRecordAccessRate === defaults.typicalSensitiveRecordAccessRate) p.typicalSensitiveRecordAccessRate = updates.typicalSensitiveRecordAccessRate;
          if (p.typicalDailyLogins === defaults.typicalDailyLogins) p.typicalDailyLogins = updates.typicalDailyLogins;
          if (p.averageSessionDurationMin === defaults.averageSessionDurationMin) p.averageSessionDurationMin = updates.averageSessionDurationMin;
          if (p.typicalModulesAccessed === defaults.typicalModulesAccessed) p.typicalModulesAccessed = updates.typicalModulesAccessed;
          if (p.normalWorkingDays === defaults.normalWorkingDays) p.normalWorkingDays = updates.normalWorkingDays;
          p.lastUpdated = new Date().toISOString();
        }
      });
      this.persist();
    }
  }

  updateBehaviorProfile(userId: string, updates: Partial<UserBehaviorProfile>) {
    const idx = this.data.behaviorProfiles.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      this.data.behaviorProfiles[idx] = { 
        ...this.data.behaviorProfiles[idx], 
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      this.persist();
    }
  }

  resetBehaviorProfile(userId: string) {
    const idx = this.data.behaviorProfiles.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      const profile = this.data.behaviorProfiles[idx];
      const defaults = getDefaultBaselineForRole(profile.role);
      this.data.behaviorProfiles[idx] = {
        ...profile,
        ...defaults,
        currentWeekViews: 0,
        lastUpdated: new Date().toISOString(),
        baselineConfidence: 100
      };
      this.persist();
    }
  }

  recalculateBehaviorBaseline(userId: string, observedDailyViews?: number, observedHourlyViews?: number, observedLogins?: number, observedDuration?: number) {
    const idx = this.data.behaviorProfiles.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      const profile = this.data.behaviorProfiles[idx];
      const smoothing = this.data.systemSettings.organizationalDefaults?.emaSmoothingFactor || 0.1;
      
      const daily = observedDailyViews !== undefined ? observedDailyViews : Math.max(5, Math.round((profile.currentWeekViews || profile.averageWeeklyViews) / 5));
      const hourly = observedHourlyViews !== undefined ? observedHourlyViews : Math.max(1, Math.round(daily / 6));
      const logins = observedLogins !== undefined ? observedLogins : Math.max(1, Math.round((profile.typicalDailyLogins || 3) * (0.9 + Math.random() * 0.2)));
      const duration = observedDuration !== undefined ? observedDuration : Math.round((profile.averageSessionDurationMin || 30) * (0.95 + Math.random() * 0.1));

      const oldDaily = profile.typicalPatientViewsPerDay || 20;
      const oldHourly = profile.typicalHourlyPatientViews || 3;
      const oldLogins = profile.typicalDailyLogins || 3;
      const oldDuration = profile.averageSessionDurationMin || 30;

      const newDaily = Math.round(smoothing * daily + (1 - smoothing) * oldDaily);
      const newHourly = Math.round(smoothing * hourly + (1 - smoothing) * oldHourly);
      const newLogins = Math.round(smoothing * logins + (1 - smoothing) * oldLogins);
      const newDuration = Math.round(smoothing * duration + (1 - smoothing) * oldDuration);

      const deviationPercent = Math.abs(daily - oldDaily) / oldDaily;
      const confidenceImpact = deviationPercent > 0.5 ? -5 : 2;
      const currentConfidence = profile.baselineConfidence || 90;
      const newConfidence = Math.max(50, Math.min(99, currentConfidence + confidenceImpact));

      this.data.behaviorProfiles[idx] = {
        ...profile,
        typicalPatientViewsPerDay: newDaily,
        typicalHourlyPatientViews: newHourly,
        typicalDailyLogins: newLogins,
        averageSessionDurationMin: newDuration,
        baselineConfidence: newConfidence,
        lastUpdated: new Date().toISOString()
      };
      
      this.persist();
      return {
        previous: { daily: oldDaily, hourly: oldHourly, logins: oldLogins, duration: oldDuration },
        current: { daily, hourly, logins, duration },
        updated: { daily: newDaily, hourly: newHourly, logins: newLogins, duration: newDuration, confidence: newConfidence }
      };
    }
    return null;
  }

  // SETTERS / CREATORS
  addPatient(patient: Patient) {
    patient.sensitivity = getPatientSensitivity(patient);
    this.data.patients.push(patient);
    this.persist();
  }

  updatePatient(id: string, updates: Partial<Patient>) {
    const idx = this.data.patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.patients[idx] = { ...this.data.patients[idx], ...updates };
      this.data.patients[idx].sensitivity = getPatientSensitivity(this.data.patients[idx]);
      // Sync ward patient bed state
      if (updates.admittedWard && updates.admittedBed) {
        // Free up previous bed if any
        const currentP = this.data.patients[idx];
        this.data.beds.forEach(bed => {
          if (bed.patientId === id) {
            bed.isOccupied = false;
            delete bed.patientId;
          }
        });
        // Occupy new bed
        const bedIdx = this.data.beds.findIndex(b => b.wardName === updates.admittedWard && b.bedNumber === updates.admittedBed);
        if (bedIdx !== -1) {
          this.data.beds[bedIdx].isOccupied = true;
          this.data.beds[bedIdx].patientId = id;
        }
      }
      this.recalculateWardCapacities();
      this.persist();
    }
  }

  private recalculateWardCapacities() {
    this.data.wards.forEach(w => {
      const occupiedInWard = this.data.beds.filter(b => b.wardName === w.name && b.isOccupied).length;
      w.availableBeds = w.capacity - occupiedInWard;
    });
  }

  addVitals(vital: Vitals) {
    this.data.vitals.push(vital);
    this.persist();
  }

  addClinicalNote(note: ClinicalNote) {
    this.data.clinicalNotes.push(note);
    this.persist();
  }

  addLabRequest(req: LabRequest) {
    this.data.labRequests.push(req);
    // Add pending billing charge automatically
    this.addBillingItemToActiveInvoice(req.patientId, `Laboratory Assessment: ${req.testName}`, 45.00);
    this.persist();
  }

  updateLabRequest(id: string, updates: Partial<LabRequest>) {
    const idx = this.data.labRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.labRequests[idx] = { ...this.data.labRequests[idx], ...updates };
      this.persist();
    }
  }

  addRadiologyRequest(req: RadiologyRequest) {
    this.data.radiologyRequests.push(req);
    // Add pending billing charge automatically
    this.addBillingItemToActiveInvoice(req.patientId, `Radiology Medical Imaging: ${req.imagingType}`, 110.00);
    this.persist();
  }

  updateRadiologyRequest(id: string, updates: Partial<RadiologyRequest>) {
    const idx = this.data.radiologyRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.radiologyRequests[idx] = { ...this.data.radiologyRequests[idx], ...updates };
      this.persist();
    }
  }

  addPrescription(presc: Prescription) {
    this.data.prescriptions.push(presc);
    // Add pharmaceutical dispense charge automatically
    this.addBillingItemToActiveInvoice(presc.patientId, `Prescribed Medication: ${presc.medication} (${presc.dosage})`, 35.00);
    this.persist();
  }

  updatePrescription(id: string, updates: Partial<Prescription>) {
    const idx = this.data.prescriptions.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.prescriptions[idx] = { ...this.data.prescriptions[idx], ...updates };
      this.persist();
    }
  }

  addHandover(ho: ShiftHandover) {
    this.data.handovers.push(ho);
    this.persist();
  }

  addBillingItemToActiveInvoice(patientId: string, description: string, amount: number) {
    let invoice = this.data.billing.find(b => b.patientId === patientId && b.status === "Unpaid");
    const newItem: BillingItem = {
      id: `BI-${Math.floor(1000 + Math.random() * 9000)}`,
      description,
      amount,
      timestamp: new Date().toISOString()
    };

    if (invoice) {
      invoice.items.push(newItem);
      invoice.totalAmount = invoice.items.reduce((s, item) => s + item.amount, 0);
    } else {
      const newInvoiceId = `INV-${Math.floor(7000 + Math.random() * 999)}`;
      invoice = {
        id: newInvoiceId,
        patientId,
        items: [newItem],
        totalAmount: amount,
        insuranceClaimed: 0,
        patientPaid: 0,
        status: "Unpaid",
        issuedDate: new Date().toISOString()
      };
      this.data.billing.push(invoice);
    }
    this.persist();
  }

  payInvoice(id: string, patientPaid: number, insuranceClaimed: number, status: "Paid" | "Partially Paid" | "Submitted to Insurance") {
    const idx = this.data.billing.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.billing[idx].patientPaid = patientPaid;
      this.data.billing[idx].insuranceClaimed = insuranceClaimed;
      this.data.billing[idx].status = status;
      this.persist();
    }
  }

  // ADAPTIVE THREAT INTELLIGENCE (ATIF) ENGINE LOGGER & CORRELATOR
  addSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp">) {
    const timestamp = new Date().toISOString();
    let id = "";
    let isIdDuplicate = true;
    while (isIdDuplicate) {
      const randNum = Math.floor(100000 + Math.random() * 899999);
      id = `SEC-EV-${randNum}`;
      isIdDuplicate = this.data.securityEvents.some(e => e.id === id);
    }

    // Assign session ID
    let sId = event.sessionId;
    if (!sId) {
      const username = event.username || "unknown";
      const nowMs = Date.now();
      const lastActivity = this.sessionLastActivity[username] || 0;
      const timeoutMs = 30 * 60 * 1000; // 30 minutes correlation timeout

      if (lastActivity && (nowMs - lastActivity > timeoutMs)) {
        // Correlation timeout expired! Wipe active session to start a new one
        delete this.activeSessions[username];
      }
      this.sessionLastActivity[username] = nowMs;

      if (event.activityType === "LOGIN_SUCCESS") {
        // Start or continue existing session (e.g. from preceding failed login attempts) to maintain a single Correlation Session
        if (!this.activeSessions[username]) {
          this.activeSessions[username] = "ATIF-SESSION-" + Math.floor(10000 + Math.random() * 89999);
        }
        sId = this.activeSessions[username];
      } else if (event.activityType === "LOGIN_FAILED") {
        // Share session ID with preceding login attempts or create new if not exists
        if (!this.activeSessions[username]) {
          this.activeSessions[username] = "ATIF-SESSION-" + Math.floor(10000 + Math.random() * 89999);
        }
        sId = this.activeSessions[username];
      } else {
        // Subsequent workspace activities inherit the active session
        if (!this.activeSessions[username]) {
          this.activeSessions[username] = "ATIF-SESSION-" + Math.floor(10000 + Math.random() * 89999);
        }
        sId = this.activeSessions[username];
      }

      // If user is logging out, we wipe their session ID from active registry
      if (event.activityType === "USER_MODIFY" && event.description.toLowerCase().includes("logout")) {
        delete this.activeSessions[username];
        delete this.sessionLastActivity[username];
      }
    } else {
      const username = event.username || "unknown";
      this.sessionLastActivity[username] = Date.now();
    }

    const fullEvent: SecurityEvent = {
      ...event,
      id,
      timestamp,
      sessionId: sId
    };

    this.data.securityEvents.push(fullEvent);
    this.updateUserBehaviorMetrics(fullEvent);
    this.runCorrelationEngine(fullEvent);
    this.persist();
    return fullEvent;
  }

  private updateUserBehaviorMetrics(event: SecurityEvent) {
    let profile = this.data.behaviorProfiles.find(p => p.userId === event.userId);
    if (!profile) {
      profile = {
        userId: event.userId,
        username: event.username,
        role: event.role,
        averageWeeklyViews: 60,
        currentWeekViews: 0,
        loginHoursDistribution: {},
        recentIps: [],
        recentDevices: [],
        typicalLoginHours: { start: 8, end: 17 },
        typicalDepartment: "General Ward",
        typicalPatientViewsPerDay: 15,
        typicalDevices: [],
        typicalIps: [],
        averageSessionDurationMin: 30,
        averageDailyActivityCount: 30
      };
      this.data.behaviorProfiles.push(profile);
    }

    // record view updates
    if (event.activityType === "RECORD_VIEW") {
      profile.currentWeekViews += 1;
    }

    // IP tracking
    if (event.ipAddress && !profile.recentIps.includes(event.ipAddress)) {
      profile.recentIps.unshift(event.ipAddress);
      if (profile.recentIps.length > 5) profile.recentIps.pop();
    }

    // Device tracking
    if (event.deviceName && !profile.recentDevices.includes(event.deviceName)) {
      profile.recentDevices.unshift(event.deviceName);
      if (profile.recentDevices.length > 5) profile.recentDevices.pop();
    }

    // Hour distribution tracking
    const hour = new Date(event.timestamp).getHours();
    profile.loginHoursDistribution[hour] = (profile.loginHoursDistribution[hour] || 0) + 1;

    // Slowly update the adaptive baseline continuously as legitimate behavior evolves
    const todayStart = new Date(event.timestamp);
    todayStart.setHours(0, 0, 0, 0);

    const viewsToday = this.data.securityEvents.filter(
      e => e.userId === event.userId &&
      e.activityType === "RECORD_VIEW" &&
      new Date(e.timestamp).getTime() >= todayStart.getTime()
    ).length;

    profile.typicalPatientViewsPerDay = Math.round(
      (profile.typicalPatientViewsPerDay || 15) * 0.95 + Math.min(viewsToday, 200) * 0.05
    );

    const activityToday = this.data.securityEvents.filter(
      e => e.userId === event.userId &&
      new Date(e.timestamp).getTime() >= todayStart.getTime()
    ).length;

    profile.averageDailyActivityCount = Math.round(
      (profile.averageDailyActivityCount || 30) * 0.95 + Math.min(activityToday, 300) * 0.05
    );

    if (event.activityType === "LOGIN_SUCCESS") {
      if (event.deviceName && !profile.typicalDevices?.includes(event.deviceName)) {
        if (!profile.typicalDevices) profile.typicalDevices = [];
        profile.typicalDevices.push(event.deviceName);
      }
      if (event.ipAddress && !profile.typicalIps?.includes(event.ipAddress)) {
        if (!profile.typicalIps) profile.typicalIps = [];
        profile.typicalIps.push(event.ipAddress);
      }
    }
  }

  private runCorrelationEngine(event: SecurityEvent) {
    if (event.role === HospitalRole.SECURITY_ANALYST || event.username === "analyst_sam") {
      // Activities performed by security analyst should never be indicated as threats
      return;
    }

    const staffUser = this.data.staff.find(s => s.id === event.userId);
    let profile = this.data.behaviorProfiles.find(p => p.userId === event.userId);
    if (!profile) {
      this.healBehaviorProfiles();
      profile = this.data.behaviorProfiles.find(p => p.userId === event.userId)!;
    }

    // Retrieve all security events belonging to the same user and the same session (Chronological Chain)
    const sessionEvents = this.data.securityEvents.filter(
      e => e.username === event.username && e.sessionId === event.sessionId
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Stateful metrics accumulator variables
    let failedLoginCount = 0;
    let successfulLoginAfterFailures = false;
    let loginTime = "";
    let knownDevice = true;
    let knownIp = true;
    let patientViews = 0;
    const viewedPatientIds = new Set<string>();
    let sensitiveRecordsViewed = 0;
    let highlySensitiveRecordsViewed = 0;
    const viewedWards = new Set<string>();
    let patientRecordPdfExportCount = 0;
    let repeatedExportCount = 0;
    const exportTimeline: string[] = [];

    const authenticationHistory: { activityType: string; timestamp: string }[] = [];
    const threatTimeline: { timestamp: string; action: string; note: string; user: string }[] = [];

    // Helper to evaluate off-hours
    const isEventOffHours = (timestampStr: string): boolean => {
      const evTime = new Date(timestampStr);
      const hour = evTime.getHours();
      const startHour = staffUser ? staffUser.normalHours.start : (profile?.typicalLoginHours?.start ?? 8);
      const endHour = staffUser ? staffUser.normalHours.end : (profile?.typicalLoginHours?.end ?? 17);
      if (startHour < endHour) {
        return hour < startHour || hour > endHour;
      } else {
        return hour < startHour && hour > endHour;
      }
    };

    let isOffHoursSession = false;

    // Process all events chronologically to build session context statefully
    for (const e of sessionEvents) {
      const isLoginFailed = e.activityType === "LOGIN_FAILED";
      const isLoginSuccess = e.activityType === "LOGIN_SUCCESS";

      if (isLoginFailed) {
        failedLoginCount++;
        authenticationHistory.push({ activityType: "LOGIN_FAILED", timestamp: e.timestamp });
        threatTimeline.push({
          timestamp: e.timestamp,
          action: "Initial access attempt flagged (Failed Authentication)",
          note: `Pre-auth security posture alert: Account lock challenge triggered due to failed credential lookup from IP ${e.ipAddress || 'unknown'} using ${e.deviceName || 'unknown'}. (Attempt ${failedLoginCount})`,
          user: "ATIF Correlation Engine"
        });
      }

      if (isLoginSuccess) {
        authenticationHistory.push({ activityType: "LOGIN_SUCCESS", timestamp: e.timestamp });
        if (failedLoginCount > 0) {
          successfulLoginAfterFailures = true;
        }
        if (!loginTime) {
          loginTime = e.timestamp;
        }
        threatTimeline.push({
          timestamp: e.timestamp,
          action: failedLoginCount > 0 ? "Initial access established via brute-force authentication" : "Session authentication established",
          note: failedLoginCount > 0 
            ? `Credential abuse signature: Successful authentication completed after overcoming ${failedLoginCount} preceding login failures on IP ${e.ipAddress || 'unknown'} using ${e.deviceName || 'unknown'}. Workspace session initialized under high threat level.`
            : `Legitimate authentication baseline recorded from device ${e.deviceName || 'unknown'} on IP ${e.ipAddress || 'unknown'}.`,
          user: "ATIF Correlation Engine"
        });
      }

      // Track atypical properties
      const isUntypicalDevice = e.deviceName && profile?.typicalDevices ? !profile.typicalDevices.includes(e.deviceName) : false;
      const isUntypicalIp = e.ipAddress && profile?.typicalIps ? !profile.typicalIps.includes(e.ipAddress) : false;
      if (isUntypicalDevice) knownDevice = false;
      if (isUntypicalIp) knownIp = false;

      if (isEventOffHours(e.timestamp)) {
        isOffHoursSession = true;
      }

      const isRecordView = e.activityType === "RECORD_VIEW";
      const isExport = e.activityType === "PATIENT_RECORD_EXPORTED";

      if (isRecordView || isExport) {
        if (isRecordView) {
          patientViews++;
          
          let isHighlySensitive = false;
          if (e.resourceId) {
            const pObj = this.data.patients.find(pt => pt.id === e.resourceId);
            if (pObj && pObj.sensitivity === "HIGHLY_SENSITIVE") {
              isHighlySensitive = true;
            }
          }

          threatTimeline.push({
            timestamp: e.timestamp,
            action: isHighlySensitive ? "Anomalous clinical access pattern detected on VIP patients" : "EHR database directory queried",
            note: isHighlySensitive
              ? `Out-of-context clinical file inspection: Accessed complete medical dossier for highly sensitive/VIP Patient ID: ${e.resourceId || 'Unknown'} on IP ${e.ipAddress || 'unknown'} with ${e.deviceName || 'unknown'}.`
              : `Inspected electronic medical file for Patient ID: ${e.resourceId || 'Unknown'} spanning care wards. Device: ${e.deviceName || 'unknown'}, IP: ${e.ipAddress || 'unknown'}.`,
            user: "ATIF Correlation Engine"
          });
        }
        if (isExport) {
          patientRecordPdfExportCount++;
          if (patientRecordPdfExportCount > 1) {
            repeatedExportCount++;
          }
          exportTimeline.push(e.timestamp);
          
          threatTimeline.push({
            timestamp: e.timestamp,
            action: patientRecordPdfExportCount >= 3 ? "Bulk data harvesting and exfiltration attempt flagged" : "Patient Record Export (Dossier compiled to PDF)",
            note: patientRecordPdfExportCount >= 3
              ? `Data exfiltration threshold reached: ${patientRecordPdfExportCount} separate patient clinical history logs exported to local PDF reports within a compressed timeframe on IP ${e.ipAddress || 'unknown'}.`
              : `DLP warning: PDF export initiated for Patient ID: ${e.resourceId || 'Unknown'} to local client directory. Device: ${e.deviceName || 'unknown'}.`,
            user: "ATIF Correlation Engine"
          });
        }

        if (e.resourceId) {
          viewedPatientIds.add(e.resourceId);
          const pObj = this.data.patients.find(pt => pt.id === e.resourceId);
          if (pObj) {
            if (pObj.admittedWard) {
              viewedWards.add(pObj.admittedWard);
            }
            if (pObj.sensitivity === "HIGHLY_SENSITIVE") {
              highlySensitiveRecordsViewed++;
            }
            if (pObj.isVip || pObj.isStaff || pObj.sensitivity === "RESTRICTED" || pObj.sensitivity === "CONFIDENTIAL" || pObj.sensitivity === "HIGHLY_SENSITIVE") {
              sensitiveRecordsViewed++;
            }
          }
        }
      }

      // Restricted module cross-referencing
      let isRestrictedCross = false;
      if (e.role === HospitalRole.ACCOUNTS_OFFICER && (e.description.toLowerCase().includes("clinical note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription"))) {
        isRestrictedCross = true;
      } else if (e.role === HospitalRole.LAB_SCIENTIST && (e.description.toLowerCase().includes("billing") || e.description.toLowerCase().includes("invoice") || e.description.toLowerCase().includes("payment"))) {
        isRestrictedCross = true;
      } else if (e.role === HospitalRole.PHARMACIST && (e.description.toLowerCase().includes("lab") || e.description.toLowerCase().includes("radiology") || e.description.toLowerCase().includes("invoice"))) {
        isRestrictedCross = true;
      } else if (e.role === HospitalRole.IT_ADMIN && (e.description.toLowerCase().includes("note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription") || e.description.toLowerCase().includes("billing"))) {
        isRestrictedCross = true;
      }

      if (isRestrictedCross) {
        threatTimeline.push({
          timestamp: e.timestamp,
          action: "Role scope boundary breach (Restricted Module)",
          note: `Authorization failure: Staff role ${e.role} attempted to cross organizational boundaries and query clinical notes/billing data. IP: ${e.ipAddress || 'unknown'}, Device: ${e.deviceName || 'unknown'}.`,
          user: "ATIF Correlation Engine"
        });
      }
    }

    if (!loginTime && sessionEvents.length > 0) {
      loginTime = sessionEvents[0].timestamp;
    }

    // Role-specific baseline lookup
    const roleBaseline = (() => {
      const userRole = event.role;
      switch (userRole) {
        case HospitalRole.DOCTOR:
          return { expectedViews: 32, expectedExports: 1, label: "Doctor" };
        case HospitalRole.NURSE:
          return { expectedViews: 55, expectedExports: 0.1, label: "Nurse" };
        case HospitalRole.HIM_OFFICER:
          return { expectedViews: 80, expectedExports: 2.5, label: "HIM Officer" };
        case HospitalRole.LAB_SCIENTIST:
          return { expectedViews: 35, expectedExports: 0.1, label: "Laboratory Scientist" };
        case HospitalRole.RADIOLOGY_OFFICER:
          return { expectedViews: 25, expectedExports: 0.1, label: "Radiology Officer" };
        case HospitalRole.PHARMACIST:
          return { expectedViews: 27, expectedExports: 0.1, label: "Pharmacist" };
        case HospitalRole.ACCOUNTS_OFFICER:
          return { expectedViews: 10, expectedExports: 0.1, label: "Accounts Officer" };
        case HospitalRole.IT_ADMIN:
          return { expectedViews: 2.5, expectedExports: 0.1, label: "IT Administrator" };
        default:
          return { expectedViews: 20, expectedExports: 1, label: "Clinical Staff" };
      }
    })();

    const currentViews = viewedPatientIds.size;
    const currentExports = patientRecordPdfExportCount;

    const viewsDeviation = roleBaseline.expectedViews > 0
      ? Math.round(((currentViews - roleBaseline.expectedViews) / roleBaseline.expectedViews) * 100)
      : 0;

    const exportsDeviation = roleBaseline.expectedExports > 0
      ? Math.round(((currentExports - roleBaseline.expectedExports) / roleBaseline.expectedExports) * 100)
      : 0;

    // Standard percentage baseline deviation
    const currentBaselineDeviation = Math.max(0, viewsDeviation, exportsDeviation);

    // Assign dynamic contributions based on baseline deviation:
    // Less than 20%: +0, 20-50%: +5, 50-100%: +10, 100-200%: +20, Greater than 200%: +30
    let deviationPoints = 0;
    if (currentBaselineDeviation >= 200) {
      deviationPoints = 30;
    } else if (currentBaselineDeviation >= 100) {
      deviationPoints = 20;
    } else if (currentBaselineDeviation >= 50) {
      deviationPoints = 10;
    } else if (currentBaselineDeviation >= 20) {
      deviationPoints = 5;
    }

    // Dynamic role/boundary checks (Restricted Module)
    let hasRestrictedAccess = false;
    for (const se of sessionEvents) {
      if (se.role === HospitalRole.ACCOUNTS_OFFICER && (se.description.toLowerCase().includes("clinical note") || se.description.toLowerCase().includes("vitals") || se.description.toLowerCase().includes("prescription"))) {
        hasRestrictedAccess = true;
      } else if (se.role === HospitalRole.LAB_SCIENTIST && (se.description.toLowerCase().includes("billing") || se.description.toLowerCase().includes("invoice") || se.description.toLowerCase().includes("payment"))) {
        hasRestrictedAccess = true;
      } else if (se.role === HospitalRole.PHARMACIST && (se.description.toLowerCase().includes("lab") || se.description.toLowerCase().includes("radiology") || se.description.toLowerCase().includes("invoice"))) {
        hasRestrictedAccess = true;
      } else if (se.role === HospitalRole.IT_ADMIN && (se.description.toLowerCase().includes("note") || se.description.toLowerCase().includes("vitals") || se.description.toLowerCase().includes("prescription") || se.description.toLowerCase().includes("billing"))) {
        hasRestrictedAccess = true;
      }
    }

    // Indicator list dynamically matched and accumulated
    const triggeredIndicators: string[] = [];
    if (failedLoginCount > 0) triggeredIndicators.push("Failed Login");
    if (failedLoginCount >= 3) triggeredIndicators.push("Repeated Failed Login");
    if (successfulLoginAfterFailures) triggeredIndicators.push("Successful Login After Failures");
    if (sensitiveRecordsViewed > 0) triggeredIndicators.push("Sensitive Record Viewed");
    if (highlySensitiveRecordsViewed > 0) triggeredIndicators.push("Highly Sensitive Record");
    if (patientRecordPdfExportCount > 0) triggeredIndicators.push("Patient Record Export");
    if (patientRecordPdfExportCount > 1) triggeredIndicators.push("Repeated Export");
    if (patientRecordPdfExportCount >= 3) triggeredIndicators.push("Bulk Export");
    if (viewedWards.size > 2) triggeredIndicators.push("Cross-Ward Browsing");
    if (currentBaselineDeviation >= 20) triggeredIndicators.push("Baseline Deviation");
    if (isOffHoursSession) triggeredIndicators.push("Off-Hours Activity");
    if (hasRestrictedAccess) triggeredIndicators.push("Restricted Module Access");
    if (viewedPatientIds.size >= 5) triggeredIndicators.push("Patient Harvesting Spike");
    if (!knownDevice) triggeredIndicators.push("Unknown Device");
    if (!knownIp) triggeredIndicators.push("Unknown IP");

    // Adaptive Event-Driven Scenario Risk Progression Engine
    let dynamicRiskScore = 6; // Baseline
    const riskBreakdown: { name: string; score: number }[] = [];

    const isCredentialAbuse = failedLoginCount > 0;
    const isUnauthorizedAccess = hasRestrictedAccess;
    const isInsiderThreat = !isCredentialAbuse && !isUnauthorizedAccess && (patientRecordPdfExportCount > 0 || viewedPatientIds.size > 1);
    const isSensitiveAccess = !isCredentialAbuse && !isUnauthorizedAccess && !isInsiderThreat && sensitiveRecordsViewed > 0;

    if (isCredentialAbuse) {
      if (failedLoginCount === 1) {
        dynamicRiskScore = 5;
        riskBreakdown.push({ name: "Failed Login (+5)", score: 5 });
      } else if (failedLoginCount === 2) {
        dynamicRiskScore = 10;
        riskBreakdown.push({ name: "Repeated Failed Login (+10)", score: 10 });
      } else if (failedLoginCount >= 3 && !successfulLoginAfterFailures) {
        dynamicRiskScore = 15;
        riskBreakdown.push({ name: "Three Failed Logins (+15)", score: 15 });
      } else if (successfulLoginAfterFailures && !isOffHoursSession && knownDevice && sensitiveRecordsViewed === 0) {
        dynamicRiskScore = 30;
        riskBreakdown.push({ name: "Three Failed Logins (+15)", score: 15 });
        riskBreakdown.push({ name: "Successful Login after Failures (+15)", score: 15 });
      } else if (successfulLoginAfterFailures && !knownDevice && sensitiveRecordsViewed === 0) {
        dynamicRiskScore = 45;
        riskBreakdown.push({ name: "Three Failed Logins (+15)", score: 15 });
        riskBreakdown.push({ name: "Successful Login after Failures (+15)", score: 15 });
        riskBreakdown.push({ name: "Unknown Workstation Anomaly (+15)", score: 15 });
      } else if (successfulLoginAfterFailures && sensitiveRecordsViewed > 0 && patientRecordPdfExportCount === 0) {
        dynamicRiskScore = 70;
        riskBreakdown.push({ name: "Three Failed Logins (+15)", score: 15 });
        riskBreakdown.push({ name: "Successful Login after Failures (+15)", score: 15 });
        riskBreakdown.push({ name: "Unknown Workstation Anomaly (+15)", score: 15 });
        riskBreakdown.push({ name: "VIP Patient Access (+25)", score: 25 });
      } else if (successfulLoginAfterFailures && sensitiveRecordsViewed > 0 && patientRecordPdfExportCount > 0) {
        dynamicRiskScore = 100;
        riskBreakdown.push({ name: "Three Failed Logins (+15)", score: 15 });
        riskBreakdown.push({ name: "Successful Login after Failures (+15)", score: 15 });
        riskBreakdown.push({ name: "Unknown Workstation Anomaly (+15)", score: 15 });
        riskBreakdown.push({ name: "VIP Patient Access (+25)", score: 25 });
        riskBreakdown.push({ name: "Additional Suspicious Exfiltrations (+30)", score: 30 });
      } else {
        dynamicRiskScore = Math.min(100, 15 + (failedLoginCount * 5) + (successfulLoginAfterFailures ? 15 : 0) + (sensitiveRecordsViewed * 15));
        riskBreakdown.push({ name: "Failed Logins", score: failedLoginCount * 5 });
        if (successfulLoginAfterFailures) riskBreakdown.push({ name: "Suspicious Auth", score: 15 });
        if (sensitiveRecordsViewed > 0) riskBreakdown.push({ name: "Sensitive Record Access", score: sensitiveRecordsViewed * 15 });
      }
    } else if (isInsiderThreat) {
      const precedingViews = sessionEvents.filter(prev => prev.activityType === "RECORD_VIEW");
      const hasSensitive = precedingViews.some(v => v.isSensitiveAccess);
      const uniqueViewsCount = new Set(precedingViews.map(v => v.resourceId).filter(Boolean)).size;

      if (event.activityType === "LOGIN_SUCCESS") {
        dynamicRiskScore = 6;
        riskBreakdown.push({ name: "Normal Login", score: 6 });
      } else if (event.activityType === "PATIENT_SEARCH") {
        dynamicRiskScore = 15;
        riskBreakdown.push({ name: "Normal Login", score: 6 });
        riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
      } else if (event.activityType === "RECORD_VIEW") {
        if (uniqueViewsCount === 1 && !hasSensitive) {
          dynamicRiskScore = 25;
          riskBreakdown.push({ name: "Normal Login", score: 6 });
          riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
          riskBreakdown.push({ name: "EHR Record Inspection (+10)", score: 10 });
        } else if (uniqueViewsCount === 2 && !hasSensitive) {
          dynamicRiskScore = 35;
          riskBreakdown.push({ name: "Normal Login", score: 6 });
          riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
          riskBreakdown.push({ name: "Cross-Patient Comparison (+20)", score: 20 });
        } else if (uniqueViewsCount > 2 && !hasSensitive && viewedWards.size > 1) {
          dynamicRiskScore = 48;
          riskBreakdown.push({ name: "Normal Login", score: 6 });
          riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
          riskBreakdown.push({ name: "Cross-Patient Comparison (+20)", score: 20 });
          riskBreakdown.push({ name: "Ward Boundary Hopping (+13)", score: 13 });
        } else if (hasSensitive && uniqueViewsCount < 4) {
          dynamicRiskScore = 62;
          riskBreakdown.push({ name: "Normal Login", score: 6 });
          riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
          riskBreakdown.push({ name: "Ward Boundary Hopping (+13)", score: 13 });
          riskBreakdown.push({ name: "Sensitive Patient Access (+34)", score: 34 });
        } else {
          dynamicRiskScore = 78;
          riskBreakdown.push({ name: "Normal Login", score: 6 });
          riskBreakdown.push({ name: "Patient Roster Search (+9)", score: 9 });
          riskBreakdown.push({ name: "Cross-Ward Directory Crawling (+30)", score: 30 });
          riskBreakdown.push({ name: "Bulk Harvesting Spike (+33)", score: 33 });
        }
      } else if (event.activityType === "PATIENT_RECORD_EXPORTED") {
        const precedingExportsCount = sessionEvents.filter(prev => prev.activityType === "PATIENT_RECORD_EXPORTED").length;
        if (precedingExportsCount === 1) {
          dynamicRiskScore = 88;
          riskBreakdown.push({ name: "Bulk EHR Harvesting (+55)", score: 55 });
          riskBreakdown.push({ name: "PDF Record Compilation (+33)", score: 33 });
        } else if (precedingExportsCount === 2) {
          dynamicRiskScore = 95;
          riskBreakdown.push({ name: "Bulk EHR Harvesting (+55)", score: 55 });
          riskBreakdown.push({ name: "Repeated PDF Downloads (+40)", score: 40 });
        } else {
          dynamicRiskScore = 100;
          riskBreakdown.push({ name: "Bulk EHR Harvesting (+55)", score: 55 });
          riskBreakdown.push({ name: "Massive Exfiltration Spike (+45)", score: 45 });
        }
      } else {
        dynamicRiskScore = Math.min(100, 10 + (viewedPatientIds.size * 10) + (patientRecordPdfExportCount * 25));
        riskBreakdown.push({ name: "EHR Views", score: viewedPatientIds.size * 10 });
        if (patientRecordPdfExportCount > 0) riskBreakdown.push({ name: "Exfiltration Attempts", score: patientRecordPdfExportCount * 25 });
      }
    } else if (isUnauthorizedAccess) {
      const violationsCount = sessionEvents.filter(se => {
        let isViolation = false;
        if (se.role === HospitalRole.ACCOUNTS_OFFICER && (se.description.toLowerCase().includes("clinical note") || se.description.toLowerCase().includes("vitals") || se.description.toLowerCase().includes("prescription"))) {
          isViolation = true;
        } else if (se.role === HospitalRole.LAB_SCIENTIST && (se.description.toLowerCase().includes("billing") || se.description.toLowerCase().includes("invoice") || se.description.toLowerCase().includes("payment"))) {
          isViolation = true;
        } else if (se.role === HospitalRole.PHARMACIST && (se.description.toLowerCase().includes("lab") || se.description.toLowerCase().includes("radiology") || se.description.toLowerCase().includes("invoice"))) {
          isViolation = true;
        } else if (se.role === HospitalRole.IT_ADMIN && (se.description.toLowerCase().includes("note") || se.description.toLowerCase().includes("vitals") || se.description.toLowerCase().includes("prescription") || se.description.toLowerCase().includes("billing"))) {
          isViolation = true;
        }
        return isViolation;
      }).length;

      if (violationsCount === 0) {
        dynamicRiskScore = 5;
        riskBreakdown.push({ name: "Normal Login", score: 5 });
      } else if (violationsCount === 1) {
        dynamicRiskScore = 25;
        riskBreakdown.push({ name: "Boundary Breach: Clinical Notes (+20)", score: 20 });
        riskBreakdown.push({ name: "Unprivileged Access Attempt (+5)", score: 5 });
      } else if (violationsCount === 2) {
        dynamicRiskScore = 50;
        riskBreakdown.push({ name: "Boundary Breach: Clinical Notes (+20)", score: 20 });
        riskBreakdown.push({ name: "Boundary Breach: Radiology (+25)", score: 25 });
        riskBreakdown.push({ name: "Unprivileged Access Attempt (+5)", score: 5 });
      } else if (violationsCount === 3) {
        dynamicRiskScore = 75;
        riskBreakdown.push({ name: "Boundary Breach: Clinical Notes (+20)", score: 20 });
        riskBreakdown.push({ name: "Boundary Breach: Radiology (+25)", score: 25 });
        riskBreakdown.push({ name: "Boundary Breach: Pharmacy (+25)", score: 25 });
        riskBreakdown.push({ name: "Unprivileged Access Attempt (+5)", score: 5 });
      } else if (violationsCount === 4) {
        dynamicRiskScore = 90;
        riskBreakdown.push({ name: "Boundary Breach: Clinical Notes (+20)", score: 20 });
        riskBreakdown.push({ name: "Boundary Breach: Radiology (+25)", score: 25 });
        riskBreakdown.push({ name: "Boundary Breach: Pharmacy (+25)", score: 25 });
        riskBreakdown.push({ name: "Boundary Breach: Nursing Dashboard (+15)", score: 15 });
        riskBreakdown.push({ name: "Unprivileged Access Attempt (+5)", score: 5 });
      } else {
        dynamicRiskScore = 100;
        riskBreakdown.push({ name: "Boundary Breach: Clinical Notes (+20)", score: 20 });
        riskBreakdown.push({ name: "Boundary Breach: Radiology (+25)", score: 25 });
        riskBreakdown.push({ name: "Boundary Breach: Pharmacy (+25)", score: 25 });
        riskBreakdown.push({ name: "Boundary Breach: Nursing Dashboard (+15)", score: 15 });
        riskBreakdown.push({ name: "Repeated Administrative Access Violations (+15)", score: 15 });
      }
    } else if (isSensitiveAccess) {
      const sensitiveViews = sessionEvents.filter(se => {
        if (se.activityType !== "RECORD_VIEW" && se.activityType !== "PATIENT_RECORD_EXPORTED") return false;
        if (!se.resourceId) return false;
        const pObj = this.data.patients.find(pt => pt.id === se.resourceId);
        return pObj && (pObj.isVip || pObj.isStaff || pObj.sensitivity === "HIGHLY_SENSITIVE" || pObj.sensitivity === "RESTRICTED");
      }).length;

      if (sensitiveViews === 0) {
        dynamicRiskScore = 5;
        riskBreakdown.push({ name: "Normal Login", score: 5 });
      } else if (sensitiveViews === 1) {
        dynamicRiskScore = 35;
        riskBreakdown.push({ name: "VIP Profile Intrusion (+30)", score: 30 });
        riskBreakdown.push({ name: "Atypical Patient View (+5)", score: 5 });
      } else if (sensitiveViews === 2) {
        dynamicRiskScore = 55;
        riskBreakdown.push({ name: "VIP Profile Intrusion (+30)", score: 30 });
        riskBreakdown.push({ name: "Hospital Director Profile View (+20)", score: 20 });
        riskBreakdown.push({ name: "Atypical Patient View (+5)", score: 5 });
      } else if (sensitiveViews === 3) {
        dynamicRiskScore = 75;
        riskBreakdown.push({ name: "VIP Profile Intrusion (+30)", score: 30 });
        riskBreakdown.push({ name: "Hospital Director Profile View (+20)", score: 20 });
        riskBreakdown.push({ name: "Celebrity Dossier Inspection (+20)", score: 20 });
        riskBreakdown.push({ name: "Atypical Patient View (+5)", score: 5 });
      } else if (sensitiveViews === 4) {
        dynamicRiskScore = 90;
        riskBreakdown.push({ name: "VIP Profile Intrusion (+30)", score: 30 });
        riskBreakdown.push({ name: "Hospital Director Profile View (+20)", score: 20 });
        riskBreakdown.push({ name: "Celebrity Dossier Inspection (+20)", score: 20 });
        riskBreakdown.push({ name: "Judge / Gov Official Profiling (+15)", score: 15 });
        riskBreakdown.push({ name: "Atypical Patient View (+5)", score: 5 });
      } else {
        dynamicRiskScore = 100;
        riskBreakdown.push({ name: "VIP Profile Intrusion (+30)", score: 30 });
        riskBreakdown.push({ name: "Hospital Director Profile View (+20)", score: 20 });
        riskBreakdown.push({ name: "Celebrity Dossier Inspection (+20)", score: 20 });
        riskBreakdown.push({ name: "Judge / Gov Official Profiling (+15)", score: 15 });
        riskBreakdown.push({ name: "Emergency Trauma Critical Profiling (+10)", score: 10 });
        riskBreakdown.push({ name: "Atypical Patient View (+5)", score: 5 });
      }
    } else {
      dynamicRiskScore = Math.max(6, Math.min(100, riskBreakdown.reduce((sum, item) => sum + item.score, 0)));
      riskBreakdown.push({ name: "Behavioral Baseline Deviation", score: dynamicRiskScore });
    }

    // Confidence accumulation (Base starts at 50% for a single indicator, gradually increases)
    const confidenceBreakdown: { name: string; score: number }[] = [
      { name: "Base", score: 50 }
    ];

    if (failedLoginCount > 0) {
      confidenceBreakdown.push({ name: "Failed Login", score: 5 });
    }
    if (failedLoginCount >= 3) {
      confidenceBreakdown.push({ name: "Repeated Failed Login", score: 5 });
    }
    if (sensitiveRecordsViewed > 0) {
      confidenceBreakdown.push({ name: "Sensitive Record", score: 10 });
    }
    if (highlySensitiveRecordsViewed > 0) {
      confidenceBreakdown.push({ name: "Highly Sensitive Record", score: 8 });
    }
    if (patientRecordPdfExportCount > 0) {
      confidenceBreakdown.push({ name: "PDF Export", score: 8 });
    }
    if (patientRecordPdfExportCount > 1) {
      confidenceBreakdown.push({ name: "Repeated Export", score: 6 });
    }
    if (viewedWards.size > 2) {
      confidenceBreakdown.push({ name: "Cross-Ward Access", score: 5 });
    }
    if (currentBaselineDeviation >= 20) {
      confidenceBreakdown.push({ name: "Baseline Deviation", score: 12 });
    }
    if (hasRestrictedAccess) {
      confidenceBreakdown.push({ name: "Restricted Module", score: 10 });
    }
    if (viewedPatientIds.size >= 5 || patientRecordPdfExportCount >= 3) {
      confidenceBreakdown.push({ name: "Bulk Harvesting", score: 10 });
    }

    const confidenceScore = Math.min(99, confidenceBreakdown.reduce((sum, item) => sum + item.score, 0));

    // Threat Type classification
    let finalThreatType: "CREDENTIAL_ABUSE" | "SENSITIVE_RECORD_ACCESS" | "UNAUTHORIZED_ACCESS" | "INSIDER_THREAT" = "SENSITIVE_RECORD_ACCESS";
    if (hasRestrictedAccess) {
      finalThreatType = "UNAUTHORIZED_ACCESS";
    } else if (patientRecordPdfExportCount > 0 || viewedPatientIds.size >= 5) {
      finalThreatType = "INSIDER_THREAT";
    } else if (failedLoginCount >= 3 || successfulLoginAfterFailures) {
      finalThreatType = "CREDENTIAL_ABUSE";
    } else if (sensitiveRecordsViewed > 0) {
      finalThreatType = "SENSITIVE_RECORD_ACCESS";
    }

    // Smart Incident Title Generator
    let threatClassification = "Behavioral Baseline Deviation";
    if (triggeredIndicators.includes("Repeated Failed Login") && triggeredIndicators.includes("Bulk Export")) {
      threatClassification = "Credential Abuse followed by Bulk Patient Data Exfiltration";
    } else if (triggeredIndicators.includes("Repeated Failed Login") && triggeredIndicators.includes("Patient Harvesting Spike")) {
      threatClassification = "Brute Force Authentication followed by Clinical Dossier Harvesting";
    } else if (triggeredIndicators.includes("Highly Sensitive Record") && triggeredIndicators.includes("Bulk Export")) {
      threatClassification = "Exfiltration of Highly Sensitive VIP Patient Dossiers";
    } else if (triggeredIndicators.includes("Cross-Ward Browsing") && triggeredIndicators.includes("Bulk Export")) {
      threatClassification = "Cross-Ward Crawling and Patient Record Harvesting";
    } else if (triggeredIndicators.includes("Restricted Module Access") && triggeredIndicators.includes("Highly Sensitive Record")) {
      threatClassification = "Restricted EHR Module Boundary Breach & VIP Record Intrusion";
    } else if (triggeredIndicators.includes("Off-Hours Activity") && triggeredIndicators.includes("Bulk Export")) {
      threatClassification = "Atypical Off-Hours Bulk Clinical PDF Export Anomaly";
    } else if (triggeredIndicators.includes("Bulk Export")) {
      threatClassification = "Bulk Clinical PDF Export & Data Exfiltration Threat";
    } else if (triggeredIndicators.includes("Patient Harvesting Spike")) {
      threatClassification = "Anomalous Patient Record Harvesting Spike";
    } else if (triggeredIndicators.includes("Restricted Module Access")) {
      threatClassification = "Clinical Scope Boundary Violation & Unauthorized System Access";
    } else if (triggeredIndicators.includes("Repeated Failed Login")) {
      threatClassification = "Brute-Force Authentication Attempt (Credential Abuse)";
    } else if (triggeredIndicators.includes("Highly Sensitive Record")) {
      threatClassification = "Confidential/VIP Patient Profile Inspection";
    } else if (currentBaselineDeviation >= 100) {
      threatClassification = `Extreme Behavioral Baseline Deviation: ${currentBaselineDeviation}% above normal shift activity`;
    } else if (currentBaselineDeviation >= 20) {
      threatClassification = `Anomalous Behavioral Deviation: ${currentBaselineDeviation}% above daily baseline`;
    } else {
      threatClassification = "Standard Clinical EHR Access Audit Alert";
    }

    // Evidence sentences
    const evidenceList: string[] = [];
    if (failedLoginCount > 0) {
      evidenceList.push(`Observed ${failedLoginCount} failed login attempts in session.`);
    }
    if (successfulLoginAfterFailures) {
      evidenceList.push(`Successful authentication established after preceding password lock failures.`);
    }
    if (viewedPatientIds.size > 0) {
      evidenceList.push(`${viewedPatientIds.size} unique patient clinical record dossiers inspected.`);
    }
    if (currentBaselineDeviation >= 20) {
      evidenceList.push(`User daily access limit baseline exceeded by ${currentBaselineDeviation}%.`);
    }
    if (patientRecordPdfExportCount > 0) {
      evidenceList.push(`${patientRecordPdfExportCount} patient records successfully compiled and exported to local PDF report.`);
    }
    if (highlySensitiveRecordsViewed > 0) {
      evidenceList.push(`${highlySensitiveRecordsViewed} highly sensitive or VIP confidential patient profiles breached.`);
    }
    if (viewedWards.size > 1) {
      evidenceList.push(`Accessed records spanning ${viewedWards.size} separate hospital clinical wards (Cross-Ward Browsing).`);
    }
    if (viewedPatientIds.size >= 5) {
      evidenceList.push(`Detected patient data harvesting pattern across inpatient databases.`);
    }
    if (isOffHoursSession) {
      evidenceList.push(`Suspicious operational activities performed during off-hours.`);
    }
    if (!knownDevice) {
      evidenceList.push(`Session established from unrecognized device signature.`);
    }
    if (!knownIp) {
      evidenceList.push(`Session established from unapproved remote network address.`);
    }

    // High fidelity forensic evidence items with assigned severity
    const evidenceItems: any[] = [];
    let evIdCount = 1;
    const addEv = (desc: string, sev: 'Low' | 'Medium' | 'High' | 'Critical', cat: string) => {
      evidenceItems.push({
        id: `EV-${String(evIdCount++).padStart(3, '0')}`,
        description: desc,
        severity: sev,
        timestamp: event.timestamp,
        category: cat
      });
    };

    if (failedLoginCount >= 3) {
      addEv(`Brute-force credential abuse: ${failedLoginCount} repeated failed authentication attempts recorded on account.`, "High", "Authentication");
    } else if (failedLoginCount > 0) {
      addEv(`Atypical failed login attempt from remote host device: ${event.deviceName || 'unknown'}.`, "Low", "Authentication");
    }
    if (successfulLoginAfterFailures) {
      addEv("Successful workspace login established following preceding password credential failures.", "Medium", "Authentication");
    }
    if (highlySensitiveRecordsViewed > 0) {
      addEv(`Accessed ${highlySensitiveRecordsViewed} highly sensitive, VIP, or confidential clinical dossiers (HIPAA Warning).`, "Critical", "Data Access");
    }
    if (sensitiveRecordsViewed > 0) {
      addEv(`Accessed ${sensitiveRecordsViewed} restricted or staff medical profiles without standard care assignment.`, "High", "Data Access");
    }
    if (patientRecordPdfExportCount >= 3) {
      addEv(`Bulk patient history exports: ${patientRecordPdfExportCount} medical summaries compiled and generated to local PDF files.`, "Critical", "Exfiltration");
    } else if (patientRecordPdfExportCount > 0) {
      addEv(`EHR document download: ${patientRecordPdfExportCount} patient record exported to local machine PDF.`, "Medium", "Exfiltration");
    }
    if (viewedWards.size > 2) {
      addEv(`Cross-ward directory crawling: records inspected spanning ${viewedWards.size} separate clinical wards.`, "High", "Lateral Deviation");
    }
    if (currentBaselineDeviation >= 100) {
      addEv(`Severe baseline deviation: clinical access rate exceeds historical role norm by ${currentBaselineDeviation}%.`, "Critical", "Behavioral");
    } else if (currentBaselineDeviation >= 20) {
      addEv(`Behavioral deviation warning: clinical access rate exceeds historical norm by ${currentBaselineDeviation}%.`, "Medium", "Behavioral");
    }
    if (hasRestrictedAccess) {
      addEv(`Authorization scope failure: Staff role ${event.role} attempted to access restricted modules outside standard clinical scope.`, "High", "Authorization");
    }
    if (isOffHoursSession) {
      addEv("Atypical Remote Access timing profile: Session activities conducted during standard off-hours.", "Low", "Behavioral");
    }
    if (!knownDevice) {
      addEv(`Endpoint anomaly: Session initiated from atypical, unapproved, or unrecognized device: ${event.deviceName || 'unknown'}.`, "Medium", "Endpoint");
    }
    if (!knownIp) {
      addEv(`Network perimeter anomaly: Session initiated from unrecognized remote IP address: ${event.ipAddress || 'unknown'}.`, "Medium", "Endpoint");
    }

    // Build Analyst Recommendations
    const recommendations: string[] = [];
    if (triggeredIndicators.includes("Repeated Failed Login") || triggeredIndicators.includes("Successful Login After Failures")) {
      recommendations.push("Force immediate password reset and enable mandatory Multi-Factor Authentication (MFA) challenge.");
      recommendations.push("Revoke active session tokens across devices and terminate all concurrent clinical logins.");
    }
    if (triggeredIndicators.includes("Bulk Export") || triggeredIndicators.includes("Patient Record Export")) {
      recommendations.push("Temporarily suspend clinical PDF compile and EHR export privileges for the affected user.");
      recommendations.push("Flag, track, and quarantine compiled files on local client host via EDR endpoint containment.");
    }
    if (triggeredIndicators.includes("Highly Sensitive Record") || triggeredIndicators.includes("Sensitive Record Viewed")) {
      recommendations.push("Initiate clinical privacy compliance audit and request official shift care-relation justification.");
      recommendations.push("Enable real-time security shadowing / EHR access session recording for this account.");
    }
    if (triggeredIndicators.includes("Cross-Ward Browsing") || triggeredIndicators.includes("Patient Harvesting Spike")) {
      recommendations.push("Enforce clinical role-based access control (RBAC) boundaries to restrict EHR access to currently active ward roster.");
      recommendations.push("Isolate host machine via local network perimeter control to prevent wider clinical directory crawling.");
    }
    if (triggeredIndicators.includes("Off-Hours Activity")) {
      recommendations.push("Cross-reference current HR roster schedule to verify on-call clinical rotation or hospital emergency shift assignment.");
    }
    if (triggeredIndicators.includes("Unknown Device") || triggeredIndicators.includes("Unknown IP")) {
      recommendations.push("Configure perimeter firewall block for remote IP and inspect VPN gateway tunnels.");
      recommendations.push("Verify device MDM compliance standing and quarantine unmanaged end-user endpoints.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Conduct routine audit of account activity log and maintain standard clinical surveillance.");
      recommendations.push("Verify role scope assignment settings inside internal LDAP/Active Directory group policies.");
    }

    // Session metrics durations
    const firstEvent = sessionEvents[0];
    const lastEvent = sessionEvents[sessionEvents.length - 1];
    const startMs = new Date(firstEvent.timestamp).getTime();
    const endMs = new Date(lastEvent.timestamp).getTime();
    const diffSec = Math.round((endMs - startMs) / 1000);
    let sessionDuration = "0s";
    if (diffSec < 60) {
      sessionDuration = `${diffSec}s`;
    } else if (diffSec < 3600) {
      sessionDuration = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
    } else {
      sessionDuration = `${Math.floor(diffSec / 3600)}h ${Math.floor((diffSec % 3600) / 60)}m`;
    }

    const threatDetectionTime = sessionEvents.find(se => se.riskContribution > 0)?.timestamp || event.timestamp;

    // Step-by-step Risk and Confidence Evolution chronologically
    let runningRisk = 0;
    let runningConf = 50;
    const riskEvolution: any[] = [];
    const triggeredSoFar = new Set<string>();

    for (let idx = 0; idx < sessionEvents.length; idx++) {
      const e = sessionEvents[idx];
      let rAdded = 0;
      let reason = "";

      const isFirstOfItsKind = (ind: string) => {
        if (triggeredSoFar.has(ind)) return false;
        triggeredSoFar.add(ind);
        return true;
      };

      if (e.activityType === "LOGIN_FAILED") {
        rAdded = 15;
        reason = "Failed authentication attempt recorded.";
        runningConf += isFirstOfItsKind("Failed Login") ? 5 : 0;
      } else if (e.activityType === "LOGIN_SUCCESS") {
        const precedingFailures = sessionEvents.slice(0, idx).filter(prev => prev.activityType === "LOGIN_FAILED").length;
        if (precedingFailures > 0) {
          rAdded = 5;
          reason = `Successful login following ${precedingFailures} password authentication failures (Suspicious auth overlap).`;
          runningConf += isFirstOfItsKind("Successful Login After Failures") ? 5 : 0;
        } else {
          rAdded = 0;
          reason = "Legitimate session authentication established and verified.";
        }
      } else if (e.activityType === "RECORD_VIEW") {
        let isHighlySensitive = false;
        if (e.resourceId) {
          const pObj = this.data.patients.find(pt => pt.id === e.resourceId);
          if (pObj && pObj.sensitivity === "HIGHLY_SENSITIVE") {
            isHighlySensitive = true;
          }
        }
        if (isHighlySensitive) {
          rAdded = 15;
          reason = `Unauthorized clinical query: Inspected highly sensitive VIP record (ID: ${e.resourceId || 'unknown'}).`;
          runningConf += isFirstOfItsKind("Highly Sensitive Record") ? 8 : 0;
        } else {
          const isSens = e.isSensitiveAccess;
          rAdded = isSens ? 12 : 4;
          reason = isSens 
            ? `Accessed restricted clinical file (ID: ${e.resourceId || 'unknown'}).`
            : `Inspected electronic health file (ID: ${e.resourceId || 'unknown'}).`;
          if (isSens) {
            runningConf += isFirstOfItsKind("Sensitive Record Viewed") ? 10 : 0;
          }
        }
      } else if (e.activityType === "PATIENT_RECORD_EXPORTED") {
        const precedingExports = sessionEvents.slice(0, idx).filter(prev => prev.activityType === "PATIENT_RECORD_EXPORTED").length;
        const seq = [8, 8, 10, 8, 6, 4];
        rAdded = precedingExports < seq.length ? seq[precedingExports] : 2;
        reason = `Data exfiltration: Exported electronic medical files to local client PDF (ID: ${e.resourceId || 'unknown'}).`;
        runningConf += isFirstOfItsKind("Patient Record Export") ? 8 : 0;
        if (precedingExports >= 1) {
          runningConf += isFirstOfItsKind("Repeated Export") ? 6 : 0;
        }
      }

      // Check role module boundaries
      let crossBoundary = false;
      if (e.role === HospitalRole.ACCOUNTS_OFFICER && (e.description.toLowerCase().includes("clinical note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.LAB_SCIENTIST && (e.description.toLowerCase().includes("billing") || e.description.toLowerCase().includes("invoice") || e.description.toLowerCase().includes("payment"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.PHARMACIST && (e.description.toLowerCase().includes("lab") || e.description.toLowerCase().includes("radiology") || e.description.toLowerCase().includes("invoice"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.IT_ADMIN && (e.description.toLowerCase().includes("note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription") || e.description.toLowerCase().includes("billing"))) {
        crossBoundary = true;
      }

      if (crossBoundary) {
        rAdded += 15;
        reason += " Role scope boundary violation (Restricted EHR Module Access).";
        runningConf += isFirstOfItsKind("Restricted Module Access") ? 10 : 0;
      }

      // Check off-hours
      if (isEventOffHours(e.timestamp)) {
        rAdded += 2;
        runningConf += isFirstOfItsKind("Off-Hours Activity") ? 5 : 0;
      }

      const riskBefore = runningRisk;
      runningRisk = Math.min(100, runningRisk + rAdded);

      riskEvolution.push({
        timestamp: e.timestamp,
        event: e.activityType,
        riskBefore,
        riskAdded: rAdded,
        currentRisk: runningRisk,
        reason,
        confidence: Math.min(99, runningConf)
      });
    }

    // Reason explanation detailing WHY the threat evolved
    const chronoCategories: { [key: string]: { triggered: boolean; firstIndex: number; text: string } } = {
      endpoint: { triggered: false, firstIndex: 9999, text: "" },
      auth: { triggered: false, firstIndex: 9999, text: "" },
      off_hours: { triggered: false, firstIndex: 9999, text: "" },
      unauthorized: { triggered: false, firstIndex: 9999, text: "" },
      patient_views: { triggered: false, firstIndex: 9999, text: "" },
      sensitive_views: { triggered: false, firstIndex: 9999, text: "" },
      exports: { triggered: false, firstIndex: 9999, text: "" },
      deviation: { triggered: false, firstIndex: 9999, text: "" }
    };

    // 1. Endpoint Anomaly
    if (!knownDevice || !knownIp) {
      chronoCategories.endpoint.triggered = true;
      chronoCategories.endpoint.firstIndex = 0; // Ingress point
      const dev = event.deviceName || "Unknown Device";
      const ip = event.ipAddress || "Unknown IP";
      if (!knownDevice && !knownIp) {
        const variants = [
          `The session was initiated from an atypical endpoint signature, specifically involving an unrecognized device (${dev}) and an unapproved remote IP address (${ip}).`,
          `Security telemetry flagged network ingress anomalies, noting that the connection was established via an unverified IP address (${ip}) using a non-standard device registration (${dev}).`,
          `Initial session establishment bypassed typical perimeter checks due to access from an unapproved client endpoint (${dev}) at remote IP ${ip}.`
        ];
        chronoCategories.endpoint.text = variants[Math.floor(Math.random() * variants.length)];
      } else if (!knownIp) {
        const variants = [
          `The user session originated from an unapproved remote network address (${ip}).`,
          `Anomalous connection coordinates were registered from an unrecognized IP address (${ip}).`,
          `The session was accessed from an unapproved remote IP address (${ip}) outside of typical hospital network perimeters.`
        ];
        chronoCategories.endpoint.text = variants[Math.floor(Math.random() * variants.length)];
      } else {
        const variants = [
          `The workspace session was established using an unregistered host device (${dev}).`,
          `Host footprint verification flagged an unrecognized end-user client device (${dev}).`,
          `Session access was conducted from an atypical and unapproved host endpoint device (${dev}).`
        ];
        chronoCategories.endpoint.text = variants[Math.floor(Math.random() * variants.length)];
      }
    }

    // 2. Authentication Anomaly
    if (failedLoginCount > 0) {
      chronoCategories.auth.triggered = true;
      const firstAuthIdx = sessionEvents.findIndex(se => se.activityType === "LOGIN_FAILED");
      chronoCategories.auth.firstIndex = firstAuthIdx !== -1 ? firstAuthIdx : 0;
      if (successfulLoginAfterFailures) {
        const variants = [
          `This was immediately preceded by ${failedLoginCount} consecutive failed password entry attempts before a successful authentication was established.`,
          `Prior to successful workspace access, the system recorded ${failedLoginCount} repeated authentication failures on this account, signaling potential credential abuse.`,
          `A sequence of ${failedLoginCount} unsuccessful login attempts occurred before the session was successfully authenticated.`
        ];
        chronoCategories.auth.text = variants[Math.floor(Math.random() * variants.length)];
      } else {
        const variants = [
          `The account logged ${failedLoginCount} anomalous failed login attempts during this session window.`,
          `During the tracking window, the system registered ${failedLoginCount} failed authentication challenges.`,
          `The session timeline recorded ${failedLoginCount} separate unsuccessful authentication attempts on the account.`
        ];
        chronoCategories.auth.text = variants[Math.floor(Math.random() * variants.length)];
      }
    }

    // 3. Off-Hours Activity
    const firstOffHoursIdx = sessionEvents.findIndex(se => isEventOffHours(se.timestamp));
    if (isOffHoursSession && firstOffHoursIdx !== -1) {
      chronoCategories.off_hours.triggered = true;
      chronoCategories.off_hours.firstIndex = firstOffHoursIdx;
      const variants = [
        `Furthermore, the session activities were conducted during standard off-hours, when the affected user is not rostered on duty.`,
        `These operations were atypically conducted during off-hours, deviating from standard clinical shift schedule constraints.`,
        `Additionally, the workspace timeline shows that these actions took place during off-shift hours, raising suspicion regarding on-call emergency justification.`
      ];
      chronoCategories.off_hours.text = variants[Math.floor(Math.random() * variants.length)];
    }

    // Helper for boundary breach
    const checkCrossBoundary = (e: any) => {
      let crossBoundary = false;
      if (e.role === HospitalRole.ACCOUNTS_OFFICER && (e.description.toLowerCase().includes("clinical note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.LAB_SCIENTIST && (e.description.toLowerCase().includes("billing") || e.description.toLowerCase().includes("invoice") || e.description.toLowerCase().includes("payment"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.PHARMACIST && (e.description.toLowerCase().includes("lab") || e.description.toLowerCase().includes("radiology") || e.description.toLowerCase().includes("invoice"))) {
        crossBoundary = true;
      } else if (e.role === HospitalRole.IT_ADMIN && (e.description.toLowerCase().includes("note") || e.description.toLowerCase().includes("vitals") || e.description.toLowerCase().includes("prescription") || e.description.toLowerCase().includes("billing"))) {
        crossBoundary = true;
      }
      return crossBoundary;
    };

    // 4. Unauthorized Scope Breach
    if (hasRestrictedAccess) {
      chronoCategories.unauthorized.triggered = true;
      const firstScopeIdx = sessionEvents.findIndex(checkCrossBoundary);
      chronoCategories.unauthorized.firstIndex = firstScopeIdx !== -1 ? firstScopeIdx : 0;
      const rLabel = event.role || "Staff";
      const variants = [
        `Once authenticated, the user crossed clinical module boundaries, attempting to query restricted EHR databases outside their authorized role of ${rLabel}.`,
        `The system then recorded multiple authorization scope failures as the user attempted to access restricted modules in conflict with their ${rLabel} privileges.`,
        `Following login, the user breached standard operational role boundaries by accessing specialized EHR modules not permitted for a ${rLabel}.`
      ];
      chronoCategories.unauthorized.text = variants[Math.floor(Math.random() * variants.length)];
    }

    // 5. Patient Record Access / Harvesting
    if (viewedPatientIds.size > 0) {
      chronoCategories.patient_views.triggered = true;
      const firstViewIdx = sessionEvents.findIndex(se => se.activityType === "RECORD_VIEW");
      chronoCategories.patient_views.firstIndex = firstViewIdx !== -1 ? firstViewIdx : 0;
      const numViewed = viewedPatientIds.size;
      if (numViewed >= 5) {
        const variants = [
          `Following this, the session exhibited an aggressive clinical data harvesting pattern, rapidly crawling and inspecting ${numViewed} unique patient records across multiple clinical wards.`,
          `The user subsequently queried a high volume of health dossiers, reviewing ${numViewed} separate patient histories in rapid succession.`,
          `Activity logs then revealed an anomalous patient query spike, involving the viewing of ${numViewed} unique clinical profiles.`
        ];
        chronoCategories.patient_views.text = variants[Math.floor(Math.random() * variants.length)];
      } else {
        const variants = [
          `The user then accessed ${numViewed} unique patient records in the session.`,
          `Subsequently, the session timeline logged queries into ${numViewed} separate patient clinical histories.`,
          `The user then proceeded to inspect ${numViewed} separate patient profiles within the clinical directory.`
        ];
        chronoCategories.patient_views.text = variants[Math.floor(Math.random() * variants.length)];
      }
    }

    // 6. Sensitive / VIP Dossier Inspection
    if (sensitiveRecordsViewed > 0 || highlySensitiveRecordsViewed > 0) {
      chronoCategories.sensitive_views.triggered = true;
      const firstSensIdx = sessionEvents.findIndex(se => se.activityType === "RECORD_VIEW" && (se.isSensitiveAccess || (se.resourceId && (this.data.patients.find(pt => pt.id === se.resourceId)?.sensitivity === "HIGHLY_SENSITIVE"))));
      chronoCategories.sensitive_views.firstIndex = firstSensIdx !== -1 ? firstSensIdx : 0;
      if (sensitiveRecordsViewed > 0 && highlySensitiveRecordsViewed > 0) {
        const variants = [
          `This clinical query sequence included accessing ${sensitiveRecordsViewed} restricted files, with at least ${highlySensitiveRecordsViewed} views targeting highly sensitive, confidential, or VIP patient dossiers.`,
          `Among these files, ${sensitiveRecordsViewed} restricted profiles and ${highlySensitiveRecordsViewed} highly confidential VIP dossiers were inspected without apparent clinical care-relation.`,
          `Specifically, the query chain compromised ${sensitiveRecordsViewed} restricted clinical histories and ${highlySensitiveRecordsViewed} VIP patient profiles, triggering immediate privacy warnings.`
        ];
        chronoCategories.sensitive_views.text = variants[Math.floor(Math.random() * variants.length)];
      } else if (sensitiveRecordsViewed > 0) {
        const variants = [
          `During this sequence, the user inspected ${sensitiveRecordsViewed} restricted patient dossiers without authorized assignment.`,
          `This activity involved querying ${sensitiveRecordsViewed} restricted medical folders and clinical summaries.`,
          `Audit trail logs flagged that the user specifically targeted ${sensitiveRecordsViewed} restricted patient files.`
        ];
        chronoCategories.sensitive_views.text = variants[Math.floor(Math.random() * variants.length)];
      } else {
        const variants = [
          `The queries specifically targeted ${highlySensitiveRecordsViewed} highly sensitive or confidential VIP patient records.`,
          `This included unauthorized access to ${highlySensitiveRecordsViewed} highly confidential VIP clinical folders.`,
          `The session logs indicate direct search and inspection of ${highlySensitiveRecordsViewed} highly sensitive VIP clinical files.`
        ];
        chronoCategories.sensitive_views.text = variants[Math.floor(Math.random() * variants.length)];
      }
    }

    // 7. Patient Record Export / Exfiltration
    if (patientRecordPdfExportCount > 0) {
      chronoCategories.exports.triggered = true;
      const firstExportIdx = sessionEvents.findIndex(se => se.activityType === "PATIENT_RECORD_EXPORTED");
      chronoCategories.exports.firstIndex = firstExportIdx !== -1 ? firstExportIdx : 0;
      const numExports = patientRecordPdfExportCount;
      const variants = [
        `The activity culminated in data exfiltration, during which ${numExports} separate patient summaries were successfully compiled and exported as local PDF documents.`,
        `Following the clinical lookups, the user initiated bulk report compiles, exporting ${numExports} patient records to the local client filesystem.`,
        `Shortly after, the session logged ${numExports} distinct patient record compilation and local PDF export actions.`
      ];
      chronoCategories.exports.text = variants[Math.floor(Math.random() * variants.length)];
    }

    // 8. Behavioral Baseline Deviation
    if (currentBaselineDeviation >= 20) {
      chronoCategories.deviation.triggered = true;
      const firstActionIdx = sessionEvents.findIndex(se => se.activityType === "RECORD_VIEW" || se.activityType === "PATIENT_RECORD_EXPORTED");
      chronoCategories.deviation.firstIndex = firstActionIdx !== -1 ? firstActionIdx : 0;
      const dev = currentBaselineDeviation;
      const variants = [
        `This volume of queries and exports represents a severe baseline deviation of ${dev}% above the user's historical role norm.`,
        `These metrics represent an extreme behavioral baseline deviation, exceeding established daily activity levels by ${dev}%.`,
        `The recorded clinical access frequency deviated significantly from standard limits, registered at ${dev}% above normal baseline parameters.`
      ];
      chronoCategories.deviation.text = variants[Math.floor(Math.random() * variants.length)];
    }

    // Gather all triggered categories and sort chronologically based on firstIndex
    const activeSegments = Object.keys(chronoCategories)
      .map(key => chronoCategories[key])
      .filter(cat => cat.triggered && cat.text)
      .sort((a, b) => a.firstIndex - b.firstIndex);

    // Dynamic introduction and conclusion
    const introVariants = [
      `The Adaptive Threat Intelligence Framework progressively accumulated behavioral evidence during the authenticated session.`,
      `An automated behavioral correlation sequence was recorded by the Adaptive Threat Intelligence Framework for the current session.`,
      `During the authenticated session, the Adaptive Threat Intelligence Framework continuously analyzed user activity against established baselines.`
    ];
    const introText = introVariants[Math.floor(Math.random() * introVariants.length)];

    const suffixVariants = [
      `These correlated indicators progressively increased the adaptive risk score until the activity met the threshold for a ${threatClassification}.`,
      `The continuous correlation of these high-fidelity indicators pushed the session risk score beyond adaptive thresholds, resulting in the classification of a ${threatClassification}.`,
      `The accumulation of these anomalous telemetry parameters triggered the heuristics engine, leading to the immediate classification of a ${threatClassification}.`,
      `These combined factors exceeded all standard baseline safety limits, classifying the session activity under the high-risk category of a ${threatClassification}.`
    ];
    const conclusionText = suffixVariants[Math.floor(Math.random() * suffixVariants.length)];

    // Combine all segments chronologically
    const middleText = activeSegments.map(seg => seg.text).join(" ");
    const reasonSummary = `${introText} ${middleText} ${conclusionText}`;

    // Construct the SessionThreatContext
    const sessionContext: SessionThreatContext = {
      sessionId: event.sessionId!,
      user: event.username,
      role: event.role,
      department: staffUser ? staffUser.department : (profile?.typicalDepartment || "Clinical Services"),
      loginTime: loginTime,
      authenticationHistory,
      failedLoginCount,
      successfulLoginAfterFailures,
      knownDevice,
      knownIp,
      patientViews,
      uniquePatientsViewed: viewedPatientIds.size,
      sensitiveRecordsViewed,
      highlySensitiveRecordsViewed,
      crossWardAccessCount: viewedWards.size,
      patientRecordPdfExportCount,
      repeatedExportCount,
      currentBaselineDeviation,
      triggeredIndicators,
      currentRiskScore: dynamicRiskScore,
      currentConfidenceScore: confidenceScore,
      currentThreatClassification: threatClassification,
      threatTimeline
    };

    let riskLvl: SecurityRiskLevel = SecurityRiskLevel.LOW;
    if (dynamicRiskScore >= 75) riskLvl = SecurityRiskLevel.CRITICAL;
    else if (dynamicRiskScore >= 55) riskLvl = SecurityRiskLevel.HIGH;
    else if (dynamicRiskScore >= 35) riskLvl = SecurityRiskLevel.MEDIUM;

    // Check if open incident folder already exists for this session
    const existingIncident = this.data.incidents.find(
      inc => inc.sessionId === event.sessionId &&
      inc.status !== "Resolved" && inc.status !== "Mitigated"
    );

    const riskContributions: { [activityType: string]: number } = {};
    for (const item of riskBreakdown) {
      riskContributions[item.name] = item.score;
    }

    if (existingIncident) {
      // EVOLVE EXISTING INCIDENT
      const detectedBehaviors: string[] = [];
      if (failedLoginCount > 0) detectedBehaviors.push("Credential Abuse");
      if (sensitiveRecordsViewed > 0) detectedBehaviors.push("Sensitive Record Access");
      if (patientRecordPdfExportCount > 0) detectedBehaviors.push("Data Exfiltration");
      if (hasRestrictedAccess) detectedBehaviors.push("Unauthorized Access");

      if (detectedBehaviors.length > 1) {
        existingIncident.isMerged = true;
        existingIncident.mergeText = `Merged from ${detectedBehaviors.slice(0, -1).join(", ")} and ${detectedBehaviors[detectedBehaviors.length - 1]} into Bulk Patient Record Exfiltration Investigation`;
        existingIncident.title = `Bulk Patient Record Exfiltration Investigation`;
        existingIncident.mergeReason = `Unified Session Escalation: Correlated multiple suspicious behaviors in the same session: ${detectedBehaviors.join(", ")}.`;
      } else {
        existingIncident.title = threatClassification;
      }

      existingIncident.threatType = finalThreatType;
      existingIncident.riskScore = dynamicRiskScore;
      existingIncident.riskLevel = riskLvl;
      existingIncident.confidenceScore = confidenceScore;
      existingIncident.evidence = evidenceList;
      existingIncident.triggeredIndicators = triggeredIndicators;
      existingIncident.clinicalContext = `Views: ${viewedPatientIds.size} | Wards: ${viewedWards.size} | PDF Exports: ${patientRecordPdfExportCount} | Sensitive Views: ${sensitiveRecordsViewed}`;
      existingIncident.explanation = reasonSummary;
      existingIncident.expectedBehavior = `${roleBaseline.expectedViews} patient records/day`;
      existingIncident.currentBehavior = `${viewedPatientIds.size} patient records viewed in session`;
      existingIncident.deviationPercentage = currentBaselineDeviation;
      existingIncident.correlatedEvents = sessionEvents;
      existingIncident.riskContributions = riskContributions;
      existingIncident.sessionContext = sessionContext;

      // Explainable AI metrics
      existingIncident.riskBreakdown = riskBreakdown;
      existingIncident.confidenceBreakdown = confidenceBreakdown;
      existingIncident.expectedViews = roleBaseline.expectedViews;
      existingIncident.currentViews = currentViews;
      existingIncident.viewsDeviation = viewsDeviation;
      existingIncident.expectedExports = roleBaseline.expectedExports;
      existingIncident.currentExports = currentExports;
      existingIncident.exportsDeviation = exportsDeviation;

      // Extended metrics
      existingIncident.riskEvolution = riskEvolution;
      existingIncident.evidenceItems = evidenceItems;
      existingIncident.recommendations = recommendations;
      existingIncident.sessionDuration = sessionDuration;
      existingIncident.threatDetectionTime = threatDetectionTime;

      if (!existingIncident.eventIds.includes(event.id)) {
        existingIncident.eventIds.push(event.id);
      }

      existingIncident.timeline.push({
        timestamp: event.timestamp,
        action: "ATIF Adaptive Threat Evolved",
        note: `New event correlated: ${event.activityType} (${event.description}). Active Threat matured to: ${threatClassification}. Risk rating adjusted to ${dynamicRiskScore}.`,
        user: "ATIF Correlation Engine"
      });

      sessionContext.incidentId = existingIncident.id;
      event.riskContribution = Math.min(100, dynamicRiskScore);
    } else {
      // INITIALIZE A NEW INCIDENT
      let incidentId = "";
      let isIdDuplicate = true;
      while (isIdDuplicate) {
        const randNum = Math.floor(1000 + Math.random() * 8999);
        incidentId = `INC-${new Date().getFullYear()}-${randNum}`;
        isIdDuplicate = this.data.incidents.some(i => i.id === incidentId);
      }

      sessionContext.incidentId = incidentId;

      const detectedBehaviors: string[] = [];
      if (failedLoginCount > 0) detectedBehaviors.push("Credential Abuse");
      if (sensitiveRecordsViewed > 0) detectedBehaviors.push("Sensitive Record Access");
      if (patientRecordPdfExportCount > 0) detectedBehaviors.push("Data Exfiltration");
      if (hasRestrictedAccess) detectedBehaviors.push("Unauthorized Access");

      let finalTitle = threatClassification;
      let isMerged = false;
      let mergeText = "";
      if (detectedBehaviors.length > 1) {
        isMerged = true;
        mergeText = `Merged from ${detectedBehaviors.slice(0, -1).join(", ")} and ${detectedBehaviors[detectedBehaviors.length - 1]} into Bulk Patient Record Exfiltration Investigation`;
        finalTitle = `Bulk Patient Record Exfiltration Investigation`;
      }

      const newIncident: ThreatIncident = {
        id: incidentId,
        timestamp: event.timestamp,
        title: finalTitle,
        isMerged,
        mergeText,
        threatType: finalThreatType,
        riskScore: dynamicRiskScore,
        riskLevel: riskLvl,
        affectedUser: event.username,
        affectedPatient: event.resourceId,
        eventIds: [event.id],
        status: "Open",
        confidenceScore: confidenceScore,
        evidence: evidenceList,
        triggeredIndicators,
        affectedUserRole: event.role,
        clinicalContext: `Views: ${viewedPatientIds.size} | Wards: ${viewedWards.size} | PDF Exports: ${patientRecordPdfExportCount} | Sensitive Views: ${sensitiveRecordsViewed}`,
        explanation: reasonSummary,
        expectedBehavior: `${roleBaseline.expectedViews} patient records/day`,
        currentBehavior: `${viewedPatientIds.size} patient records viewed in session`,
        deviationPercentage: currentBaselineDeviation,
        expectedLogin: `${profile?.typicalShiftStart || '08:00'} - ${profile?.typicalShiftEnd || '17:00'}`,
        actualLogin: `${new Date(event.timestamp).getHours().toString().padStart(2, '0')}:${new Date(event.timestamp).getMinutes().toString().padStart(2, '0')}`,
        expectedDevice: profile?.typicalDevices?.[0] || "Authorized Roster Laptop",
        actualDevice: event.deviceName || "Unknown Device",
        sessionId: event.sessionId,
        correlatedEvents: sessionEvents,
        riskContributions: riskContributions,
        sessionContext,
        timeline: [
          {
            timestamp: event.timestamp,
            action: "ATIF Session Correlation Commenced",
            note: `Correlation session ${event.sessionId} initialized. Active Threat Level: ${threatClassification}. Initial risk rating set to ${dynamicRiskScore}.`,
            user: "ATIF Correlation Engine"
          }
        ],
        // Explainable AI metrics
        riskBreakdown,
        confidenceBreakdown,
        expectedViews: roleBaseline.expectedViews,
        currentViews: currentViews,
        viewsDeviation: viewsDeviation,
        expectedExports: roleBaseline.expectedExports,
        currentExports: currentExports,
        exportsDeviation: exportsDeviation,

        // Extended metrics
        riskEvolution,
        evidenceItems,
        recommendations,
        sessionDuration,
        threatDetectionTime
      };

      this.data.incidents.unshift(newIncident);
      event.riskContribution = Math.min(100, dynamicRiskScore);
    }
  }

  // INCIDENT MANAGEMENT FUNCTIONS
  updateIncidentStatus(incidentId: string, status: ThreatIncident["status"], operator: string, note: string) {
    const idx = this.data.incidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      const timestamp = new Date().toISOString();
      this.data.incidents[idx].status = status;
      this.data.incidents[idx].timeline.push({
        timestamp,
        action: `Status Transited to ${status}`,
        note,
        user: operator
      });
      this.persist();
    }
  }

  addIncidentTimelineAction(incidentId: string, action: string, note: string, operator: string) {
    const idx = this.data.incidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      const timestamp = new Date().toISOString();
      this.data.incidents[idx].timeline.push({
        timestamp,
        action,
        note,
        user: operator
      });
      this.persist();
    }
  }

  saveAiAnalysis(incidentId: string, summary: string) {
    const idx = this.data.incidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      this.data.incidents[idx].aiAnalysis = summary;
      this.persist();
    }
  }

  // GET SECURITY POSTURE METRICS
  getSecurityPosture(): SecurityPosture {
    const openCount = this.data.incidents.filter(i => i.status === "Open" || i.status === "Investigating").length;
    const totalCount = this.data.incidents.length;

    // Calculate dynamic security health score out of 100
    // Each open incident knocks off points based on seriousness
    let scoreMultiplier = 0;
    this.data.incidents.filter(i => i.status === "Open" || i.status === "Investigating").forEach(i => {
      if (i.riskLevel === SecurityRiskLevel.CRITICAL) scoreMultiplier += 15;
      else if (i.riskLevel === SecurityRiskLevel.HIGH) scoreMultiplier += 10;
      else if (i.riskLevel === SecurityRiskLevel.MEDIUM) scoreMultiplier += 5;
      else scoreMultiplier += 2;
    });

    const overallScore = Math.max(15, 100 - scoreMultiplier);

    let systemStatus: SecurityPosture["systemStatus"] = "Healthy";
    if (overallScore < 40) systemStatus = "Compromised";
    else if (overallScore < 70) systemStatus = "Active Threat";
    else if (overallScore < 90) systemStatus = "Elevated Threat";

    // department rankings
    const depts: SecurityPosture["incidentsByDepartment"] = {
      "Clinical Consultation": 0,
      "Pathology Laboratory": 0,
      "Medical Imaging": 0,
      "Outpatient Pharmacy": 0,
      "Billing and Finance": 0,
      "Health Information Management": 0
    };

    this.data.incidents.forEach(inc => {
      const staffUser = this.data.staff.find(s => s.username === inc.affectedUser);
      if (staffUser) {
        const d = staffUser.department;
        if (depts[d] !== undefined) depts[d] += 1;
        else depts[d] = 1;
      }
    });

    return {
      overallScore,
      threatCount: { open: openCount, total: totalCount },
      incidentsByDepartment: depts,
      systemStatus
    };
  }

  // SYSTEM LOGGING & POLICY PARAMETERS
  getSystemSettings(): SystemSettings {
    if (!this.data.systemSettings) {
      this.data.systemSettings = {
        bruteForceThreshold: 3,
        anomalyScoringWeight: 1.2,
        auditLoggingRetention: 90
      };
    }
    return this.data.systemSettings;
  }

  updateSystemSettings(updates: Partial<SystemSettings>) {
    if (!this.data.systemSettings) {
      this.data.systemSettings = {
        bruteForceThreshold: 3,
        anomalyScoringWeight: 1.2,
        auditLoggingRetention: 90
      };
    }
    this.data.systemSettings = { ...this.data.systemSettings, ...updates };
    this.persist();
  }

  getBackups(): BackupDetail[] {
    if (!this.data.backups) {
      this.data.backups = [];
    }
    return this.data.backups;
  }

  addBackup(backup: BackupDetail) {
    if (!this.data.backups) {
      this.data.backups = [];
    }
    this.data.backups.unshift(backup);
    this.persist();
  }

  getSimulations(): SimulationHistoryItem[] {
    if (!this.data.simulations) {
      this.data.simulations = [];
    }
    return this.data.simulations;
  }

  addSimulation(simulation: SimulationHistoryItem) {
    if (!this.data.simulations) {
      this.data.simulations = [];
    }
    this.data.simulations.unshift(simulation);
    this.persist();
  }

  clearSimulations() {
    this.data.simulations = [];
    this.persist();
  }
}

// Singleton database instance
export const db = new Database();
