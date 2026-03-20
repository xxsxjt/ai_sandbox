// 服务器版本的前端脚本
const API_BASE_URL = window.location.origin + '/api';

// 应用全局状态
const AppState = {
    currentTab: 'analyzer',
    analysisResults: null,
    currentAnalysisData: null,
    analyses: [],
    summaries: [],
    user: null,
    token: localStorage.getItem('token') || null,
    settings: {
        apiKey: '',
        apiModel: 'zai-org/GLM-4.5',
        apiEndpoint: 'https://api.suanli.cn/v1'
    }
};

// DOM元素引用
const Elements = {
    // 标签页
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // 登录/注册页面
    loginSection: document.getElementById('login-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showRegisterBtn: document.getElementById('show-register'),
    showLoginBtn: document.getElementById('show-login'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // 分析页面
    sourceContext: document.getElementById('source-context'),
    aiAnswer: document.getElementById('ai-answer'),
    analysisType: document.getElementById('analysis-type'),
    strictness: document.getElementById('strictness'),
    analyzeBtn: document.getElementById('analyze-btn'),
    resultsSection: document.getElementById('results'),
    suspicionBar: document.getElementById('suspicion-bar'),
    suspicionScore: document.getElementById('suspicion-score'),
    issuesCount: document.getElementById('issues-count'),
    analysisTime: document.getElementById('analysis-time'),
    analysisDetails: document.getElementById('analysis-details'),
    detectedIssues: document.getElementById('detected-issues'),
    saveToDbBtn: document.getElementById('save-to-db-btn'),
    exportBtn: document.getElementById('export-btn'),
    
    // 案例库页面
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    resultsCount: document.getElementById('results-count'),
    casesTbody: document.getElementById('cases-tbody'),
    noResults: document.getElementById('no-results'),
    pagination: document.getElementById('pagination'),
    
    // 总结分析页面
    summariesContainer: document.getElementById('summaries-container'),
    exportAllSummariesBtn: document.getElementById('export-all-summaries-btn'),
    clearAllSummariesBtn: document.getElementById('clear-all-summaries-btn'),
    noSummaries: document.getElementById('no-summaries'),
    
    // 设置页面
    apiKey: document.getElementById('api-key'),
    toggleApiKey: document.getElementById('toggle-api-key'),
    apiModel: document.getElementById('api-model'),
    apiEndpoint: document.getElementById('api-endpoint'),
    saveApiKeyBtn: document.getElementById('save-api-key'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    
    // 模态框
    modal: document.getElementById('modal'),
    caseModal: document.getElementById('case-modal'),
    summaryModal: document.getElementById('summary-modal'),
    modalBody: document.getElementById('modal-body'),
    caseModalBody: document.getElementById('case-modal-body'),
    summaryModalBody: document.getElementById('summary-modal-body'),
    closeButtons: document.querySelectorAll('.close'),
    
    // 加载指示器
    loadingOverlay: document.getElementById('loading-overlay')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupEventListeners();
    
    // 检查用户登录状态
    if (AppState.token) {
        try {
            // 验证token有效性
            const response = await apiRequest('/user/profile', 'GET');
            AppState.user = response.user;
            showApp();
            loadAnalyses();
            loadSummaries();
        } catch (error) {
            console.error('Token验证失败:', error);
            logout();
        }
    } else {
        showLogin();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 登录/注册切换
    if (Elements.showRegisterBtn) {
        Elements.showRegisterBtn.addEventListener('click', showRegisterForm);
    }
    if (Elements.showLoginBtn) {
        Elements.showLoginBtn.addEventListener('click', showLoginForm);
    }
    if (Elements.logoutBtn) {
        Elements.logoutBtn.addEventListener('click', logout);
    }
    
    // 登录表单
    if (Elements.loginForm) {
        Elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // 注册表单
    if (Elements.registerForm) {
        Elements.registerForm.addEventListener('submit', handleRegister);
    }
    
    // 标签页切换
    Elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // 分析按钮
    if (Elements.analyzeBtn) {
        Elements.analyzeBtn.addEventListener('click', analyzeAnswer);
    }
    
    // 搜索和过滤
    if (Elements.searchBtn) {
        Elements.searchBtn.addEventListener('click', searchAnalyses);
    }
    if (Elements.searchInput) {
        Elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchAnalyses();
        });
    }
    
    // 结果操作按钮
    if (Elements.saveToDbBtn) {
        Elements.saveToDbBtn.addEventListener('click', saveToDatabase);
    }
    if (Elements.exportBtn) {
        Elements.exportBtn.addEventListener('click', exportResults);
    }
    
    // 设置页面
    if (Elements.saveApiKeyBtn) {
        Elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    }
    if (Elements.toggleApiKey) {
        Elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    }
    
    // 总结分析页面
    if (Elements.exportAllSummariesBtn) {
        Elements.exportAllSummariesBtn.addEventListener('click', exportAllSummaries);
    }
    if (Elements.clearAllSummariesBtn) {
        Elements.clearAllSummariesBtn.addEventListener('click', clearAllSummaries);
    }
    
    // 模态框关闭
    Elements.closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            Elements.modal.style.display = 'none';
            Elements.caseModal.style.display = 'none';
            Elements.summaryModal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === Elements.modal) {
            Elements.modal.style.display = 'none';
        }
        if (event.target === Elements.caseModal) {
            Elements.caseModal.style.display = 'none';
        }
        if (event.target === Elements.summaryModal) {
            Elements.summaryModal.style.display = 'none';
        }
    });
}

