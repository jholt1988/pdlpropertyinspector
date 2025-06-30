import { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || user.emailVerified || user.provider !== 'email' || !isVisible) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await resendVerificationEmail(user.email);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Please verify your email address.</strong> We've sent a verification link to{' '}
            <span className="font-medium">{user.email}</span>. 
            {message && <span className="block mt-1 text-yellow-600">{message}</span>}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleResendEmail}
              disabled={isLoading}
              className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                  Sending...
                </div>
              ) : (
                'Resend Email'
              )}
            </button>
            <a
              href="/auth/verify-email"
              className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition"
            >
              Verification Help
            </a>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-400 hover:text-yellow-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}