import credits from "./area-credits.json";

const credit = (k: keyof typeof credits) => `${credits[k].author}, ${credits[k].license}, Wikimedia Commons`;

/**
 * Starter articles, written from public facts (see the notes in area.ts). The owners can edit, replace or hide them in Admin → Journal.
 * `scripts/seed-posts.mts` adds them once and never overwrites an article that already exists.
 */
export const STARTER_POSTS = [
  {
    slug: "first-weekend-in-the-segala",
    category: "guide",
    publishedAt: "2026-11-10T09:00:00.000Z",
    cover: "/img/area/bosc.jpg",
    coverCredit: credit("bosc"),
    places: "chateau-de-taurines,chateau-du-bosc,naucelle,viaduc-du-viaur,sauveterre-de-rouergue",
    titleEn: "A first weekend in the Ségala",
    titleFr: "Un premier week-end en Ségala",
    excerptEn: "Two easy days, all within twenty minutes of the estate, for when you want to arrive, unpack and look around.",
    excerptFr: "Deux journées tranquilles, à vingt minutes du domaine au plus, pour arriver, poser les valises et découvrir les environs.",
    bodyEn: `You do not need a long list to enjoy the Ségala. Everything below is close to the estate, so you spend the day looking around, not driving.

## Saturday: castles and a village

Start close to home. [Château de Taurines](/en/area/chateau-de-taurines) is in Centrès itself, about ten minutes away, and is the start of an easy family walk. Then head to the [Château du Bosc](/en/area/chateau-du-bosc) at Camjac, the red-shuttered castle with guided visits and drawings and posters by Toulouse-Lautrec.

For lunch, go to [Naucelle](/en/area/naucelle), about fifteen minutes from the estate. It began as a "sauveté", a protected settlement, and it is a good place to try tripous (stuffed veal paunch, simmered in white wine) and to stock up at the farm shop.

## Sunday: a viaduct and a bastide

The [Viaur viaduct](/en/area/viaduc-du-viaur) is about twenty minutes away. It was built between 1895 and 1902 and is roughly 460 m long and 116 m high. The viewpoints are free and have picnic tables, so bring lunch.

Finish at [Sauveterre-de-Rouergue](/en/area/sauveterre-de-rouergue), a royal bastide around a square of stone arcades. Park, then walk everywhere.

## Before you go

- Drive times are approximate, by car from Centrès.
- Visits are seasonal. Check opening hours before you set off.
- Not sure what to pick? Ask us, we are happy to plan a day with you.`,
    bodyFr: `Inutile d’avoir une longue liste pour profiter du Ségala. Tout ce qui suit est proche du domaine : on passe la journée à regarder, pas à conduire.

## Samedi : châteaux et village

Commencez près de chez vous. Le [château de Taurines](/fr/area/chateau-de-taurines) est à Centrès même, à environ dix minutes, et c’est le départ d’une balade facile en famille. Rendez-vous ensuite au [château du Bosc](/fr/area/chateau-du-bosc), à Camjac, le château aux volets rouges, avec des visites guidées et des dessins et affiches de Toulouse-Lautrec.

Pour déjeuner, direction [Naucelle](/fr/area/naucelle), à environ quinze minutes du domaine. Née d’une « sauveté », un lieu protégé, c’est un bon endroit pour goûter les tripous (panse de veau farcie, mijotée au vin blanc) et faire le plein de produits au magasin de producteurs.

## Dimanche : un viaduc et une bastide

Le [viaduc du Viaur](/fr/area/viaduc-du-viaur) est à environ vingt minutes. Construit de 1895 à 1902, il mesure environ 460 m de long pour 116 m de haut. Les points de vue sont gratuits et équipés de tables de pique-nique : apportez votre déjeuner.

Terminez à [Sauveterre-de-Rouergue](/fr/area/sauveterre-de-rouergue), une bastide royale autour d’une place à arcades de pierre. On se gare, puis on fait tout à pied.

## Avant de partir

- Les temps de trajet sont approximatifs, en voiture depuis Centrès.
- Les visites sont saisonnières. Vérifiez les horaires avant de partir.
- Un doute ? Demandez-nous, nous préparons volontiers une journée avec vous.`,
  },
  {
    slug: "six-rainy-day-ideas",
    category: "family",
    publishedAt: "2026-11-12T09:00:00.000Z",
    cover: "/img/area/albi.jpg",
    coverCredit: credit("albi"),
    places: "chateau-du-bosc,naucelle,sauveterre-de-rouergue,rodez,albi",
    titleEn: "Six rainy-day ideas within an hour",
    titleFr: "Six idées pour les jours de pluie, à moins d’une heure",
    excerptEn: "When the weather turns, the Ségala has plenty to do indoors: a castle, a craft museum, a swimming centre and two good museum towns.",
    excerptFr: "Quand le temps tourne, le Ségala ne manque pas d’idées à l’abri : un château, un musée des métiers d’art, un espace aquatique et deux belles villes-musées.",
    bodyEn: `A grey day is no reason to stay in. These six ideas are all indoors, or mostly, and all within an hour of the estate.

## Close by (up to 20 minutes)

- **[Château du Bosc](/en/area/chateau-du-bosc).** The guided visit takes you through rooms that still feel lived in, with drawings, posters and lithographs by Toulouse-Lautrec. About ten minutes away.
- **[Naucelle](/en/area/naucelle).** A swimming centre for children who need to burn off energy, and a visit to a tripous maker with a small museum. About fifteen minutes away.
- **[Sauveterre-de-Rouergue](/en/area/sauveterre-de-rouergue).** L'Ancre, the shop, library and museum of the local craft centre, shows the work of regional makers, with exhibitions running through the season. About twenty minutes away.

## A little further (40 to 45 minutes)

- **[Rodez](/en/area/rodez).** The Soulages Museum, dedicated to the painter Pierre Soulages, and a red-sandstone cathedral.
- **[Albi](/en/area/albi).** The huge brick cathedral of Sainte-Cécile and the Toulouse-Lautrec museum in the Palais de la Berbie. It pairs well with a morning at the Château du Bosc.

And on the way back, the simplest rainy-day idea of all: stop at a farm shop, then cook together at the estate.

## Good to know

- Opening hours change with the season, so check before you go.
- Ask us if you would like help choosing.`,
    bodyFr: `Un jour gris n’est pas une raison de rester enfermé. Ces six idées sont toutes à l’abri, ou presque, et à moins d’une heure du domaine.

## Tout près (jusqu’à 20 minutes)

- **[Château du Bosc](/fr/area/chateau-du-bosc).** La visite guidée traverse des pièces qui gardent un air habité, avec des dessins, affiches et lithographies de Toulouse-Lautrec. À environ dix minutes.
- **[Naucelle](/fr/area/naucelle).** Un espace aquatique pour les enfants qui ont besoin de se dépenser, et la visite d’un fabricant de tripous avec un petit musée. À environ quinze minutes.
- **[Sauveterre-de-Rouergue](/fr/area/sauveterre-de-rouergue).** L’Ancre, boutique, bibliothèque et musée du pôle des métiers d’art, présente le travail des artisans de la région, avec des expositions pendant la saison. À environ vingt minutes.

## Un peu plus loin (40 à 45 minutes)

- **[Rodez](/fr/area/rodez).** Le musée Soulages, consacré au peintre Pierre Soulages, et une cathédrale de grès rouge.
- **[Albi](/fr/area/albi).** L’immense cathédrale de brique Sainte-Cécile et le musée Toulouse-Lautrec, au palais de la Berbie. Idéal en complément d’une matinée au château du Bosc.

Et sur le chemin du retour, l’idée la plus simple : un arrêt dans un magasin de producteurs, puis un repas cuisiné ensemble au domaine.

## Bon à savoir

- Les horaires changent selon la saison : vérifiez avant de partir.
- Demandez-nous si vous souhaitez de l’aide pour choisir.`,
  },
  {
    slug: "where-to-swim-near-the-estate",
    category: "season",
    publishedAt: "2026-11-14T09:00:00.000Z",
    cover: "/img/area/gorges.jpg",
    coverCredit: credit("gorges"),
    places: "lac-du-val-de-lenne,naucelle,rieupeyroux,gorges-de-l-aveyron",
    titleEn: "Where to swim near the estate",
    titleFr: "Où se baigner près du domaine",
    excerptEn: "Your own heated pool, plus lakes, a river and public pools in the villages around.",
    excerptFr: "Votre piscine chauffée, mais aussi des lacs, une rivière et des piscines publiques dans les villages voisins.",
    bodyEn: `The estate has its own covered pool, heated all year, so the first answer is on your doorstep. For a change of scene in summer, the Ségala has more water than you might expect.

## Lakes and rivers

- **[Lac du Val de Lenne](/en/area/lac-du-val-de-lenne), Baraqueville.** A lake and leisure base with water sports in season and walking and mountain-bike trails around the shore.
- **Lac du Muret, Le Bas-Ségala.** A lake with a leisure area.
- **Lac de la Roucarie, Almayrac.** A free lakeside base.
- **La Roque, La Salvetat-Peyralès.** A natural spot on the Viaur river.

Not every natural bathing site is supervised, so check before swimming with children, and keep an eye on them near the water.

## Public pools

- **[Rieupeyroux](/en/area/rieupeyroux)** has an intercommunal pool.
- **[Naucelle](/en/area/naucelle)** has a swimming centre.
- **Baraqueville** has the leisure area of La Gazonne.

## A bigger day out

If you want to paddle a kayak or swim in a wooded river, the [gorges of the Aveyron](/en/area/gorges-de-l-aveyron) are about an hour and a half away. Make a full day of it with a picnic.

## Good to know

- Opening, supervision and water quality change through the season: check with the local tourist office before you go.`,
    bodyFr: `Le domaine a sa propre piscine couverte, chauffée toute l’année : la première réponse est devant votre porte. Pour changer d’air l’été, le Ségala compte plus d’eau qu’on ne l’imagine.

## Lacs et rivières

- **[Lac du Val de Lenne](/fr/area/lac-du-val-de-lenne), Baraqueville.** Un lac et une base de loisirs : sports nautiques en saison, sentiers de randonnée et de VTT autour du plan d’eau.
- **Lac du Muret, Le Bas-Ségala.** Un lac avec une aire de loisirs.
- **Lac de la Roucarie, Almayrac.** Une base de loisirs en bord de lac, d’accès gratuit.
- **La Roque, La Salvetat-Peyralès.** Un site naturel au bord du Viaur.

Tous les sites de baignade naturels ne sont pas surveillés : renseignez-vous avant de vous baigner avec des enfants, et gardez-les à l’œil près de l’eau.

## Piscines publiques

- **[Rieupeyroux](/fr/area/rieupeyroux)** a une piscine intercommunale.
- **[Naucelle](/fr/area/naucelle)** a un espace aquatique.
- **Baraqueville** a l’aire de loisirs de La Gazonne.

## Une grande sortie

Pour pagayer en kayak ou se baigner dans une rivière boisée, les [gorges de l’Aveyron](/fr/area/gorges-de-l-aveyron) sont à environ une heure et demie. Prévoyez la journée avec un pique-nique.

## Bon à savoir

- Ouverture, surveillance et qualité de l’eau varient selon la saison : renseignez-vous auprès de l’office de tourisme avant de partir.`,
  },
  {
    slug: "eating-the-segala-way",
    category: "food",
    publishedAt: "2026-11-16T09:00:00.000Z",
    cover: "/img/area/food.jpg",
    coverCredit: credit("food"),
    places: "table-du-segala,naucelle,sauveterre-de-rouergue",
    titleEn: "Eating the Ségala way",
    titleFr: "Manger à la façon du Ségala",
    excerptEn: "Tripous, calf from the plateau, goat cheese and aligot: how to taste the country, and where to buy it.",
    excerptFr: "Tripous, veau du plateau, fromage de chèvre et aligot : comment goûter le pays, et où l’acheter.",
    bodyEn: `With three kitchens and a long table, the estate is made for cooking together. The Ségala makes it easy to shop well.

## What to look for

- **Tripous.** Stuffed veal paunch, rolled up and simmered overnight in white wine. A local classic, and not as strange as it sounds.
- **Veau d'Aveyron et du Ségala.** Calves raised with their mothers on the high plateau, with pale, tender meat. It has its own quality label.
- **Farçou.** Another rustic speciality of Aveyron.
- **Aligot, Roquefort and Marcillac wine.** From the wider Aveyron, all easy to find.

## Where to buy

- Farm shops, such as the one that gathers local producers in [Naucelle](/en/area/naucelle).
- Goat farms around the Ségala, some of which welcome visitors.
- Weekly markets in the villages. Days differ from one village to the next, so ask at a tourist office or ask us.
- Summer gourmet and night markets in [Sauveterre-de-Rouergue](/en/area/sauveterre-de-rouergue).

## A simple plan

Pick up a few things in the morning, then cook together at the estate in the evening, with a table long enough for everyone.

See more in [the table of the Ségala](/en/area/table-du-segala).`,
    bodyFr: `Avec trois cuisines et une longue table, le domaine est fait pour cuisiner ensemble. Le Ségala facilite les bons achats.

## Ce qu’il faut goûter

- **Les tripous.** Panse de veau farcie, roulée et mijotée toute une nuit au vin blanc. Un classique local, moins étrange qu’il n’y paraît.
- **Le veau d’Aveyron et du Ségala.** Des veaux élevés sous la mère sur le haut plateau, à la viande claire et tendre. Il a son propre label de qualité.
- **Le farçou.** Une autre spécialité rustique de l’Aveyron.
- **Aligot, roquefort et vin de Marcillac.** Venus de l’Aveyron plus large, faciles à trouver.

## Où acheter

- Les magasins de producteurs, comme celui qui réunit les producteurs locaux à [Naucelle](/fr/area/naucelle).
- Les fermes de chèvres du Ségala, dont certaines accueillent les visiteurs.
- Les marchés hebdomadaires des villages. Les jours varient d’un village à l’autre : renseignez-vous à l’office de tourisme ou demandez-nous.
- Les marchés gourmands et nocturnes d’été à [Sauveterre-de-Rouergue](/fr/area/sauveterre-de-rouergue).

## Un plan simple

Faites quelques achats le matin, puis cuisinez ensemble au domaine le soir, autour d’une table assez longue pour tout le monde.

Pour en savoir plus : [la table du Ségala](/fr/area/table-du-segala).`,
  },
] as const;
