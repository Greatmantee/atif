/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  ChevronRight, 
  User, 
  Stethoscope, 
  Activity, 
  ClipboardList, 
  Settings, 
  FlaskConical, 
  Pill, 
  DollarSign, 
  Award, 
  Heart 
} from 'lucide-react';
import { motion } from 'motion/react';
import { StaffUser, HospitalRole } from '../types';

interface LoginProps {
  staffMembers: StaffUser[];
  onLogin: (username: string, password: string, device: string, ip: string, failedAttempts: number) => Promise<void>;
  errorMessage: string | null;
}

export default function Login({ staffMembers, onLogin, errorMessage }: LoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSelectRole = (staff: StaffUser) => {
    setUsername(staff.username);
    setPassword(staff.username); // Predefined roles have password same as username
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);

    // Look up the predefined staff member if there is one to retrieve their typical device & IP context
    const staff = staffMembers.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase()
    );
    const device = staff && staff.typicalDevices && staff.typicalDevices.length > 0
      ? staff.typicalDevices[0]
      : 'Clinic Desk PC-11';
    const ip = staff && staff.typicalIps && staff.typicalIps.length > 0
      ? staff.typicalIps[0]
      : '10.20.2.100';

    // Hardcode 0 failed login attempts as requested
    await onLogin(username.trim(), password, device, ip, 0);
    setIsLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case HospitalRole.DOCTOR:
        return <Stethoscope size={14} className="text-cyan-600" />;
      case HospitalRole.NURSE:
        return <Activity size={14} className="text-teal-600" />;
      case HospitalRole.HIM_OFFICER:
        return <ClipboardList size={14} className="text-blue-600" />;
      case HospitalRole.SECURITY_ANALYST:
        return <Shield size={14} className="text-rose-600" />;
      case HospitalRole.IT_ADMIN:
        return <Settings size={14} className="text-amber-600" />;
      case HospitalRole.LAB_SCIENTIST:
        return <FlaskConical size={14} className="text-indigo-600" />;
      case HospitalRole.PHARMACIST:
        return <Pill size={14} className="text-purple-600" />;
      case HospitalRole.ACCOUNTS_OFFICER:
        return <DollarSign size={14} className="text-emerald-600" />;
      case HospitalRole.HOSPITAL_ADMIN:
        return <Award size={14} className="text-violet-600" />;
      default:
        return <User size={14} className="text-slate-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('Analyst') || role.includes('IT')) return 'bg-rose-50 border-rose-200 text-rose-700';
    if (role.includes('Doctor') || role.includes('Nurse')) return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    return 'bg-slate-100 border-slate-200 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="login-container">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-500 font-mono text-xs">
        <Shield size={16} className="text-emerald-500" />
        <span>ATIF-HIS Secure Gate</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-md text-white">
            <span className="font-mono text-xl font-black">H</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-slate-900">
          St. Jude Medical Center Portal
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-xs mx-auto">
          Electronic Health Records (EHR) & Clinical Workflow Integration Gateway. Restricted to authorized hospital staff.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg"
      >
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2 animate-pulse">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Username Input Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Hospital Staff Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_house"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <User size={16} className="absolute right-3 top-2.5 text-slate-400 animate-pulse" />
              </div>
            </div>

            {/* Password PIN Input Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Security Password PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password PIN"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Key size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
              <div className="mt-1 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                {username ? (
                  <span>Password matches username: <span className="text-emerald-600 font-semibold font-sans">"{username}"</span></span>
                ) : (
                  <span>Please type details or select a predefined staff role below</span>
                )}
              </div>
            </div>

            {/* Access Hospital Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                id="login-submit-button"
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer disabled:bg-emerald-400 transition-colors"
              >
                {isLoading ? 'Decrypting Security tokens...' : 'Access Hospital Workspace'}
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Predefined Simulation Log Accounts (below the button) */}
            <div className="pt-6 border-t border-slate-100">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3 text-center">
                Predefined Simulation Accounts (Click to Pre-fill)
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {staffMembers.map((staff) => {
                  const isSelected = username === staff.username;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelectRole(staff)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        {getRoleIcon(staff.role)}
                        <span className="font-semibold text-xs text-slate-800 truncate block">
                          {staff.fullName}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col w-full text-[10px] text-slate-500">
                        <span className="truncate block font-medium text-slate-600">
                          {staff.role}
                        </span>
                        <span className="font-mono text-emerald-600 mt-0.5">
                          @{staff.username}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      <div className="mt-8 text-center text-xs text-slate-400 max-w-md mx-auto space-y-1">
        <p>© 2026 Health Information Alliance (HIA). HIPAA & SOC2 Compliant.</p>
        <p className="font-mono text-[10px]">Embedded ATIF-HIS Sentinel Core Running on Port: 3000</p>
      </div>
    </div>
  );
}
