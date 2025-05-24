'use client';

import type { Schema } from '@/amplify/data/resource';
import outputs from '@/amplify_outputs.json';
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';
import './../app/app.css';
import AdminDashboard from './components/AdminDashboard';
import BusinessDateManager from './components/BusinessDateManager';
import ContactInquiryForm from './components/ContactInquiryForm';
import ServiceRequestForm from './components/ServiceRequestForm';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'business' | 'contact'>('form');
  const [categories, setCategories] = useState<Array<Schema['FormItemCategory']['type']>>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);

  const { user, signOut } = useAuthenticator();

  // 初期カテゴリデータを作成
  useEffect(() => {
    createInitialCategories();
  }, []);

  // Cognitoグループを取得
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (user) {
        try {
          const session = await fetchAuthSession();
          const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
          setUserGroups(groups);
          console.log('User groups:', groups);
        } catch (error) {
          console.error('Error fetching user groups:', error);
          setUserGroups([]);
        }
      } else {
        setUserGroups([]);
      }
    };
    fetchUserGroups();
  }, [user]);

  const createInitialCategories = async () => {
    try {
      // 既存のカテゴリをチェック
      const { data: existingCategories } = await client.models.FormItemCategory.list();
      
      if (existingCategories && existingCategories.length === 0) {
        // 初期カテゴリを作成
        const initialCategories = [
          { name: '家具', sort: 1, delFlg: false },
          { name: '家電', sort: 2, delFlg: false },
          { name: '衣類', sort: 3, delFlg: false },
          { name: '書籍', sort: 4, delFlg: false },
          { name: '楽器', sort: 5, delFlg: false },
          { name: 'スポーツ用品', sort: 6, delFlg: false },
          { name: 'その他', sort: 7, delFlg: false },
        ];

        for (const category of initialCategories) {
          await client.models.FormItemCategory.create(category);
        }
      }

      // カテゴリ一覧を取得
      const { data } = await client.models.FormItemCategory.list();
      setCategories(data || []);
    } catch (error) {
      console.error('カテゴリの初期化に失敗しました:', error);
    }
  };

  // ユーザーの権限をチェック（Cognitoグループから取得）
  const isAdmin = userGroups.includes('admins');
  const isStaff = isAdmin || userGroups.includes('staff');

  return (
    <div className="h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                MAMY サービス管理システム
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                ようこそ, {user?.signInDetails?.loginId}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                サインアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">            <button
              onClick={() => setActiveTab('form')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              サービスリクエスト
            </button>
            
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              お問い合わせ
            </button>
            
            {isStaff && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                管理ダッシュボード
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => setActiveTab('business')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'business'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                営業日管理
              </button>
            )}
          </div>
        </div>
      </nav>      {/* メインコンテンツ */}
      <main className="py-8">
        {activeTab === 'form' && <ServiceRequestForm />}
        {activeTab === 'contact' && <ContactInquiryForm />}
        {activeTab === 'admin' && isStaff && <AdminDashboard />}
        {activeTab === 'business' && isAdmin && <BusinessDateManager />}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>MAMY サービス管理システム - AWS Amplify Gen2で構築</p>
            <p className="mt-2">
              🎉 システムが正常に動作しています。
              <br />
              <a 
                href="https://docs.amplify.aws/gen2/build-a-backend/data/" 
                className="text-blue-500 hover:text-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Amplify Gen2 データモデリングドキュメント
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
