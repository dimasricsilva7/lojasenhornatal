import OnlineNow from "@/components/OnlineNow";

export const metadata = { title: "Online agora" };

export default function OnlinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-graphite-950">Pessoas online</h1>
      <OnlineNow detailed />
    </div>
  );
}
