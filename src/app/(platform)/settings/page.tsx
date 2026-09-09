import { requireUser } from "@/lib/auth-server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Your profile and sign-in details.</p>

      <section className="card">
        <h2>Profile</h2>
        <div className="row">
          <span className="muted">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="row">
          <span className="muted">Member since</span>
          <span>{user.createdAt.toISOString().slice(0, 10)}</span>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <span className="field-label">Display name</span>
          <ProfileForm initialName={user.name ?? ""} />
        </div>
      </section>

      <section className="card">
        <h2>Sign-in</h2>
        <p className="muted" style={{ margin: 0 }}>
          Passwordless account: one-time email codes and Google. Signing in
          with Google using {user.email} lands in this same account.
        </p>
      </section>
    </>
  );
}
