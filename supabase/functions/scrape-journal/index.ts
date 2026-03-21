import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Обязательственное право': ['обязательств', 'исполнени', 'неустойк', 'залог', 'поручительств', 'цессия', 'перевод долга', 'зачёт', 'зачет', 'новация', 'прощение долга', 'синаллагм', 'реституц'],
  'Вещное право': ['вещн', 'собственност', 'владен', 'сервитут', 'ипотек', 'залог', 'давност', 'виндикац', 'негаторн', 'регистрац'],
  'Договорное право': ['договор', 'контракт', 'купл', 'продаж', 'аренд', 'подряд', 'оказани', 'услуг', 'поставк', 'лизинг', 'страхован', 'товарищест', 'заём', 'кредит', 'дарени'],
  'Наследственное право': ['наследств', 'наследован', 'завещан', 'наследник', 'наследодател'],
  'Семейное право': ['семейн', 'брак', 'супруг', 'алимент', 'усыновлен', 'опек'],
  'Корпоративное право': ['корпоратив', 'акционер', 'участник', 'директор', 'совет директоров', 'общество', 'акци', 'дивиденд', 'уставн'],
  'Интеллектуальная собственность': ['интеллектуальн', 'авторск', 'патент', 'товарный знак', 'изобретен', 'торговая марка'],
  'Деликтное право': ['делик', 'вред', 'убытк', 'ответственност', 'возмещен', 'компенсац', 'моральн'],
  'Международное частное право': ['международн', 'иностранн', 'трансграничн', 'коллизионн', 'арбитраж'],
  'Банкротство': ['банкротств', 'несостоятельн', 'конкурсн', 'субординац', 'субсидиарн', 'кредитор'],
  'Процессуальное право': ['процесс', 'иск', 'суд', 'арбитражн', 'доказательств', 'обеспечительн', 'исполнительн', 'мировое соглашен'],
}

function classifyTopics(title: string, section?: string): string[] {
  const text = `${title} ${section || ''}`.toLowerCase()
  const topics: string[] = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      topics.push(topic)
    }
  }
  return topics.length > 0 ? topics : ['Общие вопросы']
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 1000,
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Firecrawl error [${response.status}]: ${JSON.stringify(data)}`)
  }
  return data.data?.markdown || data.markdown || ''
}

const MONTH_TO_NUMBER: Record<string, string> = {
  'январь': '1', 'февраль': '2', 'март': '3', 'апрель': '4',
  'май': '5', 'июнь': '6', 'июль': '7', 'август': '8',
  'сентябрь': '9', 'октябрь': '10', 'ноябрь': '11', 'декабрь': '12',
  'января': '1', 'февраля': '2', 'марта': '3', 'апреля': '4',
  'мая': '5', 'июня': '6', 'июля': '7', 'августа': '8',
  'сентября': '9', 'октября': '10', 'ноября': '11', 'декабря': '12',
}

function monthToNumber(value: string): string {
  const lower = value.toLowerCase().trim()
  return MONTH_TO_NUMBER[lower] ? `№ ${MONTH_TO_NUMBER[lower]}` : value
}

// ─── Parsers ──────────────────────────────────────────

function parseMvgpIssue(markdown: string, year: number, issue: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  let currentSection = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('- ') && !line.includes('mvgp.org') && !line.includes('**') && line.length > 10 && line.length < 100) {
      const sectionText = line.replace(/^-\s*/, '').trim()
      if (!sectionText.includes('Перейти') && !sectionText.includes('Подробнее') && !sectionText.includes('корзин')) {
        currentSection = sectionText
      }
    }
    const titleMatch = line.match(/\*\*([^*]+)\*\*/)
    if (titleMatch && !line.includes('Том ') && !line.includes('№ ')) {
      const title = titleMatch[1].trim()
      if (/^[A-Z]/.test(title) || title.length < 10) continue
      if (title.includes('Перейти') || title.includes('корзин')) continue
      const authorLines: string[] = []
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim().replace(/\\\\/g, '').trim()
        if (!nextLine) continue
        if (/^[А-ЯЁ]\.[А-ЯЁ]\.\s+[А-ЯЁ]/.test(nextLine) || /^[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\./.test(nextLine)) {
          authorLines.push(nextLine); break
        }
        if (/^[А-ЯЁ]\.[А-ЯЁ]\.\s*[А-ЯЁ][а-яё]+/.test(nextLine)) {
          authorLines.push(nextLine); break
        }
      }
      const urlMatch = line.match(/\(https:\/\/mvgp\.org\/product\/([^)]+)\)/)
      const url = urlMatch ? `https://mvgp.org/product/${urlMatch[1]}` : undefined
      articles.push({
        title, authors: authorLines.length > 0 ? authorLines : ['Автор не указан'],
        journal: 'Вестник гражданского права', year, issue,
        section: currentSection || null, topics: classifyTopics(title, currentSection),
        url, source_url: url,
      })
    }
  }
  return articles
}

