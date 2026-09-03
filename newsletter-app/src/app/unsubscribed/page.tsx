export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const ok = (await searchParams).ok === "1";
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold mb-2">
          {ok ? "配信停止を受け付けました" : "手続きできませんでした"}
        </h1>
        <p className="text-sm text-gray-600">
          {ok
            ? "以後、ニュースレターは届きません。再開をご希望の場合は運営者までご連絡ください。"
            : "リンクが正しくないか、有効期限が切れている可能性があります。"}
        </p>
      </div>
    </div>
  );
}
