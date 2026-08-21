import AdminLayout from '../layouts/AdminLayout'
import ExamTable from '../features/admin/components/ExamTable'
import styles from './AdminExams.module.css'

export default function AdminExams() {
  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý đề thi</h1>
          <p className={styles.pageDesc}>
            Danh sách tất cả các đề thi trên hệ thống
          </p>
        </div>
      </div>

      <ExamTable />
    </AdminLayout>
  )
}
