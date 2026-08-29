import fs from 'fs';
import path from 'path';

export function resolveDataDir(): string {
  const currentDirData = path.join(process.cwd(), 'data');
  if (fs.existsSync(currentDirData)) {
    return currentDirData;
  }
  const parentDirData = path.join(process.cwd(), '..', 'data');
  if (fs.existsSync(parentDirData)) {
    return parentDirData;
  }
  // If neither exists, create current directory's data folder
  try {
    fs.mkdirSync(currentDirData, { recursive: true });
    return currentDirData;
  } catch {
    return currentDirData;
  }
}

export function resolveDataFilePath(filename: string): string {
  const dataDir = resolveDataDir();
  return path.join(dataDir, filename);
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = resolveDataFilePath(filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
  return fallback;
}

export function writeJsonFile<T>(filename: string, data: T): void {
  try {
    const dataDir = resolveDataDir();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, filename);
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    throw err;
  }
}
