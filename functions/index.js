// ─── Cloud Functions for My To-Do List ──────────────────────────────
// This file runs on Firebase's servers (not in the browser).
// It checks everyone's upcoming events every morning and sends
// push notifications to remind them.

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

// Connect to Firestore and Firebase Messaging on the server side
admin.initializeApp();
const db = admin.firestore();

// ─── Scheduled function: runs every day at 9:00 AM ──────────────────
// The schedule uses cron format: '0 9 * * *' means "at 9:00 every day"
exports.sendEventReminders = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'America/New_York' },
  async () => {

    // Get today's date at midnight so we can compare whole days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get every user stored in Firestore
    const usersSnapshot = await db.collection('users').get();

    // Check each user's events in parallel (Promise.all = run all at once)
    const promises = [];
    usersSnapshot.forEach((userDoc) => {
      promises.push(checkUserEvents(userDoc.id, today));
    });

    await Promise.all(promises);
    console.log('Event reminder check complete.');
  }
);

// ─── Check one user's events and send notifications if needed ────────
async function checkUserEvents(uid, today) {

  // Get the FCM tokens saved for this user.
  // Each device (phone, laptop) saves its own token when the user
  // first opens the app and allows notifications.
  const userDoc   = await db.collection('users').doc(uid).get();
  const fcmTokens = userDoc.data()?.fcmTokens || [];

  // If this user has no tokens, they haven't enabled notifications — skip them
  if (fcmTokens.length === 0) return;

  // Get all this user's events
  const eventsSnapshot = await db
    .collection('users').doc(uid).collection('events').get();

  if (eventsSnapshot.empty) return;

  const notificationPromises = [];

  eventsSnapshot.forEach((eventDoc) => {
    const { name, date } = eventDoc.data();

    // Calculate how many days until this event
    const eventDate = new Date(date + 'T00:00:00');
    const daysUntil = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));

    // Only notify if the event is in exactly 7, 3, or 1 day(s)
    if (![7, 3, 1].includes(daysUntil)) return;

    // Write a helpful message based on how close the event is
    let title, body;
    if (daysUntil === 1) {
      title = `Tomorrow: ${name}`;
      body  = `Don't forget — ${name} is tomorrow!`;
    } else {
      title = `${name} is coming up`;
      body  = `${name} is in ${daysUntil} days.`;
    }

    // Send the notification to all of this user's devices
    const message = {
      notification: { title, body },
      tokens: fcmTokens,   // can be multiple devices
    };

    notificationPromises.push(
      admin.messaging().sendEachForMulticast(message)
    );
  });

  await Promise.all(notificationPromises);
}
