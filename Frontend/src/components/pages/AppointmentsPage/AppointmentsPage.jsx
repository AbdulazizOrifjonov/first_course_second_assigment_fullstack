import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Calendar, Clock,
  User, Stethoscope, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../../../api';
import { useAppData } from '../../../context/AppContext/AppContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../context/ToastContext/ToastContext';
import { Modal } from '../../ui/Modal/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog';
import './AppointmentsPage.css';

const STATUS_LABELS = { scheduled: 'Rejalashtirilgan', completed: 'Bajarildi', cancelled: 'Bekor qilindi' };
const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const STATUS_ICONS = {
  scheduled: <Clock size={12} />,
  completed: <CheckCircle size={12} />,
  cancelled: <XCircle size={12} />,
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Sana formatlash: 2025-06-15 → 15 iyun, 2025
function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
  return `${parseInt(day)} ${months[parseInt(m)-1]}, ${y}`;
}

// Hafta kunlari
function getWeekDays(baseDate) {
  const base = new Date(baseDate);
  const day = base.getDay(); // 0=yakshanba
  const monday = new Date(base);
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DAY_NAMES = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

export function AppointmentsPage() {
  const { doctors, patients, appointments, refreshAppointments } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'week'
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [weekBase, setWeekBase] = useState(todayStr());
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    doctorId: '', patientId: '', appointmentDate: todayStr(),
    appointmentTime: '09:00', durationMinutes: 30, notes: '', status: 'scheduled',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState({});

  // Bo'sh slotlarni yuklash
  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate) { setAvailableSlots([]); return; }
    setLoadingSlots(true);
    api.getAvailableSlots(form.doctorId, form.appointmentDate)
      .then(d => {
        setAvailableSlots(d.availableSlots || []);
        // Agar tanlangan vaqt band bo'lsa — birinchi bo'sh slotni tanlang
        if (d.availableSlots && !d.availableSlots.includes(form.appointmentTime)) {
          setForm(prev => ({ ...prev, appointmentTime: d.availableSlots[0] || '09:00' }));
        }
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDate, editAppt?.id]);

  // Filter
  const filtered = useMemo(() => {
    let list = [...appointments];
    if (filterDoctor) list = list.filter(a => a.doctorId === filterDoctor);
    if (filterStatus) list = list.filter(a => a.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const doc = doctors.find(d => d.id === a.doctorId);
        const pat = patients.find(p => p.id === a.patientId);
        return (
          doc && (`${doc.firstName} ${doc.lastName}`).toLowerCase().includes(q) ||
          pat && (`${pat.firstName} ${pat.lastName}`).toLowerCase().includes(q) ||
          a.appointmentDate.includes(q) || a.appointmentTime.includes(q)
        );
      });
    }
    return list.sort((a, b) => {
      const da = `${a.appointmentDate} ${a.appointmentTime}`;
      const db2 = `${b.appointmentDate} ${b.appointmentTime}`;
      return da > db2 ? -1 : 1; // yangi avval
    });
  }, [appointments, filterDoctor, filterStatus, search, doctors, patients]);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const validate = () => {
    const e = {};
    if (!form.doctorId) e.doctorId = 'Shifokor tanlang';
    if (!form.patientId) e.patientId = 'Bemor tanlang';
    if (!form.appointmentDate) e.appointmentDate = 'Sana tanlang';
    if (!form.appointmentTime) e.appointmentTime = 'Vaqt tanlang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = (date) => {
    setEditAppt(null);
    setForm({
      doctorId: doctors[0]?.id || '',
      patientId: '',
      appointmentDate: date || todayStr(),
      appointmentTime: '09:00',
      durationMinutes: 30,
      notes: '',
      status: 'scheduled',
    });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditAppt(a);
    setForm({
      doctorId: a.doctorId,
      patientId: a.patientId,
      appointmentDate: a.appointmentDate,
      appointmentTime: a.appointmentTime,
      durationMinutes: a.durationMinutes,
      notes: a.notes,
      status: a.status,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editAppt) {
        await api.updateAppointment(editAppt.id, form);
        showToast({ type: 'success', title: 'Qabul yangilandi', message: `${form.appointmentDate} ${form.appointmentTime}` });
      } else {
        await api.createAppointment(form);
        showToast({ type: 'success', title: 'Qabul qo\'shildi', message: `${form.appointmentDate} ${form.appointmentTime}` });
      }
      await refreshAppointments();
      setShowForm(false);
    } catch (err) {
      showToast({ type: 'error', title: 'Xato', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAppointment(id);
      await refreshAppointments();
      showToast({ type: 'success', title: 'Qabul o\'chirildi' });
    } catch (err) {
      showToast({ type: 'error', title: 'Xato', message: err.message });
    }
  };

  // Haftalik ko'rinish uchun sana bo'yicha qabullar
  const getApptsByDate = (date) => appointments.filter(a => a.appointmentDate === date);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{appointments.length} ta qabul</p>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              Ro'yxat
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === 'week' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              Hafta
            </button>
          </div>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30"
        >
          <Plus size={18} /> Yangi Qabul
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Shifokor yoki bemor bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <select
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">Barcha shifokorlar</option>
            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">Barcha holatlar</option>
            <option value="scheduled">Rejalashtirilgan</option>
            <option value="completed">Bajarildi</option>
            <option value="cancelled">Bekor qilindi</option>
          </select>
        </div>
      </div>

      {/* HAFTALIK KO'RINISH */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d.toISOString().slice(0,10)); }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
            </span>
            <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d.toISOString().slice(0,10)); }} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {weekDays.map((date, i) => {
              const dayAppts = getApptsByDate(date);
              const isToday = date === todayStr();
              return (
                <div key={date} className={`min-h-[140px] ${isToday ? 'bg-blue-50/60' : ''}`}>
                  <div className={`text-center py-2 border-b border-gray-100 ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    <div className="text-xs">{DAY_NAMES[i]}</div>
                    <div className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto rounded-full flex items-center justify-center ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                      {parseInt(date.slice(8))}
                    </div>
                  </div>
                  <div className="p-1 space-y-1">
                    {dayAppts.slice(0, 4).map(a => {
                      const pat = patients.find(p => p.id === a.patientId);
                      return (
                        <div
                          key={a.id}
                          onClick={() => openEdit(a)}
                          className={`text-xs px-1.5 py-1 rounded-lg cursor-pointer truncate ${STATUS_COLORS[a.status]} hover:opacity-80`}
                          title={`${a.appointmentTime} — ${pat ? pat.firstName + ' ' + pat.lastName : 'Bemor'}`}
                        >
                          {a.appointmentTime} {pat ? pat.firstName : '?'}
                        </div>
                      );
                    })}
                    {dayAppts.length > 4 && <div className="text-xs text-gray-400 pl-1">+{dayAppts.length-4} ta</div>}
                    <button
                      onClick={() => openAdd(date)}
                      className="w-full text-xs text-blue-400 hover:text-blue-600 py-0.5 text-center"
                      title="Qabul qo'shish"
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RO'YXAT KO'RINISH */}
      {viewMode === 'list' && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">Qabul topilmadi</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(a => {
                const doc = doctors.find(d => d.id === a.doctorId);
                const pat = patients.find(p => p.id === a.patientId);
                const isPast = `${a.appointmentDate} ${a.appointmentTime}` < new Date().toISOString().slice(0,16).replace('T',' ');
                return (
                  <div key={a.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-blue-50/30 transition-colors ${isPast && a.status === 'scheduled' ? 'opacity-60' : ''}`}>
                    {/* Vaqt */}
                    <div className="flex-shrink-0 text-center bg-blue-50 rounded-xl px-3 py-2 min-w-[72px]">
                      <p className="text-xs text-blue-400 font-medium">{a.appointmentDate.slice(5).replace('-','/')}</p>
                      <p className="text-sm font-bold text-blue-700">{a.appointmentTime}</p>
                      <p className="text-xs text-blue-400">{a.durationMinutes} daq</p>
                    </div>
                    {/* Shifokor */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {doc ? doc.firstName.charAt(0) : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Dr. {doc ? `${doc.firstName} ${doc.lastName}` : '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{doc?.specialization}</p>
                      </div>
                    </div>
                    {/* Bemor */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {pat ? pat.firstName.charAt(0) : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pat ? `${pat.firstName} ${pat.lastName}` : '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{pat?.phone}</p>
                      </div>
                    </div>
                    {/* Status */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                        {STATUS_ICONS[a.status]} {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* MODAL — Qabul qo'shish/tahrirlash */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editAppt ? 'Qabulni Tahrirlash' : 'Yangi Qabul Rejalashtirish'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shifokor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Shifokor <span className="text-red-500">*</span>
            </label>
            <select
              value={form.doctorId}
              onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.doctorId ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">Shifokorni tanlang</option>
              {doctors.filter(d => d.status === 'active').map(d => (
                <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialization}</option>
              ))}
            </select>
            {errors.doctorId && <p className="text-xs text-red-500 mt-0.5">{errors.doctorId}</p>}
          </div>

          {/* Bemor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bemor <span className="text-red-500">*</span>
            </label>
            <select
              value={form.patientId}
              onChange={e => setForm(p => ({ ...p, patientId: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.patientId ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">Bemorni tanlang</option>
              {patients.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.phone}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-xs text-red-500 mt-0.5">{errors.patientId}</p>}
          </div>

          {/* Sana va Vaqt */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sana <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr()}
                value={form.appointmentDate}
                onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.appointmentDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.appointmentDate && <p className="text-xs text-red-500 mt-0.5">{errors.appointmentDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Vaqt <span className="text-red-500">*</span>
                {loadingSlots && <span className="text-blue-400 ml-1">(yuklanmoqda...)</span>}
              </label>
              {availableSlots.length > 0 ? (
                <select
                  value={form.appointmentTime}
                  onChange={e => setForm(p => ({ ...p, appointmentTime: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.appointmentTime ? 'border-red-400' : 'border-gray-200'}`}
                >
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-orange-50 text-orange-600">
                  {form.doctorId ? (loadingSlots ? 'Yuklanmoqda...' : '❌ Bu kunda bo\'sh vaqt yo\'q') : 'Avval shifokor tanlang'}
                </div>
              )}
              {errors.appointmentTime && <p className="text-xs text-red-500 mt-0.5">{errors.appointmentTime}</p>}
            </div>
          </div>

          {/* Davomiyligi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Davomiyligi</label>
            <select
              value={form.durationMinutes}
              onChange={e => setForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value={15}>15 daqiqa</option>
              <option value={30}>30 daqiqa</option>
              <option value={45}>45 daqiqa</option>
              <option value={60}>60 daqiqa (1 soat)</option>
            </select>
          </div>

          {/* Tahrirlashda status */}
          {editAppt && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Holat</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="scheduled">Rejalashtirilgan</option>
                <option value="completed">Bajarildi</option>
                <option value="cancelled">Bekor qilindi</option>
              </select>
            </div>
          )}

          {/* Izoh */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
              placeholder="Qo'shimcha ma'lumot..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50">
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={availableSlots.length === 0 && !editAppt}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editAppt ? 'Saqlash' : 'Rejalashtirish'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Qabulni O'chirish"
        message="Bu qabulni o'chirishni xohlaysizmi?"
      />
    </div>
  );
}
