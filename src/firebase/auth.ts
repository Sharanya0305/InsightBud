'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

/**
 * Initiates email/password sign-up (non-blocking).
 * This function returns a Promise that resolves on successful user creation
 * or rejects on failure.
 */
export async function signUpWithEmail(auth: Auth, email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Initiates email/password sign-in (non-blocking).
 * This function returns a Promise that resolves on successful sign-in
 * or rejects on failure.
 */
export async function signInWithEmail(auth: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs the current user out.
 * Returns a Promise that resolves when sign-out is complete.
 */
export async function logout(auth: Auth) {
  return signOut(auth);
}
