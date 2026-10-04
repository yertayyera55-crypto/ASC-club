import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response(null, { status: 404 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response(null, { status: 401 });

  const { data: event } = await supabase.from("events").select("image_path").eq("id", id).maybeSingle();
  if (!event?.image_path) return new Response(null, { status: 404 });

  const { data: image, error } = await supabase.storage.from("event-images").download(event.image_path);
  if (error || !image) return new Response(null, { status: 404 });

  return new Response(image, {
    headers: {
      "Content-Type": image.type || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
