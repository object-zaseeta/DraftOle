/**
 * factories-media.ts
 *
 * メディア・自己終了タグ・テキストファクトリ関数:
 * ペアタグ: video, audio, picture, canvas, svg
 * 自己終了タグ: br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr
 * テキスト: Text (Text.unsafeRaw を含む)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
import { PairType } from '../elements/pair-type.js';
import { SelfClosingType } from '../elements/self-closing-type.js';
import { TextType } from '../elements/text-type.js';
import { makePairTag, makeSelfClosingTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── メディア ──

/** Creates a `<video>` element (video player). */
export function video(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.video, args); }

/** Creates an `<audio>` element (audio player). */
export function audio(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.audio, args); }

/** Creates a `<picture>` element (responsive image container). */
export function picture(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.picture, args); }

/** Creates a `<canvas>` element (scriptable graphics). */
export function canvas(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.canvas, args); }

/** Creates an `<svg>` element (scalable vector graphics). */
export function svg(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.svg, args); }

// ============================================================
// 自己終了タグファクトリ関数（13個）
// ============================================================

/**
 * Creates a `<br>` element (line break).
 *
 * @returns A new SelfClosingType instance representing a `<br>` element
 *
 * @example
 * ```typescript
 * const lineBreak = br();
 * // Renders as: <br>
 * ```
 */
export function br(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.br); }

/**
 * Creates an `<hr>` element (thematic break / horizontal rule).
 *
 * @returns A new SelfClosingType instance representing an `<hr>` element
 *
 * @example
 * ```typescript
 * const separator = hr();
 * // Renders as: <hr>
 * ```
 */
export function hr(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.hr); }

/**
 * Creates an `<img>` element (image).
 *
 * @param attrs - Optional attributes (typically includes `src` and `alt`)
 * @returns A new SelfClosingType instance representing an `<img>` element
 *
 * @example
 * ```typescript
 * const image = img({ src: 'photo.jpg', alt: 'My photo' });
 * // Renders as: <img src="photo.jpg" alt="My photo">
 * ```
 */
export function img(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.img, attrs); }

/**
 * Creates an `<input>` element (form input control).
 *
 * @param attrs - Optional attributes (e.g., `type`, `name`, `value`, `placeholder`)
 * @returns A new SelfClosingType instance representing an `<input>` element
 *
 * @example
 * ```typescript
 * const textInput = input({ type: 'text', placeholder: 'Enter name' });
 * const checkbox = input({ type: 'checkbox', checked: true });
 * ```
 */
export function input(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.input, attrs); }

/**
 * Creates a `<meta>` element (metadata).
 *
 * @param attrs - Optional attributes (e.g., `charset`, `name`, `content`)
 * @returns A new SelfClosingType instance representing a `<meta>` element
 *
 * @example
 * ```typescript
 * const charset = meta({ charset: 'utf-8' });
 * const viewport = meta({ name: 'viewport', content: 'width=device-width' });
 * ```
 */
export function meta(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.meta, attrs); }

/**
 * Creates a `<link>` element (external resource link, typically CSS).
 *
 * @param attrs - Optional attributes (e.g., `rel`, `href`, `type`)
 * @returns A new SelfClosingType instance representing a `<link>` element
 *
 * @example
 * ```typescript
 * const stylesheet = link({ rel: 'stylesheet', href: 'styles.css' });
 * const icon = link({ rel: 'icon', href: 'favicon.ico' });
 * ```
 */
export function link(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.link, attrs); }

/**
 * Creates a `<source>` element (media source for `<video>`, `<audio>`, or `<picture>`).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `media`)
 * @returns A new SelfClosingType instance representing a `<source>` element
 *
 * @example
 * ```typescript
 * const videoSource = source({ src: 'video.mp4', type: 'video/mp4' });
 * ```
 */
export function source(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.source, attrs); }

/**
 * Creates a `<track>` element (text track for media elements).
 *
 * @param attrs - Optional attributes (e.g., `kind`, `src`, `srclang`, `label`)
 * @returns A new SelfClosingType instance representing a `<track>` element
 *
 * @example
 * ```typescript
 * const subtitles = track({ kind: 'subtitles', src: 'subs.vtt', srclang: 'en' });
 * ```
 */
export function track(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.track, attrs); }

/**
 * Creates an `<area>` element (clickable area in an image map).
 *
 * @param attrs - Optional attributes (e.g., `shape`, `coords`, `href`, `alt`)
 * @returns A new SelfClosingType instance representing an `<area>` element
 */
export function area(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.area, attrs); }

/**
 * Creates a `<col>` element (table column definition).
 *
 * @param attrs - Optional attributes (e.g., `span`)
 * @returns A new SelfClosingType instance representing a `<col>` element
 */
export function col(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.col, attrs); }

/**
 * Creates a `<base>` element (base URL for relative URLs).
 *
 * @param attrs - Optional attributes (e.g., `href`, `target`)
 * @returns A new SelfClosingType instance representing a `<base>` element
 *
 * @example
 * ```typescript
 * const baseUrl = base({ href: 'https://example.com/' });
 * ```
 */
export function base(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.base, attrs); }

/**
 * Creates an `<embed>` element (embedded external content).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `width`, `height`)
 * @returns A new SelfClosingType instance representing an `<embed>` element
 */
export function embed(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.embed, attrs); }

/**
 * Creates a `<wbr>` element (word break opportunity).
 *
 * @returns A new SelfClosingType instance representing a `<wbr>` element
 *
 * @example
 * ```typescript
 * const longUrl = p('https://very', wbr(), 'long', wbr(), 'url.com');
 * ```
 */
export function wbr(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.wbr); }

// ============================================================
// テキストファクトリ関数
// ============================================================

/**
 * Creates a text node.
 *
 * Text nodes are usually created automatically when passing strings to tag factories,
 * but this function can be used for explicit text node creation.
 *
 * @param content - The text content (not HTML-escaped)
 * @returns A new TextType instance
 *
 * @example
 * ```typescript
 * // Explicit text node creation
 * const text = Text('Hello World');
 *
 * // Usually, strings are auto-converted:
 * const paragraph = p('This is automatically wrapped in TextType');
 * ```
 *
 * @remarks
 * **Warning:** Text content is **not** HTML-escaped. Ensure user input is sanitized
 * before passing to this function to prevent XSS attacks.
 */
export function Text(content: string): TextType {
  return new TextType(content, { escape: true });
}

/**
 * Creates an **unescaped** text node. HTML content is rendered as-is.
 *
 * **WARNING: This is unsafe for user input.** Only use for trusted content
 * such as code examples or pre-rendered HTML. For user input, use `Text()` instead.
 *
 * @param content - Raw HTML/text content (NOT escaped)
 * @returns A new TextType instance without HTML escaping
 *
 * @example
 * ```typescript
 * // Code example in <pre><code> — needs raw HTML
 * pre(code(Text.unsafeRaw('<div class="card">Hello</div>')))
 *
 * // NEVER do this with user input:
 * // Text.unsafeRaw(userInput) ← XSS vulnerability!
 * ```
 */
Text.unsafeRaw = function unsafeRaw(content: string): TextType {
  return new TextType(content);
};