function parsePrivlawIssue(markdown: string, year: number, issue: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  let currentSection = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('## ') && !line.includes('Выпуски') && !line.includes('год')) {
      currentSection = line.replace(/^##\s*/, '').trim(); continue
    }
    const articleMatch = line.match(/^#{4,5}\s*\[([^\]]+)\]\(([^)]+)\)/)
    if (articleMatch) {
      const title = articleMatch[1].replace(/,$/, '').trim()
      const url = articleMatch[2]
      const authors: string[] = []
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim()
        const authorMatch = nextLine.match(/\*\*([^*]+)\*\*/)
        if (authorMatch) { authors.push(authorMatch[1].replace(/[,\s]+$/, '').trim()); break }
      }
      articles.push({
        title, authors: authors.length > 0 ? authors : ['Автор не указан'],
        journal: 'Цивилистика', year, issue,
        section: currentSection || null, topics: classifyTopics(title, currentSection),
        url, source_url: url,
      })
    }
  }
  return articles
}

function parseZakonIssue(markdown: string, year: number, month: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  let currentSection = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('#') && !line.startsWith('-') && !line.startsWith('!') && !line.startsWith('[') && !line.includes('zakon.ru') && line.length > 3 && line.length < 60 && /^[А-ЯЁ]/.test(line) && !line.includes('аннотация') && !line.includes('Купить') && !line.includes('Подпис') && !line.includes('Cookie') && !line.includes('Чтобы') && !line.includes('Если вы') && !line.includes('Пожалуйста')) {
      const potentialSection = line.trim()
      if (/^[А-ЯЁа-яё\s,]+$/.test(potentialSection) && potentialSection.length < 50) {
        currentSection = potentialSection; continue
      }
    }
    const articleMatch = line.match(/\[([^\]]+)\]\(https:\/\/zakon\.ru\/publication\/igzakon\/(\d+)\)/)
    if (articleMatch) {
      const fullText = articleMatch[1].trim()
      if (fullText === 'Содержание/Contents' || fullText.length < 10) continue
      const dotIndex = fullText.indexOf('. ')
      let authors: string[] = []
      let title = fullText
      if (dotIndex > 0 && dotIndex < 60) {
        const authorPart = fullText.substring(0, dotIndex).trim()
        const titlePart = fullText.substring(dotIndex + 2).trim()
        if (/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/.test(authorPart) || /^[А-ЯЁ][а-яё]+\s+[А-ЯЁа-яё]+\s+[А-ЯЁ][а-яё]+/.test(authorPart)) {
          authors = [authorPart]; title = titlePart
        }
      }
      if (!title || title.length < 5) continue
      articles.push({
        title, authors: authors.length > 0 ? authors : ['Автор не указан'],
        journal: 'Вестник экономического правосудия', year,
        issue: monthToNumber(month), section: currentSection || null,
        topics: classifyTopics(title, currentSection),
        url: `https://zakon.ru/publication/igzakon/${articleMatch[2]}`,
        source_url: `https://zakon.ru/publication/igzakon/${articleMatch[2]}`,
      })
    }
  }
  return articles
}

// ─── Issue URL extractors ──────────────────────────────

function extractMvgpIssueUrls(markdown: string): { url: string, year: number, issue: string }[] {
  const results: { url: string, year: number, issue: string }[] = []
  const matches = markdown.matchAll(/\(https:\/\/mvgp\.org\/product\/[^)]+\)/g)
  const seen = new Set<string>()
  for (const match of matches) {
    const url = match[0].slice(1, -1)
    if (seen.has(url)) continue
    if (!url.includes('zhurnala') && !url.includes('vgp-')) continue
    seen.add(url)
    const yearMatch = url.match(/(\d{4})/)
    const issueMatch = url.match(/-(\d+)-tom-/) || url.match(/vgp-\d{4}-(\d+)/)
    if (yearMatch) {
      results.push({ url, year: parseInt(yearMatch[1]), issue: issueMatch ? `№ ${issueMatch[1]}` : '' })
    }
  }
  return results
}

