import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ContactDetailsForm } from "@/components/admin/ContactDetailsForm";

export const metadata: Metadata = { title: "Contact Details" };

export default async function ContactDetailsPage() {
  await requireSuperAdmin();

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("site_contact").select("phone, email, show_phone, show_email").eq("id", 1).maybeSingle();

  return (
    <div>
      <h1 className="mb-1 font-serif text-h3 text-navy-700">Contact Details</h1>
      <p className="mb-6 max-w-[520px] text-small text-gray-700">
        The common office phone number and email shown in the website footer and on the Offices &amp; Contact page. Untick
        &quot;Show&quot; to hide one without deleting it.
      </p>
      <ContactDetailsForm
        initialValues={{
          phone: data?.phone ?? "",
          email: data?.email ?? "",
          showPhone: data?.show_phone ?? true,
          showEmail: data?.show_email ?? true,
        }}
      />
    </div>
  );
}
