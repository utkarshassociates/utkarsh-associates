import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin Login" };

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  // Already have a valid session? Skip straight past the login form.
  const session = await getSession();
  const { from } = await searchParams;
  const redirectTo = from && from.startsWith("/admin") ? from : "/admin";

  if (session) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-[380px] rounded-lg border border-gray-300 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="font-serif text-h4 text-navy-700">Utkarsh Associates</div>
          <div className="mt-1 text-small text-gray-700">Admin dashboard</div>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
