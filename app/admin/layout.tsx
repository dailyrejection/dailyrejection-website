import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | Daily Rejection",
  description: "Manage weekly challenges and select winners",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 