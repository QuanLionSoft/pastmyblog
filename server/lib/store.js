import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSeedData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Basit, dosya tabanlı bir JSON "veritabanı".
 * - İlk açılışta dosya yoksa örnek (seed) verilerle oluşturulur.
 * - Yazma işlemleri disk I/O'sunu azaltmak için 250ms geciktirilir (debounce).
 */
class Store {
  constructor() {
    this.data = null;
    this._saveTimer = null;
    this.load();
  }

  load() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        // Eksik alanları tamamla (şema güncellemelerine karşı dayanıklılık)
        this.data.posts ??= [];
        this.data.comments ??= [];
        this.data.messages ??= [];
        this.data.subscribers ??= [];
        this.data.settings ??= {};
        return;
      } catch (err) {
        console.error('[store] db.json okunamadı, seed verisiyle yeniden oluşturuluyor:', err.message);
      }
    }
    this.data = createSeedData();
    this.saveNow();
    console.log('[store] Veritabanı ilk kez oluşturuldu ve örnek içerikle dolduruldu.');
  }

  saveNow() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  }

  save() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        this.saveNow();
      } catch (err) {
        console.error('[store] Kaydetme hatası:', err.message);
      }
    }, 250);
  }

  // ---- Yardımcılar ----
  get posts() {
    return this.data.posts;
  }
  get comments() {
    return this.data.comments;
  }
  get messages() {
    return this.data.messages;
  }
  get subscribers() {
    return this.data.subscribers;
  }
  get settings() {
    return this.data.settings;
  }

  nextId(prefix, items) {
    let max = 0;
    for (const it of items) {
      const n = parseInt(String(it.id).replace(prefix, ''), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${max + 1}`;
  }
}

export const store = new Store();
