import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { logout } from "../../actions";

export const metadata = { title: "More" };

const links = [
  { href: "/admin/sign-ups", label: "Sign-ups", hint: "Emails from the store entrance, plus CSV download" },
  { href: "/admin/gallery", label: "LVN Gallery", hint: "Lookbook photos for the home page and Gallery" },
  { href: "/admin/size-guides", label: "Size guides", hint: "Measurement charts for each garment type" },
  { href: "/admin/settings", label: "Settings", hint: "Product types and sizes" },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="More" />
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-silver"
            >
              <span>
                <span className="block text-base font-medium text-ink">{link.label}</span>
                <span className="block text-sm text-ink-muted">{link.hint}</span>
              </span>
              <span aria-hidden="true" className="text-ink-muted">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg border border-line text-sm uppercase tracking-[0.2em] text-silver transition-colors hover:border-silver"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
