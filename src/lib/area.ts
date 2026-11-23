import type { Locale } from "./property";
import credits from "./area-credits.json";

export type AreaPhoto = keyof typeof credits;
/** Author and licence of every area photo (Wikimedia Commons). Shown on the Area page, as the licences require. */
export const AREA_CREDITS = credits;

type L = Record<Locale, string>;
type LL = Record<Locale, string[]>;

export type Category = "villages" | "heritage" | "nature" | "food";

/** What a visitor feels like doing. A place can have several. */
export type Activity = "rainy" | "family" | "swim" | "walk" | "free" | "taste" | "culture";

export const ACTIVITIES: { key: Activity; label: L }[] = [
  { key: "rainy", label: { en: "Rainy day", fr: "Jour de pluie" } },
  { key: "family", label: { en: "With children", fr: "En famille" } },
  { key: "swim", label: { en: "Swim & water", fr: "Baignade" } },
  { key: "walk", label: { en: "Walks & views", fr: "Balades & vues" } },
  { key: "free", label: { en: "Free to visit", fr: "Gratuit" } },
  { key: "taste", label: { en: "Taste & shop", fr: "Goûter & acheter" } },
  { key: "culture", label: { en: "History & art", fr: "Histoire & art" } },
];

export const CATEGORIES: { key: Category; label: L }[] = [
  { key: "villages", label: { en: "Villages & towns", fr: "Villages & villes" } },
  { key: "heritage", label: { en: "History & heritage", fr: "Histoire & patrimoine" } },
  { key: "nature", label: { en: "Nature, lakes & walks", fr: "Nature, lacs & balades" } },
  { key: "food", label: { en: "Food & markets", fr: "Table & marchés" } },
];

export type Place = {
  slug: string;
  /** What it is good for: drives the "things to do" filter. */
  tags: Activity[];
  /** Where the place is (approximate), for the map. Walking and food are not single points. */
  lat?: number;
  lon?: number;
  name: string;
  nameFr?: string;
  category: Category;
  tag: L;
  /** One or two sentences for the card. */
  summary: L;
  /** Paragraphs for the place's own page. */
  body: LL;
  /** Practical tips for the place's own page. */
  tips?: LL;
  /** Approximate drive from Centrès, in minutes (road routing from the centre of the commune; rounded). */
  drive: number;
  icon: string;
  photo?: AreaPhoto;
  /** An official page worth a click, shown on the place's page. */
  official?: { label: L; url: string };
};

/**
 * The guide is written in our own words from public facts (tourist offices, Wikipedia, mapping data). Nothing is copied from
 * the tourist offices' sites: their notices reserve their texts and photos, and forbid extracting their database.
 * Drive times were computed with OpenStreetMap routing from the centre of Centrès and rounded; the estate itself may be a few minutes
 * either way. Photos are Wikimedia Commons images (credited on the Area page); places without a photo show an icon.
 */
