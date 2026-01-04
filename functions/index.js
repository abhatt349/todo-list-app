/**
 * Firebase Cloud Functions for Todo List Notifications
 *
 * This file contains placeholder functions for sending email and SMS notifications.
 *
 * SETUP REQUIRED:
 *
 * 1. EMAIL NOTIFICATIONS (using Nodemailer with Gmail or SMTP):
 *    - Set up Firebase Functions environment config:
 *      firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-password"
 *    - For Gmail, use an App Password (not your regular password):
 *      https://support.google.com/accounts/answer/185833
 *
 * 2. SMS NOTIFICATIONS (using Twilio):
 *    - Create a Twilio account at https://www.twilio.com/
 *    - Get your Account SID, Auth Token, and a Twilio phone number
 *    - Set up Firebase Functions environment config:
 *      firebase functions:config:set twilio.account_sid="ACxxxx" twilio.auth_token="your-token" twilio.phone_number="+1234567890"
 *    - Install Twilio SDK: npm install twilio
 *
 * 3. Deploy functions:
 *    firebase deploy --only functions
 *
 * 4. Set up a scheduled function or use Firestore triggers to check for pending notifications
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ============================================
// EMAIL NOTIFICATION FUNCTIONS
// ============================================

/**
 * Create email transporter using Gmail or SMTP
 * Configure with: firebase functions:config:set email.user="..." email.pass="..."
 */
function createEmailTransporter() {
    const emailConfig = functions.config().email || {};

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });
}

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 */
async function sendEmail(to, subject, body) {
    const transporter = createEmailTransporter();

    const mailOptions = {
        from: functions.config().email?.user || 'noreply@todolist.app',
        to: to,
        subject: subject,
        text: body
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// SMS NOTIFICATION FUNCTIONS (TWILIO)
// ============================================

/**
 * TWILIO SETUP INSTRUCTIONS:
 *
 * 1. Sign up for a Twilio account: https://www.twilio.com/try-twilio
 *
 * 2. Get your credentials from the Twilio Console:
 *    - Account SID (starts with "AC")
 *    - Auth Token
 *    - Buy a phone number (or use the trial number)
 *
 * 3. Install Twilio SDK in the functions folder:
 *    cd functions && npm install twilio
 *
 * 4. Set Firebase Functions config:
 *    firebase functions:config:set twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *    firebase functions:config:set twilio.auth_token="your_auth_token"
 *    firebase functions:config:set twilio.phone_number="+1234567890"
 *
 * 5. Uncomment the Twilio import and implementation below
 */

// Uncomment after installing twilio: npm install twilio
// const twilio = require('twilio');

/**
 * Create Twilio client
 * Configure with: firebase functions:config:set twilio.account_sid="..." twilio.auth_token="..."
 */
function createTwilioClient() {
    const twilioConfig = functions.config().twilio || {};

    if (!twilioConfig.account_sid || !twilioConfig.auth_token) {
        throw new Error('Twilio credentials not configured. Run: firebase functions:config:set twilio.account_sid="..." twilio.auth_token="..."');
    }

    // Uncomment after installing twilio
    // return twilio(twilioConfig.account_sid, twilioConfig.auth_token);

    // Placeholder - remove this when Twilio is configured
    return null;
}

/**
 * Send an SMS notification using Twilio
 * @param {string} to - Recipient phone number (E.164 format, e.g., +1234567890)
 * @param {string} message - SMS message body (max 1600 characters)
 * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
 */
async function sendSms(to, message) {
    try {
        const twilioConfig = functions.config().twilio || {};
        const client = createTwilioClient();

        if (!client) {
            console.log('[PLACEHOLDER] SMS would be sent to:', to);
            console.log('[PLACEHOLDER] Message:', message);
            return {
                success: false,
                error: 'Twilio not configured. See setup instructions in functions/index.js'
            };
        }

        // Uncomment after installing twilio and configuring credentials
        /*
        const result = await client.messages.create({
            body: message,
            from: twilioConfig.phone_number,
            to: to
        });

        console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
        return { success: true, messageSid: result.sid };
        */

        return { success: false, error: 'Twilio implementation not enabled' };
    } catch (error) {
        console.error('Error sending SMS:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// SCHEDULED NOTIFICATION CHECKER
// ============================================

/**
 * Check for pending notifications and send them
 * This function runs every minute to check for scheduled notifications
 *
 * Deploy with: firebase deploy --only functions:checkScheduledNotifications
 */
exports.checkScheduledNotifications = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
        const now = Date.now();

        try {
            // Get all todos with scheduled notifications that are due
            const todosSnapshot = await db.collection('todos')
                .where('deleted', '==', false)
                .get();

            const batch = db.batch();
            let notificationsSent = 0;

            for (const todoDoc of todosSnapshot.docs) {
                const todo = todoDoc.data();
                const todoRef = db.collection('todos').doc(todoDoc.id);

                // Check email notifications
                if (todo.scheduledNotifications && todo.scheduledNotifications.length > 0) {
                    const updatedNotifications = [];

                    for (const notification of todo.scheduledNotifications) {
                        if (notification.time <= now && !notification.sent) {
                            // Get user's email addresses
                            const userDoc = await db.collection('users').doc(todo.userId).get();
                            const userData = userDoc.data();
                            const emails = userData?.emails || [];

                            // Send email to all registered addresses
                            for (const email of emails) {
                                await sendEmail(
                                    email,
                                    `Todo Reminder: ${todo.text}`,
                                    notification.message || `Reminder: ${todo.text}`
                                );
                            }

                            // Mark as sent
                            notification.sent = true;
                            notificationsSent++;
                        }
                        updatedNotifications.push(notification);
                    }

                    batch.update(todoRef, { scheduledNotifications: updatedNotifications });
                }

                // Check SMS notifications
                if (todo.scheduledSms && todo.scheduledSms.length > 0) {
                    const updatedSms = [];

                    for (const sms of todo.scheduledSms) {
                        if (sms.time <= now && !sms.sent) {
                            // Get user's phone numbers
                            const userDoc = await db.collection('users').doc(todo.userId).get();
                            const userData = userDoc.data();
                            const phoneNumbers = userData?.phoneNumbers || [];

                            // Send SMS to all registered phone numbers
                            for (const phone of phoneNumbers) {
                                await sendSms(
                                    phone,
                                    sms.message || `Reminder: ${todo.text}`
                                );
                            }

                            // Mark as sent
                            sms.sent = true;
                            notificationsSent++;
                        }
                        updatedSms.push(sms);
                    }

                    batch.update(todoRef, { scheduledSms: updatedSms });
                }
            }

            await batch.commit();
            console.log(`Processed notifications. Sent: ${notificationsSent}`);

            return null;
        } catch (error) {
            console.error('Error checking scheduled notifications:', error);
            return null;
        }
    });

// ============================================
// HTTP CALLABLE FUNCTIONS (for testing)
// ============================================

/**
 * Test function to send an SMS (for debugging)
 * Call via Firebase SDK: firebase.functions().httpsCallable('testSendSms')({ to, message })
 */
exports.testSendSms = functions.https.onCall(async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { to, message } = data;

    if (!to || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing "to" or "message"');
    }

    return await sendSms(to, message);
});

/**
 * Test function to send an email (for debugging)
 * Call via Firebase SDK: firebase.functions().httpsCallable('testSendEmail')({ to, subject, body })
 */
exports.testSendEmail = functions.https.onCall(async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { to, subject, body } = data;

    if (!to || !subject || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    return await sendEmail(to, subject, body);
});
