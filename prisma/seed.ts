import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const P = (n: string) => `/img/site/${n}.jpg`;

const photos = [
  ["exterior-garden", "The farmhouse seen from the lawn", "La bastide vue depuis la pelouse"],
  ["veranda-living", "Glass-walled lounge with wood stove", "Salon vitré avec poêle à bois"],
  ["great-room", "Beamed great room and dining area", "Grande pièce sous charpente et salle à manger"],
  ["courtyard-roofs", "Slate roofs and stone terraces", "Toits d'ardoise et terrasses en pierre"],
  ["bedroom-terracotta", "Terracotta bedroom with carved wooden bed", "Chambre terracotta avec lit en bois sculpté"],
  ["kitchen-blue", "Blue kitchen with brass tap", "Cuisine bleue et robinet laiton"],
  ["stone-living", "Stone-walled living room", "Salon aux murs de pierre"],
  ["petanque", "Pétanque court", "Terrain de pétanque"],
  ["veranda-lounge", "Lounge with views over the valley", "Salon avec vue sur la vallée"],
  ["long-table", "Long table for big family dinners", "Longue table pour les repas en famille"],
  ["bedroom-attic", "Attic bedroom under the beams", "Chambre mansardée sous les poutres"],
  ["suite-stone", "Stone suite with staircase", "Suite en pierre avec escalier"],
  ["kitchen-beams", "Kitchen and table under old beams", "Cuisine et table sous les poutres"],
  ["games-room", "Games room with table football", "Salle de jeux avec baby-foot"],
  ["bath-double", "Double vanity bathroom", "Salle de bain double vasque"],
  ["courtyard", "Courtyard and parking", "Cour et parking"],
  ["house-tree", "Garden with the old tree", "Jardin et vieil arbre"],
  ["fireplace-room", "Fireplace room", "Pièce avec cheminée"],
  ["bedroom-oak", "Bedroom with oak bed", "Chambre au lit en chêne"],
  ["petanque-flowers", "Pétanque court and flowers", "Pétanque et fleurs"],
].map(([f, en, fr]) => ({ src: P(f), alt_en: en, alt_fr: fr }));

const amenities = [
  { icon: "pool", en: "Heated pool", fr: "Piscine chauffée" },
  { icon: "tree", en: "Large fenced garden", fr: "Grand jardin clos" },
  { icon: "ball", en: "Pétanque, volleyball, badminton", fr: "Pétanque, volley, badminton" },
  { icon: "pingpong", en: "Table tennis & table football", fr: "Ping-pong et baby-foot" },
  { icon: "fire", en: "BBQ area", fr: "Coin barbecue" },
  { icon: "dining", en: "Dining table for 20", fr: "Table pour 20 personnes" },
  { icon: "cooking", en: "Three fully equipped kitchens", fr: "Trois cuisines équipées" },
  { icon: "wood", en: "Wood stove", fr: "Poêle à bois" },
  { icon: "car", en: "Free parking (10 cars) & EV charger", fr: "Parking gratuit (10 voitures) et borne de recharge" },
  { icon: "paw", en: "Pets welcome", fr: "Animaux bienvenus" },
  { icon: "wifi", en: "Wi-Fi", fr: "Wi-Fi" },
  { icon: "coffee", en: "Coffee machine", fr: "Machine à café" },
];

const spaces = [
  {
    key: "grand",
    sleeps: 10,
    photo: P("great-room"),
    en: { name: "Grand Gîte", blurb: "The big one: four bedrooms, a vast beamed living space and a table that seats the whole family.", facts: ["4 bedrooms", "2 bathrooms", "Living room & lounge", "Full kitchen"] },
    fr: { name: "Grand Gîte", blurb: "Le plus grand : quatre chambres, un vaste séjour sous charpente et une table pour toute la famille.", facts: ["4 chambres", "2 salles de bain", "Salon et séjour", "Cuisine équipée"] },
  },
  {
    key: "panorama",
    sleeps: 6,
    photo: P("veranda-living"),
    en: { name: "Gîte Panorama", blurb: "Glass walls onto the valley, a wood stove and a private terrace.", facts: ["1 bedroom + mezzanine", "1 bathroom", "Private terrace", "Living room"] },
    fr: { name: "Gîte Panorama", blurb: "Baies vitrées sur la vallée, poêle à bois et terrasse privée.", facts: ["1 chambre + mezzanine", "1 salle de bain", "Terrasse privée", "Salon"] },
  },
  {
    key: "cocon",
    sleeps: 4,
    photo: P("stone-living"),
    en: { name: "Le Cocon", blurb: "Stone walls and warm light: the snug one, for two couples or a small family.", facts: ["1 bedroom", "1 bathroom", "Kitchen", "Living room"] },
    fr: { name: "Le Cocon", blurb: "Murs de pierre et lumière douce : le plus intime, pour deux couples ou une petite famille.", facts: ["1 chambre", "1 salle de bain", "Cuisine", "Salon"] },
  },
];

