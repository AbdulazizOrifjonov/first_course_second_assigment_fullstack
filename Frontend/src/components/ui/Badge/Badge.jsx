import React from 'react';
import './Badge.css';

const variantClasses = {
  green: 'bg-green-100 text-green-800 border border-green-200',
  red: 'bg-red-100 text-red-800 border border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  blue: 'bg-blue-100 text-blue-800 border border-blue-200',
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
};

export function Badge({ children, variant = 'gray', size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClass} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const map = {
    mild: 'green',
    moderate: 'yellow',
    severe: 'orange',
    critical: 'red',
  };
  const labels = {
    mild: 'Engil',
    moderate: "O'rtacha",
    severe: "Og'ir",
    critical: 'Kritik',
  };
  return <Badge variant={map[severity] || 'gray'}>{labels[severity] || severity}</Badge>;
}

export function StatusBadge({ status }) {
  const map = {
    active: 'green',
    inactive: 'gray',
    resolved: 'blue',
    chronic: 'purple',
  };
  const labels = {
    active: 'Faol',
    inactive: 'Nofaol',
    resolved: 'Davolandi',
    chronic: 'Surunkali',
  };
  return <Badge variant={map[status] || 'gray'}>{labels[status] || status}</Badge>;
}

export function RoleBadge({ role }) {
  const map = {
    admin: 'red',
    clinician: 'green',
    receptionist: 'blue',
  };
  const labels = {
    admin: 'Administrator',
    clinician: 'Klinitsist',
    receptionist: 'Qabulxona',
  };
  return <Badge variant={map[role] || 'gray'} size="md">{labels[role] || role}</Badge>;
}

export function GenderBadge({ gender }) {
  if (gender === 'male') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
        <span className="text-lg font-bold">♂</span> Erkak
      </span>
    );
  }
  if (gender === 'female') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200">
        <span className="text-sm leading-none"><b>♀</b></span> Ayol
      </span>
    );
  }
  return <Badge variant="gray">{gender}</Badge>;
}
