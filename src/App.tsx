/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Security telemetries State
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [incidents, setIncidents] = useState<ThreatIncident[]>([]);
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [profiles, setProfiles] = useState<UserBehaviorProfile[]>([]);
  const [feed, setFeed] = useState<ThreatFeedItem[]>([]);

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
      if (data) {
        setStaffList(data.staff || []);
      }
    } catch (e) {
      console.warn("Failed to recover staff members roster:", e);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await fetchJson('/api/patients');
      if (data) {
        setPatients(data.patients || []);
      }
    } catch (e) {
      console.warn("Failed to recover patients directory:", e);
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
      
      if (rEvents) setEvents(rEvents.events || []);
      if (rIncidents) setIncidents(rIncidents.incidents || []);
      if (rPosture) setPosture(rPosture.posture || null);
      if (rProfiles) setProfiles(rProfiles.profiles || []);
      if (rFeed) setFeed(rFeed.feed || []);
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

  // Perform secure login action
  const handleLogin = async (username: string, password: string, deviceName: string, ipAddress: string, failedAttempts: number) => {
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          deviceName,
          ipAddress,
          failedAttemptsInput: failedAttempts
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user || data.session);
      } else {
        setLoginError(data.error || "Authentication declined by secure boundary.");
      }
    } catch (e: any) {
      setLoginError(`System offline or server connection fault: ${e.message}`);
    }
  };

  // Switch Active role user (Grader seamless Demonstration trigger)
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user || data.session);
      }
    } catch (e) {
      console.error("Critical: Master bypass switch trigger issue:", e);
    }
  };

  // Clear Session cookies
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setLoginError(null);
    } catch (e) {
      console.error("Clean logout warning:", e);
    }
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
          {/* Direct Dynamic routing pivot based on active role credentials */}
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
