import AdminDashboard from "@/components/admin/AdminDashboard";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <>
      <div className="mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-lg text-gray-600 mt-2 font-normal">Welcome to the admin control panel</p>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm px-4 py-2 text-sm font-semibold">
              Admin System
            </Badge>
          </div>
        </div>
      </div>
      <AdminDashboard />
    </>
  );
}
