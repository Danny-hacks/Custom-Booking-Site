import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeatured, fromPrice } from "@/lib/queries";
import { liveOffers, offerHref } from "@/lib/offers";
import { liveReviews } from "@/lib/reviews";
import { livePosts } from "@/lib/journal";
import { PostCard } from "@/components/PostCard";
import { inCat, ph } from "@/lib/photos";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/property";
import { SearchBar } from "@/components/SearchBar";
import { OfferCard } from "@/components/OfferCard";
import { ReviewsSection } from "@/components/Reviews";
import { DetailsRail } from "@/components/DetailsRail";
import { Ornament } from "@/components/Ornament";
import { Icon } from "@/components/Icon";
import { Reveal, CountUp } from "@/components/Motion";
import { eur } from "@/lib/dates";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const p = await getFeatured();
  if (!p) notFound();
  const d = t(locale);
  const c = p.content[locale];
  const fr = locale === "fr";
  const stay = `/${locale}/properties/${p.slug}`;
  const reviews = await liveReviews(locale);
  const posts = await livePosts(locale, 3);
  const deals = (await liveOffers(locale, p.id)).filter((o) => o.showCard).slice(0, 3);
  const alt = (x: { alt_en: string; alt_fr: string }) => (fr ? x.alt_fr : x.alt_en);
  const hero = ph("outdoor", 102);
  const details = inCat("detail");

  return (
    <main>
      {/* HERO */}
      <section>
        <div className="relative isolate min-h-[600px] overflow-hidden bg-navy sm:min-h-[700px]">
          <Image src={hero.src} alt={alt(hero)} fill priority sizes="100vw" className="hero-zoom -z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/70 via-navy/25 to-transparent" />
          <div className="mx-auto flex min-h-[600px] max-w-[1240px] flex-col justify-end px-5 pb-28 pt-12 sm:min-h-[700px] sm:px-8 [&>*]:max-w-[720px]">
            <p className="rise inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
              <Icon name="pin" size={16} weight="fill" /> {d.home.eyebrow}
            </p>
            <h1 className="rise mt-5 text-[40px] text-white [text-shadow:0_2px_18px_rgba(30,18,8,0.5)] [--d:1] sm:text-[58px] lg:text-[68px]">La Bastide de Lestrebaldie</h1>
            <p className="rise mt-4 max-w-[34rem] text-[17px] text-white/90 [--d:3]">{c.tagline}</p>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {[["pool", c.highlights[1]], ["star", c.highlights[0]], ["car", c.highlights[2]]].map(([i, l], n) => (
                <li key={l} style={{ "--d": n + 4 } as React.CSSProperties} className="rise flex items-center gap-2 rounded-full bg-paper/95 px-4 py-2 text-sm font-semibold text-ink">
                  <Icon name={i} size={18} className="text-sun" weight="fill" /> {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative z-20 mx-auto -mt-14 max-w-[1000px] px-5 sm:px-6">
          <div className="rise [--d:6]"><SearchBar slug={p.slug} locale={locale} minNights={p.minNights} maxGuests={p.maxGuests} /></div>
        </div>
      </section>

      {/* DEALS */}
      {deals.length > 0 && (
        <section className="mx-auto mt-20 max-w-[1240px] px-5">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{d.offers.nav}</p>
              <h2 className="mt-1 text-[30px] sm:text-[38px]">{d.offers.title}</h2>
            </div>
            <Link href={`/${locale}/offers`} className="font-bold text-brand hover:underline">{d.offers.all} →</Link>
          </Reveal>
          <ul className="mt-7 grid gap-6 md:grid-cols-3">
            {deals.map((o, i) => (
              <Reveal as="li" key={o.id} d={i * 2}><OfferCard o={o} locale={locale} href={offerHref(o, locale, p.slug)} /></Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* LE COCON: the feel of the place */}
      <section className="mx-auto mt-24 grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1fr_1.05fr]">
        <Reveal kind="left" className="relative mx-auto w-full max-w-[520px]">
          <div className="arch relative aspect-[4/5] shadow-[0_30px_60px_-30px_rgba(58,40,26,0.5)]">
            <Image src={ph("living", 49).src} alt={alt(ph("living", 49))} fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-2 w-[44%] overflow-hidden rounded-[22px] border-[6px] border-canvas shadow-xl sm:-right-8">
            <div className="relative aspect-[4/5]"><Image src={ph("living", 8).src} alt={alt(ph("living", 8))} fill sizes="25vw" className="object-cover" /></div>
          </div>
        </Reveal>
        <Reveal kind="right">
          <Ornament className="max-w-[220px] !justify-start" />
          <p className="eyebrow mt-4">{d.home.coconEyebrow}</p>
          <h2 className="mt-2 text-[32px] sm:text-[44px]">{d.home.coconTitle}</h2>
          <p className="mt-4 text-[17px] text-ink-soft">{d.home.coconLead}</p>
          <ul className="mt-8 space-y-5">
            {d.home.coconPoints.map(([icon, h, b]) => (
              <li key={h} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tint text-brand"><Icon name={icon} size={24} weight="duotone" /></span>
                <span><span className="block text-lg font-semibold">{h}</span><span className="text-[15px] text-ink-soft">{b}</span></span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* TRUST STRIP */}
      <Reveal as="section" className="mx-auto mt-24 max-w-[1240px] px-5">
        <dl className="card grid grid-cols-2 divide-line p-2 sm:grid-cols-4 sm:divide-x">
          {[
            [<CountUp key="r" to={4.83} decimals={2} />, d.home.reviewsTitle, "star"],
            [<CountUp key="g" to={p.maxGuests} />, d.search.guestsN, "users"],
            [<CountUp key="b" to={p.bedrooms} />, d.prop.bedrooms, "bed"],
            [<CountUp key="t" to={p.bathrooms} />, d.prop.baths, "bath"],
          ].map(([n, l, i], k) => (
            <div key={k} className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tint text-brand"><Icon name={i as string} size={22} weight="fill" /></span>
              <div><dt className="serif text-2xl leading-none">{n}</dt><dd className="mt-1 text-[13px] text-ink-soft">{l}</dd></div>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* THE ESTATE: listing-style card */}
      <section className="band-dark mt-24 bg-navy py-20 text-[#eadcc6]">
       <div className="mx-auto max-w-[1240px] px-5">
        <Reveal>
          <p className="eyebrow">{d.nav.stay}</p>
          <h2 className="mt-1 max-w-2xl text-[30px] text-white sm:text-[40px]">{d.home.storyTitle}</h2>
        </Reveal>
        <Reveal className="mt-8">
          <div className="card lift zoom grid overflow-hidden lg:grid-cols-[1.25fr_1fr]">
            <Link href={stay} className="grid min-h-[320px] grid-cols-3 grid-rows-2 gap-1.5 p-1.5" aria-label={p.name}>
              <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[22px]"><Image src={ph("living", 2).src} alt={alt(ph("living", 2))} fill sizes="(min-width:1024px) 40vw, 66vw" className="object-cover" /></div>
              <div className="relative overflow-hidden rounded-[22px]"><Image src={ph("pool", 1).src} alt={alt(ph("pool", 1))} fill sizes="20vw" className="object-cover" /></div>
              <div className="relative overflow-hidden rounded-[22px]"><Image src={ph("bedroom", 51).src} alt={alt(ph("bedroom", 51))} fill sizes="20vw" className="object-cover" /></div>
            </Link>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex items-center gap-1 rounded-md bg-navy px-2 py-1 text-white"><Icon name="star" size={14} weight="fill" className="text-sun-bright" /> 4.83</span>
                <span className="text-ink-soft">{d.prop.reviews}</span>
              </div>
              <h3 className="mt-3 text-[26px]">{p.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-ink-soft"><Icon name="pin" size={16} /> {p.location}</p>
              <div className="mt-4 space-y-3 text-[15px] text-ink-soft">{c.story.slice(0, 2).map((s) => <p key={s}>{s}</p>)}</div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {p.amenities.slice(0, 5).map((a) => (
                  <li key={a.icon} className="flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[13px] font-medium"><Icon name={a.icon} size={16} className="text-brand" /> {a[locale]}</li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                <p className="text-ink-soft">{d.card.from} <span className="serif text-[28px] text-ink">{eur(fromPrice(p), locale)}</span> {d.card.perNight}</p>
                <Link href={stay} className="btn">{d.home.cta} <Icon name="arrow" size={18} /></Link>
              </div>
            </div>
          </div>
        </Reveal>
       </div>
      </section>

      {/* COTTAGES */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5">
        <Reveal className="max-w-2xl">
          <h2 className="text-[30px] sm:text-[40px]">{d.home.spacesTitle}</h2>
          <p className="mt-3 text-[17px] text-ink-soft">{d.home.spacesLead}</p>
        </Reveal>
        <ul className="mt-9 grid gap-6 md:grid-cols-3">
          {p.spaces.map((s, i) => (
            <Reveal as="li" key={s.key} d={i * 2}>
              <div className="card lift zoom h-full overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden"><Image src={s.photo} alt={s[locale].name} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" /></div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl">{s[locale].name}</h3>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-sm font-bold text-brand-deep"><Icon name="users" size={15} weight="fill" /> {s.sleeps}</span>
                  </div>
                  <p className="mt-2 text-[15px] text-ink-soft">{s[locale].blurb}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                    {s[locale].facts.map((f) => <li key={f} className="flex items-center gap-1.5"><Icon name="check" size={14} className="text-leaf" weight="bold" />{f}</li>)}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* POOL AND GARDEN */}
      <section className="band-dark mt-24 bg-navy py-20 text-[#eadcc6]">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <Ornament className="max-w-[220px] !justify-start text-sun-bright" />
            <h2 className="mt-4 text-[32px] text-white sm:text-[42px]">{d.home.poolTitle}</h2>
            <p className="mt-4 text-[17px] opacity-90">{d.home.poolLead}</p>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
              {p.amenities.slice(0, 6).map((a) => (
                <li key={a.icon} className="group flex items-center gap-3 text-[15px]"><Icon name={a.icon} size={24} className="shrink-0 text-sun-bright transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" /> {a[locale]}</li>
              ))}
            </ul>
            <Link href={stay} className="mt-8 inline-flex items-center gap-2 font-bold text-white underline underline-offset-4">{d.home.cta} <Icon name="arrow" size={18} /></Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-3">
            <Reveal kind="img" className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-[28px]"><Image src={ph("pool", 1).src} alt={alt(ph("pool", 1))} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" /></Reveal>
            <Reveal kind="img" d={2} className="relative aspect-[4/3] overflow-hidden rounded-[28px]"><Image src={ph("pool", 2).src} alt={alt(ph("pool", 2))} fill sizes="(min-width:1024px) 27vw, 50vw" className="object-cover" /></Reveal>
            <Reveal kind="img" d={4} className="relative aspect-[4/3] overflow-hidden rounded-[28px]"><Image src={ph("outdoor", 200).src} alt={alt(ph("outdoor", 200))} fill sizes="(min-width:1024px) 27vw, 50vw" className="object-cover" /></Reveal>
          </div>
        </div>
      </section>

      {/* THE LITTLE THINGS */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Ornament className="mx-auto max-w-[220px]" />
          <p className="eyebrow mt-4">{d.home.detailsEyebrow}</p>
          <h2 className="mt-2 text-[30px] sm:text-[40px]">{d.home.detailsTitle}</h2>
          <p className="mt-3 text-[17px] text-ink-soft">{d.home.detailsLead}</p>
        </Reveal>
        <Reveal className="mt-10">
          <DetailsRail photos={details.map((x) => ({ src: x.src, alt: alt(x) }))} prev={fr ? "Précédent" : "Previous"} next={fr ? "Suivant" : "Next"} />
        </Reveal>
      </section>

      <ReviewsSection reviews={reviews} locale={locale} dark />

      {/* WHY DIRECT */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5">
        <Reveal kind="scale" className="rounded-[32px] bg-tint p-7 sm:p-12">
          <h2 className="text-[28px] sm:text-[36px]">{d.home.directTitle}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {d.home.direct.map(([h, b], i) => (
              <li key={h} className="group rounded-3xl bg-paper p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-tint text-brand transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]"><Icon name={["wallet", "chat", "sync"][i]} size={26} weight="fill" /></span>
                <p className="mt-4 text-lg font-bold">{h}</p>
                <p className="mt-1 text-[15px] text-ink-soft">{b}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* AREA */}
      <section className="band-dark mt-24 bg-navy py-20 text-[#eadcc6]">
       <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 lg:grid-cols-2">
        <Reveal kind="left" className="grid grid-cols-5 gap-3">
          <div className="zoom relative col-span-3 aspect-[3/4] overflow-hidden rounded-[28px]"><Image src="/img/area/conques.jpg" alt="Conques" fill sizes="30vw" className="object-cover" /></div>
          <div className="zoom relative col-span-2 mt-12 aspect-[2/3] overflow-hidden rounded-[28px]"><Image src="/img/area/belcastel.jpg" alt="Belcastel" fill sizes="20vw" className="object-cover" /></div>
        </Reveal>
        <Reveal kind="right">
          <p className="eyebrow">{d.nav.area}</p>
          <h2 className="mt-1 text-[30px] text-white sm:text-[40px]">{d.home.areaTitle}</h2>
          <p className="mt-4 text-[17px] opacity-90">{d.home.areaLead}</p>
          <Link href={`/${locale}/area`} className="mt-8 inline-flex items-center gap-2 font-bold text-white underline underline-offset-4">{d.home.areaCta} <Icon name="arrow" size={18} /></Link>
        </Reveal>
       </div>
      </section>

      {/* FROM THE JOURNAL */}
      {posts.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1240px] px-5">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Guides</p>
              <h2 className="mt-1 text-[30px] sm:text-[40px]">{fr ? "Idées pour votre séjour" : "Ideas for your stay"}</h2>
            </div>
            <Link href={`/${locale}/guides`} className="font-bold text-brand hover:underline">{fr ? "Tous les articles" : "All articles"} →</Link>
          </Reveal>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal as="li" key={post.id} d={i * 2}><PostCard post={post} locale={locale} /></Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5">
        <Reveal kind="scale" className="relative isolate overflow-hidden rounded-[32px] bg-brand text-white">
          <Image src={ph("outdoor", 87).src} alt="" fill sizes="1240px" className="-z-10 object-cover opacity-25 mix-blend-luminosity" />
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:p-14">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#f0dcc0]">{fr ? "Prêts à partir ?" : "Ready when you are"}</p>
              <h2 className="mt-2 text-[30px] sm:text-[42px]">{d.home.finalTitle}</h2>
              <p className="mt-3 max-w-lg text-lg text-white/90">{fr ? "Le domaine entier, rien que pour votre groupe. Choisissez vos dates et voyez le prix tout de suite, sans frais cachés." : "The whole estate, just for your group. Pick your dates and see the price straight away, with no hidden fees."}</p>
              <ul className="mt-6 grid gap-2.5 text-[15px] font-medium">
                {(fr
                  ? ["Aucun frais de plateforme", "Annulation gratuite jusqu’à 30 jours avant", "Vos hôtes répondent en général dans l’heure"]
                  : ["No platform fees", "Free cancellation up to 30 days before", "Your hosts usually reply within the hour"]
                ).map((x) => <li key={x} className="flex items-center gap-2.5"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/20"><Icon name="check" size={14} weight="bold" /></span>{x}</li>)}
              </ul>
            </div>
            <div className="rounded-[28px] bg-paper p-7 text-ink shadow-2xl">
              <p className="text-ink-soft">{d.card.from}</p>
              <p className="serif text-[40px] leading-none">{eur(fromPrice(p), locale)} <span className="font-sans text-base font-normal text-ink-soft">{d.card.perNight}</span></p>
              <Link href={`${stay}#book`} className="btn mt-6 w-full text-lg">{d.card.reserve} <Icon name="arrow" size={18} /></Link>
              <Link href={`/${locale}/contact`} className="btn-ghost mt-3 w-full"><Icon name="chat" size={18} /> {fr ? "Poser une question" : "Ask a question"}</Link>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ink-soft"><Icon name="lock" size={14} /> {d.card.notCharged}</p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
