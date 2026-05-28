import {
  Users, UserCheck, Stethoscope, Activity,
  TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { useAppData } from '../../context/AppContext/AppContext';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Dashboard.css';

const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

export function Dashboard() {
  const { doctors, patients, illnesses } = useAppData();
  const { user, isAdmin } = useAuth();

  const activeDoctors = doctors.filter(d => d.status === 'active').length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const activeIllnesses = illnesses.filter(i => i.status === 'active').length;
  const criticalCases = illnesses.filter(i => i.severity === 'critical').length;

  // Department stats
  const deptStats = doctors.reduce((acc, d) => {
    const dept = d.specialization;
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  const deptData = Object.entries(deptStats).map(([name, value]) => ({ name, value }));

  // Severity distribution
  const severityData = [
    { name: 'Engil', value: illnesses.filter(i => i.severity === 'mild').length, color: '#16a34a' },
    { name: "O'rtacha", value: illnesses.filter(i => i.severity === 'moderate').length, color: '#f59e0b' },
    { name: "Og'ir", value: illnesses.filter(i => i.severity === 'severe').length, color: '#f97316' },
    { name: 'Kritik', value: illnesses.filter(i => i.severity === 'critical').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Illness status
  const statusData = [
    { name: 'Faol', value: illnesses.filter(i => i.status === 'active').length },
    { name: 'Davolandi', value: illnesses.filter(i => i.status === 'resolved').length },
    { name: 'Surunkali', value: illnesses.filter(i => i.status === 'chronic').length },
  ];

  const stats = [
    {
      label: 'Jami Shifokorlar',
      value: doctors.length,
      sub: `${activeDoctors} faol`,
      icon: UserCheck,
      color: 'from-green-500 to-green-700',
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Jami Bemorlar',
      value: patients.length,
      sub: `${activePatients} faol`,
      icon: Users,
      color: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Tashxislar',
      value: illnesses.length,
      sub: `${activeIllnesses} faol holat`,
      icon: Stethoscope,
      color: 'from-purple-500 to-purple-700',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Kritik Holatlar',
      value: criticalCases,
      sub: 'Zudlik bilan e\'tibor',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-700',
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  const recentPatients = [...patients].reverse().slice(0, 5);
  const criticalPatients = illnesses.filter(i => i.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-green-600/20 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-green-200 text-sm mb-1">Xush kelibsiz 👋</p>
            <h2 className="text-xl sm:text-2xl font-bold break-safe">{user?.fullName}</h2>
            <p className="text-green-200 text-sm mt-1">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold">{patients.length}</div>
              <div className="text-green-200 text-xs">Jami bemor</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-right">
              <div className="text-3xl font-bold">{illnesses.length}</div>
              <div className="text-green-200 text-xs">Tashxis</div>
            </div>
          </div>
        </div>
        {criticalCases > 0 && (
          <div className="mt-4 bg-white/20 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-300" />
            <span className="text-sm font-medium">
              {criticalCases} ta kritik bemor zudlik bilan e'tiborni talab qilmoqda
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={22} className={s.iconColor} />
                </div>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5 break-safe">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope size={18} className="text-green-600" />
            Kasallik Og'irlik Darajasi
          </h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {severityData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Soni']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              Ma'lumot yo'q
            </div>
          )}
        </div>

        {/* Status Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-green-600" />
            Tashxis Holati
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Soni" radius={[8, 8, 0, 0]}>
                {statusData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-green-600" />
            So'nggi Bemorlar
          </h3>
          <div className="space-y-3">
            {recentPatients.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Bemor yo'q</p>
            ) : recentPatients.map(p => {
              const doctor = doctors.find(d => d.id === p.doctorId);
              const pIllnesses = illnesses.filter(i => i.patientId === p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {p.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{doctor ? `Dr. ${doctor.lastName}` : '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-100 text-green-700 rounded-lg px-2 py-0.5">
                      {pIllnesses.length} tashxis
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Cases */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" />
            Kritik Holatlar
          </h3>
          <div className="space-y-3">
            {criticalPatients.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                <p className="text-green-600 font-medium text-sm">Kritik holat yo'q</p>
                <p className="text-gray-400 text-xs">Barcha bemorlar barqaror</p>
              </div>
            ) : criticalPatients.map(ill => {
              const patient = patients.find(p => p.id === ill.patientId);
              return (
                <div key={ill.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm break-safe">{patient ? `${patient.firstName} ${patient.lastName}` : 'Noma\'lum'}</p>
                    <p className="text-xs text-red-600 truncate">{ill.icdCode} — {ill.description}</p>
                  </div>
                  <span className="text-xs bg-red-600 text-white rounded-lg px-2 py-0.5 font-medium flex-shrink-0">Kritik</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-green-600" />
            Bo'limlar Bo'yicha Shifokorlar
          </h3>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {deptData.map((d) => (
              <div key={d.name} className="text-center p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                <div className="text-2xl font-bold text-green-600">{d.value}</div>
                <div className="text-xs text-gray-600 mt-1 font-medium leading-tight break-safe">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
