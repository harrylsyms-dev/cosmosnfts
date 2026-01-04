/**
 * Reference Image Fetching Service
 * Fetches astronomical reference images from NASA, ESA/Hubble, and ESO
 * for use as style guidance in Leonardo AI image generation
 */

export interface ReferenceImage {
  url: string;
  source: 'NASA' | 'ESA' | 'Hubble' | 'ESO';
  title?: string;
  description?: string;
}

// NASA Image and Video Library API
const NASA_IMAGE_API = 'https://images-api.nasa.gov';

// ESA/Hubble public images
const ESA_HUBBLE_API = 'https://esahubble.org/images';

// Object type to search term mappings for better results
const SEARCH_TERMS: Record<string, string[]> = {
  'Star': ['star', 'stellar', 'sun-like star', 'red giant', 'white dwarf'],
  'Galaxy': ['galaxy', 'spiral galaxy', 'elliptical galaxy', 'galactic'],
  'Nebula': ['nebula', 'planetary nebula', 'emission nebula', 'reflection nebula'],
  'Black Hole': ['black hole', 'event horizon', 'accretion disk', 'M87'],
  'Pulsar': ['pulsar', 'neutron star', 'magnetar'],
  'Quasar': ['quasar', 'active galactic nucleus', 'AGN'],
  'Star Cluster': ['star cluster', 'globular cluster', 'open cluster'],
  'Asteroid': ['asteroid', 'near earth object', 'asteroid belt'],
  'Comet': ['comet', 'comet tail', 'cometary'],
  'Exoplanet': ['exoplanet', 'extrasolar planet', 'habitable zone'],
  'Supernova': ['supernova', 'supernova remnant', 'stellar explosion'],
};

// Well-known objects with specific NASA image IDs for better matches
const KNOWN_OBJECTS: Record<string, { nasaId?: string; searchTerm: string }> = {
  // Famous Stars
  'Sirius': { searchTerm: 'Sirius star' },
  'Betelgeuse': { searchTerm: 'Betelgeuse' },
  'Proxima Centauri': { searchTerm: 'Proxima Centauri' },
  'Alpha Centauri': { searchTerm: 'Alpha Centauri' },
  'Vega': { searchTerm: 'Vega star' },
  'Polaris': { searchTerm: 'Polaris north star' },
  'Rigel': { searchTerm: 'Rigel star Orion' },

  // Messier Objects
  'M1': { searchTerm: 'Crab Nebula M1' },
  'Crab Nebula': { searchTerm: 'Crab Nebula' },
  'M31': { searchTerm: 'Andromeda Galaxy M31' },
  'Andromeda Galaxy': { searchTerm: 'Andromeda Galaxy' },
  'M42': { searchTerm: 'Orion Nebula M42' },
  'Orion Nebula': { searchTerm: 'Orion Nebula' },
  'M45': { searchTerm: 'Pleiades M45' },
  'Pleiades': { searchTerm: 'Pleiades star cluster' },
  'M51': { searchTerm: 'Whirlpool Galaxy M51' },
  'Whirlpool Galaxy': { searchTerm: 'Whirlpool Galaxy' },
  'M87': { searchTerm: 'M87 black hole' },
  'M104': { searchTerm: 'Sombrero Galaxy M104' },
  'Sombrero Galaxy': { searchTerm: 'Sombrero Galaxy' },

  // Nebulae
  'Eagle Nebula': { searchTerm: 'Eagle Nebula pillars of creation' },
  'Pillars of Creation': { searchTerm: 'pillars of creation' },
  'Helix Nebula': { searchTerm: 'Helix Nebula' },
  'Ring Nebula': { searchTerm: 'Ring Nebula M57' },
  'Horsehead Nebula': { searchTerm: 'Horsehead Nebula' },
  'Carina Nebula': { searchTerm: 'Carina Nebula' },
  'Tarantula Nebula': { searchTerm: 'Tarantula Nebula' },

  // Black Holes
  'Sagittarius A*': { searchTerm: 'Sagittarius A black hole' },
  'M87*': { searchTerm: 'M87 black hole event horizon' },

  // Galaxies
  'Milky Way': { searchTerm: 'Milky Way galaxy center' },
  'Triangulum Galaxy': { searchTerm: 'Triangulum Galaxy M33' },
  'Large Magellanic Cloud': { searchTerm: 'Large Magellanic Cloud' },
  'Small Magellanic Cloud': { searchTerm: 'Small Magellanic Cloud' },

  // Pulsars
  'Crab Pulsar': { searchTerm: 'Crab Pulsar neutron star' },
  'Vela Pulsar': { searchTerm: 'Vela Pulsar' },
};