const content = {
  en: {
    tagline: "A stone farmhouse in the Aveyron hills, with a heated pool, for up to 20 guests.",
    summary: "Three restored cottages around one garden, shared as a single private estate: pool, pétanque, a table for twenty and nobody else.",
    story: [
      "La Bastide de Lestrebaldie is a restored farmhouse above the Aveyron valley, split into three independent cottages that open onto the same garden.",
      "Book it whole and it is entirely yours: the heated pool, the fenced lawn, the pétanque court, the BBQ and a dining table long enough for everyone. Inside, old oak beams, stone walls and big glass veranda windows keep the rooms bright and the evenings warm.",
      "Your hosts live nearby and reply within the hour.",
    ],
    rules: ["Pets are welcome", "Quiet hours from 22:00 to 08:00", "No parties or events without prior agreement", "No smoking inside", "Please treat the pool area with care and supervise children"],
    highlights: ["Guest Favorite on Airbnb", "Heated pool", "Free parking for 10 cars"],
  },
  fr: {
    tagline: "Une bastide en pierre dans les collines de l'Aveyron, avec piscine chauffée, jusqu'à 20 personnes.",
    summary: "Trois gîtes restaurés autour d'un même jardin, loués ensemble comme un domaine privé : piscine, pétanque, table pour vingt et personne d'autre.",
    story: [
      "La Bastide de Lestrebaldie est une ferme restaurée au-dessus de la vallée de l'Aveyron, divisée en trois gîtes indépendants qui donnent sur le même jardin.",
      "Réservée en entier, elle est à vous : la piscine chauffée, la pelouse close, le terrain de pétanque, le barbecue et une table assez longue pour tout le monde. À l'intérieur, poutres de chêne, murs de pierre et grandes baies vitrées gardent les pièces lumineuses et les soirées chaleureuses.",
      "Vos hôtes habitent à proximité et répondent en moins d'une heure.",
    ],
    rules: ["Animaux bienvenus", "Calme de 22h à 8h", "Pas de fêtes ni d'événements sans accord préalable", "Non-fumeur à l'intérieur", "Merci de surveiller les enfants autour de la piscine"],
    highlights: ["Coup de cœur voyageurs Airbnb", "Piscine chauffée", "Parking gratuit pour 10 voitures"],
  },
};

const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

async function main() {
  await db.notification.deleteMany();
  await db.refund.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.property.deleteMany();
  await db.user.deleteMany();

  await db.user.create({
    data: {
      email: process.env.ADMIN_EMAIL ?? "admin@lestrebaldie.example",
      name: "Owner",
      role: "admin",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "change-me-now", 10),
    },
  });
  const guest = await db.user.create({
    data: { email: "guest@example.com", name: "Camille Martin", passwordHash: await bcrypt.hash("guest1234", 10) },
  });

  // NOTE: rates, fees, rules and policy below are PLACEHOLDERS until the client confirms them.
  const prop = await db.property.create({
    data: {
      slug: "la-bastide-de-lestrebaldie",
      name: "La Bastide de Lestrebaldie",
      location: "Centrès, Aveyron, Occitanie",
      maxGuests: 20,
      bedrooms: 6,
      beds: 11,
      bathrooms: 3,
      baseNight: 38000,
      cleaningFee: 15000,
      touristTax: 100,
      minNights: 2,
      content: JSON.stringify(content),
      photos: JSON.stringify(photos),
      amenities: JSON.stringify(amenities),
      spaces: JSON.stringify(spaces),
      seasons: JSON.stringify([
        { name: "Summer", from: "07-01", to: "08-31", night: 52000 },
        { name: "Christmas", from: "12-20", to: "01-03", night: 46000 },
      ]),
      policy: JSON.stringify([
        { daysBefore: 30, refundPct: 100 },
        { daysBefore: 14, refundPct: 50 },
        { daysBefore: 0, refundPct: 0 },
      ]),
    },
  });

  const mk = async (o: {
    ref: string; name: string; email: string; from: string; to: string; source: string;
    adults?: number; total?: number; userId?: string; status?: string;
  }) => {
    const nights = Math.round((Date.parse(o.to) - Date.parse(o.from)) / 86400000);
    const acc = (o.total ?? 0) ? o.total! - 15000 - nights * (o.adults ?? 2) * 100 : 0;
    const b = await db.booking.create({
      data: {
        ref: o.ref, propertyId: prop.id, userId: o.userId, guestName: o.name, guestEmail: o.email,
        adults: o.adults ?? 2, checkIn: o.from, checkOut: o.to, nights, source: o.source,
        status: o.status ?? "confirmed", accommodation: acc, cleaning: o.total ? 15000 : 0,
        tax: o.total ? nights * (o.adults ?? 2) * 100 : 0, total: o.total ?? 0,
      },
    });
    if (o.total && o.source === "direct")
      await db.payment.create({ data: { bookingId: b.id, amount: o.total, status: "paid", provider: "demo" } });
    return b;
  };

  await mk({ ref: "AB7K2Q", name: "Airbnb guest", email: "airbnb@import.local", from: d(12), to: d(16), source: "airbnb", adults: 12 });
  await mk({ ref: "AB9X1M", name: "Airbnb guest", email: "airbnb@import.local", from: d(40), to: d(47), source: "airbnb", adults: 16 });
  await mk({ ref: "LBDEMO", name: "Camille Martin", email: "guest@example.com", from: d(60), to: d(65), source: "direct", adults: 10, total: 5 * 38000 + 15000 + 5 * 10 * 100, userId: guest.id });
  await mk({ ref: "LBBLK1", name: "Owner block", email: "owner@lestrebaldie.example", from: d(25), to: d(28), source: "block" });

  await db.notification.create({
    data: { audience: "owner", to: "owner@lestrebaldie.example", subject: "New booking LBDEMO: Camille Martin", body: "Camille Martin booked La Bastide de Lestrebaldie for 5 nights, 10 guests.", delivered: false },
  });
  console.log("Seeded. Admin:", process.env.ADMIN_EMAIL, "| demo guest: guest@example.com / guest1234");
}

main().finally(() => db.$disconnect());
