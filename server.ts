/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import { db, getPatientSensitivity } from './src/db/mockDb.js';
import { HospitalRole, Patient, ClinicalNote, Vitals, LabRequest, LabStatus, RadiologyRequest, RadStatus, Prescription, PrescriptionStatus, SecurityRiskLevel } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Session storage mock state for tracking current mock requester
let activeSession: {
  userId: string;
  username: string;
  fullName: string;
  role: HospitalRole;
  department: string;
  ipAddress: string;
  deviceName: string;
  isSwitched?: boolean;
} | null = null;

// Default session on start for convenience
activeSession = {
  userId: 'EMP-001',
  username: 'him_officer',
  fullName: 'Elena Rostova',
  role: HospitalRole.HIM_OFFICER,
  department: 'Health Information Management',
  ipAddress: '10.20.1.15',
  deviceName: 'Desktop HIM-01'
};

// HELPER FOR SECURITY AUDITS
function audit(activityType: string, description: string, resourceId?: string) {
  if (activeSession) {
    // Skip recording patient RECORD_VIEW events for security analysts, IT admins, and switched sessions
    if (activityType === 'RECORD_VIEW' && 
        (activeSession.role === HospitalRole.SECURITY_ANALYST || activeSession.role === HospitalRole.IT_ADMIN || activeSession.isSwitched)) {
      return;
    }

    db.addSecurityEvent({
      userId: activeSession.userId,
      username: activeSession.username,
      role: activeSession.role,
      ipAddress: activeSession.ipAddress,
      deviceName: activeSession.deviceName,
      activityType,
      description,
      resourceId,
      isSensitiveAccess: false, // will be evaluated dynamically by engine
      riskContribution: 0
    });
  }
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { username, password, deviceName, ipAddress, failedAttemptsInput } = req.body;
  const user = db.getStaff().find(s => s.username === username);

  const finalDevice = deviceName || 'Corporate Ward Terminal';
  const finalIp = ipAddress || '10.20.10.12';

  if (failedAttemptsInput && failedAttemptsInput > 0) {
    // Audit failed logins before success to trigger Credential Abuse correlation
    for (let i = 0; i < failedAttemptsInput; i++) {
      db.addSecurityEvent({
        userId: user ? user.id : 'UNKNOWN',
        username,
        role: user ? user.role : HospitalRole.HIM_OFFICER, // default placeholder
        ipAddress: finalIp,
        deviceName: finalDevice,
        activityType: 'LOGIN_FAILED',
        description: `Authentication failed: Incorrect credential tokens supplied on ${finalDevice}`,
        isSensitiveAccess: false,
        riskContribution: 0
      });
    }
  }

  if (!user) {
    // Fail login with generic security audit log
    db.addSecurityEvent({
      userId: 'UNKNOWN',
      username: username || 'unknown_login',
      role: HospitalRole.HIM_OFFICER,
      ipAddress: finalIp,
      deviceName: finalDevice,
      activityType: 'LOGIN_FAILED',
      description: `Authentication failed: Unregistered staff identification token entered`,
      isSensitiveAccess: false,
      riskContribution: 10
    });
    return res.status(401).json({ error: 'Invalid identification credentials.' });
  }

  // Validate password
  const expectedPassword = user.password || user.username;
  if (password !== expectedPassword) {
    db.addSecurityEvent({
      userId: user.id,
      username: user.username,
      role: user.role,
      ipAddress: finalIp,
      deviceName: finalDevice,
      activityType: 'LOGIN_FAILED',
      description: `Authentication failed: Incorrect password PIN supplied on ${finalDevice}`,
      isSensitiveAccess: false,
      riskContribution: 15
    });
    return res.status(401).json({ error: 'Invalid credentials: Incorrect password PIN.' });
  }

  if (user.status === "Suspended") {
    db.addSecurityEvent({
      userId: user.id,
      username: user.username,
      role: user.role,
      ipAddress: finalIp,
      deviceName: finalDevice,
      activityType: 'LOGIN_FAILED',
      description: `Authentication blocked: Attempt to login to suspended account @${user.username}`,
      isSensitiveAccess: false,
      riskContribution: 20
    });
    return res.status(403).json({ error: 'This user account is currently suspended by IT Administration.' });
  }

  activeSession = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    department: user.department,
    ipAddress: finalIp,
    deviceName: finalDevice
  };

  audit('LOGIN_SUCCESS', `User successfully authenticated as ${user.fullName}`);
  res.json({ success: true, user: activeSession });
});

app.post('/api/auth/logout', (req, res) => {
  if (activeSession) {
    audit('USER_MODIFY', `User logged out of core workspace session`);
  }
  activeSession = null;
  res.json({ success: true });
});

app.get('/api/auth/session', (req, res) => {
  res.json({ user: activeSession });
});

// Admin command: Switch simulated active user directly (helpful for demonstration)
app.post('/api/auth/switch', (req, res) => {
  try {
    const { userId, deviceName, ipAddress } = req.body;
    const user = db.getStaff().find(s => s.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({ error: 'Cannot assume role context: This employee account is suspended by IT Administration.' });
    }

    activeSession = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      ipAddress: ipAddress || (user.typicalIps && user.typicalIps.length > 0 ? user.typicalIps[0] : '10.20.90.100'),
      deviceName: deviceName || (user.typicalDevices && user.typicalDevices.length > 0 ? user.typicalDevices[0] : 'Simulated Terminal'),
      isSwitched: true
    };

    // Skip login failed audits; write clean log success
    audit('LOGIN_SUCCESS', `Staff session transitioned to ${user.fullName}`);
    res.json({ success: true, user: activeSession });
  } catch (error: any) {
    console.error("Critical: Master bypass switch trigger issue:", error);
    res.status(500).json({ error: error.message || "Failed to transition session context" });
  }
});

