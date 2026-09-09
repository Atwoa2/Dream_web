/** Пользователь в том виде, в каком его видит остальное приложение. */
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