export const PLACES: Place[] = [
  {
    slug: "chateau-de-taurines", tags: ["family", "walk", "culture"], lat: 44.1606, lon: 2.4668, name: "Château de Taurines", category: "heritage", drive: 10, icon: "pin", photo: "taurines",
    tag: { en: "In Centrès", fr: "À Centrès" },
    summary: { en: "A castle in our own commune, and the start of an easy family walk.", fr: "Un château dans notre commune, au départ d’une balade facile en famille." },
    body: {
      en: [
        "Château de Taurines stands in the commune of Centrès, a few minutes from the estate. The departmental tourist board lists it as the starting point of an easy walk that suits families, which makes it a good first outing when everyone has just arrived and wants to stretch their legs.",
        "It is the closest of the heritage sites in this guide. Pair it with the Château du Bosc for a relaxed half-day of old stones.",
      ],
      fr: [
        "Le château de Taurines se dresse sur la commune de Centrès, à quelques minutes du domaine. L’Agence de développement touristique de l’Aveyron le signale comme point de départ d’une balade facile, adaptée aux familles : une bonne première sortie quand tout le monde vient d’arriver et veut se dégourdir les jambes.",
        "C’est le site patrimonial le plus proche de ce guide. Associez-le au château du Bosc pour une demi-journée tranquille entre vieilles pierres.",
      ],
    },
    tips: {
      en: ["Check what is open to visitors before you set off, as opening depends on the season."],
      fr: ["Vérifiez ce qui se visite avant de partir : les ouvertures dépendent de la saison."],
    },
  },
  {
    slug: "chateau-du-bosc", tags: ["rainy", "culture", "family"], lat: 44.1643, lon: 2.3811, name: "Château du Bosc", category: "heritage", drive: 10, icon: "star", photo: "bosc",
    tag: { en: "Toulouse-Lautrec’s family home", fr: "La maison de famille de Toulouse-Lautrec" },
    summary: { en: "The red-shuttered castle where the painter’s family lived, with his drawings and posters inside.", fr: "Le château aux volets rouges de la famille du peintre, avec ses dessins et affiches." },
    body: {
      en: [
        "The Château du Bosc, at Camjac, is a medieval castle remembered as the family home of Henri de Toulouse-Lautrec’s relatives. It is visited with a guide and holds drawings, posters and lithographs by the artist, set in rooms that still feel lived in.",
        "It is one of the nearest sights to the estate, so it works well on a day when the weather is uncertain or when younger and older guests want something calm.",
      ],
      fr: [
        "Le château du Bosc, à Camjac, est un château médiéval resté dans la mémoire comme la maison de famille des proches d’Henri de Toulouse-Lautrec. Il se visite avec un guide et conserve des dessins, des affiches et des lithographies de l’artiste, dans des pièces qui gardent un air habité.",
        "C’est l’une des visites les plus proches du domaine : parfaite les jours de météo incertaine, ou quand petits et grands veulent quelque chose de calme.",
      ],
    },
    tips: {
      en: ["Visits are guided and seasonal. Check hours and book on the château’s own website."],
      fr: ["Les visites sont guidées et saisonnières. Vérifiez les horaires et réservez sur le site du château."],
    },
    official: { label: { en: "Château du Bosc (official site)", fr: "Château du Bosc (site officiel)" }, url: "https://en.chateaudubosc.com/" },
  },
  {
    slug: "naucelle", tags: ["rainy", "family", "taste", "swim"], lat: 44.1979, lon: 2.3418, name: "Naucelle", category: "villages", drive: 15, icon: "pin", photo: "naucelle",
    tag: { en: "Village · tripous · farm shop", fr: "Village · tripous · produits fermiers" },
    summary: { en: "An old “sauveté” with local producers, a swimming centre and free guided walks.", fr: "Une ancienne sauveté, avec ses producteurs, un espace aquatique et des balades guidées gratuites." },
    body: {
      en: [
        "Naucelle began as a “sauveté”, a protected settlement founded around a church, and its character still shapes the Ségala. Today it is a handy base for everyday errands and a good place to taste the region: the tripous (stuffed veal paunch, slowly cooked in white wine) are made here, and a farm shop gathers local producers under one roof.",
        "There is also an aquatic centre for rainy days, and free guided hikes leave from Naucelle and from Sauveterre-de-Rouergue during the season.",
      ],
      fr: [
        "Naucelle est née d’une « sauveté », un lieu protégé fondé autour d’une église, et cette histoire marque encore le Ségala. C’est aujourd’hui une étape pratique pour les courses et un bon endroit pour goûter le pays : on y fabrique les tripous (panse de veau farcie, longuement mijotée au vin blanc), et un magasin de producteurs réunit les fermes des environs.",
        "On y trouve aussi un espace aquatique pour les jours de pluie, et des randonnées guidées gratuites partent de Naucelle et de Sauveterre-de-Rouergue en saison.",
      ],
    },
    tips: {
      en: ["Ask at the tourist office for the free guided walk calendar."],
      fr: ["Demandez le calendrier des randonnées guidées gratuites à l’office de tourisme."],
    },
  },
  {
    slug: "viaduc-du-viaur", tags: ["free", "walk", "family"], lat: 44.1172, lon: 2.3113, name: "Viaduc du Viaur", nameFr: "Viaduc du Viaur", category: "heritage", drive: 20, icon: "mountains", photo: "viaduc",
    tag: { en: "A 1902 iron arch", fr: "Une arche de fer de 1902" },
    summary: { en: "A 460 m railway viaduct, about 116 m high, crossing the Viaur between Aveyron and Tarn.", fr: "Un viaduc ferroviaire de 460 m, haut d’environ 116 m, qui enjambe le Viaur entre Aveyron et Tarn." },
    body: {
      en: [
        "The Viaur viaduct carries the railway across the river valley on the border of Aveyron and Tarn. It was built between 1895 and 1902 to a design by the engineer Paul Bodin, measures about 460 m and rises roughly 116 m above the water, and it is a listed historic monument.",
        "You do not need a ticket to enjoy it. Free viewpoints include an area named after Paul Bodin, with picnic tables and information panels, and another at the foot of the viaduct. A 7 km circuit around it starts from Tauriac-de-Naucelle.",
      ],
      fr: [
        "Le viaduc du Viaur porte la voie ferrée au-dessus de la vallée, à la limite de l’Aveyron et du Tarn. Construit de 1895 à 1902 d’après les plans de l’ingénieur Paul Bodin, il mesure environ 460 m et domine la rivière d’environ 116 m. Il est classé monument historique.",
        "Pas besoin de billet pour en profiter. Des points de vue gratuits sont aménagés, dont une aire portant le nom de Paul Bodin (tables de pique-nique et panneaux d’information) et une autre au pied du viaduc. Un circuit de 7 km autour de l’ouvrage part de Tauriac-de-Naucelle.",
      ],
    },
    tips: {
      en: ["Bring a picnic: the viewpoint areas are set up for it.", "Early morning light is best for photos."],
      fr: ["Apportez un pique-nique : les aires de point de vue sont prévues pour cela.", "La lumière du matin est la plus belle pour les photos."],
    },
    official: { label: { en: "Visitor information (Destination Ségala, in French)", fr: "Informations visiteurs (Destination Ségala)" }, url: "https://www.destinationsegala.fr/incontournables/viaduc-du-viaur/" },
  },
  {
    slug: "sauveterre-de-rouergue", tags: ["rainy", "culture", "free", "taste"], lat: 44.221, lon: 2.3181, name: "Sauveterre-de-Rouergue", category: "villages", drive: 20, icon: "pin", photo: "sauveterre",
    tag: { en: "Royal bastide", fr: "Bastide royale" },
    summary: { en: "An arcaded square, craft studios and an art trail, in one of France’s most beautiful villages.", fr: "Une place à arcades, des ateliers d’art et un sentier d’art, dans l’un des plus beaux villages de France." },
    body: {
      en: [
        "Sauveterre-de-Rouergue is a royal bastide laid out around a broad square lined with stone arcades, and it is counted among the Most Beautiful Villages of France. It is the most photogenic stop in the Ségala and a very easy one: park, then walk everywhere.",
        "The village is also the home of the Pôle des métiers d’art du Pays Ségali, whose shop and museum, L’Ancre, show local craftwork, with exhibitions running through the season. There is an art trail through the bastide, and the village holds gourmet and night markets in summer.",
      ],
      fr: [
        "Sauveterre-de-Rouergue est une bastide royale organisée autour d’une vaste place bordée d’arcades de pierre, classée parmi les Plus Beaux Villages de France. C’est l’étape la plus photogénique du Ségala, et la plus simple : on se gare, puis on fait tout à pied.",
        "Le village abrite aussi le Pôle des métiers d’art du Pays Ségali, dont la boutique-musée, L’Ancre, présente le travail des artisans du pays, avec des expositions pendant la saison. Un sentier d’art parcourt la bastide, et le village organise des marchés gourmands et nocturnes l’été.",
      ],
    },
    tips: {
      en: ["The tourist office is on the main square (Place des Arcades)."],
      fr: ["L’office de tourisme se trouve sur la place des Arcades."],
    },
    official: { label: { en: "Villages of character (Destination Ségala, in French)", fr: "Villages de caractère (Destination Ségala)" }, url: "https://www.destinationsegala.fr/incontournables/villages-de-caractere/" },
  },
  {
    slug: "lac-du-val-de-lenne", tags: ["swim", "family", "walk"], lat: 44.2841, lon: 2.4388, name: "Lac du Val de Lenne", category: "nature", drive: 25, icon: "mountains",
    tag: { en: "Swim · paddle · walk", fr: "Baignade · pagaie · balade" },
    summary: { en: "A lake and leisure base at Baraqueville for water sports, walking and mountain biking.", fr: "Un lac et une base de loisirs à Baraqueville : sports nautiques, marche et VTT." },
    body: {
      en: [
        "Lac du Val de Lenne, at Baraqueville, is a lake and leisure base with water sports in season and marked walking and mountain-bike trails around the shore. “Le chemin des lacs” is an 11 km walk starting at Baraqueville.",
        "Other lakes and bathing spots are scattered across the Ségala, including the lake of Le Muret at Le Bas-Ségala and the Roucarie lake at Almayrac. Not every natural bathing site is supervised, so check before swimming with children.",
      ],
      fr: [
        "Le lac du Val de Lenne, à Baraqueville, est un lac et une base de loisirs : sports nautiques en saison, sentiers de randonnée et de VTT balisés autour du plan d’eau. « Le chemin des lacs » est une balade de 11 km au départ de Baraqueville.",
        "D’autres lacs et lieux de baignade sont dispersés dans le Ségala, dont le lac du Muret au Bas-Ségala et le lac de la Roucarie à Almayrac. Tous les sites de baignade naturels ne sont pas surveillés : renseignez-vous avant de se baigner avec des enfants.",
      ],
    },
    tips: {
      en: ["Check supervision and opening before you go; it changes with the season."],
      fr: ["Vérifiez la surveillance et les ouvertures avant de partir : elles varient selon la saison."],
    },
    official: { label: { en: "Swimming spots (Destination Ségala, in French)", fr: "Lieux de baignade (Destination Ségala)" }, url: "https://www.destinationsegala.fr/activites-de-pleine-nature/baignade/" },
  },
  {
    slug: "randonnees-du-segala", tags: ["walk", "free", "family"], name: "Walking & cycling in the Ségala", nameFr: "Randonnées & vélo en Ségala", category: "nature", drive: 5, icon: "tree", photo: "walking",
    tag: { en: "100+ marked circuits", fr: "Plus de 100 circuits balisés" },
    summary: { en: "The “country of a hundred valleys”: over a hundred marked circuits, from easy loops to long days.", fr: "Le « pays aux cent vallées » : plus de cent circuits balisés, de la boucle facile à la longue journée." },
    body: {
      en: [
        "The Ségala is nicknamed the country of a hundred valleys, and walkers feel why. The tourist offices list well over a hundred marked circuits. A gentle first one is the Chemin des verriers at Cassagnes-Bégonhès (about 8 km, three hours), and there are family walks that start from the castles of Bosc and Taurines.",
        "Cyclists have signed road routes of 40 to 60 km and more, linking villages and bastides. Topo-guides and walk cards are sold in the tourist offices, and free guided walks run from Naucelle and Sauveterre-de-Rouergue.",
      ],
      fr: [
        "Le Ségala est surnommé le pays aux cent vallées, et les marcheurs comprennent pourquoi : les offices de tourisme recensent bien plus d’une centaine de circuits balisés. Pour commencer en douceur, le chemin des verriers à Cassagnes-Bégonhès (environ 8 km, trois heures), ou les balades en famille au départ des châteaux du Bosc et de Taurines.",
        "Les cyclistes disposent de parcours routiers fléchés de 40 à 60 km et plus, qui relient villages et bastides. Les topo-guides et fiches de randonnée se trouvent dans les offices de tourisme, et des balades guidées gratuites partent de Naucelle et de Sauveterre-de-Rouergue.",
      ],
    },
    tips: {
      en: ["Pick up a topo-guide at a tourist office.", "Wear good shoes: the valleys are steep and the paths can be damp."],
      fr: ["Procurez-vous un topo-guide dans un office de tourisme.", "Prévoyez de bonnes chaussures : les vallées sont pentues et les chemins parfois humides."],
    },
    official: { label: { en: "Walking routes (Destination Ségala, in French)", fr: "Randonnées à pied (Destination Ségala)" }, url: "https://www.destinationsegala.fr/activites-de-pleine-nature/randonnees-a-pied/" },
  },
  {
    slug: "table-du-segala", tags: ["taste"], name: "The table of the Ségala", nameFr: "La table du Ségala", category: "food", drive: 15, icon: "dining", photo: "food",
    tag: { en: "Tripous · aligot · veal", fr: "Tripous · aligot · veau" },
    summary: { en: "Tripous, farçou, aligot and the Ségala veal, bought from the people who make them.", fr: "Tripous, farçou, aligot et veau du Ségala, achetés auprès de ceux qui les produisent." },
    body: {
      en: [
        "The high Ségala plateau is calf country: the Veau d’Aveyron et du Ségala is raised with its mother and has pale, tender meat. Alongside it you will meet tripous (stuffed veal paunch, simmered overnight in white wine), farçou (another rustic Aveyron speciality) and, from the wider Aveyron, stretchy aligot, Roquefort and Marcillac red wine.",
        "The easiest way to taste it is to shop where the producers are: farm shops such as the one in Naucelle, goat farms, and the weekly markets of the villages around. Market days differ from village to village, so ask at a tourist office or ask us.",
      ],
      fr: [
        "Le haut plateau du Ségala est un pays de veaux : le veau d’Aveyron et du Ségala est élevé sous la mère et donne une viande claire et tendre. On y croise aussi les tripous (panse de veau farcie, mijotée une nuit au vin blanc), le farçou (une autre spécialité rustique aveyronnaise) et, plus largement en Aveyron, l’aligot filant, le roquefort et le vin rouge de Marcillac.",
        "Le plus simple pour goûter : faire ses courses là où sont les producteurs, dans les magasins de producteurs comme celui de Naucelle, les fermes de chèvres et les marchés hebdomadaires. Les jours de marché varient d’un village à l’autre : renseignez-vous à l’office de tourisme ou demandez-nous.",
      ],
    },
    tips: {
      en: ["Ask your hosts which farm shop to try first; we are happy to point you to a favourite."],
      fr: ["Demandez à vos hôtes quel magasin de producteurs essayer : nous vous orienterons volontiers."],
    },
    official: { label: { en: "Weekly markets (Destination Ségala, in French)", fr: "Marchés hebdomadaires (Destination Ségala)" }, url: "https://www.destinationsegala.fr/mon-sejour/marches-hebdomadaires/" },
  },
  {
    slug: "rieupeyroux", tags: ["swim", "walk"], lat: 44.3067, lon: 2.2366, name: "Rieupeyroux", category: "villages", drive: 40, icon: "pin", photo: "rieupeyroux",
    tag: { en: "Village of character", fr: "Village de caractère" },
    summary: { en: "A lively market village with a swimming pool and the Ségala tourist office.", fr: "Un bourg vivant, avec une piscine et l’office de tourisme du Ségala." },
    body: {
      en: [
        "Rieupeyroux is one of the five Ségala villages recognised as villages of character and is the base of the Aveyron Ségala tourist office. It has a swimming pool for hot days and is the starting point of several of the marked walks.",
      ],
      fr: [
        "Rieupeyroux fait partie des cinq villages de caractère du Ségala et abrite l’office de tourisme Aveyron Ségala. On y trouve une piscine pour les jours de chaleur, et c’est le départ de plusieurs randonnées balisées.",
      ],
    },
  },
  {
    slug: "belcastel", tags: ["walk", "culture", "free"], lat: 44.3885, lon: 2.3368, name: "Belcastel", category: "villages", drive: 40, icon: "pin", photo: "belcastel",
    tag: { en: "Most beautiful villages", fr: "Plus beaux villages" },
    summary: { en: "A castle, a river and a stone bridge in one frame.", fr: "Un château, une rivière et un pont de pierre dans le même cadre." },
    body: {
      en: [
        "Belcastel sits in a bend of the Aveyron river, with its castle above, a stone bridge in front and the houses stepping down to the water. It is counted among the Most Beautiful Villages of France and is very small, so an hour or two is enough.",
      ],
      fr: [
        "Belcastel se blottit dans un méandre de l’Aveyron : le château au-dessus, un pont de pierre devant, les maisons qui descendent vers l’eau. Le village fait partie des Plus Beaux Villages de France et reste très petit : une à deux heures suffisent.",
      ],
    },
    tips: { en: ["Arrive early in summer; the car park fills up."], fr: ["Arrivez tôt en été : le parking se remplit vite."] },
  },
  {
    slug: "rodez", tags: ["rainy", "culture", "taste"], lat: 44.3511, lon: 2.5728, name: "Rodez", category: "heritage", drive: 40, icon: "star", photo: "rodez",
    tag: { en: "Soulages Museum", fr: "Musée Soulages" },
    summary: { en: "The Soulages Museum, a red-sandstone cathedral and a lively old town.", fr: "Le musée Soulages, une cathédrale de grès rouge et un vieux centre animé." },
    body: {
      en: [
        "Rodez is the capital of Aveyron. The Soulages Museum, dedicated to the painter Pierre Soulages, is the reason many visitors come, and the red-sandstone cathedral and the old town make an easy half-day around it.",
      ],
      fr: [
        "Rodez est la préfecture de l’Aveyron. Le musée Soulages, consacré au peintre Pierre Soulages, attire beaucoup de visiteurs, et la cathédrale de grès rouge ainsi que le vieux centre complètent facilement une demi-journée.",
      ],
    },
  },
  {
    slug: "albi", tags: ["rainy", "culture"], lat: 43.9278, lon: 2.1479, name: "Albi", category: "heritage", drive: 45, icon: "star", photo: "albi",
    tag: { en: "UNESCO cathedral city", fr: "Cité épiscopale (UNESCO)" },
    summary: { en: "A brick cathedral like a fortress, the Toulouse-Lautrec museum and a river quarter to stroll.", fr: "Une cathédrale de brique en forme de forteresse, le musée Toulouse-Lautrec et des quais à flâner." },
    body: {
      en: [
        "Albi is a day trip into the Tarn. The huge brick cathedral of Sainte-Cécile and the old episcopal quarter are a UNESCO World Heritage site, and the Palais de la Berbie houses the Toulouse-Lautrec museum, which pairs nicely with a visit to the Château du Bosc.",
      ],
      fr: [
        "Albi est une excursion d’une journée dans le Tarn. L’immense cathédrale de brique Sainte-Cécile et la cité épiscopale sont inscrites au patrimoine mondial de l’UNESCO, et le palais de la Berbie abrite le musée Toulouse-Lautrec, qui se marie bien avec une visite du château du Bosc.",
      ],
    },
  },
  {
    slug: "monesties", tags: ["culture", "free", "walk"], lat: 44.0717, lon: 2.0965, name: "Monestiés", category: "villages", drive: 45, icon: "pin",
    tag: { en: "Medieval village", fr: "Cité médiévale" },
    summary: { en: "A medieval village of stone lanes on the Tarn side of the Ségala.", fr: "Une cité médiévale de ruelles de pierre, côté Tarn du Ségala." },
    body: {
      en: [
        "Monestiés is a medieval village on the Tarn side of the Ségala. It is also one of the five villages of character of the area and is free to wander. It combines well with the Viaur viaduct, as the two are not far apart.",
      ],
      fr: [
        "Monestiés est une cité médiévale du côté tarnais du Ségala. C’est l’un des cinq villages de caractère du territoire, et on s’y promène librement. Elle se combine bien avec le viaduc du Viaur, car les deux sont proches.",
      ],
    },
  },
  {
    slug: "cordes-sur-ciel", tags: ["culture", "walk"], lat: 44.0626, lon: 1.958, name: "Cordes-sur-Ciel", category: "villages", drive: 60, icon: "pin", photo: "cordes",
    tag: { en: "Hilltop bastide", fr: "Bastide perchée" },
    summary: { en: "A 13th-century bastide perched on a hill, in the Tarn.", fr: "Une bastide du XIIIe siècle perchée sur sa colline, dans le Tarn." },
    body: {
      en: [
        "Cordes-sur-Ciel is a medieval bastide built on a steep hill, with stone gateways, a covered market hall and steep lanes up to the top. It is a longer drive than the Ségala villages, so combine it with Albi or the Viaur viaduct on the same day.",
      ],
      fr: [
        "Cordes-sur-Ciel est une bastide médiévale bâtie sur une colline escarpée, avec ses portes de pierre, sa halle couverte et ses ruelles raides jusqu’au sommet. Le trajet est plus long que vers les villages du Ségala : combinez-la avec Albi ou le viaduc du Viaur dans la même journée.",
      ],
    },
  },
  {
    slug: "najac", tags: ["walk", "culture"], lat: 44.2202, lon: 1.9809, name: "Najac", category: "villages", drive: 60, icon: "pin", photo: "najac",
    tag: { en: "Castle above the gorge", fr: "Château au-dessus des gorges" },
    summary: { en: "A fortress on a rocky spur above the Aveyron gorge, with a single long street below.", fr: "Une forteresse sur un éperon rocheux au-dessus des gorges de l’Aveyron, avec sa longue rue unique." },
    body: {
      en: [
        "Najac is one of the Most Beautiful Villages of France. A royal fortress crowns a narrow ridge above the Aveyron gorge and the village stretches along the ridge below it. The castle can be visited, and the views from the ridge are the reason to come.",
      ],
      fr: [
        "Najac fait partie des Plus Beaux Villages de France. Une forteresse royale couronne une crête étroite au-dessus des gorges de l’Aveyron, et le village s’étire sur l’arête en dessous. Le château se visite, et les vues depuis la crête sont la raison de la visite.",
      ],
    },
  },
  {
    slug: "villefranche-de-rouergue", tags: ["culture", "taste"], lat: 44.3518, lon: 2.0375, name: "Villefranche-de-Rouergue", category: "villages", drive: 60, icon: "pin", photo: "villefranche",
    tag: { en: "Arcaded bastide town", fr: "Bastide à arcades" },
    summary: { en: "A 13th-century bastide town with a beautiful arcaded square.", fr: "Une bastide du XIIIe siècle avec une belle place à arcades." },
    body: {
      en: [
        "Villefranche-de-Rouergue is a bastide town on the Aveyron river, built around its arcaded Place Notre-Dame, with a Gothic church, a river quarter and a good range of shops and restaurants. It is the largest town on the western side of the area.",
      ],
      fr: [
        "Villefranche-de-Rouergue est une bastide au bord de l’Aveyron, bâtie autour de sa place Notre-Dame à arcades, avec une église gothique, un quartier de la rivière et de nombreux commerces et restaurants. C’est la plus grande ville du côté ouest du territoire.",
      ],
    },
  },
  {
    slug: "conques", tags: ["culture", "walk"], lat: 44.5996, lon: 2.3982, name: "Conques", category: "heritage", drive: 70, icon: "pin", photo: "conques",
    tag: { en: "Pilgrim village", fr: "Village de pèlerinage" },
    summary: { en: "A Romanesque abbey and steep stone lanes on the Way of St James.", fr: "Une abbatiale romane et des ruelles de pierre sur le chemin de Saint-Jacques." },
    body: {
      en: [
        "Conques is a pilgrim village on the Way of St James, built around its Romanesque abbey church and the carved tympanum of the Last Judgement over the door. It is worth the longer drive, so make a day of it: it is about an hour and ten minutes from the estate.",
      ],
      fr: [
        "Conques est un village de pèlerinage sur le chemin de Saint-Jacques, bâti autour de son abbatiale romane et de son tympan sculpté du Jugement dernier au-dessus de la porte. Il vaut le trajet plus long : prévoyez la journée, à environ une heure dix du domaine.",
      ],
    },
    tips: { en: ["Plan a full day and stay for the evening light."], fr: ["Prévoyez la journée et restez pour la lumière du soir."] },
  },
  {
    slug: "gorges-de-l-aveyron", tags: ["swim", "family", "walk"], lat: 44.1471, lon: 1.7238, name: "Gorges de l’Aveyron", category: "nature", drive: 90, icon: "mountains", photo: "gorges",
    tag: { en: "Swim · kayak · picnic", fr: "Baignade · kayak · pique-nique" },
    summary: { en: "Wooded gorges of the lower Aveyron, for paddling, swimming and picnics.", fr: "Les gorges boisées de l’Aveyron aval, pour pagayer, se baigner et pique-niquer." },
    body: {
      en: [
        "Downstream, the Aveyron cuts through limestone gorges around Saint-Antonin-Noble-Val and Penne. It is the furthest trip in this guide, about an hour and a half away, so it suits a full day of kayaking, swimming and a riverside picnic.",
      ],
      fr: [
        "En aval, l’Aveyron traverse des gorges calcaires autour de Saint-Antonin-Noble-Val et de Penne. C’est la sortie la plus lointaine de ce guide, à environ une heure et demie : elle convient à une journée complète de kayak, de baignade et de pique-nique au bord de l’eau.",
      ],
    },
  },
];

export const placeBySlug = (slug: string) => PLACES.find((p) => p.slug === slug);

export const driveLabel = (min: number, locale: Locale) => {
  if (min <= 5) return locale === "fr" ? "Sur place" : "From the doorstep";
  return `~${min} min`;
};

/** The estate (centre of Centrès), the map's centre. */
export const ESTATE = { lat: 44.1639, lon: 2.4076 };
