import "server-only";

type MetadataRecord = Record<string, unknown>;

const reverseGeocodeCache = new Map<string, Promise<string | null>>();

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickFirstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function buildAddressLabel(payload: Record<string, unknown>) {
  const address =
    payload.address && typeof payload.address === "object" ? (payload.address as Record<string, unknown>) : null;

  const houseNumber = pickFirstNonEmpty(address?.house_number);
  const road = pickFirstNonEmpty(address?.road, address?.pedestrian, address?.footway, address?.residential);
  const suburb = pickFirstNonEmpty(address?.suburb, address?.neighbourhood, address?.quarter);
  const city = pickFirstNonEmpty(address?.city, address?.town, address?.village, address?.municipality);
  const stateCode = pickFirstNonEmpty(address?.state_code, address?.state);

  const streetBlock = [road, houseNumber].filter(Boolean).join(", ");
  const localityBlock = [suburb, city && stateCode ? `${city}/${stateCode}` : city || stateCode].filter(Boolean).join(" - ");
  const formatted = [streetBlock, localityBlock].filter(Boolean).join(" - ");

  if (formatted) {
    return formatted;
  }

  return normalizeText(payload.display_name) || null;
}

export function getStoredAddressLabel(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const addressLabel = normalizeText((metadata as MetadataRecord).addressLabel);
  return addressLabel || null;
}

export async function reverseGeocodeCoordinates(lat: number, lng: number) {
  if (![lat, lng].every(Number.isFinite) || (lat === 0 && lng === 0)) {
    return null;
  }

  const cacheKey = `${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = reverseGeocodeCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const pending = (async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
        {
          headers: {
            "User-Agent": "FCComunicacaoVisualPonto/1.0",
          },
          cache: "force-cache",
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return buildAddressLabel(payload);
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      return null;
    }
  })();

  reverseGeocodeCache.set(cacheKey, pending);
  return pending;
}

export async function resolveAddressLabel(metadata: unknown, lat: number, lng: number) {
  return getStoredAddressLabel(metadata) ?? (await reverseGeocodeCoordinates(lat, lng));
}
