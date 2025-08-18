import React from 'react';
import { Clock, Users, TrendingUp, Zap } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { useTranslation } from '../lib/translations';
import { estimateWaitTime } from '../lib/utils';

interface QueueWidgetProps {
  userSTN?: number;
  department?: string;
}

export const QueueWidget: React.FC<QueueWidgetProps> = ({ userSTN, department }) => {
  const { t } = useTranslation();
  const { queueStatus, loading } = useQueue(department);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-pulse shadow-lg">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-blue-200 rounded-lg w-32"></div>
          <div className="h-6 bg-blue-200 rounded-lg w-20"></div>
        </div>
      </div>
    );
  }

  const userPosition = userSTN ? Math.max(0, userSTN - queueStatus.now_serving) : 0;
  const estimatedWait = estimateWaitTime(userPosition);

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-8 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Zap className="h-6 w-6 text-yellow-500 mr-2" />
          Live Queue Status
        </h3>
        <p className="text-gray-600">Real-time updates • Refreshed every 15 seconds</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">{queueStatus.now_serving}</div>
          <div className="text-sm font-medium text-blue-700">{t('now_serving')}</div>
          <div className="text-xs text-blue-500 mt-1">Current Token</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-900 mb-1">{queueStatus.total_waiting}</div>
          <div className="text-sm font-medium text-orange-700">{t('waiting')}</div>
          <div className="text-xs text-orange-500 mt-1">In Queue</div>
        </div>

        {userSTN && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-green-100 rounded-full p-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">{userSTN}</div>
              <div className="text-sm font-medium text-green-700">{t('your_token')}</div>
              <div className="text-xs text-green-500 mt-1">Your Number</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">{estimatedWait}m</div>
              <div className="text-sm font-medium text-purple-700">{t('est_wait')}</div>
              <div className="text-xs text-purple-500 mt-1">Approximate</div>
            </div>
          </>
        )}
      </div>

      {userSTN && userPosition > 0 && (
        <div className="mt-6 pt-6 border-t-2 border-blue-200">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-blue-700 font-medium">{t('position_in_queue')}</span>
              <span className="font-bold text-blue-900 text-lg">#{userPosition}</span>
            </div>
            <div className="mt-3 bg-blue-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.min(100, ((queueStatus.now_serving - 1) / userSTN) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-600 mt-2">
              <span>Started</span>
              <span className="font-medium">Your Turn</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};