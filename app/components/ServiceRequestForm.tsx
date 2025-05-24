'use client';

import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import React, { useState } from 'react';

const client = generateClient<Schema>();

interface ItemData {
  itemName: string;
  category: string;
  quantity: number;
  yearsSincePurchase: string;
  size: string;
  notes?: string;
  images?: File[];
}

interface FormData {
  // 住所情報（ステップ1）
  postalCode: string;
  prefecture: string;
  city: string;
  streetNumber: string;
  building: string;
  housingType: string;
  elevatorAvailable: boolean;
  
  // 品物情報（ステップ2）
  itemList: ItemData[];
  
  // 希望日時（ステップ3）
  preferredDate1: string;
  preferredTime1: string;
  preferredDate2: string;
  preferredTime2: string;
  preferredDate3: string;
  preferredTime3: string;
  otherNotes: string;
  
  // お客様情報（ステップ4）
  customerName: string;
  customerNameKana: string;
  customerEmail: string;
  customerPhone: string;
  reasonForUse: string;
  privacyPolicyAgreed: boolean;
}

export default function ServiceRequestForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // 住所情報
    postalCode: '',
    prefecture: '',
    city: '',
    streetNumber: '',
    building: '',
    housingType: '',
    elevatorAvailable: false,
    
    // 品物情報
    itemList: [],
    
    // 希望日時
    preferredDate1: '',
    preferredTime1: '',
    preferredDate2: '',
    preferredTime2: '',
    preferredDate3: '',
    preferredTime3: '',
    otherNotes: '',
    
    // お客様情報
    customerName: '',
    customerNameKana: '',
    customerEmail: '',
    customerPhone: '',
    reasonForUse: '',
    privacyPolicyAgreed: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 都道府県リスト
  const prefectures = [
    '東京都', '千葉県', '埼玉県', '神奈川県', 
    '茨城県', '栃木県', '群馬県', '山梨県'
  ];

  // 品物カテゴリ
  const itemCategories = [
    '家電', '家具', '衣類', 'ブランド品', 
    '貴金属・宝石', '楽器', 'スポーツ用品', 'その他'
  ];

  // 購入からの年数
  const yearsSincePurchaseOptions = [
    '1年未満', '1-2年', '2-3年', '3-4年', '4-5年', '5年以上'
  ];

  // サイズ
  const sizeOptions = ['小', '中', '大'];

  // 時間帯
  const timeSlots = [
    { value: '09:00-12:00', label: '午前 9:00-12:00' },
    { value: '13:00-15:00', label: '午後1 13:00-15:00' },
    { value: '15:00-17:00', label: '午後2 15:00-17:00' },
    { value: '17:00-19:00', label: '夕方 17:00-19:00' }
  ];

  // 利用理由
  const reasonsForUse = [
    '引っ越し', 'リフォーム', '新しい家具の購入', '断捨離', 'その他'
  ];

  // バリデーション関数
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      // 住所情報のバリデーション
      if (!formData.postalCode) {
        newErrors.postalCode = '郵便番号は必須です';
      } else if (!/^\d{3}-\d{4}$/.test(formData.postalCode)) {
        newErrors.postalCode = '正しい郵便番号形式で入力してください（例: 123-4567）';
      }
      
      if (!formData.prefecture) {
        newErrors.prefecture = '都道府県は必須です';
      }
      
      if (!formData.city) {
        newErrors.city = '市区町村は必須です';
      } else if (formData.city.length > 50) {
        newErrors.city = '市区町村は50文字以下で入力してください';
      }
        if (!formData.streetNumber) {
        newErrors.streetNumber = '番地は必須です';
      } else if (formData.streetNumber.length > 50) {
        newErrors.streetNumber = '番地は50文字以下で入力してください';
      }
      
      if (!formData.housingType) {
        newErrors.housingType = '住居種類は必須です';
      }
      
      // マンション・アパートの場合は建物名必須
      if ((formData.housingType === 'マンション' || formData.housingType === 'アパート') && !formData.building) {
        newErrors.building = 'マンション・アパートの場合、建物名・部屋番号は必須です';
      } else if (formData.building && formData.building.length > 50) {
        newErrors.building = '建物名・部屋番号は50文字以下で入力してください';
      }
    }

    if (step === 2) {
      // 品物情報のバリデーション
      if (formData.itemList.length === 0) {
        newErrors.itemList = '最低1つ以上の品物を登録してください';
      } else {
        formData.itemList.forEach((item, index) => {
          if (!item.itemName) {
            newErrors[`item_${index}_itemName`] = '品物名は必須です';
          } else if (item.itemName.length > 50) {
            newErrors[`item_${index}_itemName`] = '品物名は50文字以下で入力してください';
          }
          
          if (!item.category) {
            newErrors[`item_${index}_category`] = 'カテゴリーは必須です';
          }
          
          if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
            newErrors[`item_${index}_quantity`] = '数量は1以上99以下で入力してください';
          }
          
          if (!item.yearsSincePurchase) {
            newErrors[`item_${index}_yearsSincePurchase`] = '購入からの年数は必須です';
          }
          
          if (!item.size) {
            newErrors[`item_${index}_size`] = 'サイズは必須です';
          }
        });
      }
    }    if (step === 3) {
      // 希望日時のバリデーション
      const today = new Date();
      const minDate = new Date(today);
      const maxDate = new Date(today);
      minDate.setDate(today.getDate() + 7); // 7日後
      maxDate.setDate(today.getDate() + 30); // 30日後
      
      const hasDate1 = formData.preferredDate1 && formData.preferredTime1;
      const hasDate2 = formData.preferredDate2 && formData.preferredTime2;
      const hasDate3 = formData.preferredDate3 && formData.preferredTime3;
      
      if (!hasDate1 && !hasDate2 && !hasDate3) {
        newErrors.preferredDate = '少なくとも1つの希望日時を選択してください';
      }
      
      // 各日付のバリデーション
      [
        { date: formData.preferredDate1, time: formData.preferredTime1, field: 'preferredDate1' },
        { date: formData.preferredDate2, time: formData.preferredTime2, field: 'preferredDate2' },
        { date: formData.preferredDate3, time: formData.preferredTime3, field: 'preferredDate3' }
      ].forEach(({ date, time, field }) => {
        if (date) {
          const selectedDate = new Date(date);
          if (selectedDate < minDate) {
            newErrors[field] = '希望日は7日後以降を選択してください';
          } else if (selectedDate > maxDate) {
            newErrors[field] = '希望日は30日後以内を選択してください';
          }
          
          if (!time) {
            newErrors[field.replace('Date', 'Time')] = '日付が選択されている場合、時間帯は必須です';
          }
        }
      });
    }

    if (step === 4) {
      // お客様情報のバリデーション
      if (!formData.customerName) {
        newErrors.customerName = 'お名前は必須です';
      } else if (formData.customerName.length > 30) {
        newErrors.customerName = 'お名前は30文字以下で入力してください';
      }
      
      if (!formData.customerNameKana) {
        newErrors.customerNameKana = 'お名前（フリガナ）は必須です';
      } else if (formData.customerNameKana.length > 30) {
        newErrors.customerNameKana = 'お名前（フリガナ）は30文字以下で入力してください';
      } else if (!/^[ァ-ヶー　\s]+$/.test(formData.customerNameKana)) {
        newErrors.customerNameKana = 'カタカナのみで入力してください';
      }
      
      if (!formData.customerEmail) {
        newErrors.customerEmail = 'メールアドレスは必須です';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
        newErrors.customerEmail = '正しいメールアドレス形式で入力してください';
      }
      
      if (!formData.customerPhone) {
        newErrors.customerPhone = '電話番号は必須です';
      } else if (!/^\d{2,4}-\d{2,4}-\d{4}$/.test(formData.customerPhone)) {
        newErrors.customerPhone = '正しい電話番号形式で入力してください（例: 090-1234-5678）';
      }
      
      if (!formData.privacyPolicyAgreed) {
        newErrors.privacyPolicyAgreed = 'プライバシーポリシーへの同意は必須です';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // アイテム操作関数
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      itemList: [
        ...prev.itemList,
        {
          itemName: '',
          category: '',
          quantity: 1,
          yearsSincePurchase: '',
          size: '',
          notes: '',
          images: []
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemList: prev.itemList.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof ItemData, value: any) => {
    setFormData(prev => ({
      ...prev,
      itemList: prev.itemList.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // ステップ操作
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data } = await client.models.ServiceRequest.create({
        category: 'PURCHASE_REQUEST',
        status: 'NEW',
        customerName: formData.customerName,
        customerNameKana: formData.customerNameKana,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        reasonForUse: formData.reasonForUse,
        postalCode: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        streetNumber: formData.streetNumber,
        building: formData.building,
        housingType: formData.housingType,
        elevatorAvailable: formData.elevatorAvailable,
        preferredDate1: formData.preferredDate1,
        preferredTime1: formData.preferredTime1,
        preferredDate2: formData.preferredDate2,
        preferredTime2: formData.preferredTime2,
        preferredDate3: formData.preferredDate3,
        preferredTime3: formData.preferredTime3,
        otherNotes: formData.otherNotes,
        itemList: JSON.stringify(formData.itemList)
      });
      
      if (data) {
        setMessage('買取依頼が正常に送信されました！');
        // フォームをリセット
        setCurrentStep(1);
        setFormData({
          postalCode: '',
          prefecture: '',
          city: '',
          streetNumber: '',
          building: '',
          housingType: '',
          elevatorAvailable: false,
          itemList: [],
          preferredDate1: '',
          preferredTime1: '',
          preferredDate2: '',
          preferredTime2: '',
          preferredDate3: '',
          preferredTime3: '',
          otherNotes: '',
          customerName: '',
          customerNameKana: '',
          customerEmail: '',
          customerPhone: '',
          reasonForUse: '',
          privacyPolicyAgreed: false,
        });
      }
    } catch (error) {
      console.error('送信エラー:', error);
      setMessage('送信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 今日から30日後までの日付を取得
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 7; i <= 30; i++) { // 7日後から30日後まで
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // ステップタイトル
  const stepTitles = [
    '住所情報',
    '品物情報',
    '希望日時',
    'お客様情報'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        買取依頼フォーム
      </h2>

      {/* ステップインジケーター */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                currentStep > index + 1 ? 'bg-green-500' : 
                currentStep === index + 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="ml-2 text-sm font-medium text-gray-700">
                {title}
              </div>
              {index < stepTitles.length - 1 && (
                <div className="w-16 h-1 bg-gray-300 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded ${
          message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ステップ1: 住所情報 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">住所情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="123-4567"
                />
                {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => setFormData(prev => ({ ...prev, prefecture: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {prefectures.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
                {errors.prefecture && <p className="text-red-500 text-sm mt-1">{errors.prefecture}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市区町村 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  maxLength={50}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  番地 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.streetNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, streetNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  maxLength={50}
                />
                {errors.streetNumber && <p className="text-red-500 text-sm mt-1">{errors.streetNumber}</p>}
              </div>
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住居種類 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="マンション"
                    checked={formData.housingType === 'マンション'}
                    onChange={(e) => setFormData(prev => ({ ...prev, housingType: e.target.value }))}
                    className="mr-2"
                  />
                  マンション
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="アパート"
                    checked={formData.housingType === 'アパート'}
                    onChange={(e) => setFormData(prev => ({ ...prev, housingType: e.target.value }))}
                    className="mr-2"
                  />
                  アパート
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="戸建て"
                    checked={formData.housingType === '戸建て'}
                    onChange={(e) => setFormData(prev => ({ ...prev, housingType: e.target.value }))}
                    className="mr-2"
                  />
                  戸建て
                </label>
              </div>
              {errors.housingType && <p className="text-red-500 text-sm mt-1">{errors.housingType}</p>}
            </div>

            {(formData.housingType === 'マンション' || formData.housingType === 'アパート') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  建物名・部屋番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  maxLength={50}
                  placeholder="例: ○○マンション 101号室"
                />
                {errors.building && <p className="text-red-500 text-sm mt-1">{errors.building}</p>}
              </div>            )}

            {(formData.housingType === 'マンション' || formData.housingType === 'アパート') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  エレベーターの有無
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="elevator"
                      checked={formData.elevatorAvailable === true}
                      onChange={() => setFormData(prev => ({ ...prev, elevatorAvailable: true }))}
                      className="mr-2"
                    />
                    あり
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="elevator"
                      checked={formData.elevatorAvailable === false}
                      onChange={() => setFormData(prev => ({ ...prev, elevatorAvailable: false }))}
                      className="mr-2"
                    />
                    なし
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ステップ2: 品物情報 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">品物情報</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                品物を追加
              </button>
            </div>

            {errors.itemList && <p className="text-red-500 text-sm">{errors.itemList}</p>}

            {formData.itemList.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">品物 {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      品物名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      maxLength={50}
                    />
                    {errors[`item_${index}_itemName`] && 
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_itemName`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリー <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    >
                      <option value="">選択してください</option>
                      {itemCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors[`item_${index}_category`] && 
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_category`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      数量 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      min="1"
                      max="99"
                    />
                    {errors[`item_${index}_quantity`] && 
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_quantity`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      購入からの年数 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.yearsSincePurchase}
                      onChange={(e) => updateItem(index, 'yearsSincePurchase', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    >
                      <option value="">選択してください</option>
                      {yearsSincePurchaseOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors[`item_${index}_yearsSincePurchase`] && 
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_yearsSincePurchase`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      サイズ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.size}
                      onChange={(e) => updateItem(index, 'size', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    >
                      <option value="">選択してください</option>
                      {sizeOptions.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    {errors[`item_${index}_size`] && 
                      <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_size`]}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備考
                    </label>
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.itemList.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                品物を追加してください
              </div>
            )}
          </div>
        )}

        {/* ステップ3: 希望日時 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">希望日時</h3>
            
            {errors.preferredDate && <p className="text-red-500 text-sm">{errors.preferredDate}</p>}            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第1希望日 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.preferredDate1}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate1: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </option>
                  ))}
                </select>
                {errors.preferredDate1 && <p className="text-red-500 text-sm mt-1">{errors.preferredDate1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第1希望時間帯 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.preferredTime1}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime1: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.preferredTime1 && <p className="text-red-500 text-sm mt-1">{errors.preferredTime1}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第2希望日
                </label>
                <select
                  value={formData.preferredDate2}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate2: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </option>                  ))}
                </select>
                {errors.preferredDate2 && <p className="text-red-500 text-sm mt-1">{errors.preferredDate2}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第2希望時間帯
                </label>
                <select
                  value={formData.preferredTime2}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime2: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.preferredTime2 && <p className="text-red-500 text-sm mt-1">{errors.preferredTime2}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第3希望日
                </label>
                <select
                  value={formData.preferredDate3}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate3: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </option>                  ))}
                </select>
                {errors.preferredDate3 && <p className="text-red-500 text-sm mt-1">{errors.preferredDate3}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  第3希望時間帯
                </label>
                <select
                  value={formData.preferredTime3}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime3: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {errors.preferredTime3 && <p className="text-red-500 text-sm mt-1">{errors.preferredTime3}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                その他備考
              </label>
              <textarea
                value={formData.otherNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, otherNotes: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                placeholder="その他ご要望等がございましたらご記入ください"
              />
            </div>
          </div>
        )}

        {/* ステップ4: お客様情報 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">お客様情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  maxLength={30}
                />
                {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前（フリガナ） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerNameKana}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerNameKana: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  maxLength={30}
                  placeholder="タナカ タロウ"
                />
                {errors.customerNameKana && <p className="text-red-500 text-sm mt-1">{errors.customerNameKana}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
              {errors.customerEmail && <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="090-1234-5678"
              />
              {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ご利用理由
              </label>
              <select
                value={formData.reasonForUse}
                onChange={(e) => setFormData(prev => ({ ...prev, reasonForUse: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                {reasonsForUse.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.privacyPolicyAgreed}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacyPolicyAgreed: e.target.checked }))}
                  className="mr-2 mt-1"
                />
                <span className="text-sm text-gray-700">
                  <span className="text-red-500">*</span>
                  プライバシーポリシーに同意します
                </span>
              </label>
              {errors.privacyPolicyAgreed && <p className="text-red-500 text-sm mt-1">{errors.privacyPolicyAgreed}</p>}
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-md font-medium ${
              currentStep === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            前へ
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600"
            >
              次へ
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? '送信中...' : '買取依頼を送信'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
