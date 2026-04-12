import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Moon,
  Sun,
  Palette,
  CheckCircle2,
  ChevronRight,
  Globe,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useTheme } from '@/contexts/ThemeContext'

const colorThemes = [
  { id: 'blue', name: 'น้ำเงิน', color: '#5B7FFF', gradient: 'from-[#5B7FFF] to-[#8B5CF6]' },
  { id: 'green', name: 'เขียว', color: '#10B981', gradient: 'from-[#10B981] to-[#059669]' },
  { id: 'purple', name: 'ม่วง', color: '#8B5CF6', gradient: 'from-[#8B5CF6] to-[#7C3AED]' },
  { id: 'pink', name: 'ชมพู', color: '#EC4899', gradient: 'from-[#EC4899] to-[#DB2777]' },
  { id: 'orange', name: 'ส้ม', color: '#F59E0B', gradient: 'from-[#F59E0B] to-[#D97706]' },
  { id: 'teal', name: 'เทียว', color: '#14B8A6', gradient: 'from-[#14B8A6] to-[#0D9488]' },
]

const fontSizes = [
  { id: 'small', name: 'เล็ก', scale: 0.875 },
  { id: 'medium', name: 'ปกติ', scale: 1 },
  { id: 'large', name: 'ใหญ่', scale: 1.125 },
]

export default function Settings() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useTheme()
  const [theme, setTheme] = useState('blue')
  const [fontSize, setFontSize] = useState('medium')
  const [currency, setCurrency] = useState('THB')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setTheme(settings.theme || 'blue')
        setFontSize(settings.fontSize || 'medium')
        setCurrency(settings.currency || 'THB')
        // Font size apply
        const scaleMap = { small: '87.5%', medium: '100%', large: '112.5%' }
        document.documentElement.style.fontSize = scaleMap[settings.fontSize || 'medium']
      }
    } catch { /* ignore */ }
  }, [])

  const handleSave = () => {
    const settings = { theme, darkMode, fontSize, currency }
    localStorage.setItem('app_settings', JSON.stringify(settings))
    // Apply font size
    const scaleMap = { small: '87.5%', medium: '100%', large: '112.5%' }
    document.documentElement.style.fontSize = scaleMap[fontSize] || '100%'
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currencies = [
    { id: 'THB', name: 'บาทไทย', symbol: '฿', code: 'THB' },
    { id: 'USD', name: 'ดอลลาร์สหรัฐ', symbol: '$', code: 'USD' },
    { id: 'EUR', name: 'ยูโร', symbol: '€', code: 'EUR' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="ตั้งค่า" onClose={() => navigate('/profile')} back={true} showProfile={false} />
      
      <main className="max-w-lg mx-auto px-5 page-top pb-32">
        
        {/* Theme Selection */}
        <section className="mb-6">
          <h3 className="font-headline font-bold text-text-primary mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            ธีมสี
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {colorThemes.map(({ id, name, color, gradient }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === id 
                    ? 'border-primary shadow-md scale-105' 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} mx-auto mb-2`} />
                <p className="text-sm font-medium text-text-primary">{name}</p>
                {theme === id && (
                  <CheckCircle2 className="w-5 h-5 text-primary mx-auto mt-2" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Dark Mode */}
        <section className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-warning-50'} flex items-center justify-center`}>
                    {darkMode ? (
                      <Moon className="w-6 h-6 text-white" />
                    ) : (
                      <Sun className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">โหมดมืด</p>
                    <p className="text-xs text-text-tertiary">ปิดไฟเพื่อลดความเมื่อยล้าสายตา</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleDarkMode()}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    darkMode ? 'bg-primary' : 'bg-surface-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Font Size */}
        <section className="mb-6">
          <h3 className="font-headline font-bold text-text-primary mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            ขนาดตัวอักษร
          </h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                {fontSizes.map(({ id, name, scale }) => (
                  <button
                    key={id}
                    onClick={() => setFontSize(id)}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      fontSize === id 
                        ? 'border-primary bg-primary-50' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <p 
                      className="font-medium text-text-primary"
                      style={{ fontSize: `${14 * scale}px` }}
                    >
                      {name}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">Aa</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Currency */}
        <section className="mb-6">
          <h3 className="font-headline font-bold text-text-primary mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            สกุลเงิน
          </h3>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {currencies.map(({ id, name, symbol, code }) => (
                  <button
                    key={id}
                    onClick={() => setCurrency(id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      currency === id 
                        ? 'border-primary bg-primary-50' 
                        : 'border-transparent hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-text-primary">{symbol}</span>
                      <div className="text-left">
                        <p className="font-medium text-text-primary">{name}</p>
                        <p className="text-xs text-text-tertiary">{code}</p>
                      </div>
                    </div>
                    {currency === id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className={`w-full h-12 ${saved ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-accent'} border-0`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              บันทึกแล้ว!
            </>
          ) : (
            'บันทึกการตั้งค่า'
          )}
        </Button>

      </main>
      <BottomNav />
    </div>
  )
}