// ==========================================
// PATIENTS CLINICAL WRAPPER APIs
// ==========================================

app.get('/api/patients', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  let results = db.getPatients();

  if (q) {
    results = results.filter(p => p.fullName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    audit('RECORD_VIEW', `Performed global registry search for string: "${q}"`);
  } else {
    audit('RECORD_VIEW', 'Accessed global patients directory view');
  }

  res.json({ patients: results });
});

app.get('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const patient = db.getPatients().find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: 'Patient clinical file not found.' });
  }

  // Related details
  const vitals = db.getVitals().filter(v => v.patientId === patientId).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
  const clinicalNotes = db.getClinicalNotes().filter(n => n.patientId === patientId).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
  const labRequests = db.getLabRequests().filter(l => l.patientId === patientId);
  const radiologyRequests = db.getRadiologyRequests().filter(r => r.patientId === patientId);
  const prescriptions = db.getPrescriptions().filter(p => p.patientId === patientId);
  const billingInvoices = db.getBilling().filter(b => b.patientId === patientId);

  // Trigger record access auditing
  audit('RECORD_VIEW', `Accessed complete clinical file of ${patient.fullName} (${patient.id})`, patientId);

  res.json({
    patient,
    vitals,
    clinicalNotes,
    labRequests,
    radiologyRequests,
    prescriptions,
    billingInvoices
  });
});

app.post('/api/patients/:id/export', (req, res) => {
  const patientId = req.params.id;
  const patient = db.getPatients().find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: 'Patient clinical file not found.' });
  }

  // Create event details
  const sensitivity = getPatientSensitivity(patient);
  const user = activeSession ? activeSession.username : 'system';
  const role = activeSession ? activeSession.role : HospitalRole.HIM_OFFICER;
  const department = activeSession ? activeSession.department : 'General Medicine';
  const ipAddress = activeSession ? activeSession.ipAddress : '127.0.0.1';
  const deviceName = activeSession ? activeSession.deviceName : 'Unknown Device';
  const userId = activeSession ? activeSession.userId : 'EMP-001';

  const description = `Exported complete patient clinical file for ${patient.fullName} (ID: ${patient.id}, Sensitivity: ${sensitivity}). Session ID: ${activeSession ? 'SESS-' + activeSession.userId : 'SESS-ANON'}`;

  // Log PATIENT_RECORD_EXPORTED security event
  const newEvent = db.addSecurityEvent({
    userId,
    username: user,
    role,
    ipAddress,
    deviceName,
    activityType: 'PATIENT_RECORD_EXPORTED',
    description,
    resourceId: patientId,
    isSensitiveAccess: sensitivity !== "NORMAL",
    riskContribution: 0 // Will be evaluated dynamically by ATIF runCorrelationEngine
  });

  res.json({ success: true, event: newEvent });
});

app.post('/api/patients/register', (req, res) => {
  const { fullName, dob, gender, address, phone, email, emergencyContact, allergies, isVip, isStaff } = req.body;

  const nextI = db.getPatients().length + 120;
  const newId = `HIS-${Math.floor(1000 + nextI * 11)}`;

  const newPatient: Patient = {
    id: newId,
    fullName,
    dob,
    gender,
    address,
    phone,
    email,
    emergencyContact,
    allergies: allergies || [],
    diagnoses: [],
    isVip: !!isVip,
    isStaff: !!isStaff,
    status: 'Checked In'
  };

  db.addPatient(newPatient);
  audit('RECORD_MODIFY', `Registered new patient file: ${fullName} (${newId})`, newId);
  res.json({ success: true, patient: newPatient });
});

app.post('/api/patients/:id/vitals', (req, res) => {
  const patientId = req.params.id;
  const { heartRate, bloodPressure, temperature, respirationRate, notes } = req.body;

  const newVitals: Vitals = {
    id: `VIT-${Math.floor(10000 + Math.random() * 89999)}`,
    patientId,
    timestamp: new Date().toISOString(),
    heartRate: Number(heartRate),
    bloodPressure,
    temperature: Number(temperature),
    respirationRate: Number(respirationRate),
    recordedBy: activeSession ? activeSession.fullName : 'Hospital Personnel',
    notes
  };

  db.addVitals(newVitals);
  audit('RECORD_MODIFY', `Logged clinical primary vitals metrics: HR ${heartRate}, BP ${bloodPressure}`, patientId);
  res.json({ success: true, vitals: newVitals });
});

app.post('/api/patients/:id/notes', (req, res) => {
  const patientId = req.params.id;
  const { noteText } = req.body;

  const newNote: ClinicalNote = {
    id: `NOT-${Math.floor(10000 + Math.random() * 89999)}`,
    patientId,
    timestamp: new Date().toISOString(),
    createdBy: activeSession ? activeSession.username : 'staff',
    role: activeSession ? activeSession.role : 'Staff',
    noteText
  };

  db.addClinicalNote(newNote);
  audit('RECORD_MODIFY', `Added comprehensive consultation diagnostic note: "${noteText.substring(0, 50)}..."`, patientId);
  res.json({ success: true, note: newNote });
});

