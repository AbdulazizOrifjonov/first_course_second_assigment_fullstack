import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Edit, Trash2, Stethoscope, Filter,
  Calendar
} from 'lucide-react';
import { api } from '../../../api';
import { useAppData } from '../../../context/AppContext/AppContext';
import { useAuth } from '../../../context/AuthContext/AuthContext';

// import { useToast } from '../../../context/ToastContext/ToastContext';
import { Modal } from '../../ui/Modal/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog';
import { SeverityBadge, StatusBadge, GenderBadge } from '../../ui/Badge/Badge';
import './IllnessesPage.css';

const emptyForm = {
  patientId: '',
  icdCode: '',
  description: '',
  severity: 'mild',
  diagnosisDate: new Date().toISOString().split('T')[0],
  status: 'active',
  notes: '',
};

// Common ICD codes for quick selection
const COMMON_ICD = [
  { code: 'I21.0', desc: "O'tkir miokard infarkti" },
  { code: 'I10', desc: 'Gipertoniya' },
  { code: 'E11.9', desc: 'Qandli diabet II tur' },
  { code: 'J06.9', desc: "Yuqori nafas yo'llari infeksiyasi" },
  { code: 'G43.9', desc: 'Migren' },
  { code: 'M17.1', desc: 'Osteoartrit' },
  { code: 'L20.9', desc: 'Atopik dermatit' },
  { code: 'K21.0', desc: 'Gastroezofageal reflux' },
  { code: 'F32.9', desc: 'Depressiv epizod' },
  { code: 'J45.9', desc: 'Bronxial astma' },
];

// Enter bosganda keyingi inputga o'tish
function handleEnterKey(e) {
  if (e.key === 'Enter' && e.currentTarget.tagName === 'INPUT') {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const focusable = Array.from(
      form.querySelectorAll('input, select, textarea, button[type="submit"]')
    ).filter(el => !el.hasAttribute('disabled'));
    const idx = focusable.indexOf(e.currentTarget);
    if (idx >= 0 && idx < focusable.length - 1) focusable[idx + 1].focus();
  }
}

