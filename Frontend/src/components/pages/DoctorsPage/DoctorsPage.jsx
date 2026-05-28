import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, Phone, Mail, Award,
  Building, UserCheck, Eye, Filter
} from 'lucide-react';
import { api } from '../../../api';
import { useAppData } from '../../../context/AppContext/AppContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../context/ToastContext/ToastContext';
import { Modal } from '../../ui/Modal/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog';
import { StatusBadge, GenderBadge } from '../../ui/Badge/Badge';
import './DoctorsPage.css';

const SPECIALIZATIONS = [
  'Kardiologiya', 'Nevrologiya', 'Dermatologiya', 'Ortopediya',
  'Umumiy Amaliyot', 'Pediatriya', 'Ginekologiya', 'Onkologiya',
  'Endokrinologiya', 'Pulmonologiya', 'Gastroenterologiya', 'Urologiya',
];

const DEPARTMENTS = [
  "Kardiologiya Bo'limi", "Nevrologiya Bo'limi", "Dermatologiya Bo'limi",
  "Ortopediya Bo'limi", "Umumiy Amaliyot Bo'limi", "Pediatriya Bo'limi",
  "Ginekologiya Bo'limi", "Diagnostika Bo'limi",
];

const emptyForm = {
  firstName: '',
  lastName: '',
  specialization: SPECIALIZATIONS[0],
  department: DEPARTMENTS[0],
  email: '',
  phone: '',
  licenseNumber: '',
  status: 'active',
};

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

function DoctorField({ label, name, type = 'text', required, form, errors, onChange }) {
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
        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-gray-50 ${errors[name] ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );
}

