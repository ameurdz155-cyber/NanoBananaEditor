import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import {
  ListOrdered,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  getQueue,
  deleteQueueItem,
  clearCompletedQueue,
  type QueueItem,
  type QueueResponse,
  pollQueue,
} from '../services/queueService';
import { Button } from './ui/Button';

export const QueuePanel: React.FC = () => {
  const { showQueue, setShowQueue, language } = useAppStore();
  const { token } = useAuthStore();
  const t = getTranslation(language);

  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Fetch queue data
  const fetchQueue = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getQueue(token, filterStatus);
      setQueueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filter changes
  useEffect(() => {
    if (showQueue && token) {
      fetchQueue();
    }
  }, [showQueue, token, filterStatus]);

  // Poll for updates every 3 seconds when panel is open and there are active items
  useEffect(() => {
    if (!showQueue || !token) return;

    const hasActiveItems =
      queueData &&
      (queueData.pending > 0 || queueData.processing > 0);

    if (!hasActiveItems) return;

    const cleanup = pollQueue(token, (data) => {
      setQueueData(data);
    }, 3000);

    return cleanup;
  }, [showQueue, token, queueData?.pending, queueData?.processing]);

  const handleDelete = async (itemId: string) => {
    if (!token) return;

    try {
      await deleteQueueItem(token, itemId);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to delete queue item:', err);
    }
  };

  const handleClearCompleted = async () => {
    if (!token) return;

    try {
      await clearCompletedQueue(token);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to clear completed items:', err);
    }
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-vis-text-muted" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-vis-teal-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-vis-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-vis-danger" />;
    }
  };

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'text-vis-text-muted';
      case 'processing':
        return 'text-vis-teal-500';
      case 'completed':
        return 'text-vis-success';
      case 'failed':
        return 'text-vis-danger';
    }
  };

  const getTypeLabel = (type: QueueItem['type']) => {
    const labels = {
      generation: language === 'zh' ? '生成' : 'Generation',
      edit: language === 'zh' ? '编辑' : 'Edit',
      upscale: language === 'zh' ? '放大' : 'Upscale',
      inpaint: language === 'zh' ? '修复' : 'Inpaint',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === 'zh' ? '刚刚' : 'Just now';
    if (minutes < 60) return language === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
    if (hours < 24) return language === 'zh' ? `${hours}小时前` : `${hours}h ago`;
    if (days < 7) return language === 'zh' ? `${days}天前` : `${days}d ago`;
    
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  if (!showQueue) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 dark:bg-black/70 backdrop-blur-md"
      onClick={() => setShowQueue(false)}
    >
      <div
        className={cn(
          'bg-white dark:bg-gradient-to-br dark:from-vis-bg-primary dark:via-vis-bg-secondary dark:to-vis-bg-primary',
          'border-2 border-vis-teal-500/30 dark:border-vis-teal-500/20 rounded-2xl',
          'shadow-2xl shadow-black/10 dark:shadow-black/40',
          'w-[92vw] h-[88vh] max-w-7xl flex flex-col',
          'animate-in fade-in-0 zoom-in-95 duration-300'
        )}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-vis-teal-500/20 bg-gradient-to-r from-gray-50 to-transparent dark:from-vis-bg-tertiary/50 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-vis-teal-500/10 border border-vis-teal-500/30">
            <ListOrdered className="h-6 w-6 text-vis-teal-600 dark:text-vis-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-vis-text-primary">
              {language === 'zh' ? '任务队列' : 'Task Queue'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-vis-text-muted">
              {language === 'zh' ? '实时监控您的生成任务' : 'Monitor your generation tasks in real-time'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowQueue(false)}
          className="h-10 w-10 rounded-lg text-gray-600 dark:text-vis-text-muted hover:text-gray-900 dark:hover:text-vis-text-primary hover:bg-vis-teal-500/10 transition-all"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Bar */}
      {queueData && (
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-vis-teal-500/20">
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-vis-bg-tertiary/50 border border-gray-200 dark:border-vis-border shadow-sm dark:shadow-vis-teal-500/5 hover:border-gray-400 dark:hover:border-vis-teal-500/60 transition-all">
            <div className="text-gray-600 dark:text-vis-text-primary/80 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '总计' : 'Total'}
            </div>
            <div className="text-gray-900 dark:text-white font-bold text-3xl">
              {queueData.total}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-400/50 shadow-sm dark:shadow-yellow-500/10 hover:border-yellow-500 dark:hover:border-yellow-400/70 transition-all">
            <div className="text-yellow-700 dark:text-yellow-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '等待中' : 'Pending'}
            </div>
            <div className="text-yellow-700 dark:text-yellow-200 font-bold text-3xl">{queueData.pending}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-teal-50 dark:bg-vis-teal-500/20 border border-teal-300 dark:border-vis-teal-400/50 shadow-sm dark:shadow-vis-teal-500/10 hover:border-teal-500 dark:hover:border-vis-teal-400/70 transition-all">
            <div className="text-teal-700 dark:text-vis-teal-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '处理中' : 'Processing'}
            </div>
            <div className="text-teal-700 dark:text-vis-teal-200 font-bold text-3xl animate-pulse">{queueData.processing}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-500/20 border border-green-300 dark:border-green-400/50 shadow-sm dark:shadow-green-500/10 hover:border-green-500 dark:hover:border-green-400/70 transition-all">
            <div className="text-green-700 dark:text-green-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '已完成' : 'Completed'}
            </div>
            <div className="text-green-700 dark:text-green-200 font-bold text-3xl">{queueData.completed}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-vis-teal-500/10">
        <Button
          variant={filterStatus === undefined ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus(undefined)}
          className={cn(
            'flex-1 text-sm font-medium transition-all',
            filterStatus === undefined 
              ? 'bg-vis-teal-500 hover:bg-vis-teal-600 text-white shadow-lg shadow-vis-teal-500/30 dark:shadow-vis-teal-500/20' 
              : 'hover:bg-vis-teal-500/10 hover:text-vis-teal-600 dark:hover:text-vis-teal-500'
          )}
        >
          {language === 'zh' ? '全部' : 'All'}
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
          className={cn(
            'flex-1 text-sm font-medium transition-all',
            filterStatus === 'pending' 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20' 
              : 'hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-500'
          )}
        >
          {language === 'zh' ? '等待' : 'Pending'}
        </Button>
        <Button
          variant={filterStatus === 'processing' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('processing')}
          className={cn(
            'flex-1 text-sm font-medium transition-all',
            filterStatus === 'processing' 
              ? 'bg-vis-teal-500 hover:bg-vis-teal-600 text-white shadow-lg shadow-vis-teal-500/30 dark:shadow-vis-teal-500/20' 
              : 'hover:bg-vis-teal-500/10 hover:text-vis-teal-600 dark:hover:text-vis-teal-500'
          )}
        >
          {language === 'zh' ? '处理中' : 'Processing'}
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
          className={cn(
            'flex-1 text-sm font-medium transition-all',
            filterStatus === 'completed' 
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 dark:shadow-green-500/20' 
              : 'hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-500'
          )}
        >
          {language === 'zh' ? '已完成' : 'Completed'}
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-200 dark:border-vis-teal-500/10 bg-gray-50 dark:bg-vis-bg-tertiary/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            className="gap-2 text-sm font-medium text-gray-700 dark:text-vis-text-secondary hover:bg-vis-teal-500/10 hover:text-vis-teal-600 dark:hover:text-vis-teal-500 transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            {language === 'zh' ? '刷新' : 'Refresh'}
          </Button>
          {queueData && (queueData.completed > 0 || queueData.failed > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="gap-2 text-sm font-medium text-gray-600 dark:text-vis-text-muted hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              {language === 'zh' ? '清除已完成' : 'Clear Completed'}
            </Button>
          )}
        </div>
        {queueData && queueData.items.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-vis-text-muted font-medium">
            {language === 'zh' ? `显示 ${queueData.items.length} 个任务` : `Showing ${queueData.items.length} tasks`}
          </div>
        )}
      </div>

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {loading && !queueData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 text-vis-teal-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <AlertCircle className="h-16 w-16 text-red-500 dark:text-vis-danger mb-4" />
            <p className="text-base text-gray-600 dark:text-vis-text-muted text-center mb-4">{error}</p>
            <Button
              variant="ghost"
              size="default"
              onClick={fetchQueue}
            >
              {language === 'zh' ? '重试' : 'Retry'}
            </Button>
          </div>
        ) : !queueData || queueData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <ListOrdered className="h-24 w-24 text-gray-300 dark:text-vis-text-muted/20 mb-4" />
            <p className="text-lg text-gray-600 dark:text-vis-text-muted text-center">
              {language === 'zh' ? '队列为空' : 'Queue is empty'}
            </p>
            <p className="text-sm text-gray-500 dark:text-vis-text-muted/60 text-center mt-2">
              {language === 'zh' ? '您的任务将显示在这里' : 'Your tasks will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueData.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-white dark:bg-gradient-to-br dark:from-vis-bg-tertiary/60 dark:to-vis-bg-secondary/40',
                  'rounded-xl p-5 border',
                  'hover:shadow-xl transition-all duration-300',
                  'flex flex-col h-full group',
                  item.status === 'pending' && 'border-yellow-300 dark:border-yellow-500/30 hover:border-yellow-500 dark:hover:border-yellow-500/50',
                  item.status === 'processing' && 'border-teal-300 dark:border-vis-teal-500/40 hover:border-teal-500 dark:hover:border-vis-teal-500/70 shadow-md shadow-teal-100 dark:shadow-vis-teal-500/10',
                  item.status === 'completed' && 'border-green-300 dark:border-green-500/30 hover:border-green-500 dark:hover:border-green-500/50',
                  item.status === 'failed' && 'border-red-300 dark:border-red-500/30 hover:border-red-500 dark:hover:border-red-500/50'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg border',
                      item.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-500/15 border-yellow-300 dark:border-yellow-500/30',
                      item.status === 'processing' && 'bg-teal-100 dark:bg-vis-teal-500/15 border-teal-300 dark:border-vis-teal-500/30',
                      item.status === 'completed' && 'bg-green-100 dark:bg-green-500/15 border-green-300 dark:border-green-500/30',
                      item.status === 'failed' && 'bg-red-100 dark:bg-red-500/15 border-red-300 dark:border-red-500/30'
                    )}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-vis-text-primary">
                          {getTypeLabel(item.type)}
                        </span>
                        <span className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-full border',
                          item.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-400 dark:border-yellow-500/40',
                          item.status === 'processing' && 'bg-teal-100 dark:bg-vis-teal-500/20 text-teal-700 dark:text-vis-teal-400 border-teal-400 dark:border-vis-teal-500/40 animate-pulse',
                          item.status === 'completed' && 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-400 dark:border-green-500/40',
                          item.status === 'failed' && 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-400 dark:border-red-500/40'
                        )}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-vis-text-muted font-medium">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-9 w-9 rounded-lg text-gray-500 dark:text-vis-text-muted hover:text-red-600 dark:hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview Image */}
                {item.preview_url && (
                  <div className="mb-4 relative overflow-hidden rounded-xl group/img">
                    <img
                      src={item.preview_url}
                      alt="Preview"
                      className="w-full h-52 object-cover border border-gray-200 dark:border-vis-border/50 rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 dark:from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  </div>
                )}

                {/* Result Image */}
                {item.result_url && item.status === 'completed' && (
                  <div className="mb-4 relative overflow-hidden rounded-xl group/img">
                    <img
                      src={item.result_url}
                      alt="Result"
                      className="w-full h-52 object-cover border border-green-500/40 dark:border-green-500/30 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 dark:hover:shadow-green-500/20"
                      onClick={() => window.open(item.result_url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 dark:from-green-500/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white font-semibold text-sm bg-green-500/90 dark:bg-green-500/80 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg">
                        {language === 'zh' ? '点击查看' : 'Click to view'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                {item.prompt && (
                  <div className="text-sm text-gray-700 dark:text-vis-text-secondary line-clamp-3 mb-4 flex-1 p-3 bg-gray-50 dark:bg-vis-bg-tertiary/30 rounded-lg border border-gray-200 dark:border-vis-border/50">
                    <p className="font-medium leading-relaxed">{item.prompt}</p>
                  </div>
                )}

                {/* Progress Bar */}
                {item.status === 'processing' && item.progress > 0 && (
                  <div className="space-y-2 mt-auto p-3 bg-teal-50 dark:bg-vis-teal-500/10 rounded-lg border border-teal-200 dark:border-vis-teal-500/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-vis-text-muted font-medium">
                        {language === 'zh' ? '进度' : 'Progress'}
                      </span>
                      <span className="text-teal-700 dark:text-vis-teal-400 font-bold">{item.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-vis-bg-primary rounded-full overflow-hidden border border-teal-300 dark:border-vis-teal-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-400 dark:from-vis-teal-500 dark:to-vis-teal-400 transition-all duration-500 rounded-full shadow-md shadow-teal-200 dark:shadow-vis-teal-500/40"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {item.error_message && item.status === 'failed' && (
                  <div className="flex items-start gap-3 mt-auto p-4 bg-red-50 dark:bg-red-500/15 rounded-xl border border-red-300 dark:border-red-500/40 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium">{item.error_message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
