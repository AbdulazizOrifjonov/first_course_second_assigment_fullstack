import React, { useState } from 'react';
import { AlertCircle, Bell, BellOff, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { api } from '../../../api';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../context/ToastContext/ToastContext';
import './SettingsPage.css';

export function SettingsPage({ onBack }) {
  const { user } = useAuth();
  const { notificationsEnabled, setNotificationsEnabled, showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword) {
      setError('Joriy parolni kiriting');
      return false;
    }
    if (!newPassword) {
      setError('Yangi parolni kiriting');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Yangi parollar mos kelmadi');
      return false;
    }
    if (currentPassword === newPassword) {
      setError('Yangi parol eski paroldan farq qilishi kerak');
      return false;
    }
    return true;
  };

  const handleToggleNotifications = (enabled) => {
    setNotificationsEnabled(enabled);
    showToast({
      type: 'success',
      title: enabled ? 'Bildirishnomalar yoqildi' : 'Bildirishnomalar o\'chirildi',
      message: enabled ? 'Yangi bemor yoki shifokor qo\'shilganda xabar ko\'rinadi.' : 'Toast xabarlari endi ko\'rinmaydi.',
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validatePasswords()) return;

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parolni o\'zgartirishda xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-0 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Lock size={28} className="text-green-600" />
            Sozlamalar
          </h1>
          <p className="text-gray-600 mt-2">Foydalanuvchi hisobi sozlamalarini boshqaring</p>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To'liq ismi</label>
              <p className="text-gray-900 font-semibold break-safe">{user?.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi nomi</label>
              <p className="text-gray-900 font-semibold">@{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <p className="text-gray-900 font-semibold">{
                user?.role === 'admin' ? 'Administrator' :
                user?.role === 'clinician' ? 'Shifokor' :
                user?.role === 'receptionist' ? 'Qabul Xodimi' :
                user?.role
              }</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kiritilgan sana</label>
              <p className="text-gray-900 font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : '-'}
              </p>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${notificationsEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Bildirishnomalar</h2>
                  <p className="text-sm text-gray-500">Qabuldan yangi bemor yoki yangi shifokor qo'shilganda toast xabari ko'rinsin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotifications(!notificationsEnabled)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors sm:w-auto ${
                  notificationsEnabled
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                aria-pressed={notificationsEnabled}
                aria-label="Bildirishnomalarni yoqish yoki o'chirish"
              >
                <span className="text-sm font-bold">{notificationsEnabled ? 'Yoqilgan' : 'O\'chirilgan'}</span>
                <span className={`relative h-7 w-12 rounded-full transition-colors ${notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Parolni o'zgartirish</h2>

          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Joriy parol
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Joriy parolni kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yangi parol
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Yangi parolni kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Kamida 6 belgidan iborat bo'lishi kerak</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yangi parolni tasdiqlash
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Yangi parolni tasdiqlang"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">Parol muvaffaqiyatli o'zgartirildi!</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Saqlyanmoqda...' : 'Parolni o\'zgartirish'}
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Orqaga
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