export function DoctorsPage() {
  const { doctors, patients, refreshDoctors } = useAppData();
  const { canManageDoctors } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const handleFieldChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const filtered = useMemo(() => {
    let list = [...doctors];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
      );
    }
    if (filterSpec) list = list.filter(d => d.specialization === filterSpec);
    if (filterStatus) list = list.filter(d => d.status === filterStatus);
    return list;
  }, [doctors, search, filterSpec, filterStatus]);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Ism kiritilishi shart";
    if (!form.lastName.trim()) e.lastName = "Familiya kiritilishi shart";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "To'g'ri email kiriting";
    if (!form.phone.trim()) e.phone = "Telefon kiritilishi shart";
    if (!form.licenseNumber.trim()) e.licenseNumber = "Litsenziya raqami kiritilishi shart";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setEditDoctor(null);
    setForm(emptyForm);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditDoctor(doc);
    setForm({
      firstName: doc.firstName,
      lastName: doc.lastName,
      specialization: doc.specialization,
      department: doc.department,
      email: doc.email,
      phone: doc.phone,
      licenseNumber: doc.licenseNumber,
      status: doc.status,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editDoctor) {
        await api.updateDoctor(editDoctor.id, form);
        showToast({
          type: 'success',
          title: "Shifokor ma'lumotlari yangilandi",
          message: `Dr. ${form.firstName} ${form.lastName} saqlandi.`,
        });
      } else {
        await api.createDoctor(form);
        showToast({
          type: 'success',
          title: "Shifokor qo'shildi",
          message: `Dr. ${form.firstName} ${form.lastName} ro'yxatga qo'shildi.`,
        });
      }
      await refreshDoctors();
      setShowForm(false);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Amal bajarilmadi',
        message: err instanceof Error ? err.message : 'Shifokorni saqlashda xatolik yuz berdi.',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDoctor(id);
      await refreshDoctors();
      setDeleteId(null);
      showToast({
        type: 'success',
        title: "Shifokor o'chirildi",
        message: "Shifokor ro'yxatdan olib tashlandi.",
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: "O'chirish bajarilmadi",
        message: err instanceof Error ? err.message : "Shifokorni o'chirishda xatolik yuz berdi.",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{doctors.length} ta shifokor ro'yxatda</p>
        </div>
        {canManageDoctors && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/30"
          >
            <Plus size={18} /> Yangi Shifokor
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
              placeholder="Shifokor qidirish (ism, mutaxassislik, email)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
          <select
            value={filterSpec}
            onChange={e => setFilterSpec(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha mutaxassisliklar</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
        {(search || filterSpec || filterStatus) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Filter size={12} />
            <span>{filtered.length} ta natija topildi</span>
            <button onClick={() => { setSearch(''); setFilterSpec(''); setFilterStatus(''); }} className="text-green-600 hover:underline ml-1">Tozalash</button>
          </div>
        )}
      </div>

      {/* Doctors Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <UserCheck className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Shifokor topilmadi</p>
          <p className="text-gray-400 text-sm mt-1">Qidiruv shartlarini o'zgartiring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const patientCount = patients.filter(p => p.doctorId === doc.id).length;
            const maleCount = patients.filter(p => p.doctorId === doc.id && p.gender === 'male').length;
            const femaleCount = patients.filter(p => p.doctorId === doc.id && p.gender === 'female').length;
            return (
              <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/20 flex-shrink-0">
                      {doc.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight break-safe">Dr. {doc.firstName} {doc.lastName}</h3>
                      <p className="text-xs text-green-600 font-medium mt-0.5 break-safe">{doc.specialization}</p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doc.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={13} className="text-gray-400 flex-shrink-0" />
                    <span>{doc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Award size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{doc.licenseNumber}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">👥 {patientCount} bemor</span>
                    <div className="flex items-center gap-1.5">
                      <GenderBadge gender="male" />
                      <span className="text-xs font-bold text-gray-700">{maleCount}</span>
                      <GenderBadge gender="female" />
                      <span className="text-xs font-bold text-gray-700">{femaleCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setViewDoctor(doc); setShowDetail(true); }} className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                      <Eye size={16} />
                    </button>
                    {canManageDoctors && (
                      <>
                        <button onClick={() => openEdit(doc)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteId(doc.id)} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editDoctor ? 'Shifokorni Tahrirlash' : "Yangi Shifokor Qo'shish"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DoctorField label="Ism" name="firstName" required form={form} errors={errors} onChange={handleFieldChange} />
            <DoctorField label="Familiya" name="lastName" required form={form} errors={errors} onChange={handleFieldChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mutaxassislik <span className="text-red-500">*</span></label>
              <select
                value={form.specialization}
                onChange={e => setForm(prev => ({ ...prev, specialization: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bo'lim <span className="text-red-500">*</span></label>
              <select
                value={form.department}
                onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <DoctorField label="Email" name="email" type="email" required form={form} errors={errors} onChange={handleFieldChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DoctorField label="Telefon" name="phone" required form={form} errors={errors} onChange={handleFieldChange} />
            <DoctorField label="Litsenziya Raqami" name="licenseNumber" required form={form} errors={errors} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Holat</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            >
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
              Bekor qilish
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/20">
              {editDoctor ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      {viewDoctor && (
        <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Shifokor Profili" size="md">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {viewDoctor.firstName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 break-safe">Dr. {viewDoctor.firstName} {viewDoctor.lastName}</h3>
                <p className="text-green-600 font-medium text-sm break-safe">{viewDoctor.specialization}</p>
                <StatusBadge status={viewDoctor.status} />
              </div>
            </div>
            {[
              { label: "Bo'lim", value: viewDoctor.department, icon: Building },
              { label: "Email", value: viewDoctor.email, icon: Mail },
              { label: "Telefon", value: viewDoctor.phone, icon: Phone },
              { label: "Litsenziya", value: viewDoctor.licenseNumber, icon: Award },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon size={18} className="text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 break-safe">{value}</p>
                </div>
              </div>
            ))}
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Biriktirilgan bemorlar</p>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {patients.filter(p => p.doctorId === viewDoctor.id).length}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <GenderBadge gender="male" />
                  <span className="text-sm font-semibold text-gray-700">{patients.filter(p => p.doctorId === viewDoctor.id && p.gender === 'male').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GenderBadge gender="female" />
                  <span className="text-sm font-semibold text-gray-700">{patients.filter(p => p.doctorId === viewDoctor.id && p.gender === 'female').length}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Shifokorni O'chirish"
        message="Bu shifokorni o'chirishni xohlaysizmi? Bu amal qaytarib bo'lmaydi."
      />
    </div>
  );
}
