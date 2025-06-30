import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerificationEmail } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email') || user?.email;

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    if (!token) return;

    try {
      await verifyEmail(token);
      setVerificationStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setVerificationStatus('error');
      setError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendVerificationEmail(email);
      setResendSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const simulateVerification = () => {
    // For demo purposes, simulate clicking the verification link
    if (email) {
      const demoToken = localStorage.getItem(`verification_${email}`);
      if (demoToken) {
        navigate(`/auth/verify-email?token=${demoToken}&email=${email}`);
      } else {
        setError('No verification token found. Please request a new verification email.');
      }
    }
  };

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully verified. You now have full access to your account.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting you to the dashboard in a few seconds...
              </p>
              <div className="mt-6">
                <Link to="/" className="btn btn-primary w-full">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <div className="mt-6 space-y-3">
                {email && (
                  <button
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    className="btn btn-primary w-full"
                  >
                    {resendLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send New Verification Email'
                    )}
                  </button>
                )}
                <Link to="/auth/login" className="btn btn-secondary w-full">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Verification email sent successfully! Please check your inbox.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
            <p className="text-sm text-gray-600 mb-6">
              We've sent a verification link to <strong>{email}</strong>
            </p>

            {/* Demo verification button */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Demo Mode:</strong> Click the button below to simulate clicking the verification link in your email.
              </p>
              <button
                onClick={simulateVerification}
                className="btn btn-primary w-full"
              >
                Simulate Email Verification
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or request a new one.
              </p>
              
              {email && (
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="btn btn-secondary w-full"
                >
                  {resendLoading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </div>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}

              <Link to="/auth/login" className="block text-center text-sm text-blue-600 hover:text-blue-500">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}