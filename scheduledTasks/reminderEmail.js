const cron = require('node-cron');
const sgMail = require('@sendgrid/mail');
const db = require('../db'); // Import your database library

// Schedule a task to run daily at 8am
const reminderEmailTask = cron.schedule('0 8 * * *', async () => { // minute, hour, day of month, month, day of week
    try {
        console.log('Scheduled task started');
        // Get rentals due today from the database
        const rentalsDueToday = await db.getRentalsDueToday(); // Implement this function in your database library
        // Send reminder emails for each rental due today
        for (const rental of rentalsDueToday) {
            if (rental.rental_status === 'out') {
                const msg = {
                    to: rental.email,
                    from: 'ebracy@ramapo.edu', // Change to your verified sender
                    subject: 'Reminder: Your Rental is Due Today',
                    text: `Dear ${rental.first_name}, your rental is due today. Please return the equipment as soon as possible.`,
                    html: `<p>Dear ${rental.first_name},</p><p>Your rental is due today. Please return the equipment as soon as possible.</p>`,
                };
                //await sgMail.send(msg);
                console.log(`Reminder email sent to ${rental.email}`);
            }
        }
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
});

module.exports = reminderEmailTask;