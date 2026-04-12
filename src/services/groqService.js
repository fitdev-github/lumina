import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `คุณคือ "ลูมิน่า" ผู้ช่วยวางแผนการเงินส่วนตัวที่ฉลาดและเป็นมิตร สำหรับผู้ใช้ที่มีรายได้จากเงินเดือนเป็นหลัก

บุคลิกภาพ:
- เป็นกันเอง อบอุ่น ให้กำลังใจ ไม่ตัดสิน
- ใช้ emoji เล็กน้อยเพื่อให้บทสนทนาสดใส
- ตอบกระชับ ได้ใจความ ไม่พูดน้ำมาก
- ตอบภาษาไทยเสมอ

ความสามารถด้านการเงิน:
- วิเคราะห์รายรับ-รายจ่าย หาจุดรั่วไหล
- คำนวณอัตราการออม และแนะนำเป้าหมายที่เหมาะสม
- วางแผนปลดหนี้ (วิธี Debt Snowball / Debt Avalanche)
- คำนวณ Net Worth (สินทรัพย์ - หนี้สิน)
- แนะนำการจัดสรรเงิน เช่น กฎ 50/30/20
- ประเมินความเสี่ยงทางการเงินเบื้องต้น
- แนะนำการออมฉุกเฉิน (3-6 เดือนของค่าใช้จ่าย)

กฎการตอบ:
1. อ้างอิงตัวเลขจริงจาก context เสมอ อย่าเดา
2. ถ้าไม่มีข้อมูลเพียงพอ ให้ถามผู้ใช้ก่อน
3. ให้ขั้นตอนที่ทำได้จริง ไม่ใช่แค่แนะนำทั่วไป
4. ถ้าผู้ใช้มีปัญหาหนี้ ให้กำลังใจและเสนอแผนที่ชัดเจน
5. เมื่อคำนวณตัวเลข ให้แสดงวิธีคิดสั้น ๆ

ฟีเจอร์ในแอป Lumina Finance ที่แนะนำได้:
- "เพิ่มรายการ" → บันทึกรายรับ/รายจ่าย
- "เป้าหมาย" → ตั้งและติดตามเป้าหมายออม
- "สถานะการเงิน" → ดู Net Worth, จัดการบัญชีและหนี้สิน
- "จัดการหนี้" → ติดตามและวางแผนปลดหนี้
- "งบประมาณ" → ติดตามค่าใช้จ่ายตามหมวดหมู่

คำแนะนำหลักที่ AI ควรให้ได้:
1. "ควรออมเท่าไหร่?" → คำนวณจาก freeMoney × 20-30% แนะนำเป็นตัวเลขชัดเจน
2. "ใช้จ่ายได้เท่าไหร่/วัน?" → ดูจาก dailyBudget ที่คำนวณไว้
3. "ปลดหนี้เมื่อไหร่?" → ดูจาก payoff date ของแต่ละหนี้
4. "ทุนฉุกเฉินพอไหม?" → ดูจาก emergencyMonths เทียบกับเป้า 3-6 เดือน
5. "DTI สูงไหม?" → วิเคราะห์ว่าภาระหนี้ต่อรายได้เหมาะสมไหม

โมเดลการใช้เงิน 3 ชั้น (รู้จักและใช้ได้):
- ชั้น 1 "safe": ใช้ยอดเงินที่ใช้ได้ปกติ ไม่เกินงบ
- ชั้น 2 "drawing_savings": ใช้เกินงบ → ดึงเงินออมมาใช้ (เสี่ยงปานกลาง)
- ชั้น 3 "drawing_emergency": เงินออมหมด → ดึงทุนฉุกเฉิน (เสี่ยงสูง)
- ชั้น 4 "critical": ใช้เกินรายได้ทั้งหมด (วิกฤต)
เมื่อผู้ใช้อยู่ในชั้น 2-4 ให้แจ้งความเสี่ยงและให้แผนแก้ไขที่ชัดเจน

ตัวอย่างคำตอบที่ดี:
ผู้ใช้: "ฉันควรออมเท่าไหร่?"
ลูมิน่า: "ยอดเงินที่ใช้ได้ของคุณหลังหักรายจ่ายคงที่คือ X บาท
แนะนำออมอย่างน้อย 20% = Y บาท/เดือน
ที่เหลือ Z บาทใช้จ่ายได้ประมาณ W บาท/วัน (เหลือ D วัน) ค่ะ 💪"`

