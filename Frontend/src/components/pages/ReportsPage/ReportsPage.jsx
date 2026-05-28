import { useState } from 'react';
import {
  Search, Printer, User,
  Stethoscope, UserCheck, BarChart2, Calendar
} from 'lucide-react';
import { useAppData } from '../../../context/AppContext/AppContext';
import { SeverityBadge, StatusBadge } from '../../ui/Badge/Badge';
import './ReportsPage.css';

export function ReportsPage() {
  const { doctors, patients, illnesses } = useAppData();
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportType, setReportType] = useState('summary');

  const filteredPatients = patients.filter(p => {
    if (!searchPatient) return true;
    const q = searchPatient.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)
    );
  });

  const patient = selectedPatient ? patients.find(p => p.id === selectedPatient) : null;
  const patientDoctor = patient ? doctors.find(d => d.id === patient.doctorId) : null;
  const patientIllnesses = patient ? illnesses.filter(i => i.patientId === patient.id) : [];

  const printReport = () => {
    window.print();
  };

  function calculateAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('uz-UZ');
  }

  return (
    <div className="space-y-5">
      {/* Report Type Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'summary', label: 'Umumiy Hisobot', icon: BarChart2 },
            { id: 'patient', label: 'Bemor Profili', icon: User },
            { id: 'doctor', label: "Shifokor Bo'yicha", icon: UserCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setReportType(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                reportType === id
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button
            onClick={printReport}
            className="flex w-full sm:w-auto sm:ml-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 transition-all"
          >
            <Printer size={16} />
            Chop etish
          </button>
        </div>
      </div>

      {/* Summary Report */}
      {reportType === 'summary' && (
        <div className="space-y-4 print:block">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="text-green-600" size={22} />
                Umumiy Klinika Hisoboti
              </h2>
              <p className="text-sm text-gray-400">{new Date().toLocaleDateString('uz-UZ')}</p>
            </div>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Jami Shifokorlar', value: doctors.length, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Faol Bemorlar', value: patients.filter(p => p.status === 'active').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Jami Tashxislar', value: illnesses.length, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Kritik Holatlar', value: illnesses.filter(i => i.severity === 'critical').length, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Doctors table */}
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Shifokorlar Ro'yxati</h3>
            <div className="md:hidden space-y-2">
              {doctors.map(doc => (
                <div key={doc.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm break-safe">Dr. {doc.firstName} {doc.lastName}</p>
                      <p className="text-xs text-green-700 break-safe">{doc.specialization}</p>
                      <p className="text-xs text-gray-500 break-safe">{doc.department}</p>
                      <p className="text-xs text-gray-400">Qo'shilgan: {formatDate(doc.createdAt)}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Bemorlar: <span className="font-bold text-green-700">{patients.filter(p => p.doctorId === doc.id).length}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="hidden md:block rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Shifokor</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Mutaxassislik</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Bo'lim</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Sana</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500">Bemorlar</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">Dr. {doc.firstName} {doc.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.specialization}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.department}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(doc.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {patients.filter(p => p.doctorId === doc.id).length}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Illnesses by severity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Stethoscope size={18} className="text-green-600" />
              Tashxislar Og'irlik Darajasi Bo'yicha
            </h3>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Engil', key: 'mild', color: 'bg-green-100 border-green-300 text-green-800' },
                { label: "O'rtacha", key: 'moderate', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
                { label: "Og'ir", key: 'severe', color: 'bg-orange-100 border-orange-300 text-orange-800' },
                { label: 'Kritik', key: 'critical', color: 'bg-red-100 border-red-300 text-red-800' },
              ].map(s => (
                <div key={s.key} className={`${s.color} border rounded-xl p-4 text-center`}>
                  <div className="text-2xl font-bold">
                    {illnesses.filter(i => i.severity === s.key).length}
                  </div>
                  <div className="text-xs font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile Report */}
      {reportType === 'patient' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Bemor ismini qidirish..."
                  value={searchPatient}
                  onChange={e => setSearchPatient(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                />
              </div>
            </div>
            {searchPatient && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p.id); setSearchPatient(''); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-green-50 rounded-xl text-sm flex items-center gap-2 transition-colors"
                  >
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                      {p.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-400">{p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {patient && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-green-200 text-xs uppercase tracking-wide mb-1">CareTrack Clinic — Bemor Profili Hisoboti</p>
                    <h2 className="text-xl sm:text-2xl font-bold break-safe">{patient.firstName} {patient.lastName}</h2>
                    <p className="text-green-200 mt-1">{calculateAge(patient.dateOfBirth)} yosh • {patient.gender === 'male' ? 'Erkak' : 'Ayol'}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-green-200 text-xs">Hisobot sanasi</p>
                    <p className="font-medium">{new Date().toLocaleDateString('uz-UZ')}</p>
                    <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 text-sm font-bold">
                      {patient.bloodType}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'Telefon', value: patient.phone },
                    { label: 'Email', value: patient.email || '—' },
                    { label: 'Manzil', value: patient.address || '—' },
                    { label: "Tug'ilgan sana", value: patient.dateOfBirth },
                    { label: "Ro'yxatga olingan", value: formatDate(patient.createdAt) },
                    { label: 'Favqulodda aloqa', value: patient.emergencyContact || '—' },
                    { label: 'Favqulodda telefon', value: patient.emergencyPhone || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-safe">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Doctor */}
                {patientDoctor && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Biriktirilgan Shifokor</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {patientDoctor.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 break-safe">Dr. {patientDoctor.firstName} {patientDoctor.lastName}</p>
                        <p className="text-sm text-gray-500 break-safe">{patientDoctor.specialization} — {patientDoctor.department}</p>
                        <p className="text-xs text-gray-400">{patientDoctor.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Diagnosis History */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope size={18} className="text-green-600" />
                    Tashxis Tarixi ({patientIllnesses.length} ta)
                  </h3>
                  {patientIllnesses.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl">Tashxis yo'q</p>
                  ) : (
                    <div className="space-y-3">
                      {patientIllnesses.map((ill, idx) => (
                        <div key={ill.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-lg">{idx + 1}</span>
                              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">{ill.icdCode}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <SeverityBadge severity={ill.severity} />
                              <StatusBadge status={ill.status} />
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900 break-safe">{ill.description}</p>
                          {ill.notes && <p className="text-sm text-gray-500 mt-1 break-safe">{ill.notes}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              Tashxis sanasi: {formatDate(ill.diagnosisDate)}
                            </span>
                            <span>Yaratilgan: {formatDate(ill.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!patient && !searchPatient && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <User className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500 font-medium">Bemor tanlang</p>
              <p className="text-gray-400 text-sm mt-1">Yuqoridagi qidiruv orqali bemor toping</p>
            </div>
          )}
        </div>
      )}

      {/* Doctor Report */}
      {reportType === 'doctor' && (
        <div className="space-y-4">
          {doctors.map(doc => {
            const docPatients = patients.filter(p => p.doctorId === doc.id);
            return (
              <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {doc.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 break-safe">Dr. {doc.firstName} {doc.lastName}</h3>
                    <p className="text-green-600 text-sm break-safe">{doc.specialization}</p>
                    <p className="text-xs text-gray-400">Qo'shilgan sana: {formatDate(doc.createdAt)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-bold text-green-600">{docPatients.length}</div>
                    <div className="text-xs text-gray-400">bemor</div>
                  </div>
                </div>
                {docPatients.length > 0 && (
                  <div className="space-y-2">
                    {docPatients.slice(0, 3).map(p => {
                      const pIll = illnesses.filter(i => i.patientId === p.id);
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                            {p.firstName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 break-safe">{p.firstName} {p.lastName}</span>
                          <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                          <span className="text-xs text-gray-400">{pIll.length} tashxis</span>
                        </div>
                      );
                    })}
                    {docPatients.length > 3 && (
                      <p className="text-xs text-gray-400 text-center py-1">
                        +{docPatients.length - 3} ta bemor
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
