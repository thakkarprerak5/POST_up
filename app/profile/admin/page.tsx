import { AdminProfile } from "@/components/admin-profile";
import { getServerSession } from "next-auth/next";

export default async function AdminProfilePage() {
  const session = await getServerSession();
  
  return <AdminProfile admin={session?.user || null} />;
}
