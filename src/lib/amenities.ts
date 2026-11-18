import type { Amenity } from "./property";

export const AMENITY_CATALOG: Record<string, Amenity> = {
  pool: { icon: "pool", en: "Pool", fr: "Piscine" },
  tree: { icon: "tree", en: "Garden", fr: "Jardin" },
  ball: { icon: "ball", en: "Outdoor games", fr: "Jeux d'extérieur" },
  pingpong: { icon: "pingpong", en: "Table tennis", fr: "Ping-pong" },
  fire: { icon: "fire", en: "BBQ", fr: "Barbecue" },
  dining: { icon: "dining", en: "Large dining table", fr: "Grande table" },
  cooking: { icon: "cooking", en: "Equipped kitchen", fr: "Cuisine équipée" },
  wood: { icon: "wood", en: "Wood stove", fr: "Poêle à bois" },
  car: { icon: "car", en: "Free parking", fr: "Parking gratuit" },
  paw: { icon: "paw", en: "Pets welcome", fr: "Animaux bienvenus" },
  wifi: { icon: "wifi", en: "Wi-Fi", fr: "Wi-Fi" },
  coffee: { icon: "coffee", en: "Coffee machine", fr: "Machine à café" },
};
