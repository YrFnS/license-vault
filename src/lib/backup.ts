import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'db', 'custom.db');

export async function createDatabaseBackup(): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `license-vault-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Check if DB file exists
    if (!fs.existsSync(DB_PATH)) {
      return { success: false, error: 'Database file not found at ' + DB_PATH };
    }

    // Copy SQLite database file
    fs.copyFileSync(DB_PATH, backupPath);

    // Keep only last 10 backups
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length > 10) {
      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(path.join(BACKUP_DIR, files[i]));
      }
    }

    return { success: true, filePath: backupPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown backup error';
    return { success: false, error: message };
  }
}

export function listBackups(): Array<{
  fileName: string;
  size: number;
  createdAt: Date;
}> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .sort()
    .reverse()
    .map((fileName) => {
      const filePath = path.join(BACKUP_DIR, fileName);
      const stats = fs.statSync(filePath);
      return {
        fileName,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
