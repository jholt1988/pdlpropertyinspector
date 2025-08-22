import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { SocialAuthService } from '../../services/socialAuthService';

export function SocialCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'linking'>('processing');
  const [error, setError] = useState('');
  const [linkingEmail, setLinkingEmail] = useState('');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = sessionStorage.getItem('oauth_provider');
      const error = searchParams.get('error');

      if (error) {
        setError(`OAuth error: ${error}`);
        setStatus('error');
        return;
      }

      if (!code || !state || !provider) {
        setError('Invalid OAuth callback parameters');
        setStatus('error');
        return;
      }

      const result = await SocialAuthService.handleOAuthCallback(provider, code, state);

      if (result.success && result.user && result.accessToken && result.refreshToken) {
        // Store tokens and user data
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(result.user));

        setStatus('success');
        
        // Redirect after short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else if (result.needsAccountLinking) {
        setLinkingEmail(result.existingEmail || '');
        setStatus('linking');
      } else {
        setError(result.error || 'Social login failed');
        setStatus('error');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to process OAuth callback');
      setStatus('error');
    }
  };

  const handleAccountLinking = async (password: string) => {
    try {
      const provider = sessionStorage.getItem('oauth_provider');
      const code = searchParams.get('code');

      if (!provider || !code) {
        setError('Missing OAuth parameters for account linking');
        return;
      }

      // Get social user info again
      const socialResult = await SocialAuthService.handleOAuthCallback(provider, code, '');
      if (!socialResult.user) {
        setError('Failed to retrieve social account information');
        return;
      }

      const result = await SocialAuthService.linkSocialAccount(
        linkingEmail,
        password,
        {
          providerId: provider,
          providerUserId: socialResult.user.id,
          email: socialResult.user.email,
          name: socialResult.user.name,
          avatar: (socialResult.user as any).picture || socialResult.user.avatar,
        }
      );

      if (result.success && result.user && result.accessToken && result.refreshToken) {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(result.user));

        setStatus('success');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        setError(result.error || 'Account linking failed');
      }
    } catch (error) {
      setError('Failed to link accounts');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900">Processing login...</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we complete your social login
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Login Successful!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting you to the application...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'linking') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Link Your Account</h2>
              <p className="mt-2 text-sm text-gray-600">
                An account with email <strong>{linkingEmail}</strong> already exists.
                Enter your password to link your social account.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const password = formData.get('password') as string;
              handleAccountLinking(password);
            }}>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="form-input"
                  placeholder="Enter your account password"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Login Failed</h2>
            <p className="mt-2 text-sm text-red-600 mb-6">{error}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/auth/login')}
                className="btn btn-primary w-full"
              >
                Back to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary w-full"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}