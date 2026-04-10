import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  increment
} from 'firebase/firestore'
import { db } from '@/firebase/config'

const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations'
}

export async function createConversation(userId) {
  const conversationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS)
  const docRef = await addDoc(conversationsRef, {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    title: 'การสนทนาใหม่',
    messageCount: 0
  })
  return docRef.id
}

export async function getConversations(userId) {
  const conversationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS)
  const q = query(conversationsRef, orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeToConversations(userId, callback) {
  const conversationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS)
  const q = query(conversationsRef, orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(conversations)
  })
}

export async function getConversation(userId, conversationId) {
  const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export async function addMessage(userId, conversationId, message) {
  const messagesRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId, 'messages')
  const messageData = {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp()
  }
  
  const messageDoc = await addDoc(messagesRef, messageData)
  
  const conversationRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId)
  await updateDoc(conversationRef, {
    updatedAt: serverTimestamp(),
    lastMessage: message.content.substring(0, 100),
    messageCount: increment(1)
  })
  
  return messageDoc.id
}

export async function getMessages(userId, conversationId, messageLimit = 50) {
  const messagesRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(messageLimit))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeToMessages(userId, conversationId, callback, messageLimit = 50) {
  const messagesRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(messageLimit))
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(messages)
  })
}

export async function deleteConversation(userId, conversationId) {
  const conversationRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId)
  await deleteDoc(conversationRef)
}

export async function updateConversationTitle(userId, conversationId, title) {
  const conversationRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CONVERSATIONS, conversationId)
  await updateDoc(conversationRef, {
    title,
    updatedAt: serverTimestamp()
  })
}

export default {
  createConversation,
  getConversations,
  subscribeToConversations,
  getConversation,
  addMessage,
  getMessages,
  subscribeToMessages,
  deleteConversation,
  updateConversationTitle
}
