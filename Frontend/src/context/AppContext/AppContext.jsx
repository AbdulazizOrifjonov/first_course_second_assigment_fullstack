import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../AuthContext/AuthContext';
import { getToken } from '../../api/client';

const AppContext = createContext(null);



export function AppProvider({ children }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [illnesses, setIllnesses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshDoctors = useCallback(async () => {
    if (!getToken()) return;
    const data = await api.getDoctors();
    setDoctors(data);
  }, []);

  const refreshPatients = useCallback(async () => {
    if (!getToken()) return;
    const data = await api.getPatients();
    setPatients(data);
  }, []);

  const refreshIllnesses = useCallback(async () => {
    if (!getToken()) return;
    const data = await api.getIllnesses();
    setIllnesses(data);
  }, []);

  const refreshAppointments = useCallback(async () => {
    if (!getToken()) return;
    const data = await api.getAppointments();
    setAppointments(data);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshDoctors(),
        refreshPatients(),
        refreshIllnesses(),
        refreshAppointments(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [refreshDoctors, refreshPatients, refreshIllnesses, refreshAppointments]);

  useEffect(() => {
    if (user && getToken()) {
      refreshAll();
    } else {
      setDoctors([]);
      setPatients([]);
      setIllnesses([]);
      setAppointments([]);
    }
  }, [user, refreshAll]);

  return (
    <AppContext.Provider value={{
      doctors, patients, illnesses, appointments,
      loading, error,
      refreshDoctors, refreshPatients, refreshIllnesses, refreshAppointments, refreshAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
