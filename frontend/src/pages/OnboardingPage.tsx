import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Building, 
  Users, 
  UserPlus, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Label } from '../components/atoms/Label';
import { Card } from '../components/molecules/Card';
import { useToast } from '../contexts/ToastContext';

type Step = 1 | 2 | 3 | 4;

interface Office {
  name: string;
  teams: string[];
}

interface StaffInvite {
  email: string;
  name: string;
  role: string;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Offices
  const [offices, setOffices] = useState<Office[]>([{ name: '', teams: [] }]);
  
  // Step 2: Teams
  const [currentOfficeIndex, setCurrentOfficeIndex] = useState(0);
  const [teamName, setTeamName] = useState('');
  
  // Step 3: Staff invites
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');

  const handleAddOffice = () => {
    setOffices([...offices, { name: '', teams: [] }]);
  };

  const handleRemoveOffice = (index: number) => {
    setOffices(offices.filter((_, i) => i !== index));
  };

  const handleOfficeNameChange = (index: number, name: string) => {
    const newOffices = [...offices];
    newOffices[index].name = name;
    setOffices(newOffices);
  };

  const handleAddTeam = () => {
    if (!teamName.trim()) return;
    
    const newOffices = [...offices];
    newOffices[currentOfficeIndex].teams.push(teamName);
    setOffices(newOffices);
    setTeamName('');
  };

  const handleRemoveTeam = (officeIndex: number, teamIndex: number) => {
    const newOffices = [...offices];
    newOffices[officeIndex].teams = newOffices[officeIndex].teams.filter((_, i) => i !== teamIndex);
    setOffices(newOffices);
  };

  const handleAddStaffInvite = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    
    setStaffInvites([
      ...staffInvites,
      { email: inviteEmail, name: inviteName, role: inviteRole }
    ]);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('staff');
  };

  const handleRemoveStaffInvite = (index: number) => {
    setStaffInvites(staffInvites.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast('success', 'セットアップが完了しました！');
      navigate('/schedule');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'セットアップに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedStep1 = offices.some(o => o.name.trim());
  const canProceedStep2 = true; // Teams are optional
  const canProceedStep3 = true; // Staff invites are optional

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Minori</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">初期設定</h1>
          <p className="text-gray-600">わずか3ステップで設定完了</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={step >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
              事業所
            </span>
            <span className={step >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
              チーム
            </span>
            <span className={step >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
              スタッフ招待
            </span>
            <span className={step >= 4 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
              完了
            </span>
          </div>
        </div>

        <Card className="p-8">
          {/* Step 1: Offices */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">事業所を登録</h2>
                <p className="text-gray-600 mt-2">
                  管理する事業所を追加してください（後から追加・編集可能）
                </p>
              </div>

              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      type="text"
                      value={office.name}
                      onChange={(e) => handleOfficeNameChange(index, e.target.value)}
                      placeholder={`事業所${index + 1}の名前`}
                      className="flex-1"
                    />
                    {offices.length > 1 && (
                      <button
                        onClick={() => handleRemoveOffice(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                onClick={handleAddOffice}
                className="w-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                事業所を追加
              </Button>
            </div>
          )}

          {/* Step 2: Teams */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">チームを登録</h2>
                <p className="text-gray-600 mt-2">
                  各事業所にチームを追加できます（任意）
                </p>
              </div>

              <div className="space-y-6">
                {offices.map((office, officeIndex) => (
                  <div key={officeIndex} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3">{office.name || `事業所${officeIndex + 1}`}</h3>
                    
                    <div className="space-y-2 mb-3">
                      {office.teams.map((team, teamIndex) => (
                        <div
                          key={teamIndex}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-gray-700">{team}</span>
                          <button
                            onClick={() => handleRemoveTeam(officeIndex, teamIndex)}
                            className="text-red-600 hover:bg-red-100 rounded p-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {currentOfficeIndex === officeIndex && (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="チーム名"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTeam())}
                          className="flex-1"
                        />
                        <Button onClick={handleAddTeam} disabled={!teamName.trim()}>
                          追加
                        </Button>
                      </div>
                    )}
                    
                    {currentOfficeIndex !== officeIndex && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentOfficeIndex(officeIndex)}
                        className="w-full"
                      >
                        チームを追加
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Staff Invites */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <UserPlus className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">スタッフを招待</h2>
                <p className="text-gray-600 mt-2">
                  スタッフにメールで招待を送信できます（後から追加可能）
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="inviteName">氏名</Label>
                    <Input
                      id="inviteName"
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inviteEmail">メールアドレス</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="yamada@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inviteRole">役割</Label>
                    <select
                      id="inviteRole"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="staff">スタッフ</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddStaffInvite}
                  disabled={!inviteEmail.trim() || !inviteName.trim()}
                  className="w-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  招待リストに追加
                </Button>
              </div>

              {staffInvites.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">氏名</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">メールアドレス</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">役割</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffInvites.map((invite, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 text-sm">{invite.name}</td>
                          <td className="px-4 py-3 text-sm">{invite.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {invite.role === 'admin' ? '管理者' : 'スタッフ'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveStaffInvite(index)}
                              className="text-red-600 hover:bg-red-50 rounded p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">セットアップ完了！</h2>
                <p className="text-lg text-gray-600">
                  Minoriを使い始める準備が整いました
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
                <h3 className="font-bold text-gray-900 mb-3">登録内容</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Building className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>事業所: {offices.filter(o => o.name).length}件</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>チーム: {offices.reduce((acc, o) => acc + o.teams.length, 0)}件</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <UserPlus className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>招待: {staffInvites.length}件</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleFinish}
                disabled={isLoading}
                className="w-full max-w-md mx-auto"
              >
                {isLoading ? '処理中...' : 'Minoriを開始'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBack}
                disabled={step === 1}
                className="flex-1"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                戻る
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }
                className="flex-1"
              >
                {step === 3 ? '確認' : '次へ'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </Card>

        {/* Skip Link */}
        {step < 4 && (
          <p className="text-center mt-6 text-gray-600">
            <button
              onClick={() => navigate('/schedule')}
              className="text-indigo-600 hover:underline font-medium"
            >
              スキップして後で設定
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
