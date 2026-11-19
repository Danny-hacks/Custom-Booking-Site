/**
 * The photo library (professional shoot supplied by the owners). Files live in public/img/photos and are named
 * "<category>-<number>.jpg"; the number is the photographer's own frame number. To add a photo: drop the file in that
 * folder, add one line here, and (optionally) list it in PROPERTY_PHOTO_ORDER.
 * Pure data: safe to import from pages, the seed and the update scripts.
 */
export type PhotoCat = "living" | "kitchen" | "bedroom" | "bathroom" | "detail" | "outdoor" | "pool";
export type CatalogPhoto = { src: string; cat: PhotoCat; alt_en: string; alt_fr: string };

const P = (cat: PhotoCat, n: number, alt_en: string, alt_fr: string): CatalogPhoto => ({
  src: `/img/photos/${cat}-${String(n).padStart(3, "0")}.jpg`,
  cat,
  alt_en,
  alt_fr,
});

export const CATALOG: CatalogPhoto[] = [
  // living rooms
  P("living", 1, "Glass-walled living room with wood stove and valley view", "Salon vitré avec poêle à bois et vue sur la vallée"),
  P("living", 2, "Open living room, kitchen and dining under exposed beams", "Séjour, cuisine et salle à manger ouverts sous les poutres"),
  P("living", 3, "Dining table under the beams, kitchen behind", "Table à manger sous les poutres, cuisine au fond"),
  P("living", 5, "Dining area and armchairs in the glass living room", "Coin repas et fauteuils dans le salon vitré"),
  P("living", 6, "Sideboard and armchairs by the glass wall", "Buffet et fauteuils près de la baie vitrée"),
  P("living", 7, "Blue sofa and wing chairs in the sunlit living room", "Canapé bleu et fauteuils dans le salon ensoleillé"),
  P("living", 8, "Cast-iron stove and TV corner facing the lawn", "Poêle en fonte et coin télé face à la pelouse"),
  P("living", 11, "Lounge with wooden staircase and armchairs", "Salon avec escalier en bois et fauteuils"),
  P("living", 32, "Rustic lounge with stone, beams and a leather armchair", "Salon rustique : pierre, poutres et fauteuil en cuir"),
  P("living", 33, "Games room with foosball and a wooden kitchen", "Salle de jeux avec baby-foot et cuisine en bois"),
  P("living", 34, "Open ground floor with foosball and spiral stairs", "Rez-de-chaussée ouvert, baby-foot et escalier tournant"),
  P("living", 36, "Dining table by a stone wall", "Table à manger près d'un mur en pierre"),
  P("living", 37, "Glazed dining room over the valley", "Salle à manger vitrée sur la vallée"),
  P("living", 38, "Dining room with terrace access and valley views", "Salle à manger avec accès terrasse et vue sur la vallée"),
  P("living", 47, "Blue corner sofa and yellow armchairs on tiled floor", "Canapé d'angle bleu et fauteuils jaunes"),
  P("living", 48, "Living room with a stone wall and woven rug", "Salon avec mur en pierre et tapis tressé"),
  P("living", 49, "Living room opening onto the garden", "Salon ouvert sur le jardin"),
  P("living", 50, "Cosy sofa corner with a view of the lawn", "Coin canapé douillet avec vue sur la pelouse"),
  P("living", 70, "Ground-floor lounge with a stone wall and dining table", "Salon du rez-de-chaussée, mur en pierre et table"),
  P("living", 71, "Sofa corner with teal curtains", "Coin canapé aux rideaux bleu canard"),
  P("living", 72, "Dining area with a foosball table", "Salle à manger avec baby-foot"),
  P("living", 73, "Long dining table beside a stone wall", "Longue table près d'un mur en pierre"),
  // kitchens
  P("kitchen", 4, "Navy-blue kitchen opening onto the dining area", "Cuisine bleu marine ouverte sur la salle à manger"),
  P("kitchen", 22, "Brass tap and spice rack at the kitchen sink", "Robinet laiton et range-épices à l'évier"),
  P("kitchen", 23, "Kitchen sink with a brass tap", "Évier de cuisine et robinet laiton"),
  P("kitchen", 35, "Honey-wood fitted kitchen", "Cuisine équipée en bois miel"),
  P("kitchen", 61, "Cosy kitchen corner with tiled backsplash", "Coin cuisine avec crédence en carreaux"),
  P("kitchen", 78, "Modern grey-green kitchen", "Cuisine moderne gris-vert"),
  // bedrooms
  P("bedroom", 9, "Stone-walled bedroom with a double bed", "Chambre aux murs de pierre avec lit double"),
  P("bedroom", 10, "Bedroom with oak floor and stone wall", "Chambre avec parquet en chêne et mur en pierre"),
  P("bedroom", 12, "Attic bedroom under old beams", "Chambre sous les combles et les vieilles poutres"),
  P("bedroom", 13, "Mezzanine bed beside a carved wardrobe", "Lit en mezzanine près d'une armoire sculptée"),
  P("bedroom", 39, "Bright attic bedroom with a double bed", "Chambre lumineuse sous les combles, lit double"),
  P("bedroom", 40, "Whitewashed bedroom with seagrass flooring", "Chambre chaulée au sol en jonc de mer"),
  P("bedroom", 41, "Twin beds in a stone-and-white attic room", "Lits jumeaux dans une chambre sous les combles"),
  P("bedroom", 42, "Dark wooden bed in an attic room", "Lit en bois sombre sous les combles"),
  P("bedroom", 43, "Bedroom seen through a doorway", "Chambre vue depuis l'entrée"),
  P("bedroom", 44, "Large bed with crisp white linen", "Grand lit en linge blanc"),
  P("bedroom", 45, "Attic bedroom with a skylight", "Chambre mansardée avec lucarne"),
  P("bedroom", 46, "Two bedrooms side by side", "Deux chambres côte à côte"),
  P("bedroom", 51, "Terracotta bedroom with a carved wooden bed", "Chambre terracotta avec lit en bois sculpté"),
  P("bedroom", 52, "Terracotta bedroom with bed and woven rug", "Chambre terracotta, lit et tapis tressé"),
  P("bedroom", 63, "Terracotta wall behind a carved bedhead", "Mur terracotta derrière une tête de lit sculptée"),
  P("bedroom", 64, "Bedside lamp on a rattan table", "Lampe de chevet sur table en rotin"),
  P("bedroom", 74, "Bedroom with a double bed and bedside lamps", "Chambre avec lit double et lampes de chevet"),
  P("bedroom", 75, "Bedroom with built-in wardrobes", "Chambre avec placards intégrés"),
  P("bedroom", 81, "Bed with a soft bedside lamp", "Lit et lampe de chevet douce"),
  P("bedroom", 82, "Pillow and bedside lamp by a window", "Oreiller et lampe près de la fenêtre"),
  // bathrooms
  P("bathroom", 14, "Bathroom with wood-effect tiles and a walk-in shower", "Salle de bains carrelage effet bois et douche à l'italienne"),
  P("bathroom", 15, "Washbasin and round mirror in the bathroom", "Vasque et miroir rond dans la salle de bains"),
  P("bathroom", 16, "Walk-in rain shower", "Douche à l'italienne"),
  P("bathroom", 53, "Double-basin bathroom with a whirlpool bath", "Salle de bains double vasque et baignoire balnéo"),
  P("bathroom", 54, "Bathroom with a window over the valley", "Salle de bains avec fenêtre sur la vallée"),
  P("bathroom", 55, "Whirlpool bath facing the valley", "Baignoire balnéo face à la vallée"),
  P("bathroom", 56, "Shower cabin and separate toilet", "Cabine de douche et WC séparé"),
  P("bathroom", 65, "Vessel basin with blue patterned tiles", "Vasque à poser et carreaux bleus"),
  P("bathroom", 66, "Bath tap and blue-tiled wall", "Robinetterie de bain et carreaux bleus"),
  P("bathroom", 67, "Whirlpool bath detail", "Détail de la baignoire balnéo"),
  P("bathroom", 76, "Shower room with a window to the hills", "Salle d'eau avec douche et fenêtre sur les collines"),
  P("bathroom", 77, "Glass shower cubicle", "Cabine de douche vitrée"),
  P("bathroom", 83, "Green-tiled bathroom basin", "Lavabo et carrelage vert"),
  P("bathroom", 84, "Shower room under a wooden ceiling", "Salle d'eau sous un plafond en bois"),
  // outdoors
  P("outdoor", 86, "The house and its garden under a blue sky", "La maison et son jardin sous un ciel bleu"),
  P("outdoor", 100, "The stone farmhouse above its arched bridge", "La ferme en pierre au-dessus de son pont à arches"),
  P("outdoor", 99, "Stone terrace with a wood-fired oven", "Terrasse en pierre avec four à bois"),
  P("outdoor", 102, "The courtyard of the farmhouse", "La cour de la ferme"),
  P("outdoor", 96, "The house behind a large tree, with swings", "La maison derrière un grand arbre, avec balançoires"),
  P("outdoor", 97, "Garden with swings and the house", "Jardin, balançoires et maison"),
  P("outdoor", 87, "Garden sloping down to the pool shelter", "Jardin descendant vers l'abri de la piscine"),
  P("outdoor", 200, "Terrace with barbecue and the pool shelter below", "Terrasse avec barbecue et abri de piscine"),
  P("outdoor", 89, "Terrace with a table for twelve", "Terrasse avec table pour douze"),
  P("outdoor", 94, "Shaded terrace with dining table", "Terrasse ombragée et table à manger"),
  P("outdoor", 95, "Garden lounge seating", "Salon de jardin"),
  P("outdoor", 85, "Pétanque court beside the hedge", "Terrain de pétanque le long de la haie"),
  P("outdoor", 91, "Pétanque court with a flower pot", "Terrain de pétanque et pot de fleurs"),
  P("outdoor", 98, "Gravel pétanque court", "Terrain de pétanque en gravier"),
  P("outdoor", 88, "Wildflowers beneath an old olive tree", "Fleurs sauvages sous un vieil olivier"),
  P("outdoor", 93, "The glazed veranda and the outside stairs", "La véranda vitrée et l'escalier extérieur"),
  P("outdoor", 92, "Slate roof and stone corners", "Toit d'ardoise et angles en pierre"),
  P("outdoor", 101, "Stone lane beside the farmhouse", "Ruelle de pierre le long de la ferme"),
  P("outdoor", 103, "Shuttered stone window among the leaves", "Fenêtre aux volets bruns dans le feuillage"),
  P("outdoor", 104, "Garden gate and wooden doors", "Portail du jardin et portes en bois"),
  P("outdoor", 105, "The house against the wooded hills", "La maison face aux collines boisées"),
  // pool (supplied as 1.5k PNGs: used at modest sizes only)
  P("pool", 1, "The heated covered pool", "La piscine couverte et chauffée"),
  P("pool", 2, "Pool with loungers and valley views", "Piscine, transats et vue sur la vallée"),
  // the small things: cosy details
  P("detail", 17, "Table setting with a woven placemat", "Mise en table et set tressé"),
  P("detail", 18, "Coffee machine ready on the counter", "Machine à café prête sur le plan de travail"),
  P("detail", 19, "The stove glowing beside the dining table", "Le poêle près de la table"),
  P("detail", 20, "Cushions and nesting tables by the sofa", "Coussins et tables gigognes près du canapé"),
  P("detail", 21, "Wire fruit basket by the window", "Corbeille à fruits près de la fenêtre"),
  P("detail", 24, "Wrought-iron bedhead with a floral motif", "Tête de lit en fer forgé à motif floral"),
  P("detail", 25, "Bedside lamp glowing against the stone", "Lampe de chevet sur la pierre"),
  P("detail", 26, "Antique sewing machine", "Machine à coudre ancienne"),
  P("detail", 27, "Soft pillow and lamp against a stone wall", "Oreiller et lampe contre un mur en pierre"),
  P("detail", 28, "Wagon-wheel chandelier", "Lustre en roue de charrette"),
  P("detail", 29, "Old leather bag hanging from a beam", "Vieux sac en cuir suspendu à une poutre"),
  P("detail", 30, "Backlit round mirror", "Miroir rond rétroéclairé"),
  P("detail", 31, "Black tap on a white basin", "Robinet noir sur vasque blanche"),
  P("detail", 57, "Teapot and cups on a wooden table", "Théière et tasses sur la table en bois"),
  P("detail", 58, "Welcome booklet beside the tea cups", "Livret d'accueil près des tasses"),
  P("detail", 59, "Straw hat with a blue ribbon on a shelf", "Chapeau de paille et ruban bleu sur une étagère"),
  P("detail", 60, "Woven wall decoration and wooden shelf", "Décoration murale tressée et étagère en bois"),
  P("detail", 62, "Glass demijohn beside a linen curtain", "Dame-jeanne en verre près d'un rideau en lin"),
  P("detail", 68, "Woven vase on a seagrass mat", "Vase tressé sur un tapis de jonc"),
  P("detail", 69, "Espresso machine against a stone wall", "Machine à expresso devant un mur en pierre"),
  P("detail", 79, "Cooktop and microwave with a bright tea towel", "Plaque et micro-ondes, torchon coloré"),
  P("detail", 80, "Antique “Cuisine” door sign", "Plaque de porte ancienne « Cuisine »"),
  P("detail", 90, "Succulent on a gravel-topped post", "Joubarbe sur un poteau gravillonné"),
];