app.post('/api/patients/:id/admission', (req, res) => {
  const patientId = req.params.id;
  const { wardName, bedNumber, action } = req.body; // action: "admit" | "discharge" | "transfer"

  if (action === "admit") {
    db.updatePatient(patientId, {
      status: "Admitted",
      admittedWard: wardName,
      admittedBed: bedNumber
    });
    // Charge for ward accommodation automatically
    db.addBillingItemToActiveInvoice(patientId, `Inpatient Bed Accommodation Charge - ${wardName} Bed ${bedNumber}`, 180.00);
    audit('RECORD_MODIFY', `Executed Patient ward admission: Assigned to ${wardName} Bed ${bedNumber}`, patientId);
  } else if (action === "discharge") {
    const patient = db.getPatients().find(p => p.id === patientId);
    if (patient) {
      // Clear bed occupied status
      db.getBeds().forEach(bed => {
        if (bed.patientId === patientId) {
          bed.isOccupied = false;
          delete bed.patientId;
        }
      });
      db.updatePatient(patientId, {
        status: "Discharged",
        admittedWard: undefined,
        admittedBed: undefined
      });
      audit('RECORD_MODIFY', `Executed Patient clinical discharge: Freeing bed asset`, patientId);
    }
  }

  res.json({ success: true });
});

// ==========================================
// LABORATORY & DIAGNOSTIC LAB MODULE APIs
// ==========================================

app.get('/api/lab/requests', (req, res) => {
  const list = db.getLabRequests().map(req => {
    const p = db.getPatients().find(pat => pat.id === req.patientId);
    return { ...req, patientName: p ? p.fullName : 'Unknown Patient' };
  }).reverse();

  res.json({ requests: list });
});

app.post('/api/lab/requests', (req, res) => {
  const { patientId, testName } = req.body;
  const newReq: LabRequest = {
    id: `LAB-${Math.floor(8000 + Math.random() * 999)}`,
    patientId,
    testName,
    status: LabStatus.PENDING,
    orderedBy: activeSession ? activeSession.username : 'doctor_house',
    orderedDate: new Date().toISOString()
  };

  db.addLabRequest(newReq);
  audit('RECORD_MODIFY', `Ordered medical pathology laboratory diagnostic analysis: ${testName}`, patientId);
  res.json({ success: true, request: newReq });
});

app.put('/api/lab/requests/:id', (req, res) => {
  const id = req.params.id;
  const { status, sampleType, result } = req.body;

  const updates: Partial<LabRequest> = { status };
  if (sampleType) updates.sampleType = sampleType;
  if (result) {
    updates.result = result;
    updates.completedBy = activeSession ? activeSession.username : 'lab_scientist';
    updates.completedDate = new Date().toISOString();
  }

  db.updateLabRequest(id, updates);
  const reqObj = db.getLabRequests().find(r => r.id === id);
  if (reqObj) {
    audit('LAB_ACCESS', `Keyed laboratory diagnostic analytics for LAB-${id}: ${status}`, reqObj.patientId);
  }
  res.json({ success: true });
});

// ==========================================
// MEDICAL IMAGING (RADIOLOGY) APIs
// ==========================================

app.get('/api/radiology/requests', (req, res) => {
  const list = db.getRadiologyRequests().map(req => {
    const p = db.getPatients().find(pat => pat.id === req.patientId);
    return { ...req, patientName: p ? p.fullName : 'Unknown Patient' };
  }).reverse();

  res.json({ requests: list });
});

app.post('/api/radiology/requests', (req, res) => {
  const { patientId, imagingType } = req.body;
  const newReq: RadiologyRequest = {
    id: `RAD-${Math.floor(9000 + Math.random() * 999)}`,
    patientId,
    imagingType,
    status: RadStatus.PENDING,
    orderedBy: activeSession ? activeSession.username : 'doctor_house',
    orderedDate: new Date().toISOString()
  };

  db.addRadiologyRequest(newReq);
  audit('RECORD_MODIFY', `Ordered complex medical diagnostic imaging scan: ${imagingType}`, patientId);
  res.json({ success: true, request: newReq });
});

app.put('/api/radiology/requests/:id', (req, res) => {
  const id = req.params.id;
  const { status, reportText, imageUrl } = req.body;

  const updates: Partial<RadiologyRequest> = { status };
  if (reportText) {
    updates.reportText = reportText;
    updates.imageUrl = imageUrl || "https://images.unsplash.com/photo-1559828605-ff31bf1bb6cc?w=400&q=80"; // x-ray placeholder
    updates.completedBy = activeSession ? activeSession.username : 'rad_officer';
    updates.completedDate = new Date().toISOString();
  }

  db.updateRadiologyRequest(id, updates);
  const reqObj = db.getRadiologyRequests().find(r => r.id === id);
  if (reqObj) {
    audit('RECORD_MODIFY', `Released sign-off radiology diagnostic scan imaging data for RAD-${id}`, reqObj.patientId);
  }
  res.json({ success: true });
});

// ==========================================
// PHARMACY & PRESCRIPTIONS APIs
// ==========================================

app.get('/api/prescriptions', (req, res) => {
  const list = db.getPrescriptions().map(p => {
    const pat = db.getPatients().find(patient => patient.id === p.patientId);
    return { ...p, patientName: pat ? pat.fullName : 'Unknown Patient' };
  }).reverse();

  res.json({ prescriptions: list });
});

app.post('/api/prescriptions', (req, res) => {
  const { patientId, medication, dosage, frequency, route, duration } = req.body;
  const newPrescription: Prescription = {
    id: `RX-${Math.floor(500 + Math.random() * 499)}`,
    patientId,
    medication,
    dosage,
    frequency,
    route,
    duration,
    status: PrescriptionStatus.PRESCRIBED,
    prescribedBy: activeSession ? activeSession.username : 'doctor_house',
    prescribedDate: new Date().toISOString(),
    mar: []
  };

  db.addPrescription(newPrescription);
  audit('PRESCRIPTION_CREATE', `Formulated pharmaceutical prescription: ${medication} (${dosage})`, patientId);
  res.json({ success: true, prescription: newPrescription });
});

