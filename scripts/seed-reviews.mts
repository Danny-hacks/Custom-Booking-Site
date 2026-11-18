// Adds PLACEHOLDER reviews so the section can be designed and tested.
// They are flagged `sample` and are never shown in production. Replace them in Admin → Reviews
// with real guest reviews (copy from Airbnb, with the guest's OK).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
if ((await db.review.count()) === 0) {
  await db.review.createMany({
    data: [
      {
        sample: true, name: "Sample guest A", origin: "Lyon, France", stayLabel: "Summer 2025", rating: 5, priority: 3,
        textEn: "Sample text: replace with a real review. Room for everyone, a pool for the kids and long dinners at the big table.",
        textFr: "Texte d’exemple : à remplacer par un vrai avis. De la place pour tous, une piscine pour les enfants et de longs dîners à la grande table.",
      },
      {
        sample: true, name: "Sample guest B", origin: "Brussels, Belgium", stayLabel: "Spring 2025", rating: 5, priority: 2,
        textEn: "Sample text: replace with a real review. Quiet, beautiful views and hosts who answered within minutes.",
        textFr: "Texte d’exemple : à remplacer par un vrai avis. Calme, belles vues et des hôtes qui répondent en quelques minutes.",
      },
      {
        sample: true, name: "Sample guest C", origin: "Amsterdam, Netherlands", stayLabel: "Autumn 2024", rating: 4, priority: 1,
        textEn: "Sample text: replace with a real review. A great base for exploring Conques and the gorges.",
        textFr: "Texte d’exemple : à remplacer par un vrai avis. Une super base pour explorer Conques et les gorges.",
      },
    ],
  });
  console.log("seeded 3 sample reviews");
}
await db.$disconnect();
