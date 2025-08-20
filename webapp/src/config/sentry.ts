import * as Sentry from '@sentry/react';
import React from 'react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const NODE_ENV = import.meta.env.MODE;

// Check if Sentry should be enabled
const isSentryEnabled = SENTRY_DSN && NODE_ENV !== 'development';

export function initializeSentry() {
  if (!isSentryEnabled) {
    // console.log('Sentry disabled for local development or missing DSN'); // Removed to reduce console noise
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      // Set a uniform sample rate of 25% for transactions
      tracesSampleRate: NODE_ENV === 'production' ? 0.25 : 1.0,
      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
      // If you're not already sampling the entire session, change the sample rate to 100% when
      // sampling sessions where errors occur.
      replaysOnErrorSampleRate: 1.0,
      // Capture all errors
      beforeSend(event) {
        // Filter out certain errors if needed
        if (event.exception) {
          const exception = event.exception.values?.[0];
          if (exception?.type === 'ChunkLoadError') {
            // Don't send chunk load errors to Sentry
            return null;
          }
        }
        return event;
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (!isSentryEnabled) return;

  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!isSentryEnabled) return;

  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (!isSentryEnabled) return;

  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  if (!isSentryEnabled) return;

  Sentry.setTag(key, value);
}

export function setContext(name: string, context: Record<string, any>) {
  if (!isSentryEnabled) return;

  Sentry.setContext(name, context);
}

// Create a fallback component for when Sentry is disabled
const DisabledErrorBoundary: React.FC<{ children: React.ReactNode; fallback: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

// Create a Sentry Error Boundary component that works even when Sentry is disabled
export const SentryErrorBoundary = isSentryEnabled ? Sentry.ErrorBoundary : DisabledErrorBoundary;