function extractPrivlawIssueUrls(markdown: string): { url: string, year: number, issue: string }[] {
  const results: { url: string, year: number, issue: string }[] = []
  const lines = markdown.split('\n')
  let currentYear = 0
  for (const line of lines) {
    const yearMatch = line.match(/^##\s*(\d{4})\s*год/)
    if (yearMatch) { currentYear = parseInt(yearMatch[1]); continue }
    const linkMatch = line.match(/\[№\s*(\d+)[^\]]*\]\((https:\/\/privlaw-journal\.com\/magazine\/[^)]+)\)/)
    if (linkMatch && currentYear) {
      results.push({ url: linkMatch[2], year: currentYear, issue: `№ ${linkMatch[1]}` })
    }
  }
  return results
}

function extractZakonIssueUrls(markdown: string): { url: string, year: number, month: string }[] {
  const results: { url: string, year: number, month: string }[] = []
  const lines = markdown.split('\n')
  let currentYear = 0
  for (const line of lines) {
    const yearMatch = line.match(/\*\*(\d{4})\*\*/)
    if (yearMatch) { currentYear = parseInt(yearMatch[1]); continue }
    const linkMatch = line.match(/\[(Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь)\]\((https:\/\/zakon\.ru\/magazine\/[^)]+)\)/)
    if (linkMatch && currentYear) {
      results.push({ url: linkMatch[2], year: currentYear, month: linkMatch[1] })
    }
  }
  return results
}

// ─── Helper: get already scraped issue keys from DB ──────

async function getExistingIssueKeys(supabase: any, journalName: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('articles')
    .select('year, issue')
    .eq('journal', journalName)
  
  const keys = new Set<string>()
  if (data) {
    for (const row of data) {
      keys.add(`${row.year}|${row.issue}`)
    }
  }
  return keys
}

function makeIssueKey(year: number, issue: string): string {
  return `${year}|${issue}`
}

// ─── Time guard & parallel processing ────────────────────

const MAX_RUNTIME_MS = 55_000 // 55s safety margin (edge fn limit ~60s)
const PARALLEL_LIMIT = 3

function isTimeUp(startTime: number): boolean {
  return Date.now() - startTime > MAX_RUNTIME_MS
}

