/**
 * Task 6.2: Media-related AttributeBuilders
 *
 * 専用属性ビルダー（メディア・リンク系）:
 * - ImageAttributeBuilder: src, alt, width, height, loading
 * - LinkAttributeBuilder: href, rel, type, media
 *
 * Requirements: 7.5
 */
import { BaseAttributeBuilder } from './attribute-builder-base.js';

// ============================================================
// ImageAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================

/**
 * Specialized attribute builder for HTML img elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with image-specific attributes:
 * - src - Image source URL
 * - alt - Alternative text for accessibility
 * - width/height - Image dimensions
 * - loading - Lazy loading strategy
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * ```typescript
 * const imgAttrs = new ImageAttributeBuilder()
 *   .setSrc('/images/hero.jpg')
 *   .setAlt('Hero banner image')
 *   .setWidth(800)
 *   .setHeight(600)
 *   .setLoading('lazy')
 *   .addClass('img-responsive')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 */
export class ImageAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the src attribute (image source URL).
   *
   * @param src - The URL of the image
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setSrc('/images/logo.png');
   * // Produces: src="/images/logo.png"
   *
   * builder.setSrc('https://example.com/photo.jpg');
   * // Produces: src="https://example.com/photo.jpg"
   * ```
   */
  setSrc(src: string): this {
    return this.addKeyValue('src', src);
  }

  /**
   * Sets the alt attribute (alternative text).
   *
   * @param alt - Descriptive text for the image (important for accessibility)
   * @returns This builder for method chaining
   *
   * @remarks
   * The alt attribute is crucial for accessibility. It should:
   * - Describe the image content for screen readers
   * - Be empty ("") for decorative images
   * - Not include "image of" or "picture of"
   *
   * @example
   * ```typescript
   * builder.setAlt('Company logo');
   * // Produces: alt="Company logo"
   *
   * builder.setAlt(''); // Decorative image
   * // Produces: alt=""
   * ```
   */
  setAlt(alt: string): this {
    return this.addKeyValue('alt', alt);
  }

  /**
   * Sets the width attribute.
   *
   * @param width - Image width in pixels (number or string)
   * @returns This builder for method chaining
   *
   * @remarks
   * Setting explicit width and height helps prevent layout shift during page load.
   *
   * @example
   * ```typescript
   * builder.setWidth(800);    // Produces: width="800"
   * builder.setWidth('100%'); // Produces: width="100%"
   * ```
   */
  setWidth(width: number | string): this {
    return this.addKeyValue('width', width);
  }

  /**
   * Sets the height attribute.
   *
   * @param height - Image height in pixels (number or string)
   * @returns This builder for method chaining
   *
   * @remarks
   * Setting explicit width and height helps prevent layout shift during page load.
   *
   * @example
   * ```typescript
   * builder.setHeight(600);   // Produces: height="600"
   * builder.setHeight('auto'); // Produces: height="auto"
   * ```
   */
  setHeight(height: number | string): this {
    return this.addKeyValue('height', height);
  }

  /**
   * Sets the loading attribute (lazy loading strategy).
   *
   * @param loading - Loading strategy ('lazy' or 'eager')
   * @returns This builder for method chaining
   *
   * @remarks
   * - 'lazy' - Defer loading until the image is near the viewport (improves performance)
   * - 'eager' - Load immediately (default browser behavior)
   *
   * @example
   * ```typescript
   * builder.setLoading('lazy');
   * // Produces: loading="lazy"
   * // Good for below-the-fold images
   *
   * builder.setLoading('eager');
   * // Produces: loading="eager"
   * // Good for above-the-fold images
   * ```
   */
  setLoading(loading: 'lazy' | 'eager'): this {
    return this.addKeyValue('loading', loading);
  }
}

// ============================================================
// LinkAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================

/**
 * Specialized attribute builder for HTML link and anchor (a) elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with link-specific attributes:
 * - href - Link destination URL
 * - rel - Relationship between current document and linked resource
 * - type - MIME type of linked resource
 * - media - Media query for when the link applies
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * Link element (stylesheet)
 * ```typescript
 * const stylesheetAttrs = new LinkAttributeBuilder()
 *   .setHref('/styles/main.css')
 *   .setRel('stylesheet')
 *   .setType('text/css')
 *   .build();
 * ```
 *
 * @example
 * Anchor element (hyperlink)
 * ```typescript
 * const linkAttrs = new LinkAttributeBuilder()
 *   .setHref('https://example.com')
 *   .setRel('noopener noreferrer')
 *   .setId('external-link')
 *   .addClass('link', 'link-external')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 */
export class LinkAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the href attribute (link destination).
   *
   * @param href - The URL of the linked resource
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setHref('/about');
   * // Produces: href="/about"
   *
   * builder.setHref('https://example.com');
   * // Produces: href="https://example.com"
   *
   * builder.setHref('#section-2');
   * // Produces: href="#section-2"
   * ```
   */
  setHref(href: string): this {
    return this.addKeyValue('href', href);
  }

  /**
   * Sets the rel attribute (relationship).
   *
   * @param rel - The relationship type(s) (space-separated)
   * @returns This builder for method chaining
   *
   * @remarks
   * Common values:
   * - 'stylesheet' - CSS stylesheet
   * - 'icon' - Favicon
   * - 'noopener' - Prevents window.opener access (security)
   * - 'noreferrer' - Prevents referer header
   * - 'nofollow' - Search engine hint
   *
   * @example
   * ```typescript
   * builder.setRel('stylesheet');
   * // Produces: rel="stylesheet"
   *
   * builder.setRel('noopener noreferrer');
   * // Produces: rel="noopener noreferrer"
   * ```
   */
  setRel(rel: string): this {
    return this.addKeyValue('rel', rel);
  }

  /**
   * Sets the type attribute (MIME type).
   *
   * @param type - The MIME type of the linked resource
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setType('text/css');
   * // Produces: type="text/css"
   *
   * builder.setType('application/rss+xml');
   * // Produces: type="application/rss+xml"
   * ```
   */
  setType(type: string): this {
    return this.addKeyValue('type', type);
  }

  /**
   * Sets the media attribute (media query).
   *
   * @param media - CSS media query for when the link applies
   * @returns This builder for method chaining
   *
   * @remarks
   * Used primarily with `<link>` elements to conditionally load resources.
   *
   * @example
   * ```typescript
   * builder.setMedia('screen and (min-width: 768px)');
   * // Produces: media="screen and (min-width: 768px)"
   *
   * builder.setMedia('print');
   * // Produces: media="print"
   * ```
   */
  setMedia(media: string): this {
    return this.addKeyValue('media', media);
  }
}
