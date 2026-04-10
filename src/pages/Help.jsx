import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Mail,
  FileText,
  Search,
  Send,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const faqs = [
  {
    question: 'ลูมิน่าคืออะไร?',
    answer: 'ลูมิน่าเป็นผู้ช่วยทางการเงิน AI ที่ช่วยให้คุณจัดการเงินได้ดีขึ้น ไม่ว่าจะเป็นการติดตามรายรับรายจ่าย ตั้งเป้าหมายการออม หรือวางแผนการเงิน'
  },
  {
    question: 'ข้อมูลการเงินของฉันปลอดภัยไหม?',
    answer: 'ใช่! ข้อมูลของคุณถูกจัดเก็บอย่างปลอดภัยใน Firebase และเข้ารหัสทั้งหมด เราไม่มีการเข้าถึงข้อมูลทางการเงินของคุณ'
  },
  {
    question: 'ฉันสามารถเพิ่มรายการย้อนหลังได้ไหม?',
    answer: 'ได้! คุณสามารถเพิ่มรายการย้อนหลังได้โดยเลือกวันที่ต้องการในฟอร์มเพิ่มรายการ'
  },
  {
    question: 'AI แนะนำอะไรได้บ้าง?',
    answer: 'ลูมิน่าสามารถวิเคราะห์พฤติกรรมการใช้จ่ายของคุณ ให้คำแนะนำการออม และช่วยวางแผนเป้าหมายทางการเงิน'
  },
  {
    question: 'มีค่าใช้จ่ายไหม?',
    answer: 'ไม่! แอปนี้ใช้งานฟรี รวมถึง AI Assistant ด้วย'
  },
  {
    question: 'ฉันต้องทำอย่างไรเมื่อลืมรหัสผ่าน?',
    answer: 'หากคุณเข้าสู่ระบบด้วย Google คุณไม่ต้องจำรหัสผ่าน สำหรับการเข้าสู่ระบบด้วยอีเมล กรุณาติดต่อทีมสนับสนุน'
  },
]

export default function Help() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendFeedback = () => {
    if (!feedback.trim()) return
    // บันทึกไว้ใน localStorage (สามารถต่อ API ได้ในอนาคต)
    const existing = JSON.parse(localStorage.getItem('user_feedback') || '[]')
    existing.push({ text: feedback.trim(), date: new Date().toISOString() })
    localStorage.setItem('user_feedback', JSON.stringify(existing))
    setFeedbackSent(true)
    setFeedback('')
    setTimeout(() => setFeedbackSent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="ช่วยเหลือ" onClose={() => navigate('/profile')} back={true} showProfile={false} />
      
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32">
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <Input
            placeholder="ค้นหาคำถามที่พบบ่อย..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 bg-white"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => window.open('mailto:support@lumina.app', '_blank')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-text-primary">อีเมล</p>
              <p className="text-xs text-text-tertiary mt-1">support@lumina.app</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/assistant')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-text-primary">แชทกับ AI</p>
              <p className="text-xs text-text-tertiary mt-1">ถามลูมิน่าได้เลย</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <section className="mb-6">
          <h3 className="font-headline font-bold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            คำถามที่พบบ่อย
          </h3>
          
          <div className="space-y-2">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all ${expandedFaq === index ? 'border-primary/30' : ''}`}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-text-primary flex-1">
                        {faq.question}
                      </p>
                      {expandedFaq === index ? (
                        <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-text-tertiary shrink-0" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <p className="text-sm text-text-secondary mt-3 pt-3 border-t border-border">
                        {faq.answer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-text-secondary">ไม่พบคำถามที่ค้นหา</p>
                  <p className="text-xs text-text-tertiary mt-1">ลองค้นหาด้วยคำอื่น</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Feedback */}
        <section className="mb-6">
          <h3 className="font-headline font-bold text-text-primary mb-4">
            ส่งความคิดเห็น
          </h3>
          <Card>
            <CardContent className="p-4">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="แจ้งปัญหาหรือเสนอแนะ..."
                className="w-full h-24 p-3 rounded-xl border border-border bg-surface-50 resize-none text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
              {feedbackSent && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-secondary-50">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <p className="text-sm text-secondary">ขอบคุณสำหรับความคิดเห็น!</p>
                </div>
              )}
              <Button
                onClick={handleSendFeedback}
                disabled={!feedback.trim() || feedbackSent}
                className="w-full mt-3 bg-gradient-to-r from-primary to-accent border-0"
              >
                <Send className="w-4 h-4 mr-2" />
                ส่งความคิดเห็น
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* App Info */}
        <Card className="bg-surface-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-text-tertiary">
              หากต้องการความช่วยเหลือเพิ่มเติม
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              ติดต่อได้ตลอด 24 ชั่วโมง
            </p>
          </CardContent>
        </Card>

      </main>
      <BottomNav />
    </div>
  )
}
