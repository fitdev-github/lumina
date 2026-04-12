import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from './config'

// Collections
const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  DEBTS: 'debts',
}

// ============== USERS ==============

export async function createUser(userId, userData) {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getUser(userId) {
  const docRef = doc(db, COLLECTIONS.USERS, userId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export async function updateUser(userId, data) {
  await setDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// ============== TRANSACTIONS ==============

export async function addTransaction(userId, transactionData) {
  const transactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS)
  const docRef = await addDoc(transactionsRef, {
    ...transactionData,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTransactions(userId, limitCount = 50) {
  const transactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS)
  const q = query(transactionsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.slice(0, limitCount).map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeToTransactions(userId, callback) {
  const transactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS)
  const q = query(transactionsRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(transactions)
  })
}

export async function deleteTransaction(userId, transactionId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS, transactionId))
}

// ============== GOALS ==============

export async function addGoal(userId, goalData) {
  const goalsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS)
  const docRef = await addDoc(goalsRef, {
    ...goalData,
    currentAmount: goalData.currentAmount || 0,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getGoals(userId) {
  const goalsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS)
  const q = query(goalsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeToGoals(userId, callback) {
  const goalsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS)
  const q = query(goalsRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(goals)
  })
}

export async function updateGoal(userId, goalId, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS, goalId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGoal(userId, goalId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS, goalId))
}

// ============== BUDGETS ==============

export async function setBudget(userId, month, budgetData) {
  await setDoc(
    doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.BUDGETS, month),
    {
      ...budgetData,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function getBudget(userId, month) {
  const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.BUDGETS, month)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export async function getBudgets(userId) {
  const budgetsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.BUDGETS)
  const snapshot = await getDocs(budgetsRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// ============== DEBTS ==============

export async function addDebt(userId, debtData) {
  const debtsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.DEBTS)
  const docRef = await addDoc(debtsRef, {
    ...debtData,
    originalBalance: debtData.balance, // track for progress calculation
    isPaidOff: false,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getDebts(userId) {
  const debtsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.DEBTS)
  const snapshot = await getDocs(debtsRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeToDebts(userId, callback) {
  const debtsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.DEBTS)
  return onSnapshot(debtsRef, (snapshot) => {
    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(debts)
  })
}

export async function updateDebt(userId, debtId, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.DEBTS, debtId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDebt(userId, debtId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.DEBTS, debtId))
}

// ============== ACCOUNTS ==============

const ACCOUNTS_COLLECTION = 'accounts'

export async function addAccount(userId, accountData) {
  const accountsRef = collection(db, COLLECTIONS.USERS, userId, ACCOUNTS_COLLECTION)
  const docRef = await addDoc(accountsRef, {
    ...accountData,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export function subscribeToAccounts(userId, callback) {
  const accountsRef = collection(db, COLLECTIONS.USERS, userId, ACCOUNTS_COLLECTION)
  const q = query(accountsRef, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(accounts)
  })
}

export async function updateAccount(userId, accountId, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, ACCOUNTS_COLLECTION, accountId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAccount(userId, accountId) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, ACCOUNTS_COLLECTION, accountId))
}

export { COLLECTIONS }

// ============== FIXED EXPENSES ==============

const FIXED_EXPENSES_COLLECTION = 'fixed_expenses'

export async function addFixedExpense(userId, data) {
  const ref = collection(db, COLLECTIONS.USERS, userId, FIXED_EXPENSES_COLLECTION)
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export function subscribeToFixedExpenses(userId, callback) {
  const ref = collection(db, COLLECTIONS.USERS, userId, FIXED_EXPENSES_COLLECTION)
  const q = query(ref, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  })
}

export async function updateFixedExpense(userId, id, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, FIXED_EXPENSES_COLLECTION, id), {
    ...data, updatedAt: serverTimestamp(),
  })
}

export async function deleteFixedExpense(userId, id) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, FIXED_EXPENSES_COLLECTION, id))
}

// ============== MONTHLY CHECKLIST ==============

const CHECKLIST_COLLECTION = 'monthly_checklists'

export async function getOrCreateMonthlyChecklist(userId, month, fixedExpenses, monthlySalary) {
  const ref = doc(db, COLLECTIONS.USERS, userId, CHECKLIST_COLLECTION, month)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const existing = snap.data()
    const validFixedIds = new Set((fixedExpenses || []).map(e => e.id))

    // Remove items whose fixed expense was deleted (keep salary + items without fixedExpenseId)
    const filtered = existing.items.filter(item =>
      item.id === 'salary' || !item.fixedExpenseId || validFixedIds.has(item.fixedExpenseId)
    )

    // Add new fixed expenses not yet in the checklist
    const existingFixedIds = new Set(filtered.map(i => i.fixedExpenseId).filter(Boolean))
    const newItems = (fixedExpenses || [])
      .filter(e => !existingFixedIds.has(e.id))
      .map(e => ({
        id: e.id,
        type: e.category === 'savings' ? 'savings' : 'expense',
        name: e.name,
        amount: e.amount || 0,
        category: e.category || 'other',
        dueDay: e.dueDay || 1,
        fixedExpenseId: e.id,
        status: 'pending',
        doneAt: null,
        accountId: null,
      }))

    const hasChanges = filtered.length !== existing.items.length || newItems.length > 0
    if (hasChanges) {
      const merged = [...filtered, ...newItems].sort((a, b) => a.dueDay - b.dueDay)
      await updateDoc(ref, { items: merged })
    }

    return { id: snap.id, ...existing }
  }

  const items = []
  if (monthlySalary > 0) {
    items.push({
      id: 'salary',
      type: 'income',
      name: 'เงินเดือน',
      amount: monthlySalary,
      category: 'salary',
      dueDay: 1,
      status: 'pending',
      doneAt: null,
      accountId: null,
    })
  }
  ;(fixedExpenses || []).forEach(e => {
    items.push({
      id: e.id,
      type: e.category === 'savings' ? 'savings' : 'expense',
      name: e.name,
      amount: e.amount || 0,
      category: e.category || 'other',
      dueDay: e.dueDay || 1,
      fixedExpenseId: e.id,
      status: 'pending',
      doneAt: null,
      accountId: null,
    })
  })
  items.sort((a, b) => a.dueDay - b.dueDay)

  const data = { month, items, createdAt: serverTimestamp() }
  await setDoc(ref, data)
  return { id: month, ...data }
}

export function subscribeToMonthlyChecklist(userId, month, callback) {
  const ref = doc(db, COLLECTIONS.USERS, userId, CHECKLIST_COLLECTION, month)
  return onSnapshot(ref, snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function updateChecklistItem(userId, month, itemId, updates) {
  const ref = doc(db, COLLECTIONS.USERS, userId, CHECKLIST_COLLECTION, month)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const items = snap.data().items.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  )
  await updateDoc(ref, { items, updatedAt: serverTimestamp() })
}

// ============== CRYPTO HOLDINGS ==============

const CRYPTO_COLLECTION = 'crypto_holdings'

export async function addCryptoHolding(userId, data) {
  const ref = collection(db, COLLECTIONS.USERS, userId, CRYPTO_COLLECTION)
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export function subscribeToCryptoHoldings(userId, callback) {
  const ref = collection(db, COLLECTIONS.USERS, userId, CRYPTO_COLLECTION)
  const q = query(ref, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  })
}

export async function updateCryptoHolding(userId, id, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, CRYPTO_COLLECTION, id), {
    ...data, updatedAt: serverTimestamp(),
  })
}

