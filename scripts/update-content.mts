// Brings an EXISTING database in line with the new photo library and brand wording, without touching bookings,
// rates, users or settings. Safe to run more than once.
//   Local:      npx tsx --env-file=.env scripts/update-content.mts
//   Production: DATABASE_URL="postgres://…" npx tsx scripts/update-content.mts   (the same connection string as db:setup)
import { PrismaClient } from "@prisma/client";
import { COTTAGE_PHOTOS, PROPERTY_PHOTOS, ph } from "../src/lib/photos";
import { HIGHLIGHTS, TAGLINE } from "../src/lib/brand";
import { TESTIMONIALS } from "../src/lib/testimonials";
import { STARTER_POSTS } from "../src/lib/journal-starter";

const db = new PrismaClient();
const props = await db.property.findMany();
for (const p of props) {
  const content = JSON.parse(p.content);
  for (const l of ["en", "fr"] as const) {
    if (!content[l]) continue;
    content[l].tagline = TAGLINE[l];
    content[l].highlights = HIGHLIGHTS[l];
  }
  const spaces = (JSON.parse(p.spaces) as { key: string; photo: string }[]).map((s) => ({
    ...s,
    photo: (COTTAGE_PHOTOS as Record<string, string>)[s.key] ?? s.photo,
  }));
  await db.property.update({ where: { id: p.id }, data: { content: JSON.stringify(content), photos: JSON.stringify(PROPERTY_PHOTOS), spaces: JSON.stringify(spaces) } });
  console.log(`updated ${p.slug}: ${PROPERTY_PHOTOS.length} photos, ${spaces.length} cottages`);
}

// the sample offers used pictures from the old gallery
const swap: Record<string, string> = {
  "/img/site/long-table.jpg": ph("living", 73).src,
  "/img/site/veranda-dining.jpg": ph("living", 37).src,
  "/img/site/fireplace-room.jpg": ph("living", 32).src,
};
for (const o of await db.offer.findMany()) {
  if (o.imageUrl && swap[o.imageUrl]) {
    await db.offer.update({ where: { id: o.id }, data: { imageUrl: swap[o.imageUrl] } });
    console.log(`offer picture updated: ${o.titleEn}`);
  }
}
// placeholder testimonials, only while there are no real reviews yet
if ((await db.review.count({ where: { NOT: { id: { startsWith: "testimonial-" } }, sample: false } })) === 0) {
  for (const t of TESTIMONIALS) {
    const data = { name: t.name, origin: t.origin, stayLabel: t.stayLabel, rating: t.rating, textEn: t.textEn, textFr: t.textFr, source: "direct", published: true, status: "approved", sample: false };
    await db.review.upsert({ where: { id: t.id }, update: data, create: { id: t.id, priority: 10 - TESTIMONIALS.indexOf(t), ...data } });
  }
  await db.review.deleteMany({ where: { sample: true } });
  console.log(`placeholder testimonials in place (${TESTIMONIALS.length})`);
}
// starter Guides articles, only while the Guides is empty
if ((await db.post.count()) === 0) {
  for (const p of STARTER_POSTS) await db.post.create({ data: { ...p, published: true, publishedAt: new Date(p.publishedAt) } });
  console.log(`starter guides articles added (${STARTER_POSTS.length})`);
}
await db.$disconnect();
