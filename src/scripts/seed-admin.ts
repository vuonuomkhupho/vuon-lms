// Run with: npx tsx src/scripts/seed-admin.ts
// Creates an admin user for the LMS

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function seedAdmin() {
  console.log("Creating admin user...");

  // Sign up via Better Auth API
  const res = await fetch(`${BETTER_AUTH_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Admin",
      email: "admin@vuon.io",
      password: "VuonLMS2026!",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log("Sign up response:", res.status, text);
    console.log("User may already exist, updating role...");
  } else {
    console.log("User created.");
  }

  // Now update the role directly in the database
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL!);

  await sql`UPDATE "user" SET role = 'admin' WHERE email = 'admin@vuon.io'`;
  console.log("Admin role set.");

  const [user] = await sql`SELECT id, name, email, role FROM "user" WHERE email = 'admin@vuon.io'`;
  console.log("Admin user:", user);

  await sql.end();
  process.exit(0);
}

seedAdmin().catch(console.error);
