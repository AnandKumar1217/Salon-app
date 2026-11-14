import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/glamora';
const dbName = process.env.MONGODB_DB_NAME || 'glamora';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

let prodClientPromise: Promise<MongoClient> | null = null;

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(uri, mongoOptions);
  return client.connect().catch((err) => {
    // Clear promises on rejection so subsequent calls can retry if network recovers
    if (typeof global !== 'undefined') {
      global._mongoClientPromise = undefined;
    }
    prodClientPromise = null;
    throw err;
  });
}

export function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClientPromise();
    }
    return global._mongoClientPromise;
  }
  if (!prodClientPromise) {
    prodClientPromise = createClientPromise();
  }
  return prodClientPromise;
}

/**
 * Returns the active MongoDB Database instance
 */
export async function getDatabase(): Promise<Db> {
  const clientPromise = getClientPromise();
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export default getClientPromise;
