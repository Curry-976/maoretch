import { auth } from "./auth";
import { prisma } from "./prisma";
import { env } from "./env";

/**
 * Create the first admin user if BOOTSTRAP_ADMIN_EMAIL / _PASSWORD are set
 * and there is no admin in the database yet. Idempotent.
 */
export async function bootstrapAdmin(): Promise<void> {
  const email = env.BOOTSTRAP_ADMIN_EMAIL;
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "[bootstrap] BOOTSTRAP_ADMIN_EMAIL or _PASSWORD not set — skipping admin bootstrap.",
    );
    return;
  }

  console.log(`[bootstrap] Checking initial admin for ${email}…`);

  const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (existingAdmin) {
    console.log(
      `[bootstrap] An admin already exists (${existingAdmin.email}). No action.`,
    );
    return;
  }

  // An ordinary user may exist with this email (e.g. seeded by hand or by a
  // previous OTP login). Promote them and make sure they have a credential
  // account with the bootstrap password.
  const sameEmail = await prisma.user.findUnique({ where: { email } });

  if (sameEmail) {
    console.log(
      `[bootstrap] User ${email} already exists — promoting to admin and (re)setting password.`,
    );

    // Wipe their credential account so signUpEmail can recreate it cleanly,
    // and drop all their sessions so the next sign-in is fresh.
    await prisma.account.deleteMany({
      where: { userId: sameEmail.id, providerId: "credential" },
    });
    await prisma.session.deleteMany({ where: { userId: sameEmail.id } });
    await prisma.user.delete({ where: { id: sameEmail.id } });
    console.log(
      `[bootstrap] Removed stale account for ${email} so it can be recreated.`,
    );
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Administrateur",
      },
    });

    const userId = (result as { user?: { id?: string } } | null)?.user?.id;
    if (!userId) {
      console.error(
        "[bootstrap] signUpEmail returned no user. Result:",
        JSON.stringify(result),
      );
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });
    console.log(
      `[bootstrap] Created admin account ${email} (user id ${userId}). You can now sign in.`,
    );
  } catch (err: any) {
    console.error(
      "[bootstrap] Failed to create admin user:",
      err?.message ?? err,
    );
  }
}
