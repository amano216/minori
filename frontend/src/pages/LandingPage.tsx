import { Link } from 'react-router-dom';
import { Calendar, Users, BarChart3, ArrowRight, Sparkles, Smartphone, Clock, Shield } from 'lucide-react';
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
              Log in
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" className="rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Schedule.<br />
            Simplified.
          </h1>
          
          <div className="flex justify-center mb-16">
            <Link to="/signup">
              <Button variant="primary" size="lg" className="rounded-full px-8 py-6 text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1">
                Start Free Trial
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Smart Scheduling</h3>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Team Sync</h3>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Mobile First</h3>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Analytics</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase - iPhone Style */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-20">
            {/* Visual 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[3rem] transform rotate-6 group-hover:rotate-3 transition-transform duration-500"></div>
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 w-80 h-[36rem] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <Clock className="w-8 h-8 text-indigo-600" />
                  <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-32 bg-indigo-50 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold">10</div>
                    <div className="h-2 w-20 bg-indigo-200 rounded"></div>
                  </div>
                  <div className="h-32 bg-gray-50 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-400">13</div>
                    <div className="h-2 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-32 bg-gray-50 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-400">15</div>
                    <div className="h-2 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual 2 */}
            <div className="relative group mt-20 md:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tl from-green-100 to-teal-100 rounded-[3rem] transform -rotate-6 group-hover:-rotate-3 transition-transform duration-500"></div>
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 w-80 h-[36rem] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                      <div className="space-y-2">
                        <div className="h-2 w-24 bg-gray-200 rounded"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-12">
            Ready?
          </h2>
          <Link to="/signup">
            <Button variant="primary" size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-12 py-6 text-xl font-bold">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 text-center text-gray-400 text-sm">
        <div className="container mx-auto px-6">
          <p>© 2025 Minori</p>
        </div>
      </footer>
    </div>
  );
}