// 显示登录界面
function showLogin() {
    if (Elements.loginSection) Elements.loginSection.style.display = 'block';
    if (Elements.appSection) Elements.appSection.style.display = 'none';
}

// 显示应用界面
function showApp() {
    if (Elements.loginSection) Elements.loginSection.style.display = 'none';
    if (Elements.appSection) Elements.appSection.style.display = 'block';
    
    // 更新用户信息
    if (Elements.userName && AppState.user) {
        Elements.userName.textContent = AppState.user.username;
    }
    if (Elements.userEmail && AppState.user) {
        Elements.userEmail.textContent = AppState.user.email;
    }
}

// 显示登录表单
function showLoginForm() {
    if (Elements.loginForm) {
        Elements.loginForm.style.display = 'block';
    }
    if (Elements.registerForm) {
        Elements.registerForm.style.display = 'none';
    }
}

// 显示注册表单
function showRegisterForm() {
    if (Elements.loginForm) {
        Elements.loginForm.style.display = 'none';
    }
    if (Elements.registerForm) {
        Elements.registerForm.style.display = 'block';
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = e.target.querySelector('input[name="username"]').value;
    const password = e.target.querySelector('input[name="password"]').value;
    
    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }
    
    showLoading(true, 'login');
    
    try {
        const response = await apiRequest('/login', 'POST', { username, password });
        
        AppState.token = response.token;
        AppState.user = response.user;
        AppState.settings.apiKey = response.user.api_key || '';
        
        localStorage.setItem('token', response.token);
        
        showMessage('登录成功', 'success');
        showApp();
        loadAnalyses();
        loadSummaries();
        
        // 更新API密钥输入框
        if (Elements.apiKey) {
            Elements.apiKey.value = AppState.settings.apiKey || '';
        }
    } catch (error) {
        console.error('登录失败:', error);
        showMessage(error.message || '登录失败', 'error');
    } finally {
        showLoading(false, 'login');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    
    const username = e.target.querySelector('input[name="username"]').value;
    const email = e.target.querySelector('input[name="email"]').value;
    const password = e.target.querySelector('input[name="password"]').value;
    const confirmPassword = e.target.querySelector('input[name="confirmPassword"]').value;
    
    if (!username || !email || !password) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    showLoading(true, 'register');
    
    try {
        const response = await apiRequest('/register', 'POST', { 
            username, 
            email, 
            password 
        });
        
        showMessage('注册成功，请登录', 'success');
        showLoginForm();
    } catch (error) {
        console.error('注册失败:', error);
        showMessage(error.message || '注册失败', 'error');
    } finally {
        showLoading(false, 'register');
    }
}

// 登出
function logout() {
    AppState.token = null;
    AppState.user = null;
    localStorage.removeItem('token');
    showLogin();
    showMessage('已退出登录', 'info');
}

// API请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (AppState.token) {
        options.headers.Authorization = `Bearer ${AppState.token}`;
    }
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.error || '请求失败');
    }
    
    return result;
}

// 分析内容
async function analyzeAnswer() {
    const answerText = Elements.aiAnswer.value.trim();
    const contextText = Elements.sourceContext.value.trim();
    const analysisType = Elements.analysisType.value;
    const strictness = Elements.strictness.value;
    
    if (!answerText) {
        showMessage('请输入待分析的内容', 'error');
        return;
    }
    
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    showLoading(true, 'analyze');
    
    try {
        const analysisPrompt = buildAnalysisPrompt(answerText, contextText, analysisType, strictness);
        
        const response = await apiRequest('/analyze', 'POST', {
            prompt: analysisPrompt,
            apiKey: AppState.settings.apiKey,
            model: AppState.settings.apiModel,
            apiEndpoint: AppState.settings.apiEndpoint
        });
        
        const analysis = parseAnalysisResponse(response.analysis);
        
        AppState.currentAnalysisData = {
            answer: answerText,
            context: contextText,
            analysisType,
            strictness,
            timestamp: new Date().toISOString(),
            ...analysis
        };
        
        displayResults();
        Elements.resultsSection.style.display = 'block';
        Elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('分析失败:', error);
        showMessage(`分析失败: ${error.message}`, 'error');
    } finally {
        showLoading(false, 'analyze');
    }
}

