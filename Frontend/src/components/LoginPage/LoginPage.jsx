import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { Shield, Eye, EyeOff, Activity, Lock, User } from 'lucide-react';
import './LoginPage.css';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(username, password);
    setLoading(false);
    if (!ok) setError("Foydalanuvchi nomi yoki parol noto'g'ri yoki backend ishlamayapti!");
  };

  const quickLogin = (role) => {
    const creds = {
      admin: ['admin', 'admin123'],
      clinician: ['doctor1', 'doctor123'],
      receptionist: ['reception1', 'recep123'],
    };
    const [u, p] = creds[role];
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-3 sm:p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative w-full max-w-4xl flex flex-col md:flex-row items-center gap-5 md:gap-10 py-4">

        {/* Left: Logo & Title */}
        <div className="flex-1 text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-3xl shadow-2xl mb-3 sm:mb-5">
            <Activity className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">CareTrack TYBT</h1>
          <p className="text-green-200 text-sm sm:text-base">Tibbiy Yozuvlarni Boshqarish Tizimi</p>
          <p className="text-green-300 text-sm mt-1">MediCore Solutions © 2024</p>
        </div>

        {/* Right: Login Card */}
        <div className="w-full flex-1 bg-white rounded-2xl shadow-2xl p-4 sm:p-7 overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="text-green-600" size={20} />
            <h2 className="text-gray-800 font-bold text-lg">Tizimga Kirish</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition"
                  placeholder="username kiriting"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition"
                  placeholder="parol kiriting"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2 break-safe">
                <span className="text-red-500">⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Tekshirilmoqda...
                </span>
              ) : 'Kirish'}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-2">Demo hisoblar (tez kirish)</p>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
              {[
                { role: 'admin', label: 'Admin', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
                { role: 'clinician', label: 'Klinitsist', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                { role: 'receptionist', label: 'Qabulxona', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLogin(role)}
                  className={`py-1.5 px-2 border rounded-lg text-xs font-medium transition-colors ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-between gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium">admin</span><span>admin / admin123 — To'liq kirish</span>
              </div>
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-between gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium">doctor1</span><span>doctor123 — Bemor & Kasallik</span>
              </div>
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:justify-between gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium">reception1</span><span>recep123 — Ro'yxatga olish</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
