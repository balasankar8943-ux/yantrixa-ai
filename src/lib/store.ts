import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  settings: {
    theme: 'dark' | 'light' | 'system';
    defaultModel: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; type: string; url: string }[];
  model?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── MongoDB Connection ────────────────────────────────────────────────────────

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MONGODB_URI to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

async function getCollections() {
  const mongoClient = await clientPromise;
  const db = mongoClient.db('yantrixa-ai');
  return {
    users: db.collection<User>('users'),
    conversations: db.collection<Conversation>('conversations'),
  };
}

// ─── User Operations ─────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const { users } = await getCollections();
  return users.findOne({ email: email.toLowerCase() });
}

export async function getUserById(id: string): Promise<User | null> {
  const { users } = await getCollections();
  return users.findOne({ id });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const { users } = await getCollections();

  // Check for duplicate email
  const existing = await users.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new Error('Email already exists');
  }

  const newUser: User = {
    id: uuidv4(),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
    settings: {
      theme: 'system',
      defaultModel: 'gemini-2.5-flash',
    },
  };

  await users.insertOne(newUser);
  return newUser;
}

// ─── Conversation Operations ─────────────────────────────────────────────────

export async function getConversations(userId: string): Promise<Omit<Conversation, 'messages'>[]> {
  const { conversations } = await getCollections();
  const list = await conversations
    .find({ userId })
    .project<Omit<Conversation, 'messages'>>({ messages: 0 })
    .toArray();
  
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { conversations } = await getCollections();
  return conversations.findOne({ id });
}

export async function createConversation(
  userId: string,
  title: string,
  model: string
): Promise<Conversation> {
  const { conversations } = await getCollections();

  const now = new Date().toISOString();
  const newConversation: Conversation = {
    id: uuidv4(),
    userId,
    title,
    model,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await conversations.insertOne(newConversation);
  return newConversation;
}

export async function updateConversation(
  id: string,
  data: Partial<Pick<Conversation, 'title' | 'model'>>
): Promise<Conversation | null> {
  const { conversations } = await getCollections();
  const now = new Date().toISOString();

  await conversations.updateOne(
    { id },
    {
      $set: {
        ...data,
        updatedAt: now,
      },
    }
  );

  return conversations.findOne({ id });
}

export async function deleteConversation(id: string): Promise<boolean> {
  const { conversations } = await getCollections();
  const result = await conversations.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function addMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message | null> {
  const { conversations } = await getCollections();
  
  const newMessage: Message = {
    id: uuidv4(),
    ...message,
    timestamp: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  const result = await conversations.updateOne(
    { id: conversationId },
    {
      $push: { messages: newMessage },
      $set: { updatedAt: now },
    }
  );

  if (result.matchedCount === 0) return null;
  return newMessage;
}
