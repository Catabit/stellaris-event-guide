export async function getIconUrl(iconKey: string): Promise<string | null> {
  try {
    const res = await fetch(import.meta.env.BASE_URL + "icons.json");
    const icons = await res.json();
    return icons[iconKey] || null;
  } catch {
    return null;
  }
}
