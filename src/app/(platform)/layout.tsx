/**
 * Platform shell: sign-in gate, sidebar, top bar, content column.
 * Every page in this group is only reachable with a valid session.
 */
import { requireUser } from "@/lib/auth-server";
import { getCreditsBalance } from "@/modules/billing";
import { PlatformNav } from "./nav";
import { UserMenu } from "./user-menu";

export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const balanceCents = await getCreditsBalance(user.id);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Dream Labs</div>
        <PlatformNav />
      </aside>

      <div className="main-col">
        <header className="topbar">
          <UserMenu
            email={user.email}
            name={user.name}
            balanceCents={balanceCents}
          />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
