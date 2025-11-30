import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight, Sparkles, Smartphone, RefreshCw, Heart } from 'lucide-react';
import { Button } from '../components/atoms/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight">Minori</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              ログイン
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" className="rounded-full px-6">
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <p className="text-lg md:text-xl text-indigo-600 font-medium mb-4">
            訪問看護のためのスケジュール管理
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            現場を、もっと<br />
            スムーズに。
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            ドラッグ&ドロップで簡単スケジューリング。<br className="hidden md:block" />
            患者情報も、チーム連携も、これひとつで。
          </p>
          
          <div className="flex justify-center mb-16">
            <Link to="/signup">
              <Button variant="primary" size="lg" className="rounded-full px-8 py-6 text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1">
                無料トライアルを始める
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* App Mockup Visual */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-20 animate-pulse"></div>
            <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl border-8 border-gray-900 aspect-[16/10] overflow-hidden">
              {/* Mockup Content */}
              <div className="bg-white w-full h-full rounded-xl overflow-hidden flex flex-col">
                {/* Mockup Header */}
                <div className="h-12 border-b flex items-center px-4 gap-2 bg-gray-50">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {/* Mockup Body - Abstract UI */}
                <div className="flex-1 p-6 flex gap-6 bg-gray-50/50">
                  {/* Sidebar */}
                  <div className="w-48 hidden md:block space-y-3">
                    <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-8 w-full bg-indigo-50 rounded-lg border border-indigo-100"></div>
                    <div className="h-8 w-40 bg-gray-100 rounded-lg"></div>
                    <div className="h-8 w-36 bg-gray-100 rounded-lg"></div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-10 w-48 bg-gray-200 rounded-lg"></div>
                      <div className="flex gap-2">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="h-10 w-24 bg-indigo-600 rounded-full"></div>
                      </div>
                    </div>
                    {/* Calendar Grid Abstract */}
                    <div className="grid grid-cols-7 gap-2 h-64">
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-6 w-full bg-gray-100 rounded text-center text-xs text-gray-400 py-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                          </div>
                          <div className={`h-24 w-full rounded-lg p-2 ${i % 2 === 0 ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-gray-100'}`}>
                            {i % 2 === 0 && <div className="h-2 w-12 bg-indigo-200 rounded mb-1"></div>}
                          </div>
                          <div className={`h-20 w-full rounded-lg p-2 ${i % 3 === 0 ? 'bg-purple-50 border border-purple-100' : 'bg-white border border-gray-100'}`}>
                             {i % 3 === 0 && <div className="h-2 w-12 bg-purple-200 rounded mb-1"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Features Grid */}
      <section className="py-32 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            訪問看護に必要な機能を、ひとつに
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            複雑なスケジュール調整も、患者情報の管理も、チームの連携も。
            Minoriがすべてをシンプルにします。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">訪問予定管理</h3>
              <p className="text-sm text-gray-500">ドラッグ&ドロップで<br />かんたんスケジューリング</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">パターン機能</h3>
              <p className="text-sm text-gray-500">定期訪問を<br />自動でスケジュール生成</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">患者・ケア管理</h3>
              <p className="text-sm text-gray-500">患者情報とケア内容を<br />一元管理</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">チーム連携</h3>
              <p className="text-sm text-gray-500">グループでスケジュール共有<br />リアルタイム同期</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase - iPhone Style */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-20">
            {/* Visual 1 - モバイル対応 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[3rem] transform rotate-6 group-hover:rotate-3 transition-transform duration-500"></div>
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 w-80 h-[36rem] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <Smartphone className="w-8 h-8 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-400">モバイル対応</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">外出先でも<br />かんたん確認</h3>
                <p className="text-gray-600 mb-8">訪問先への移動中も、スマートフォンでスケジュールを確認・変更できます。</p>
                <div className="space-y-4 mt-auto">
                  <div className="h-16 bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">9:00</div>
                    <div>
                      <div className="text-sm font-medium">山田 太郎さん</div>
                      <div className="text-xs text-gray-500">バイタル測定・服薬確認</div>
                    </div>
                  </div>
                  <div className="h-16 bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">10:30</div>
                    <div>
                      <div className="text-sm font-medium">佐藤 花子さん</div>
                      <div className="text-xs text-gray-500">リハビリ</div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">13:00</div>
                    <div>
                      <div className="text-sm font-medium">鈴木 一郎さん</div>
                      <div className="text-xs text-gray-500">褥瘡処置</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual 2 - ダブルブッキング防止 */}
            <div className="relative group mt-20 md:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tl from-green-100 to-teal-100 rounded-[3rem] transform -rotate-6 group-hover:-rotate-3 transition-transform duration-500"></div>
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 w-80 h-[36rem] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-400">安心設計</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">ダブルブッキングを<br />自動で防止</h3>
                <p className="text-gray-600 mb-8">同じ時間帯への重複予約を自動検出。予約ミスを未然に防ぎます。</p>
                <div className="space-y-4 mt-auto">
                  <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">スケジュール確定</span>
                    </div>
                    <p className="text-xs text-green-600">田中さん 9:00-10:00</p>
                  </div>
                  <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-amber-700">競合を検出</span>
                    </div>
                    <p className="text-xs text-amber-600">9:30に別の予定があります</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">楽観的ロックで同時編集も安心</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            訪問看護の未来を、<br className="md:hidden" />
            一緒に。
          </h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">
            無料トライアルでMinoriの使いやすさを体験してください。<br />
            クレジットカード不要で今すぐ始められます。
          </p>
          <Link to="/signup">
            <Button variant="primary" size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-12 py-6 text-xl font-bold">
              無料で始める
            </Button>
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 text-center text-gray-400 text-sm">
        <div className="container mx-auto px-6">
          <p>© 2025 Minori. 訪問看護のためのスケジュール管理</p>
        </div>
      </footer>
    </div>
  );
}
