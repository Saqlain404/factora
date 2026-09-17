import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../modules/auth/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { users } });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@factoraa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";

async function seedAdminUser() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await db.insert(users).values({
    id: randomUUID(),
    name: "Administrator",
    email: ADMIN_EMAIL.toLowerCase(),
    hashedPassword,
    role: "admin",
  });

  console.log(`Created admin user: ${ADMIN_EMAIL}`);
}

seedAdminUser()
  .catch((error) => {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });