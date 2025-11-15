import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, lastLoginMethodClient } from 'better-auth/client/plugins';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7001';

export const authClient = createAuthClient({
  user: {
    additionalFields: {
      isOnboarded: {
        type: 'boolean',
        required: false,
        default: false,
      },
    },
  },
  baseURL,
  plugins: [emailOTPClient(), lastLoginMethodClient()],
});
