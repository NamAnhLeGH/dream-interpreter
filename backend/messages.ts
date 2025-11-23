// User-facing messages - all strings stored here
// Attribution: Created with assistance from ChatGPT

export const messages = {
  // Authentication
  auth: {
    register: {
      success: 'Registration successful! Please login.',
      failed: 'Registration failed. Please try again.',
      emailRequired: 'Email address is required',
      passwordRequired: 'Password is required',
      firstNameRequired: 'First name is required',
      emailInvalid: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 3 characters',
      emailTaken: 'This email is already taken. Please choose another.',
      passwordsMismatch: 'Passwords do not match'
    },
    login: {
      success: 'Login successful',
      failed: 'Login failed. Please try again.',
      invalidCredentials: 'Invalid email or password. Please try again.',
      emailRequired: 'Email address is required',
      passwordRequired: 'Password is required'
    },
    logout: {
      success: 'Logged out successfully'
    },
    forgotPassword: {
      success: 'If that email exists, a reset link has been sent.',
      emailRequired: 'Email address is required'
    },
    resetPassword: {
      success: 'Password reset successful! Please login with your new password.',
      failed: 'Failed to reset password',
      tokenRequired: 'Token and new password are required',
      tokenInvalid: 'Invalid or expired reset token'
    }
  },

  // Dreams
  dreams: {
    interpret: {
      textRequired: 'Dream text is required',
      textTooShort: 'Please describe your dream (minimum 10 characters)',
      textTooLong: 'Dream description is too long. Please keep it under 5000 characters.',
      modelsLoading: 'AI models are still loading. Please try again in a moment.',
      failed: 'Failed to interpret dream. Please try again.',
      apiLimitReached: 'You have reached your free API call limit (20). Service will continue with a warning.',
      apiLimitWarning: 'You have used {used} of 20 free API calls. {remaining} remaining.'
    },
    get: {
      notFound: 'Dream not found',
      failed: 'Failed to fetch dream'
    },
    history: {
      failed: 'Failed to fetch dream history'
    },
    stats: {
      failed: 'Failed to fetch statistics',
      userNotFound: 'User not found'
    },
    update: {
      success: 'Dream updated successfully',
      failed: 'Failed to update dream',
      notFound: 'Dream not found',
      textRequired: 'Dream text is required',
      textTooShort: 'Please describe your dream (minimum 10 characters)',
      textTooLong: 'Dream description is too long. Please keep it under 5000 characters.'
    },
    delete: {
      success: 'Dream deleted successfully',
      failed: 'Failed to delete dream',
      notFound: 'Dream not found'
    }
  },

  // Admin
  admin: {
    accessDenied: 'Access denied. Admin privileges required.',
    users: {
      failed: 'Failed to fetch users'
    },
    analytics: {
      failed: 'Failed to fetch analytics'
    },
    userDetails: {
      failed: 'Failed to fetch user details',
      notFound: 'User not found'
    },
    recentActivity: {
      failed: 'Failed to fetch recent activity'
    }
  },

  // General
  general: {
    authenticationRequired: 'Authentication required.',
    invalidToken: 'Invalid token. Please login again.',
    tokenExpired: 'Token expired. Please login again.',
    noToken: 'No token provided. Please login to access this resource.',
    endpointNotFound: 'Endpoint not found',
    internalError: 'Internal server error',
    somethingWentWrong: 'Something went wrong',
    validationError: 'Validation error',
    numberRequired: 'A valid number is required'
  }
};

