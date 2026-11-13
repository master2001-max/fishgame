/**
 * CLI Tool: View Firestore Database
 *
 * Location: backend/scripts/viewDb.js
 * Usage: npm --prefix backend run db:view
 *
 * Purpose: Allows a developer or student to inspect all collections and documents
 * in Google Cloud Firestore (users, scores, gameSessions) directly from the terminal.
 */

import { getFirestore } from '../src/config/firebase.js';

async function viewDatabase() {
  console.log('\n============================================================');
  console.log('   🔥 FISH CATCHER - CLOUD FIRESTORE DATABASE VIEWER 🔥    ');
  console.log('   Project ID: fishcatcher-60484                            ');
  console.log('============================================================\n');

  try {
    const db = getFirestore();

    // 1. Inspect 'users' collection
    console.log('📁 Collection: `users`');
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
      console.log('   (No user documents found)\n');
    } else {
      const userList = [];
      usersSnap.forEach((doc) => {
        const d = doc.data();
        userList.push({
          id: doc.id,
          name: d.name || '(unnamed)',
          email: d.email || '(none)',
          score: d.score || 0,
          level: d.level || 1,
          difficulty: d.difficulty || 'Easy',
          catches: d.totalCatches || 0,
          games: d.gamesPlayed || 0,
        });
      });
      console.table(userList);
    }

    // 2. Inspect 'scores' collection (Leaderboard)
    console.log('📁 Collection: `scores` (Leaderboard)');
    const scoresSnap = await db.collection('scores').orderBy('score', 'desc').get();
    if (scoresSnap.empty) {
      console.log('   (No leaderboard documents found)\n');
    } else {
      const scoreList = [];
      let rank = 1;
      scoresSnap.forEach((doc) => {
        const d = doc.data();
        scoreList.push({
          rank: rank++,
          id: doc.id,
          name: d.name,
          score: d.score,
          difficulty: d.difficulty,
          level: d.level,
          title: d.title || 'Deckhand',
          catches: d.totalCatches,
        });
      });
      console.table(scoreList);
    }

    // 3. Inspect 'gameSessions' collection (In-progress saves)
    console.log('📁 Collection: `gameSessions` (Active Paused Missions)');
    const sessionsSnap = await db.collection('gameSessions').get();
    if (sessionsSnap.empty) {
      console.log('   (No active paused game sessions)\n');
    } else {
      const sessionList = [];
      sessionsSnap.forEach((doc) => {
        const d = doc.data();
        sessionList.push({
          userId: doc.id,
          level: d.level,
          difficulty: d.difficulty,
          score: d.score,
          catches: d.catches,
          timeLeft: `${d.timeLeft}s`,
        });
      });
      console.table(sessionList);
    }

    console.log('------------------------------------------------------------');
    console.log('🌐 View in Firebase Console GUI:');
    console.log('   https://console.firebase.google.com/project/fishcatcher-60484/firestore');
    console.log('------------------------------------------------------------\n');
  } catch (error) {
    console.error('❌ Failed to read Firestore:', error.message);
  }
}

viewDatabase();
