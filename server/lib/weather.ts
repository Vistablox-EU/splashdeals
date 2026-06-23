/**
 * 🌤️ getWeather — Pure data fetch from Open-Meteo API.
 *
 * Returns the current weather for a given lat/lng coordinate pair.
 * Revalidates every 3600s (1 hour) via Next.js fetch cache.
 * No React, no JSX — import from any server component or route.
 */
export async function getWeather(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
      { next: { revalidate: 3600 } },
    )
    const data = await res.json()
    return (data?.current_weather ?? null) as {
      temperature: number
      weathercode: number
      windspeed?: number
      is_day?: number
      time?: string
    } | null
  } catch {
    return null
  }
}
