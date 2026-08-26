/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import ClinicianDashboards from './components/ClinicianDashboards';
import SecuritySOCDashboard from './components/SecuritySOCDashboard';
import ITParametersDashboard from './components/ITParametersDashboard';
import { HospitalRole, StaffUser, Patient, SecurityEvent, ThreatIncident, SecurityPosture, UserBehaviorProfile, ThreatFeedItem } from './types';
import { DEFAULT_STAFF_ROSTER } from './data/defaultStaff';
import { 
  DEFAULT_PATIENTS_ROSTER, 
  DEFAULT_SECURITY_POSTURE, 
  DEFAULT_INCIDENTS, 
  DEFAULT_EVENTS, 
  DEFAULT_PROFILES, 
  DEFAULT_FEED 
} from './data/defaultData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  // Default to DEFAULT_STAFF_ROSTER so predefined accounts are always populated immediately
  const [staffList, setStaffList] = useState<StaffUser[]>(DEFAULT_STAFF_ROSTER);
  const [patients, setPatients] = useState<Patient[]>(DEFAULT_PATIENTS_ROSTER);
  
  // Security telemetries State with immediate default fallbacks
  const [events, setEvents] = useState<SecurityEvent[]>(DEFAULT_EVENTS);
  const [incidents, setIncidents] = useState<ThreatIncident[]>(DEFAULT_INCIDENTS);
  const [posture, setPosture] = useState<SecurityPosture | null>(DEFAULT_SECURITY_POSTURE);
  const [profiles, setProfiles] = useState<UserBehaviorProfile[]>(DEFAULT_PROFILES);
  const [feed, setFeed] = useState<ThreatFeedItem[]>(DEFAULT_FEED);

  // Errors state
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize initial session and roster parameters
  useEffect(() => {
    checkActiveSession();
    fetchStaffList();
  }, []);

  // Fetch telemetry loops on active logged-in user changes
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      // Establish an action interval ticker to fetch SIEM feeds rapidly
      const timer = setInterval(() => {
        fetchSecurityMetrics();
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [currentUser]);

  const fetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const checkActiveSession = async () => {
    try {
      const data = await fetchJson('/api/auth/session');
      if (data) {
        const activeUser = data.user || data.session;
        if (activeUser) {
          setCurrentUser(activeUser);
        }
      }
    } catch (e) {
      console.warn("Session verification fault:", e);
    }
  };

  const fetchStaffList = async () => {
    try {
      const data = await fetchJson('/api/staff');
      if (data && data.staff && data.staff.length > 0) {
        setStaffList(data.staff);
      }
    } catch (e) {
      console.warn("Failed to recover staff members roster from server, keeping default roster:", e);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await fetchJson('/api/patients');
      if (data && data.patients && data.patients.length > 0) {
        setPatients(data.patients);
      }
    } catch (e) {
      console.warn("Failed to recover patients directory from server, keeping default directory:", e);
    }
  };

  const fetchSecurityMetrics = async () => {
    try {
      const p1 = fetchJson('/api/security/events');
      const p2 = fetchJson('/api/security/incidents');
      const p3 = fetchJson('/api/security/posture');
      const p4 = fetchJson('/api/security/profiles');
      const p5 = fetchJson('/api/security/threat-feed');

      const [rEvents, rIncidents, rPosture, rProfiles, rFeed] = await Promise.all([p1, p2, p3, p4, p5]);
      
      if (rEvents && rEvents.events) setEvents(rEvents.events);
      if (rIncidents && rIncidents.incidents) setIncidents(rIncidents.incidents);
      if (rPosture && rPosture.posture) setPosture(rPosture.posture);
      if (rProfiles && rProfiles.profiles) setProfiles(rProfiles.profiles);
      if (rFeed && rFeed.feed) setFeed(rFeed.feed);
    } catch (e) {
      console.warn("Telemetry pipeline sync fault (handled):", e);
    }
  };

  const fetchAllData = () => {
    if (currentUser && currentUser.role !== HospitalRole.SECURITY_ANALYST && currentUser.role !== HospitalRole.IT_ADMIN) {
      fetchPatients();
    }
    fetchStaffList();
    fetchSecurityMetrics();
  };

  // Perform secure login action with full server and client-side fallback support
  const handleLogin = async (username: string, password: string, deviceName: string, ipAddress: string, failedAttempts: number) => {
    setLoginError(null);
    const cleanUsername = username.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password,
          deviceName,
          ipAddress,
          failedAttemptsInput: failedAttempts
        })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user || data.session);
          return;
        } else if (res.status === 401 || res.status === 403) {
          setLoginError(data.error || "Authentication declined by secure boundary.");
          return;
        }
      }
    } catch (e: any) {
      console.warn("Server auth endpoint unavailable, applying fallback client authentication:", e);
    }

    // Client-side fallback authentication for Vercel and offline deployments
    const effectiveStaff = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF_ROSTER;
    const staff = effectiveStaff.find(
      s => s.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (staff) {
      if (staff.status === "Suspended") {
        setLoginError("This user account is currently suspended by IT Administration.");
        return;
      }
      
      const expectedPassword = staff.password || staff.username;
      if (password && password !== expectedPassword && password !== staff.username) {
        setLoginError("Invalid credentials: Incorrect password PIN.");
        return;
      }

      const fallbackUser = {
        userId: staff.id,
        username: staff.username,
        fullName: staff.fullName,
        role: staff.role,
        department: staff.department,
        ipAddress: ipAddress || (staff.typicalIps && staff.typicalIps[0]) || '10.20.1.15',
        deviceName: deviceName || (staff.typicalDevices && staff.typicalDevices[0]) || 'Clinic Desk PC-11'
      };

      setCurrentUser(fallbackUser);
      setLoginError(null);
    } else {
      setLoginError(`Invalid identification token "@${cleanUsername}". Please select a predefined account below.`);
    }
  };

  // Switch Active role user (seamless evaluation switch)
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user || data.session);
          return;
        }
      }
    } catch (e) {
      console.warn("Server switch endpoint unavailable, applying client-side role switch:", e);
    }

    // Client-side fallback role switch
    const effectiveStaff = staffList && staffList.length > 0 ? staffList : DEFAULT_STAFF_ROSTER;
    const staff = effectiveStaff.find(s => s.id === userId || s.username === userId);
    if (staff) {
      setCurrentUser({
        userId: staff.id,
        username: staff.username,
        fullName: staff.fullName,
        role: staff.role,
        department: staff.department,
        ipAddress: (staff.typicalIps && staff.typicalIps[0]) || '10.20.1.15',
        deviceName: (staff.typicalDevices && staff.typicalDevices[0]) || 'Clinic Desk PC-11',
        isSwitched: true
      });
    }
  };

  // Clear Session
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Server logout notification skipped:", e);
    }
    setCurrentUser(null);
    setLoginError(null);
  };

  return (
    <div id="atif-root">
      {currentUser ? (
        <Layout 
          currentUser={currentUser} 
          staffList={staffList} 
          onSwitchUser={handleSwitchUser} 
          onLogout={handleLogout}
        >
          {/* Direct dynamic routing pivot based on active role credentials */}
          {currentUser.role === HospitalRole.SECURITY_ANALYST ? (
            <SecuritySOCDashboard 
              posture={posture}
              incidents={incidents}
              events={events}
              profiles={profiles}
              feed={feed}
              onRefresh={fetchAllData}
              currentUser={currentUser}
              patients={patients}
            />
          ) : currentUser.role === HospitalRole.IT_ADMIN ? (
            <ITParametersDashboard 
              staffMembers={staffList}
              currentUser={currentUser}
              onRefresh={fetchAllData}
              posture={posture}
              incidentsCount={incidents.filter(i => i.status === "Open" || i.status === "Investigating").length}
              eventsCount={events.length}
              incidents={incidents}
              events={events}
              patients={patients}
            />
          ) : (
            // standard Clinical/Administrative worker
            <ClinicianDashboards 
              activeRole={currentUser.role}
              currentUser={currentUser}
              patients={patients}
              onRefreshPatients={fetchPatients}
            />
          )}
        </Layout>
      ) : (
        <Login 
          staffMembers={staffList} 
          onLogin={handleLogin} 
          errorMessage={loginError}
        />
      )}
    </div>
  );
}
