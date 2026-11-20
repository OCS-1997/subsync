/**
 * Controller for providing dynamic, secure, and resilient quotes
 * Fetches from free external APIs with strict timeout, sanitization, in-memory caching,
 * and high-quality curated fallbacks so the endpoint never fails.
 */

const FALLBACK_QUOTES = [
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { quote: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { quote: "Simplicity is the prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { quote: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { quote: "Great things in business are never done by one person. They are done by a team of people.", author: "Steve Jobs" },
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "Efficiency is doing better what is already being done.", author: "Peter Drucker" },
  { quote: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" }
];

// In-memory quote pool and cache tracker
const quotePool = [...FALLBACK_QUOTES];
let lastExternalFetchTime = 0;
const FETCH_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown between external API hits

/**
 * Sanitize strings to strip any HTML tags, control characters, and constrain length
 */
function sanitizeText(str, maxLength = 300) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip ASCII control characters
    .replace(/\s+/g, ' ') // Collapse extra whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Fetch a quote from primary external source (dummyjson)
 */
async function fetchFromDummyJson() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.quote && data?.author) {
      return {
        quote: sanitizeText(data.quote, 320),
        author: sanitizeText(data.author, 80)
      };
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Fetch a quote from secondary external source (FavQs)
 */
async function fetchFromFavQs() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch('https://favqs.com/api/qotd', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.quote?.body && data?.quote?.author) {
      return {
        quote: sanitizeText(data.quote.body, 320),
        author: sanitizeText(data.quote.author, 80)
      };
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Controller to serve quotes for public pages (e.g. login branding)
 */
export async function getPublicQuote(req, res) {
  try {
    const now = Date.now();
    const shouldFetchExternal = (now - lastExternalFetchTime) > FETCH_COOLDOWN_MS;

    if (shouldFetchExternal) {
      // Try primary API first, then secondary
      let externalQuote = await fetchFromDummyJson();
      if (!externalQuote) {
        externalQuote = await fetchFromFavQs();
      }

      if (externalQuote && externalQuote.quote && externalQuote.author) {
        lastExternalFetchTime = now;
        // Keep quotePool size contained while enriching with fresh quotes
        quotePool.unshift(externalQuote);
        if (quotePool.length > 50) {
          quotePool.pop();
        }
        return res.status(200).json({
          success: true,
          quote: externalQuote.quote,
          author: externalQuote.author,
          source: 'live'
        });
      }
    }

    // Pick a random quote from the pool
    const randomIndex = Math.floor(Math.random() * quotePool.length);
    const selectedQuote = quotePool[randomIndex] || FALLBACK_QUOTES[0];

    return res.status(200).json({
      success: true,
      quote: selectedQuote.quote,
      author: selectedQuote.author,
      source: 'cached'
    });
  } catch (error) {
    // Infallible fail-safe
    const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return res.status(200).json({
      success: true,
      quote: fallback.quote,
      author: fallback.author,
      source: 'fallback'
    });
  }
}
