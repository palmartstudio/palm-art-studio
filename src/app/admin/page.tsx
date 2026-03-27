import AdminApp from "./AdminApp";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Palm Art Studio",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
