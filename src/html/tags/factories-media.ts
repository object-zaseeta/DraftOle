/**
 * factories-media.ts
 *
 * メディア・自己終了タグ・テキストファクトリ関数:
 * ペアタグ: video, audio, picture, canvas, svg
 * 自己終了タグ: br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr
 * テキスト: Text (Text.unsafeRaw を含む)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 4.2, 4.4, 6.1, 6.3
 */
import { TextType } from '../elements/text-type.js';
import { makePairFactory, makeSelfClosingFactory } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── メディア ──

/** Creates a `<video>` element (video player). */
export const video = makePairFactory(TAG_TYPES.video);

/** Creates an `<audio>` element (audio player). */
export const audio = makePairFactory(TAG_TYPES.audio);

/** Creates a `<picture>` element (responsive image container). */
export const picture = makePairFactory(TAG_TYPES.picture);

/** Creates a `<canvas>` element (scriptable graphics). */
export const canvas = makePairFactory(TAG_TYPES.canvas);

/** Creates an `<svg>` element (scalable vector graphics). */
export const svg = makePairFactory(TAG_TYPES.svg);

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
export const br = makeSelfClosingFactory(TAG_TYPES.br);

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
export const hr = makeSelfClosingFactory(TAG_TYPES.hr);

/**
 * Creates an `<img>` element (image).
 *
 * @param attrs - Optional attributes (typically includes `src` and `alt`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing an `<img>` element
 *
 * @example
 * ```typescript
 * const image = img({ src: 'photo.jpg', alt: 'My photo' });
 * // Renders as: <img src="photo.jpg" alt="My photo">
 * ```
 */
export const img = makeSelfClosingFactory(TAG_TYPES.img);

/**
 * Creates an `<input>` element (form input control).
 *
 * @param attrs - Optional attributes (e.g., `type`, `name`, `value`, `placeholder`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing an `<input>` element
 *
 * @example
 * ```typescript
 * const textInput = input({ type: 'text', placeholder: 'Enter name' });
 * const checkbox = input({ type: 'checkbox', checked: true });
 * ```
 */
export const input = makeSelfClosingFactory(TAG_TYPES.input);

/**
 * Creates a `<meta>` element (metadata).
 *
 * @param attrs - Optional attributes (e.g., `charset`, `name`, `content`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<meta>` element
 *
 * @example
 * ```typescript
 * const charset = meta({ charset: 'utf-8' });
 * const viewport = meta({ name: 'viewport', content: 'width=device-width' });
 * ```
 */
export const meta = makeSelfClosingFactory(TAG_TYPES.meta);

/**
 * Creates a `<link>` element (external resource link, typically CSS).
 *
 * @param attrs - Optional attributes (e.g., `rel`, `href`, `type`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<link>` element
 *
 * @example
 * ```typescript
 * const stylesheet = link({ rel: 'stylesheet', href: 'styles.css' });
 * const icon = link({ rel: 'icon', href: 'favicon.ico' });
 * ```
 */
export const link = makeSelfClosingFactory(TAG_TYPES.link);

/**
 * Creates a `<source>` element (media source for `<video>`, `<audio>`, or `<picture>`).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `media`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<source>` element
 *
 * @example
 * ```typescript
 * const videoSource = source({ src: 'video.mp4', type: 'video/mp4' });
 * ```
 */
export const source = makeSelfClosingFactory(TAG_TYPES.source);

/**
 * Creates a `<track>` element (text track for media elements).
 *
 * @param attrs - Optional attributes (e.g., `kind`, `src`, `srclang`, `label`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<track>` element
 *
 * @example
 * ```typescript
 * const subtitles = track({ kind: 'subtitles', src: 'subs.vtt', srclang: 'en' });
 * ```
 */
export const track = makeSelfClosingFactory(TAG_TYPES.track);

/**
 * Creates an `<area>` element (clickable area in an image map).
 *
 * @param attrs - Optional attributes (e.g., `shape`, `coords`, `href`, `alt`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing an `<area>` element
 */
export const area = makeSelfClosingFactory(TAG_TYPES.area);

/**
 * Creates a `<col>` element (table column definition).
 *
 * @param attrs - Optional attributes (e.g., `span`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<col>` element
 */
export const col = makeSelfClosingFactory(TAG_TYPES.col);

/**
 * Creates a `<base>` element (base URL for relative URLs).
 *
 * @param attrs - Optional attributes (e.g., `href`, `target`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing a `<base>` element
 *
 * @example
 * ```typescript
 * const baseUrl = base({ href: 'https://example.com/' });
 * ```
 */
export const base = makeSelfClosingFactory(TAG_TYPES.base);

/**
 * Creates an `<embed>` element (embedded external content).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `width`, `height`)
 * @param options - Optional HtmlTagOptions (for css/jqm injection)
 * @returns A new SelfClosingType instance representing an `<embed>` element
 */
export const embed = makeSelfClosingFactory(TAG_TYPES.embed);

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
export const wbr = makeSelfClosingFactory(TAG_TYPES.wbr);

// ============================================================
// テキストファクトリ関数
// ============================================================

/**
 * Creates a text node.
 *
 * Text nodes are usually created automatically when passing strings to tag factories,
 * but this function can be used for explicit text node creation.
 *
 * @param content - The text content (HTML-escaped automatically)
 * @returns A new TextType instance
 *
 * @example
 * ```typescript
 * // Explicit text node creation
 * const text = Text('Hello <World>'); // renders: Hello &lt;World&gt;
 *
 * // Usually, strings are auto-converted:
 * const paragraph = p('This is automatically wrapped in TextType');
 * ```
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
  return new TextType(content, { escape: false });
};
