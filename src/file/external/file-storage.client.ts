export abstract class FileStorageClient {
  abstract upload(key: string, body: Buffer, mimeType: string): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract copy(sourceKey: string, destKey: string): Promise<void>;
  abstract getSignedUrl(key: string): Promise<string>;
}
