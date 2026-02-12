'use client';

// Re-export the initialization function from a neutral module.
// This allows server-side code to import it from './init' as well.
export { initializeFirebase } from './init';

// Export all the client-side hooks, providers, and utilities.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
