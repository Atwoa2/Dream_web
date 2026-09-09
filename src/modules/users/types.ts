/** The user as the rest of the application sees them. */
export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  stripeCustomerId: string | null;
  createdAt: Date;
};

export type CreateUserInput = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
};