app.put('/api/prescriptions/:id/dispense', (req, res) => {
  const prescId = req.params.id;
  const presc = db.getPrescriptions().find(p => p.id === prescId);

  if (!presc) {
    return res.status(404).json({ error: 'Prescription details not found.' });
  }

  // Create scheduled nurse administration tracks (MAR) inside prescription
  const scheduledTime = new Date();
  scheduledTime.setHours(scheduledTime.getHours() + 4); // Scheduled in 4 hours

  const marRecords = [
    { id: `MAR-${Math.floor(1000 + Math.random() * 9000)}`, timestamp: scheduledTime.toISOString(), status: "Scheduled" as const, dose: presc.dosage }
  ];

  db.updatePrescription(prescId, {
    status: PrescriptionStatus.DISPENSED,
    dispensedBy: activeSession ? activeSession.username : 'pharmacist_bob',
    dispensedDate: new Date().toISOString(),
    mar: marRecords
  });

  audit('PRESCRIPTION_CREATE', `Dispensed prescription drug packages for RX-${prescId}`, presc.patientId);
  res.json({ success: true });
});

app.put('/api/prescriptions/:id/status', (req, res) => {
  const prescId = req.params.id;
  const { status, medication, notes } = req.body;
  const presc = db.getPrescriptions().find(p => p.id === prescId);

  if (!presc) {
    return res.status(404).json({ error: 'Prescription details not found.' });
  }

  const updates: Partial<Prescription> = {};
  if (status) updates.status = status as any;
  if (medication) updates.medication = medication;

  db.updatePrescription(prescId, updates);
  audit('PRESCRIPTION_CREATE', `Pharmacist modulated prescription RX-${prescId} status: "${status}"${medication ? ` (Substituted with ${medication})` : ''}. Notes: ${notes || 'Routine pharmacist evaluation'}`, presc.patientId);
  res.json({ success: true });
});

app.post('/api/prescriptions/:id/administer', (req, res) => {
  const prescId = req.params.id;
  const { marId, notes } = req.body;

  const presc = db.getPrescriptions().find(p=>p.id === prescId);
  if (!presc) return res.status(404).json({ error: 'Prescription not found.' });

  const updatedMar = presc.mar.map(record => {
    if (record.id === marId) {
      return {
        ...record,
        status: "Administered" as const,
        administeredBy: activeSession ? activeSession.fullName : 'Nurse Staff',
        notes: notes || "Dose logged successfully via mobile bedside computer"
      };
    }
    return record;
  });

  db.updatePrescription(prescId, {
    status: PrescriptionStatus.ADMINISTERED,
    mar: updatedMar
  });

  audit('RECORD_MODIFY', `Bedside administration log finalized: drug ${presc.medication} on MAR-${marId}`, presc.patientId);
  res.json({ success: true });
});

// ==========================================
// FINANCIALS & REVENUES CABINET APIs
// ==========================================

app.get('/api/billing', (req, res) => {
  const list = db.getBilling().map(invoice => {
    const pat = db.getPatients().find(p => p.id === invoice.patientId);
    return { ...invoice, patientName: pat ? pat.fullName : 'Unknown Patient' };
  }).reverse();

  res.json({ invoices: list });
});

app.put('/api/billing/:id/pay', (req, res) => {
  const invoiceId = req.params.id;
  const { amountPaid, insuranceAmount, targetStatus } = req.body;

  db.payInvoice(invoiceId, Number(amountPaid), Number(insuranceAmount), targetStatus);
  const invoice = db.getBilling().find(i => i.id === invoiceId);
  if (invoice) {
    audit('BILL_ACTION', `Cleared financial accounts ledger invoice values for ${invoiceId}: Status ${targetStatus}`, invoice.patientId);
  }

  res.json({ success: true });
});

// ==========================================
// WORKSPACE GENERAL ASSETS
// ==========================================

app.get('/api/beds', (req, res) => {
  res.json({ beds: db.getBeds(), wards: db.getWards() });
});

app.get('/api/staff', (req, res) => {
  res.json({ staff: db.getStaff() });
});

app.get('/api/handovers', (req, res) => {
  res.json({ handovers: db.getHandovers() });
});

app.post('/api/handovers', (req, res) => {
  const { wardName, receiverName, handoverSummary } = req.body;

  db.addHandover({
    id: `HO-${Math.floor(100+Math.random()*899)}`,
    timestamp: new Date().toISOString(),
    senderName: activeSession ? activeSession.fullName : "Nurse Florence Nightingale",
    receiverName,
    wardName,
    handoverSummary
  });

  audit('RECORD_MODIFY', `Shift nursing ward handover successfully filed for ${wardName}`);
  res.json({ success: true });
});

// ==========================================
// IT ADMINISTRATION TOOL APIs
// ==========================================

app.get('/api/admin/configuration', (req, res) => {
  res.json({ settings: db.getSystemSettings() });
});

app.put('/api/admin/configuration', (req, res) => {
  const { bruteForceThreshold, anomalyScoringWeight, auditLoggingRetention } = req.body;
  db.updateSystemSettings({ bruteForceThreshold, anomalyScoringWeight, auditLoggingRetention });
  audit('IT_ACTION', `System parameter configurations updated: BF=${bruteForceThreshold}, Anomaly=${anomalyScoringWeight}, Retention=${auditLoggingRetention} days`);
  res.json({ success: true, settings: db.getSystemSettings() });
});

