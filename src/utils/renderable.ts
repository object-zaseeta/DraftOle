/**
 * Represents an object that can be rendered to a string representation.
 *
 * This interface corresponds to the Swift Renderable protocol and serves as
 * the foundation for all elements that can produce string output (e.g., HTML, CSS).
 *
 * @example
 * ```typescript
 * class MyElement implements Renderable {
 *   render(): string {
 *     return '<div>Hello</div>';
 *   }
 * }
 *
 * const element = new MyElement();
 * console.log(element.render()); // '<div>Hello</div>'
 * ```
 */
export interface Renderable {
  /**
   * Renders the object to its string representation.
   *
   * @returns The string representation of the object
   */
  render(): string;
}

/**
 * Represents an object that can be exported to a file.
 *
 * This interface is used by publishers and other components that need to
 * write content to the filesystem. It provides both the content to export
 * and the method to perform the export operation.
 *
 * @example
 * ```typescript
 * class HtmlDocument implements Exportable {
 *   readonly content: string;
 *
 *   constructor(html: string) {
 *     this.content = html;
 *   }
 *
 *   exportTo(fileName: string, path?: string): void {
 *     // Export logic here
 *   }
 * }
 *
 * const doc = new HtmlDocument('<html>...</html>');
 * doc.exportTo('index.html', './dist');
 * ```
 */
export interface Exportable {
  /**
   * The content to be exported.
   *
   * This property holds the string content that will be written to the file.
   */
  readonly content: string;

  /**
   * Exports the content to a file.
   *
   * @param fileName - The name of the file to create
   * @param path - Optional directory path where the file should be created.
   *               If not provided, the file is created in the current directory.
   *
   * @throws {ExportableError} When the export operation fails
   */
  exportTo(fileName: string, path?: string): void;
}