// 构建分析提示词
function buildAnalysisPrompt(answer, context, analysisType, strictness) {
    let prompt = `请仔细分析以下内容，检测其中可能存在的可疑陈述、不准确信息或潜在问题。
    
内容:
"""
${answer}
"""
`;
    
    if (context) {
        prompt += `
上下文信息:
"""
${context}
"""
`;
    }
    
    const strictnessLevels = {
        low: '采用宽松标准，仅标记明显的错误和问题',
        medium: '采用中等标准，标记可能的错误、不明确表述和潜在问题',
        high: '采用严格标准，详细分析所有可能的细微问题和不准确之处'
    };
    
    const analysisTypes = {
        general: '进行常规分析，检测各类问题',
        factual: '专注于事实核查，验证陈述的准确性',
        bias: '专注于偏见检测，识别潜在的偏见、倾向性表述',
        comprehensive: '进行全面分析，包含事实核查、偏见检测等多维度评估'
    };
    
    prompt += `
分析要求:
- 分析类型: ${analysisTypes[analysisType]}
- 严格程度: ${strictnessLevels[strictness]}

请以JSON格式返回分析结果，包含以下字段:
1. suspicionScore (0-100): 可疑度评分，0表示完全可信，100表示高度可疑
2. summary (string): 总体评估摘要
3. issues (array): 检测到的问题列表，每个问题包含:
   - type (string): 问题类型，如"factual-error", "bias", "uncertainty", "outdated"等
   - severity (string): 严重程度，"low", "medium", "high"
   - description (string): 问题描述
   - suggestion (string): 改进建议
4. strengths (array): 内容的优点和可取之处
5. overallRating (string): 总体评级，"excellent", "good", "fair", "poor"

请确保返回的是有效的JSON格式，不要包含任何额外的文字说明。`;
    
    return prompt;
}

// 解析AI分析响应
function parseAnalysisResponse(analysis) {
    try {
        // 尝试提取JSON部分（AI会在JSON前后添加一些文字）
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : analysis;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('解析分析结果失败:', error);
        
        // 如果解析失败，尝试构造一个基本的结果对象
        return {
            suspicionScore: 50,
            summary: '分析结果解析失败，但已记录原始分析内容。',
            issues: [{
                type: 'parsing-error',
                severity: 'medium',
                description: '无法正确解析分析结果',
                suggestion: '请检查API返回的格式'
            }],
            strengths: [],
            overallRating: 'fair',
            rawAnalysis: analysis
        };
    }
}

// 显示分析结果
function displayResults() {
    const data = AppState.currentAnalysisData;
    
    // 更新可疑度评分
    Elements.suspicionBar.style.width = `${data.suspicionScore}%`;
    Elements.suspicionScore.textContent = `${data.suspicionScore}%`;
    
    // 更新问题数量
    Elements.issuesCount.textContent = data.issues ? data.issues.length : 0;
    
    // 更新分析时间
    const analysisTime = new Date(data.timestamp).toLocaleString();
    Elements.analysisTime.textContent = analysisTime;
    
    // 显示详细分析
    Elements.analysisDetails.textContent = data.summary || '分析摘要不可用';
    
    // 显示检测到的问题
    if (data.issues && data.issues.length > 0) {
        Elements.detectedIssues.innerHTML = data.issues.map(issue => `
            <div class="issue-item">
                <div class="issue-title">
                    <span class="tag-badge">${getIssueTypeLabel(issue.type)}</span>
                    <span class="tag-badge ${issue.severity}">${getSeverityLabel(issue.severity)}</span>
                </div>
                <div class="issue-description">${issue.description}</div>
                ${issue.suggestion ? `<div class="issue-suggestion">建议: ${issue.suggestion}</div>` : ''}
            </div>
        `).join('');
    } else {
        Elements.detectedIssues.innerHTML = '<div class="issue-item"><div class="issue-description">未检测到明显问题</div></div>';
    }
}

