import axios from 'axios'

/**
 * 调用通义千问（OpenAI 兼容 /v1/chat/completions）。
 * 需在环境变量中配置：VITE_QWEN_API_KEY；可选 VITE_QWEN_API_URL、VITE_QWEN_MODEL。
 */
export async function callQwenChat({
  messages,
  temperature = 0.2,
  max_tokens = 4096,
  systemPrompt
}) {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY
  const base =
    import.meta.env.VITE_QWEN_API_URL ||
    'https://dashscope.aliyuncs.com/compatible-mode/v1'
  const model = import.meta.env.VITE_QWEN_MODEL || 'qwen-plus'

  if (!apiKey) {
    throw new Error('请在 .env 中配置 VITE_QWEN_API_KEY')
  }

  const url = `${String(base).replace(/\/$/, '')}/chat/completions`
  const body = {
    model,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    temperature,
    max_tokens
  }

  let data
  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    })
    data = res.data
  } catch (e) {
    const apiMsg =
      e?.response?.data?.error?.message || e?.response?.data?.message || e?.message
    throw new Error(`Qwen 请求失败：${apiMsg || '未知错误'}`)
  }

  const content = data?.choices?.[0]?.message?.content
  if (content == null || content === '') {
    throw new Error('Qwen 返回为空')
  }
  return typeof content === 'string' ? content : String(content)
}
