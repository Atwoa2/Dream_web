/**
 * Platform shell: sign-in gate, sidebar, content column.
 * Every page in this group is only reachable with a valid session.
 */
import { requireUser } from "@/lib/auth-server";
import { PlatformNav } from "./nav";
import { SignOutButton } from "./signout-button";

export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Dream Labs</div>
        <PlatformNav />
        <div className="sidebar-footer">
          <span>{user.email}</span>
          <SignOutButton />
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
