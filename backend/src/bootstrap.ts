import { auth } from "./auth";
import { prisma } from "./prisma";
import { env } from "./env";

/**
 * Create the first admin user if BOOTSTRAP_ADMIN_EMAIL / _PASSWORD are set
 * and there is no admin in the database yet. Idempotent.
 */
export async function bootstrapAdmin(): Promise<void> {
  if (!env.BOOTSTRAP_ADMIN_EMAIL || !env.BOOTSTRAP_ADMIN_PASSWORD) {
    console.log(
      "[bootstrap] No BOOTSTRAP_ADMIN_EMAIL / _PASSWORD set — skipping admin bootstrap.",
    );
    return;
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (existingAdmin) {
    console.log(`[bootstrap] Admin already exists (${existingAdmin.email}) — skipping.`);
    return;
  }

  // Check if the email is already used (e.g. user was promoted to admin later).
  const sameEmail = await prisma.user.findUnique({
    where: { email: env.BOOTSTRAP_ADMIN_EMAIL },
  });
  if (sameEmail) {
    if (sameEmail.role !== "admin") {
      await prisma.user.update({
        where: { id: sameEmail.id },
        data: { role: "admin" },
      });
      console.log(`[bootstrap] Promoted existing user ${sameEmail.email} to admin.`);
    }
    return;
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: env.BOOTSTRAP_ADMIN_EMAIL,
        password: env.BOOTSTRAP_ADMIN_PASSWORD,
        name: "Administrateur",
      },
    });

    if (result.user) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: "admin" },
      });
      console.log(
        `[bootstrap] Created admin account ${env.BOOTSTRAP_ADMIN_EMAIL} with role admin.`,
      );
    }
  } catch (err) {
    console.error("[bootstrap] Failed to create admin user:", err);
  }
}
