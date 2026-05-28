import { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../api';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import './UsersCredentialsPage.css';


export function UsersCredentialsPage({ onBack }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealedUsers, setRevealedUsers] = useState(new Set());

  useEffect(() => {
    if (!isAdmin) {
      setError('Ruxsat yo\'q');
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const data = await api.getUserCredentials();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Xato ro\'y berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const toggleReveal = (userId) => {
    const newRevealed = new Set(revealedUsers);
    if (newRevealed.has(userId)) {
      newRevealed.delete(userId);
    } else {
      newRevealed.add(userId);
    }
    setRevealedUsers(newRevealed);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'clinician':
        return 'Shifokor';
      case 'receptionist':
        return 'Qabul Xodimi';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'clinician':
        return 'bg-blue-100 text-blue-800';
      case 'receptionist':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ruxsat yo'q</h2>
          <p className="text-gray-600">Bu sahifaga faqat administratorlar kirishi mumkin</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Orqaga
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-0 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Foydalanuvchi Login-Parollari</h1>
          <p className="text-gray-600 mt-2">Admin, shifokor va qabul xodimlarining login hamda parol ma'lumotlari</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 mt-4">Yuklyanmoqda...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Foydalanuvchilar topilmadi</p>
          </div>
        ) : (
          <>
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 break-safe">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Login</p>
                    <code className={`block w-full px-3 py-2 rounded font-mono text-sm break-safe ${revealedUsers.has(user.id) ? 'bg-white' : 'bg-gray-200'}`}>
                      {revealedUsers.has(user.id) ? user.username : '••••••••'}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Parol</p>
                    <code className={`block w-full px-3 py-2 rounded font-mono text-sm break-safe ${revealedUsers.has(user.id) ? 'bg-amber-50 text-amber-800' : 'bg-gray-200 text-gray-500'}`}>
                      {revealedUsers.has(user.id) ? user.password : '••••••••'}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => toggleReveal(user.id)}
                  className="mt-3 inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                >
                  {revealedUsers.has(user.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  {revealedUsers.has(user.id) ? 'Yashirish' : 'Ko\'rsatish'}
                </button>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">To'liq ismi</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Login</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Parol</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Rol</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Kiritilgan sana</th>
                  <th className="text-center px-6 py-3 font-semibold text-gray-700">Harakat</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-semibold">{user.fullName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className={`px-3 py-1 rounded font-mono text-sm ${revealedUsers.has(user.id) ? 'bg-gray-100' : 'bg-gray-200'}`}>
                          {revealedUsers.has(user.id) ? user.username : '••••••••'}
                        </code>
                        <button
                          onClick={() => toggleReveal(user.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={revealedUsers.has(user.id) ? 'Yashirish' : 'Ko\'rsatish'}
                        >
                          {revealedUsers.has(user.id) ? (
                            <EyeOff size={16} className="text-gray-600" />
                          ) : (
                            <Eye size={16} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className={`px-3 py-1 rounded font-mono text-sm ${revealedUsers.has(user.id) ? 'bg-amber-50 text-amber-800' : 'bg-gray-200 text-gray-500'}`}>
                        {revealedUsers.has(user.id) ? user.password : '••••••••'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleReveal(user.id)}
                        className="text-green-600 hover:text-green-700 font-semibold text-sm"
                      >
                        {revealedUsers.has(user.id) ? 'Yashirish' : 'Ko\'rsatish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {onBack && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Orqaga
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
