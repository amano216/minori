import { Link } from 'react-router-dom';
import { Calendar, Users, BarChart3, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/atoms/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Minori</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              ログイン
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="md">
                無料で始める
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            訪問看護スケジュール管理を
            <br />
            <span className="text-indigo-600">もっとシンプルに</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Minoriは、訪問看護ステーション向けの直感的なスケジュール管理システムです。
            <br />
            スタッフ配置の最適化から患者管理まで、すべてを一つのプラットフォームで。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4">
                今すぐ無料で始める
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                機能を見る
              </Button>
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            クレジットカード不要 • 14日間無料トライアル • いつでもキャンセル可能
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          Minoriの主な機能
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              直感的なスケジュール管理
            </h3>
            <p className="text-gray-600 leading-relaxed">
              ドラッグ&ドロップで簡単に訪問予定を調整。タイムライン、週次、患者別ビューで最適な表示が可能。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              スタッフ・患者管理
            </h3>
            <p className="text-gray-600 leading-relaxed">
              スタッフの資格や稼働時間を管理し、患者の情報を一元化。最適なマッチングを実現。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              レポート・分析
            </h3>
            <p className="text-gray-600 leading-relaxed">
              訪問実績、稼働率、未割当訪問などをリアルタイムで可視化。データドリブンな意思決定を支援。
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Minoriを選ぶ理由
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              '導入後、スケジュール調整時間を平均50%削減',
              '未割当訪問を80%削減し、訪問の取りこぼしを防止',
              'モバイル対応で、外出先からでもスケジュール確認',
              '組織階層管理で複数事業所の一元管理が可能',
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            今すぐMinoriを始めましょう
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            14日間の無料トライアルで、すべての機能をお試しいただけます。
          </p>
          <Link to="/signup">
            <Button variant="primary" size="lg" className="text-lg px-10 py-4">
              無料で始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">Minori</span>
          </div>
          <p className="text-gray-400 mb-6">
            訪問看護スケジュール管理システム
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              利用規約
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              プライバシーポリシー
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              お問い合わせ
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            © 2025 Minori. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