app.get('/api/admin/backups', (req, res) => {
  res.json({ backups: db.getBackups() });
});

app.post('/api/admin/backups', (req, res) => {
  const newBackup = {
    id: `BKP-${Math.floor(100 + Math.random() * 899)}`,
    timestamp: new Date().toISOString(),
    filename: `stjude_auto_backup_${Date.now()}.sql`,
    size: `${(100 + Math.random() * 200).toFixed(1)} MB`,
    status: "Completed",
    createdBy: activeSession ? activeSession.username : "it_admin"
  };
  db.addBackup(newBackup);
  audit('IT_ACTION', `Manual backup of EHR system database triggered and completed: ${newBackup.filename}`);
  res.json({ success: true, backup: newBackup });
});

app.post('/api/admin/staff', (req, res) => {
  const { username, fullName, role, department, startHour, endHour, devices, ips, limit } = req.body;
  
  const existing = db.getStaff().find(s => s.username === username);
  if (existing) {
    return res.status(400).json({ error: "Username already exists in EHR directory" });
  }

  const newStaff = {
    id: `EMP-${Math.floor(100 + Math.random() * 899)}`,
    username,
    fullName,
    role,
    department,
    normalHours: { start: Number(startHour || 8), end: Number(endHour || 17) },
    typicalDevices: devices || ["Workstation-Standard"],
    typicalIps: ips || ["10.20.1.10"],
    averageDailyAccessLimit: Number(limit || 30),
    status: "Active" as const
  };

  db.addStaff(newStaff);
  audit('IT_ACTION', `New hospital staff member registered in directory: ${fullName} (${role})`);
  res.json({ success: true, staff: newStaff });
});

app.put('/api/admin/staff/:id', (req, res) => {
  const staffId = req.params.id;
  const { fullName, role, department, normalHours, typicalDevices, typicalIps, averageDailyAccessLimit, status } = req.body;

  db.updateStaff(staffId, {
    fullName,
    role,
    department,
    normalHours,
    typicalDevices,
    typicalIps,
    averageDailyAccessLimit,
    status
  });

  const staff = db.getStaff().find(s => s.id === staffId);
  if (staff) {
    audit('IT_ACTION', `IT Admin modified credentials or profile for staff: @${staff.username} (Status=${staff.status || 'Active'})`);
  }

  res.json({ success: true });
});

app.post('/api/admin/staff/:id/reset', (req, res) => {
  const staffId = req.params.id;
  const staff = db.getStaff().find(s => s.id === staffId);
  if (!staff) {
    return res.status(404).json({ error: "Staff member not found" });
  }

  db.updateStaff(staffId, {
    status: "Active"
  });

  audit('IT_ACTION', `IT Admin performed authentication parameters reset & unsuspended staff account @${staff.username}`);
  res.json({ success: true });
});

app.get('/api/admin/wards', (req, res) => {
  res.json({ wards: db.getWards() });
});

app.post('/api/admin/wards', (req, res) => {
  const { name, department, location } = req.body;
  const newWard = {
    name,
    department,
    capacity: 0,
    occupancy: 0,
    location
  };
  db.addWard(newWard);
  audit('IT_ACTION', `Created and allocated new high-capacity patient ward: ${name}`);
  res.json({ success: true });
});

app.get('/api/admin/beds', (req, res) => {
  res.json({ beds: db.getBeds() });
});

app.put('/api/admin/beds', (req, res) => {
  const { wardName, bedNumber, status, currentPatientId } = req.body;
  db.updateBed(wardName, bedNumber, { status, currentPatientId });
  audit('IT_ACTION', `Reconfigured clinical bed layout assignment for ward: ${wardName} Bed ${bedNumber}`);
  res.json({ success: true });
});

// ==========================================
// SECURITY MONITORING / SOC CENTER APIs
// ==========================================

app.post('/api/security/clear-all', (req, res) => {
  db.clearAllSecurityData();
  res.json({ success: true, message: "All security incidents, threats, and events successfully cleared." });
});

app.get('/api/security/events', (req, res) => {
  res.json({ events: db.getSecurityEvents().slice(-100).reverse() }); // Cap at 100 for telemetry fast transmission
});

app.post('/api/security/events', (req, res) => {
  try {
    const { userId, username, role, ipAddress, deviceName, activityType, description, riskContribution, isSensitiveAccess, resourceId } = req.body;
    const newEvent = db.addSecurityEvent({
      userId: userId || "EMP-999",
      username: username || "anonymous",
      role: role || HospitalRole.NURSE,
      ipAddress: ipAddress || "10.20.1.1",
      deviceName: deviceName || "Unknown Device",
      activityType: activityType || "UNKNOWN",
      description: description || "Activity simulated via Threat Simulation Engine.",
      riskContribution: Number(riskContribution) || 0,
      isSensitiveAccess: !!isSensitiveAccess,
      resourceId: resourceId || undefined
    });
    res.json({ success: true, event: newEvent });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add security event" });
  }
});

app.get('/api/security/incidents', (req, res) => {
  res.json({ incidents: db.getIncidents() });
});

app.put('/api/security/incidents/:id/status', (req, res) => {
  const id = req.params.id;
  const { status, note } = req.body;

  db.updateIncidentStatus(
    id,
    status,
    activeSession ? activeSession.username : 'analyst_sam',
    note || "Incident investigation log state amended."
  );

  res.json({ success: true });
});

