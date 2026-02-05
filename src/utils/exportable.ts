export class ExportableError extends Error {
  constructor(
    public readonly code: 'INVALID_PATH' | 'WRITE_FAILED',
    message?: string,
  ) {
    super(message ?? (code === 'INVALID_PATH' ? '無効なパスです。' : 'ファイルの書き込みに失敗しました。'));
    this.name = 'ExportableError';
  }
}

export interface Exportable {
  readonly content: string;
  export(fileName: string, path?: string): void;
}
