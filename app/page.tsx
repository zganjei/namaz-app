import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireChatGPTUser("/");

  return (
    <main className="fixed inset-0 bg-[#f7f4eb]">
      <iframe
        src="/tracker.html"
        title="نمازهای من"
        className="h-full w-full border-0"
        allow="clipboard-write; autoplay"
      />
    </main>
  );
}
