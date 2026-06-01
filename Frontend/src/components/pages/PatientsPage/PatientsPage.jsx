import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Phone, Mail,
  Calendar, MapPin, Eye, Filter, Users, Clock
} from 'lucide-react';
import { api } from '../../../api';
import { useAppData } from '../../../context/AppContext/AppContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../context/ToastContext/ToastContext';
import { Modal } from '../../ui/Modal/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog';
import { StatusBadge, SeverityBadge, GenderBadge } from '../../ui/Badge/Badge';
import { getFirstBookableDateStr, isAppointmentSlotAllowed } from '../../../utils/appointmentRules';
import './PatientsPage.css';

const emptyForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'male',
  email: '',
  phone: '',
  address: '',
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '',
};

function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

// Enter bosganda keyingi inputga o'tish
function handleEnterKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const focusable = Array.from(
      form.querySelectorAll('input, select, textarea, button[type="submit"]')
    ).filter(el => !el.hasAttribute('disabled'));
    const idx = focusable.indexOf(e.currentTarget);
    if (idx >= 0 && idx < focusable.length - 1) {
      focusable[idx + 1].focus();
    }
  }
}

// Field komponenti — render funksiyasidan TASHQARIDA (fokus yo'qolmasin)

function PatientField({ label, name, type = 'text', required, form, errors, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => onChange(name, e.target.value)}
        onKeyDown={handleEnterKey}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 transition ${errors[name] ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );
}

