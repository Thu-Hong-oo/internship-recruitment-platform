import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { navigationService, NavigationIntentResponse } from '@/lib/api/services/navigation.service';

interface UseAINavigationOptions {
  frontend?: 'fe' | 'fe-employer';
  onSuccess?: (result: NavigationIntentResponse) => void;
  onError?: (error: string) => void;
}

export function useAINavigation(options: UseAINavigationOptions = {}) {
  const router = useRouter();
  const { frontend = 'fe', onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<NavigationIntentResponse | null>(null);
  
  const navigate = async (input: string, sessionId?: string) => {
    if (!input || input.trim().length === 0) {
      const err = 'Vui lòng nhập nội dung';
      setError(err);
      if (onError) onError(err);
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await navigationService.recognizeIntent(
        input.trim(),
        frontend,
        sessionId
      );
      
      setLastResult(result);
      
      if (result.success && result.url) {
        // Navigate to URL
        router.push(result.url);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } else {
        // Show error or suggestions
        const err = result.error || 'Không thể nhận diện ý định';
        setError(err);
        
        if (onError) {
          onError(err);
        }
        
        return result;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const clearError = () => {
    setError(null);
  };
  
  return { 
    navigate, 
    loading, 
    error, 
    lastResult,
    clearError
  };
}


