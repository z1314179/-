import axios from 'axios'

function resolveThinkingType(thinking) {
  if (thinking != null) {
    if (thinking === true || thinking === 'enabled') return 'enabled'
    if (thinking === false || thinking === 'disabled') return 'disabled'
  }
  const env = import.meta.env.VITE_DEEPSEEK_THINKING
  if (env === 'enabled' || env === 'true' || env === '1') return 'enabled'
  if (env === 'disabled' || env === 'false' || env === '0') return 'disabled'
  return null
}

/**
 * 调用 DeepSeek（OpenAI 兼容 /v1/chat/completions）。
 * 需在环境变量中配置：VITE_DEEPSEEK_API_KEY；
 * 可选 VITE_DEEPSEEK_API_URL、VITE_DEEPSEEK_MODEL、
 * VITE_DEEPSEEK_THINKING（enabled/disabled）、VITE_DEEPSEEK_REASONING_EFFORT（high/max）。
 */
export async function callDeepSeekChat({
  messages,
  temperature = 0.2,
  max_tokens = 4096,
  systemPrompt,
  thinking,
  reasoning_effort,
  response_format
}) {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
  const base =
    import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'
  const model = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('请在 .env 中配置 VITE_DEEPSEEK_API_KEY')
  }

  const thinkingType = resolveThinkingType(thinking)
  const url = `${String(base).replace(/\/$/, '')}/chat/completions`
  const body = {
    model,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    max_tokens
  }

  if (thinkingType === 'enabled') {
    body.thinking = { type: 'enabled' }
    body.reasoning_effort =
      reasoning_effort ||
      import.meta.env.VITE_DEEPSEEK_REASONING_EFFORT ||
      'high'
  } else {
    body.temperature = temperature
    if (thinkingType === 'disabled') {
      body.thinking = { type: 'disabled' }
    }
  }

  if (response_format) {
    body.response_format = response_format
  }

  const { data } = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: thinkingType === 'enabled' ? 180000 : 120000
  })

  const content = data?.choices?.[0]?.message?.content
  if (content == null || content === '') {
    throw new Error('DeepSeek 返回为空')
  }
  return typeof content === 'string' ? content : String(content)
}
