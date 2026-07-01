const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => {
    console.log('✅ Connexion réussie !');
    return client.end();
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
  });