export const CAT_LABEL: Record<PhotoCat, { en: string; fr: string }> = {
  living: { en: "Living spaces", fr: "Pièces de vie" },
  kitchen: { en: "Kitchens", fr: "Cuisines" },
  bedroom: { en: "Bedrooms", fr: "Chambres" },
  bathroom: { en: "Bathrooms", fr: "Salles de bains" },
  pool: { en: "Pool", fr: "Piscine" },
  outdoor: { en: "Outdoors", fr: "Extérieurs" },
  detail: { en: "Little details", fr: "Petits détails" },
};
export const CAT_ORDER: PhotoCat[] = ["living", "bedroom", "kitchen", "bathroom", "outdoor", "pool", "detail"];

const bySrc = new Map(CATALOG.map((p) => [p.src, p]));
export const photo = (src: string) => bySrc.get(src);
export const catOf = (src: string): PhotoCat | undefined => bySrc.get(src)?.cat;
export const inCat = (cat: PhotoCat) => CATALOG.filter((p) => p.cat === cat);
const find = (cat: PhotoCat, n: number) => `/img/photos/${cat}-${String(n).padStart(3, "0")}.jpg`;
export const ph = (cat: PhotoCat, n: number) => bySrc.get(find(cat, n))!;

/** The property gallery: the five mosaic photos first (outside, living room, the garden, a bedroom, the cosy lounge), then the rest by room type. */
const LEAD = [find("outdoor", 86), find("living", 2), find("pool", 1), find("bedroom", 51), find("living", 49), find("outdoor", 102)];
export const PROPERTY_PHOTOS = [
  ...LEAD.map((s) => bySrc.get(s)!),
  ...CAT_ORDER.flatMap((c) => inCat(c)).filter((p) => !LEAD.includes(p.src)),
].map(({ src, alt_en, alt_fr }) => ({ src, alt_en, alt_fr }));

/** The three cottages' card photos (which photo belongs to which cottage still needs the owners' confirmation). */
export const COTTAGE_PHOTOS = { grand: find("living", 2), panorama: find("living", 7), cocon: find("bedroom", 51) };
