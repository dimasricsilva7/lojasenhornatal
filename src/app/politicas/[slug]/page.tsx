import { notFound } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getPolicy, policyText, POLICIES } from "@/lib/policies";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: getPolicy(params.slug)?.title ?? "Políticas" };
}

export default async function PolicyPage({ params }: { params: { slug: string } }) {
  const policy = getPolicy(params.slug);
  if (!policy) notFound();
  const settings = await getSettings();
  const text = policyText(policy, settings);

  return (
    <main>
      <SiteHeader storeName={settings.store_name} shippingDays={settings.shipping_days} deadline={settings.christmas_deadline} />
      <article className="container-app max-w-2xl py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-graphite-950">{policy.title}</h1>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-graphite-800">
          {text.split(/\n\s*\n/).map((block, i) => {
            const [first, ...rest] = block.split("\n");
            return rest.length > 0 ? (
              <div key={i}>
                <h2 className="text-lg font-bold text-graphite-950">{first}</h2>
                <p className="mt-1 whitespace-pre-line">{rest.join("\n")}</p>
              </div>
            ) : (
              <p key={i} className="whitespace-pre-line">{block}</p>
            );
          })}
        </div>
        <nav className="mt-12 flex flex-wrap gap-4 text-sm">
          {POLICIES.filter((p) => p.slug !== policy.slug).map((p) => (
            <Link key={p.slug} href={`/politicas/${p.slug}`} className="underline underline-offset-2">{p.title}</Link>
          ))}
          <Link href="/" className="underline underline-offset-2">Voltar à loja</Link>
        </nav>
      </article>
      <SiteFooter settings={settings} />
    </main>
  );
}
