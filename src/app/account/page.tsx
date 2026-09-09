import { requireUser } from "@/lib/auth-server";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <section className="card">
      <h2>Profile</h2>
      <div className="row">
        <span className="muted">Email</span>
        <span>{user.email}</span>
      </div>
      <div className="row">
        <span className="muted">Name</span>
        <span>{user.name ?? "—"}</span>
      </div>
      <div className="row">
        <span className="muted">Member since</span>
        <span>{user.createdAt.toISOString().slice(0, 10)}</span>
      </div>
    </section>
  );
}
