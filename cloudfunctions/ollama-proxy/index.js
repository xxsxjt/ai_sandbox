// 解决浏览器跨域问题的云函数代理
// 不需要额外依赖，直接使用 Node.js 内置 fetch

exports.main = async (event, context) => {
  const { prompt, model, maxTokens } = event;
  
  // 您的 Ollama Cloud API 密钥
  const apiKey = '2f54d28f2de146dc8ba0d1f1a3aa5f37.GRM9VK_HCxy0gsUBkxDKb4K-';
  
  // 备用模型列表
  const models = [
    'gpt-oss:120b',
    'deepseek-v3.1:671b',
    'deepseek-v3.2',
    'minimax-m2.5',
    'cogito-2.1:671b',
    'mistral-large-3:675b',
    'qwen3.5:397b',
    'kimi-k2.5',
    'glm-5'
  ];
  
  const selectedModel = model || models[0];
  
  // 直接使用 fetch 调用 ollama.com API
  const response = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `API调用失败: ${response.status} - ${errorText}`
    };
  }
  
  const data = await response.json();
  
  return {
    success: true,
    content: data.message.content,
    model: selectedModel
  };
};
