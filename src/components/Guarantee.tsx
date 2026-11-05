import { ShieldCheck } from "lucide-react";

export default function Guarantee({
  text,
  days,
  conditions,
  howTo,
}: {
  text: string;
  days?: string;
  conditions?: string;
  howTo?: string;
}) {
  return (
    <section data-sec="Garantia" className="section bg-clay-600">
      <div className="container-app max-w-2xl">
        <div className="rounded-xl2 bg-white/10 p-8 ring-1 ring-white/20 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-clay-600">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">Compra com garantia</h2>
          </div>

          <p className="mt-4 text-lg font-medium leading-relaxed text-white">
            {text}{days ? ` — ${days}.` : "."}
          </p>

          <p className="mt-4 rounded-xl bg-white/10 p-4 text-base font-semibold leading-relaxed text-white ring-1 ring-white/15">
            Se você não gostar do produto ou não ficar satisfeito, é só devolver e solicitar o reembolso: você recebe 100% do valor de volta.
          </p>

          {conditions && (
            <div className="mt-5">
              <p className="text-base font-bold text-white">Condições</p>
              <p className="mt-1.5 text-base leading-relaxed text-white/80">{conditions}</p>
            </div>
          )}

          {howTo && (
            <div className="mt-5">
              <p className="text-base font-bold text-white">Como solicitar</p>
              <p className="mt-1.5 text-base leading-relaxed text-white/80">{howTo}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
