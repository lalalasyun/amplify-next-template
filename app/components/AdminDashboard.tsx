'use client';

import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';
import ContactInquiryManager from './ContactInquiryManager';

const client = generateClient<Schema>();

interface ServiceRequest {
  id: string;
  category: string | null;
  status: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredDate1: string | null;
  preferredTime1: string | null;
  createdAt: string;
  itemList?: any; // JSON型なのでanyまたは適切な型を使用
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'inquiries'>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.ServiceRequest.list();
      setRequests(data || []);
    } catch (error) {
      console.error('リクエストの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    try {
      const { data } = await client.models.ServiceRequest.update({
        id,
        status: newStatus as any
      });
      
      if (data) {
        // ローカル状態を更新
        setRequests(prev => 
          prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
        );
        
        if (selectedRequest?.id === id) {
          setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error('ステータス更新に失敗しました:', error);
    }
  };
  const filteredRequests = requests.filter(request => {
    if (filter === 'ALL') return true;
    return request.status === filter;
  });
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return '不明';
    switch (status) {
      case 'NEW': return '新規';
      case 'PENDING': return '保留中';
      case 'IN_PROGRESS': return '進行中';
      case 'COMPLETED': return '完了';
      case 'CANCELLED': return 'キャンセル';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return '不明';
    switch (category) {
      case 'INQUIRY': return 'お問い合わせ';
      case 'PURCHASE_REQUEST': return '買取依頼';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          管理者ダッシュボード
        </h1>
        {activeTab === 'requests' && (
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            更新
          </button>
        )}
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              サービスリクエスト管理
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inquiries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              お問い合わせ管理
            </button>
          </nav>
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'requests' ? (
        <>
          {/* フィルター */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['ALL', 'NEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'ALL' ? 'すべて' : getStatusLabel(status)}
                  {status !== 'ALL' && (
                    <span className="ml-1">
                      ({requests.filter(r => r.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">読み込み中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* リクエスト一覧 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">
                    サービスリクエスト一覧 ({filteredRequests.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{request.customerName || '名前未設定'}</h3>
                          <p className="text-sm text-gray-600">{request.customerEmail || 'メール未設定'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>カテゴリ: {getCategoryLabel(request.category)}</p>
                        <p>希望日: {request.preferredDate1 || '未設定'} {request.preferredTime1 || ''}</p>
                        <p>作成日: {new Date(request.createdAt).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 詳細表示 */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">詳細情報</h2>
                </div>
                
                {selectedRequest ? (
                  <div className="p-6 space-y-4">
                    {/* ステータス更新 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ステータス更新
                      </label>
                      <select
                        value={selectedRequest.status || 'NEW'}
                        onChange={(e) => updateRequestStatus(selectedRequest.id, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="NEW">新規</option>
                        <option value="PENDING">保留中</option>
                        <option value="IN_PROGRESS">進行中</option>
                        <option value="COMPLETED">完了</option>
                        <option value="CANCELLED">キャンセル</option>
                      </select>
                    </div>

                    {/* 基本情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">お客様情報</h4>
                        <p><strong>名前:</strong> {selectedRequest.customerName || '未設定'}</p>
                        <p><strong>メール:</strong> {selectedRequest.customerEmail || '未設定'}</p>
                        <p><strong>電話:</strong> {selectedRequest.customerPhone || '未設定'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">リクエスト情報</h4>
                        <p><strong>カテゴリ:</strong> {getCategoryLabel(selectedRequest.category)}</p>
                        <p><strong>希望日:</strong> {selectedRequest.preferredDate1 || '未設定'}</p>
                        <p><strong>希望時間:</strong> {selectedRequest.preferredTime1 || '未設定'}</p>
                        <p><strong>作成日:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>

                    {/* アイテム一覧 */}
                    {selectedRequest.itemList && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">アイテム一覧</h4>
                        <div className="bg-gray-50 p-4 rounded">
                          {(() => {
                            try {
                              // itemListが既にオブジェクトの場合とJSONストリングの場合の両方に対応
                              const items = typeof selectedRequest.itemList === 'string' 
                                ? JSON.parse(selectedRequest.itemList)
                                : selectedRequest.itemList;
                              
                              if (Array.isArray(items)) {
                                return (
                                  <div className="space-y-2">
                                    {items.map((item: any, index: number) => (
                                      <div key={index} className="border-b border-gray-200 pb-2">
                                        <p><strong>商品名:</strong> {item.itemName || '未設定'}</p>
                                        <p><strong>カテゴリ:</strong> {item.category || '未設定'}</p>
                                        <p><strong>数量:</strong> {item.quantity || '未設定'}</p>
                                        {item.size && <p><strong>サイズ:</strong> {item.size}</p>}
                                        {item.yearsSincePurchase && (
                                          <p><strong>購入年数:</strong> {item.yearsSincePurchase}</p>
                                        )}
                                        {item.notes && <p><strong>備考:</strong> {item.notes}</p>}
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else {
                                return <p>アイテム情報が配列形式ではありません</p>;
                              }
                            } catch {
                              return <p>アイテム情報の解析に失敗しました</p>;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* アクションボタン */}
                    <div className="flex space-x-2 pt-4">
                      <button
                        onClick={() => updateRequestStatus(selectedRequest.id, 'IN_PROGRESS')}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        disabled={selectedRequest.status === 'IN_PROGRESS'}
                      >
                        進行中にする
                      </button>
                      <button
                        onClick={() => updateRequestStatus(selectedRequest.id, 'COMPLETED')}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={selectedRequest.status === 'COMPLETED'}
                      >
                        完了にする
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    リクエストを選択してください
                  </div>
                )}
              </div>
            </div>
          )}        </>
      ) : (
        <ContactInquiryManager />
      )}
    </div>
  );
}
