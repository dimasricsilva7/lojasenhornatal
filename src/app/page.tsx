import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPublishedReviewStats, getPublishedReviews, getPublishedReviewPhotos } from "@/lib/reviews";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import DemoVideo from "@/components/DemoVideo";
import { ProblemSection, HowItWorksSection } from "@/components/ProblemSolution";
import ProductGallery from "@/components/ProductGallery";
import Benefits, { WhatsInTheBox, Comparison } from "@/components/Benefits";
import Specifications from "@/components/Specifications";
import Reviews from "@/components/Reviews";
import CustomerPhotos from "@/components/CustomerPhotos";
import Guarantee from "@/components/Guarantee";
import { TrustSection } from "@/components/TrustBar";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import StickyCta from "@/components/StickyCta";
import SiteFooter from "@/components/SiteFooter";
import ViewContentTracker from "@/components/ViewContentTracker";
import type { SizeOption } from "@/components/SizeSelector";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, mainProducts, reviewStats, reviews, reviewPhotos] = await Promise.all([
    getSettings(),
    db.product.findMany({ where: { type: "MAIN", active: true }, orderBy: { sortOrder: "asc" } }),
    getPublishedReviewStats(),
    getPublishedReviews(),
    getPublishedReviewPhotos(),
  ]);

  if (mainProducts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-graphite-700/80">
          Nenhum tamanho ativo ainda. Acesse <code>/admin</code> para cadastrar os produtos (ou rode o seed).
        </p>
      </main>
    );
  }

  const sizes: SizeOption[] = mainProducts.map((p) => ({
    slug: p.slug,
    label: p.shortPitch?.trim() || p.name,
    name: p.name,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    image: p.images[0] ?? null,
    featured: p.featured,
  }));
  const defaultProduct = mainProducts.find((p) => p.featured) ?? mainProducts[0];
  const fromPriceCents = Math.min(...mainProducts.map((p) => p.priceCents));
  const allImages = mainProducts.flatMap((p) => p.images);
  const deadline = settings.christmas_deadline?.trim() || undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const abs = (img: string) => (img.startsWith("http") ? img : `${siteUrl}${img}`);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Árvore de Natal Montada com Pisca-pisca e Enfeites",
    description: defaultProduct.description,
    image: allImages.map(abs),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: (fromPriceCents / 100).toFixed(2),
      highPrice: (Math.max(...mainProducts.map((p) => p.priceCents)) / 100).toFixed(2),
      offerCount: mainProducts.length,
      availability: "https://schema.org/InStock",
    },
  };
  if (reviewStats.count > 0) {
    productJsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue: reviewStats.avg, reviewCount: reviewStats.count };
  }

  return (
    <main className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ViewContentTracker productId={defaultProduct.id} productName={defaultProduct.name} priceCents={defaultProduct.priceCents} />
      <SiteHeader storeName={settings.store_name} shippingDays={settings.shipping_days} deadline={deadline} />
      <Hero sizes={sizes} defaultSlug={defaultProduct.slug} reviewStats={reviewStats} />
      <DemoVideo videoUrl={settings.demo_video_url} />
      <ProblemSection />
      <HowItWorksSection />
      <WhatsInTheBox />
      <ProductGallery images={allImages} />
      <Comparison />
      <Reviews reviews={reviews} stats={reviewStats} />
      <CustomerPhotos
        photos={reviewPhotos
          .filter((r) => r.photoUrl)
          .map((r) => ({
            id: r.id,
            photoUrl: r.photoUrl as string,
            customerName: r.customerName,
            city: r.city,
            state: r.state,
            verifiedPurchase: r.verifiedPurchase,
            productName: r.product?.name ?? null,
          }))}
      />
      <Benefits />
      <Specifications settings={settings} />
      <Guarantee
        text={settings.guarantee_text}
        days={settings.guarantee_days || undefined}
        conditions={settings.guarantee_conditions || undefined}
        howTo={settings.guarantee_how_to || undefined}
      />
      <TrustSection />
      <Faq shippingDays={settings.shipping_days || "3 a 5"} />
      <FinalCta fromPriceCents={fromPriceCents} deadline={deadline} />
      <SiteFooter settings={settings} />
      <StickyCta fromPriceCents={fromPriceCents} />
    </main>
  );
}
