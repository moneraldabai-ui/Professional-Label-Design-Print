import DepartmentWorkspace from './DepartmentWorkspace'
import { FixedDepartmentId } from '../store/useFixedDepartmentStore'

interface FixedDepartmentTabProps {
  departmentId: FixedDepartmentId
  departmentName: string
  onDeleteDepartment?: () => void
  canDelete?: boolean
}

function FixedDepartmentTab({ departmentId, departmentName, onDeleteDepartment, canDelete }: FixedDepartmentTabProps) {
  return (
    <DepartmentWorkspace
      storeType="fixed"
      departmentId={departmentId}
      departmentName={departmentName}
      onDeleteDepartment={onDeleteDepartment}
      canDelete={canDelete}
    />
  )
}

export default FixedDepartmentTab
