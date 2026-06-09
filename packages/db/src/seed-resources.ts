/**
 * Seed (or refresh) the company-wide handbook / benefits / policy documents
 * defined in `seed-handbook.ts` as rich-document resources under the sentinel
 * "Company" department, so every employee can read them and the Tad assistant
 * can answer questions from them.
 *
 * This is a targeted alternative to the full `seed` script: it ONLY upserts the
 * Company resources, so it's safe to run after editing `seed-handbook.ts`
 * without re-running every other seeder.
 *
 * Idempotent: rows are keyed on (department_name = "Company", title). Existing
 * rows are updated in place so content edits propagate.
 *
 * Env (loaded from apps/api/.env.local via ./load-env.js):
 *   - DATABASE_URL (required, used by getDb())
 *
 * Run: pnpm --filter @tadhealth/db seed:resources
 */
import "./load-env.js";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "./index.js";
import { companyResourceSeeds } from "./seed-handbook.js";

// Mirrors COMPANY_RESOURCE_SCOPE in @tadhealth/shared and COMPANY_SCOPE in seed.ts.
const COMPANY_SCOPE = "Company";

async function run() {
  const db = getDb();
  const { departmentResources } = schema;

  console.log(`Seeding ${companyResourceSeeds.length} Company resources…`);
  let created = 0;
  let updated = 0;

  for (let i = 0; i < companyResourceSeeds.length; i++) {
    const r = companyResourceSeeds[i]!;
    const content = r.content.trim();

    const [existing] = await db
      .select({ id: departmentResources.id })
      .from(departmentResources)
      .where(
        and(
          eq(departmentResources.departmentName, COMPANY_SCOPE),
          eq(departmentResources.title, r.title),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(departmentResources)
        .set({
          kind: "document",
          content,
          category: r.category,
          url: null,
          sortOrder: i,
          updatedAt: new Date(),
        })
        .where(eq(departmentResources.id, existing.id));
      updated++;
    } else {
      await db.insert(departmentResources).values({
        departmentName: COMPANY_SCOPE,
        kind: "document",
        title: r.title,
        url: null,
        content,
        linkLabel: "Link",
        category: r.category,
        sortOrder: i,
      });
      created++;
    }
  }

  console.log("");
  console.log("── Company resources summary ────────────────────────────");
  console.log(`  Defined:  ${companyResourceSeeds.length}`);
  console.log(`  Created:  ${created}`);
  console.log(`  Updated:  ${updated}`);
  console.log("─────────────────────────────────────────────────────────");

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
