import AdminLayout from '../layouts/AdminLayout';
import VocabularyTable from '../features/admin/components/vocabulary/VocabularyTable';
import styles from './AdminVocabulary.module.css';

export default function AdminVocabulary() {
  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Từ vựng HSK</h1>
          <p className={styles.pageDesc}>
            Kho từ vựng toàn diện HSK 1 đến HSK 7–9: Thêm mới, chỉnh sửa, import dataset JSON và quản lý bài tập.
          </p>
        </div>
      </div>

      <VocabularyTable />
    </AdminLayout>
  );
}
