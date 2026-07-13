import { redisClient } from '../queues/queueConfig.js';
import appDB from '../db/subsyncDB.js';

const CACHE_TTL = 300; // 5 minutes in seconds

const KEYS = {
    customer: (id) => `crm:cache:customer:${id}`,
    domains: (id) => `crm:cache:domains:${id}`,
    services: (id) => `crm:cache:services:${id}`,
    subscriptions: (id) => `crm:cache:subscriptions:${id}`
};

// Retrieve CRM Base URL from environment or settings
async function getCrmBaseUrl() {
    if (process.env.CRM_API_BASE_URL) {
        return process.env.CRM_API_BASE_URL;
    }
    // Fallback: use helpdesk_url host or localhost
    const [settings] = await appDB.query("SELECT helpdesk_url FROM helpdesk_settings LIMIT 1");
    if (settings.length > 0 && settings[0].helpdesk_url) {
        try {
            const url = new URL(settings[0].helpdesk_url);
            return `${url.protocol}//${url.host}/api/crm`;
        } catch (e) {
            // Ignore URL parsing errors
        }
    }
    return `http://localhost:${process.env.NODE_PORT || 3000}/api/crm`;
}

// Fetch helper with timeout
async function fetchFromCrm(endpoint) {
    const baseUrl = await getCrmBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    console.log(`[CrmCacheService] Fetching live data from CRM: ${url}`);
    
    // Retrieve API key from helpdesk_settings for auth
    const [settings] = await appDB.query("SELECT api_key FROM helpdesk_settings LIMIT 1");
    const apiKey = settings.length > 0 ? settings[0].api_key : 'crm_apikey_default_123456';

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(8000) // 8 seconds timeout
    });

    if (!response.ok) {
        throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

export async function getOrFetchDomains(customerId) {
    const key = KEYS.domains(customerId);
    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`[CrmCacheService] Domain cache hit for customer: ${customerId}`);
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('[CrmCacheService] Error reading domain cache:', e);
    }

    // Cache miss: fetch from CRM
    const data = await fetchFromCrm(`/customers/${customerId}/domains`);
    const domains = data.domains || [];

    try {
        await redisClient.set(key, JSON.stringify(domains), 'EX', CACHE_TTL);
    } catch (e) {
        console.error('[CrmCacheService] Error writing domain cache:', e);
    }

    return domains;
}

export async function getOrFetchServices(customerId) {
    const key = KEYS.services(customerId);
    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`[CrmCacheService] Service cache hit for customer: ${customerId}`);
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('[CrmCacheService] Error reading service cache:', e);
    }

    // Cache miss: fetch from CRM
    const data = await fetchFromCrm(`/customers/${customerId}/services`);
    const services = data.services || [];

    try {
        await redisClient.set(key, JSON.stringify(services), 'EX', CACHE_TTL);
    } catch (e) {
        console.error('[CrmCacheService] Error writing service cache:', e);
    }

    return services;
}

export async function getOrFetchSubscriptions(customerId) {
    const key = KEYS.subscriptions(customerId);
    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`[CrmCacheService] Subscription cache hit for customer: ${customerId}`);
            return JSON.parse(cached);
        }
    } catch (e) {
        console.error('[CrmCacheService] Error reading subscription cache:', e);
    }

    // Cache miss: fetch from CRM
    const data = await fetchFromCrm(`/customers/${customerId}/subscriptions`);
    const subscriptions = data.subscriptions || [];

    try {
        await redisClient.set(key, JSON.stringify(subscriptions), 'EX', CACHE_TTL);
    } catch (e) {
        console.error('[CrmCacheService] Error writing subscription cache:', e);
    }

    return subscriptions;
}

// Invalidation functions
export async function invalidateDomainsCache(customerId) {
    console.log(`[CrmCacheService] Invalidating domain cache for customer: ${customerId}`);
    await redisClient.del(KEYS.domains(customerId));
}

export async function invalidateServicesCache(customerId) {
    console.log(`[CrmCacheService] Invalidating service cache for customer: ${customerId}`);
    await redisClient.del(KEYS.services(customerId));
}

export async function invalidateSubscriptionsCache(customerId) {
    console.log(`[CrmCacheService] Invalidating subscription cache for customer: ${customerId}`);
    await redisClient.del(KEYS.subscriptions(customerId));
}

export async function invalidateCustomerCache(customerId) {
    console.log(`[CrmCacheService] Invalidating customer cache for customer: ${customerId}`);
    await redisClient.del(KEYS.customer(customerId));
}

export async function invalidateAllCaches(customerId) {
    console.log(`[CrmCacheService] Invalidating all caches for customer: ${customerId}`);
    await Promise.all([
        redisClient.del(KEYS.customer(customerId)),
        redisClient.del(KEYS.domains(customerId)),
        redisClient.del(KEYS.services(customerId)),
        redisClient.del(KEYS.subscriptions(customerId))
    ]);
}
