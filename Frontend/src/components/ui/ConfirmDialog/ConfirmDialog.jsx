import { AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import './ConfirmDialog.css';

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmText = "O'chirish", type = 'danger'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle className={type === 'danger' ? 'text-red-600' : 'text-yellow-600'} size={32} />
        </div>
        <p className="text-gray-600 text-sm break-safe">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
