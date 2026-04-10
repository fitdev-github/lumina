import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Heart, TrendingUp, PiggyBank, Target, Loader2, Plus, History, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useConversations } from '@/hooks/useConversations'
import { useFinance } from '@/contexts/FinanceContext'
import { useAuth } from '@/contexts/AuthContext'
import { chat } from '@/services/groqService'
import { addMessage } from '@/services/conversationService'

const aiName = 'ลูมิน่า'

const suggestions = [
  { icon: PiggyBank, label: 'ฉันควรออมเท่าไหร่?', query: 'ฉันควรออมเท่าไหร่ในแต่ละเดือน?' },
  { icon: TrendingUp, label: 'วิเคราะห์ค่าใช้จ่าย', query: 'วิเคราะห์ค่าใช้จ่ายของฉันเดือนนี้หน่อยได้ไหมคะ?' },
  { icon: Target, label: 'ช่วยตั้งเป้าหมาย', query: 'ช่วยแนะนำการตั้งเป้าหมายการเงินให้หน่อยได้ไหมคะ?' },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const finance = useFinance()
  const { user } = useAuth()
  const { 
    conversations, 
    currentConversation, 
    messages,
    loading, 
    sending,
    error,
    startNewConversation,
    selectConversation,
    removeConversation
  } = useConversations()
  
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [localSending, setLocalSending] = useState(false)
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async () => {
    if (!input.trim() || localSending || !user) return
    
    const userMsg = input.trim()
    setInput('')
    setLocalSending(true)
    
    try {
      let convId = currentConversation?.id
      
      if (!convId) {
        const newConv = await startNewConversation()
        convId = newConv?.id
      }
      
      if (!convId) {
        throw new Error('ไม่สามารถสร้างการสนทนาได้')
      }
      
      await addMessage(user.uid, convId, {
        role: 'user',
        content: userMsg
      })
      
      const historyForAI = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
      
      const response = await chat(userMsg, finance, historyForAI)
      
      if (response.success) {
        await addMessage(user.uid, convId, {
          role: 'assistant',
          content: response.message
        })
      } else {
        await addMessage(user.uid, convId, {
          role: 'assistant',
          content: 'ขอโทษค่ะ ลูมิน่าตอบไม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้งนะคะ 🙏'
        })
      }
    } catch (err) {
      console.error('Send message error:', err)
      if (convId) {
        await addMessage(user.uid, convId, {
          role: 'assistant',
          content: 'เกิดข้อผิดพลาดในการเชื่อมต่อค่ะ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่นะคะ 🙏'
        }).catch(() => {})
      }
    } finally {
      setLocalSending(false)
    }
  }

  const handleSuggestion = async (suggestion) => {
    if (localSending || !user) return

    setInput(suggestion.query)
    setLocalSending(true)

    try {
      let convId = currentConversation?.id

      if (!convId) {
        const newConv = await startNewConversation()
        convId = newConv?.id
      }

      if (!convId) throw new Error('ไม่สามารถสร้างการสนทนาได้')

      await addMessage(user.uid, convId, {
        role: 'user',
        content: suggestion.query
      })

      const historyForAI = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))

      const response = await chat(suggestion.query, finance, historyForAI)

      await addMessage(user.uid, convId, {
        role: 'assistant',
        content: response.success
          ? response.message
          : 'ขอโทษค่ะ ลูมิน่าตอบไม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้งนะคะ 🙏'
      })
    } catch (err) {
      console.error('Suggestion error:', err)
    } finally {
      setLocalSending(false)
      setInput('')
    }
  }

  const handleNewChat = async () => {
    await startNewConversation()
    setShowHistory(false)
  }

  const handleSelectConversation = async (convId) => {
    await selectConversation(convId)
    setShowHistory(false)
  }

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation()
    setConfirmDeleteConvId(convId)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteConvId) return
    await removeConversation(confirmDeleteConvId)
    setConfirmDeleteConvId(null)
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = date?.toDate?.() || new Date(date)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const allMessages = currentConversation ? messages : []
  const showSuggestions = allMessages.length === 0 && !localSending

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex flex-col">
      <TopBar title={`คุยกับ ${aiName}`} onClose={() => navigate('/')} />
      
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pt-20 pb-32 flex flex-col">
        
        {/* AI Companion Header */}
        <div className="text-center py-4 border-b border-border-subtle">
          <div className="relative inline-block mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary border-3 border-white flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="font-headline text-lg font-bold text-text-primary">{aiName}</h1>
          <p className="text-xs text-text-tertiary">AI Financial Companion</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-secondary font-medium">พร้อมช่วยเหลือคุณเสมอ</span>
          </div>
          
          {conversations.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-text-tertiary"
              onClick={() => setShowHistory(true)}
            >
              <History className="w-4 h-4 mr-1" />
              ดูประวัติ ({conversations.length})
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {allMessages.length === 0 && !localSending && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">เริ่มสนทนากับ {aiName} ได้เลยค่ะ 😊</p>
                </div>
              )}
              
              {allMessages.map((msg) => (
                msg.role === 'ai' ? (
                  <div key={msg.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <Card className="bg-white border-0 shadow-md">
                        <CardContent className="p-4">
                          <p className="text-text-primary text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </CardContent>
                      </Card>
                      <p className="text-xs text-text-tertiary mt-1 ml-1">
                        {msg.createdAt?.toLocaleTimeString?.('th-TH', { hour: '2-digit', minute: '2-digit' }) || 'ตอนนี้'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex gap-3 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 max-w-[85%] flex flex-col items-end">
                      <Card className="bg-gradient-to-br from-primary to-primary-600 text-white border-0 shadow-md">
                        <CardContent className="p-4">
                          <p className="text-[15px] leading-relaxed">{msg.content}</p>
                        </CardContent>
                      </Card>
                      <p className="text-xs text-text-tertiary mt-1 mr-1">
                        {msg.createdAt?.toLocaleTimeString?.('th-TH', { hour: '2-digit', minute: '2-digit' }) || 'ตอนนี้'}
                      </p>
                    </div>
                  </div>
                )
              ))}

              {/* Typing indicator */}
              {localSending && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <Card className="bg-white border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {showSuggestions && (
          <div className="mb-4">
            <p className="text-xs text-text-tertiary font-medium mb-3 px-1">ลองถามคำแนะนำเหล่านี้ดูนะคะ 😊</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug) => {
                const Icon = sug.icon
                return (
                  <button
                    key={sug.label}
                    onClick={() => handleSuggestion(sug)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {sug.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Input Bar */}
      <div className="fixed left-0 right-0 px-5 pointer-events-none" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-lg mx-auto pointer-events-auto">
          <Card className="p-2 shadow-lg border-border">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 text-text-tertiary hover:text-primary"
                onClick={handleNewChat}
                title="เริ่มสนทนาใหม่"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <input
                className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary/60 font-medium text-base py-2"
                placeholder={`ถาม ${aiName} เกี่ยวกับการเงิน...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={localSending}
              />
              <Button 
                size="icon" 
                className="shrink-0 bg-gradient-to-br from-primary to-primary-600 shadow-lg shadow-primary/30 disabled:opacity-50"
                onClick={handleSend}
                disabled={!input.trim() || localSending}
              >
                {localSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              ประวัติการสนทนา
            </DialogTitle>
            <DialogDescription>เลือกการสนทนาที่ต้องการ</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4 mr-2" />
              เริ่มสนทนาใหม่
            </Button>
            
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  currentConversation?.id === conv.id 
                    ? 'border-primary bg-primary-50' 
                    : 'border-border hover:border-primary/30 hover:bg-surface-50'
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {conv.title || 'การสนทนาใหม่'}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {formatDate(conv.updatedAt)} • {conv.messageCount || 0} ข้อความ
                  </p>
                </div>
                {confirmDeleteConvId === conv.id ? (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={confirmDelete}
                      className="px-2 py-1 text-xs text-white bg-error rounded-lg"
                    >
                      ลบ
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteConvId(null) }}
                      className="px-2 py-1 text-xs text-text-tertiary bg-surface-100 rounded-lg"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="p-2 rounded-lg hover:bg-error-50 text-text-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
