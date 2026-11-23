// Adds the starter Journal articles (src/lib/journal-starter.ts), but only while the Journal is empty,
// so it never brings back an article the owners deleted or overwrites one they edited. Safe to run again.
import { PrismaClient } from "@prisma/client";
import { STARTER_POSTS } from "../src/lib/journal-starter";

const db = new PrismaClient();
if ((await db.post.count()) === 0) {
  for (const p of STARTER_POSTS) {
    await db.post.create({ data: { ...p, published: true, publishedAt: new Date(p.publishedAt) } });
  }
  console.log(`${STARTER_POSTS.length} starter articles added`);
} else {
  console.log("Journal already has articles: left as it is");
}
await db.$disconnect();
