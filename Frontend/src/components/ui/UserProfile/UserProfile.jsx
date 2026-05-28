import { Calendar, Image, Settings, UserRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import './UserProfile.css';

export function UserProfile({ onSettingsClick }) {
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'from-red-500 to-red-600';
      case 'clinician': return 'from-blue-500 to-blue-600';
      case 'receptionist': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'clinician': return 'Shifokor';
      case 'receptionist': return 'Qabul Xodimi';
      default: return role;
    }
  };

  const joinedYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-5 sm:mb-6 overflow-hidden">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(user.role)} rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
          {getInitials(user.fullName)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-safe">{user.fullName}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getRoleColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
          <div className="flex items-center gap-2">
            {user.createdAt && (
              <span className="text-xs text-gray-400">
                Kiritilgan: {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <UserRound size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Ism familya</p>
                <p className="text-sm font-semibold text-gray-900 break-safe">{user.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Calendar size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Yili</p>
                <p className="text-sm font-semibold text-gray-900">{joinedYear || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Image size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Rasmi</p>
                <p className="text-sm font-semibold text-gray-900">Profil rasmi</p>
              </div>
            </div>
          </div>
        </div>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sozlamalar"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
