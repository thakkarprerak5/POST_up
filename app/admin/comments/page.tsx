import AdminLayout from '@/components/admin/AdminLayout';
import AdminComments from '@/components/admin/AdminComments';

export default function CommentsPage() {
  return (
    <AdminLayout>
      <AdminComments userRole="admin" />
    </AdminLayout>
  );
}