export async function deleteCryptoHolding(userId, id) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, CRYPTO_COLLECTION, id))
}

// ============== LENT MONEY (เพื่อนยืมเงิน) ==============

const LENT_MONEY_COLLECTION = 'lent_money'

export async function addLentMoney(userId, data) {
  const ref = collection(db, COLLECTIONS.USERS, userId, LENT_MONEY_COLLECTION)
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export function subscribeToLentMoney(userId, callback) {
  const ref = collection(db, COLLECTIONS.USERS, userId, LENT_MONEY_COLLECTION)
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  })
}

export async function updateLentMoney(userId, id, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId, LENT_MONEY_COLLECTION, id), {
    ...data, updatedAt: serverTimestamp(),
  })
}

export async function deleteLentMoney(userId, id) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, LENT_MONEY_COLLECTION, id))
}

// ============== GMAIL IMPORTS (deduplication) ==============

const GMAIL_IMPORTS_COLLECTION = 'gmail_imports'

export async function getImportedGmailIds(userId) {
  const ref = collection(db, COLLECTIONS.USERS, userId, GMAIL_IMPORTS_COLLECTION)
  const snapshot = await getDocs(ref)
  return new Set(snapshot.docs.map(d => d.id))
}

export async function batchImportGmailTransactions(userId, items) {
  // items: Array<{ transaction, gmailMessageId, subject }>
  // Each item = 2 Firestore writes → chunk at 249 items (498 writes < 500 limit)
  const CHUNK_SIZE = 249
  const transactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS)
  const importsRef = collection(db, COLLECTIONS.USERS, userId, GMAIL_IMPORTS_COLLECTION)

  const createdIds = []

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE)
    const batch = writeBatch(db)

    for (const { transaction, gmailMessageId, subject } of chunk) {
      // Create transaction document with pre-generated ID
      const transRef = doc(transactionsRef)
      batch.set(transRef, {
        ...transaction,
        source: 'gmail',
        createdAt: serverTimestamp(),
      })
      createdIds.push(transRef.id)

      // Track the imported Gmail message ID
      const importRef = doc(importsRef, gmailMessageId)
      batch.set(importRef, {
        gmailMessageId,
        importedAt: serverTimestamp(),
        amount: transaction.amount,
        type: transaction.type,
        subject: subject || '',
        transactionId: transRef.id,
      })
    }

    await batch.commit()
  }

  return createdIds
}
