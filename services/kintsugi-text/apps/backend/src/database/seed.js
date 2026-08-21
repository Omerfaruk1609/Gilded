import { DatabaseService } from './db.js';

console.log('🌱 KintsugiText Database Seeding Script Initialized...');
const db = DatabaseService.getInstance();
db.seed();
console.log('✨ Seeding process completed successfully!');
