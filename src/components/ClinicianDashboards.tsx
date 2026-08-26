/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, FileText, Activity, Heart, 
  Beaker, Image as ImageIcon, Pill, CreditCard, Bed,
  ClipboardList, AlertCircle, FileSpreadsheet, Plus, Check, Send
} from 'lucide-react';
import { HospitalRole, Patient, Vitals, LabRequest, LabStatus, RadiologyRequest, RadStatus, Prescription, PrescriptionStatus, BillingInvoice, WardBed, ShiftHandover, ClinicalNote } from '../types';

import DoctorDashboardView from './DoctorDashboardView';
import NurseDashboardView from './NurseDashboardView';
import PharmacistDashboardView from './PharmacistDashboardView';
import LaboratoryDashboardView from './LaboratoryDashboardView';
import HIMDashboardView from './HIMDashboardView';
import RadiologyDashboardView from './RadiologyDashboardView';
import PatientFileModal from './PatientFileModal';
import HospitalAdministratorDashboardView from './HospitalAdministratorDashboardView';
import AccountsOfficerDashboardView from './AccountsOfficerDashboardView';

interface ClinicianDashboardsProps {
  activeRole: HospitalRole;
  currentUser: any;
  patients: Patient[];
  onRefreshPatients: () => void;
}

export default function ClinicianDashboards({ activeRole, currentUser, patients, onRefreshPatients }: ClinicianDashboardsProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientData, setSelectedPatientData] = useState<any | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('1990-01-01');
  const [regGender, setRegGender] = useState<'Male'|'Female'|'Other'>('Male');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmergency, setRegEmergency] = useState('');
  const [regAllergies, setRegAllergies] = useState('');
  const [regIsVip, setRegIsVip] = useState(false);
  const [regIsStaff, setRegIsStaff] = useState(false);

  // clinical actions inputs
  const [clinicalDocNote, setClinicalDocNote] = useState('');
  const [nurseHeartRate, setNurseHeartRate] = useState('72');
  const [nurseBp, setNurseBp] = useState('120/80');
  const [nurseTemp, setNurseTemp] = useState('36.6');
  const [nurseResp, setNurseResp] = useState('16');
  const [nurseNotes, setNurseNotes] = useState('');

  // Orders creation
  const [docPrescDrug, setDocPrescDrug] = useState('');
  const [docPrescDosage, setDocPrescDosage] = useState('');
  const [docPrescFreq, setDocPrescFreq] = useState('BD');
  const [docPrescRoute, setDocPrescRoute] = useState('Oral');
  const [docPrescDuration, setDocPrescDuration] = useState('5 days');

  const [docLabTest, setDocLabTest] = useState('HbA1c Glycated Hemoglobin');
  const [docRadScan, setDocRadScan] = useState('X-Ray Chest PA View');

  // AdmittionBed Assign state
  const [admitWard, setAdmitWard] = useState('General Medicine');
  const [admitBed, setAdmitBed] = useState('G-02');

  // Handover state
  const [hoReceiver, setHoReceiver] = useState('');
  const [hoWard, setHoWard] = useState('General Medicine');
  const [hoSummary, setHoSummary] = useState('');

  // lists of transactions on separate queues
  const [pendingRx, setPendingRx] = useState<Prescription[]>([]);
  const [pendingLabs, setPendingLabs] = useState<LabRequest[]>([]);
  const [pendingRads, setPendingRads] = useState<RadiologyRequest[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [bedsList, setBedsList] = useState<WardBed[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);

  // Lab Scientist result input
  const [labResultInput, setLabResultInput] = useState('');
  const [labSampleInput, setLabSampleInput] = useState('Blood Serum');

  // Radiologist report input
  const [radReportInput, setRadReportInput] = useState('');

  // Info notification
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Set initial client-side tabs based on specific professional roles
  useEffect(() => {
    switch (activeRole) {
      case HospitalRole.HIM_OFFICER:
        setActiveTab('registry');
        break;
      case HospitalRole.DOCTOR:
        setActiveTab('consultation');
        break;
      case HospitalRole.NURSE:
        setActiveTab('ward');
        break;
      case HospitalRole.LAB_SCIENTIST:
        setActiveTab('lab_system');
        fetchLabRequests();
        break;
      case HospitalRole.RADIOLOGY_OFFICER:
        setActiveTab('rad_system');
        fetchRadRequests();
        break;
      case HospitalRole.PHARMACIST:
        setActiveTab('pharm_system');
        fetchPrescriptions();
        break;
      case HospitalRole.ACCOUNTS_OFFICER:
        setActiveTab('accounts_system');
        fetchInvoices();
        break;
      default:
        setActiveTab('patients_search');
    }
    setSelectedPatientId(null);
    setSelectedPatientData(null);
  }, [activeRole]);

  // fetch sub lists
  const fetchPrescriptions = () => {
    fetch('/api/prescriptions').then(r => r.json()).then(d => setPendingRx(d.prescriptions || []));
  };
  const fetchLabRequests = () => {
    fetch('/api/lab/requests').then(r => r.json()).then(d => setPendingLabs(d.requests || []));
  };
  const fetchRadRequests = () => {
    fetch('/api/radiology/requests').then(r => r.json()).then(d => setPendingRads(d.requests || []));
  };
  const fetchInvoices = () => {
    fetch('/api/billing').then(r => r.json()).then(d => setInvoices(d.invoices || []));
  };
  const fetchWardsAndBeds = () => {
    fetch('/api/beds').then(r => r.json()).then(d => setBedsList(d.beds || []));
  };
  const fetchHandoverHistry = () => {
    fetch('/api/handovers').then(r => r.json()).then(d => setHandovers(d.handovers || []));
  };

  useEffect(() => {
    if (activeTab === 'ward') {
      fetchWardsAndBeds();
      fetchHandoverHistry();
    }
  }, [activeTab]);

  // View specific patient details (Triggers security event in express audit logger)
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    fetch(`/api/patients/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Dynamic Permission warning: " + data.error);
        } else {
          setSelectedPatientData(data);
        }
      });
  };

  // HIM: Submit Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;

    const res = await fetch('/api/patients/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: regName,
        dob: regDob,
        gender: regGender,
        address: regAddress,
        phone: regPhone,
        email: regEmail,
        emergencyContact: regEmergency,
        allergies: regAllergies.split(',').map(s=>s.trim()).filter(s=>s.length > 0),
        isVip: regIsVip,
        isStaff: regIsStaff
      })
    });
    const d = await res.json();
    if (d.success) {
      triggerNotification(`New Patient Registered with clinical ID: ${d.patient.id}`);
      onRefreshPatients();
      // Clear forms
      setRegName('');
      setRegAddress('');
      setRegPhone('');
      setRegEmail('');
      setRegEmergency('');
      setRegIsVip(false);
      setRegIsStaff(false);
    }
  };

  // Nurse: Update Vitals values
  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const res = await fetch(`/api/patients/${selectedPatientId}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heartRate: nurseHeartRate,
        bloodPressure: nurseBp,
        temperature: nurseTemp,
        respirationRate: nurseResp,
        notes: nurseNotes
      })
    });
    if (res.ok) {
      triggerNotification("Patient primary physiological vitals registered.");
      handleSelectPatient(selectedPatientId);
      setNurseNotes('');
    }
  };

  // Doctor: Submit Diagnostic consultation note
  const handleAddDocNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !clinicalDocNote) return;

    const res = await fetch(`/api/patients/${selectedPatientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteText: clinicalDocNote })
    });
    if (res.ok) {
      triggerNotification("Clinical diagnostic note compiled in electronic health record.");
      handleSelectPatient(selectedPatientId);
      setClinicalDocNote('');
    }
  };

  // Doctor: Prescribe Pharmacy drugs
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !docPrescDrug) return;

    const res = await fetch(`/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatientId,
        medication: docPrescDrug,
        dosage: docPrescDosage,
        frequency: docPrescFreq,
        route: docPrescRoute,
        duration: docPrescDuration
      })
    });
    if (res.ok) {
      triggerNotification(`Formulated pharma prescription of ${docPrescDrug}`);
      handleSelectPatient(selectedPatientId);
      setDocPrescDrug('');
      setDocPrescDosage('');
    }
  };

  // Doctor: Order Lab assessment test
  const handleOrderLab = async () => {
    if (!selectedPatientId) return;
    const res = await fetch('/api/lab/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selectedPatientId, testName: docLabTest })
    });
    if (res.ok) {
      triggerNotification(`Laboratory diagnostic work ordered for: ${docLabTest}`);
      handleSelectPatient(selectedPatientId);
    }
  };

  // Doctor: Order Radiology imaging scan
  const handleOrderRadiology = async () => {
    if (!selectedPatientId) return;
    const res = await fetch('/api/radiology/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selectedPatientId, imagingType: docRadScan })
    });
    if (res.ok) {
      triggerNotification(`Diagnostic radiology scan scheduled: ${docRadScan}`);
      handleSelectPatient(selectedPatientId);
    }
  };

  // Nurse/Doc: Patient ward bed admission
  const handleAdmitToWard = async () => {
    if (!selectedPatientId) return;
    const res = await fetch(`/api/patients/${selectedPatientId}/admission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wardName: admitWard,
        bedNumber: admitBed,
        action: "admit"
      })
    });
    if (res.ok) {
      triggerNotification(`Patient transitioned to ${admitWard} Bed ${admitBed}`);
      handleSelectPatient(selectedPatientId);
      onRefreshPatients();
    }
  };

  // Nurse/Doc: Patient ward discharge
  const handleDischargePatient = async () => {
    if (!selectedPatientId) return;
    const res = await fetch(`/api/patients/${selectedPatientId}/admission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "discharge" })
    });
    if (res.ok) {
      triggerNotification("Discharge summary completed. Bed cleared.");
      handleSelectPatient(selectedPatientId);
      onRefreshPatients();
    }
  };

  // Nurse: File Shift handover summary
  const handleAddHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wardName: hoWard,
        receiverName: hoReceiver,
        handoverSummary: hoSummary
      })
    });
    if (res.ok) {
      triggerNotification("Nursing Shift Handover report signed and filed successfully.");
      setHoReceiver('');
      setHoSummary('');
      fetchHandoverHistry();
    }
  };

  // Scientist: Complete Lab assessment results
  const handleCompleteLab = async (reqId: string) => {
    if (!labResultInput) return;
    const res = await fetch(`/api/lab/requests/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: LabStatus.COMPLETED,
        sampleType: labSampleInput,
        result: labResultInput
      })
    });
    if (res.ok) {
      triggerNotification("Laboratory diagnostic assessment values released to EHR.");
      setLabResultInput('');
      fetchLabRequests();
    }
  };

  // Radiologist: Complete scan and release clinical diagnostics report
  const handleCompleteRadiology = async (reqId: string) => {
    if (!radReportInput) return;
    const res = await fetch(`/api/radiology/requests/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: RadStatus.COMPLETED,
        reportText: radReportInput,
        imageUrl: "https://images.unsplash.com/photo-1559828605-ff31bf1bb6cc?w=400&q=80"
      })
    });
    if (res.ok) {
      triggerNotification("Radiological diagnostic report signed off.");
      setRadReportInput('');
      fetchRadRequests();
    }
  };

  // Pharmacist: Dispense drugs trigger
  const handleDispenseRx = async (rxId: string) => {
    const res = await fetch(`/api/prescriptions/${rxId}/dispense`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      triggerNotification(`Pre-packaged dose dispensed for RX-${rxId}. Nurse MAR alert initiated.`);
      fetchPrescriptions();
    }
  };

  // Nurse: Bedside Medication Administration Record (MAR) validation logging
  const handleAdministerDrug = async (rxId: string, marId: string) => {
    const res = await fetch(`/api/prescriptions/${rxId}/administer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marId, notes: "Administered at bedside. Double nurse verification logged." })
    });
    if (res.ok) {
      triggerNotification(`Medication administration recorded successfully.`);
      if (selectedPatientId) {
        handleSelectPatient(selectedPatientId);
      }
    }
  };

  // Accounts: PayInvoice
  const handlePayInvoice = async (invId: string, total: number) => {
    const res = await fetch(`/api/billing/${invId}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaid: total,
        insuranceAmount: 0,
        targetStatus: "Paid"
      })
    });
    if (res.ok) {
      triggerNotification(`Accounts Invoice ${invId} marked settled.`);
      fetchInvoices();
    }
  };

  const triggerNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Filter clinical listings based on text searches
  const filteredPatients = patients.filter(p =>
    p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) || p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  if ((activeRole as any) === HospitalRole.DOCTOR) {
    return (
      <div className="space-y-6" id="doctor-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <DoctorDashboardView 
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.NURSE) {
    return (
      <div className="space-y-6" id="nurse-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <NurseDashboardView 
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.PHARMACIST) {
    return (
      <div className="space-y-6" id="pharmacist-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <PharmacistDashboardView 
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.LAB_SCIENTIST) {
    return (
      <div className="space-y-6" id="lab-scientist-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <LaboratoryDashboardView 
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.HOSPITAL_ADMIN) {
    return (
      <div className="space-y-6" id="hospital-admin-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <HospitalAdministratorDashboardView
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.ACCOUNTS_OFFICER) {
    return (
      <div className="space-y-6" id="accounts-officer-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <AccountsOfficerDashboardView
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.HIM_OFFICER) {
    return (
      <div className="space-y-6" id="him-officer-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <HIMDashboardView
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  if ((activeRole as any) === HospitalRole.RADIOLOGY_OFFICER) {
    return (
      <div className="space-y-6" id="radiology-officer-clinician-workspace">
        {actionSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
            <Check size={16} className="text-emerald-650 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
        <RadiologyDashboardView
          currentUser={currentUser}
          patients={patients}
          onRefresh={onRefreshPatients}
          onOpenPatientFile={handleSelectPatient}
          onShowNotification={triggerNotification}
        />
        {selectedPatientId && selectedPatientData && (
          <PatientFileModal
            isOpen={true}
            onClose={() => {
              setSelectedPatientId(null);
              setSelectedPatientData(null);
            }}
            patientId={selectedPatientId}
            patientData={selectedPatientData}
            activeRole={activeRole}
            currentUser={currentUser}
            onRefresh={() => {
              handleSelectPatient(selectedPatientId);
              onRefreshPatients();
            }}
            onShowNotification={triggerNotification}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="clinician-central-hub">
      {/* Alert Banner / Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center shadow-lg gap-2 animate-bounce">
          <Check size={16} className="text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Role Navigation Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Connected System Workspace</span>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-emerald-600" size={20} />
            {activeRole} EHR Dashboard
          </h2>
          <span className="text-xs text-slate-500 font-mono">Operator ID: {currentUser?.userId} ({currentUser?.fullName})</span>
        </div>

        {/* Action Tabs selector bar depending on active role */}
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {/* Global patient search always available in clinical systems */}
          <button
            onClick={() => setActiveTab('patients_search')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
              activeTab === 'patients_search' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Patients Search & Directory
          </button>

          {activeRole === HospitalRole.HIM_OFFICER && (
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'registry' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Patient Registration
            </button>
          )}

          {activeRole === HospitalRole.DOCTOR && (
            <button
              onClick={() => setActiveTab('consultation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'consultation' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Clinic Queue
            </button>
          )}

          {activeRole === HospitalRole.NURSE && (
            <button
              onClick={() => setActiveTab('ward')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'ward' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Ward Management
            </button>
          )}

          {activeRole === HospitalRole.LAB_SCIENTIST && (
            <button
              onClick={() => { setActiveTab('lab_system'); fetchLabRequests(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'lab_system' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Lab Information System (LIS)
            </button>
          )}

          {activeRole === HospitalRole.RADIOLOGY_OFFICER && (
            <button
              onClick={() => { setActiveTab('rad_system'); fetchRadRequests(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'rad_system' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              PACS Radiology Imaging
            </button>
          )}

          {activeRole === HospitalRole.PHARMACIST && (
            <button
              onClick={() => { setActiveTab('pharm_system'); fetchPrescriptions(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'pharm_system' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pharmacy Prescription Queue
            </button>
          )}

          {activeRole === HospitalRole.ACCOUNTS_OFFICER && (
            <button
              onClick={() => { setActiveTab('accounts_system'); fetchInvoices(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 ${
                activeTab === 'accounts_system' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Finances Ledger
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE WORKLIST LIST / FORM */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
          
          {/* TAB 1: Patient lookup list */}
          {activeTab === 'patients_search' && (
            <div className="space-y-4" id="view-patients-search">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Global Medical Indexes</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Patient ID or full name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-slate-50 text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${selectedPatientId === p.id ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold' : 'hover:bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono opacity-70">{p.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.isVip ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {p.isVip ? 'VIP File' : 'Standard'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold mt-1">{p.fullName}</h4>
                    <div className="flex justify-between text-[11px] opacity-70 mt-1">
                      <span>DOB: {p.dob}</span>
                      <span>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: HIM Patient Registration Form */}
          {activeTab === 'registry' && (
            <form onSubmit={handleRegisterPatient} className="space-y-3" id="registration-form">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Demographic Registry Entry</span>
              
              <div>
                <label className="block text-[11px] text-slate-500">Full Legal Name</label>
                <input 
                  type="text" required 
                  value={regName} onChange={e=>setRegName(e.target.value)}
                  className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Birthdate</label>
                  <input 
                    type="date" required 
                    value={regDob} onChange={e=>setRegDob(e.target.value)}
                    className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Gender Identity</label>
                  <select 
                    value={regGender} onChange={e=>setRegGender(e.target.value as any)}
                    className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500">Home Billing Address</label>
                <input 
                  type="text" required 
                  value={regAddress} onChange={e=>setRegAddress(e.target.value)}
                  className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Primary Phone</label>
                  <input 
                    type="tel" required 
                    value={regPhone} onChange={e=>setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Email Address</label>
                  <input 
                    type="email" required 
                    value={regEmail} onChange={e=>setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500">Emergency Kin Contact</label>
                <input 
                  type="text" required 
                  value={regEmergency} onChange={e=>setRegEmergency(e.target.value)}
                  className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500">Clinical Allergies (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="Penicillin, Peanuts..."
                  value={regAllergies} onChange={e=>setRegAllergies(e.target.value)}
                  className="w-full bg-slate-50 text-sm p-1.5 rounded border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 border border-slate-100 rounded">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input type="checkbox" checked={regIsVip} onChange={e=>setRegIsVip(e.target.checked)}/>
                  <span>VIP Patient Flag</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input type="checkbox" checked={regIsStaff} onChange={e=>setRegIsStaff(e.target.checked)}/>
                  <span>Hospital Employee</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow"
              >
                <UserPlus size={14} /> Commit Registration to Ledger
              </button>
            </form>
          )}

          {/* TAB 3: Doctor Consultation Worklist */}
          {activeTab === 'consultation' && (
            <div className="space-y-4" id="doctor-queue">
              <span className="block text-xs uppercase tracking-widest font-bold text-slate-400 font-mono">Medical OPD Consults Queue</span>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {patients.filter(p=>p.status === "Checked In" || p.status === "In Consultation" || p.status === "Awaiting Lab" || p.status === "Awaiting Radiology").map(p=>(
                  <div 
                    key={p.id}
                    onClick={()=>handleSelectPatient(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer border-slate-200/80 flex items-start gap-3.5 transition-all duration-200 shadow-sm ${
                      selectedPatientId === p.id 
                        ? 'bg-emerald-50/50 border-emerald-400 text-slate-900 font-bold' 
                        : 'bg-white hover:bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      selectedPatientId === p.id ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <Users size={16} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{p.fullName}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide px-2 py-0.5 ${
                          p.status === 'In Consultation' 
                            ? 'bg-amber-100 text-amber-700' 
                            : p.status === 'Checked In' 
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 mt-1 font-mono text-slate-500">ID: {p.id}</p>
                    </div>
                  </div>
                ))}
                {patients.filter(p=>p.status === "Checked In" || p.status === "In Consultation" || p.status === "Awaiting Lab" || p.status === "Awaiting Radiology").length === 0 && (
                  <div className="p-8 border border-dashed border-slate-205 border-slate-200 text-center rounded-2xl text-slate-400 text-xs font-mono">
                    No active patients in clinic OPD queue.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Nurse Ward bed allocations & Shift Handover Forms */}
          {activeTab === 'ward' && (
            <div className="space-y-6" id="nurse-ward-mgmt">
              <div className="space-y-4">
                <span className="block text-xs uppercase tracking-widest font-bold text-slate-400 font-mono">Bed Allocation Ledger</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {bedsList.map(bed => (
                    <div 
                      key={`${bed.wardName}-${bed.bedNumber}`} 
                      className={`p-3.5 border rounded-2xl flex flex-col min-h-[92px] justify-between transition-all ${
                        bed.isOccupied 
                          ? 'bg-rose-50/40 border-rose-150 border-rose-100 shadow-sm' 
                          : 'bg-emerald-50/20 border-emerald-100/55 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[13px] text-slate-800 font-sans">{bed.bedNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide ${
                          bed.isOccupied 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {bed.isOccupied ? 'Occupied' : 'Free'}
                        </span>
                      </div>
                      <div className="mt-2 text-left space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">{bed.wardName}</span>
                        {bed.isOccupied ? (
                          <span className="text-[11px] text-slate-500 font-mono block leading-tight pt-1">
                            ID: {bed.patientId}
                          </span>
                        ) : (
                          <span className="text-[11px] text-transparent select-none font-mono block leading-tight pt-1">
                            &nbsp;
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Handover Form */}
              <form onSubmit={handleAddHandover} className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4 transition-all hover:shadow-sm">
                <span className="block text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2 font-mono">
                  <Send size={13} className="text-emerald-600 animate-pulse" />
                  Sign-Off Ward Shift Handover
                </span>
                
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500 font-sans">Relieving Nurse (Recipient)</label>
                  <input 
                    type="text" required placeholder="Clara Barton"
                    value={hoReceiver} onChange={e=>setHoReceiver(e.target.value)}
                    className="w-full bg-white text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500 font-sans">Target Ward</label>
                  <select 
                    value={hoWard} onChange={e=>setHoWard(e.target.value)}
                    className="w-full bg-white text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Intensive Care Unit">Intensive Care Unit</option>
                    <option value="Pediatric Ward">Pediatric Ward</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500 font-sans">Notes Handover Summary</label>
                  <textarea 
                    required placeholder="Clinical status of patients, outstanding medication cycles..."
                    value={hoSummary} onChange={e=>setHoSummary(e.target.value)}
                    className="w-full bg-white text-xs px-3 py-2 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono py-2.5 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Seal Handover Record
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Laboratory queue */}
          {activeTab === 'lab_system' && (
            <div className="space-y-4" id="lab-queue">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Lab Analysis Tickets</span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingLabs.map(req => (
                  <div key={req.id} className="p-3 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">{req.id}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${req.status !== LabStatus.COMPLETED ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {req.status}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800">{req.testName}</h5>
                    <p className="text-[11px] text-slate-500">Patient: {patients.find(p => p.id === req.patientId)?.fullName || req.patientId} ({req.patientId})</p>
                    
                    {req.status !== LabStatus.COMPLETED && (
                      <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded space-y-2 text-xs">
                        <div className="flex gap-2">
                          <input 
                            type="text" placeholder="Sample Matrix (e.g. Plasma)"
                            value={labSampleInput} onChange={e=>setLabSampleInput(e.target.value)}
                            className="bg-white p-1 text-[11px] rounded border border-slate-200 w-1/2"
                          />
                          <input 
                            type="text" placeholder="Result readings..."
                            value={labResultInput} onChange={e=>setLabResultInput(e.target.value)}
                            className="bg-white p-1 text-[11px] rounded border border-slate-200 w-1/2"
                          />
                        </div>
                        <button 
                          onClick={()=>handleCompleteLab(req.id)}
                          className="w-full bg-amber-600 hover:bg-amber-700 hover:text-white p-1 text-[10px] rounded cursor-pointer font-bold"
                        >
                          Sealed Analysis Output
                        </button>
                      </div>
                    )}

                    {req.status === LabStatus.COMPLETED && (
                      <p className="text-[10px] font-mono p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                        Result: {req.result}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Radiology Queue */}
          {activeTab === 'rad_system' && (
            <div className="space-y-4" id="radiology-queue">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Radiology Imaging Tickets</span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingRads.map(req => (
                  <div key={req.id} className="p-3 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">{req.id}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${req.status !== RadStatus.COMPLETED ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {req.status}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800">{req.imagingType}</h5>
                    <p className="text-[11px] text-slate-500">Patient: {patients.find(p => p.id === req.patientId)?.fullName || req.patientId} ({req.patientId})</p>
                    
                    {req.status !== RadStatus.COMPLETED && (
                      <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded space-y-2 text-xs">
                        <textarea 
                          placeholder="Signs, findings, diagnostic report text..."
                          value={radReportInput} onChange={e=>setRadReportInput(e.target.value)}
                          className="bg-white p-1.5 text-[11px] rounded border border-slate-200 w-full resize-none h-12"
                        />
                        <button 
                          onClick={()=>handleCompleteRadiology(req.id)}
                          className="w-full bg-amber-600 hover:bg-amber-700 hover:text-white p-1 text-[10px] rounded cursor-pointer font-bold"
                        >
                          Upload Report & Signed Image files
                        </button>
                      </div>
                    )}

                    {req.status === RadStatus.COMPLETED && (
                      <p className="text-[10px] font-mono p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                        Result: {req.reportText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Pharmacy Queue */}
          {activeTab === 'pharm_system' && (
            <div className="space-y-4" id="pharmacy-queue">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Pending Drug Prescriptions</span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingRx.map(rx => (
                  <div key={rx.id} className="p-3 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">{rx.id}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${rx.status === PrescriptionStatus.PRESCRIBED ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {rx.status}
                      </span>
                    </div>
                    <h5 className="text-sm font-semibold text-slate-800">{rx.medication} ({rx.dosage})</h5>
                    <p className="text-[11px] text-slate-500">Patient: {patients.find(p => p.id === rx.patientId)?.fullName || rx.patientId} ({rx.patientId})</p>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Route: {rx.route}</span>
                      <span>Freq: {rx.frequency}</span>
                    </div>

                    {rx.status === PrescriptionStatus.PRESCRIBED && (
                      <button
                        onClick={()=>handleDispenseRx(rx.id)}
                        className="w-full mt-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer text-[10px]"
                      >
                        Confirm Dispensing Packages
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: Accounts Ledger Invoicing */}
          {activeTab === 'accounts_system' && (
            <div className="space-y-4" id="accounts-queue">
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Unsettled Financial Bills</span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-3 border border-slate-100 rounded-xl space-y-1 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">{inv.id}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${inv.status === "Paid" ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.status}
                      </span>
                    </div>
                    <h5 className="text-sm font-semibold text-slate-800">Total: ${inv.totalAmount.toFixed(2)}</h5>
                    <p className="text-[11px] text-slate-500">Patient: {patients.find(p => p.id === inv.patientId)?.fullName || inv.patientId} ({inv.patientId})</p>

                    <div className="border-t border-slate-50 py-1 my-1">
                      {inv.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-[10px] text-slate-400">
                          <span>{item.description}</span>
                          <span>${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {inv.status === "Unpaid" && (
                      <button
                        onClick={()=>handlePayInvoice(inv.id, inv.totalAmount)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 rounded text-[10px] cursor-pointer"
                      >
                        Log Patient Settlement
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAILED CLINICAL RECORD FOLDER FOR THE CHOSEN PATIENT */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          {selectedPatientId && selectedPatientData ? (
            <div className="space-y-6 text-left" id="clinical-fiche">
              {/* Header card details */}
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      ID: {selectedPatientData.patient.id}
                    </span>
                    {selectedPatientData.patient.isVip && (
                      <span className="text-xs font-mono bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                        <AlertCircle size={12} /> Restricted VIP File
                      </span>
                    )}
                    {selectedPatientData.patient.isStaff && (
                      <span className="text-xs font-mono bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">
                        Hospital Personnel Record
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">{selectedPatientData.patient.fullName}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1 font-mono">
                    <span>DOB: {selectedPatientData.patient.dob}</span>
                    <span>Gender: {selectedPatientData.patient.gender}</span>
                    <span>Status: {selectedPatientData.patient.status}</span>
                  </div>
                </div>

                {/* Admission command triggers if role authorized */}
                {(activeRole === HospitalRole.DOCTOR || activeRole === HospitalRole.NURSE) && (
                  <div className="flex gap-2">
                    {selectedPatientData.patient.status !== "Admitted" ? (
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <select 
                          value={admitWard} onChange={e=>setAdmitWard(e.target.value)}
                          className="text-[10px] bg-white border border-slate-200 p-1 rounded"
                        >
                          <option value="General Medicine">General Medicine</option>
                          <option value="Intensive Care Unit">Intensive Care Unit</option>
                          <option value="Pediatric Ward">Pediatric Ward</option>
                        </select>
                        <select 
                          value={admitBed} onChange={e=>setAdmitBed(e.target.value)}
                          className="text-[10px] bg-white border border-slate-200 p-1 rounded"
                        >
                          <option value="G-01">G-01</option>
                          <option value="G-02">G-02</option>
                          <option value="G-03">G-03</option>
                          <option value="ICU-01">ICU-01</option>
                          <option value="ICU-02">ICU-02</option>
                          <option value="P-01">P-01</option>
                          <option value="P-02">P-02</option>
                        </select>
                        <button 
                          onClick={handleAdmitToWard}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] p-1.5 rounded cursor-pointer shrink-0"
                        >
                          Admit Ward
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleDischargePatient}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                      >
                        Clinical Patient Discharge
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Patient Basic demographics folder */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Allergies (Contraindicated)</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPatientData.patient.allergies.length > 0 ? (
                      selectedPatientData.patient.allergies.map((a: string)=>(
                        <span key={a} className="p-0.5 px-1 bg-red-100 text-red-700 text-[10px] rounded font-bold">{a}</span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None logged</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Registered Contacts</span>
                  <div className="mt-1 font-mono text-[10px] text-slate-700">
                    <p className="overflow-hidden text-ellipsis">{selectedPatientData.patient.phone}</p>
                    <p className="overflow-hidden text-ellipsis">{selectedPatientData.patient.email}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left col-span-2">
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Emergency Kin Address Connection</span>
                  <p className="mt-1 font-mono text-[10px] text-slate-700 overflow-hidden text-ellipsis">{selectedPatientData.patient.address}</p>
                </div>
              </div>

              {/* Interactive grids dependent on role permissions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. CLINICAL DECISION ACTION CARD (DOCTOR OR NURSE INPUTS) */}
                <div className="space-y-4">
                  {activeRole === HospitalRole.DOCTOR && (
                    <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl text-left space-y-4">
                      <span className="text-xs uppercase font-semibold text-slate-600 flex items-center gap-1 border-b border-slate-100 pb-2">
                        <Activity size={14} className="text-emerald-500" /> Consult Order Center
                      </span>

                      {/* Diagnostic Notes Input */}
                      <form onSubmit={handleAddDocNote} className="space-y-2">
                        <label className="block text-[10px] text-slate-500">Record Progress Diagnosis Note</label>
                        <textarea
                          placeholder="Type clinical consultant progress summaries..."
                          value={clinicalDocNote} onChange={e=>setClinicalDocNote(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 p-2 rounded h-16 resize-none focus:outline-none focus:border-emerald-500"
                        />
                        <button type="submit" className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer">
                          Add Diagnostic Note
                        </button>
                      </form>

                      {/* Pharmacy Order Formulation */}
                      <form onSubmit={handleAddPrescription} className="space-y-2 border-t border-slate-100 pt-3">
                        <label className="block text-[10px] text-slate-500">Order Pharmaceutical Prescriptions</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input 
                            placeholder="Moxifloxacin..." type="text" required
                            value={docPrescDrug} onChange={e=>setDocPrescDrug(e.target.value)}
                            className="text-xs bg-white border border-slate-200 p-1 rounded"
                          />
                          <input 
                            placeholder="400mg Daily..." type="text" required
                            value={docPrescDosage} onChange={e=>setDocPrescDosage(e.target.value)}
                            className="text-xs bg-white border border-slate-200 p-1 rounded"
                          />
                        </div>
                        <button type="submit" className="w-full py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer">
                          Authorize Prescriptions Run
                        </button>
                      </form>

                      {/* Labs and Imaging request orders short form */}
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] text-slate-500">Pathology Labs</label>
                          <select 
                            value={docLabTest} onChange={e=>setDocLabTest(e.target.value)}
                            className="w-full text-[10px] bg-white border border-slate-200 p-1 rounded"
                          >
                            <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                            <option value="Comprehensive Metabolic Panel (CMP)">CMP</option>
                            <option value="Lipid Cholesterol Profile">Lipid Cholesterol Profile</option>
                            <option value="Serum Creatinine Assessment">Serum Creatinine</option>
                          </select>
                          <button onClick={handleOrderLab} className="w-full text-[9px] p-1 bg-sky-600 font-bold hover:bg-sky-700 text-white rounded cursor-pointer text-center">
                            Order Pathology
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] text-slate-500">Radiology Imaging</label>
                          <select 
                            value={docRadScan} onChange={e=>setDocRadScan(e.target.value)}
                            className="w-full text-[10px] bg-white border border-slate-200 p-1 rounded"
                          >
                            <option value="X-Ray Chest PA View">X-Ray Chest PA View</option>
                            <option value="MRI Brain High Contrast">MRI Brain Contrast</option>
                            <option value="Computed Tomography (CT) Angiogram">Coronary CT</option>
                            <option value="Ultrasound Upper Abdomen">Ultrasound Abdomen</option>
                          </select>
                          <button onClick={handleOrderRadiology} className="w-full text-[9px] p-1 bg-violet-600 font-bold hover:bg-violet-700 text-white rounded cursor-pointer text-center">
                            Schedule X-Ray
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRole === HospitalRole.NURSE && (
                    <form onSubmit={handleRecordVitals} className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl text-left space-y-4">
                      <span className="text-xs uppercase font-semibold text-slate-600 flex items-center gap-1 border-b border-slate-100 pb-2">
                        <Heart size={14} className="text-rose-500" /> Log physiological Vitals
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500">Heart Pulse (bpm)</label>
                          <input type="number" value={nurseHeartRate} onChange={e=>setNurseHeartRate(e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded"/>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Blood Pressure (mmHg)</label>
                          <input type="text" value={nurseBp} onChange={e=>setNurseBp(e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded"/>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Core Body Temp (°C)</label>
                          <input type="number" step="0.1" value={nurseTemp} onChange={e=>setNurseTemp(e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded"/>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Respiratory Rate (rpm)</label>
                          <input type="number" value={nurseResp} onChange={e=>setNurseResp(e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded"/>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500">Bedside evaluation comment</label>
                        <textarea placeholder="Lungs details, hydration index..." value={nurseNotes} onChange={e=>setNurseNotes(e.target.value)} className="w-full text-xs h-12 bg-white border border-slate-200 p-1 rounded resize-none focus:outline-none"/>
                      </div>

                      <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer">
                        Seal Physiological Vitals Run
                      </button>
                    </form>
                  )}

                  {/* REST: Default helper for simple roles */}
                  {activeRole !== HospitalRole.DOCTOR && activeRole !== HospitalRole.NURSE && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 min-h-48 text-center">
                      <AlertCircle size={24} className="mb-2" />
                      <p className="text-xs">Your connected role clinical credentials do not entitle you to modify core EHR medical diagnoses.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Read-Only database index lock enforced by ATIF module.</p>
                    </div>
                  )}
                </div>

                {/* 2. CHRONOLOGICAL MEDICAL DIRECTORY HISTORY FOLDER */}
                <div className="space-y-4 text-left">
                  <div>
                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100 pb-1 mb-2">Physiological Vitals Trend</span>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {selectedPatientData.vitals.length > 0 ? (
                        selectedPatientData.vitals.map((v: Vitals)=>(
                          <div key={v.id} className="p-2 border border-slate-100 rounded-lg bg-slate-50/20 text-xs">
                            <div className="flex justify-between font-mono text-[9px] text-slate-400">
                              <span>Recorded: {new Date(v.timestamp).toLocaleString()}</span>
                              <span>By: {v.recordedBy}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 mt-1 font-semibold text-slate-700">
                              <span>HR: {v.heartRate} bpm</span>
                              <span>BP: {v.bloodPressure}</span>
                              <span>T: {v.temperature}°C</span>
                              <span>RR: {v.respirationRate}/m</span>
                            </div>
                            {v.notes && <p className="text-[11px] text-slate-500 mt-1 italic">"{v.notes}"</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No vitals registered in this cycle.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100 pb-1 mb-2">Doctor Consultations Progress Journal</span>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {selectedPatientData.clinicalNotes.length > 0 ? (
                        selectedPatientData.clinicalNotes.map((n: ClinicalNote)=>(
                          <div key={n.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/20 text-xs text-left">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>By: Dr. @{n.createdBy}</span>
                              <span>{new Date(n.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600 italic">"{n.noteText}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No consultation notes compiled.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION: DIAGNOSTICS & PHARMACY CHECKLISTS */}
              <div className="border-t border-slate-100 pt-4 text-left">
                <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">Diagnostic Panels & Active Prescriptions Run</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Labs List */}
                  <div className="space-y-2 text-xs">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Beaker size={12} className="text-sky-600" /> Laboratory Reports
                    </span>
                    <div className="space-y-1.5">
                      {selectedPatientData.labRequests.map((lab: LabRequest)=>(
                        <div key={lab.id} className="p-2 border border-slate-100 bg-slate-50/20 rounded flex flex-col">
                          <div className="flex justify-between font-mono text-[9px] text-slate-400">
                            <span>{lab.id}</span>
                            <span>{lab.status}</span>
                          </div>
                          <span className="font-semibold text-slate-800 mt-0.5">{lab.testName}</span>
                          {lab.result && <p className="text-[10px] font-mono p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 mt-1">Result: {lab.result}</p>}
                        </div>
                      ))}
                      {selectedPatientData.labRequests.length === 0 && <span className="text-slate-400 italic">No lab assessments ordered</span>}
                    </div>
                  </div>

                  {/* Radiology List */}
                  <div className="space-y-2 text-xs">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <ImageIcon size={12} className="text-violet-600" /> Radiology Scans PA
                    </span>
                    <div className="space-y-1.5">
                      {selectedPatientData.radiologyRequests.map((rad: RadiologyRequest)=>(
                        <div key={rad.id} className="p-2 border border-slate-100 bg-slate-50/20 rounded flex flex-col">
                          <div className="flex justify-between font-mono text-[9px] text-slate-400">
                            <span>{rad.id}</span>
                            <span>{rad.status}</span>
                          </div>
                          <span className="font-semibold text-slate-800 mt-0.5">{rad.imagingType}</span>
                          {rad.reportText && (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] font-mono p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 text-left">Report: {rad.reportText}</p>
                              <img src={rad.imageUrl} alt="XRay" referrerPolicy="no-referrer" className="h-16 w-full object-cover rounded border border-slate-200 mt-1"/>
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedPatientData.radiologyRequests.length === 0 && <span className="text-slate-400 italic">No radiology scans scheduled</span>}
                    </div>
                  </div>

                  {/* Prescriptions and Medication Administration Records (MAR) */}
                  <div className="space-y-2 text-xs">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Pill size={12} className="text-amber-600" /> Bedside MAR Cycle
                    </span>
                    <div className="space-y-2">
                      {selectedPatientData.prescriptions.map((rx: Prescription)=>(
                        <div key={rx.id} className="p-2 border border-slate-100 bg-slate-50/20 rounded text-left">
                          <div className="flex justify-between font-mono text-[9px] text-slate-400">
                            <span>{rx.id}</span>
                            <span>{rx.status}</span>
                          </div>
                          <h6 className="font-semibold text-slate-800 mt-0.5">{rx.medication} ({rx.dosage})</h6>
                          <p className="text-[10px] text-slate-400">Schedule: {rx.frequency} | {rx.route} - {rx.duration}</p>
                          
                          {/* Nurse Administration action button inside patient file (Bedside checkin) */}
                          {activeRole === HospitalRole.NURSE && rx.mar && rx.mar.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-slate-50 pt-1.5">
                              {rx.mar.map((mar: any)=>(
                                <div key={mar.id} className="flex justify-between items-center bg-slate-50 p-1 border border-slate-100 rounded text-[10px]">
                                  <div>
                                    <span className="block font-semibold">MAR Scheduled run dose</span>
                                    <span className="text-slate-400 font-mono text-[9px]">Target: {new Date(mar.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  {mar.status === "Scheduled" ? (
                                    <button 
                                      onClick={() => handleAdministerDrug(rx.id, mar.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded font-mono text-[8.5px] cursor-pointer"
                                    >
                                      Administer Dose
                                    </button>
                                  ) : (
                                    <span className="text-emerald-700 font-bold font-mono">✓ Administered</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedPatientData.prescriptions.length === 0 && <span className="text-slate-400 italic">No drug scripts authorized</span>}
                    </div>
                  </div>
                </div>

              </div>

              {/* Financial Bills logged in EHR profile */}
              <div className="border-t border-slate-100 pt-4 text-left">
                <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Hospital Revenue Invoices Archive</span>
                <div className="space-y-2">
                  {selectedPatientData.billingInvoices.map((inv: BillingInvoice)=>(
                    <div key={inv.id} className="p-3 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/20 text-xs">
                      <div>
                        <span className="font-mono text-slate-400 block text-[10px]">{inv.id} — Declared: {new Date(inv.issuedDate).toLocaleDateString()}</span>
                        <div className="flex gap-2 flex-wrap text-slate-700 mt-1 font-semibold">
                          <span>Invoice Items count: {inv.items.length}</span>
                          <span>Total Ledger value: ${inv.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${inv.status === "Paid" ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                  {selectedPatientData.billingInvoices.length === 0 && <p className="text-xs text-slate-400 italic">No accounting transactions logged</p>}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-300 min-h-96 text-center space-y-4">
              <ClipboardList size={48} className="text-slate-200" />
              <div>
                <h4 className="text-base font-semibold text-slate-500">No Patient File Active</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Select a patient profile from global search or OPD Consult lists on left to view clinical indexes and authorize medical modifications.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