/**
 * Search NASA Image and Video Library for reference images
 */
async function searchNASAImages(query: string): Promise<ReferenceImage | null> {
  try {
    const searchUrl = `${NASA_IMAGE_API}/search?q=${encodeURIComponent(query)}&media_type=image&page_size=5`;

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`NASA API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const items = data.collection?.items;

    if (!items || items.length === 0) {
      return null;
    }

    // Find the best image (prefer larger images, Hubble images)
    for (const item of items) {
      const links = item.links;
      const itemData = item.data?.[0];

      if (!links || links.length === 0) continue;

      // Get the image link
      const imageLink = links.find((l: any) => l.rel === 'preview' || l.render === 'image');
      if (!imageLink?.href) continue;

      // Try to get higher resolution version
      let imageUrl = imageLink.href;

      // NASA preview images are usually ~thumb.jpg, try to get larger version
      if (imageUrl.includes('~thumb')) {
        imageUrl = imageUrl.replace('~thumb', '~medium');
      } else if (imageUrl.includes('~small')) {
        imageUrl = imageUrl.replace('~small', '~medium');
      }

      return {
        url: imageUrl,
        source: 'NASA',
        title: itemData?.title,
        description: itemData?.description,
      };
    }

    return null;
  } catch (error) {
    console.error('NASA API fetch error:', error);
    return null;
  }
}

/**
 * Try ESA/Hubble as fallback - scrape image URL from public pages
 * Note: ESA/Hubble images are CC 4.0 licensed
 */
async function searchESAHubbleImages(query: string): Promise<ReferenceImage | null> {
  try {
    // ESA/Hubble has a search API we can use
    const searchUrl = `https://esahubble.org/images/?search=${encodeURIComponent(query)}`;

    // For now, we'll construct known URLs for common objects
    // ESA/Hubble uses specific image IDs like heic0910a, heic1501a, etc.

    // Known ESA/Hubble image mappings for common objects
    const esaHubbleImages: Record<string, string> = {
      'pillars of creation': 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg',
      'eagle nebula': 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg',
      'orion nebula': 'https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg',
      'crab nebula': 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg',
      'andromeda': 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg',
      'whirlpool': 'https://cdn.esahubble.org/archives/images/screen/heic0506a.jpg',
      'sombrero': 'https://cdn.esahubble.org/archives/images/screen/opo0328a.jpg',
      'helix nebula': 'https://cdn.esahubble.org/archives/images/screen/heic0707a.jpg',
      'ring nebula': 'https://cdn.esahubble.org/archives/images/screen/heic1310a.jpg',
      'horsehead': 'https://cdn.esahubble.org/archives/images/screen/heic1307a.jpg',
      'carina nebula': 'https://cdn.esahubble.org/archives/images/screen/heic0707b.jpg',
      'hubble deep field': 'https://cdn.esahubble.org/archives/images/screen/heic0611b.jpg',
      'galaxy cluster': 'https://cdn.esahubble.org/archives/images/screen/heic1509a.jpg',
    };

    const queryLower = query.toLowerCase();
    for (const [key, url] of Object.entries(esaHubbleImages)) {
      if (queryLower.includes(key)) {
        return {
          url,
          source: 'Hubble',
          title: key.charAt(0).toUpperCase() + key.slice(1),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('ESA/Hubble fetch error:', error);
    return null;
  }
}

/**
 * Get reference image for an astronomical object
 * Tries NASA first, then ESA/Hubble as fallback
 */
export async function getReferenceImage(
  objectName: string,
  objectType?: string
): Promise<ReferenceImage | null> {
  // Check if we have a known object with specific search terms
  const knownObject = KNOWN_OBJECTS[objectName];

  if (knownObject) {
    // Try the specific search term first
    const result = await searchNASAImages(knownObject.searchTerm);
    if (result) return result;

    // Try ESA/Hubble
    const esaResult = await searchESAHubbleImages(knownObject.searchTerm);
    if (esaResult) return esaResult;
  }

  // Try searching by object name directly
  let result = await searchNASAImages(objectName);
  if (result) return result;

  // Try ESA/Hubble with object name
  result = await searchESAHubbleImages(objectName);
  if (result) return result;

  // If we have an object type, try generic searches
  if (objectType) {
    const searchTerms = SEARCH_TERMS[objectType];
    if (searchTerms) {
      for (const term of searchTerms) {
        result = await searchNASAImages(term);
        if (result) return result;
      }
    }

    // Final fallback: just search the object type
    result = await searchNASAImages(objectType);
    if (result) return result;
  }

  return null;
}

/**
 * Batch fetch reference images for multiple NFTs
 * Includes rate limiting to be respectful to NASA API
 */
export async function batchFetchReferenceImages(
  nfts: Array<{ id: number; name: string; objectType?: string | null }>
): Promise<Map<number, ReferenceImage>> {
  const results = new Map<number, ReferenceImage>();

  for (const nft of nfts) {
    // Rate limit: wait 200ms between requests to be nice to NASA API
    await new Promise(resolve => setTimeout(resolve, 200));

    const refImage = await getReferenceImage(nft.name, nft.objectType || undefined);
    if (refImage) {
      results.set(nft.id, refImage);
    }
  }

  return results;
}

/**
 * Get a fallback reference image based on object type
 * Uses well-known iconic images for each category
 */
export function getFallbackReferenceImage(objectType: string): ReferenceImage | null {
  const fallbacks: Record<string, ReferenceImage> = {
    'Star': {
      url: 'https://images-assets.nasa.gov/image/PIA03149/PIA03149~medium.jpg',
      source: 'NASA',
      title: 'The Sun',
    },
    'Galaxy': {
      url: 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg',
      source: 'Hubble',
      title: 'Andromeda Galaxy',
    },
    'Nebula': {
      url: 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg',
      source: 'Hubble',
      title: 'Pillars of Creation',
    },
    'Black Hole': {
      url: 'https://images-assets.nasa.gov/image/PIA23122/PIA23122~medium.jpg',
      source: 'NASA',
      title: 'M87 Black Hole',
    },
    'Pulsar': {
      url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg',
      source: 'Hubble',
      title: 'Crab Nebula (Pulsar)',
    },
    'Quasar': {
      url: 'https://cdn.esahubble.org/archives/images/screen/heic1509a.jpg',
      source: 'Hubble',
      title: 'Galaxy Cluster with Quasar',
    },
    'Star Cluster': {
      url: 'https://cdn.esahubble.org/archives/images/screen/heic0913a.jpg',
      source: 'Hubble',
      title: 'Omega Centauri',
    },
    'Asteroid': {
      url: 'https://images-assets.nasa.gov/image/PIA24564/PIA24564~medium.jpg',
      source: 'NASA',
      title: 'Asteroid Bennu',
    },
    'Comet': {
      url: 'https://images-assets.nasa.gov/image/PIA17485/PIA17485~medium.jpg',
      source: 'NASA',
      title: 'Comet ISON',
    },
    'Exoplanet': {
      url: 'https://images-assets.nasa.gov/image/PIA23002/PIA23002~medium.jpg',
      source: 'NASA',
      title: 'Exoplanet Illustration',
    },
  };

  return fallbacks[objectType] || null;
}
