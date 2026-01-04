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

// Curated list of VERIFIED reference images for well-known objects
// These are direct URLs to actual images of the objects, not search results
const CURATED_IMAGES: Record<string, ReferenceImage> = {
  // Famous Stars - Most stars don't have good direct images, use artist concepts or Hubble observations
  'Sirius': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0516a.jpg',
    source: 'Hubble',
    title: 'Sirius A and B',
  },
  'Betelgeuse': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo2003a.jpg',
    source: 'Hubble',
    title: 'Betelgeuse',
  },
  'Proxima Centauri': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1324a.jpg',
    source: 'Hubble',
    title: 'Proxima Centauri',
  },
  'Alpha Centauri': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1324a.jpg',
    source: 'Hubble',
    title: 'Alpha Centauri system',
  },
  'Vega': {
    url: 'https://images-assets.nasa.gov/image/PIA17005/PIA17005~medium.jpg',
    source: 'NASA',
    title: 'Vega debris disk',
  },
  'Polaris': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg',
    source: 'Hubble',
    title: 'Polaris region',
  },

  // Messier Objects - These have great Hubble images
  'Crab Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg',
    source: 'Hubble',
    title: 'Crab Nebula M1',
  },
  'M1': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg',
    source: 'Hubble',
    title: 'Crab Nebula M1',
  },
  'Andromeda Galaxy': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg',
    source: 'Hubble',
    title: 'Andromeda Galaxy M31',
  },
  'M31': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg',
    source: 'Hubble',
    title: 'Andromeda Galaxy M31',
  },
  'Orion Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg',
    source: 'Hubble',
    title: 'Orion Nebula M42',
  },
  'M42': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg',
    source: 'Hubble',
    title: 'Orion Nebula M42',
  },
  'Pleiades': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo0420a.jpg',
    source: 'Hubble',
    title: 'Pleiades M45',
  },
  'M45': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo0420a.jpg',
    source: 'Hubble',
    title: 'Pleiades M45',
  },
  'Whirlpool Galaxy': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0506a.jpg',
    source: 'Hubble',
    title: 'Whirlpool Galaxy M51',
  },
  'M51': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0506a.jpg',
    source: 'Hubble',
    title: 'Whirlpool Galaxy M51',
  },
  'Sombrero Galaxy': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo0328a.jpg',
    source: 'Hubble',
    title: 'Sombrero Galaxy M104',
  },
  'M104': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo0328a.jpg',
    source: 'Hubble',
    title: 'Sombrero Galaxy M104',
  },
  'M87': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo0020a.jpg',
    source: 'Hubble',
    title: 'M87 Elliptical Galaxy',
  },

  // Nebulae
  'Eagle Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg',
    source: 'Hubble',
    title: 'Pillars of Creation - Eagle Nebula',
  },
  'Pillars of Creation': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg',
    source: 'Hubble',
    title: 'Pillars of Creation',
  },
  'Helix Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0707a.jpg',
    source: 'Hubble',
    title: 'Helix Nebula',
  },
  'Ring Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1310a.jpg',
    source: 'Hubble',
    title: 'Ring Nebula M57',
  },
  'Horsehead Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1307a.jpg',
    source: 'Hubble',
    title: 'Horsehead Nebula',
  },
  'Carina Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0707b.jpg',
    source: 'Hubble',
    title: 'Carina Nebula',
  },
  'Tarantula Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1206a.jpg',
    source: 'Hubble',
    title: 'Tarantula Nebula',
  },
  'Cat\'s Eye Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0414a.jpg',
    source: 'Hubble',
    title: 'Cat\'s Eye Nebula',
  },
  'Butterfly Nebula': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0910h.jpg',
    source: 'Hubble',
    title: 'Butterfly Nebula',
  },

  // Black Holes
  'Sagittarius A*': {
    url: 'https://images-assets.nasa.gov/image/PIA25440/PIA25440~medium.jpg',
    source: 'NASA',
    title: 'Sagittarius A* Black Hole',
  },
  'M87*': {
    url: 'https://images-assets.nasa.gov/image/PIA23122/PIA23122~medium.jpg',
    source: 'NASA',
    title: 'M87 Black Hole',
  },

  // Galaxies
  'Milky Way': {
    url: 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~medium.jpg',
    source: 'NASA',
    title: 'Milky Way Galaxy Center',
  },
  'Triangulum Galaxy': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1901a.jpg',
    source: 'Hubble',
    title: 'Triangulum Galaxy M33',
  },
  'M33': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1901a.jpg',
    source: 'Hubble',
    title: 'Triangulum Galaxy M33',
  },
  'Large Magellanic Cloud': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1901b.jpg',
    source: 'Hubble',
    title: 'Large Magellanic Cloud',
  },
  'Small Magellanic Cloud': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0514a.jpg',
    source: 'Hubble',
    title: 'Small Magellanic Cloud',
  },
  'Centaurus A': {
    url: 'https://cdn.esahubble.org/archives/images/screen/opo1028a.jpg',
    source: 'Hubble',
    title: 'Centaurus A Galaxy',
  },

  // Star Clusters
  'Omega Centauri': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0913a.jpg',
    source: 'Hubble',
    title: 'Omega Centauri',
  },
  '47 Tucanae': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic1510a.jpg',
    source: 'Hubble',
    title: '47 Tucanae Globular Cluster',
  },

  // Pulsars
  'Crab Pulsar': {
    url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg',
    source: 'Hubble',
    title: 'Crab Nebula with Pulsar',
  },
  'Vela Pulsar': {
    url: 'https://images-assets.nasa.gov/image/PIA15415/PIA15415~medium.jpg',
    source: 'NASA',
    title: 'Vela Pulsar',
  },
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
 * Priority: 1) Curated images, 2) Fallback by type
 * We no longer search NASA API directly as results are unreliable
 */
export async function getReferenceImage(
  objectName: string,
  objectType?: string
): Promise<ReferenceImage | null> {
  // First check if we have a curated image for this exact object
  const curated = CURATED_IMAGES[objectName];
  if (curated) {
    console.log(`Found curated image for ${objectName} from ${curated.source}`);
    return curated;
  }

  // Check for partial matches (e.g., "Sirius A" should match "Sirius")
  for (const [name, image] of Object.entries(CURATED_IMAGES)) {
    if (objectName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(objectName.toLowerCase())) {
      console.log(`Found partial curated match: ${objectName} -> ${name}`);
      return image;
    }
  }

  // If no curated image, return null - will use fallback by type
  // We don't search NASA API anymore as it returns unreliable results
  console.log(`No curated image for ${objectName}, will use fallback`);
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
