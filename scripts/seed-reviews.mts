// Adds the placeholder testimonials (see src/lib/testimonials.ts). Safe to run again: it updates them by id.
import { PrismaClient } from "@prisma/client";
import { TESTIMONIALS } from "../src/lib/testimonials";
const db = new PrismaClient();
for (const t of TESTIMONIALS) {
  const data = { name: t.name, origin: t.origin, stayLabel: t.stayLabel, rating: t.rating, textEn: t.textEn, textFr: t.textFr, source: "direct", published: true, status: "approved", sample: false };
  await db.review.upsert({ where: { id: t.id }, update: data, create: { id: t.id, priority: 10 - TESTIMONIALS.indexOf(t), ...data } });
}
// the old "sample text" rows from the first version are replaced by these
await db.review.deleteMany({ where: { sample: true } });
console.log(`${TESTIMONIALS.length} placeholder testimonials in place`);
await db.$disconnect();
