export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractText } = req.body;
  if (!contractText) {
    return res.status(400).json({ error: 'Текст договора отсутствует' });
  }

  //  КЛЮЧ БЕРЕТСЯ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ СЕРВЕРА, А НЕ ИЗ КОДА!
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on server' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Ты — юридический ИИ-помощник по аренде жилья в Казахстане. 
Проанализируй текст договора и верни ответ СТРОГО в формате JSON:
{
  "score": <число 0-100>,
  "findings": [
    {
      "title": "<Заголовок>",
      "explanation": "<Объяснение>",
      "severity": "<danger|warn|safe>",
      "articles": [{"num": "<Статья ГК РК>", "desc": "<Суть>"}]
    }
  ],
  "whatsapp": "<Текст сообщения хозяину>"
}`
          },
          { role: 'user', content: contractText }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: 'Ошибка ИИ: ' + error.message });
  }
}
