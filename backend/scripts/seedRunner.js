const { memoryStore, isSupabaseConfigured } = require('../config/db');

console.log('🌱 SQMS Seed Runner invoked.');
console.log(`Current Mode: ${isSupabaseConfigured ? 'Supabase Active' : 'In-Memory Demo Active'}`);
console.log(`Default Demo Users count: ${memoryStore.users.length}`);
console.log(`Default Departments count: ${memoryStore.departments.length}`);
console.log(`Default Doctors count: ${memoryStore.doctors.length}`);
console.log(`Default Patients count: ${memoryStore.patients.length}`);
console.log(`Default Queue tokens count: ${memoryStore.queue.length}`);
console.log('✅ Seed verification complete.');
