import { revalidatePath } from "next/cache";

// Called after every successful admin save so the public pages rebuild
// immediately instead of waiting out the 60-second cache.
export function refreshSite(): void {
  try {
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("refreshSite failed:", err);
  }
}
