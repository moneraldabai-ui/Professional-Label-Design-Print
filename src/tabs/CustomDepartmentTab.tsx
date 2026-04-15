import DepartmentWorkspace from './DepartmentWorkspace'

interface CustomDepartmentTabProps {
  departmentId: string
  onDeleteDepartment?: () => void
  canDelete?: boolean
}

function CustomDepartmentTab({ departmentId, onDeleteDepartment, canDelete }: CustomDepartmentTabProps) {
  return (
    <DepartmentWorkspace
      storeType="custom"
      departmentId={departmentId}
      onDeleteDepartment={onDeleteDepartment}
      canDelete={canDelete}
    />
  )
}

export default CustomDepartmentTab
