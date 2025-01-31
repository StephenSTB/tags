export function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
}

export const zeroAddress: string = "0x0000000000000000000000000000000000000000";