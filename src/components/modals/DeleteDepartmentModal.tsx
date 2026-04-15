import { useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteDepartmentModalProps {
  isOpen: boolean
  departmentName: string
  onClose: () => void
  onConfirm: () => void
}

function DeleteDepartmentModal({ isOpen, departmentName, onClose, onConfirm }: DeleteDepartmentModalProps) {
  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      onConfirm()
    }
  }, [isOpen, onClose, onConfirm])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-dark mb-3">Delete Department</h2>

          {/* Message */}
          <p className="text-body mb-2">
            Are you sure you want to delete <span className="font-semibold text-dark">{departmentName}</span>?
          </p>
          <p className="text-sm text-muted mb-1">
            This will permanently delete all templates and elements inside this department.
          </p>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteDepartmentModal
