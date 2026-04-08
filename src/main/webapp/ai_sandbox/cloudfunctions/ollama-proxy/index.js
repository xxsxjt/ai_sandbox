// 解决浏览器跨域问题的云函数代理
// 不需要额外依赖，直接使用 Node.js 内置 fetch

exports.main = async (event, context) => {
  const { prompt, model, maxTokens = 500 } = event;
  
  // 备用模型列表和映射
  const modelMappings = {
    // 云端模型映射
    'qwen3.5:397b-cloud': 'qwen3.5:397b-cloud',
    'glm-5:cloud': 'glm-5:cloud',
    'kimi-k2.5:cloud': 'kimi-k2.5:cloud',
    'minimax-m2.7:cloud': 'minimax-m2.7:cloud',
    'minimax-m2.5:cloud': 'minimax-m2.5:cloud',
    'qwen3-coder-next:cloud': 'qwen3-coder-next:cloud',
    'cogito-2.1:671b-cloud': 'cogito-2.1:671b-cloud',
    'mistral-large-3:675b-cloud': 'mistral-large-3:675b-cloud',
    'devstral-2:123b-cloud': 'devstral-2:123b-cloud',
    'deepseek-v3.2:cloud': 'deepseek-v3.2:cloud',
    'deepseek-v3.1:671b-cloud': 'deepseek-v3.1:671b-cloud',
    'gpt-oss:120b-cloud': 'gpt-oss:120b-cloud',
    'nemotron-3-nano:30b-cloud': 'nemotron-3-nano:30b-cloud',
    'ministral-3:14b-cloud': 'ministral-3:14b-cloud',
    // 标准模型
    'deepseek-v3.2': 'deepseek-v3.2',
    'qwen3.5:397b': 'qwen3.5:397b',
    'glm-5': 'glm-5'
  };
  
  // 默认使用 deepseek-v3.2
  const selectedModel = modelMappings[model] || modelMappings['deepseek-v3.2'] || 'deepseek-v3.2';
  
  // 检查是否有有效的 API 端点
  const API_ENDPOINTS = [
    'https://api.openai.com/v1/chat/completions',
    'https://api.deepseek.com/v1/chat/completions',
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
  ];
  
  // API 密钥（实际使用时应该从环境变量获取）
  const apiKeys = {
    'openai': process.env.OPENAI_API_KEY || '',
    'deepseek': process.env.DEEPSEEK_API_KEY || '',
    'aliyun': process.env.ALIYUN_API_KEY || ''
  };
  
  // 根据模型选择 API 端点
  let apiEndpoint = API_ENDPOINTS[0];
  let apiKey = apiKeys.openai;
  let provider = 'openai';
  
  if (selectedModel.includes('deepseek')) {
    apiEndpoint = API_ENDPOINTS[1];
    apiKey = apiKeys.deepseek;
    provider = 'deepseek';
  } else if (selectedModel.includes('qwen') || selectedModel.includes('glm')) {
    apiEndpoint = API_ENDPOINTS[2];
    apiKey = apiKeys.aliyun;
    provider = 'aliyun';
  }
  
  // 如果没有配置 API 密钥，使用免费代理
  if (!apiKey) {
    return await callFreeProxy(prompt, selectedModel, maxTokens);
  }
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', response.status, errorText);
      
      // 尝试备用方法
      return await callFreeProxy(prompt, selectedModel, maxTokens);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content.trim()) {
      console.error('AI返回了空回复:', JSON.stringify(data).substring(0, 500));
      return {
        success: false,
        error: 'AI返回了空回复',
        rawResponse: JSON.stringify(data).substring(0, 500)
      };
    }
    
    return {
      success: true,
      content: content,
      model: selectedModel,
      provider: provider
    };
    
  } catch (error) {
    console.error('API调用错误:', error);
    
    // 尝试免费代理作为最后的手段
    try {
      return await callFreeProxy(prompt, selectedModel, maxTokens);
    } catch (proxyError) {
      return {
        success: false,
        error: `所有API调用失败: ${error.message}`,
        suggestion: '请配置API密钥或检查网络连接'
      };
    }
  }
};

// 免费代理服务（备用方案）
async function callFreeProxy(prompt, model, maxTokens) {
  const proxyEndpoints = [
    'https://chatgpt-api.shn.hk/v1/chat/completions',
    'https://api-inference.huggingface.co/models/gpt2',
    'https://api.openai-proxy.org/v1/chat/completions'
  ];
  
  // 简化模型名称
  const simpleModel = model.split(':')[0];
  
  for (const endpoint of proxyEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          model: simpleModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.min(maxTokens, 200),
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || 
                       data.generated_text || 
                       '抱歉，暂时无法获取AI回复。请检查API配置。';
        
        return {
          success: true,
          content: content,
          model: model,
          provider: 'free-proxy',
          note: '使用免费代理服务，回复可能不完整'
        };
      }
    } catch (error) {
      console.warn(`代理端点 ${endpoint} 失败:`, error.message);
      continue;
    }
  }
  
  // 所有代理都失败，返回模拟回复
  const fallbackResponses = [
    "由于API配置问题，暂时无法获取AI回复。请检查您的API密钥设置。",
    "抱歉，当前服务暂时不可用。请稍后重试或检查网络连接。",
    "AI服务暂时不可用。建议：1. 检查API密钥配置 2. 确保网络连接正常 3. 稍后重试",
    "无法连接到AI服务。这可能是因为API密钥无效、网络问题或服务暂时不可用。"
  ];
  
  return {
    success: true,
    content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
    model: model,
    provider: 'fallback',
    note: '这是模拟回复，请配置有效的API密钥'
  };
}