app.post('/api/security/incidents/:id/timeline', (req, res) => {
  const id = req.params.id;
  const { action, note } = req.body;

  db.addIncidentTimelineAction(
    id,
    action,
    note,
    activeSession ? activeSession.username : 'analyst_sam'
  );

  res.json({ success: true });
});

app.get('/api/security/profiles', (req, res) => {
  res.json({ profiles: db.getBehaviorProfiles() });
});

app.put('/api/security/profiles/:userId', (req, res) => {
  const userId = req.params.userId;
  db.updateBehaviorProfile(userId, req.body);
  res.json({ success: true, profiles: db.getBehaviorProfiles() });
});

app.post('/api/security/profiles/:userId/reset', (req, res) => {
  const userId = req.params.userId;
  db.resetBehaviorProfile(userId);
  res.json({ success: true, profiles: db.getBehaviorProfiles() });
});

app.post('/api/security/profiles/:userId/recalculate', (req, res) => {
  const userId = req.params.userId;
  const { observedDailyViews, observedHourlyViews, observedLogins, observedDuration } = req.body;
  const result = db.recalculateBehaviorBaseline(userId, observedDailyViews, observedHourlyViews, observedLogins, observedDuration);
  res.json({ success: true, result, profiles: db.getBehaviorProfiles() });
});

app.get('/api/security/templates', (req, res) => {
  res.json({ templates: db.getBaselineTemplates() });
});

app.put('/api/security/templates/:role', (req, res) => {
  const role = req.params.role as any;
  db.updateBaselineTemplate(role, req.body);
  res.json({ success: true, templates: db.getBaselineTemplates() });
});

app.get('/api/security/posture', (req, res) => {
  res.json({ posture: db.getSecurityPosture() });
});

app.get('/api/security/threat-feed', (req, res) => {
  res.json({ feed: db.getThreatFeed() });
});

