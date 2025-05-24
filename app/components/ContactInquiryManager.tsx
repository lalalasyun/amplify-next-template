'use client';

import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

const client = generateClient<Schema>();

type ContactInquiry = Schema['ContactInquiry']['type'];

export default function ContactInquiryManager() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const { data } = await client.models.ContactInquiry.list({
        limit: 100
      });
      
      // 作成日時でソート（新しい順）
      const sortedData = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setInquiries(sortedData);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      await client.models.ContactInquiry.update({
        id,
        status: status as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
      });
      
      // リストを更新
      await loadInquiries();
      
      // 選択中のお問い合わせが更新された場合は詳細も更新
      if (selectedInquiry?.id === id) {
        const updatedInquiry = inquiries.find(inq => inq.id === id);
        if (updatedInquiry) {
          setSelectedInquiry({
            ...updatedInquiry,
            status: status as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          });
        }
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW':
        return '新規';
      case 'IN_PROGRESS':
        return '対応中';
      case 'RESOLVED':
        return '解決済み';
      case 'CLOSED':
        return '完了';
      default:
        return status;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (statusFilter === 'ALL') return true;
    return inquiry.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">お問い合わせ管理</h2>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ALL">すべて</option>
                <option value="NEW">新規</option>
                <option value="IN_PROGRESS">対応中</option>
                <option value="RESOLVED">解決済み</option>
                <option value="CLOSED">完了</option>
              </select>
              <button
                onClick={loadInquiries}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                更新
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* お問い合わせ一覧 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              お問い合わせ一覧 ({filteredInquiries.length}件)
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedInquiry?.id === inquiry.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{inquiry.subject}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inquiry.status || 'NEW')}`}>
                      {getStatusLabel(inquiry.status || 'NEW')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">差出人: {inquiry.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(inquiry.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* お問い合わせ詳細 */}
          <div>
            {selectedInquiry ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">お問い合わせ詳細</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedInquiry.status || 'NEW'}
                      onChange={(e) => updateInquiryStatus(selectedInquiry.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="NEW">新規</option>
                      <option value="IN_PROGRESS">対応中</option>
                      <option value="RESOLVED">解決済み</option>
                      <option value="CLOSED">完了</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                      <p className="text-sm text-gray-900">{selectedInquiry.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                      <p className="text-sm text-gray-900">
                        <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 hover:text-blue-800">
                          {selectedInquiry.email}
                        </a>
                      </p>
                    </div>
                  </div>

                  {selectedInquiry.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                      <p className="text-sm text-gray-900">
                        <a href={`tel:${selectedInquiry.phone}`} className="text-blue-600 hover:text-blue-800">
                          {selectedInquiry.phone}
                        </a>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
                    <p className="text-sm text-gray-900">{selectedInquiry.subject}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">お問い合わせ内容</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">受信日時</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedInquiry.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedInquiry.status || 'NEW')}`}>
                      {getStatusLabel(selectedInquiry.status || 'NEW')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                左側のリストからお問い合わせを選択してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
