export type CommonsMedia = {
  title: string;
  pageId: number;
  imageUrl?: string;
  thumbUrl?: string;
  artist?: string;
  date?: string;
  description?: string;
  license?: string;
  licenseUrl?: string;
  usageTerms?: string;
  rightsStatus: 'machine-readable' | 'needs-review';
};

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const PASTVU_API = 'https://api.pastvu.com/api2';

function stripHtml(value?: string) {
  return value?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export async function searchCommonsNear(latitude: number, longitude: number, radiusMeters = 500, limit = 12): Promise<CommonsMedia[]> {
  const geo = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    list: 'geosearch',
    gscoord: `${latitude}|${longitude}`,
    gsradius: String(Math.max(10, Math.min(radiusMeters, 10000))),
    gslimit: String(Math.max(1, Math.min(limit, 25))),
    gsnamespace: '6'
  });

  const geoResponse = await fetch(`${COMMONS_API}?${geo.toString()}`);
  if (!geoResponse.ok) throw new Error(`Commons geosearch failed: ${geoResponse.status}`);
  const geoJson = await geoResponse.json() as { query?: { geosearch?: Array<{ pageid: number; title: string }> } };
  const files = geoJson.query?.geosearch ?? [];
  if (files.length === 0) return [];

  const metadata = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'imageinfo',
    pageids: files.map((file) => file.pageid).join('|'),
    iiprop: 'url|extmetadata',
    iiurlwidth: '1200',
    iiextmetadatafilter: 'Artist|DateTimeOriginal|ImageDescription|LicenseShortName|LicenseUrl|UsageTerms'
  });

  const metadataResponse = await fetch(`${COMMONS_API}?${metadata.toString()}`);
  if (!metadataResponse.ok) throw new Error(`Commons metadata failed: ${metadataResponse.status}`);
  const metadataJson = await metadataResponse.json() as {
    query?: {
      pages?: Record<string, {
        pageid: number;
        title: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }>;
    };
  };

  return Object.values(metadataJson.query?.pages ?? {}).map((page) => {
    const info = page.imageinfo?.[0];
    const ext = info?.extmetadata ?? {};
    const license = stripHtml(ext.LicenseShortName?.value);
    const licenseUrl = ext.LicenseUrl?.value;
    return {
      pageId: page.pageid,
      title: page.title,
      imageUrl: info?.url,
      thumbUrl: info?.thumburl,
      artist: stripHtml(ext.Artist?.value),
      date: stripHtml(ext.DateTimeOriginal?.value),
      description: stripHtml(ext.ImageDescription?.value),
      license,
      licenseUrl,
      usageTerms: stripHtml(ext.UsageTerms?.value),
      rightsStatus: license && licenseUrl ? 'machine-readable' : 'needs-review'
    };
  });
}

/**
 * PastVu is used only as a discovery index. A returned photo must pass a separate
 * rights review before the media file can be included in a commercial route pack.
 */
export async function discoverPastVuNearby(latitude: number, longitude: number, options?: { distance?: number; fromYear?: number; toYear?: number; limit?: number }) {
  const params = {
    geo: [latitude, longitude],
    distance: Math.min(options?.distance ?? 1000, 1000000),
    year: options?.fromYear,
    year2: options?.toYear,
    type: 'photo',
    limit: Math.min(options?.limit ?? 12, 30)
  };

  const query = new URLSearchParams({
    method: 'photo.giveNearestPhotos',
    params: JSON.stringify(params)
  });

  const response = await fetch(`${PASTVU_API}?${query.toString()}`);
  if (!response.ok) throw new Error(`PastVu discovery failed: ${response.status}`);
  return response.json() as Promise<unknown>;
}
