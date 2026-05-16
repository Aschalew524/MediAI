import { ChapaReturnClient } from "./chapa-return-client";
import { searchRecordToQueryString } from "@/lib/chapa-return-query";

export default async function ChapaReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = typeof params.kind === "string" ? params.kind : "payment";
  const queryString = searchRecordToQueryString(params);

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <ChapaReturnClient kind={kind} queryString={queryString} />
    </main>
  );
}
