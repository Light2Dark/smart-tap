import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CardDesigner } from "@/components/designer/card-designer";
import { cardAssetPath, parseStoredDesign } from "@/lib/card-design";
import { signCardImage } from "@/lib/card-images";
import { createClient } from "@/utils/supabase/server";

export default function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="px-6 text-sm text-zinc-500">Loading designer…</p>}
    >
      <Designer params={params} />
    </Suspense>
  );
}

async function Designer({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const { id: idValue } = await params;
  if (!/^\d+$/.test(idValue)) {
    notFound();
  }
  const id = Number(idValue);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, title, public_id, design_json, image_path")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) {
    notFound();
  }

  const savedDesign = parseStoredDesign(data.design_json);
  const [savedImageUrl, backgroundUrl, photoUrl] = await Promise.all([
    signCardImage(supabase, data.image_path),
    savedDesign?.template?.hasBackgroundImage
      ? signCardImage(supabase, cardAssetPath(userId, id, "background"))
      : null,
    savedDesign?.template?.photo
      ? signCardImage(supabase, cardAssetPath(userId, id, "photo"))
      : null,
  ]);

  return (
    <CardDesigner
      cardId={id}
      userId={userId}
      title={data.title}
      publicId={data.public_id}
      savedDesign={savedDesign}
      savedImageUrl={savedImageUrl}
      backgroundUrl={backgroundUrl}
      photoUrl={photoUrl}
    />
  );
}