// 保存到数据库
async function saveToDatabase() {
    if (!AppState.currentAnalysisData) {
        showMessage('没有可保存的分析结果', 'error');
        return;
    }
    
    showLoading(true, 'save-analysis');
    
    try {
        await apiRequest('/analyses', 'POST', {
            content: AppState.currentAnalysisData.answer,
            context: AppState.currentAnalysisData.context,
            analysisType: AppState.currentAnalysisData.analysisType,
            strictness: AppState.currentAnalysisData.strictness,
            suspicionScore: AppState.currentAnalysisData.suspicionScore,
            summary: AppState.currentAnalysisData.summary,
            issues: AppState.currentAnalysisData.issues,
            strengths: AppState.currentAnalysisData.strengths,
            overallRating: AppState.currentAnalysisData.overallRating,
            tags: extractTags(AppState.currentAnalysisData)
        });
        
        showMessage('分析结果已保存', 'success');
        
        // 刷新分析列表
        loadAnalyses();
        
    } catch (error) {
        console.error('保存失败:', error);
        showMessage(`保存失败: ${error.message}`, 'error');
    } finally {
        showLoading(false, 'save-analysis');
    }
}

// 提取标签
function extractTags(analysisData) {
    const tags = [];
    
    if (analysisData.issues && analysisData.issues.length > 0) {
        const issueTypes = [...new Set(analysisData.issues.map(issue => issue.type))];
        tags.push(...issueTypes);
    }
    
    // 根据可疑度添加标签
    if (analysisData.suspicionScore > 70) {
        tags.push('high-suspicion');
    } else if (analysisData.suspicionScore > 40) {
        tags.push('medium-suspicion');
    } else {
        tags.push('low-suspicion');
    }
    
    return tags;
}

