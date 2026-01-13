import { useEffect } from 'react';

/**
 * SEO Meta Tags Component
 * Dynamically updates document head with SEO metadata
 */
export default function SEOMetaTags({ seo, structuredData }) {
    useEffect(() => {
        if (!seo) return;

        // Update document title
        document.title = seo.title || 'Knowledge Base';

        // Helper to update or create meta tag
        const updateMetaTag = (name, content, isProperty = false) => {
            if (!content) return;

            const attribute = isProperty ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${name}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Standard meta tags
        updateMetaTag('description', seo.description);
        updateMetaTag('keywords', seo.keywords);

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', seo.canonical);

        // Open Graph tags
        updateMetaTag('og:title', seo.ogTitle, true);
        updateMetaTag('og:description', seo.ogDescription, true);
        updateMetaTag('og:image', seo.ogImage, true);
        updateMetaTag('og:url', seo.ogUrl, true);
        updateMetaTag('og:type', seo.ogType, true);
        updateMetaTag('og:site_name', 'Knowledge Base', true);

        // Twitter Card tags
        updateMetaTag('twitter:card', seo.twitterCard);
        updateMetaTag('twitter:title', seo.twitterTitle);
        updateMetaTag('twitter:description', seo.twitterDescription);
        updateMetaTag('twitter:image', seo.twitterImage);

        // Article meta tags
        if (seo.author) {
            updateMetaTag('author', seo.author);
        }
        if (seo.publishedTime) {
            updateMetaTag('article:published_time', seo.publishedTime, true);
        }
        if (seo.modifiedTime) {
            updateMetaTag('article:modified_time', seo.modifiedTime, true);
        }

        // Add structured data (JSON-LD)
        if (structuredData) {
            let script = document.querySelector('script[type="application/ld+json"]');
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('type', 'application/ld+json');
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }

        // Cleanup function
        return () => {
            // Reset title on unmount
            document.title = 'Subsync';
        };
    }, [seo, structuredData]);

    // This component doesn't render anything
    return null;
}
