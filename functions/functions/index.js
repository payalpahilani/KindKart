const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Notify users when a new campaign is created
exports.notifyNewCampaign = functions.firestore
  .document('campaigns/{campaignId}')
  .onCreate(async (snap, context) => {
    const campaign = snap.data();

    const usersSnapshot = await db.collection('users')
      .where('notificationSettings.turnOnNotifications', '==', true)
      .get();

    const tokens = [];
    usersSnapshot.forEach((doc) => {
      const settings = doc.data().notificationSettings;
      if (settings?.newCampaignAlert && doc.data().fcmToken) {
        tokens.push(doc.data().fcmToken);
      }
    });

    if (tokens.length === 0) return null;

    const message = {
      notification: {
        title: 'New Campaign Alert!',
        body: `A new campaign "${campaign.title}" has been added. Check it out!`,
      },
      tokens,
      data: {
        campaignId: context.params.campaignId,
        type: 'newCampaignAlert',
      },
    };

    return messaging.sendMulticast(message);
  });

// Donation Reminder notification trigger
exports.notifyDonationReminder = functions.firestore
  .document('donations/{donationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'pending_reminder' && after.status === 'pending_reminder') {
      const userDoc = await db.collection('users').doc(after.userId).get();
      const user = userDoc.data();

      if (!user?.notificationSettings?.turnOnNotifications || !user.fcmToken) {
        return null;
      }

      const message = {
        notification: {
          title: 'Donation Reminder',
          body: 'You have a pending donation. Please complete it soon!',
        },
        token: user.fcmToken,
        data: {
          donationId: context.params.donationId,
          type: 'donationReminder',
        },
      };

      return messaging.send(message);
    }
    return null;
  });

// Thank You message trigger
exports.notifyThankYou = functions.firestore
  .document('donations/{donationId}')
  .onCreate(async (snap, context) => {
    const donation = snap.data();

    const userDoc = await db.collection('users').doc(donation.userId).get();
    const user = userDoc.data();

    if (!user?.notificationSettings?.turnOnNotifications || !user.fcmToken) {
      return null;
    }

    const message = {
      notification: {
        title: 'Thank You!',
        body: 'Thank you for your generous donation!',
      },
      token: user.fcmToken,
      data: {
        donationId: context.params.donationId,
        type: 'thankYou',
      },
    };

    return messaging.send(message);
  });

// Milestone Update notification trigger
exports.notifyMilestoneUpdate = functions.firestore
  .document('milestones/{milestoneId}')
  .onCreate(async (snap, context) => {
    const milestone = snap.data();

    const usersSnapshot = await db.collection('users')
      .where('notificationSettings.turnOnNotifications', '==', true)
      .get();

    const tokens = [];
    usersSnapshot.forEach((doc) => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });

    if (tokens.length === 0) return null;

    const message = {
      notification: {
        title: 'Milestone Achieved!',
        body: `A new milestone "${milestone.title}" has been reached.`,
      },
      tokens,
      data: {
        milestoneId: context.params.milestoneId,
        type: 'milestoneUpdate',
      },
    };

    return messaging.sendMulticast(message);
  });

// New NGO Partner notification trigger
exports.notifyNewNgoPartner = functions.firestore
  .document('ngoPartners/{ngoId}')
  .onCreate(async (snap, context) => {
    const ngo = snap.data();

    const usersSnapshot = await db.collection('users')
      .where('notificationSettings.turnOnNotifications', '==', true)
      .get();

    const tokens = [];
    usersSnapshot.forEach((doc) => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });

    if (tokens.length === 0) return null;

    const message = {
      notification: {
        title: 'New NGO Partner!',
        body: `We partnered with "${ngo.name}" to serve the community better.`,
      },
      tokens,
      data: {
        ngoId: context.params.ngoId,
        type: 'newNgoPartner',
      },
    };

    return messaging.sendMulticast(message);
  });

// Message from user notification trigger
exports.notifyMessageFromUser = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();

    const recipientId = message.recipientId;

    if (!recipientId) return null;

    const recipientDoc = await db.collection('users').doc(recipientId).get();
    const recipient = recipientDoc.data();

    if (!recipient?.notificationSettings?.turnOnNotifications || !recipient.fcmToken) {
      return null;
    }

    const msgBody = message.text || 'You have a new message';

    const fcmMessage = {
      notification: {
        title: 'New Message',
        body: msgBody,
      },
      token: recipient.fcmToken,
      data: {
        messageId: context.params.messageId,
        type: 'newMessage',
      },
    };

    return messaging.send(fcmMessage);
  });
