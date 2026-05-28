import { apiRequest, setToken } from './client';

export const api = {
  // ========== AUTH ==========
  async login(username, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    sessionStorage.setItem('tybt_session', JSON.stringify(data.user));
    return data;
  },
  async changePassword(currentPassword, newPassword) {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  async getUserCredentials() {
    return apiRequest('/auth/users/credentials');
  },
  async getMe() {
    return apiRequest('/auth/me');
  },

  // ========== DOCTORS ==========
  async getDoctors(search) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/doctors${qs}`);
  },
  async createDoctor(data) {
    return apiRequest('/doctors', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateDoctor(id, data) {
    return apiRequest(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteDoctor(id) {
    return apiRequest(`/doctors/${id}`, { method: 'DELETE' });
  },

  // ========== PATIENTS ==========
  async getPatients(search, doctorId) {
    const p = new URLSearchParams();
    if (search) p.append('search', search);
    if (doctorId) p.append('doctorId', doctorId);
    return apiRequest(`/patients${p.toString() ? '?' + p : ''}`);
  },
  async createPatient(data) {
    return apiRequest('/patients', { method: 'POST', body: JSON.stringify(data) });
  },
  async updatePatient(id, data) {
    return apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deletePatient(id) {
    return apiRequest(`/patients/${id}`, { method: 'DELETE' });
  },

  // ========== ILLNESSES ==========
  async getIllnesses(search, patientId) {
    const p = new URLSearchParams();
    if (search) p.append('search', search);
    if (patientId) p.append('patientId', patientId);
    return apiRequest(`/illnesses${p.toString() ? '?' + p : ''}`);
  },
  async createIllness(data) {
    return apiRequest('/illnesses', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateIllness(id, data) {
    return apiRequest(`/illnesses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteIllness(id) {
    return apiRequest(`/illnesses/${id}`, { method: 'DELETE' });
  },

  // ========== APPOINTMENTS ==========
  async getAppointments(params = {}) {
    const p = new URLSearchParams();
    if (params.doctorId) p.append('doctorId', params.doctorId);
    if (params.patientId) p.append('patientId', params.patientId);
    if (params.date) p.append('date', params.date);
    return apiRequest(`/appointments${p.toString() ? '?' + p : ''}`);
  },
  async getAvailableSlots(doctorId, date) {
    return apiRequest(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
  },
  async createAppointment(data) {
    return apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateAppointment(id, data) {
    return apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteAppointment(id) {
    return apiRequest(`/appointments/${id}`, { method: 'DELETE' });
  },

  // ========== AUDIT ==========
  async getAuditLogs() {
    return apiRequest('/audit');
  },
};
