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
  Info,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  getQueue,
  getQueueItem,
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
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

    let cleanup: (() => void) | undefined;
    
    pollQueue(token, (data) => {
      setQueueData(data);
    }, 3000).then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
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

  const handleShowDetails = async (item: QueueItem) => {
    if (!token) return;

    try {
      setDetailsLoading(true);
      // Fetch full item details from backend
      const fullItem = await getQueueItem(token, item.id);
      setSelectedItem(fullItem);
    } catch (err) {
      console.error('Failed to fetch item details:', err);
      // Fallback to showing the item we have
      setSelectedItem(item);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-vis-teal-500 dark:text-vis-teal-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'processing':
        return 'text-vis-teal-500 dark:text-vis-teal-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={() => setShowQueue(false)}
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-900',
          'border-2 border-teal-500/30 dark:border-teal-700/50 rounded-2xl',
          'shadow-2xl shadow-black/10 dark:shadow-black/60',
          'w-[92vw] h-[88vh] max-w-7xl flex flex-col',
          'animate-in fade-in-0 zoom-in-95 duration-300'
        )}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-800/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 dark:border-teal-500/40">
            <ListOrdered className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === 'zh' ? '任务队列' : 'Task Queue'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {language === 'zh' ? '实时监控您的生成任务' : 'Monitor your generation tasks in real-time'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowQueue(false)}
          className="h-10 w-10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-teal-500/10 dark:hover:bg-teal-500/20 transition-all"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Bar */}
      {queueData && (
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-teal-400 dark:hover:border-teal-500 transition-all">
            <div className="text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '总计' : 'Total'}
            </div>
            <div className="text-gray-900 dark:text-white font-bold text-3xl">
              {queueData.total}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 shadow-sm hover:border-yellow-500 dark:hover:border-yellow-600 transition-all">
            <div className="text-yellow-700 dark:text-yellow-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '等待中' : 'Pending'}
            </div>
            <div className="text-yellow-800 dark:text-yellow-200 font-bold text-3xl">{queueData.pending}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700/50 shadow-sm hover:border-teal-500 dark:hover:border-teal-600 transition-all">
            <div className="text-teal-700 dark:text-teal-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '处理中' : 'Processing'}
            </div>
            <div className="text-teal-700 dark:text-teal-200 font-bold text-3xl animate-pulse">{queueData.processing}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 shadow-sm hover:border-green-500 dark:hover:border-green-600 transition-all">
            <div className="text-green-700 dark:text-green-300 text-xs uppercase tracking-wider mb-2 font-medium">
              {language === 'zh' ? '已完成' : 'Completed'}
            </div>
            <div className="text-green-800 dark:text-green-200 font-bold text-3xl">{queueData.completed}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={filterStatus === undefined ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus(undefined)}
          className={cn(
            'flex-1 text-sm font-medium transition-all',
            filterStatus === undefined 
              ? 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white shadow-lg' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 hover:text-teal-600 dark:hover:text-teal-400'
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
              ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white shadow-lg' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/20 hover:text-yellow-600 dark:hover:text-yellow-400'
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
              ? 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white shadow-lg' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 hover:text-teal-600 dark:hover:text-teal-400'
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
              ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white shadow-lg' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-green-500/10 dark:hover:bg-green-500/20 hover:text-green-600 dark:hover:text-green-400'
          )}
        >
          {language === 'zh' ? '已完成' : 'Completed'}
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            className="gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            {language === 'zh' ? '刷新' : 'Refresh'}
          </Button>
          {queueData && (queueData.completed > 0 || queueData.failed > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              {language === 'zh' ? '清除已完成' : 'Clear Completed'}
            </Button>
          )}
        </div>
        {queueData && queueData.items.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {language === 'zh' ? `显示 ${queueData.items.length} 个任务` : `Showing ${queueData.items.length} tasks`}
          </div>
        )}
      </div>

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {loading && !queueData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 text-teal-500 dark:text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mb-4" />
            <p className="text-base text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
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
            <ListOrdered className="h-24 w-24 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
              {language === 'zh' ? '队列为空' : 'Queue is empty'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center mt-2">
              {language === 'zh' ? '您的任务将显示在这里' : 'Your tasks will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueData.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-white dark:bg-gray-800',
                  'rounded-xl p-5 border',
                  'hover:shadow-xl transition-all duration-300',
                  'flex flex-col h-full group',
                  item.status === 'pending' && 'border-yellow-300 dark:border-yellow-700/50 hover:border-yellow-500 dark:hover:border-yellow-600',
                  item.status === 'processing' && 'border-teal-300 dark:border-teal-700/50 hover:border-teal-500 dark:hover:border-teal-600 shadow-md shadow-teal-100 dark:shadow-teal-900/30',
                  item.status === 'completed' && 'border-green-300 dark:border-green-700/50 hover:border-green-500 dark:hover:border-green-600',
                  item.status === 'failed' && 'border-red-300 dark:border-red-700/50 hover:border-red-500 dark:hover:border-red-600'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg border',
                      item.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700/50',
                      item.status === 'processing' && 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700/50',
                      item.status === 'completed' && 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700/50',
                      item.status === 'failed' && 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700/50'
                    )}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {getTypeLabel(item.type)}
                        </span>
                        <span className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-full border',
                          item.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-700/50',
                          item.status === 'processing' && 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-400 dark:border-teal-700/50 animate-pulse',
                          item.status === 'completed' && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-400 dark:border-green-700/50',
                          item.status === 'failed' && 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-400 dark:border-red-700/50'
                        )}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
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
                      className="w-full h-52 object-cover border border-gray-200 dark:border-gray-700 rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 dark:from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  </div>
                )}

                {/* Result Image */}
                {item.result_url && item.status === 'completed' && (
                  <div className="mb-4 relative overflow-hidden rounded-xl group/img">
                    <img
                      src={item.result_url}
                      alt="Result"
                      className="w-full h-52 object-cover border border-green-500/40 dark:border-green-500/30 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 dark:hover:shadow-green-500/20"
                      onClick={() => handleShowDetails(item)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 dark:from-green-500/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white font-semibold text-sm bg-green-500/90 dark:bg-green-500/80 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {language === 'zh' ? '点击查看详情' : 'Click for details'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                {item.prompt && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4 flex-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-medium leading-relaxed">{item.prompt}</p>
                  </div>
                )}

                {/* Progress Bar */}
                {item.status === 'processing' && item.progress > 0 && (
                  <div className="space-y-2 mt-auto p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {language === 'zh' ? '进度' : 'Progress'}
                      </span>
                      <span className="text-teal-700 dark:text-teal-300 font-bold">{item.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-teal-300 dark:border-teal-700/50">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-400 dark:from-teal-600 dark:to-teal-500 transition-all duration-500 rounded-full"
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

      {/* Details Modal */}
      {selectedItem && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={cn(
              'bg-white dark:bg-gradient-to-br dark:from-vis-bg-primary dark:via-vis-bg-secondary dark:to-vis-bg-primary',
              'border-2 border-vis-teal-500/30 dark:border-vis-teal-500/20 rounded-2xl',
              'shadow-2xl shadow-black/20 dark:shadow-black/40',
              'w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-vis-teal-500/20 bg-white/95 dark:bg-vis-bg-primary/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-vis-teal-500/10 border border-vis-teal-500/30">
                  <Info className="h-6 w-6 text-vis-teal-600 dark:text-vis-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-vis-text-primary">
                    {language === 'zh' ? '任务详情' : 'Task Details'}
                  </h3>
                  <p className="text-xs text-vis-text-muted">
                    ID: {selectedItem.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedItem(null)}
                className="h-10 w-10 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Result Image */}
              {selectedItem.result_url && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {language === 'zh' ? '生成结果' : 'Generated Result'}
                  </h4>
                  <div className="relative group rounded-xl overflow-hidden border-2 border-teal-500/30 dark:border-teal-700/50">
                    <img
                      src={selectedItem.result_url}
                      alt="Result"
                      className="w-full h-auto max-h-[50vh] object-contain bg-gray-100 dark:bg-gray-800"
                    />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadImage(selectedItem.result_url!, `result-${selectedItem.id}.png`)}
                        className="gap-2 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        {language === 'zh' ? '下载' : 'Download'}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(selectedItem.result_url, '_blank')}
                        className="gap-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 shadow-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {language === 'zh' ? '新窗口打开' : 'Open'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    {language === 'zh' ? '类型' : 'Type'}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {getTypeLabel(selectedItem.type)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    {language === 'zh' ? '状态' : 'Status'}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedItem.status)}
                    <span className={cn('text-lg font-bold', getStatusColor(selectedItem.status))}>
                      {selectedItem.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prompt */}
              {selectedItem.prompt && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {language === 'zh' ? '提示词' : 'Prompt'}
                  </h4>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedItem.prompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    {language === 'zh' ? '参数详情' : 'Parameters'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.metadata.width && selectedItem.metadata.height && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '尺寸' : 'Dimensions'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedItem.metadata.width} × {selectedItem.metadata.height}
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.aspectRatio && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '宽高比' : 'Aspect Ratio'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedItem.metadata.aspectRatio}
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.seed !== undefined && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '种子' : 'Seed'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                          {selectedItem.metadata.seed}
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.temperature !== undefined && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '温度' : 'Temperature'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedItem.metadata.temperature}
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.scale && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '放大倍数' : 'Scale'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedItem.metadata.scale}x
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.modelVersion && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '模型' : 'Model'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {selectedItem.metadata.modelVersion}
                        </div>
                      </div>
                    )}
                    {selectedItem.metadata.negativePrompt && (
                      <div className="col-span-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {language === 'zh' ? '负面提示词' : 'Negative Prompt'}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedItem.metadata.negativePrompt}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    {language === 'zh' ? '创建时间' : 'Created'}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedItem.created_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                  </div>
                </div>
                {selectedItem.completed_at && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      {language === 'zh' ? '完成时间' : 'Completed'}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedItem.completed_at).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {selectedItem.error_message && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-300 dark:border-red-500/40">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                        {language === 'zh' ? '错误信息' : 'Error Message'}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-400">
                        {selectedItem.error_message}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

