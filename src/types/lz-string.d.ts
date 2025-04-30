declare module 'lz-string' {
  export function compress(input: string): string;
  export function compressToUTF16(input: string): string;
  export function compressToUTF8(input: string): string;
  export function compressToBase64(input: string): string;
  export function compressToEncodedURIComponent(input: string): string;
  
  export function decompress(input: string): string | null;
  export function decompressFromUTF16(input: string): string | null;
  export function decompressFromUTF8(input: string): string | null;
  export function decompressFromBase64(input: string): string | null;
  export function decompressFromEncodedURIComponent(input: string): string | null;
}