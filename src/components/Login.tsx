/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Zap,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { StaffUser, HospitalRole } from '../types';
import { DEFAULT_STAFF_ROSTER } from '../data/defaultStaff';

interface LoginProps {
  staffMembers?: StaffUser[];
  onLogin: (username: string, password: string, device: string, ip: string, failedAttempts: number) => Promise<void>;
  errorMessage: string | null;
}

export default function Login({ staffMembers = [], onLogin, errorMessage }: LoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fallback to DEFAULT_STAFF_ROSTER if staffMembers is empty, ensuring accounts always display (e.g. on Vercel)
  const availableStaff = useMemo(() => {
    if (staffMembers && staffMembers.length > 0) {
      return staffMembers;
    }
    return DEFAULT_STAFF_ROSTER;
  }, [staffMembers]);

  const handleSelectRole = (staff: StaffUser) => {
    setUsername(staff.username);
    setPassword(staff.username); // Predefined roles have password same as username
  };

  const handleQuickLogin = async (staff: StaffUser) => {
    setUsername(staff.username);
    setPassword(staff.username);
    setIsLoading(true);

    const device = staff.typicalDevices && staff.typicalDevices.length > 0
      ? staff.typicalDevices[0]
      : 'Clinic Desk PC-11';
    const ip = staff.typicalIps && staff.typicalIps.length > 0
      ? staff.typicalIps[0]
      : '10.20.2.100';

    await onLogin(staff.username, staff.username, device, ip, 0);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);

    // Look up the predefined staff member if there is one to retrieve their typical device & IP context
    const staff = availableStaff.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase()
    );
    const device = staff && staff.typicalDevices && staff.typicalDevices.length > 0
      ? staff.typicalDevices[0]
      : 'Clinic Desk PC-11';
    const ip = staff && staff.typicalIps && staff.typicalIps.length > 0
      ? staff.typicalIps[0]
      : '10.20.2.100';

    await onLogin(username.trim(), password, device, ip, 0);
    setIsLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case HospitalRole.DOCTOR:
        return <Stethoscope size={15} className="text-cyan-600 shrink-0" />;
      case HospitalRole.NURSE:
        return <Activity size={15} className="text-teal-600 shrink-0" />;
      case HospitalRole.HIM_OFFICER:
        return <ClipboardList size={15} className="text-blue-600 shrink-0" />;
      case HospitalRole.SECURITY_ANALYST:
        return <Shield size={15} className="text-rose-600 shrink-0" />;
      case HospitalRole.IT_ADMIN:
        return <Settings size={15} className="text-amber-600 shrink-0" />;
      case HospitalRole.LAB_SCIENTIST:
        return <FlaskConical size={15} className="text-indigo-600 shrink-0" />;
      case HospitalRole.RADIOLOGY_OFFICER:
        return <Activity size={15} className="text-sky-600 shrink-0" />;
      case HospitalRole.PHARMACIST:
        return <Pill size={15} className="text-purple-600 shrink-0" />;
      case HospitalRole.ACCOUNTS_OFFICER:
        return <DollarSign size={15} className="text-emerald-600 shrink-0" />;
      case HospitalRole.HOSPITAL_ADMIN:
        return <Award size={15} className="text-violet-600 shrink-0" />;
      default:
        return <User size={15} className="text-slate-600 shrink-0" />;
    }
  };

  const filteredStaff = useMemo(() => {
    return availableStaff.filter((staff) => {
      // Category filter
      if (activeCategory === 'CLINICAL') {
        if (staff.role !== HospitalRole.DOCTOR && staff.role !== HospitalRole.NURSE) return false;
      } else if (activeCategory === 'DIAGNOSTICS') {
        if (staff.role !== HospitalRole.LAB_SCIENTIST && staff.role !== HospitalRole.RADIOLOGY_OFFICER && staff.role !== HospitalRole.PHARMACIST) return false;
      } else if (activeCategory === 'SECURITY_ADMIN') {
        if (staff.role !== HospitalRole.SECURITY_ANALYST && staff.role !== HospitalRole.IT_ADMIN && staff.role !== HospitalRole.HOSPITAL_ADMIN && staff.role !== HospitalRole.HIM_OFFICER && staff.role !== HospitalRole.ACCOUNTS_OFFICER) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = staff.fullName.toLowerCase().includes(q);
        const matchesUser = staff.username.toLowerCase().includes(q);
        const matchesRole = staff.role.toLowerCase().includes(q);
        const matchesDept = staff.department.toLowerCase().includes(q);
        return matchesName || matchesUser || matchesRole || matchesDept;
      }

      return true;
    });
  }, [availableStaff, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans" id="login-container">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-500 font-mono text-xs">
        <Shield size={16} className="text-emerald-500" />
        <span>ATIF-HIS Secure Gateway</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-md text-white flex items-center justify-center w-12 h-12">
            <span className="font-mono text-xl font-black">H</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-semibold tracking-tight text-slate-900">
          St. Jude Medical Center Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 max-w-xs mx-auto">
          Adaptive Threat Intelligence Framework (ATIF) Electronic Health Records Gateway.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl"
      >
        <div className="bg-white py-7 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-pulse">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Username Input Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Hospital Staff Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_house or him_officer"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <User size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Password PIN Input Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Security Password PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password PIN (same as username)"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Key size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
              <div className="mt-1.5 flex justify-between items-center text-[10.5px] text-slate-500">
                {username ? (
                  <span>Password matches username: <span className="text-emerald-700 font-bold font-mono">"{username}"</span></span>
                ) : (
                  <span>Tip: Password matches username for all demo accounts</span>
                )}
              </div>
            </div>

            {/* Access Hospital Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                id="login-submit-button"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer disabled:bg-emerald-400 transition-colors"
              >
                {isLoading ? 'Decrypting Security Tokens...' : 'Access Hospital Workspace'}
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Predefined Simulation Accounts Section */}
            <div className="pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                    Predefined Accounts ({availableStaff.length})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Click to pre-fill or 1-click login
                </span>
              </div>

              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({availableStaff.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('CLINICAL')}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'CLINICAL'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Clinical
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('DIAGNOSTICS')}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'DIAGNOSTICS'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    Diagnostics & Rx
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('SECURITY_ADMIN')}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'SECURITY_ADMIN'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Security & Admin
                  </button>
                </div>

                <div className="relative sm:ml-auto w-full sm:w-36">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter roles..."
                    className="w-full text-[10.5px] border border-slate-200 rounded px-2 py-1 pl-6 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <Search size={11} className="absolute left-1.5 top-2 text-slate-400" />
                </div>
              </div>

              {/* Grid of Predefined Accounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredStaff.map((staff) => {
                  const isSelected = username === staff.username;
                  return (
                    <div
                      key={staff.id}
                      className={`relative flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                          : 'bg-slate-50/80 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectRole(staff)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <div className="flex items-center gap-1.5 truncate">
                            {getRoleIcon(staff.role)}
                            <span className="font-bold text-xs text-slate-800 truncate">
                              {staff.fullName}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-1 text-[10.5px] text-slate-600 truncate font-medium">
                          {staff.role}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-emerald-700 font-semibold">
                            @{staff.username}
                          </span>
                          <span className="text-slate-400 text-[9.5px] truncate max-w-[100px]">
                            {staff.department}
                          </span>
                        </div>
                      </button>

                      {/* Quick 1-Click Login Button */}
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectRole(staff)}
                          className="text-[9.5px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          Fill Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(staff)}
                          disabled={isLoading}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Log in instantly as ${staff.fullName}`}
                        >
                          <Zap size={10} className="fill-emerald-600" />
                          Instant Login
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredStaff.length === 0 && (
                  <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                    No predefined accounts match "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      <div className="mt-6 text-center text-xs text-slate-400 max-w-md mx-auto space-y-1">
        <p>© 2026 Health Information Alliance (HIA). HIPAA & SOC2 Compliant.</p>
        <p className="font-mono text-[10px]">Embedded ATIF-HIS Sentinel Core</p>
      </div>
    </div>
  );
}
