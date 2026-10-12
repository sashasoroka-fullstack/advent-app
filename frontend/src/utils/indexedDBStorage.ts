const DB_NAME = "QuestThemeStorage";
const DB_VERSION = 1;
const STORE_NAME = "themes";
interface ThemeData {
    config: string;
    backgroundBlob?: Blob;
    mapBlob?: Blob;
}
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}
function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
export async function saveThemeToIndexedDB(themeName: string, config: unknown, backgroundDataURL?: string, mapDataURL?: string): Promise<void> {
    const db = await openDB();
    const themeData: ThemeData = {
        config: JSON.stringify(config),
    };
    if (backgroundDataURL) {
        themeData.backgroundBlob = dataURLtoBlob(backgroundDataURL);
    }
    if (mapDataURL) {
        themeData.mapBlob = dataURLtoBlob(mapDataURL);
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(themeData, themeName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
export async function loadThemeFromIndexedDB(themeName: string): Promise<{
    config: unknown;
    backgroundDataURL?: string;
    mapDataURL?: string;
} | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(themeName);
        request.onsuccess = async () => {
            const themeData = request.result as ThemeData | undefined;
            if (!themeData) {
                resolve(null);
                return;
            }
            const result: {
                config: unknown;
                backgroundDataURL?: string;
                mapDataURL?: string;
            } = {
                config: JSON.parse(themeData.config),
            };
            if (themeData.backgroundBlob) {
                result.backgroundDataURL = await blobToDataURL(themeData.backgroundBlob);
            }
            if (themeData.mapBlob) {
                result.mapDataURL = await blobToDataURL(themeData.mapBlob);
            }
            resolve(result);
        };
        request.onerror = () => reject(request.error);
    });
}
export async function themeExistsInIndexedDB(themeName: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(themeName);
        request.onsuccess = () => {
            resolve(request.result !== undefined);
        };
        request.onerror = () => reject(request.error);
    });
}
export async function deleteThemeFromIndexedDB(themeName: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(themeName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
export async function getAllThemeNamesFromIndexedDB(): Promise<string[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        request.onsuccess = () => {
            const keys = request.result as string[];
            resolve(keys);
        };
        request.onerror = () => reject(request.error);
    });
}
