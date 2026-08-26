/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, Shield, AlertCircle, Heart, FileText, Beaker, Image as ImageIcon, Pill, CreditCard,
  Plus, Check, Send, Trash, UserPlus, Clock, ChevronRight, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Patient, Vitals, ClinicalNote, LabRequest, RadiologyRequest, Prescription, BillingInvoice, HospitalRole, LabStatus, RadStatus, PrescriptionStatus } from '../types';

interface PatientFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientData: {
    patient: Patient;
    vitals: Vitals[];
    clinicalNotes: ClinicalNote[];
    labRequests: LabRequest[];
    radiologyRequests: RadiologyRequest[];
    prescriptions: Prescription[];
    billingInvoices: BillingInvoice[];
  } | null;
  activeRole: HospitalRole;
  currentUser: any;
  onRefresh: () => void;
  onShowNotification: (msg: string) => void;
}

export default function PatientFileModal({
  isOpen,
  onClose,
  patientId,
  patientData,
  activeRole,
  currentUser,
  onRefresh,
  onShowNotification
}: PatientFileModalProps) {

  // Current selected tab inside the file chart
  const [activeTab, setActiveTab] = useState<string>('Vitals');

  // Input forms local state
  const [vTemp, setVTemp] = useState('36.6');
  const [vBP, setVBP] = useState('120/80');
  const [vPulse, setVPulse] = useState('72');
  const [vResp, setVResp] = useState('16');
  const [vNotes, setVNotes] = useState('');

  const [noteContent, setNoteContent] = useState('');
  
  const [selectedLabTest, setSelectedLabTest] = useState('CBC with Diff (Hemogram)');
  const [selectedRadScan, setSelectedRadScan] = useState('X-Ray Chest PA View');

  const [rxDrug, setRxDrug] = useState('');
  const [rxDose, setRxDose] = useState('500mg');
  const [rxFreq, setRxFreq] = useState('BD (twice daily)');
  const [rxRoute, setRxRoute] = useState('Oral');
  const [rxDuration, setRxDuration] = useState('5 days');

  const [admitWard, setAdmitWard] = useState('General Medicine Ward - G-01');
  const [admitBed, setAdmitBed] = useState('G-02');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !patientData) return null;

  const { patient, vitals, clinicalNotes, labRequests, radiologyRequests, prescriptions, billingInvoices } = patientData;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 15;

      const checkSpace = (needed: number) => {
        if (currentY + needed > pageHeight - 15) {
          doc.addPage();
          currentY = 15;
          // Draw header on new page
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Patient Record: ${patient.fullName} (ID: ${patient.id})`, 15, 10);
          doc.line(15, 12, pageWidth - 15, 12);
          currentY = 18;
        }
      };

      // Draw main document header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('METRO GENERAL HOSPITAL', 15, currentY);
      currentY += 6;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text('ELECTRONIC CLINICAL MEDICAL DIRECTORY - COMPREHENSIVE PATIENT FILE', 15, currentY);
      currentY += 4;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Doc Ref ID: ${patient.id} | Generated: ${new Date().toLocaleString()} | Context: Confidential EHR`, 15, currentY);
      currentY += 4;

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 8;

      // --- PATIENT INFO BLOCK ---
      checkSpace(45);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, currentY, pageWidth - 30, 42, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(15, currentY, pageWidth - 30, 42, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(patient.fullName || 'Confidential Name', 20, currentY + 7);

      // Status Labels
      let labelText = '';
      if (patient.isVip) labelText += '[VIP] ';
      if (patient.isStaff) labelText += '[Hospital Staff] ';
      if (labelText) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38);
        doc.text(labelText, 120, currentY + 7);
      }

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600

      // Demographic data grid (Col 1)
      doc.setFont('Helvetica', 'bold');
      doc.text('Patient ID:', 20, currentY + 16);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.id || 'N/A', 50, currentY + 16);

      doc.setFont('Helvetica', 'bold');
      doc.text('Date of Birth:', 20, currentY + 22);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.dob || '1990-01-01', 50, currentY + 22);

      doc.setFont('Helvetica', 'bold');
      doc.text('Gender:', 20, currentY + 28);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.gender || 'N/A', 50, currentY + 28);

      doc.setFont('Helvetica', 'bold');
      doc.text('Classification:', 20, currentY + 34);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.status || 'N/A', 50, currentY + 34);

      // Col 2
      doc.setFont('Helvetica', 'bold');
      doc.text('Contact Phone:', 110, currentY + 16);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.phone || 'N/A', 145, currentY + 16);

      doc.setFont('Helvetica', 'bold');
      doc.text('Email Address:', 110, currentY + 22);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.email || 'N/A', 145, currentY + 22);

      doc.setFont('Helvetica', 'bold');
      doc.text('Emergency Contact:', 110, currentY + 28);
      doc.setFont('Helvetica', 'normal');
      doc.text(patient.emergencyContact || 'N/A', 145, currentY + 28);

      doc.setFont('Helvetica', 'bold');
      doc.text('Ward & Bed No:', 110, currentY + 34);
      doc.setFont('Helvetica', 'normal');
      const wardBed = patient.status === 'Admitted' ? `${patient.admittedWard} (Bed ${patient.admittedBed})` : 'Not Admitted / Outpatient';
      doc.text(wardBed, 145, currentY + 34);

      currentY += 48;

      // --- ALLERGIES BOX ---
      checkSpace(18);
      doc.setFillColor(254, 242, 242); // red-50
      doc.rect(15, currentY, pageWidth - 30, 12, 'F');
      doc.setDrawColor(248, 113, 113); // red-400
      doc.rect(15, currentY, pageWidth - 30, 12, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(153, 27, 27); // red-800
      doc.text('CONTRAINDICATED ALLERGENS AND DRUG SUBSTANCES DIRECTORY:', 20, currentY + 7.5);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(185, 28, 28); // red-700
      const allergyList = patient.allergies || [];
      const allergyStr = allergyList.length > 0 ? allergyList.join(', ') : 'No contraindicated substances filed';
      doc.text(allergyStr, 128, currentY + 7.5);

      currentY += 19;

      // --- 1. VITALS SECTION ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('SECTION 1: CLINICAL BEDSIDE VITALS STATISTICS', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const vitalsList = vitals || [];
      if (vitalsList.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No bedside vital signs have been recorded in this clinical session.', 18, currentY);
        currentY += 8;
      } else {
        // Table Header
        checkSpace(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, pageWidth - 30, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Timestamp', 18, currentY + 4);
        doc.text('Temperature', 65, currentY + 4);
        doc.text('Blood Pressure', 90, currentY + 4);
        doc.text('Heart Rate', 122, currentY + 4);
        doc.text('Respiration Rate', 148, currentY + 4);
        doc.text('Logged By Staff', 174, currentY + 4);
        currentY += 6;

        vitalsList.forEach((v) => {
          checkSpace(10);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          
          doc.text(v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A', 18, currentY + 4);
          doc.text(`${v.temperature || 'N/A'} °C`, 65, currentY + 4);
          doc.text(v.bloodPressure || 'N/A', 90, currentY + 4);
          doc.text(`${v.heartRate || 'N/A'} bpm`, 122, currentY + 4);
          doc.text(`${v.respirationRate || 'N/A'} /min`, 148, currentY + 4);
          doc.text(v.recordedBy || 'System', 174, currentY + 4);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 6, pageWidth - 15, currentY + 6);
          currentY += 7;
        });
        currentY += 3;
      }

      // --- 2. PROGRESS NOTES SECTION ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SECTION 2: HEALTHCARE CLINICAL CONSULTATION AND PROGRESS NOTES', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const notesList = clinicalNotes || [];
      if (notesList.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No healthcare consult progression logs or clinical annotations recorded.', 18, currentY);
        currentY += 8;
      } else {
        notesList.forEach((n) => {
          const splitText = doc.splitTextToSize(n.noteText || '', pageWidth - 40);
          const textHeight = splitText.length * 4.2;
          checkSpace(textHeight + 12);

          doc.setFillColor(250, 250, 250);
          doc.rect(15, currentY, pageWidth - 30, textHeight + 9, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(15, currentY, pageWidth - 30, textHeight + 9, 'S');

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          const author = `${n.createdBy || 'Clinical Operator'} [Role: ${n.role || 'Personnel'}]`;
          const dateStr = n.timestamp ? new Date(n.timestamp).toLocaleString() : 'N/A';
          doc.text(`${author}  —  Date: ${dateStr}`, 18, currentY + 4.5);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(64, 64, 64);
          doc.text(splitText, 18, currentY + 9);

          currentY += textHeight + 12;
        });
        currentY += 3;
      }

      // --- 3. LAB REQUISITIONS SECTION ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SECTION 3: CLINICAL LABORATORY REQUISITIONS & COMPONENT FINDINGS', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const labs = labRequests || [];
      if (labs.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No pathological lab requisitions have been requested in this EHR session.', 18, currentY);
        currentY += 8;
      } else {
        checkSpace(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, pageWidth - 30, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Diagnostic Panel', 18, currentY + 4);
        doc.text('Requisition ID', 72, currentY + 4);
        doc.text('Status', 98, currentY + 4);
        doc.text('Results Publishing & Lab Readings', 124, currentY + 4);
        currentY += 6;

        labs.forEach((req) => {
          checkSpace(14);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          doc.text(req.testName || 'Laboratory Assay', 18, currentY + 4);
          doc.text(`LAB-${req.id}`, 72, currentY + 4);
          doc.text(req.status || 'Pending', 98, currentY + 4);

          let outcome = 'Specimen processing inside centrifuge';
          if (req.status === LabStatus.COMPLETED) {
            outcome = req.result || 'Results reviewed and dispatched';
          }
          const splitOut = doc.splitTextToSize(outcome, pageWidth - 135);
          doc.text(splitOut, 124, currentY + 4);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 9, pageWidth - 15, currentY + 9);
          currentY += 10;
        });
        currentY += 3;
      }

      // --- 4. RADIOLOGY ACTIONS ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SECTION 4: RADIOLOGY DIAGNOSTICS PACS STUDY REPORTS', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const rads = radiologyRequests || [];
      if (rads.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No radiological scanning orders or imaging files have been logged.', 18, currentY);
        currentY += 8;
      } else {
        checkSpace(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, pageWidth - 30, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Imaging Scan Type', 18, currentY + 4);
        doc.text('Scan Requisition ID', 72, currentY + 4);
        doc.text('Status', 105, currentY + 4);
        doc.text('PACS Radiologist Findings Impression', 128, currentY + 4);
        currentY += 6;

        rads.forEach((req) => {
          checkSpace(14);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          doc.text(req.imagingType || 'Imaging Requisition', 18, currentY + 4);
          doc.text(`RAD-${req.id}`, 72, currentY + 4);
          doc.text(req.status || 'Pending', 105, currentY + 4);

          let findings = 'Imagery queue outstanding / processing';
          if (req.status === RadStatus.COMPLETED) {
            findings = req.reportText || 'Impression completed and uploaded';
          }
          const splitFindings = doc.splitTextToSize(findings, pageWidth - 140);
          doc.text(splitFindings, 128, currentY + 4);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 9, pageWidth - 15, currentY + 9);
          currentY += 10;
        });
        currentY += 3;
      }

      // --- 5. MED PHARMACY ACTIVE ORDERS ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SECTION 5: INPATIENT MEDICATION ADMINISTRATION RECORD (MAR)', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const rxs = prescriptions || [];
      if (rxs.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No therapeutic medications or pharmaceuticals ordered inside clinical MAR chart.', 18, currentY);
        currentY += 8;
      } else {
        checkSpace(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, pageWidth - 30, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Medication', 18, currentY + 4);
        doc.text('Dosage', 75, currentY + 4);
        doc.text('Frequency & Route', 105, currentY + 4);
        doc.text('Duration', 148, currentY + 4);
        doc.text('MAR Dispatch Status', 174, currentY + 4);
        currentY += 6;

        rxs.forEach((rx) => {
          checkSpace(10);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          doc.text(rx.medication || 'Substance', 18, currentY + 4);
          doc.text(rx.dosage || 'N/A', 75, currentY + 4);
          doc.text(`${rx.frequency} (${rx.route || 'Oral'})`, 105, currentY + 4);
          doc.text(rx.duration || 'N/A', 148, currentY + 4);
          doc.text(rx.status || 'Active', 174, currentY + 4);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 6, pageWidth - 15, currentY + 6);
          currentY += 7;
        });
        currentY += 3;
      }

      // --- 6. DEMOGRAPHIC FINANCIAL LEDGER ---
      checkSpace(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SECTION 6: ACCOUNT FINANCE STATEMENT & OUTSTANDING INVOICES', 15, currentY);
      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      const bills = billingInvoices || [];
      if (bills.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('No active financial ledger codes or bills generated for this patient profile.', 18, currentY);
        currentY += 8;
      } else {
        checkSpace(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, pageWidth - 30, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Invoice Ref No', 18, currentY + 4);
        doc.text('Created on', 48, currentY + 4);
        doc.text('Service Item Description', 80, currentY + 4);
        doc.text('Amount Due', 145, currentY + 4);
        doc.text('Ledger status', 175, currentY + 4);
        currentY += 6;

        let totalOwing = 0;
        bills.forEach((inv) => {
          checkSpace(10);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          doc.text(`INV-${inv.id}`, 18, currentY + 4);
          doc.text(inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A', 48, currentY + 4);
          
          // Join items descriptions
          const itemsSummary = inv.items && inv.items.length > 0
            ? inv.items.map(item => `${item.description} ($${item.amount})`).join(', ')
            : 'Clinical services logged';
          const splitSummary = doc.splitTextToSize(itemsSummary, pageWidth - 145);
          doc.text(splitSummary, 80, currentY + 4);

          doc.text(`$${inv.totalAmount.toFixed(2)}`, 145, currentY + 4);
          doc.text(inv.status || 'Pending', 175, currentY + 4);

          if (inv.status !== 'Paid') {
            totalOwing += inv.totalAmount;
          }

          doc.setDrawColor(241, 245, 249);
          const summaryHeight = splitSummary.length * 4;
          const rowHeight = Math.max(8, summaryHeight + 2);
          doc.line(15, currentY + rowHeight - 2, pageWidth - 15, currentY + rowHeight - 2);
          currentY += rowHeight;
        });

        // Total summary box inside PDF
        checkSpace(11);
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, pageWidth - 30, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, currentY, pageWidth - 30, 8, 'S');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`LEDGER CONSOLIDATION SUMMARY - NET DIRECTORY OUTSTANDING: $${totalOwing.toFixed(2)}`, 20, currentY + 5.2);
        currentY += 14;
      }

      // --- VERIFICATION FOOTER NOTICE Segment ---
      checkSpace(32);
      doc.setDrawColor(203, 213, 225);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 5;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('ELECTRONIC PATIENT DATABASE CLOUD SYNCHRONIZATION SYSTEM REPORT', 15, currentY);
      currentY += 3.5;

      doc.setFont('Helvetica', 'normal');
      doc.text(`This dossier is a programmatic real-time representation of Patient record ${patient.id}, authorized for offline download under internal clinical audit protocol.`, 15, currentY);
      currentY += 3.5;
      doc.text('Metadata logging hashes verified. Non-repudiated signature logged to the HIS ledger.', 15, currentY);

      // Save document
      const fileSafeName = `${patient.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Record_File.pdf`;
      doc.save(fileSafeName);
      onShowNotification(`EHR File generated successfully for offline review: ${fileSafeName}`);

      // Auto-register PATIENT_RECORD_EXPORTED security event
      fetch(`/api/patients/${patient.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          onRefresh(); // Refresh parent view so the newly generated event and potential correlated threat shows up
        }
      })
      .catch(err => {
        console.error('Failed to log PDF export event:', err);
      });
    } catch (e: any) {
      onShowNotification(`PDF compilation abort: ${e?.message ?? 'Technical reason'}`);
    }
  };

  // Submit quick vitals inside modal
  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heartRate: vPulse,
          bloodPressure: vBP,
          temperature: vTemp,
          respirationRate: vResp,
          notes: vNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Logged secondary bedside vitals to patient directory. Telemetry audited.`);
        setVNotes('');
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Submit note inside modal
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText: noteContent })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Added comprehensive clinical annotation log to patient history.`);
        setNoteContent('');
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Submit Lab request inside modal
  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lab/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, testName: selectedLabTest })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Issued clinical pathology test order: ${selectedLabTest}.`);
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Submit Radiology request inside modal
  const handleAddRad = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/radiology/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, imagingType: selectedRadScan })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Issued radiology diagnostic orders: ${selectedRadScan}.`);
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Submit Prescription inside modal
  const handleAddRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxDrug) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          medication: rxDrug,
          dosage: rxDose,
          frequency: rxFreq,
          route: rxRoute,
          duration: rxDuration
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Authorized clinical prescription for ${rxDrug} committed to MAR.`);
        setRxDrug('');
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Ward Admission action inside modal
  const handleAdmitToWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/admission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admit',
          wardName: admitWard,
          bedNumber: admitBed
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Allocated patient admission to ${admitWard} Bed ${admitBed}.`);
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  // Ward Discharge action inside modal
  const handleDischargeFromWard = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/admission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discharge' })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Released patient from active ward Bed occupancy allocation.`);
        onRefresh();
      }
    } catch (_) {} finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in" id="global-patient-detail-overlay">
      <div className="bg-white w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* OVERLAY TOP HEADER SEGMENT */}
        <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3 text-left">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Shield size={20} />
            </span>
            <div className="text-left font-sans">
              <span className="text-[10px] font-mono font-bold text-emerald-600 block tracking-wider uppercase">Active Electro Medical Directory File</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-black">
                  {patient.id}
                </span>
                <span className="text-xl font-extrabold text-slate-850 text-slate-800">{patient.fullName}</span>
                {patient.isVip && (
                  <span className="text-[10px] font-mono bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertCircle size={10} /> RESTRICTED VIP FILE
                  </span>
                )}
                {patient.isStaff && (
                  <span className="text-[10px] font-mono bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                    STAFF INTEGRATED RECORD
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
              title="Download full medical record dossier in A4 PDF format"
            >
              <Download size={14} /> Download PDF Record
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-150 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              id="close-fiche-overlay"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* COMPREHENSIVELY SPLIT THREE COLUMN PANEL SEGMENT */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT DEMOGRAPHICS SIDE RAIL PANEL */}
          <div className="lg:col-span-1 p-5 space-y-5 text-left font-sans text-xs bg-slate-50/50">
            <div className="space-y-3">
              <h4 className="text-[10.5px] font-extrabold uppercase font-mono tracking-wider text-slate-400">Demographics & Details</h4>
              
              <div className="space-y-2 text-slate-700 font-sans">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Date of Birth</span>
                  <span className="text-xs font-bold font-mono">{patient.dob || '1990-01-01'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Gender</span>
                  <span className="text-xs font-bold">{patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Classification status</span>
                  <span className="text-xs font-bold font-mono uppercase text-slate-500">{patient.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Contact Phone</span>
                  <span className="text-xs font-bold font-mono">{patient.phone || '07722-192-383'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Contact Email</span>
                  <span className="text-xs font-bold font-mono truncate block">{patient.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Demographic Address</span>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">{patient.address || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Emergency Contact No</span>
                  <span className="text-xs font-bold font-mono text-slate-600">{patient.emergencyContact || 'Spouse'}</span>
                </div>
              </div>
            </div>

            {/* ALLERGIES BADGES CARD */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-left">
              <span className="text-[10.5px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">Contraindicated Allergens</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map(a => (
                    <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10.5px] font-bold rounded">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No contraindicated substances</span>
                )}
              </div>
            </div>

            {/* WARD BED ADMISSION CONTROLS CONTAINER */}
            <div className="space-y-3 pt-3 border-t border-slate-200 text-left">
              <span className="text-[10.5px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">Admission Allocation</span>
              
              {patient.status !== 'Admitted' ? (
                <form onSubmit={handleAdmitToWard} className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400">Target Ward</label>
                    <select
                      value={admitWard}
                      onChange={e => setAdmitWard(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg cursor-pointer"
                    >
                      <option value="General Medicine Ward - G-01">General Medicine Ward - G-01</option>
                      <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                      <option value="Paediatric Care Ward">Paediatric Care Ward</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400">Target Bed No</label>
                    <input
                      type="text" required placeholder="G-05"
                      value={admitBed} onChange={e => setAdmitBed(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg font-mono text-center font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Admit Ward Patient
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                  <div className="text-left">
                    <p className="text-[10.5px] text-indigo-800 font-bold block">Currently Admitted</p>
                    <p className="text-[11px] text-indigo-600 font-semibold block font-mono mt-0.5">{patient.admittedWard} | Bed {patient.admittedBed}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDischargeFromWard}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Release Bed Discharge
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT TABS VIEWPORT (3/4 width) */}
          <div className="lg:col-span-3 p-5 flex flex-col text-left">
            
            {/* SUB-TABS SELECTOR SEGMENT BAR */}
            <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-100">
              {[
                { name: 'Vitals', icon: <Heart size={13} />, badge: vitals.length },
                { name: 'Consult Notes', icon: <FileText size={13} />, badge: clinicalNotes.length },
                { name: 'Lab Tests', icon: <Beaker size={13} />, badge: labRequests.length },
                { name: 'Radiology PACS', icon: <ImageIcon size={13} />, badge: radiologyRequests.length },
                { name: 'Med MAR', icon: <Pill size={13} />, badge: prescriptions.length },
                { name: 'Finances Ledger', icon: <CreditCard size={13} />, badge: billingInvoices.length }
              ].map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeTab === tab.name
                      ? 'bg-emerald-50 text-emerald-805 border-emerald-400 text-[#047857]'
                      : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 rounded px-1 min-w-[14px]">
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* TAB CONTAINER AREA VIEWPORTS */}
            <div className="flex-1 py-4">

              {/* TABS 1: VITALS */}
              {activeTab === 'Vitals' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Inline quick vital signs adder */}
                  <form onSubmit={handleAddVitals} className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-extrabold uppercase text-slate-400">Temp (°C)</label>
                      <input
                        type="text" required value={vTemp} onChange={e=>setVTemp(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-extrabold uppercase text-slate-400">BP (mmHg)</label>
                      <input
                        type="text" required value={vBP} onChange={e=>setVBP(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-extrabold uppercase text-slate-400">Pulse (bpm)</label>
                      <input
                        type="text" required value={vPulse} onChange={e=>setVPulse(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-extrabold uppercase text-slate-400">Resp. (rpm)</label>
                      <input
                        type="text" required value={vResp} onChange={e=>setVResp(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg font-mono text-center"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2 rounded-lg cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1 uppercase transition-colors"
                    >
                      <Plus size={13} /> Log Bed Obs
                    </button>
                    <div className="md:col-span-4 col-span-2 space-y-1">
                      <input
                        type="text"
                        placeholder="Bedside observation text comments (optional)..."
                        value={vNotes}
                        onChange={e => setVNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-755 focus:outline-none"
                      />
                    </div>
                  </form>

                  <div className="bg-white border border-slate-205 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="text-xs w-full text-left font-sans">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase font-mono text-[9px] tracking-wider">
                        <tr>
                          <th className="p-3">Logged Date</th>
                          <th className="p-3 text-center">Temp (°C)</th>
                          <th className="p-3 text-center">BP (mmHg)</th>
                          <th className="p-3 text-center">Heart Rate</th>
                          <th className="p-3 text-center">Respiration</th>
                          <th className="p-3">Logged By</th>
                          <th className="p-3">Clinical Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                        {vitals.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-[10.5px] font-bold text-slate-500">
                              {new Date(v.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-sky-700">{v.temperature}°C</td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-705 text-indigo-700">{v.bloodPressure}</td>
                            <td className="p-3 text-center font-mono font-extrabold text-slate-800">{v.heartRate} bpm</td>
                            <td className="p-3 text-center font-mono">{v.respirationRate} rpm</td>
                            <td className="p-3 font-semibold text-slate-650">{v.recordedBy}</td>
                            <td className="p-3 text-slate-500 truncate max-w-[140px] italic font-medium">
                              {v.notes || 'Routine checkup'}
                            </td>
                          </tr>
                        ))}
                        {vitals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                              No medical vitals checklist observations logged.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TABS 2: CONSULT NOTES */}
              {activeTab === 'Consult Notes' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans">
                  
                  {/* Notes Adder form */}
                  <form onSubmit={handleAddNote} className="space-y-2 text-left">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">Write Consultation Diagnostic Note</label>
                    <textarea
                      required
                      placeholder="Input comprehensive diagnosis analysis, medical parameters, and plans..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      className="w-full bg-white border border-slate-205 border-slate-200 rounded-xl h-20 p-3 text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white uppercase text-[10.5px] tracking-wider px-4 py-2 rounded-xl cursor-pointer shadow-xs transition-colors"
                      >
                        Commit Consultation note
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5">
                    {clinicalNotes.map(note => (
                      <div key={note.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-left space-y-1.5">
                        <div className="flex justify-between items-center text-[10.5px] border-b border-slate-200/55 pb-1">
                          <div className="flex gap-1.5 items-center font-medium">
                            <span className="font-extrabold text-slate-800">{note.createdBy}</span>
                            <span className="px-1.5 bg-slate-200 rounded font-mono font-bold text-[9px] uppercase tracking-wide text-slate-600">
                              {note.role}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono font-bold">{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-750 leading-relaxed font-sans mt-2">{note.noteText}</p>
                      </div>
                    ))}
                    {clinicalNotes.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-200 text-center rounded-2xl text-slate-400 font-mono">
                        No previous consultation annotations filed.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABS 3: LAB TESTS */}
              {activeTab === 'Lab Tests' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans text-left">
                  
                  {/* Lab Test Order */}
                  <form onSubmit={handleAddLab} className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-end gap-3">
                    <div className="space-y-1 flex-1">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400">Select Pathology Diagnostic Test</label>
                      <select
                        value={selectedLabTest}
                        onChange={e => setSelectedLabTest(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg cursor-pointer font-sans"
                      >
                        <option value="CBC with Diff (Hemogram)">CBC with Diff (Hemogram)</option>
                        <option value="UEC Electrolytes & Kidney Profile">UEC Electrolytes & Kidney Profile</option>
                        <option value="LFT Hepatic Enzyme Analysis">LFT Hepatic Enzyme Analysis</option>
                        <option value="Lipid Profile Cholesterol Metrics">Lipid Profile Cholesterol Metrics</option>
                        <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0284C7] hover:bg-sky-700 text-white font-bold text-[10px] uppercase px-4 h-9 rounded-lg cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Issue Lab Request
                    </button>
                  </form>

                  <div className="space-y-2">
                    {labRequests.map(lab => (
                      <div key={lab.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                        <div className="text-left font-sans flex-1">
                          <strong className="text-slate-800 text-sm block tracking-tight font-extrabold">{lab.testName}</strong>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono font-semibold mt-1">
                            <span>ID: {lab.id}</span>
                            <span>Ordered by: {lab.orderedBy}</span>
                            <span>Date: {lab.orderedDate}</span>
                          </div>
                          {lab.result && (
                            <div className="mt-2.5 p-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[11px]">
                              <strong className="text-slate-700">Analytic Result: </strong>
                              <span className="font-mono text-[#047857] font-semibold">{lab.result}</span>
                            </div>
                          )}
                        </div>

                        <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase tracking-wide shrink-0 ml-4 ${
                          lab.status === LabStatus.COMPLETED 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : lab.status === LabStatus.PROCESSING 
                            ? 'bg-blue-105 bg-indigo-50 text-indigo-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                    ))}
                    {labRequests.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-250 border-slate-200 text-center rounded-2xl text-slate-400 font-mono">
                        No laboratory analytics requested.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABS 4: RADIOLOGY PACS */}
              {activeTab === 'Radiology PACS' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans text-left">
                  
                  {/* Radiology Order */}
                  <form onSubmit={handleAddRad} className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-end gap-3">
                    <div className="space-y-1 flex-1">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400">Select PAC Imaging Scan Type</label>
                      <select
                        value={selectedRadScan}
                        onChange={e => setSelectedRadScan(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg cursor-pointer font-sans"
                      >
                        <option value="X-Ray Chest PA View">X-Ray Chest PA View</option>
                        <option value="MRI Brain Sagittal T1/T2">MRI Brain Sagittal T1/T2</option>
                        <option value="CT Abdomen & Pelvis with Contrast">CT Abdomen & Pelvis with Contrast</option>
                        <option value="ECG Cardiology Grid">ECG Cardiology Grid</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0284C7] hover:bg-sky-700 text-white font-bold text-[10px] uppercase px-4 h-9 rounded-lg cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Issue Imaging Request
                    </button>
                  </form>

                  <div className="space-y-2">
                    {radiologyRequests.map(rad => (
                      <div key={rad.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                        <div className="text-left font-sans flex-1">
                          <strong className="text-slate-800 text-sm block font-extrabold">{rad.imagingType}</strong>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono font-semibold mt-1">
                            <span>ID: {rad.id}</span>
                            <span>Scan status: {rad.status}</span>
                            <span>Date: {rad.orderedDate}</span>
                          </div>
                          {rad.reportText && (
                            <div className="mt-2.5 p-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[11px] space-y-1">
                              <strong className="text-slate-700">PACS Diagnosis report: </strong>
                              <p className="font-mono text-slate-600 font-medium leading-relaxed">{rad.reportText}</p>
                            </div>
                          )}
                        </div>

                        <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide shrink-0 ml-4 ${
                          rad.status === RadStatus.COMPLETED 
                            ? 'bg-emerald-100 text-emerald-700 font-bold' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rad.status}
                        </span>
                      </div>
                    ))}
                    {radiologyRequests.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-200 text-center rounded-2xl text-slate-400 font-mono">
                        No PACS diagnostic imaging scans ordered.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABS 5: MED MAR */}
              {activeTab === 'Med MAR' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans text-left">
                  
                  {/* Prescription Adder */}
                  <form onSubmit={handleAddRx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-sans text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400">Drug Molecule / Compound Generic</label>
                      <input
                        type="text" required placeholder="Aspirin / Ceftriaxone / Metformin..."
                        value={rxDrug} onChange={e=>setRxDrug(e.target.value)}
                        className="w-full bg-white border border-slate-205 border-slate-200 p-2 text-xs rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-normal text-slate-400 uppercase">Dose</label>
                        <input
                          type="text" required value={rxDose} onChange={e=>setRxDose(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-xs text-center rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-normal text-slate-400 uppercase">Frequency</label>
                        <input
                          type="text" required value={rxFreq} onChange={e=>setRxFreq(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-xs text-center rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-normal text-slate-400 uppercase">Route</label>
                        <input
                          type="text" required value={rxRoute} onChange={e=>setRxRoute(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-xs text-center rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-normal text-slate-400 uppercase">Duration</label>
                        <input
                          type="text" required value={rxDuration} onChange={e=>setRxDuration(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-xs text-center rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs uppercase px-5 py-2 rounded-xl cursor-pointer"
                      >
                        Authorize Prescription Prescription
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 font-sans">
                    {prescriptions.map(rx => (
                      <div key={rx.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                        <div className="text-left font-sans">
                          <strong className="text-slate-800 text-sm block font-extrabold">{rx.medication} {rx.dosage}</strong>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-400 font-semibold font-mono mt-1">
                            <span>ID: {rx.id}</span>
                            <span>Route: {rx.route}</span>
                            <span>Frequency: {rx.frequency}</span>
                            <span>Duration: {rx.duration}</span>
                            <span>By: {rx.prescribedBy}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono tracking-wide font-black shrink-0 ml-4 ${
                          rx.status === PrescriptionStatus.ADMINISTERED 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : rx.status === PrescriptionStatus.DISPENSED 
                            ? 'bg-[#E0F2FE] text-[#0369A1]' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rx.status}
                        </span>
                      </div>
                    ))}
                    {prescriptions.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-200 text-center rounded-2xl text-slate-400 font-mono">
                        No active medical prescriptions committed under MAR.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABS 6: FINANCES LEDGER */}
              {activeTab === 'Finances Ledger' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans text-left">
                  <div className="space-y-3 font-sans">
                    {billingInvoices.map(invoice => (
                      <div key={invoice.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
                        <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-xl border border-slate-150">
                          <div className="text-left font-mono">
                            <strong className="text-slate-800 block text-xs font-bold leading-tight">Invoice NO: {invoice.id}</strong>
                            <span className="text-[10px] text-slate-450 block mt-0.5 text-slate-400">Issued: {invoice.issuedDate}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wide ${
                            invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          {invoice.items.map(item => (
                            <div key={item.id} className="flex justify-between p-1 border-b border-slate-50 text-[11px]">
                              <span className="text-slate-600 font-medium">{item.description}</span>
                              <span className="font-mono font-bold text-slate-700">${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between pt-2 border-t border-slate-200 font-mono text-xs font-extrabold text-slate-800">
                          <span>Total Cumulative Charge:</span>
                          <span>${invoice.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    {billingInvoices.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-210 border-slate-200 text-center rounded-2xl text-slate-400 font-mono">
                        No outstanding bill invoices compiled.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
