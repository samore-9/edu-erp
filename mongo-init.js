// mongo-init.js — Run once on first container start to create the DB and user
db = db.getSiblingDB('college_erp');

db.createUser({
  user: 'erp_user',
  pwd: 'erp_pass_change_me',
  roles: [{ role: 'readWrite', db: 'college_erp' }],
});

// Create initial indexes (Mongoose will also do this, but explicit is better)
db.createCollection('users');
db.createCollection('students');
db.createCollection('attendances');
db.createCollection('fees');

print('✅ MongoDB college_erp database initialized');
