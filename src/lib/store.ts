import fs from 'fs/promises';
import path from 'path';
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

// ─── Data Directory ──────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = 'users.json';
const CONVERSATIONS_FILE = 'conversations.json';

// Simple in-memory lock to prevent concurrent writes to the same file
const fileLocks = new Map<string, Promise<void>>();

async function withFileLock<T>(filename: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock on this file
  while (fileLocks.has(filename)) {
    await fileLocks.get(filename);
  }

  let resolve: () => void;
  const lockPromise = new Promise<void>((r) => {
    resolve = r;
  });
  fileLocks.set(filename, lockPromise);

  try {
    return await fn();
  } finally {
    fileLocks.delete(filename);
    resolve!();
  }
}

// ─── Core File Operations ────────────────────────────────────────────────────

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJSON<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error: unknown) {
    // File doesn't exist or is invalid — return empty array
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.tmp`;
  try {
    // Write to temp file first, then rename for atomicity
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    // Clean up temp file if rename failed
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

// ─── User Operations ─────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await readJSON<User>(USERS_FILE);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readJSON<User>(USERS_FILE);
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  return withFileLock(USERS_FILE, async () => {
    const users = await readJSON<User>(USERS_FILE);

    // Check for duplicate email
    const existing = users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
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

    users.push(newUser);
    await writeJSON(USERS_FILE, users);
    return newUser;
  });
}

// ─── Conversation Operations ─────────────────────────────────────────────────

export async function getConversations(userId: string): Promise<Omit<Conversation, 'messages'>[]> {
  const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);
  return conversations
    .filter((c) => c.userId === userId)
    .map(({ messages: _messages, ...rest }) => rest)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);
  return conversations.find((c) => c.id === id) ?? null;
}

export async function createConversation(
  userId: string,
  title: string,
  model: string
): Promise<Conversation> {
  return withFileLock(CONVERSATIONS_FILE, async () => {
    const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);

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

    conversations.push(newConversation);
    await writeJSON(CONVERSATIONS_FILE, conversations);
    return newConversation;
  });
}

export async function updateConversation(
  id: string,
  data: Partial<Pick<Conversation, 'title' | 'model'>>
): Promise<Conversation | null> {
  return withFileLock(CONVERSATIONS_FILE, async () => {
    const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);
    const index = conversations.findIndex((c) => c.id === id);
    if (index === -1) return null;

    conversations[index] = {
      ...conversations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await writeJSON(CONVERSATIONS_FILE, conversations);
    return conversations[index];
  });
}

export async function deleteConversation(id: string): Promise<boolean> {
  return withFileLock(CONVERSATIONS_FILE, async () => {
    const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);
    const index = conversations.findIndex((c) => c.id === id);
    if (index === -1) return false;

    conversations.splice(index, 1);
    await writeJSON(CONVERSATIONS_FILE, conversations);
    return true;
  });
}

export async function addMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message | null> {
  return withFileLock(CONVERSATIONS_FILE, async () => {
    const conversations = await readJSON<Conversation>(CONVERSATIONS_FILE);
    const index = conversations.findIndex((c) => c.id === conversationId);
    if (index === -1) return null;

    const newMessage: Message = {
      id: uuidv4(),
      ...message,
      timestamp: new Date().toISOString(),
    };

    conversations[index].messages.push(newMessage);
    conversations[index].updatedAt = new Date().toISOString();
    await writeJSON(CONVERSATIONS_FILE, conversations);
    return newMessage;
  });
}