export function IllnessesPage() {
  const { doctors, patients, illnesses, refreshIllnesses } = useAppData();
  const { isAdmin, isClinician, canDelete } = useAuth();

  const canWrite = isAdmin || isClinician;

  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editIllness, setEditIllness] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    let list = [...illnesses];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.icdCode.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q)
      );
    }
    if (filterPatient) list = list.filter(i => i.patientId === filterPatient);
    if (filterSeverity) list = list.filter(i => i.severity === filterSeverity);
    if (filterStatus) list = list.filter(i => i.status === filterStatus);
    return list;
  }, [illnesses, search, filterPatient, filterSeverity, filterStatus]);

  const validate = () => {
    const e = {};
    if (!form.patientId) e.patientId = "Bemor tanlanishi shart";
    if (!form.icdCode.trim()) e.icdCode = "ICD kodi shart";
    if (!form.description.trim()) e.description = "Tavsif kiritilishi shart";
    if (!form.diagnosisDate) e.diagnosisDate = "Sana shart";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = (prePatientId) => {
    setEditIllness(null);
    setForm({ ...emptyForm, patientId: prePatientId || (patients[0]?.id || '') });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (ill) => {
    setEditIllness(ill);
    setForm({
      patientId: ill.patientId,
      icdCode: ill.icdCode,
      description: ill.description,
      severity: ill.severity,
      diagnosisDate: ill.diagnosisDate,
      status: ill.status,
      notes: ill.notes,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editIllness) await api.updateIllness(editIllness.id, form);
      else await api.createIllness(form);
      await refreshIllnesses();
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteIllness(id);
      await refreshIllnesses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  const severityColors = {
    mild: 'border-l-green-400',
    moderate: 'border-l-yellow-400',
    severe: 'border-l-orange-400',
    critical: 'border-l-red-500',
  };

  const selectField = (label, field, options, required) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={form[field]}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors[field] ? 'border-red-400' : 'border-gray-200'}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-gray-500">{illnesses.length} ta tashxis yozuvi</p>
        {canWrite && (
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/30"
          >
            <Plus size={18} /> Yangi Tashxis
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ICD kodi, tavsif..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
          <select
            value={filterPatient}
            onChange={e => setFilterPatient(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha bemorlar</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </select>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha darajalar</option>
            <option value="mild">Engil</option>
            <option value="moderate">O'rtacha</option>
            <option value="severe">Og'ir</option>
            <option value="critical">Kritik</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="resolved">Davolandi</option>
            <option value="chronic">Surunkali</option>
          </select>
        </div>
        {(search || filterPatient || filterSeverity || filterStatus) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Filter size={12} />
            <span>{filtered.length} ta natija</span>
            <button onClick={() => { setSearch(''); setFilterPatient(''); setFilterSeverity(''); setFilterStatus(''); }} className="text-green-600 hover:underline ml-1">Tozalash</button>
          </div>
        )}
      </div>

      {/* Illness Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Stethoscope className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Tashxis yozuvi topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ill => {
            const patient = patients.find(p => p.id === ill.patientId);
            const doctor = patient ? doctors.find(d => d.id === patient.doctorId) : null;
            return (
              <div
                key={ill.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-4 ${severityColors[ill.severity]} hover:shadow-md transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-bold bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full">
                        {ill.icdCode}
                      </span>
                      <SeverityBadge severity={ill.severity} />
                      <StatusBadge status={ill.status} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base break-safe">{ill.description}</h3>
                    {ill.notes && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 break-safe">{ill.notes}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {ill.diagnosisDate}
                      </span>
                      {patient && (
                        <span className="flex items-center gap-1.5">
                          <span className="break-safe">{patient.firstName} {patient.lastName}</span>
                          <GenderBadge gender={patient.gender} />
                        </span>
                      )}
                      {doctor && (
                        <span className="flex items-center gap-1">
                          🩺 Dr. {doctor.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex sm:flex-col items-center gap-2">
                      <button
                        onClick={() => openEdit(ill)}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(ill.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editIllness ? 'Tashxisni Tahrirlash' : 'Yangi Tashxis Qo\'shish'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bemor <span className="text-red-500">*</span></label>
            <select
              value={form.patientId}
              onChange={e => setForm(prev => ({ ...prev, patientId: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.patientId ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">Bemorni tanlang</option>
              {patients.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-xs text-red-500 mt-0.5">{errors.patientId}</p>}
          </div>

          {/* ICD Code with quick select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ICD Kodi <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.icdCode}
              onChange={e => setForm(prev => ({ ...prev, icdCode: e.target.value }))}
              onKeyDown={handleEnterKey}
              placeholder="Masalan: I10, E11.9..."
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.icdCode ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.icdCode && <p className="text-xs text-red-500 mt-0.5">{errors.icdCode}</p>}
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1.5">Tez tanlash:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ICD.map(icd => (
                  <button
                    key={icd.code}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, icdCode: icd.code, description: icd.desc }))}
                    className="text-xs bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 px-2.5 py-1 rounded-lg transition-colors border border-gray-200 hover:border-green-300"
                  >
                    {icd.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tavsif / Kasallik nomi <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={handleEnterKey}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectField("Og'irlik darajasi", 'severity', [
              { value: 'mild', label: 'Engil' },
              { value: 'moderate', label: "O'rtacha" },
              { value: 'severe', label: "Og'ir" },
              { value: 'critical', label: 'Kritik' },
            ], true)}
            {selectField('Holat', 'status', [
              { value: 'active', label: 'Faol' },
              { value: 'resolved', label: 'Davolandi' },
              { value: 'chronic', label: 'Surunkali' },
            ])}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tashxis sanasi <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.diagnosisDate}
                onChange={e => setForm(prev => ({ ...prev, diagnosisDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Izohlar / Davolash</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"
              placeholder="Davolash rejasi, dori buyurtmalari, qo'shimcha izohlar..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium text-sm hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/20">
              {editIllness ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Tashxisni O'chirish"
        message="Bu tashxis yozuvini o'chirishni xohlaysizmi?"
      />
    </div>
  );
}
