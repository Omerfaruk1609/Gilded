import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE_PATH = path.join(__dirname, 'kintsugi_db.json');
const SEED_FILE_PATH = path.join(__dirname, 'seed.json');

const DEFAULT_TENANT = {
  id: 'tenant_gilded_default',
  name: 'Gilded Ecosystem Platform',
  plan: 'ENTERPRISE',
  rateLimitRpm: 1000,
  dailyQuota: 100000,
  isActive: true,
  createdAt: new Date().toISOString()
};

const DEFAULT_API_KEY = {
  id: 'key_dev_default',
  tenantId: 'tenant_gilded_default',
  key: 'kt_live_dev_key',
  prefix: 'kt_live_dev',
  name: 'Playground & Development Key',
  isActive: true,
  createdAt: new Date().toISOString()
};

const GILDED_PROD_API_KEY = {
  id: 'key_gilded_prod',
  tenantId: 'tenant_gilded_default',
  key: 'kt_live_gilded_space_key_2026',
  prefix: 'kt_live_gilded',
  name: 'Gilded Space Production Key',
  isActive: true,
  createdAt: new Date().toISOString()
};

export class DatabaseService {
  static instance;
  db = { rules: [], analysis_logs: [], tenants: [], api_keys: [] };

  constructor() {
    this.init();
  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.db = JSON.parse(fileData);
        this.ensureDefaultTenantAndKey();
      } else {
        this.seed();
      }
    } catch (err) {
      console.error('Database initialization error, falling back to seed:', err);
      this.seed();
    }
  }

  ensureDefaultTenantAndKey() {
    if (!this.db.tenants) this.db.tenants = [];
    if (!this.db.api_keys) this.db.api_keys = [];

    let hasDefaultTenant = this.db.tenants.some(t => t.id === DEFAULT_TENANT.id);
    if (!hasDefaultTenant) {
      this.db.tenants.push(DEFAULT_TENANT);
    }

    let hasDefaultKey = this.db.api_keys.some(k => k.key === DEFAULT_API_KEY.key);
    if (!hasDefaultKey) {
      this.db.api_keys.push(DEFAULT_API_KEY);
    }

    let hasGildedProdKey = this.db.api_keys.some(k => k.key === GILDED_PROD_API_KEY.key);
    if (!hasGildedProdKey) {
      this.db.api_keys.push(GILDED_PROD_API_KEY);
    }

    this.persist();
  }

  seed() {
    if (fs.existsSync(SEED_FILE_PATH)) {
      const seedData = JSON.parse(fs.readFileSync(SEED_FILE_PATH, 'utf-8'));
      this.db.rules = (seedData.rules || []).map((r) => ({
        ...r,
        created_at: r.created_at || new Date().toISOString()
      }));
      this.db.analysis_logs = [];
      this.db.tenants = [DEFAULT_TENANT];
      this.db.api_keys = [DEFAULT_API_KEY, GILDED_PROD_API_KEY];
      this.persist();
      console.log(`✅ Database successfully seeded with ${this.db.rules.length} rules and default tenant!`);
    } else {
      console.warn('⚠️ seed.json file not found, creating empty database with default tenant.');
      this.db = { rules: [], analysis_logs: [], tenants: [DEFAULT_TENANT], api_keys: [DEFAULT_API_KEY, GILDED_PROD_API_KEY] };
      this.persist();
    }
  }

  persist() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  getApiKey(rawKey) {
    if (!rawKey || !this.db.api_keys) return null;
    const keyInfo = this.db.api_keys.find(k => k.key === rawKey && k.isActive !== false);
    if (!keyInfo) return null;

    const tenant = this.getTenant(keyInfo.tenantId);
    if (!tenant || tenant.isActive === false) return null;

    return {
      keyInfo,
      tenant
    };
  }

  getTenant(tenantId) {
    if (!tenantId || !this.db.tenants) return null;
    return this.db.tenants.find(t => t.id === tenantId) || null;
  }

  getRules() {
    return this.db.rules.filter((r) => r.is_active);
  }

  getAllRules() {
    return this.db.rules;
  }

  addRule(ruleData) {
    const newRule = {
      id: ruleData.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pattern: ruleData.pattern,
      category: String(ruleData.category).toUpperCase(),
      action: ruleData.action || 'block',
      severity: Number(ruleData.severity || 3),
      score: Number(ruleData.score !== undefined ? ruleData.score : 0.85),
      isRegex: ruleData.isRegex !== undefined ? Boolean(ruleData.isRegex) : true,
      reason: ruleData.reason || 'Dinamik kural',
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.db.rules.push(newRule);
    this.persist();
    return newRule;
  }

  deleteRule(id) {
    const initialLength = this.db.rules.length;
    this.db.rules = this.db.rules.filter((r) => r.id !== id);
    if (this.db.rules.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }

  exportRules() {
    const activeRules = this.getRules();
    return {
      exportedAt: new Date().toISOString(),
      totalRules: activeRules.length,
      rules: activeRules.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        category: r.category.toLowerCase(),
        action: r.action || 'block',
        severity: r.severity || 3,
        score: r.score,
        isRegex: r.isRegex !== undefined ? r.isRegex : true,
        reason: r.reason
      }))
    };
  }

  importRules(importedRules, strategy = 'merge') {
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    if (strategy === 'overwrite') {
      this.db.rules = [];
    }

    for (const ruleItem of importedRules) {
      try {
        new RegExp(ruleItem.pattern);

        const categoryUpper = String(ruleItem.category).toUpperCase();
        const existingIndex = this.db.rules.findIndex(
          (r) => r.pattern === ruleItem.pattern && r.category === categoryUpper
        );

        if (existingIndex !== -1 && strategy === 'merge') {
          this.db.rules[existingIndex] = {
            ...this.db.rules[existingIndex],
            action: ruleItem.action || this.db.rules[existingIndex].action || 'block',
            severity: Number(ruleItem.severity || this.db.rules[existingIndex].severity || 3),
            score: Number(ruleItem.score !== undefined ? ruleItem.score : (this.db.rules[existingIndex].score || 0.85)),
            isRegex: ruleItem.isRegex !== undefined ? Boolean(ruleItem.isRegex) : true,
            reason: ruleItem.reason || this.db.rules[existingIndex].reason,
            is_active: true
          };
          importedCount++;
        } else {
          this.db.rules.push({
            id: ruleItem.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            pattern: ruleItem.pattern,
            category: categoryUpper,
            action: ruleItem.action || 'block',
            severity: Number(ruleItem.severity || 3),
            score: Number(ruleItem.score !== undefined ? ruleItem.score : 0.85),
            isRegex: ruleItem.isRegex !== undefined ? Boolean(ruleItem.isRegex) : true,
            reason: ruleItem.reason || 'İçe aktarılan kural',
            is_active: true,
            created_at: new Date().toISOString()
          });
          importedCount++;
        }
      } catch (err) {
        console.error(`Invalid rule pattern skipped during import: ${ruleItem.pattern}`, err);
        failedCount++;
      }
    }

    this.persist();
    return { importedCount, skippedCount, failedCount };
  }

  addLog(log) {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.db.analysis_logs.unshift(newLog);
    if (this.db.analysis_logs.length > 500) {
      this.db.analysis_logs = this.db.analysis_logs.slice(0, 500);
    }
    this.persist();
    return newLog;
  }

  getLogs(limit = 50) {
    return this.db.analysis_logs.slice(0, limit);
  }
}
