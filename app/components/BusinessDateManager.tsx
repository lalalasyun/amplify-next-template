'use client';

import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import React, { useEffect, useState } from 'react';

const client = generateClient<Schema>();

interface BusinessDate {
  date: string; // YYYY-MM-DD 形式の文字列
  dayOfWeek?: number;
  isHoliday?: boolean;
  specialDay?: string;
  memo?: string;
  delFlg?: number;
  businessHours?: string;
  unavailableHours?: string;
  purchaseRequestHours?: string;
  createdAt: string;
  updatedAt?: string;
}

interface BusinessHour {
  startTime: string;
  endTime: string;
}

export default function BusinessDateManager() {
  const [businessDates, setBusinessDates] = useState<BusinessDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingDate, setEditingDate] = useState<BusinessDate | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    isHoliday: false,
    specialDay: '',
    memo: '',
    businessHours: [{ startTime: '09:00', endTime: '18:00' }] as BusinessHour[]
  });
  const [bulkFormData, setBulkFormData] = useState({
    startDate: '',
    endDate: '',
    selectedDates: [] as string[],
    isHoliday: false,
    specialDay: '',
    memo: '',
    businessHours: [{ startTime: '09:00', endTime: '18:00' }] as BusinessHour[]
  });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState<'all' | '1week' | '1month' | '3months'>('1month');

  useEffect(() => {
    fetchBusinessDates();
  }, []);

  const fetchBusinessDates = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.BusinessDate.list();
      const transformedData = (data || []).map(item => ({
        date: item.date,
        dayOfWeek: item.dayOfWeek ?? undefined,
        isHoliday: item.isHoliday ?? undefined,
        specialDay: item.specialDay ?? undefined,
        memo: item.memo ?? undefined,
        delFlg: item.delFlg ?? undefined,
        businessHours: typeof item.businessHours === 'string' ? item.businessHours : JSON.stringify(item.businessHours),
        unavailableHours: typeof item.unavailableHours === 'string' ? item.unavailableHours : JSON.stringify(item.unavailableHours),
        purchaseRequestHours: typeof item.purchaseRequestHours === 'string' ? item.purchaseRequestHours : JSON.stringify(item.purchaseRequestHours),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? undefined,
      }));
      setBusinessDates(transformedData);
    } catch (error) {
      console.error('営業日の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  // 期間フィルタリング関数
  const getFilteredBusinessDates = () => {
    if (dateFilter === 'all') {
      return businessDates;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let endDate: Date;
    
    switch (dateFilter) {
      case '1week':
        endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        break;
      case '1month':
        endDate = new Date(today);
        endDate.setMonth(today.getMonth() + 1);
        break;
      case '3months':
        endDate = new Date(today);
        endDate.setMonth(today.getMonth() + 3);
        break;
      default:
        return businessDates;
    }

    return businessDates.filter(businessDate => {
      const date = new Date(businessDate.date);
      return date >= today && date < endDate;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      console.error('日付が選択されていません。');
      alert('日付を選択してください。');
      return;
    }

    const dateObj = new Date(formData.date);
    if (isNaN(dateObj.getTime())) {
      console.error('無効な日付形式です:', formData.date);
      alert('無効な日付形式です。正しい日付を選択してください。');
      return;
    }

    const dayOfWeek = dateObj.getDay();

    const businessDateData = {
      date: formData.date,
      dayOfWeek,
      isHoliday: formData.isHoliday,
      specialDay: formData.specialDay || undefined,
      memo: formData.memo || undefined,
      businessHours: JSON.stringify(formData.businessHours),
      delFlg: 0,
    };

    try {
      if (editingDate) {
        const { data: updatedData, errors } = await client.models.BusinessDate.update({
          ...businessDateData,
        });

        if (updatedData && !errors) {
          const updatedBusinessDate: BusinessDate = {
            date: updatedData.date,
            dayOfWeek: updatedData.dayOfWeek ?? undefined,
            isHoliday: updatedData.isHoliday ?? undefined,
            specialDay: updatedData.specialDay ?? undefined,
            memo: updatedData.memo ?? undefined,
            delFlg: updatedData.delFlg ?? undefined,
            businessHours: typeof updatedData.businessHours === 'string' ? updatedData.businessHours : JSON.stringify(updatedData.businessHours),
            purchaseRequestHours: typeof updatedData.purchaseRequestHours === 'string' ? updatedData.purchaseRequestHours : JSON.stringify(updatedData.purchaseRequestHours),
            unavailableHours: typeof updatedData.unavailableHours === 'string' ? updatedData.unavailableHours : JSON.stringify(updatedData.unavailableHours),
            createdAt: updatedData.createdAt,
            updatedAt: updatedData.updatedAt ?? undefined,
          };
          setBusinessDates(prev => prev.map(bd => bd.date === editingDate.date ? updatedBusinessDate : bd));
        }
      } else {
        const { data: createdData, errors } = await client.models.BusinessDate.create(businessDateData);

        if (createdData && !errors) {
          const newBusinessDate: BusinessDate = {
            date: createdData.date,
            dayOfWeek: createdData.dayOfWeek ?? undefined,
            isHoliday: createdData.isHoliday ?? undefined,
            specialDay: createdData.specialDay ?? undefined,
            memo: createdData.memo ?? undefined,
            delFlg: createdData.delFlg ?? undefined,
            businessHours: typeof createdData.businessHours === 'string' ? createdData.businessHours : JSON.stringify(createdData.businessHours),
            purchaseRequestHours: typeof createdData.purchaseRequestHours === 'string' ? createdData.purchaseRequestHours : JSON.stringify(createdData.purchaseRequestHours),
            unavailableHours: typeof createdData.unavailableHours === 'string' ? createdData.unavailableHours : JSON.stringify(createdData.unavailableHours),
            createdAt: createdData.createdAt,
            updatedAt: createdData.updatedAt ?? undefined,
          };
          setBusinessDates(prev => [...prev, newBusinessDate]);
        } else if (errors) {
          console.error('営業日の作成に失敗しました:', errors);
        }
      }

      resetForm();
    } catch (error) {
      console.error('営業日の保存に失敗しました:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      isHoliday: false,
      specialDay: '',
      memo: '',
      businessHours: [{ startTime: '09:00', endTime: '18:00' }]
    });
    setEditingDate(null);
    setShowForm(false);
  };

  const resetBulkForm = () => {
    setBulkFormData({
      startDate: '',
      endDate: '',
      selectedDates: [],
      isHoliday: false,
      specialDay: '',
      memo: '',
      businessHours: [{ startTime: '09:00', endTime: '18:00' }]
    });
    setShowBulkForm(false);
  };

  const generateDateRange = () => {
    if (!bulkFormData.startDate || !bulkFormData.endDate) return;

    const start = new Date(bulkFormData.startDate);
    const end = new Date(bulkFormData.endDate);
    const dates: string[] = [];

    if (start > end) {
      alert('開始日は終了日より前の日付を選択してください。');
      return;
    }

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    setBulkFormData(prev => ({ ...prev, selectedDates: dates }));
  };

  const toggleDateSelection = (date: string) => {
    setBulkFormData(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(date)
        ? prev.selectedDates.filter(d => d !== date)
        : [...prev.selectedDates, date]
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bulkFormData.selectedDates.length === 0) {
      alert('追加する日付を選択してください。');
      return;
    }

    try {
      const promises = bulkFormData.selectedDates.map(async (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        const businessDateData = {
          date,
          dayOfWeek,
          isHoliday: bulkFormData.isHoliday,
          specialDay: bulkFormData.specialDay || undefined,
          memo: bulkFormData.memo || undefined,
          businessHours: JSON.stringify(bulkFormData.businessHours),
          delFlg: 0,
        };

        return client.models.BusinessDate.create(businessDateData);
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      
      alert(`${successful}件の営業日を追加しました。`);
      await fetchBusinessDates();
      resetBulkForm();
    } catch (error) {
      console.error('一括追加に失敗しました:', error);
      alert('一括追加に失敗しました。');
    }
  };

  const addBusinessHour = () => {
    setFormData(prev => ({
      ...prev,
      businessHours: [...prev.businessHours, { startTime: '09:00', endTime: '18:00' }]
    }));
  };

  const removeBusinessHour = (index: number) => {
    setFormData(prev => ({
      ...prev,
      businessHours: prev.businessHours.filter((_, i) => i !== index)
    }));
  };

  const updateBusinessHour = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      businessHours: prev.businessHours.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const addBulkBusinessHour = () => {
    setBulkFormData(prev => ({
      ...prev,
      businessHours: [...prev.businessHours, { startTime: '09:00', endTime: '18:00' }]
    }));
  };

  const removeBulkBusinessHour = (index: number) => {
    setBulkFormData(prev => ({
      ...prev,
      businessHours: prev.businessHours.filter((_, i) => i !== index)
    }));
  };

  const updateBulkBusinessHour = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setBulkFormData(prev => ({
      ...prev,
      businessHours: prev.businessHours.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const startEdit = (businessDate: BusinessDate) => {
    setEditingDate(businessDate);
    let businessHours = [{ startTime: '09:00', endTime: '18:00' }];
    try {
      businessHours = businessDate.businessHours ? JSON.parse(businessDate.businessHours) : [{ startTime: '09:00', endTime: '18:00' }];
    } catch {
      businessHours = [{ startTime: '09:00', endTime: '18:00' }];
    }

    setFormData({
      date: businessDate.date,
      isHoliday: businessDate.isHoliday || false,
      specialDay: businessDate.specialDay || '',
      memo: businessDate.memo || '',
      businessHours
    });
    setShowForm(true);
  };

  const deleteBusinessDate = async (date: string) => {
    if (confirm('この営業日を削除しますか？')) {
      try {
        await client.models.BusinessDate.delete({ date });
        setBusinessDates(prev => prev.filter(bd => bd.date !== date));
      } catch (error) {
        console.error('営業日の削除に失敗しました:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getDayOfWeekName = (dayOfWeek?: number) => {
    if (dayOfWeek === undefined) return '';
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[dayOfWeek];
  };

  // カレンダー用のヘルパー関数
  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month
      });
    }
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getBusinessDateForDate = (dateKey: string) => {
    return businessDates.find(bd => bd.date === dateKey);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">営業日管理</h1>
        <div className="flex items-center space-x-2">
          {/* 表示モード切り替え */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              リスト
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              カレンダー
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* リストビュー時の期間フィルター */}
            {viewMode === 'list' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">表示期間:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'all' | '1week' | '1month' | '3months')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="1week">今後1週間</option>
                  <option value="1month">今後1カ月</option>
                  <option value="3months">今後3カ月</option>
                  <option value="all">すべて</option>
                </select>
              </div>
            )}
            
            <div className="space-x-2">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                新しい営業日を追加
              </button>
              <button
                onClick={() => setShowBulkForm(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                まとめて追加
              </button>
              <button
                onClick={fetchBusinessDates}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingDate ? '営業日を編集' : '新しい営業日を追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHoliday"
                  checked={formData.isHoliday}
                  onChange={(e) => setFormData(prev => ({ ...prev, isHoliday: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isHoliday" className="text-sm font-medium text-gray-700">
                  休日
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  特別日
                </label>
                <input
                  type="text"
                  value={formData.specialDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialDay: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="例: 年末年始、ゴールデンウィーク"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="特記事項があれば記入してください"
                />
              </div>

              {/* 営業時間 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    営業時間
                  </label>
                  <button
                    type="button"
                    onClick={addBusinessHour}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    時間帯追加
                  </button>
                </div>

                {formData.businessHours.map((hour, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="time"
                      value={hour.startTime}
                      onChange={(e) => updateBusinessHour(index, 'startTime', e.target.value)}
                      className="p-2 border border-gray-300 rounded"
                    />
                    <span>～</span>
                    <input
                      type="time"
                      value={hour.endTime}
                      onChange={(e) => updateBusinessHour(index, 'endTime', e.target.value)}
                      className="p-2 border border-gray-300 rounded"
                    />
                    {formData.businessHours.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBusinessHour(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        削除
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingDate ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 一括追加フォーム */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">営業日をまとめて追加</h2>
            
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              {/* 日付選択セクション */}
              <div className="border-b pb-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">日付選択</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始日
                    </label>
                    <input
                      type="date"
                      value={bulkFormData.startDate}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了日
                    </label>
                    <input
                      type="date"
                      value={bulkFormData.endDate}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateDateRange}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  期間内の日付を生成
                </button>

                {/* 選択された日付の表示 */}
                {bulkFormData.selectedDates.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      選択された日付 ({bulkFormData.selectedDates.length}件)
                    </h4>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {bulkFormData.selectedDates.map((date) => (
                          <div key={date} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`date-${date}`}
                              checked={true}
                              onChange={() => toggleDateSelection(date)}
                              className="mr-2"
                            />
                            <label htmlFor={`date-${date}`} className="text-sm cursor-pointer">
                              {formatDate(date)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 設定セクション */}
              <div>
                <h3 className="text-lg font-semibold mb-2">共通設定</h3>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="bulkIsHoliday"
                    checked={bulkFormData.isHoliday}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, isHoliday: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="bulkIsHoliday" className="text-sm font-medium text-gray-700">
                    休日
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    特別日
                  </label>
                  <input
                    type="text"
                    value={bulkFormData.specialDay}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, specialDay: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="例: 年末年始、ゴールデンウィーク"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メモ
                  </label>
                  <textarea
                    value={bulkFormData.memo}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, memo: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="特記事項があれば記入してください"
                  />
                </div>

                {/* 営業時間 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      営業時間
                    </label>
                    <button
                      type="button"
                      onClick={addBulkBusinessHour}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      時間帯追加
                    </button>
                  </div>

                  {bulkFormData.businessHours.map((hour, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="time"
                        value={hour.startTime}
                        onChange={(e) => updateBulkBusinessHour(index, 'startTime', e.target.value)}
                        className="p-2 border border-gray-300 rounded"
                      />
                      <span>～</span>
                      <input
                        type="time"
                        value={hour.endTime}
                        onChange={(e) => updateBulkBusinessHour(index, 'endTime', e.target.value)}
                        className="p-2 border border-gray-300 rounded"
                      />
                      {bulkFormData.businessHours.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkBusinessHour(index)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetBulkForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={bulkFormData.selectedDates.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {bulkFormData.selectedDates.length}件の営業日を追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 営業日表示セクション */}
      {viewMode === 'calendar' ? (
        // カレンダービュー
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
              </h2>
              <div className="flex items-center space-x-4">
                {/* 年ナビゲーション */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">年:</span>
                  <button
                    onClick={() => navigateYear('prev')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    ←
                  </button>
                  <span className="px-2 text-sm font-medium min-w-[3rem] text-center">
                    {currentDate.getFullYear()}
                  </span>
                  <button
                    onClick={() => navigateYear('next')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    →
                  </button>
                </div>
                
                {/* 月ナビゲーション */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">月:</span>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    ←
                  </button>
                  <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                    {currentDate.getMonth() + 1}
                  </span>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    →
                  </button>
                </div>
                
                <button
                  onClick={goToToday}
                  className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm"
                >
                  今日
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <div key={day} className={`text-center font-medium py-2 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-2">
              {getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map((dayInfo, index) => {
                const dateKey = formatDateKey(dayInfo.date);
                const businessDate = getBusinessDateForDate(dateKey);
                const dayOfWeek = dayInfo.date.getDay();
                const isToday = dateKey === formatDateKey(new Date());
                
                return (                  <div
                    key={index}
                    className={`min-h-[100px] border rounded-lg p-2 cursor-pointer transition-colors ${
                      dayInfo.isCurrentMonth
                        ? `bg-white hover:bg-gray-50 ${businessDate ? 'border-blue-300 shadow-sm' : 'border-gray-200'}`
                        : 'bg-gray-50 text-gray-400'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                      if (dayInfo.isCurrentMonth) {
                        if (businessDate) {
                          // 既存の営業日データがある場合は編集モードで開く
                          startEdit(businessDate);
                        } else {
                          // 新規追加の場合
                          setFormData(prev => ({ ...prev, date: dateKey }));
                          setEditingDate(null);
                          setShowForm(true);
                        }
                      }
                    }}
                    title={dayInfo.isCurrentMonth ? 
                      (businessDate ? 'クリックして編集' : 'クリックして営業日を追加') : 
                      ''
                    }
                  >                    <div className={`text-sm font-medium mb-1 ${
                      dayOfWeek === 0 ? 'text-red-600' : 
                      dayOfWeek === 6 ? 'text-blue-600' : 
                      'text-gray-700'
                    }`}>
                      {dayInfo.date.getDate()}
                    </div>
                    
                    {businessDate ? (
                      <div className="space-y-1">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          businessDate.isHoliday
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {businessDate.isHoliday ? '休日' : '営業'}
                        </div>
                        
                        {businessDate.specialDay && (
                          <div className="text-xs text-orange-600 font-medium">
                            {businessDate.specialDay}
                          </div>
                        )}
                        
                        {businessDate.businessHours && (
                          <div className="text-xs text-gray-600">
                            {(() => {
                              try {
                                const hours = JSON.parse(businessDate.businessHours);
                                return hours.length > 0 ? `${hours[0].startTime}-${hours[0].endTime}` : '';
                              } catch {
                                return '';
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    ) : dayInfo.isCurrentMonth ? (
                      <div className="flex items-center justify-center h-12 text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">+</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // リストビュー
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">営業日一覧 ({getFilteredBusinessDates().length})</h2>
          </div>
          
          {getFilteredBusinessDates().length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {dateFilter === 'all' ? '営業日が設定されていません' : `${dateFilter === '1week' ? '今後1週間' : dateFilter === '1month' ? '今後1カ月' : '今後3カ月'}の営業日が設定されていません`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      曜日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      営業時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      特別日/メモ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredBusinessDates()
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((businessDate) => {
                      let businessHours = [];
                      try {
                        businessHours = businessDate.businessHours ? 
                          JSON.parse(businessDate.businessHours) : [];
                      } catch {
                        // JSONパースに失敗した場合は空配列
                      }

                      return (
                        <tr key={businessDate.date} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(businessDate.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getDayOfWeekName(businessDate.dayOfWeek)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              businessDate.isHoliday 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {businessDate.isHoliday ? '休日' : '営業日'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {businessHours.map((hour: BusinessHour, index: number) => (
                              <div key={index}>
                                {hour.startTime} ～ {hour.endTime}
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {businessDate.specialDay && (
                              <div className="font-medium">{businessDate.specialDay}</div>
                            )}
                            {businessDate.memo && (
                              <div className="text-gray-600">{businessDate.memo}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => startEdit(businessDate)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => deleteBusinessDate(businessDate.date)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