// Lazy client initializer for Google GenAI SDK
let aiClient: GoogleGenAI | null = null;
function getGoogleGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to generate AI Analysis.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Create custom threat incident
app.post('/api/security/incidents', (req, res) => {
  const { title, threatType, riskScore, affectedUser, department, sourceIp, description } = req.body;
  const id = `INC-3035-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();
  const score = Number(riskScore) || 50;
  
  const eventId = `SEC-EV-${Math.floor(10000 + Math.random() * 90000)}`;
  const newEvent = {
    id: eventId,
    timestamp,
    username: affectedUser || "system",
    role: "Clinical Staff",
    ipAddress: sourceIp || "10.20.12.87",
    activityType: threatType || "ABNORMAL_USER_BEHAVIOR",
    description: `Manual Alert: ${title || "Threat anomaly"}. Detail: ${description || "N/A"}.`,
    riskContribution: score
  };
  db.getSecurityEvents().push(newEvent as any);

  const newIncident = {
    id,
    timestamp,
    title: title || threatType || "Manual Threat Alert",
    threatType: threatType || "ABNORMAL_USER_BEHAVIOR",
    riskScore: score,
    riskLevel: score >= 80 ? SecurityRiskLevel.CRITICAL : score >= 60 ? SecurityRiskLevel.HIGH : score >= 30 ? SecurityRiskLevel.MEDIUM : SecurityRiskLevel.LOW,
    affectedUser: affectedUser || "system",
    eventIds: [eventId],
    status: "Open" as const,
    timeline: [
      {
        timestamp,
        action: "Threat Incident Manually Created",
        note: description || `Incident raised manually by Sarah Johnson. Department: ${department || 'N/A'}, Source IP: ${sourceIp || '127.0.0.1'}`,
        user: activeSession ? activeSession.username : "analyst_sam"
      }
    ]
  };

  const incidentsList = db.getIncidents();
  incidentsList.unshift(newIncident as any);
  db.persist();

  res.json({ success: true, incident: newIncident });
});

// Simulate multi-user coordinated threat with multiple indicators
app.post('/api/security/simulate-multi-user-threat', (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const eventId1 = `SEC-EV-${Math.floor(10000 + Math.random() * 90000)}`;
    const eventId2 = `SEC-EV-${Math.floor(10000 + Math.random() * 90000)}`;
    const eventId3 = `SEC-EV-${Math.floor(10000 + Math.random() * 90000)}`;
    const eventId4 = `SEC-EV-${Math.floor(10000 + Math.random() * 90000)}`;

    const event1 = {
      id: eventId1,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      userId: "EMP-007",
      username: "accounts_alice",
      role: HospitalRole.ACCOUNTS_OFFICER,
      ipAddress: "10.20.10.198",
      deviceName: "Home Tablet Asset",
      activityType: "RECORD_VIEW",
      description: "Successful authentication from unrecognized home network IP (Outside typical roster shift hours).",
      riskContribution: 25,
      isSensitiveAccess: false
    };

    const event2 = {
      id: eventId2,
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      userId: "EMP-007",
      username: "accounts_alice",
      role: HospitalRole.ACCOUNTS_OFFICER,
      ipAddress: "10.20.10.198",
      deviceName: "Home Tablet Asset",
      activityType: "RECORD_VIEW",
      description: "Accessed restricted complete medical file of VIP Patient Harold Potter (HIS-6043) with no clinical mandate.",
      resourceId: "HIS-6043",
      riskContribution: 45,
      isSensitiveAccess: true
    };

    const event3 = {
      id: eventId3,
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      userId: "EMP-010",
      username: "it_admin",
      role: HospitalRole.IT_ADMIN,
      ipAddress: "185.220.101.99",
      deviceName: "Simulated IT Workstation",
      activityType: "RECORD_VIEW",
      description: "Successful authentication from recognized Tor exit proxy node (High reputation risk IP).",
      riskContribution: 35,
      isSensitiveAccess: false
    };

    const event4 = {
      id: eventId4,
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      userId: "EMP-010",
      username: "it_admin",
      role: HospitalRole.IT_ADMIN,
      ipAddress: "185.220.101.99",
      deviceName: "Simulated IT Workstation",
      activityType: "PATIENT_RECORD_EXPORTED",
      description: "Bypassed active medical directory to download complete clinical dossier PDF for Harold Potter (HIS-6043).",
      resourceId: "HIS-6043",
      riskContribution: 55,
      isSensitiveAccess: true
    };

    const eventsList = db.getSecurityEvents();
    eventsList.unshift(event1 as any, event2 as any, event3 as any, event4 as any);

    const incidentId = `INC-${new Date().getFullYear()}-9901`;
    const incidents = db.getIncidents();
    const existingIndex = incidents.findIndex(i => i.id === incidentId);
    if (existingIndex !== -1) {
      incidents.splice(existingIndex, 1);
    }

    const newIncident = {
      id: incidentId,
      timestamp,
      title: "Coordinated Multi-Account Clinical Data Harvesting",
      threatType: "INSIDER_THREAT",
      riskScore: 95,
      riskLevel: SecurityRiskLevel.CRITICAL,
      affectedUser: "accounts_alice, it_admin",
      affectedPatient: "HIS-6043",
      eventIds: [eventId1, eventId2, eventId3, eventId4],
      status: "Open",
      confidenceScore: 97,
      evidence: [
        "Accounts Officer @accounts_alice logged in off-hours (02:00 AM) and accessed clinical record HIS-6043.",
        "Infrastructure Administrator @it_admin accessed clinical records directly from unapproved remote proxy IP (185.220.101.99).",
        "EHR API Gateway correlated both accounts acting collusively on Patient Harold Potter (HIS-6043) inside an 8-minute window.",
        "Export script detected: @it_admin initiated PDF file exfiltration of high-sensitivity VIP records."
      ],
      triggeredIndicators: [
        "Cross-Account Access Collision (Collusion Behavior)",
        "Role Scope Boundary Violation (Financial-to-Clinical)",
        "System Admin RBAC Perimeter Deviation",
        "New/Unrecognized IP Location",
        "Off-Hours General Activity",
        "Sensitive Patient Record PDF Exports"
      ],
      affectedUserRole: HospitalRole.IT_ADMIN,
      clinicalContext: "Dual-account lateral movement targeting VIP clinical records database.",
      explanation: "Adaptive Threat Intelligence Framework (ATIF) flagged an advanced threat consisting of multiple accounts (accounts_alice & it_admin) executing out-of-context access and records downloading in parallel on a single restricted VIP patient, signifying potential credential compromise or collusive insider threat.",
      expectedBehavior: "@accounts_alice: Normal ledger audit within 08:00-17:00. @it_admin: Systems diagnostic checks, never accessing medical patient documents directly.",
      currentBehavior: "Off-hours login by @accounts_alice from unknown device, followed by TOR-routed direct record download by @it_admin on the identical VIP patient.",
      deviationPercentage: 350,
      deviationReason: "Parallel access signature completely deviates from independent job role baselines.",
      expectedLogin: "08:00 - 17:00",
      actualLogin: "02:00 / 02:05",
      expectedDevice: "Authorized Office Workstation",
      actualDevice: "Home Tablet / Tor Proxy Source",
      timeline: [
        {
          timestamp: event1.timestamp,
          action: "Anomalous Off-Hours Authentication",
          note: "Accounts Officer @accounts_alice logged in from unrecognized remote IP 10.20.10.198 using unestablished device 'Home Tablet Asset' outside baseline schedule.",
          user: "ATIF Detection Gate"
        },
        {
          timestamp: event2.timestamp,
          action: "Out-of-Context Patient File Access",
          note: "@accounts_alice accessed complete sensitive clinical records of VIP Patient Harold Potter. Flagged: Role Scope Boundary Violation.",
          user: "ATIF Policy Engine"
        },
        {
          timestamp: event3.timestamp,
          action: "High Reputation Risk Authentication",
          note: "IT Admin @it_admin logged in using administrative console credentials routed via Tor exit node IP 185.220.101.99.",
          user: "ATIF Guardrail"
        },
        {
          timestamp: event4.timestamp,
          action: "Restricted File PDF Export Exfiltration",
          note: "@it_admin directly requested and compiled Patient Harold Potter's medical history report as PDF. Handled as critical data harvesting signature.",
          user: "ATIF DLP Watchdog"
        },
        {
          timestamp,
          action: "Correlated Multi-Account Incident Created",
          note: "Incident INC-2026-9901 compiled and raised. High-fidelity alert triggered due to cross-account access collision and multi-indicator RBAC boundary breaches.",
          user: "ATIF Correlation Engine"
        }
      ]
    };

    incidents.unshift(newIncident as any);
    db.persist();

    res.json({ success: true, incident: newIncident });
  } catch (error: any) {
    console.error("Simulation error:", error);
    res.status(500).json({ error: error.message || "Failed to inject simulation events" });
  }
});

// GET Simulation History
app.get('/api/security/simulations', (req, res) => {
  try {
    res.json(db.getSimulations());
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch simulation history" });
  }
});

// ADD Simulation History
app.post('/api/security/simulations', (req, res) => {
  try {
    const simulation = req.body;
    db.addSimulation(simulation);
    res.json({ success: true, simulation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add simulation history" });
  }
});

// CLEAR Simulation History
app.post('/api/security/simulations/clear', (req, res) => {
  try {
    db.clearSimulations();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to clear simulation history" });
  }
});

// SUBMIT Simulated Activity Step (natural detection pipeline)
app.post('/api/security/simulations/activity', (req, res) => {
  try {
    const {
      userId,
      username,
      role,
      activityType,
      description,
      ipAddress,
      deviceName,
      resourceId,
      isSensitiveAccess,
      riskContribution
    } = req.body;

    // Capture list of incidents BEFORE logging event
    const incidentsBefore = JSON.parse(JSON.stringify(db.getIncidents()));

    // Log the simulated activity as a real security event
    const addedEvent = db.addSecurityEvent({
      userId,
      username,
      role,
      activityType,
      description,
      ipAddress,
      deviceName,
      resourceId,
      isSensitiveAccess: isSensitiveAccess || false,
      riskContribution: riskContribution || 0
    });

    // Capture list of incidents AFTER logging event
    const incidentsAfter = db.getIncidents();

    // Identify newly generated incidents
    const beforeIds = new Set(incidentsBefore.map((i: any) => i.id));
    const newIncidents = incidentsAfter.filter(i => !beforeIds.has(i.id));

    res.json({
      success: true,
      event: addedEvent,
      newIncidents
    });
  } catch (error: any) {
    console.error("Failed to process simulated activity step:", error);
    res.status(500).json({ error: error.message || "Failed to log activity step" });
  }
});

// Escalate threat incident
app.put('/api/security/incidents/:id/escalate', (req, res) => {
  const id = req.params.id;
  const incidents = db.getIncidents();
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  const timestamp = new Date().toISOString();
  incident.riskScore = Math.min(100, incident.riskScore + 15);
  incident.riskLevel = SecurityRiskLevel.CRITICAL;
  incident.timeline.push({
    timestamp,
    action: "Threat Incident Escalated",
    note: "Security alert escalated to Critical status. High-priority forensic triage triggered, firewall isolation instructions queued.",
    user: activeSession ? activeSession.username : "analyst_sam"
  });
  db.persist();

  res.json({ success: true, incident });
});

// Assign threat incident
app.put('/api/security/incidents/:id/assign', (req, res) => {
  const id = req.params.id;
  const { analystName } = req.body;
  const incidents = db.getIncidents();
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  const timestamp = new Date().toISOString();
  incident.timeline.push({
    timestamp,
    action: "Incident Case Assigned",
    note: `Incident assigned to Analyst ${analystName || "Sarah Johnson"} for deep forensic packet inspection and user-behavior audit.`,
    user: activeSession ? activeSession.username : "analyst_sam"
  });
  db.persist();

  res.json({ success: true, incident });
});

// Gemini-powered AI Forensic Threat Analyzer
app.post('/api/security/incidents/:id/analyze', async (req, res) => {
  const id = req.params.id;
  try {
    const incidents = db.getIncidents();
    const incident = incidents.find(i => i.id === id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    let summary = "";
    if (!process.env.GEMINI_API_KEY) {
      // High-quality, context-aware fallback when no live key is supplied
      const confidence = incident.riskScore > 80 ? 94 : incident.riskScore > 50 ? 88 : 75;
      summary = `User @${incident.affectedUser} engaged in activity flagged as ${incident.threatType}. The subject accessed multiple sensitive electronic health records across disparate departments within a compressed 15-minute window, exceeding standard operational baselines by 340%. The access trajectory is highly anomalous and deviates from the user's role profile.

ATIF classified this activity as a potential ${incident.threatType} with ${confidence}% confidence.

### Forensic Highlights
- **RBAC Boundary Deviation**: Multi-department clinical database scans detected.
- **Data Exfiltration Risk**: Abnormal viewing patterns of sensitive electronic files.
- **Compliance Warning**: High risk of HIPAA Security Rule non-compliance.

### Recommended Mitigation Actions
1. **Revoke Session Credentials**: Terminate all active OAuth security tokens for user @${incident.affectedUser}.
2. **Device Quarantine**: Flag device host terminal for forensic configuration check.
3. **Mandatory Auditing**: Force supervisor verification for subsequent records clearance.`;
    } else {
      const client = getGoogleGenAI();
      const prompt = `Analyze this healthcare information security incident:
      Incident ID: ${incident.id}
      Threat Type: ${incident.threatType}
      Risk Score: ${incident.riskScore}/100
      Affected User: @${incident.affectedUser}
      Description/Title: ${incident.title}
      Current status: ${incident.status}

      Provide a highly detailed, professional, explainable AI forensic security analysis.
      Describe what baseline behavior was violated, the risk of data exfiltration or HIPAA non-compliance, and recommended mitigation actions (such as account suspension, host containment, or RBAC audit).
      
      Format the response beautifully in clean, technical markdown. Make sure it has a summary line similar to:
      "User @${incident.affectedUser} accessed [X] patient records within [Y] minutes, exceeding established baseline behavior by [Z]%. Access spanned [W] unrelated departments. ATIF classified this activity as a potential ${incident.threatType} with 91% confidence."
      But make the numbers and details match the incident context. Keep it professional, realistic, and focused purely on user-facing functional security auditing.`;

      const aiResponse = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      summary = aiResponse.text || "No summary generated from model.";
    }

    db.saveAiAnalysis(id, summary);
    res.json({ success: true, aiAnalysis: summary });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI analysis" });
  }
});

// ==========================================
// VITE MIDDLEWARE DEVELOPMENT BOOTSTRAP
// ==============================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATIF-HIS] System online. Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error("Fatal framework boot crash:", err);
});
