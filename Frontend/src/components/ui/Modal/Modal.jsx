import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[min(100%,28rem)] md:max-w-xl',
    md: 'max-w-[min(100%,32rem)] md:max-w-3xl',
    lg: 'max-w-[min(100%,42rem)] md:max-w-5xl lg:max-w-6xl',
    xl: 'max-w-[min(100%,48rem)] md:max-w-6xl lg:max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-none overflow-hidden md:overflow-visible`}
      >
        <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-4 border-b border-gray-100 bg-gradient-to-r from-green-600 to-green-700 shrink-0 rounded-t-2xl">
          <h2 className="text-base md:text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto md:overflow-visible flex-1 p-4 md:p-5 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
