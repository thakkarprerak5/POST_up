import { AdminProfile } from "@/components/admin-profile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);
  
  return <AdminProfile admin={session?.user || null} />;
}
