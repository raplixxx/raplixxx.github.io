/**
 * js/firestore.js
 * Operasi Firestore: sesi chat, pesan, dan share chat publik.
 * Struktur path mengikuti spesifikasi:
 *   chats/{uniqueLinkId}/sessions/{sessionId}/messages
 *   shared_chats/{shareId}
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./auth.js";
import { generateUUID } from "./ui.js";

// ---------------------------------------------------------------------------
// Sesi Chat
// ---------------------------------------------------------------------------

/** Membuat sesi chat baru, mengembalikan sessionId. */
export async function createSession(uniqueLinkId, title = "Percakapan Baru") {
  const sessionsRef = collection(db, "chats", uniqueLinkId, "sessions");
  const newSessionRef = doc(sessionsRef);
  await setDoc(newSessionRef, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newSessionRef.id;
}

/** Ambil daftar sesi milik pengguna, terbaru dulu. */
export async function listSessions(uniqueLinkId) {
  const sessionsRef = collection(db, "chats", uniqueLinkId, "sessions");
  const q = query(sessionsRef, orderBy("updatedAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Perbarui judul & timestamp sesi (dipanggil setelah pesan baru terkirim). */
export async function touchSession(uniqueLinkId, sessionId, title) {
  const sessionRef = doc(db, "chats", uniqueLinkId, "sessions", sessionId);
  const payload = { updatedAt: serverTimestamp() };
  if (title) payload.title = title;
  await setDoc(sessionRef, payload, { merge: true });
}

/** Hapus sesi beserta seluruh pesannya. */
export async function deleteSession(uniqueLinkId, sessionId) {
  const messagesRef = collection(db, "chats", uniqueLinkId, "sessions", sessionId, "messages");
  const snap = await getDocs(messagesRef);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const sessionRef = doc(db, "chats", uniqueLinkId, "sessions", sessionId);
  await deleteDoc(sessionRef);
}

// ---------------------------------------------------------------------------
// Pesan
// ---------------------------------------------------------------------------

/**
 * Simpan satu pesan ke sesi.
 * @param {object} message { role: 'user'|'assistant', content, imageUrl?, sources?, docName? }
 */
export async function addMessage(uniqueLinkId, sessionId, message) {
  const messagesRef = collection(db, "chats", uniqueLinkId, "sessions", sessionId, "messages");
  const docRef = await addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
  await touchSession(uniqueLinkId, sessionId);
  return docRef.id;
}

/** Ambil seluruh pesan dalam sebuah sesi, urut kronologis. */
export async function listMessages(uniqueLinkId, sessionId) {
  const messagesRef = collection(db, "chats", uniqueLinkId, "sessions", sessionId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------------------------------------------------------------------------
// Share Chat (publik, read-only)
// ---------------------------------------------------------------------------

/**
 * Salin sesi chat saat ini ke shared_chats/{shareId} agar bisa dibaca publik.
 * @returns {string} shareId
 */
export async function shareChatSession(uniqueLinkId, sessionId, ownerName) {
  const messages = await listMessages(uniqueLinkId, sessionId);
  const sessionSnap = await getDoc(doc(db, "chats", uniqueLinkId, "sessions", sessionId));
  const sessionData = sessionSnap.exists() ? sessionSnap.data() : {};

  const shareId = generateUUID();
  const shareRef = doc(db, "shared_chats", shareId);

  // Bersihkan field yang tidak perlu / tidak aman untuk publik
  const publicMessages = messages.map((m) => ({
    role: m.role,
    content: m.content || "",
    imageUrl: m.imageUrl || null,
    docName: m.docName || null,
    sources: m.sources || null,
    createdAt: m.createdAt || null,
  }));

  await setDoc(shareRef, {
    title: sessionData.title || "Percakapan Vesta AI",
    ownerName: ownerName || "Pengguna",
    messages: publicMessages,
    sharedAt: serverTimestamp(),
  });

  return shareId;
}

/** Ambil data chat publik untuk halaman shared.html */
export async function getSharedChat(shareId) {
  const shareRef = doc(db, "shared_chats", shareId);
  const snap = await getDoc(shareRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