const INSIGHTS_SYSTEM_PROMPT = `คุณคือ "ลูมิน่า" ผู้ช่วยทางการเงิน

วิเคราะห์ข้อมูลการเงินที่ได้รับและสร้าง insights ที่มีประโยชน์จริง

กฎ:
1. ตอบเป็นภาษาไทย ใช้ตัวเลขจริงจากข้อมูล
2. ให้กำลังใจและสร้างแรงบันดาลใจ
3. คำแนะนำต้องทำได้จริงในชีวิตประจำวัน
4. ใช้ emoji เล็กน้อย
5. ตอบกระชับ ไม่เกิน 2-3 ประโยคต่อข้อ

ตอบเป็น JSON ล้วน ไม่มี markdown ไม่มี code block:
{
  "greeting": "ทักทายเป็นภาษาไทย ใช้ชื่อผู้ใช้",
  "mainInsight": "insight หลัก 1 ข้อที่สำคัญที่สุด อ้างอิงตัวเลขจริง",
  "recommendations": [
    "คำแนะนำที่ 1 - ทำได้จริง",
    "คำแนะนำที่ 2 - ทำได้จริง",
    "คำแนะนำที่ 3 - ทำได้จริง"
  ],
  "highlight": "ข้อสังเกตพิเศษ เช่น สิ่งที่ทำได้ดี หรือสิ่งที่ควรระวัง"
}`

function extractJSON(text) {
  // Strip markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()
  // Find first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1)
  return text
}

export async function chat(userMessage, financeContext, conversationHistory = []) {
  const contextString = formatFinanceContext(financeContext)

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `ข้อมูลการเงินของผู้ใช้ปัจจุบัน:\n${contextString}` },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    })

    return {
      success: true,
      message: chatCompletion.choices[0]?.message?.content || 'ขอโทษค่ะ ลูมิน่าตอบไม่ได้ในขณะนี้'
    }
  } catch (error) {
    console.error('Groq API Error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่ค่ะ'
    }
  }
}

export async function generateInsights(financeContext) {
  const contextString = formatFinanceContextForInsights(financeContext)

  const messages = [
    { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
    { role: 'user', content: `ข้อมูลการเงิน:\n${contextString}\n\nสร้าง insights (ตอบเป็น JSON ล้วน ไม่มี markdown)` }
  ]

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 800,
    })

    const raw = chatCompletion.choices[0]?.message?.content || '{}'
    const cleaned = extractJSON(raw)

    try {
      const insights = JSON.parse(cleaned)
      // Validate required fields
      if (!insights.greeting || !insights.mainInsight || !Array.isArray(insights.recommendations)) {
        throw new Error('Invalid structure')
      }
      return { success: true, insights }
    } catch {
      return {
        success: true,
        insights: buildFallbackInsights(financeContext)
      }
    }
  } catch (error) {
    console.error('Groq API Error:', error)
    return {
      success: false,
      error: 'ไม่สามารถสร้าง insights ได้ในขณะนี้'
    }
  }
}

function buildFallbackInsights(context) {
  const name = context?.user?.name || 'คุณ'
  const savingsRate = context?.summary?.savingsRate?.toFixed(1) || 0
  return {
    greeting: `สวัสดีค่ะ ${name}! 😊`,
    mainInsight: savingsRate > 0
      ? `คุณออมได้ ${savingsRate}% ของรายได้เดือนนี้ ทำได้ดีมากค่ะ!`
      : 'ยินดีต้อนรับสู่ Lumina Finance ค่ะ เริ่มบันทึกรายการวันนี้เลยนะคะ',
    recommendations: [
      'บันทึกรายรับ-รายจ่ายทุกวันเพื่อเห็นภาพรวม',
      'ตั้งเป้าหมายการออมเพื่อสร้างแรงบันดาลใจ',
      'ตรวจสอบสถานะทางการเงินของคุณสม่ำเสมอ'
    ],
    highlight: 'การจัดการการเงินที่ดีเริ่มต้นจากการรู้ตัวเลข!'
  }
}

