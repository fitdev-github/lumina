import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { chat } from '@/services/groqService'
import { 
  createConversation,
  getConversations,
  subscribeToConversations,
  getMessages,
  subscribeToMessages,
  addMessage,
  deleteConversation,
  getConversation
} from '@/services/conversationService'

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setConversations([])
      setMessages([])
      return
    }

    const unsubscribe = subscribeToConversations(user.uid, (data) => {
      setConversations(data)
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || !currentConversation) {
      setMessages([])
      return
    }

    const unsubscribe = subscribeToMessages(user.uid, currentConversation.id, (data) => {
      setMessages(data.map(msg => ({
        id: msg.id,
        role: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        createdAt: msg.createdAt?.toDate?.() || new Date()
      })))
    })

    return () => unsubscribe()
  }, [user, currentConversation])

  const startNewConversation = useCallback(async () => {
    if (!user) return null
    
    setLoading(true)
    setError(null)
    
    try {
      const conversationId = await createConversation(user.uid)
      const conversation = {
        id: conversationId,
        title: 'การสนทนาใหม่',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCurrentConversation(conversation)
      setMessages([])
      return conversation
    } catch (err) {
      setError('ไม่สามารถสร้างการสนทนาได้')
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const selectConversation = useCallback(async (conversationId) => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const conversation = await getConversation(user.uid, conversationId)
      setCurrentConversation(conversation)
    } catch (err) {
      setError('ไม่สามารถโหลดการสนทนาได้')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const sendMessage = useCallback(async (userMessage, financeContext) => {
    if (!user) return null
    
    setSending(true)
    setError(null)
    
    let conversationId = currentConversation?.id
    
    if (!conversationId) {
      const newConv = await startNewConversation()
      conversationId = newConv?.id
    }
    
    if (!conversationId) {
      setSending(false)
      return null
    }
    
    try {
      const userMsgData = {
        role: 'user',
        content: userMessage
      }
      
      await addMessage(user.uid, conversationId, userMsgData)
      
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      const response = await chat(userMessage, financeContext, conversationHistory)
      
      if (response.success) {
        const aiMsgData = {
          role: 'assistant',
          content: response.message
        }
        await addMessage(user.uid, conversationId, aiMsgData)
        
        return { success: true, message: response.message }
      } else {
        setError(response.error)
        return { success: false, error: response.error }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      console.error(err)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [user, currentConversation, messages, startNewConversation])

  const removeConversation = useCallback(async (conversationId) => {
    if (!user) return
    
    try {
      await deleteConversation(user.uid, conversationId)
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
    } catch (err) {
      setError('ไม่สามารถลบการสนทนาได้')
      console.error(err)
    }
  }, [user, currentConversation])

  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null)
    setMessages([])
  }, [])

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    error,
    startNewConversation,
    selectConversation,
    sendMessage,
    removeConversation,
    clearCurrentConversation
  }
}

export default useConversations