// 导出结果
function exportResults() {
    if (!AppState.currentAnalysisData) {
        showMessage('没有可导出的分析结果', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.currentAnalysisData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('分析结果已导出', 'success');
}

// 加载分析列表
async function loadAnalyses(search = '') {
    showLoading(true, 'load-analyses');
    
    try {
        const analyses = await apiRequest(`/analyses?search=${encodeURIComponent(search)}`);
        AppState.analyses = analyses;
        updateAnalysesDisplay();
    } catch (error) {
        console.error('加载分析列表失败:', error);
        showMessage('加载分析列表失败', 'error');
    } finally {
        showLoading(false, 'load-analyses');
    }
}

// 搜索分析
function searchAnalyses() {
    const searchTerm = Elements.searchInput.value.trim();
    loadAnalyses(searchTerm);
}

// 更新分析显示
function updateAnalysesDisplay() {
    if (AppState.analyses.length === 0) {
        Elements.casesTbody.innerHTML = '';
        Elements.noResults.style.display = 'block';
        Elements.resultsCount.textContent = '共找到 0 个案例';
        return;
    }
    
    Elements.noResults.style.display = 'none';
    Elements.resultsCount.textContent = `共找到 ${AppState.analyses.length} 个案例`;
    
    Elements.casesTbody.innerHTML = AppState.analyses.map(analysis => `
        <tr>
            <td>${new Date(analysis.created_at).toLocaleDateString()}</td>
            <td>${analysis.content.substring(0, 100)}${analysis.content.length > 100 ? '...' : ''}</td>
            <td>
                <span class="suspicion-badge ${getSuspicionClass(analysis.suspicion_score)}">
                    ${analysis.suspicion_score}%
                </span>
            </td>
            <td>${analysis.issues && analysis.issues.length > 0 ? analysis.issues[0].description : '无'}</td>
            <td>${analysis.tags.map(tag => `<span class="tag-badge">${getTagLabel(tag)}</span>`).join('')}</td>
            <td>
                ${analysis.is_public === 1 ? '<span class="tag-badge">公开</span>' : '<span class="tag-badge">私有</span>'}
            </td>
            <td>
                <div class="action-buttons">
                    <button title="查看详情" onclick="viewAnalysis(${analysis.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button title="编辑" onclick="editAnalysis(${analysis.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button title="删除" onclick="deleteAnalysis(${analysis.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 查看分析详情
function viewAnalysis(id) {
    const analysis = AppState.analyses.find(a => a.id === id);
    if (!analysis) return;
    
    Elements.caseModalBody.innerHTML = `
        <h2>分析详情</h2>
        <div class="case-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>时间:</strong> ${new Date(analysis.created_at).toLocaleString()}</p>
                <p><strong>分析类型:</strong> ${getAnalysisTypeLabel(analysis.analysis_type)}</p>
                <p><strong>严格程度:</strong> ${getStrictnessLabel(analysis.strictness)}</p>
                <p><strong>可疑度评分:</strong> <span class="suspicion-badge ${getSuspicionClass(analysis.suspicion_score)}">${analysis.suspicion_score}%</span></p>
                <p><strong>总体评级:</strong> ${getRatingLabel(analysis.overall_rating)}</p>
                <p><strong>状态:</strong> 
                    ${analysis.is_public === 1 ? '<span class="tag-badge">公开</span>' : '<span class="tag-badge">私有</span>'}
                </p>
            </div>
            
            <div class="detail-section">
                <h3>上下文</h3>
                <p>${analysis.context || '无'}</p>
            </div>
            
            <div class="detail-section">
                <h3>完整内容</h3>
                <p>${analysis.content}</p>
            </div>
            
            <div class="detail-section">
                <h3>分析摘要</h3>
                <p>${analysis.summary}</p>
            </div>
            
            <div class="detail-section">
                <h3>检测到的问题</h3>
                ${analysis.issues && analysis.issues.length > 0 ? 
                    analysis.issues.map(issue => `
                        <div class="issue-item">
                            <div class="issue-title">
                                <span class="tag-badge">${getIssueTypeLabel(issue.type)}</span>
                                <span class="tag-badge ${issue.severity}">${getSeverityLabel(issue.severity)}</span>
                            </div>
                            <div class="issue-description">${issue.description}</div>
                            ${issue.suggestion ? `<div class="issue-suggestion">建议: ${issue.suggestion}</div>` : ''}
                        </div>
                    `).join('') : 
                    '<p>未检测到明显问题</p>'
                }
            </div>
            
            <div class="detail-section">
                <h3>优点</h3>
                ${analysis.strengths && analysis.strengths.length > 0 ?
                    `<ul>${analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}</ul>` :
                    '<p>无记录的优点</p>'
                }
            </div>
            
            <div class="detail-section">
                <h3>标签</h3>
                <div>${analysis.tags.map(tag => `<span class="tag-badge">${getTagLabel(tag)}</span>`).join('')}</div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="secondary-btn" onclick="editAnalysis(${analysis.id})">
                <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="secondary-btn" onclick="toggleAnalysisPublic(${analysis.id}, ${analysis.is_public})">
                <i class="fas fa-${analysis.is_public ? 'lock' : 'unlock'}"></i> ${analysis.is_public ? '设为私有' : '设为公开'}
            </button>
            <button class="danger-btn" onclick="deleteAnalysis(${analysis.id})">
                <i class="fas fa-trash"></i> 删除分析
            </button>
        </div>
    `;
    
    Elements.caseModal.style.display = 'block';
}

// 删除分析
async function deleteAnalysis(id) {
    if (!confirm('确定要删除这个分析吗？')) return;
    
    showLoading(true, 'delete-analysis');
    
    try {
        await apiRequest(`/analyses/${id}`, 'DELETE');
        showMessage('分析已删除', 'success');
        
        // 从列表中移除
        AppState.analyses = AppState.analyses.filter(a => a.id !== id);
        updateAnalysesDisplay();
        
        // 关闭模态框
        Elements.caseModal.style.display = 'none';
    } catch (error) {
        console.error('删除失败:', error);
        showMessage('删除失败', 'error');
    } finally {
        showLoading(false, 'delete-analysis');
    }
}

// 编辑分析
function editAnalysis(id) {
    const analysis = AppState.analyses.find(a => a.id === id);
    if (!analysis) return;
    
    // 切换到编辑模式
    Elements.caseModalBody.innerHTML = `
        <h2>编辑分析</h2>
        <form id="edit-analysis-form">
            <div class="form-group">
                <label for="edit-content">分析内容</label>
                <textarea id="edit-content" rows="5" required>${analysis.content}</textarea>
            </div>
            
            <div class="form-group">
                <label for="edit-context">上下文</label>
                <textarea id="edit-context" rows="3">${analysis.context || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-public" ${analysis.is_public ? 'checked' : ''}>
                    设为公开（其他用户可以查看）
                </label>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="secondary-btn" onclick="viewAnalysis(${analysis.id})">
                    <i class="fas fa-times"></i> 取消
                </button>
                <button type="submit" class="primary-btn">
                    <i class="fas fa-save"></i> 保存更改
                </button>
            </div>
        </form>
    `;
    
    // 设置表单提交事件
    document.getElementById('edit-analysis-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAnalysisEdit(id);
    });
}

// 保存分析编辑
async function saveAnalysisEdit(id) {
    const content = document.getElementById('edit-content').value.trim();
    const context = document.getElementById('edit-context').value.trim();
    const isPublic = document.getElementById('edit-public').checked;
    
    if (!content) {
        showMessage('分析内容不能为空', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await apiRequest(`/analyses/${id}`, 'PUT', {
            content,
            context,
            is_public: isPublic
        });
        
        showMessage('分析已更新', 'success');
        
        // 更新本地数据
        const analysis = AppState.analyses.find(a => a.id === id);
        if (analysis) {
            analysis.content = content;
            analysis.context = context;
            analysis.is_public = isPublic ? 1 : 0;
        }
        
        updateAnalysesDisplay();
        viewAnalysis(id); // 返回详情视图
    } catch (error) {
        console.error('更新失败:', error);
        showMessage(`更新失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 切换分析公开状态
async function toggleAnalysisPublic(id, currentState) {
    const newState = currentState === 1 ? 0 : 1;
    const actionText = newState === 1 ? '公开' : '私有';
    
    if (!confirm(`确定要将此分析设为${actionText}吗？`)) return;
    
    showLoading(true);
    
    try {
        await apiRequest(`/analyses/${id}`, 'PUT', {
            is_public: newState
        });
        
        showMessage(`分析已设为${actionText}`, 'success');
        
        // 更新本地数据
        const analysis = AppState.analyses.find(a => a.id === id);
        if (analysis) {
            analysis.is_public = newState;
        }
        
        viewAnalysis(id); // 刷新详情视图
        updateAnalysesDisplay(); // 更新列表显示
    } catch (error) {
        console.error('更改状态失败:', error);
        showMessage(`更改状态失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 加载总结列表
async function loadSummaries() {
    showLoading(true, 'load-summaries');
    
    try {
        const summaries = await apiRequest('/summaries');
        AppState.summaries = summaries;
        updateSummariesDisplay();
    } catch (error) {
        console.error('加载总结列表失败:', error);
        showMessage('加载总结列表失败', 'error');
    } finally {
        showLoading(false, 'load-summaries');
    }
}

// 更新总结显示
function updateSummariesDisplay() {
    if (AppState.summaries.length === 0) {
        Elements.summariesContainer.innerHTML = '';
        Elements.noSummaries.style.display = 'block';
        return;
    }
    
    Elements.noSummaries.style.display = 'none';
    
    Elements.summariesContainer.innerHTML = AppState.summaries.map(summary => `
        <div class="summary-card">
            <div class="summary-header">
                <h4 class="summary-title">${summary.title}</h4>
                <div class="summary-date">${new Date(summary.created_at).toLocaleDateString()}</div>
            </div>
            
            <div class="summary-content">
                ${summary.content.length > 200 
                    ? summary.content.substring(0, 200) + '...' 
                    : summary.content}
            </div>
            
            <div class="summary-actions">
                <button class="secondary-btn" onclick="showSummaryDetails(${summary.id})">
                    <i class="fas fa-eye"></i> 查看详情
                </button>
                <button class="secondary-btn" onclick="editSummary(${summary.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="danger-btn" onclick="deleteSummary(${summary.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 显示总结详情
function showSummaryDetails(id) {
    const summary = AppState.summaries.find(s => s.id === id);
    if (!summary) return;
    
    Elements.summaryModalBody.innerHTML = `
        <h2>总结详情</h2>
        <div class="case-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>创建时间:</strong> ${new Date(summary.created_at).toLocaleString()}</p>
                <p><strong>标题:</strong> ${summary.title}</p>
                <p><strong>状态:</strong> 
                    ${summary.is_public === 1 ? '<span class="tag-badge">公开</span>' : '<span class="tag-badge">私有</span>'}
                </p>
            </div>
            
            <div class="detail-section">
                <h3>总结内容</h3>
                <div class="analysis-text">${summary.content}</div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="secondary-btn" onclick="editSummary(${summary.id})">
                <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="secondary-btn" onclick="toggleSummaryPublic(${summary.id}, ${summary.is_public})">
                <i class="fas fa-${summary.is_public ? 'lock' : 'unlock'}"></i> ${summary.is_public ? '设为私有' : '设为公开'}
            </button>
            <button class="danger-btn" onclick="deleteSummary(${summary.id})">
                <i class="fas fa-trash"></i> 删除总结
            </button>
        </div>
    `;
    
    Elements.summaryModal.style.display = 'block';
}

// 删除总结
async function deleteSummary(id) {
    if (!confirm('确定要删除这个总结吗？')) return;
    
    showLoading(true, 'delete-summary');
    
    try {
        await apiRequest(`/summaries/${id}`, 'DELETE');
        showMessage('总结已删除', 'success');
        
        // 从列表中移除
        AppState.summaries = AppState.summaries.filter(s => s.id !== id);
        updateSummariesDisplay();
        
        // 关闭模态框
        Elements.summaryModal.style.display = 'none';
    } catch (error) {
        console.error('删除失败:', error);
        showMessage('删除失败', 'error');
    } finally {
        showLoading(false, 'delete-summary');
    }
}
}

// 编辑总结
function editSummary(id) {
    const summary = AppState.summaries.find(s => s.id === id);
    if (!summary) return;
    
    // 切换到编辑模式
    Elements.summaryModalBody.innerHTML = `
        <h2>编辑总结</h2>
        <form id="edit-summary-form">
            <div class="form-group">
                <label for="edit-title">标题</label>
                <input type="text" id="edit-title" value="${summary.title}" required>
            </div>
            
            <div class="form-group">
                <label for="edit-content">总结内容</label>
                <textarea id="edit-summary-content" rows="10" required>${summary.content}</textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-summary-public" ${summary.is_public ? 'checked' : ''}>
                    设为公开（其他用户可以查看）
                </label>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="secondary-btn" onclick="showSummaryDetails(${summary.id})">
                    <i class="fas fa-times"></i> 取消
                </button>
                <button type="submit" class="primary-btn">
                    <i class="fas fa-save"></i> 保存更改
                </button>
            </div>
        </form>
    `;
    
    // 设置表单提交事件
    document.getElementById('edit-summary-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSummaryEdit(id);
    });
}

// 保存总结编辑
async function saveSummaryEdit(id) {
    const title = document.getElementById('edit-title').value.trim();
    const content = document.getElementById('edit-summary-content').value.trim();
    const isPublic = document.getElementById('edit-summary-public').checked;
    
    if (!title || !content) {
        showMessage('标题和内容不能为空', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await apiRequest(`/summaries/${id}`, 'PUT', {
            title,
            content,
            is_public: isPublic
        });
        
        showMessage('总结已更新', 'success');
        
        // 更新本地数据
        const summary = AppState.summaries.find(s => s.id === id);
        if (summary) {
            summary.title = title;
            summary.content = content;
            summary.is_public = isPublic ? 1 : 0;
        }
        
        updateSummariesDisplay();
        showSummaryDetails(id); // 返回详情视图
    } catch (error) {
        console.error('更新失败:', error);
        showMessage(`更新失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 切换总结公开状态
async function toggleSummaryPublic(id, currentState) {
    const newState = currentState === 1 ? 0 : 1;
    const actionText = newState === 1 ? '公开' : '私有';
    
    if (!confirm(`确定要将此总结设为${actionText}吗？`)) return;
    
    showLoading(true);
    
    try {
        await apiRequest(`/summaries/${id}`, 'PUT', {
            is_public: newState
        });
        
        showMessage(`总结已设为${actionText}`, 'success');
        
        // 更新本地数据
        const summary = AppState.summaries.find(s => s.id === id);
        if (summary) {
            summary.is_public = newState;
        }
        
        showSummaryDetails(id); // 刷新详情视图
        updateSummariesDisplay(); // 更新列表显示
    } catch (error) {
        console.error('更改状态失败:', error);
        showMessage(`更改状态失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 导出所有总结
function exportAllSummaries() {
    if (AppState.summaries.length === 0) {
        showMessage('总结列表为空，没有可导出的数据', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.summaries, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `summaries-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('所有总结已导出', 'success');
}

// 清空所有总结
async function clearAllSummaries() {
    if (AppState.summaries.length === 0) {
        showMessage('总结列表已经是空的', 'info');
        return;
    }
    
    if (!confirm(`确定要清空所有总结吗？这将删除${AppState.summaries.length}个总结，此操作不可恢复！`)) {
        return;
    }
    
    try {
        // 逐个删除总结
        for (const summary of AppState.summaries) {
            await apiRequest(`/summaries/${summary.id}`, 'DELETE');
        }
        
        AppState.summaries = [];
        updateSummariesDisplay();
        showMessage('所有总结已清空', 'success');
    } catch (error) {
        console.error('清空失败:', error);
        showMessage('清空失败', 'error');
    }
}

// 保存API密钥
async function saveApiKey() {
    const apiKey = Elements.apiKey.value.trim();
    
    try {
        await apiRequest('/user/apikey', 'PUT', { apiKey });
        AppState.settings.apiKey = apiKey;
        showMessage('API密钥已保存', 'success');
    } catch (error) {
        console.error('保存API密钥失败:', error);
        showMessage('保存API密钥失败', 'error');
    }
}

// 切换API密钥可见性
function toggleApiKeyVisibility() {
    if (Elements.apiKey.type === 'password') {
        Elements.apiKey.type = 'text';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        Elements.apiKey.type = 'password';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// 标签页切换
function switchTab(tabName) {
    // 更新标签按钮状态
    Elements.tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // 更新标签内容显示
    Elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    AppState.currentTab = tabName;
}

// 处理中的任务列表
const processingTasks = new Set();

// 工具函数
function showLoading(show, taskId = 'default') {
    if (show) {
        processingTasks.add(taskId);
    } else {
        processingTasks.delete(taskId);
    }
    updateProcessingUI();
}

// 更新处理中的UI显示
function updateProcessingUI() {
    if (processingTasks.size === 0) {
        // 如果没有处理中的任务，隐藏处理中列表
        const existingList = document.getElementById('processing-tasks-list');
        if (existingList) {
            existingList.remove();
        }
        return;
    }
    
    // 查找或创建处理中列表
    let processingList = document.getElementById('processing-tasks-list');
    if (!processingList) {
        processingList = document.createElement('div');
        processingList.id = 'processing-tasks-list';
        processingList.className = 'processing-tasks-container';
        processingList.innerHTML = `
            <div class="processing-header">
                <h3><i class="fas fa-spinner fa-spin"></i> 处理中</h3>
                <button class="minimize-btn" onclick="toggleProcessingList()">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
            <div class="processing-tasks">
                <!-- 任务列表将通过JS动态更新 -->
            </div>
        `;
        document.body.appendChild(processingList);
    }
    
    // 更新任务列表
    const tasksContainer = processingList.querySelector('.processing-tasks');
    if (processingTasks.size > 0) {
        let tasksHTML = '';
        processingTasks.forEach(taskId => {
            const taskInfo = getTaskInfo(taskId);
            tasksHTML += `
                <div class="processing-task">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>${taskInfo.message}</span>
                </div>
            `;
        });
        tasksContainer.innerHTML = tasksHTML;
    }
    
    // 显示处理中列表
    processingList.style.display = 'block';
}

// 获取任务信息
function getTaskInfo(taskId) {
    const taskInfos = {
        'default': { message: '正在处理请求...' },
        'analyze': { message: '正在分析内容...' },
        'save-analysis': { message: '正在保存分析结果...' },
        'delete-analysis': { message: '正在删除分析...' },
        'save-summary': { message: '正在保存总结...' },
        'delete-summary': { message: '正在删除总结...' },
        'load-analyses': { message: '正在加载分析列表...' },
        'load-summaries': { message: '正在加载总结列表...' },
        'login': { message: '正在登录...' },
        'register': { message: '正在注册...' }
    };
    
    return taskInfos[taskId] || { message: '正在处理...' };
}

// 切换处理中列表的显示状态
function toggleProcessingList() {
    const processingList = document.getElementById('processing-tasks-list');
    const tasksContainer = processingList.querySelector('.processing-tasks');
    
    if (tasksContainer.style.display === 'none') {
        tasksContainer.style.display = 'block';
        processingList.querySelector('.minimize-btn i').className = 'fas fa-minus';
    } else {
        tasksContainer.style.display = 'none';
        processingList.querySelector('.minimize-btn i').className = 'fas fa-plus';
    }
}

function showMessage(message, type = 'info') {
    Elements.modalBody.innerHTML = `
        <div class="message ${type}">
            <div class="message-icon">
                ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                  type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
                  '<i class="fas fa-info-circle"></i>'}
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    Elements.modal.style.display = 'block';
    
    // 自动关闭成功和信息消息
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            Elements.modal.style.display = 'none';
        }, 3000);
    }
}

// 标签和分类的辅助函数
function getIssueTypeLabel(type) {
    const labels = {
        'factual-error': '事实错误',
        'bias': '偏见',
        'uncertainty': '表述不明确',
        'outdated': '信息过时',
        'parsing-error': '解析错误'
    };
    return labels[type] || type;
}

function getSeverityLabel(severity) {
    const labels = {
        'low': '低',
        'medium': '中',
        'high': '高'
    };
    return labels[severity] || severity;
}

function getSuspicionClass(score) {
    if (score > 70) return 'suspicion-high';
    if (score > 40) return 'suspicion-medium';
    return 'suspicion-low';
}

function getAnalysisTypeLabel(type) {
    const labels = {
        'general': '常规分析',
        'factual': '事实核查',
        'bias': '偏见检测',
        'comprehensive': '综合分析'
    };
    return labels[type] || type;
}

function getStrictnessLabel(strictness) {
    const labels = {
        'low': '宽松',
        'medium': '中等',
        'high': '严格'
    };
    return labels[strictness] || strictness;
}

function getRatingLabel(rating) {
    const labels = {
        'excellent': '优秀',
        'good': '良好',
        'fair': '一般',
        'poor': '较差'
    };
    return labels[rating] || rating;
}

function getTagLabel(tag) {
    const labels = {
        'factual-error': '事实错误',
        'bias': '偏见',
        'uncertainty': '表述不明确',
        'outdated': '信息过时',
        'high-suspicion': '高可疑度',
        'medium-suspicion': '中可疑度',
        'low-suspicion': '低可疑度'
    };
    return labels[tag] || tag;
}