function formatFinanceContext(context) {
  if (!context) return 'ไม่มีข้อมูลการเงิน'

  const { user, summary, thisMonth, goals, debts, accounts } = context

  let text = ''

  if (user) {
    text += `== ข้อมูลผู้ใช้ ==\n`
    text += `ชื่อ: ${user.name || 'ไม่ระบุ'}\n`
    text += `สมาชิกตั้งแต่: ${user.memberSince || 'ไม่ระบุ'}\n\n`
  }

  if (summary) {
    text += `== ภาพรวมการเงิน (ทั้งหมด) ==\n`
    text += `รายได้รวม: ${formatCurrency(summary.totalIncome)} บาท\n`
    text += `รายจ่ายรวม: ${formatCurrency(summary.totalExpense)} บาท\n`
    text += `ยอดคงเหลือ (จากรายการ): ${formatCurrency(summary.balance)} บาท\n`
    text += `อัตราการออม: ${summary.savingsRate?.toFixed(1) || 0}%\n\n`
  }

  if (thisMonth) {
    text += `== เดือนนี้ ==\n`
    text += `รายได้: ${formatCurrency(thisMonth.income)} บาท\n`
    text += `รายจ่าย: ${formatCurrency(thisMonth.expense)} บาท\n`
    text += `คงเหลือ: ${formatCurrency(thisMonth.income - thisMonth.expense)} บาท\n`

    if (thisMonth.expenseByCategory && Object.keys(thisMonth.expenseByCategory).length > 0) {
      text += `รายจ่ายแยกหมวดหมู่:\n`
      Object.entries(thisMonth.expenseByCategory)
        .sort(([, a], [, b]) => b - a)
        .forEach(([cat, amount]) => {
          text += `  - ${cat}: ${formatCurrency(amount)} บาท\n`
        })
    }
    text += '\n'
  }

  // Cash flow model (fixed expenses + salary)
  const cf = context?.cashFlow
  if (cf?.hasSalary) {
    text += `== แผนกระแสเงินเดือนนี้ ==\n`
    text += `เงินเดือน: ${formatCurrency(cf.monthlySalary)} บาท\n`
    text += `รายจ่ายคงที่รวม: ${formatCurrency(cf.totalFixed)} บาท\n`
    if (context.fixedExpenses?.length > 0) {
      context.fixedExpenses.forEach(e => {
        text += `  - ${e.name}: ${formatCurrency(e.amount)} บาท (ทุกวันที่ ${e.dueDay})\n`
      })
    }
    if (cf.savingsAllocation > 0) {
      text += `ยอดออมที่ตั้งไว้/เดือน: ${formatCurrency(cf.savingsAllocation)} บาท\n`
    }
    text += `เงินใช้จ่ายได้จริง (หลังหักคงที่+ออม): ${formatCurrency(cf.freeMoney)} บาท\n`
    text += `ใช้ไปแล้ว (ผันแปร): ${formatCurrency(cf.thisMonthExpense)} บาท\n`
    text += `คงเหลือ: ${formatCurrency(cf.remainingFree)} บาท\n`
    text += `วันที่เหลือในเดือน: ${cf.daysRemaining} วัน\n`
    text += `งบต่อวันที่แนะนำ: ${formatCurrency(cf.dailyBudget)} บาท\n`
    text += `DTI (ภาระหนี้/รายได้): ${cf.dti?.toFixed(1)}%\n`
    text += `ทุนฉุกเฉิน: ${cf.emergencyMonths?.toFixed(1)} เดือน (เป้าหมาย 3-6 เดือน)\n`
    text += `เงินออมสะสม (บัญชีออม): ${formatCurrency(cf.savingsBalance || 0)} บาท\n`
    if (cf.spendingTier && cf.spendingTier !== 'safe') {
      const tierLabel = {
        drawing_savings: '⚠️ กำลังดึงเงินออมมาใช้',
        drawing_emergency: '🚨 กำลังใช้เงินฉุกเฉิน',
        critical: '🔴 รายจ่ายเกินรายได้ทั้งหมด',
      }[cf.spendingTier] || cf.spendingTier
      text += `สถานะการใช้เงิน: ${tierLabel}\n`
      if (cf.drawFromSavings > 0) text += `ดึงเงินออมมาใช้: ${formatCurrency(cf.drawFromSavings)} บาท\n`
      if (cf.drawFromEmergency > 0) text += `ดึงเงินฉุกเฉินมาใช้: ${formatCurrency(cf.drawFromEmergency)} บาท\n`
    }
    text += '\n'
  }

  if (accounts && accounts.length > 0) {
    const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    text += `== บัญชีและสินทรัพย์ ==\n`
    text += `รวมสินทรัพย์: ${formatCurrency(totalAssets)} บาท\n`
    accounts.forEach(a => {
      text += `  - ${a.name} (${a.type}): ${formatCurrency(a.balance)} บาท\n`
    })
    text += '\n'
  }

  if (goals && goals.length > 0) {
    text += `== เป้าหมายการออม (${goals.length} เป้าหมาย) ==\n`
    goals.forEach((goal, i) => {
      text += `${i + 1}. ${goal.name}: ${formatCurrency(goal.currentAmount || 0)} / ${formatCurrency(goal.targetAmount)} บาท (${goal.percent?.toFixed(0) || 0}%)\n`
    })
    text += '\n'
  }

  if (debts && debts.length > 0) {
    const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0)
    text += `== หนี้สิน (${debts.length} รายการ) ==\n`
    text += `รวมหนี้: ${formatCurrency(totalDebt)} บาท\n`
    debts.forEach((debt, i) => {
      text += `${i + 1}. ${debt.name}: ${formatCurrency(debt.balance)} บาท (ดอกเบี้ย ${debt.interestRate || 0}%/ปี, ขั้นต่ำ ${formatCurrency(debt.minPayment || 0)} บาท/เดือน)\n`
    })

    if (accounts && accounts.length > 0) {
      const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const netWorth = totalAssets - totalDebt
      text += `Net Worth (สินทรัพย์ - หนี้): ${formatCurrency(netWorth)} บาท\n`
    }
    text += '\n'
  }

  return text || 'ยังไม่มีข้อมูลการเงิน'
}

