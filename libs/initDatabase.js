const { MongoClient } = require('mongodb');

module.exports.initDatabase = async function initDatabase(
  host,
  port,
  name,
  opts
) {
  console.log('Connect to database...');
  const client = await MongoClient.connect(
    `mongodb://${host}:${port}/${name}`,
    {
      ...opts,
      useUnifiedTopology: true
    }
  );
  console.log('Database connected');

  return client;
};
