// import cron from 'node-cron';
// import { autoCancelNoShowBookings, deleteTodayCancelledBookings } from '../controllers/Booking.js';

// // Configuration
// const AUTO_CANCEL_SCHEDULE = '*/5 * * * *'; // Run every 5 minutes
// const CLEANUP_SCHEDULE = '0 21 * * *'; // Run daily at 9:00 PM (21:00)
// const ENABLE_AUTO_CANCEL = true; // Set to false to disable auto-cancel
// const ENABLE_CLEANUP = true; // Set to false to disable cleanup

// // Auto-cancel no-show bookings cron job
// // Runs every 5 minutes to check for bookings that should be cancelled
// if (ENABLE_AUTO_CANCEL) {
//     cron.schedule(AUTO_CANCEL_SCHEDULE, async () => {
//         const now = new Date();
//         const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        
//         // console.log(`\n[CRON] Running auto-cancel job at ${istTime.toLocaleString('en-IN')}`);
        
//         const result = await autoCancelNoShowBookings();
        
//         if (result.success) {
//             if (result.cancelledCount > 0) {
//                 console.log(`[CRON] ✅ Auto-cancelled ${result.cancelledCount} booking(s)`);
//             } else {
//                 console.log('[CRON] ℹ️  No bookings to cancel');
//             }
//         } else {
//             console.error(`[CRON] ❌ Error: ${result.error}`);
//         }
//     });

//     console.log('✅ Auto-cancel cron job initialized - Runs every 5 minutes');
//     console.log('📋 Grace period: 10 minutes after booking start time');
//     console.log('🔧 To disable: Set ENABLE_AUTO_CANCEL = false in utils/cronJobs.js\n');
// } else {
//     console.log('⚠️  Auto-cancel cron job is DISABLED');
// }

// // Delete today's cancelled bookings cron job
// // Runs daily at 9:00 PM to clean up cancelled bookings
// if (ENABLE_CLEANUP) {
//     cron.schedule(CLEANUP_SCHEDULE, async () => {
//         const now = new Date();
//         const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        
//         console.log(`\n[CRON] Running cleanup job at ${istTime.toLocaleString('en-IN')}`);
        
//         const result = await deleteTodayCancelledBookings();
        
//         if (result.success) {
//             if (result.deletedCount > 0) {
//                 console.log(`[CRON] 🗑️  Deleted ${result.deletedCount} cancelled booking(s)`);
//             } else {
//                 console.log('[CRON] ℹ️  No cancelled bookings to delete');
//             }
//         } else {
//             console.error(`[CRON] ❌ Error: ${result.error}`);
//         }
//     });

//     console.log('✅ Cleanup cron job initialized - Runs daily at 9:00 PM');
//     console.log('🗑️  Deletes all today\'s cancelled bookings');
//     console.log('🔧 To disable: Set ENABLE_CLEANUP = false in utils/cronJobs.js\n');
// } else {
//     console.log('⚠️  Cleanup cron job is DISABLED');
// }

// export default cron;