function formatFinanceContextForInsights(context) {
  if (!context) return 'ไม่มีข้อมูล'

  const { user, summary, thisMonth, goals, debts, accounts, fixedExpenses } = context
  const cf = context?.cashFlow

  let text = `ชื่อผู้ใช้: ${user?.name || 'ไม่ระบุ'}\n\n`

  // Savings rate: prefer cashFlow-based (salary model) over transaction-based
  const cfSavingsRate = cf?.hasSalary && cf.monthlySalary > 0
    ? ((cf.savingsAllocation || 0) / cf.monthlySalary) * 100
    : null
  const savingsRate = cfSavingsRate ?? summary?.savingsRate ?? 0

  if (summary) {
    text += `== ภาพรวมการเงิน ==\n`
    text += `รายได้รวม (ธุรกรรม): ${formatCurrency(summary.totalIncome)} บาท\n`
    text += `รายจ่ายรวม (ธุรกรรม): ${formatCurrency(summary.totalExpense)} บาท\n`
    text += `อัตราการออม: ${savingsRate.toFixed(1)}%\n\n`
  }

  if (thisMonth) {
    text += `== เดือนนี้ ==\n`
    text += `รายได้: ${formatCurrency(thisMonth.income)} / รายจ่าย: ${formatCurrency(thisMonth.expense)} บาท\n`
    if (thisMonth.expenseByCategory && Object.keys(thisMonth.expenseByCategory).length > 0) {
      const sorted = Object.entries(thisMonth.expenseByCategory).sort(([, a], [, b]) => b - a)
      const topCat = sorted[0]
      text += `หมวดหมู่ที่ใช้มากสุด: ${topCat[0]} (${formatCurrency(topCat[1])} บาท)\n`
    }
    text += '\n'
  }

  if (cf?.hasSalary) {
    text += `== แผนกระแสเงินเดือนนี้ ==\n`
    text += `เงินเดือน: ${formatCurrency(cf.monthlySalary)} บาท\n`
    text += `รายจ่ายคงที่รวม: ${formatCurrency(cf.totalFixed)} บาท\n`
    if (fixedExpenses?.length > 0) {
      fixedExpenses.forEach(e => {
        text += `  - ${e.name}: ${formatCurrency(e.amount)} บาท (วันที่ ${e.dueDay})\n`
      })
    }
    if (cf.savingsAllocation > 0) {
      text += `ยอดออมที่ตั้งไว้/เดือน: ${formatCurrency(cf.savingsAllocation)} บาท\n`
    }
    text += `ยอดเงินที่ใช้ได้ (หลังหักคงที่+ออม): ${formatCurrency(cf.freeMoney)} บาท\n`
    text += `ใช้ไปแล้วเดือนนี้: ${formatCurrency(cf.thisMonthExpense)} บาท\n`
    text += `คงเหลือ: ${formatCurrency(cf.remainingFree)} บาท\n`
    text += `วันที่เหลือในเดือน: ${cf.daysRemaining} วัน\n`
    text += `งบต่อวันที่แนะนำ: ${formatCurrency(cf.dailyBudget)} บาท\n`
    text += `DTI (ภาระหนี้/รายได้): ${cf.dti?.toFixed(1)}%\n`
    text += `ทุนฉุกเฉิน: ${cf.emergencyMonths?.toFixed(1)} เดือน (เป้าหมาย 3-6 เดือน)\n`
    text += `เงินออมสะสม: ${formatCurrency(cf.savingsBalance || 0)} บาท\n`
    if (cf.spendingTier && cf.spendingTier !== 'safe') {
      const tierLabel = {
        drawing_savings: '⚠️ กำลังดึงเงินออมมาใช้',
        drawing_emergency: '🚨 กำลังใช้เงินฉุกเฉิน',
        critical: '🔴 รายจ่ายเกินรายได้ทั้งหมด',
      }[cf.spendingTier] || cf.spendingTier
      text += `สถานะการใช้เงิน: ${tierLabel}\n`
      if (cf.drawFromSavings > 0) text += `ดึงเงินออมมาใช้: ${formatCurrency(cf.drawFromSavings)} บาท\n`
      if (cf.drawFromEmergency > 0) text += `ดึงเงินฉุกเฉินมาใช้: ${formatCurrency(cf.drawFromEmergency)} บาท\n`
    } else {
      text += `สถานะการใช้เงิน: ✅ ปกติ (safe)\n`
    }
    text += '\n'
  }

  if (accounts && accounts.length > 0) {
    const totalAssets = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    text += `== บัญชี ==\n`
    text += `สินทรัพย์รวม: ${formatCurrency(totalAssets)} บาท\n`
    accounts.forEach(a => {
      text += `  - ${a.name} (${a.type}): ${formatCurrency(a.balance)} บาท\n`
    })
    text += '\n'
  }

  if (goals && goals.length > 0) {
    text += `== เป้าหมายการออม ==\n`
    goals.forEach(g => {
      text += `- ${g.name}: ${formatCurrency(g.currentAmount || 0)} / ${formatCurrency(g.targetAmount)} บาท (${g.percent?.toFixed(0) || 0}%)\n`
    })
    text += '\n'
  }

  return text
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('th-TH')
}

export default { chat, generateInsights }
