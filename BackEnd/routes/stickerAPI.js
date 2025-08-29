// ===== routes/stickerAPI.js =====
const express = require("express");
const router = express.Router();

// Generate fallback stickers when API doesn't return good results
const generateFallbackStickers = (query) => {
  const fallbackStickers = [
    {
      id: 'fallback-1',
      title: `${query} sticker`,
      image: {
        source: `https://dummyimage.com/200x200/FF6B6B/FFFFFF.png&text=${encodeURIComponent(query)}`,
        width: 200,
        height: 200
      },
      category: 'fallback-sticker',
      tags: [query, 'sticker', 'fallback']
    },
    {
      id: 'fallback-2',
      title: `${query} icon`,
      image: {
        source: `https://dummyimage.com/200x200/4ECDC4/FFFFFF.png&text=${encodeURIComponent(query)}`,
        width: 200,
        height: 200
      },
      category: 'fallback-icon',
      tags: [query, 'icon', 'fallback']
    },
    {
      id: 'fallback-3',
      title: `${query} emoji`,
      image: {
        source: `https://dummyimage.com/200x200/45B7D1/FFFFFF.png&text=${encodeURIComponent(query)}`,
        width: 200,
        height: 200
      },
      category: 'fallback-emoji',
      tags: [query, 'emoji', 'fallback']
    }
  ];
  
  return fallbackStickers;
};

/**
 * @swagger
 * /api/stickerAPI:
 *   get:
 *     summary: Search for stickers
 *     description: Search for stickers using the Freepik API
 *     tags: [StickerAPI]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for stickers
 *         example: "cute cat"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Stickers found successfully
 *       400:
 *         description: Bad request - missing query parameter
 *       401:
 *         description: Unauthorized - missing or invalid API key
 *       500:
 *         description: Server error or external API failure
 */
router.get("/", async (req, res) => {
  const { query, page = 1, per_page = 20 } = req.query;

  // Validate required parameters
  if (!query) {
    return res.status(400).json({ 
      error: 'Query parameter is required',
      message: 'Please provide a search term for stickers'
    });
  }

  try {
    // Enhance search query to be more sticker-specific
    const enhancedQuery = `${query} sticker icon emoji`;
    
    // First try to get stickers specifically
    let response = await fetch(
      `https://api.freepik.com/v1/resources?query=${encodeURIComponent(enhancedQuery)}&type=vector&page=${page}&per_page=${per_page}`,
      {
        headers: {
          'X-Freepik-API-Key': process.env.FREEPIK_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Fallback to general search if specific search fails
      response = await fetch(
        `https://api.freepik.com/v1/resources?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`,
        {
          headers: {
            'X-Freepik-API-Key': process.env.FREEPIK_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: 'Freepik API request failed', 
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Debug logging
    console.log('Freepik API response:', {
      query: query,
      totalResults: data.total_results || data.data?.length || 'unknown',
      hasData: !!data.data,
      dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
      sampleItem: data.data?.[0] ? {
        title: data.data[0].title,
        hasImage: !!(data.data[0].image || data.data[0].url || data.data[0].thumbnail),
        imageKeys: Object.keys(data.data[0].image || {}),
        urlKeys: Object.keys(data.data[0]).filter(key => key.includes('url') || key.includes('image'))
      } : 'no items'
    });
    
    // Filter and process results to ensure we get actual stickers
    let processedData = data;
    
    if (data.data && Array.isArray(data.data)) {
      // Filter out non-sticker content and prioritize sticker-like results
      const filteredResults = data.data
        .filter(item => {
          // Check if it's actually a sticker, icon, or emoji
          const title = (item.title || '').toLowerCase();
          const tags = (item.tags || []).map(tag => tag.toLowerCase());
          const description = (item.description || '').toLowerCase();
          
          // Keywords that indicate sticker-like content
          const stickerKeywords = ['sticker', 'icon', 'emoji', 'vector', 'illustration', 'cartoon', 'cute'];
          
          // Check if any sticker keywords are present
          const hasStickerKeywords = stickerKeywords.some(keyword => 
            title.includes(keyword) || 
            tags.some(tag => tag.includes(keyword)) ||
            description.includes(keyword)
          );
          
          // Also check if the image dimensions are appropriate for stickers (not too wide/tall)
          const isAppropriateSize = !item.width || !item.height || 
            (item.width / item.height >= 0.5 && item.width / item.height <= 2);
          
          return hasStickerKeywords || isAppropriateSize;
        })
        .map(item => {
          // Get the best available image URL
          let imageUrl = null;
          if (item.image?.source) {
            imageUrl = item.image.source;
          } else if (item.image?.url) {
            imageUrl = item.image.url;
          } else if (item.url) {
            imageUrl = item.url;
          } else if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else if (item.preview) {
            imageUrl = item.preview;
          }
          
          // If no image URL found, skip this item
          if (!imageUrl) {
            return null;
          }
          
          return {
            ...item,
            // Ensure we have proper image URLs
            image: {
              source: imageUrl,
              width: item.width || 512,
              height: item.height || 512
            },
            // Clean up title for better display
            title: item.title || item.name || 'Sticker',
            // Add sticker category
            category: 'sticker'
          };
        })
        .filter(item => item !== null); // Remove items without images
      
      // If we don't have enough good results, add some fallback stickers
      if (filteredResults.length < 5) {
        const fallbackStickers = generateFallbackStickers(query);
        filteredResults.push(...fallbackStickers);
      }
      
      processedData = {
        ...data,
        data: filteredResults,
        filtered_count: filteredResults.length,
        original_count: data.data.length
      };
    }
    
    res.status(200).json(processedData);
  } catch (error) {
    console.error('Freepik API error:', error);
    res.status(500).json({ error: 'Failed to fetch from Freepik' });
  }
});

/**
 * @swagger
 * /api/stickerAPI/generate:
 *   post:
 *     summary: Generate AI stickers
 *     description: Generate custom stickers using Segmind AI
 *     tags: [StickerAPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Text description for sticker generation
 *                 example: "cute cartoon cat with sunglasses"
 *               style:
 *                 type: string
 *                 description: Art style for the sticker
 *                 example: "cartoon"
 *             required:
 *               - prompt
 *     responses:
 *       200:
 *         description: Sticker generated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Generation failed
 */
router.post("/generate", async (req, res) => {
  const { prompt, style = "sticker", ...otherParams } = req.body;

  if (!prompt) {
    return res.status(400).json({ 
      error: 'Prompt is required',
      message: 'Please provide a description for sticker generation'
    });
  }

  try {
    const response = await fetch('https://www.segmind.com/pixelflows/ai-sticker-generator/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SEGMIND_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        style,
        ...otherParams
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: 'Segmind API request failed', 
        details: errorData 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Segmind API error:', error);
    res.status(500).json({ error: 'Failed to generate sticker' });
  }
});

module.exports = router;