// ─── Main handler ────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { journal, mode } = await req.json()
    // mode: "all" = scrape all available issues, "new" = only issues not yet in DB
    const scrapeMode = mode || 'new'
    const startTime = Date.now()

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let allArticles: any[] = []
    const logs: string[] = []
    let timedOut = false

    const JOURNAL_NAMES: Record<string, string> = {
      mvgp: 'Вестник гражданского права',
      privlaw: 'Цивилистика',
      zakon: 'Вестник экономического правосудия',
    }

    if (!JOURNAL_NAMES[journal]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid journal. Use: mvgp, privlaw, or zakon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing issues from DB for filtering
    const existingKeys = scrapeMode === 'new'
      ? await getExistingIssueKeys(supabase, JOURNAL_NAMES[journal])
      : new Set<string>()
    
    if (scrapeMode === 'new') {
      logs.push(`В базе уже есть ${existingKeys.size} уникальных номеров для ${JOURNAL_NAMES[journal]}`)
    }

    if (journal === 'mvgp') {
      logs.push('Сканирую Вестник гражданского права...')
      const mainPage = await scrapeWithFirecrawl('https://mvgp.org/product-category/zurnal/', firecrawlKey)
      let issues = extractMvgpIssueUrls(mainPage)
      logs.push(`Найдено ${issues.length} номеров на сайте`)

      if (scrapeMode === 'new') {
        issues = issues.filter(i => !existingKeys.has(makeIssueKey(i.year, i.issue)))
        logs.push(`Новых номеров для сканирования: ${issues.length}`)
      }

      for (let i = 0; i < issues.length; i += PARALLEL_LIMIT) {
        if (isTimeUp(startTime)) { timedOut = true; logs.push('⏱ Лимит времени — продолжите сканирование повторным запуском'); break }
        const batch = issues.slice(i, i + PARALLEL_LIMIT)
        const batchResults = await Promise.allSettled(batch.map(async (issue) => {
          logs.push(`Сканирую: ${issue.issue} ${issue.year}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          return parseMvgpIssue(issuePage, issue.year, issue.issue)
        }))
        for (let j = 0; j < batchResults.length; j++) {
          const r = batchResults[j]
          if (r.status === 'fulfilled') {
            allArticles.push(...r.value)
            logs.push(`Найдено ${r.value.length} статей в ${batch[j].issue} ${batch[j].year}`)
          } else {
            logs.push(`❌ Ошибка ${batch[j].url}: ${r.reason?.message || r.reason}`)
          }
        }
      }
    } else if (journal === 'privlaw') {
      logs.push('Сканирую Цивилистику...')
      const mainPage = await scrapeWithFirecrawl('https://privlaw-journal.com/', firecrawlKey)
      let issues = extractPrivlawIssueUrls(mainPage)
      logs.push(`Найдено ${issues.length} номеров на сайте`)

      if (scrapeMode === 'new') {
        issues = issues.filter(i => !existingKeys.has(makeIssueKey(i.year, i.issue)))
        logs.push(`Новых номеров для сканирования: ${issues.length}`)
      }

      for (let i = 0; i < issues.length; i += PARALLEL_LIMIT) {
        if (isTimeUp(startTime)) { timedOut = true; logs.push('⏱ Лимит времени — продолжите сканирование повторным запуском'); break }
        const batch = issues.slice(i, i + PARALLEL_LIMIT)
        const batchResults = await Promise.allSettled(batch.map(async (issue) => {
          logs.push(`Сканирую: ${issue.issue} ${issue.year}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          return parsePrivlawIssue(issuePage, issue.year, issue.issue)
        }))
        for (let j = 0; j < batchResults.length; j++) {
          const r = batchResults[j]
          if (r.status === 'fulfilled') {
            allArticles.push(...r.value)
            logs.push(`Найдено ${r.value.length} статей в ${batch[j].issue} ${batch[j].year}`)
          } else {
            logs.push(`❌ Ошибка ${batch[j].url}: ${r.reason?.message || r.reason}`)
          }
        }
      }
    } else if (journal === 'zakon') {
      logs.push('Сканирую Вестник экономического правосудия...')
      const mainPage = await scrapeWithFirecrawl(
        'https://zakon.ru/magazine/vestnik_ekonomicheskogo_pravosudiya_rf_ranee_vestnik_vas_rf',
        firecrawlKey
      )
      let issues = extractZakonIssueUrls(mainPage)
      logs.push(`Найдено ${issues.length} номеров на сайте`)

      if (scrapeMode === 'new') {
        const filteredIssues = issues.filter(i => !existingKeys.has(makeIssueKey(i.year, monthToNumber(i.month))))
        logs.push(`Новых номеров для сканирования: ${filteredIssues.length}`)
        issues = filteredIssues
      }

      for (let i = 0; i < issues.length; i += PARALLEL_LIMIT) {
        if (isTimeUp(startTime)) { timedOut = true; logs.push('⏱ Лимит времени — продолжите сканирование повторным запуском'); break }
        const batch = issues.slice(i, i + PARALLEL_LIMIT)
        const batchResults = await Promise.allSettled(batch.map(async (issue) => {
          logs.push(`Сканирую: ${issue.month} ${issue.year}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          return parseZakonIssue(issuePage, issue.year, issue.month)
        }))
        for (let j = 0; j < batchResults.length; j++) {
          const r = batchResults[j]
          if (r.status === 'fulfilled') {
            allArticles.push(...r.value)
            logs.push(`Найдено ${r.value.length} статей в ${batch[j].month} ${batch[j].year}`)
          } else {
            logs.push(`❌ Ошибка ${batch[j].url}: ${r.reason?.message || r.reason}`)
          }
        }
      }
    }

    // Insert articles
    let inserted = 0
    let skipped = 0
    for (const article of allArticles) {
      const { error } = await supabase
        .from('articles')
        .upsert(article, { onConflict: 'title,journal,year', ignoreDuplicates: true })
      if (error) {
        logs.push(`Ошибка вставки "${article.title}": ${error.message}`)
        skipped++
      } else {
        inserted++
      }
    }

    logs.push(`Готово! Добавлено: ${inserted}, Пропущено: ${skipped}`)

    return new Response(
      JSON.stringify({
        success: true,
        total_found: allArticles.length,
        inserted,
        skipped,
        timed_out: timedOut,
        logs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scrape error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
