// src/api/audioStorage.js
import { openDB } from 'idb';

const DB_NAME = 'verse-app-db';
const STORE_NAME = 'recordings';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
};

export const saveRecording = async (verseId, blob) => {
    const db = await initDB();
    await db.put(STORE_NAME, blob, verseId);
};

export const getRecording = async (verseId) => {
    const db = await initDB();
    return await db.get(STORE_NAME, verseId);
};

export const deleteRecording = async (verseId) => {
    const db = await initDB();
    await db.delete(STORE_NAME, verseId);
};

export const getAllRecordings = async () => {
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_NAME);
    const values = await db.getAll(STORE_NAME);
    const recordings = {};
    keys.forEach((key, index) => {
        recordings[key] = values[index];
    });
    return recordings;
};

export const clearAllRecordings = async () => {
    const db = await initDB();
    await db.clear(STORE_NAME);
};