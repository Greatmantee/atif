/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, 
  Settings, LogOut, Check, ChevronRight, UserMinus, Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { HospitalRole } from '../types';
import { DEFAULT_STAFF_ROSTER } from '../data/defaultStaff';

interface LayoutProps {
  currentUser: {
    userId: string;
    username: string;
    fullName: string;
    role: HospitalRole;
    department: string;
    ipAddress: string;
    deviceName: string;
  } | null;
  staffList: any[];
  onSwitchUser: (userId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

export default function Layout({ currentUser, staffList = [], onSwitchUser, onLogout, children }: LayoutProps) {
  if (!currentUser) return <>{children}</>;

  const displayStaff = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF_ROSTER;

  const getDepartmentTagColor = (role: HospitalRole) => {
    switch (role) {
      case HospitalRole.SECURITY_ANALYST:
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case HospitalRole.IT_ADMIN:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case HospitalRole.DOCTOR:
      case HospitalRole.NURSE:
        return 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/10';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const isSecurityStaff = currentUser.role === HospitalRole.SECURITY_ANALYST || currentUser.role === HospitalRole.IT_ADMIN;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isSecurityStaff ? 'bg-slate-50 text-slate-800' : 'bg-slate-50 text-slate-800'}`} id="main-application-frame">
      {/* 1. ACADEMIC EVALUATORS TOP CONSOLE: SEAMLESS DYNAMIC SWAPPING */}
      <div className="bg-white border-b border-slate-200 p-2 text-slate-800 flex flex-col md:flex-row justify-between items-center px-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-600" size={14} />
          <span className="font-semibold text-slate-700 font-mono text-[10px] tracking-wider uppercase">Project Evaluation Control Panel:</span>
          <span className="text-slate-500 font-mono text-[10.5px]">Direct Role-Swap (RBAC & ATIF testing)</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center justify-center md:justify-end">
          {/* Mobile role selector */}
          <div className="block md:hidden w-full max-w-xs">
            <select
              value={currentUser.userId}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[10px] rounded px-2 py-1 font-semibold text-slate-700 focus:outline-none"
              id="role-swap-select"
            >
              {displayStaff.slice(0, 10).map((staff) => (
                <option key={staff.id} value={staff.id}>
                  Switch to: {staff.username === 'him_officer' ? 'HIM' : staff.username === 'dr_house' ? 'Doctor' : staff.username === 'nurse_rached' ? 'Nurse' : staff.username === 'lab_scientist' ? 'Lab Sci' : staff.username === 'rad_officer' ? 'Radiology' : staff.username === 'pharmacist_bob' ? 'Pharma' : staff.username === 'accounts_alice' ? 'Accounts' : staff.username === 'hospital_admin' ? 'Hosp Admin' : staff.username === 'analyst_sam' ? 'Analyst' : 'IT Admin'} ({staff.fullName})
                </option>
              ))}
            </select>
          </div>

          {/* Desktop inline buttons */}
          <div className="hidden md:flex flex-wrap gap-1.5 justify-center md:justify-end items-center">
            {displayStaff.slice(0, 10).map((staff) => (
              <button
                key={staff.id}
                onClick={() => onSwitchUser(staff.id)}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-semibold transition-all ${currentUser.userId === staff.id ? 'bg-emerald-600 text-white font-black' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                id={`role-swap-btn-${staff.username}`}
              >
                {staff.username === 'him_officer' ? 'HIM' : staff.username === 'dr_house' ? 'Doctor' : staff.username === 'nurse_rached' ? 'Nurse' : staff.username === 'lab_scientist' ? 'Lab Sci' : staff.username === 'rad_officer' ? 'Radiology' : staff.username === 'pharmacist_bob' ? 'Pharma' : staff.username === 'accounts_alice' ? 'Accounts' : staff.username === 'hospital_admin' ? 'Hosp Admin' : staff.username === 'analyst_sam' ? 'Analyst' : 'IT Admin'}
              </button>
            ))}
          </div>
          
          <div className="h-4 w-px bg-slate-300 mx-1.5 hidden md:block" />
          <button
            onClick={onLogout}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer border border-rose-200/50 w-full sm:w-auto justify-center"
            title="Secure Session Logout"
            id="logout-button"
          >
            <LogOut size={11} /> Logout
          </button>
        </div>
      </div>

      {/* 4. PRIMARY MAIN VIEW CONTAINER SPACE */}
      <main className="flex-1 w-full p-4 md:p-6" id="layout-view-panel">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* RESTRICT RECURRING MARGIN FOOTER */}
      <footer className={`py-4 text-center text-xs text-slate-400 border-t ${isSecurityStaff ? 'bg-white border-slate-200 text-slate-550' : 'bg-white border-slate-100'}`}>
        <p className="font-mono text-[9.5px]">ATIF-HIS: Adaptive Threat Intelligence Framework Suite — B.Sc. Cybersecurity Capstone Project</p>
        <p className="mt-0.5">HIPAA Security Rules & HITRUST Consolidated Baseline Perimeters Active</p>
      </footer>
    </div>
  );
}