export function PatientsPage() {
  const { doctors, patients, illnesses, refreshPatients, refreshIllnesses, refreshAppointments } = useAppData();
  const { user, canDelete, isAdmin, isClinician } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [viewPatient, setViewPatient] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const canWrite = isAdmin || isClinician;

  // Shifokor va sana tanlanganda bo'sh slotlarni yuklash (faqat yangi bemor)
  useEffect(() => {
    if (editPatient || !showForm || !form.doctorId || !form.appointmentDate) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    api.getAvailableSlots(form.doctorId, form.appointmentDate)
      .then((d) => {
        const slots = d.availableSlots || [];
        setAvailableSlots(slots);
        if (slots.length > 0 && !slots.includes(form.appointmentTime)) {
          setForm(prev => ({ ...prev, appointmentTime: slots[0] }));
        } else if (slots.length === 0) {
          setForm(prev => ({ ...prev, appointmentTime: '' }));
        }
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [editPatient, showForm, form.doctorId, form.appointmentDate]);

  const handleFieldChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q)
      );
    }
    if (filterDoctor) list = list.filter(p => p.doctorId === filterDoctor);
    if (filterGender) list = list.filter(p => p.gender === filterGender);
    return list;
  }, [patients, search, filterDoctor, filterGender]);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Ism kiritilishi shart";
    if (!form.lastName.trim()) e.lastName = "Familiya kiritilishi shart";
    if (!form.dateOfBirth) e.dateOfBirth = "Tug'ilgan sana shart";
    if (!form.phone.trim()) e.phone = "Telefon shart";
    if (!form.doctorId) e.doctorId = "Shifokor tanlanishi shart";
    if (!editPatient) {
      if (!form.appointmentDate) e.appointmentDate = "Qabul sanasi tanlanishi shart";
      if (!form.appointmentTime) e.appointmentTime = "Qabul vaqti tanlanishi shart";
      else if (!isAppointmentSlotAllowed(form.appointmentDate, form.appointmentTime)) {
        e.appointmentTime = "Qabul faqat hozirdan kamida 30 soat 30 daqiqa keyin belgilash mumkin";
      } else if (!availableSlots.includes(form.appointmentTime)) {
        e.appointmentTime = "Bu vaqt band. Boshqa vaqt tanlang";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setEditPatient(null);
    setForm({
      ...emptyForm,
      doctorId: doctors.find(d => d.status === 'active')?.id || '',
      appointmentDate: getFirstBookableDateStr(),
      appointmentTime: '',
    });
    setAvailableSlots([]);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditPatient(p);
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      email: p.email,
      phone: p.phone,
      address: p.address,
      doctorId: p.doctorId,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { appointmentDate, appointmentTime, ...patientFields } = form;
    const payload = {
      ...patientFields,
      bloodType: '',
      emergencyContact: '',
      emergencyPhone: '',
      status: 'active',
    };
    try {
      if (editPatient) {
        await api.updatePatient(editPatient.id, payload);
        showToast({
          type: 'success',
          title: 'Bemor ma\'lumotlari yangilandi',
          message: `${form.firstName} ${form.lastName} saqlandi.`,
        });
      } else {
        const patient = await api.createPatient(payload);
        await api.createAppointment({
          doctorId: form.doctorId,
          patientId: patient.id,
          appointmentDate,
          appointmentTime,
          durationMinutes: 30,
          notes: "Bemor ro'yxatga olish paytida belgilangan qabul",
        });
        showToast({
          type: 'success',
          title: user?.role === 'receptionist' ? 'Qabuldan yangi bemor keldi' : 'Bemor qo\'shildi',
          message: `${form.firstName} ${form.lastName} ro'yxatga olindi. Qabul: ${appointmentDate} ${appointmentTime}`,
        });
      }
      await refreshPatients();
      if (!editPatient) await refreshAppointments();
      setShowForm(false);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Amal bajarilmadi',
        message: err instanceof Error ? err.message : 'Bemorni saqlashda xatolik yuz berdi.',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePatient(id);
      await refreshPatients();
      await refreshIllnesses();
      showToast({
        type: 'success',
        title: 'Bemor o\'chirildi',
        message: 'Bemor va unga bog\'liq tashxislar o\'chirildi.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'O\'chirish bajarilmadi',
        message: err instanceof Error ? err.message : 'Bemorni o\'chirishda xatolik yuz berdi.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-gray-500">{patients.length} ta bemor ro'yxatda</p>
        {(isAdmin || user?.role === 'receptionist') && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/30"
          >
            <Plus size={18} /> Yangi Bemor
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Bemor qidirish (ism, email, telefon)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
          <select
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha shifokorlar</option>
            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
          </select>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha jinslar</option>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
          </select>
        </div>
        {(search || filterDoctor || filterGender) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Filter size={12} />
            <span>{filtered.length} ta natija</span>
            <button onClick={() => { setSearch(''); setFilterDoctor(''); setFilterGender(''); }} className="text-green-600 hover:underline ml-1">Tozalash</button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Users className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Bemor topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map(p => {
              const doctor = doctors.find(d => d.id === p.doctorId);
              const pIllnesses = illnesses.filter(i => i.patientId === p.id);
              const age = p.dateOfBirth ? calculateAge(p.dateOfBirth) : '?';
              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {p.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm break-safe">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-500 break-safe">{p.email || p.phone}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-gray-50 p-2">
                      <p className="text-gray-400">Yosh / jins</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="font-semibold text-gray-700">{age} yosh</span>
                        <GenderBadge gender={p.gender} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <p className="text-gray-400">Shifokor</p>
                      <p className="mt-1 font-semibold text-gray-700 break-safe">{doctor ? `Dr. ${doctor.lastName}` : '-'}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <p className="text-gray-400">Tashxislar</p>
                      <p className="mt-1 font-semibold text-green-700">{pIllnesses.length} ta</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setViewPatient(p); setShowDetail(true); }} className="p-2 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors" title="Ko'rish">
                      <Eye size={16} />
                    </button>
                    {canWrite && (
                      <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Tahrirlash">
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="O'chirish">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Bemor</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Yosh / Jins</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Shifokor</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tashxislar</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Holat</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const doctor = doctors.find(d => d.id === p.doctorId);
                  const pIllnesses = illnesses.filter(i => i.patientId === p.id);
                  const age = p.dateOfBirth ? calculateAge(p.dateOfBirth) : '?';
                  return (
                    <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {p.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-gray-400">{p.email || p.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-sm text-gray-700 mb-1">{age} yosh</p>
                        <GenderBadge gender={p.gender} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-gray-700 font-medium">{doctor ? `Dr. ${doctor.lastName}` : '—'}</p>
                        <p className="text-xs text-gray-400">{doctor?.specialization}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-sm font-medium text-green-700 bg-green-50 rounded-lg px-2.5 py-1">{pIllnesses.length} ta</span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setViewPatient(p); setShowDetail(true); }} className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Ko'rish">
                            <Eye size={15} />
                          </button>
                          {canWrite && (
                            <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Tahrirlash">
                              <Edit size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="O'chirish">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editPatient ? 'Bemor Tahrirlash' : "Yangi Bemor Ro'yxatga Olish"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <PatientField label="Ism" name="firstName" required form={form} errors={errors} onChange={handleFieldChange} />
            <PatientField label="Familiya" name="lastName" required form={form} errors={errors} onChange={handleFieldChange} />
            <PatientField label="Tug'ilgan sana" name="dateOfBirth" type="date" required form={form} errors={errors} onChange={handleFieldChange} />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Jins <span className="text-red-500">*</span></label>
              <select
                value={form.gender}
                onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Biriktirilgan Shifokor <span className="text-red-500">*</span></label>
              <select
                value={form.doctorId}
                onChange={e => setForm(prev => ({
                  ...prev,
                  doctorId: e.target.value,
                  appointmentTime: '',
                }))}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.doctorId ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Shifokorni tanlang</option>
                {doctors.filter(d => d.status === 'active').map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialization})</option>
                ))}
              </select>
              {errors.doctorId && <p className="text-xs text-red-500 mt-0.5">{errors.doctorId}</p>}
            </div>
            {!editPatient && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qabul Sanasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={getFirstBookableDateStr()}
                    value={form.appointmentDate}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      appointmentDate: e.target.value,
                      appointmentTime: '',
                    }))}
                    onKeyDown={handleEnterKey}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.appointmentDate ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.appointmentDate && <p className="text-xs text-red-500 mt-0.5">{errors.appointmentDate}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">Kamida 30 soat 30 daqiqa keyin</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qabul Vaqti <span className="text-red-500">*</span>
                    {loadingSlots && <span className="text-green-500 ml-1">(yuklanmoqda...)</span>}
                  </label>
                  {form.doctorId && form.appointmentDate ? (
                    availableSlots.length > 0 ? (
                      <select
                        value={form.appointmentTime}
                        onChange={e => setForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.appointmentTime ? 'border-red-400' : 'border-gray-200'}`}
                      >
                        <option value="">Vaqtni tanlang</option>
                        {availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-orange-50 text-orange-600 flex items-center gap-2">
                        <Clock size={14} />
                        {loadingSlots ? 'Yuklanmoqda...' : "Bu kunda bo'sh vaqt yo'q"}
                      </div>
                    )
                  ) : (
                    <div className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400">
                      Avval shifokor va sanani tanlang
                    </div>
                  )}
                  {errors.appointmentTime && <p className="text-xs text-red-500 mt-0.5">{errors.appointmentTime}</p>}
                </div>
              </>
            )}
            <PatientField label="Email" name="email" type="email" form={form} errors={errors} onChange={handleFieldChange} />
            <PatientField label="Telefon" name="phone" required form={form} errors={errors} onChange={handleFieldChange} />
            <div className="md:col-span-3">
              <PatientField label="Manzil" name="address" form={form} errors={errors} onChange={handleFieldChange} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50">
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!editPatient && form.doctorId && form.appointmentDate && !loadingSlots && availableSlots.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editPatient ? 'Saqlash' : "Ro'yxatga Olish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail View Modal */}
      {viewPatient && (
        <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Bemor Tafsilotlari" size="lg">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {viewPatient.firstName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 break-safe">{viewPatient.firstName} {viewPatient.lastName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-sm">{calculateAge(viewPatient.dateOfBirth)} yosh</span>
                  <GenderBadge gender={viewPatient.gender} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={viewPatient.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Telefon", value: viewPatient.phone, icon: Phone },
                { label: "Email", value: viewPatient.email || '—', icon: Mail },
                { label: "Manzil", value: viewPatient.address || '—', icon: MapPin },
                { label: "Tug'ilgan sana", value: viewPatient.dateOfBirth, icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="text-green-600" />
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-safe">{value}</p>
                </div>
              ))}
            </div>
            {(() => {
              const doc = doctors.find(d => d.id === viewPatient.doctorId);
              return doc ? (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-semibold mb-1">Biriktirilgan Shifokor</p>
                  <p className="text-sm font-bold text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                  <p className="text-xs text-gray-500">{doc.specialization} • {doc.department}</p>
                </div>
              ) : null;
            })()}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Tashxis Tarixi ({illnesses.filter(i => i.patientId === viewPatient.id).length} ta)</p>
              <div className="space-y-2">
                {illnesses.filter(i => i.patientId === viewPatient.id).map(ill => (
                  <div key={ill.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">{ill.icdCode}</span>
                        <p className="text-sm font-medium text-gray-900 mt-1 break-safe">{ill.description}</p>
                      </div>
                      <SeverityBadge severity={ill.severity} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{ill.diagnosisDate}</p>
                  </div>
                ))}
                {illnesses.filter(i => i.patientId === viewPatient.id).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Tashxis yo'q</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Bemorni O'chirish"
        message="Bu bemorni o'chirishni xohlaysizmi? Uning barcha tashxislari ham o'chib ketadi!"
      />
    </div>
  );
}
