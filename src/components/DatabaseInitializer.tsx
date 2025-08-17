import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { LoadingSpinner } from './LoadingSpinner';
import { supabase, testConnection, initializeDatabase, isSupabaseConfigured } from '../lib/supabase';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

export const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    if (!isSupabaseConfigured) {
      setIsConnected(false);
      setError('Supabase configuration is missing. Please check your environment variables.');
      return;
    }

    setIsInitializing(true);
    setError('');

    try {
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (!connected) {
        setError('Unable to connect to the database. Please check your configuration and try again.');
      }
    } catch (error: any) {
      console.error('Database connection error:', error);
      setIsConnected(false);
      setError(error.message || 'Failed to connect to database');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkConnection();
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Show loading state during initialization
  if (isConnected === null || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Initializing Database
            </h2>
            <p className="text-gray-600 mb-4">
              Setting up your clinic management system...
            </p>
            <div className="text-sm text-gray-500">
              This may take a few moments on first launch
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if connection failed
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Database Connection Error
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'Unable to connect to the database. Please check your configuration.'}
              </p>

              {!isSupabaseConfigured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-yellow-800 mb-2">Setup Required:</h3>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in your project root</li>
                    <li>Add your Supabase credentials:</li>
                  </ol>
                  <div className="mt-3 bg-yellow-100 rounded p-3 font-mono text-xs">
                    <div>VITE_SUPABASE_URL=your-supabase-url</div>
                    <div>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Get these from your Supabase project dashboard → Settings → API
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection {retryCount > 0 && `(${retryCount})`}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>Need help? Check the console for detailed error messages.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state and render children
  return (
    <>
      {children}
      {/* Optional: Show connection status in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800">Database Connected</span>
          </div>
        </div>
      )}
    </>
  );
};