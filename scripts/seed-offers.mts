// Adds three sample offers if there are none yet. Replace/edit them in Admin → Offers.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
if ((await db.offer.count()) === 0) {
  await db.offer.createMany({
    data: [
      {
        titleEn: "Stay 5 nights or more, save 10%", titleFr: "Séjournez 5 nuits ou plus, économisez 10 %",
        bodyEn: "Settle in for the week. The longer you stay, the less you pay, automatically at checkout.",
        bodyFr: "Posez vos valises pour la semaine. Plus vous restez, moins vous payez, automatiquement.",
        badgeEn: "Save 10%", badgeFr: "-10 %", kind: "percent", value: 10, minNights: 5, priority: 3,
        showBanner: true, showCard: true, imageUrl: "/img/photos/living-073.jpg",
      },
      {
        titleEn: "Welcome offer: 15% off your first direct booking", titleFr: "Offre de bienvenue : -15 % sur votre première réservation directe",
        bodyEn: "Use the code at checkout. No platform fees, and you talk straight to your hosts.",
        bodyFr: "Utilisez le code à la réservation. Sans frais de plateforme, et vous parlez directement à vos hôtes.",
        badgeEn: "Save 15%", badgeFr: "-15 %", kind: "percent", value: 15, minNights: 2, code: "BIENVENUE15", bookTo: "2027-03-31", priority: 2,
        showPopup: true, showCard: true, imageUrl: "/img/photos/living-037.jpg",
      },
      {
        titleEn: "Fireside winter weekends: 8% off", titleFr: "Week-ends d’hiver au coin du feu : -8 %",
        bodyEn: "Wood stove lit, pool-side silence, long evenings. Valid for winter stays.",
        bodyFr: "Poêle allumé, calme de l’hiver, longues soirées. Valable pour les séjours d’hiver.",
        badgeEn: "Save 8%", badgeFr: "-8 %", kind: "percent", value: 8, minNights: 2, stayFrom: "2026-12-01", stayTo: "2027-03-15", priority: 1,
        showCard: true, imageUrl: "/img/photos/living-032.jpg",
      },
    ],
  });
  console.log("seeded 3 offers");
}
await db.$disconnect();
