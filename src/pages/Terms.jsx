import { useNavigate } from 'react-router-dom'
import { 
  FileText,
  Shield,
  Lock,
  Eye,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

export default function Terms() {
  const navigate = useNavigate()

  const sections = [
    {
      icon: Shield,
      title: 'การยอมรับข้อกำหนด',
      content: 'การใช้งานแอปพลิเคชันลูมิน่า ถือว่าคุณยอมรับข้อกำหนดและเงื่อนไขการใช้งานทั้งหมด หากคุณไม่เห็นด้วยกับข้อกำหนดใดๆ กรุณาหยุดใช้งานแอป'
    },
    {
      icon: Lock,
      title: 'ความเป็นเจ้าของเนื้อหา',
      content: 'คุณยังคงเป็นเจ้าของเนื้อหาทั้งหมดที่คุณสร้างขึ้นในแอป รวมถึงข้อมูลการเงินของคุณ เราไม่อ้างสิทธิ์ใดๆ ในเนื้อหาของคุณ'
    },
    {
      icon: Eye,
      title: 'ความเป็นส่วนตัว',
      content: 'ข้อมูลส่วนบุคคลของคุณจะถูกจัดเก็บและประมวลผลตามนโยบายความเป็นส่วนตัวของเรา เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ'
    },
    {
      icon: Shield,
      title: 'การใช้งาน AI',
      content: 'AI Assistant (ลูมิน่า) เป็นเครื่องมือให้คำแนะนำเท่านั้น คำแนะนำจาก AI ไม่ถือเป็นคำแนะนำทางการเงินหรือการลงทุน คุณควรปรึกษาผู้เชี่ยวชาญด้านการเงินก่อนตัดสินใจ'
    },
    {
      icon: Lock,
      title: 'ความรับผิด',
      content: 'แอปนี้จัดทำขึ้น "ตามที่เป็น" โดยไม่มีการรับประกันใดๆ เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้งานแอป รวมถึงการสูญเสียข้อมูลหรือกำไร'
    },
    {
      icon: FileText,
      title: 'การเปลี่ยนแปลงข้อกำหนด',
      content: 'เราอาจเปลี่ยนแปลงข้อกำหนดนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ทราบล่วงหน้าผ่านแอป การใช้งานต่อเนื่องถือว่ายอมรับข้อกำหนดใหม่'
    },
  ]

  const lastUpdated = '10 เมษายน 2569'

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="เงื่อนไขการใช้" onClose={() => navigate('/profile')} />
      
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-headline text-2xl font-bold text-text-primary mb-2">
            ข้อกำหนดการใช้งาน
          </h1>
          <p className="text-sm text-text-tertiary">
            อัปเดตล่าสุด: {lastUpdated}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4 mb-6">
          {sections.map(({ icon: Icon, title, content }) => (
            <Card key={title}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-text-primary mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agreement */}
        <Card className="bg-gradient-to-r from-primary-50 to-white border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <p className="font-semibold text-text-primary">ยอมรับทุกข้อกำหนด</p>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              โดยการใช้งานแอปลูมิน่า คุณยืนยันว่าได้อ่านและเข้าใจข้อกำหนดการใช้งานนี้แล้ว 
              และยอมรับที่จะปฏิบัติตามข้อกำหนดดังกล่าว
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mt-6 bg-surface-50">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-text-secondary mb-2">
              มีคำถามเกี่ยวกับข้อกำหนดการใช้งาน?
            </p>
            <p className="text-xs text-text-tertiary">
              ติดต่อได้ที่ <span className="text-primary">support@lumina.app</span>
            </p>
          </CardContent>
        </Card>

      </main>
      <BottomNav />
    </div>
  )
}
