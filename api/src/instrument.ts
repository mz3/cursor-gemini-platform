import * as Sentry from "@sentry/node";

// Disable Sentry for local development
if (process.env.NODE_ENV === 'development') {
  // console.log('Sentry disabled for local development'); // Removed to reduce console noise
} else {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "https://f82f1699af07069af82167a32b2500ac@o4509857517731841.ingest.us.sentry.io/4509857533132800",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Performance Monitoring - Very low sampling to avoid spam
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.01,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Disable debug mode to reduce log spam
    debug: false,

    // Filter out noisy operations
    beforeSend(event) {
      // Filter out Redis polling operations
      if (event.spans) {
        event.spans = event.spans.filter(span => {
          // Filter out Redis RPOP operations which are just polling
          if (span.op === 'redis' && span.description?.includes('RPOP')) {
            return false;
          }
          // Filter out Redis operations in general to reduce noise
          if (span.op === 'redis') {
            return false;
          }
          return true;
        });
      }

      // Filter out transactions that are just Redis polling
      if (event.transaction && event.transaction.includes('redis-RPOP')) {
        return null;
      }

      // Filter out Redis-related transactions
      if (event.transaction && event.transaction.includes('redis')) {
        return null;
      }

      return event;
    },
  });
}
