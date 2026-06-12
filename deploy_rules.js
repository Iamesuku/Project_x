/**
 * Deploy Firestore Security Rules via Firebase Management REST API
 * Run: node deploy_rules.js
 * 
 * Requires: VITE_FIREBASE_PROJECT_ID in .env.local
 * Uses the firebase-tools CLI which should already be installed.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Read project ID from .env.local
const env = readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) acc[key.trim()] = rest.join('=').trim();
  return acc;
}, {});

const projectId = env.VITE_FIREBASE_PROJECT_ID;
console.log('Project ID:', projectId);

// The new security rules
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users — any authenticated user can read; only owner can write their profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Jobs — any authenticated user can read; creator (clientId) can update/delete
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.clientId;
    }

    // Proposals — anyone logged in can create; client or freelancer can read/update
    match /proposals/{proposalId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.freelancerId ||
        request.auth.uid == resource.data.clientId
      );
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.clientId ||
        request.auth.uid == resource.data.freelancerId
      );
    }

    // Wallets — owner only
    match /wallets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Contracts — client or freelancer can read/write
    match /contracts/{contractId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.clientId ||
        request.auth.uid == resource.data.freelancerId
      );
      allow create: if request.auth != null;
    }

    // Threads and messages — any authenticated user
    match /threads/{threadId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // Notifications — any authenticated user
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }

    // Reviews
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.reviewerId;
    }

    // Disputes
    match /disputes/{disputeId} {
      allow read, write: if request.auth != null;
    }

    // Admin bypass — isAdmin users can do anything
    match /{document=**} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}`;

// Write rules to firestore.rules file
writeFileSync('firestore.rules', rules);
console.log('Written firestore.rules');

// Create/update firebase.json if needed
let firebaseJson = {};
try {
  firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf-8'));
} catch(e) {
  // doesn't exist yet
}

firebaseJson.firestore = {
  rules: 'firestore.rules'
};
writeFileSync('firebase.json', JSON.stringify(firebaseJson, null, 2));
console.log('Written firebase.json');

// Deploy using firebase-tools CLI (should already be in node_modules or globally available)
try {
  console.log('Deploying Firestore rules...');
  const result = execSync(`npx firebase-tools deploy --only firestore:rules --project ${projectId} --non-interactive`, {
    encoding: 'utf-8',
    timeout: 60000
  });
  console.log(result);
  console.log('SUCCESS: Rules deployed!');
} catch (e) {
  console.error('Deploy error:', e.stdout || e.message);
  console.log('\nAlternative: Please go to https://console.firebase.google.com/project/' + projectId + '/firestore/databases/-default-/rules and paste the contents of firestore.rules manually.');
}
