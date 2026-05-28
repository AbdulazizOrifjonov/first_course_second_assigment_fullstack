import React, { useEffect, useState } from 'react';
import {
  Activity, Users, UserCheck, Stethoscope, LayoutDashboard,
  LogOut, Menu, X, ChevronRight, Bell, Clock, Shield, FileText, Settings, LockKeyhole, MessageCircle, CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useToast } from '../../context/ToastContext/ToastContext';
import { RoleBadge } from '../ui/Badge/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog/ConfirmDialog';
import { UserProfile } from '../ui/UserProfile/UserProfile';
import './Layout.css';

export function Layout({ children, currentPage, onNavigate }) {
  const { user, logout, isAdmin } = useAuth();
  const { notificationsEnabled, notifications, clearNotifications } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Boshqaruv Paneli', icon: LayoutDashboard, always: true },
    { id: 'doctors', label: 'Shifokorlar', icon: UserCheck, always: false, show: true },
    { id: 'patients', label: 'Bemorlar', icon: Users, always: true },
    { id: 'illnesses', label: 'Kasallik / Tashxis', icon: Stethoscope, always: true },
    { id: 'appointments', label: 'Qabullar', icon: CalendarDays, always: true },
    { id: 'reports', label: 'Hisobotlar', icon: FileText, always: true },
    { id: 'chat', label: 'Chat', icon: MessageCircle, always: true },
    { id: 'audit', label: 'Audit Jurnali', icon: Shield, show: isAdmin },
  ].filter(item => item.always || item.show);

  const settingsItems = [
    { id: 'settings', label: 'Mening Sozlamalarim', icon: Settings, always: true },
    { id: 'users-credentials', label: 'Foydalanuvchi Kredentiallar', icon: LockKeyhole, always: false, show: isAdmin },
  ].filter(item => item.always || item.show);

  const allNavItems = [...navItems, ...settingsItems];
  const currentPageTitle = allNavItems.find(n => n.id === currentPage)?.label || 'Boshqaruv Paneli';

  const NavLink = ({ item, onClick, collapsed }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        onClick={() => { onNavigate(item.id); onClick?.(); }}
        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-left group ${
          collapsed ? 'justify-center' : 'justify-start'
        } ${
          isActive
            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
            : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
        }`}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-green-600'} />
        {!collapsed && <span className="font-medium text-sm ml-3">{item.label}</span>}
        {!collapsed && isActive && <ChevronRight size={16} className="ml-auto text-green-200" />}
      </button>
    );
  };

  return (
    <div className="w-full h-full bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-sm h-full z-30 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'} overflow-y-auto`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Activity size={20} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-900 text-sm leading-tight">CareTrack</h1>
                <p className="text-xs text-gray-500">TYBT v1.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => <NavLink key={item.id} item={item} collapsed={!sidebarOpen} />)}
        </nav>

        {/* Settings Section */}
        {sidebarOpen && (
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase">Sozlamalar</p>
            <nav className="space-y-1">
              {settingsItems.map(item => <NavLink key={item.id} item={item} />)}
            </nav>
          </div>
        )}

        {/* User Info */}
        {sidebarOpen ? (
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                </div>
              </div>
              <RoleBadge role={user?.role || ''} />
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut size={20} />
              Chiqish
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-100 flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.fullName.charAt(0)}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Chiqish"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 h-full bg-white shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm">CareTrack TYBT</h1>
                  <p className="text-xs text-gray-500">MediCore Solutions</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(item => <NavLink key={item.id} item={item} onClick={() => setSidebarOpen(false)} />)}
            </nav>
            <div className="p-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase">Sozlamalar</p>
              <nav className="space-y-1">
                {settingsItems.map(item => <NavLink key={item.id} item={item} onClick={() => setSidebarOpen(false)} />)}
              </nav>
            </div>
            <div className="p-3 border-t border-gray-100">
              <div className="bg-green-50 rounded-xl p-3 mb-2">
                <p className="text-xs font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
                <div className="mt-1"><RoleBadge role={user?.role || ''} /></div>
              </div>
              <button
                onClick={() => { setSidebarOpen(false); setShowLogoutConfirm(true); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut size={16} /> Chiqish
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-base lg:text-lg truncate">
                  {currentPageTitle}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="hidden sm:inline">CareTrack Clinic</span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="truncate">{currentPageTitle}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-1.5 text-gray-600">
                <Clock size={16} className="text-green-600" />
                <span className="text-xs font-semibold">
                  {now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="hidden xl:inline text-xs text-gray-400">
                  {now.toLocaleDateString('uz-UZ')}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-green-50 rounded-xl px-3 py-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-700 font-medium">Tizim faol</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(prev => !prev)}
                  className={`p-2 rounded-xl hover:bg-gray-100 relative ${notificationsEnabled ? 'text-gray-500' : 'text-gray-300'}`}
                  title={notificationsEnabled ? 'Bildirishnomalar yoqilgan' : 'Bildirishnomalar o\'chirilgan'}
                >
                  <Bell size={20} />
                  {notificationsEnabled && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Bildirishnomalar</p>
                        <p className="text-xs text-gray-500">{notificationsEnabled ? 'Faol' : 'O\'chirilgan'}</p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-xs font-semibold text-green-600 hover:text-green-700"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {!notificationsEnabled ? (
                        <div className="p-4 text-center">
                          <p className="text-sm font-semibold text-gray-700">Bildirishnomalar o'chirilgan</p>
                          <p className="mt-1 text-xs text-gray-500">Admin sozlamadan qayta yoqishi mumkin.</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm font-semibold text-gray-700">Hozircha bildirishnoma yo'q</p>
                          <p className="mt-1 text-xs text-gray-500">Yangi bemor yoki shifokor qo'shilsa shu yerda chiqadi.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map(notification => (
                            <div key={notification.id} className="rounded-xl bg-gray-50 p-3">
                              <p className="text-sm font-semibold text-gray-900 break-safe">{notification.title}</p>
                              {notification.message && (
                                <p className="mt-1 text-xs text-gray-500 break-safe">{notification.message}</p>
                              )}
                              <p className="mt-2 text-[11px] text-gray-400">
                                {new Date(notification.createdAt).toLocaleString('uz-UZ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <UserProfile onSettingsClick={() => onNavigate('settings')} />
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 px-6 py-3 text-center">
          <p className="text-xs text-gray-400">
            © 2024 MediCore Solutions — CareTrack TYBT | Barcha huquqlar himoyalangan
          </p>
        </footer>
      </div>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Tizimdan Chiqish"
        message={`Siz tizimdan chiqmoqchimisiz, ${user?.fullName}? Barcha saqlanmagan o'zgarishlar yo'qolishi mumkin.`}
        confirmText="Ha, chiqish"
        type="warning"
      />
    </div>
  );
}
