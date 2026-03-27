// 应用全局状态
const AppState = {
    currentTab: 'analyzer',
    analysisResults: null,
    currentAnalysisData: null,
    cases: [],
    filteredCases: [],
    currentPage: 1,
    itemsPerPage: 10,
    selectedCases: new Set(),
    summaries: [],
    settings: {
        apiKey: 'ollama',
        apiModel: 'qwen3.5:latest',
        apiEndpoint: 'http://localhost:11434',
        storageLocation: 'local',
        maxEntries: 1000
    }
};

// DOM元素引用
const Elements = {
    // 标签页
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
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
    suspicionMin: document.getElementById('suspicion-min'),
    suspicionMax: document.getElementById('suspicion-max'),
    dateFilter: document.getElementById('date-filter'),
    tagFilter: document.getElementById('tag-filter'),
    resultsCount: document.getElementById('results-count'),
    importCasesBtn: document.getElementById('import-cases-btn'),
    exportDbBtn: document.getElementById('export-db-btn'),
    casesTbody: document.getElementById('cases-tbody'),
    noResults: document.getElementById('no-results'),
    pagination: document.getElementById('pagination'),
    selectAllCases: document.getElementById('select-all-cases'),
    selectedCount: document.getElementById('selected-count'),
    bulkActions: document.getElementById('bulk-actions'),
    
    // 批量操作按钮
    bulkExportJsonBtn: document.getElementById('bulk-export-json-btn'),
    bulkExportWordBtn: document.getElementById('bulk-export-word-btn'),
    bulkExportExcelBtn: document.getElementById('bulk-export-excel-btn'),
    bulkAnalyzeBtn: document.getElementById('bulk-analyze-btn'),
    bulkDeleteBtn: document.getElementById('bulk-delete-btn'),
    
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
    storageLocation: document.getElementById('storage-location'),
    maxEntries: document.getElementById('max-entries'),
    exportAllBtn: document.getElementById('export-all-btn'),
    importBtn: document.getElementById('import-btn'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    
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

function initializeApp() {
    // 动态填充模型下拉框（分析器不需要随机选项，但兼容也无妨）
    populateModelSelect(document.getElementById('api-model'), false, 'qwen3.5:latest');

    loadSettings();
    loadCases();
    loadSummaries();
    setupEventListeners();
    updateCasesDisplay();
    updateSummariesDisplay();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    Elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // 分析按钮
    Elements.analyzeBtn.addEventListener('click', analyzeAnswer);
    
    // 案例库搜索和过滤
    Elements.searchBtn.addEventListener('click', filterAndSearchCases);
    Elements.searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterAndSearchCases();
    });
    Elements.suspicionMin.addEventListener('input', filterAndSearchCases);
    Elements.suspicionMax.addEventListener('input', filterAndSearchCases);
    Elements.dateFilter.addEventListener('change', filterAndSearchCases);
    Elements.tagFilter.addEventListener('change', filterAndSearchCases);
    
    // 结果操作按钮
    Elements.saveToDbBtn.addEventListener('click', saveToDatabase);
    Elements.exportBtn.addEventListener('click', exportResults);
    
    // 案例库操作按钮
    Elements.importCasesBtn.addEventListener('click', importCases);
    Elements.exportDbBtn.addEventListener('click', exportDatabase);
    
    // 批量操作按钮
    Elements.selectAllCases.addEventListener('change', toggleSelectAll);
    Elements.bulkExportJsonBtn.addEventListener('click', () => bulkExportCases('json'));
    Elements.bulkExportWordBtn.addEventListener('click', () => bulkExportCases('word'));
    Elements.bulkExportExcelBtn.addEventListener('click', () => bulkExportCases('excel'));
    Elements.bulkAnalyzeBtn.addEventListener('click', analyzeSelectedCases);
    Elements.bulkDeleteBtn.addEventListener('click', deleteSelectedCases);
    
    // 总结分析页面
    Elements.exportAllSummariesBtn.addEventListener('click', exportAllSummaries);
    Elements.clearAllSummariesBtn.addEventListener('click', clearAllSummaries);
    
    // 设置页面
    Elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    Elements.apiKey.addEventListener('change', updateSetting.bind(null, 'apiKey'));
    Elements.apiModel.addEventListener('change', updateSetting.bind(null, 'apiModel'));
    Elements.apiEndpoint.addEventListener('change', updateSetting.bind(null, 'apiEndpoint'));
    Elements.storageLocation.addEventListener('change', updateSetting.bind(null, 'storageLocation'));
    Elements.maxEntries.addEventListener('change', updateSetting.bind(null, 'maxEntries'));
    Elements.exportAllBtn.addEventListener('click', exportAllData);
    Elements.importBtn.addEventListener('click', importData);
    Elements.clearDataBtn.addEventListener('click', clearAllData);
    
    // 模态框关闭
    Elements.closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            Elements.modal.style.display = 'none';
            Elements.caseModal.style.display = 'none';
            Elements.summaryModal.style.display = 'none';
            // 关闭所有导出选项
            document.querySelectorAll('.export-options').forEach(el => {
                el.style.display = 'none';
            });
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
    
    // 点击页面其他地方关闭导出选项
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.export-dropdown')) {
            document.querySelectorAll('.export-options').forEach(el => {
                el.style.display = 'none';
            });
        }
    });
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
    
    showLoading(true);
    
    try {
        const analysisPrompt = buildAnalysisPrompt(answerText, contextText, analysisType, strictness);
        const analysis = await callOpenAI(analysisPrompt);
        
        AppState.currentAnalysisData = {
            answer: answerText,
            context: contextText,
            analysisType,
            strictness,
            timestamp: new Date().toISOString(),
            ...parseAnalysisResponse(analysis)
        };
        
        displayResults();
        Elements.resultsSection.style.display = 'block';
        Elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('分析失败:', error);
        showMessage(`分析失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
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

// 调用API (Ollama)
async function callOpenAI(prompt) {
    const endpoint = AppState.settings.apiEndpoint.replace(/\/$/, '');
    const isCloud = AppState.settings.apiModel.includes('-cloud');
    
    let url, body;
    
    if (isCloud) {
        // 云端模型使用 OpenAI 兼容格式
        url = `${endpoint}/v1/chat/completions`;
        body = {
            model: AppState.settings.apiModel.replace('-cloud', ''),
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的内容分析专家，擅长识别内容中的问题、不准确性和偏见。请始终以有效的JSON格式返回分析结果。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2
        };
    } else {
        // 本地模型使用 Ollama 格式
        url = `${endpoint}/api/generate`;
        body = {
            model: AppState.settings.apiModel,
            prompt: `你是一个专业的内容分析专家，擅长识别内容中的问题、不准确性和偏见。请始终以有效的JSON格式返回分析结果。\n\n${prompt}`,
            stream: false,
            temperature: 0.2
        };
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败 (${response.status})`);
    }
    
    const data = await response.json();
    
    if (isCloud) {
        return data.choices[0].message.content;
    } else {
        return data.response;
    }
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
function saveToDatabase() {
    if (!AppState.currentAnalysisData) {
        showMessage('没有可保存的分析结果', 'error');
        return;
    }
    
    const caseEntry = {
        id: Date.now().toString(),
        timestamp: AppState.currentAnalysisData.timestamp,
        answer: AppState.currentAnalysisData.answer.substring(0, 200) + '...',
        fullAnswer: AppState.currentAnalysisData.answer,
        context: AppState.currentAnalysisData.context,
        analysisType: AppState.currentAnalysisData.analysisType,
        strictness: AppState.currentAnalysisData.strictness,
        suspicionScore: AppState.currentAnalysisData.suspicionScore,
        summary: AppState.currentAnalysisData.summary,
        issues: AppState.currentAnalysisData.issues,
        strengths: AppState.currentAnalysisData.strengths,
        overallRating: AppState.currentAnalysisData.overallRating,
        tags: extractTags(AppState.currentAnalysisData)
    };
    
    AppState.cases.unshift(caseEntry);
    
    // 限制案例数量
    if (AppState.cases.length > AppState.settings.maxEntries) {
        AppState.cases = AppState.cases.slice(0, AppState.settings.maxEntries);
    }
    
    saveCases();
    showMessage('案例已保存到案例库', 'success');
    
    // 如果在案例库页面，更新显示
    if (AppState.currentTab === 'database') {
        filterAndSearchCases();
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

// 案例库搜索和过滤
function filterAndSearchCases() {
    const searchTerm = Elements.searchInput.value.toLowerCase();
    const minSuspicion = parseInt(Elements.suspicionMin.value);
    const maxSuspicion = parseInt(Elements.suspicionMax.value);
    const dateFilter = Elements.dateFilter.value;
    const tagFilter = Elements.tagFilter.value;
    
    AppState.filteredCases = AppState.cases.filter(caseEntry => {
        // 搜索词过滤
        if (searchTerm && !caseEntry.answer.toLowerCase().includes(searchTerm) && 
            !caseEntry.summary.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // 可疑度范围过滤
        if (caseEntry.suspicionScore < minSuspicion || caseEntry.suspicionScore > maxSuspicion) {
            return false;
        }
        
        // 日期过滤
        const caseDate = new Date(caseEntry.timestamp);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (dateFilter === 'today' && caseDate > today) {
            return false;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (caseDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (caseDate < monthAgo) return false;
        }
        
        // 标签过滤
        if (tagFilter !== 'all' && !caseEntry.tags.includes(tagFilter)) {
            return false;
        }
        
        return true;
    });
    
    AppState.currentPage = 1;
    updateCasesDisplay();
}

// 更新案例显示
function updateCasesDisplay() {
    const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const endIndex = startIndex + AppState.itemsPerPage;
    const displayCases = AppState.filteredCases.slice(startIndex, endIndex);
    
    Elements.resultsCount.textContent = `共找到 ${AppState.filteredCases.length} 个案例`;
    
    if (displayCases.length === 0) {
        Elements.casesTbody.innerHTML = '';
        Elements.noResults.style.display = 'block';
        Elements.pagination.innerHTML = '';
        return;
    }
    
    Elements.noResults.style.display = 'none';
    
    Elements.casesTbody.innerHTML = displayCases.map(caseEntry => `
        <tr>
            <td>
                <input type="checkbox" class="case-checkbox" data-id="${caseEntry.id}" 
                    ${AppState.selectedCases.has(caseEntry.id) ? 'checked' : ''} 
                    onchange="toggleCaseSelection('${caseEntry.id}')">
            </td>
            <td>${new Date(caseEntry.timestamp).toLocaleDateString()}</td>
            <td>${caseEntry.answer}</td>
            <td>
                <span class="suspicion-badge ${getSuspicionClass(caseEntry.suspicionScore)}">
                    ${caseEntry.suspicionScore}%
                </span>
            </td>
            <td>${caseEntry.issues && caseEntry.issues.length > 0 ? caseEntry.issues[0].description : '无'}</td>
            <td>${caseEntry.tags.map(tag => `<span class="tag-badge">${getTagLabel(tag)}</span>`).join('')}</td>
            <td>
                <div class="action-buttons">
                    <button title="查看详情" onclick="viewCase('${caseEntry.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button title="删除" onclick="deleteCase('${caseEntry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(AppState.filteredCases.length / AppState.itemsPerPage);
    
    if (totalPages <= 1) {
        Elements.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `
        <button ${AppState.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${AppState.currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        paginationHTML += `
            <button class="${i === AppState.currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
    }
    
    // 下一页按钮
    paginationHTML += `
        <button ${AppState.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${AppState.currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    Elements.pagination.innerHTML = paginationHTML;
    
    // 更新批量操作区域
    updateBulkActionsVisibility();
}

// 全选/取消全选
function toggleSelectAll() {
    const isChecked = Elements.selectAllCases.checked;
    const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const endIndex = startIndex + AppState.itemsPerPage;
    const displayCases = AppState.filteredCases.slice(startIndex, endIndex);
    
    if (isChecked) {
        displayCases.forEach(caseEntry => AppState.selectedCases.add(caseEntry.id));
    } else {
        displayCases.forEach(caseEntry => AppState.selectedCases.delete(caseEntry.id));
    }
    
    // 更新页面上的复选框状态
    const checkboxes = document.querySelectorAll('.case-checkbox');
    checkboxes.forEach(checkbox => {
        if (displayCases.some(c => c.id === checkbox.dataset.id)) {
            checkbox.checked = isChecked;
        }
    });
    
    updateBulkActionsVisibility();
}

// 切换单个案例选择
function toggleCaseSelection(caseId) {
    if (AppState.selectedCases.has(caseId)) {
        AppState.selectedCases.delete(caseId);
    } else {
        AppState.selectedCases.add(caseId);
    }
    
    updateBulkActionsVisibility();
}

// 更新批量操作区域可见性
function updateBulkActionsVisibility() {
    const count = AppState.selectedCases.size;
    
    if (count > 0) {
        Elements.bulkActions.style.display = 'flex';
        Elements.selectedCount.textContent = count;
        
        // 更新全选复选框状态
        const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
        const endIndex = startIndex + AppState.itemsPerPage;
        const displayCases = AppState.filteredCases.slice(startIndex, endIndex);
        const allSelected = displayCases.every(c => AppState.selectedCases.has(c.id));
        const someSelected = displayCases.some(c => AppState.selectedCases.has(c.id));
        
        Elements.selectAllCases.checked = allSelected;
        Elements.selectAllCases.indeterminate = someSelected && !allSelected;
    } else {
        Elements.bulkActions.style.display = 'none';
        Elements.selectAllCases.checked = false;
        Elements.selectAllCases.indeterminate = false;
    }
}

// 批量导出案例
function bulkExportCases(format) {
    const selectedCaseIds = Array.from(AppState.selectedCases);
    if (selectedCaseIds.length === 0) {
        showMessage('请先选择要导出的案例', 'error');
        return;
    }
    
    const selectedCases = AppState.cases.filter(c => selectedCaseIds.includes(c.id));
    
    switch (format) {
        case 'json':
            bulkExportCasesAsJson(selectedCases);
            break;
        case 'word':
            bulkExportCasesAsWord(selectedCases);
            break;
        case 'excel':
            bulkExportCasesAsExcel(selectedCases);
            break;
        default:
            showMessage('不支持的导出格式', 'error');
    }
}

// 批量导出为JSON
function bulkExportCasesAsJson(cases) {
    const dataStr = JSON.stringify(cases, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cases-bulk-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage(`已导出${cases.length}个案例为JSON格式`, 'success');
}

// 批量导出为Word
function bulkExportCasesAsWord(cases) {
    try {
        // 创建HTML格式的Word文档内容
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>批量案例分析报告</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                h3 { color: #555; margin-top: 20px; }
                .info { margin-bottom: 20px; }
                .case { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; }
                .issue { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #f39c12; }
                .tag { display: inline-block; background-color: #f0f0f0; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <h1>批量案例分析报告</h1>
            
            <div class="info">
                <p><strong>导出时间:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>案例数量:</strong> ${cases.length}</p>
            </div>
        `;
        
        // 添加每个案例的详细信息
        cases.forEach((caseEntry, index) => {
            htmlContent += `
            <div class="case">
                <h2>案例 ${index + 1}</h2>
                <div class="info">
                    <p><strong>时间:</strong> ${new Date(caseEntry.timestamp).toLocaleString()}</p>
                    <p><strong>可疑度评分:</strong> ${caseEntry.suspicionScore}%</p>
                    <p><strong>分析类型:</strong> ${getAnalysisTypeLabel(caseEntry.analysisType)}</p>
                    <p><strong>严格程度:</strong> ${getStrictnessLabel(caseEntry.strictness)}</p>
                    <p><strong>总体评级:</strong> ${getRatingLabel(caseEntry.overallRating)}</p>
                </div>
                
                <h3>内容</h3>
                <p>${caseEntry.fullAnswer || '无'}</p>
                
                <h3>分析摘要</h3>
                <p>${caseEntry.summary || '无'}</p>
                
                <h3>检测到的问题</h3>
                ${(caseEntry.issues && caseEntry.issues.length > 0) ? 
                    caseEntry.issues.map(issue => `
                        <div class="issue">
                            <strong>${getIssueTypeLabel(issue.type)} (${getSeverityLabel(issue.severity)}):</strong> ${issue.description}
                            ${issue.suggestion ? `<br><em>建议: ${issue.suggestion}</em>` : ''}
                        </div>
                    `).join('') : 
                    '<p>未检测到明显问题</p>'
                }
                
                <h3>标签</h3>
                <div>
                    ${caseEntry.tags.map(tag => `<span class="tag">${getTagLabel(tag)}</span>`).join(' ')}
                </div>
            </div>
            `;
        });
        
        htmlContent += `
        </body>
        </html>
        `;
        
        // 创建Blob对象
        const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cases-bulk-${Date.now()}.doc`;
        link.click();
        URL.revokeObjectURL(url);
        
        showMessage(`已导出${cases.length}个案例为Word文档`, 'success');
        
    } catch (error) {
        console.error('Word导出失败:', error);
        showMessage('Word导出失败，请稍后重试', 'error');
    }
}

// 批量导出为Excel
function bulkExportCasesAsExcel(cases) {
    try {
        // 准备Excel数据
        const wsData = [
            ["批量案例分析报告"],
            [],
            ["导出时间", new Date().toLocaleString()],
            ["案例数量", cases.length],
            [],
            ["序号", "时间", "可疑度评分", "分析类型", "严格程度", "总体评级", "内容", "分析摘要", "问题类型", "问题严重程度", "问题描述", "建议", "标签"]
        ];
        
        // 添加案例数据
        cases.forEach((caseEntry, index) => {
            if (caseEntry.issues && caseEntry.issues.length > 0) {
                caseEntry.issues.forEach((issue, issueIndex) => {
                    wsData.push([
                        issueIndex === 0 ? index + 1 : "", // 只在第一行显示序号
                        issueIndex === 0 ? new Date(caseEntry.timestamp).toLocaleString() : "", // 只在第一行显示时间
                        issueIndex === 0 ? `${caseEntry.suspicionScore}%` : "", // 只在第一行显示可疑度
                        issueIndex === 0 ? getAnalysisTypeLabel(caseEntry.analysisType) : "", // 只在第一行显示分析类型
                        issueIndex === 0 ? getStrictnessLabel(caseEntry.strictness) : "", // 只在第一行显示严格程度
                        issueIndex === 0 ? getRatingLabel(caseEntry.overallRating) : "", // 只在第一行显示评级
                        issueIndex === 0 ? caseEntry.fullAnswer : "", // 只在第一行显示内容
                        issueIndex === 0 ? caseEntry.summary : "", // 只在第一行显示摘要
                        getIssueTypeLabel(issue.type),
                        getSeverityLabel(issue.severity),
                        issue.description,
                        issue.suggestion || "",
                        issueIndex === 0 ? caseEntry.tags.map(tag => getTagLabel(tag)).join(", ") : "" // 只在第一行显示标签
                    ]);
                });
            } else {
                wsData.push([
                    index + 1,
                    new Date(caseEntry.timestamp).toLocaleString(),
                    `${caseEntry.suspicionScore}%`,
                    getAnalysisTypeLabel(caseEntry.analysisType),
                    getStrictnessLabel(caseEntry.strictness),
                    getRatingLabel(caseEntry.overallRating),
                    caseEntry.fullAnswer,
                    caseEntry.summary,
                    "未检测到问题",
                    "",
                    "",
                    "",
                    caseEntry.tags.map(tag => getTagLabel(tag)).join(", ")
                ]);
            }
        });
        
        // 创建工作簿
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "批量案例分析");
        
        // 保存文件
        XLSX.writeFile(wb, `cases-bulk-${Date.now()}.xlsx`);
        showMessage(`已导出${cases.length}个案例为Excel表格`, 'success');
        
    } catch (error) {
        console.error('Excel导出失败:', error);
        showMessage('Excel导出失败，请检查xlsx库是否正确加载', 'error');
    }
}

// 删除选中的案例
function deleteSelectedCases() {
    const selectedCaseIds = Array.from(AppState.selectedCases);
    if (selectedCaseIds.length === 0) {
        showMessage('请先选择要删除的案例', 'error');
        return;
    }
    
    if (!confirm(`确定要删除选中的${selectedCaseIds.length}个案例吗？此操作不可恢复！`)) {
        return;
    }
    
    // 从案例列表中删除
    AppState.cases = AppState.cases.filter(c => !selectedCaseIds.includes(c.id));
    
    // 从过滤后的案例中删除
    AppState.filteredCases = AppState.filteredCases.filter(c => !selectedCaseIds.includes(c.id));
    
    // 清空选择
    AppState.selectedCases.clear();
    
    // 保存并更新显示
    saveCases();
    filterAndSearchCases();
    showMessage(`已删除${selectedCaseIds.length}个案例`, 'success');
}

// 切换页面
function changePage(page) {
    const totalPages = Math.ceil(AppState.filteredCases.length / AppState.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    AppState.currentPage = page;
    updateCasesDisplay();
    
    // 滚动到案例表格顶部
    Elements.resultsTableSection.scrollIntoView({ behavior: 'smooth' });
}

// 查看案例详情
function viewCase(caseId) {
    const caseEntry = AppState.cases.find(c => c.id === caseId);
    if (!caseEntry) return;
    
    Elements.caseModalBody.innerHTML = `
        <h2>案例详情</h2>
        <div class="case-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>时间:</strong> ${new Date(caseEntry.timestamp).toLocaleString()}</p>
                <p><strong>分析类型:</strong> ${getAnalysisTypeLabel(caseEntry.analysisType)}</p>
                <p><strong>严格程度:</strong> ${getStrictnessLabel(caseEntry.strictness)}</p>
                <p><strong>可疑度评分:</strong> <span class="suspicion-badge ${getSuspicionClass(caseEntry.suspicionScore)}">${caseEntry.suspicionScore}%</span></p>
                <p><strong>总体评级:</strong> ${getRatingLabel(caseEntry.overallRating)}</p>
            </div>
            
            <div class="detail-section">
                <h3>上下文</h3>
                <p>${caseEntry.context || '无'}</p>
            </div>
            
            <div class="detail-section">
                <h3>完整内容</h3>
                <p>${caseEntry.fullAnswer}</p>
            </div>
            
            <div class="detail-section">
                <h3>分析摘要</h3>
                <p>${caseEntry.summary}</p>
            </div>
            
            <div class="detail-section">
                <h3>检测到的问题</h3>
                ${caseEntry.issues && caseEntry.issues.length > 0 ? 
                    caseEntry.issues.map(issue => `
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
                ${caseEntry.strengths && caseEntry.strengths.length > 0 ?
                    `<ul>${caseEntry.strengths.map(strength => `<li>${strength}</li>`).join('')}</ul>` :
                    '<p>无记录的优点</p>'
                }
            </div>
            
            <div class="detail-section">
                <h3>标签</h3>
                <div>${caseEntry.tags.map(tag => `<span class="tag-badge">${getTagLabel(tag)}</span>`).join('')}</div>
            </div>
        </div>
        
        <div class="modal-actions">
            <div class="export-dropdown">
                <button class="secondary-btn" onclick="toggleExportOptions('case-${caseId}')">
                    <i class="fas fa-download"></i> 导出案例 <i class="fas fa-chevron-down"></i>
                </button>
                <div id="export-options-case-${caseId}" class="export-options" style="display: none;">
                    <button onclick="exportCase('${caseId}', 'json')">
                        <i class="fas fa-file-code"></i> JSON格式
                    </button>
                    <button onclick="exportCase('${caseId}', 'word')">
                        <i class="fas fa-file-word"></i> Word文档
                    </button>
                    <button onclick="exportCase('${caseId}', 'excel')">
                        <i class="fas fa-file-excel"></i> Excel表格
                    </button>
                </div>
            </div>
            <button class="danger-btn" onclick="deleteCase('${caseId}')">
                <i class="fas fa-trash"></i> 删除案例
            </button>
        </div>
    `;
    
    Elements.caseModal.style.display = 'block';
}

// 删除案例
function deleteCase(caseId) {
    if (!confirm('确定要删除这个案例吗？')) return;
    
    const index = AppState.cases.findIndex(c => c.id === caseId);
    if (index !== -1) {
        AppState.cases.splice(index, 1);
        saveCases();
        
        // 更新过滤后的案例
        const filteredIndex = AppState.filteredCases.findIndex(c => c.id === caseId);
        if (filteredIndex !== -1) {
            AppState.filteredCases.splice(filteredIndex, 1);
        }
        
        updateCasesDisplay();
        showMessage('案例已删除', 'success');
        
        // 关闭模态框
        Elements.caseModal.style.display = 'none';
    }
}

// 导出案例
function exportCase(caseId, format = 'json') {
    const caseEntry = AppState.cases.find(c => c.id === caseId);
    if (!caseEntry) return;
    
    switch (format) {
        case 'json':
            exportCaseAsJson(caseEntry);
            break;
        case 'word':
            exportCaseAsWord(caseEntry);
            break;
        case 'excel':
            exportCaseAsExcel(caseEntry);
            break;
        default:
            showMessage('不支持的导出格式', 'error');
    }
}

// JSON格式导出
function exportCaseAsJson(caseEntry) {
    const dataStr = JSON.stringify(caseEntry, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-${caseEntry.id}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('案例已导出为JSON格式', 'success');
}

// Word文档导出
function exportCaseAsWord(caseEntry) {
    try {
        // 创建HTML格式的Word文档内容
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>案例分析报告</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .info { margin-bottom: 20px; }
                .info p { margin: 5px 0; }
                .issue { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #f39c12; }
                .tag { display: inline-block; background-color: #f0f0f0; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 0.8em; }
                .strength { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>案例分析报告</h1>
            
            <h2>基本信息</h2>
            <div class="info">
                <p><strong>时间:</strong> ${new Date(caseEntry.timestamp).toLocaleString()}</p>
                <p><strong>分析类型:</strong> ${getAnalysisTypeLabel(caseEntry.analysisType)}</p>
                <p><strong>严格程度:</strong> ${getStrictnessLabel(caseEntry.strictness)}</p>
                <p><strong>可疑度评分:</strong> ${caseEntry.suspicionScore}%</p>
                <p><strong>总体评级:</strong> ${getRatingLabel(caseEntry.overallRating)}</p>
            </div>
            
            <h2>上下文</h2>
            <p>${caseEntry.context || "无"}</p>
            
            <h2>完整内容</h2>
            <p>${caseEntry.fullAnswer || "无"}</p>
            
            <h2>分析摘要</h2>
            <p>${caseEntry.summary || "无"}</p>
            
            <h2>检测到的问题</h2>
            ${(caseEntry.issues && caseEntry.issues.length > 0) ? 
                caseEntry.issues.map(issue => `
                    <div class="issue">
                        <strong>${getIssueTypeLabel(issue.type)} (${getSeverityLabel(issue.severity)}):</strong> ${issue.description}
                        ${issue.suggestion ? `<br><em>建议: ${issue.suggestion}</em>` : ''}
                    </div>
                `).join('') : 
                '<p>未检测到明显问题</p>'
            }
            
            <h2>优点</h2>
            ${(caseEntry.strengths && caseEntry.strengths.length > 0) ? 
                caseEntry.strengths.map(strength => `<div class="strength">• ${strength}</div>`).join('') : 
                '<p>无记录的优点</p>'
            }
            
            <h2>标签</h2>
            <div>
                ${caseEntry.tags.map(tag => `<span class="tag">${getTagLabel(tag)}</span>`).join(' ')}
            </div>
        </body>
        </html>
        `;
        
        // 创建Blob对象
        const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `case-${caseEntry.id}.doc`;
        link.click();
        URL.revokeObjectURL(url);
        
        showMessage('案例已导出为Word文档', 'success');
        
    } catch (error) {
        console.error('Word导出失败:', error);
        showMessage('Word导出失败，请稍后重试', 'error');
    }
}

// Excel表格导出
function exportCaseAsExcel(caseEntry) {
    try {
        // 准备Excel数据
        const wsData = [
            ["案例分析报告"],
            [],
            ["基本信息"],
            ["时间", new Date(caseEntry.timestamp).toLocaleString()],
            ["分析类型", getAnalysisTypeLabel(caseEntry.analysisType)],
            ["严格程度", getStrictnessLabel(caseEntry.strictness)],
            ["可疑度评分", `${caseEntry.suspicionScore}%`],
            ["总体评级", getRatingLabel(caseEntry.overallRating)],
            [],
            ["上下文"],
            [caseEntry.context || "无"],
            [],
            ["完整内容"],
            [caseEntry.fullAnswer],
            [],
            ["分析摘要"],
            [caseEntry.summary],
            [],
            ["检测到的问题"],
            ["问题类型", "严重程度", "描述", "建议"]
        ];
        
        // 添加问题数据
        if (caseEntry.issues && caseEntry.issues.length > 0) {
            caseEntry.issues.forEach(issue => {
                wsData.push([
                    getIssueTypeLabel(issue.type),
                    getSeverityLabel(issue.severity),
                    issue.description,
                    issue.suggestion || ""
                ]);
            });
        } else {
            wsData.push(["未检测到明显问题"]);
        }
        
        wsData.push([]);
        wsData.push(["优点"]);
        if (caseEntry.strengths && caseEntry.strengths.length > 0) {
            caseEntry.strengths.forEach(strength => {
                wsData.push([strength]);
            });
        } else {
            wsData.push(["无记录的优点"]);
        }
        
        wsData.push([]);
        wsData.push(["标签", caseEntry.tags.map(tag => getTagLabel(tag)).join(", ")]);
        
        // 创建工作簿
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "案例分析");
        
        // 保存文件
        XLSX.writeFile(wb, `case-${caseEntry.id}.xlsx`);
        showMessage('案例已导出为Excel表格', 'success');
        
    } catch (error) {
        console.error('Excel导出失败:', error);
        showMessage('Excel导出失败，请检查xlsx库是否正确加载', 'error');
    }
}

// 导出案例库
function exportDatabase() {
    if (AppState.cases.length === 0) {
        showMessage('案例库为空，没有可导出的数据', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(AppState.cases, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-database-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('案例库已导出', 'success');
}

// 设置相关函数
function toggleApiKeyVisibility() {
    if (Elements.apiKey.type === 'password') {
        Elements.apiKey.type = 'text';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        Elements.apiKey.type = 'password';
        Elements.toggleApiKey.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function updateSetting(key, value) {
    if (key === 'maxEntries') {
        AppState.settings[key] = parseInt(value);
    } else {
        AppState.settings[key] = value;
    }
    saveSettings();
}

// 导出所有数据
function exportAllData() {
    const allData = {
        settings: AppState.settings,
        cases: AppState.cases,
        summaries: AppState.summaries,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analyzer-backup-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('所有数据已导出', 'success');
}

// 导入数据
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 询问用户要导入什么数据
                const importOptions = [];
                if (importedData.cases) importOptions.push('cases');
                if (importedData.settings) importOptions.push('settings');
                if (importedData.summaries) importOptions.push('summaries');
                
                if (importOptions.length === 0) {
                    showMessage('导入的文件中没有有效的数据', 'error');
                    return;
                }
                
                let message = '检测到以下数据可供导入：\n';
                if (importOptions.includes('cases')) message += '- 案例数据\n';
                if (importOptions.includes('settings')) message += '- 设置数据\n';
                if (importOptions.includes('summaries')) message += '- 总结分析\n';
                message += '\n确定要导入这些数据吗？这将替换现有数据。';
                
                if (confirm(message)) {
                    if (importOptions.includes('cases')) {
                        AppState.cases = importedData.cases;
                        saveCases();
                    }
                    
                    if (importOptions.includes('settings')) {
                        AppState.settings = {...AppState.settings, ...importedData.settings};
                        saveSettings();
                        loadSettings(); // 重新加载设置到界面
                    }
                    
                    if (importOptions.includes('summaries')) {
                        AppState.summaries = importedData.summaries;
                        saveSummaries();
                    }
                    
                    filterAndSearchCases();
                    updateSummariesDisplay();
                    showMessage('数据导入成功', 'success');
                }
            } catch (error) {
                showMessage('导入失败：文件格式不正确', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 导入案例
function importCases() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedCases = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!Array.isArray(importedCases)) {
                    showMessage('导入失败：文件格式不正确，期望的是案例数组', 'error');
                    return;
                }
                
                // 验证每个案例的基本结构
                const validCases = importedCases.filter(c => {
                    return c.id && c.timestamp && c.answer && c.suspicionScore !== undefined;
                });
                
                if (validCases.length !== importedCases.length) {
                    showMessage(`警告：${importedCases.length - validCases.length}个案例因格式不正确被跳过`, 'warning');
                }
                
                if (validCases.length === 0) {
                    showMessage('没有有效的案例可以导入', 'error');
                    return;
                }
                
                if (confirm(`确定要导入${validCases.length}个案例吗？这将添加到现有案例中。`)) {
                    // 合并案例，避免重复ID
                    const existingIds = new Set(AppState.cases.map(c => c.id));
                    const newCases = validCases.filter(c => !existingIds.has(c.id));
                    
                    if (newCases.length !== validCases.length) {
                        showMessage(`${validCases.length - newCases.length}个案例因ID重复被跳过`, 'warning');
                    }
                    
                    AppState.cases.unshift(...newCases);
                    
                    // 限制案例数量
                    if (AppState.cases.length > AppState.settings.maxEntries) {
                        AppState.cases = AppState.cases.slice(0, AppState.settings.maxEntries);
                    }
                    
                    saveCases();
                    filterAndSearchCases();
                    showMessage(`成功导入${newCases.length}个新案例`, 'success');
                }
            } catch (error) {
                showMessage('导入失败：文件格式不正确', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// 分析选中的案例
async function analyzeSelectedCases() {
    const selectedCaseIds = Array.from(AppState.selectedCases);
    if (selectedCaseIds.length === 0) {
        showMessage('请先选择要分析的案例', 'error');
        return;
    }
    
    if (!AppState.settings.apiKey) {
        showMessage('请先在设置中配置API密钥', 'error');
        switchTab('settings');
        return;
    }
    
    showLoading(true);
    
    try {
        const selectedCases = AppState.cases.filter(c => selectedCaseIds.includes(c.id));
        const summaryPrompt = buildSummaryPrompt(selectedCases);
        const summary = await callOpenAI(summaryPrompt);
        
        const summaryData = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            caseIds: selectedCaseIds,
            caseCount: selectedCaseIds.length,
            summary: summary,
            summaryType: 'batch-analysis'
        };
        
        // 添加到总结列表
        AppState.summaries.unshift(summaryData);
        
        // 限制总结数量
        if (AppState.summaries.length > 100) {
            AppState.summaries = AppState.summaries.slice(0, 100);
        }
        
        saveSummaries();
        updateSummariesDisplay();
        
        // 显示总结详情
        showSummaryDetails(summaryData.id);
        
        showMessage(`已成功分析${selectedCaseIds.length}个案例`, 'success');
        
    } catch (error) {
        console.error('分析失败:', error);
        showMessage(`分析失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 构建总结提示词
function buildSummaryPrompt(cases) {
    let prompt = `请仔细分析以下${cases.length}个案例，提供一个全面的总结分析。

案例列表:
`;
    
    cases.forEach((caseEntry, index) => {
        prompt += `
案例 ${index + 1}:
时间: ${new Date(caseEntry.timestamp).toLocaleString()}
可疑度评分: ${caseEntry.suspicionScore}%
分析类型: ${getAnalysisTypeLabel(caseEntry.analysisType)}
严格程度: ${getStrictnessLabel(caseEntry.strictness)}
总体评级: ${getRatingLabel(caseEntry.overallRating)}
内容: ${caseEntry.fullAnswer}
分析摘要: ${caseEntry.summary}

检测到的问题:
${caseEntry.issues && caseEntry.issues.length > 0 ? 
    caseEntry.issues.map(issue => 
        `- ${getIssueTypeLabel(issue.type)} (${getSeverityLabel(issue.severity)}): ${issue.description}`
    ).join('\n') : 
    '未检测到明显问题'
}

---
`;
    });
    
    prompt += `
请基于以上案例提供一个结构化的总结分析，包含以下内容:
1. 整体趋势分析 - 分析这些案例中的共同模式和趋势
2. 主要问题类型 - 统计和总结最常见的问题类型
3. 可疑度分布 - 分析可疑度评分的分布情况和异常点
4. 改进建议 - 针对发现的问题提供具体的改进建议
5. 结论 - 对这些案例的整体评估

请以清晰、结构化的方式提供分析结果，便于理解和决策参考。`;
    
    return prompt;
}

// 显示总结详情
function showSummaryDetails(summaryId) {
    const summary = AppState.summaries.find(s => s.id === summaryId);
    if (!summary) return;
    
    const relatedCases = AppState.cases.filter(c => summary.caseIds.includes(c.id));
    
    Elements.summaryModalBody.innerHTML = `
        <h2>总结分析详情</h2>
        <div class="case-detail">
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>分析时间:</strong> ${new Date(summary.timestamp).toLocaleString()}</p>
                <p><strong>分析案例数量:</strong> ${summary.caseCount}</p>
                <p><strong>分析类型:</strong> ${getSummaryTypeLabel(summary.summaryType)}</p>
            </div>
            
            <div class="detail-section">
                <h3>相关案例</h3>
                <div class="related-cases">
                    ${relatedCases.map((caseEntry, index) => `
                        <div class="related-case-item">
                            <p><strong>案例 ${index + 1}:</strong> ${new Date(caseEntry.timestamp).toLocaleDateString()}</p>
                            <p><strong>可疑度:</strong> 
                                <span class="suspicion-badge ${getSuspicionClass(caseEntry.suspicionScore)}">
                                    ${caseEntry.suspicionScore}%
                                </span>
                            </p>
                            <p><strong>内容摘要:</strong> ${caseEntry.answer}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>总结分析</h3>
                <div class="analysis-text">${summary.summary}</div>
            </div>
        </div>
        
        <div class="modal-actions">
            <div class="export-dropdown">
                <button class="secondary-btn" onclick="toggleExportOptions('summary-${summaryId}')">
                    <i class="fas fa-download"></i> 导出总结 <i class="fas fa-chevron-down"></i>
                </button>
                <div id="export-options-summary-${summaryId}" class="export-options" style="display: none;">
                    <button onclick="exportSummary('${summaryId}', 'json')">
                        <i class="fas fa-file-code"></i> JSON格式
                    </button>
                    <button onclick="exportSummary('${summaryId}', 'word')">
                        <i class="fas fa-file-word"></i> Word文档
                    </button>
                    <button onclick="exportSummary('${summaryId}', 'excel')">
                        <i class="fas fa-file-excel"></i> Excel表格
                    </button>
                </div>
            </div>
            <button class="danger-btn" onclick="deleteSummary('${summaryId}')">
                <i class="fas fa-trash"></i> 删除总结
            </button>
        </div>
    `;
    
    Elements.summaryModal.style.display = 'block';
}

// 导出总结
function exportSummary(summaryId, format = 'json') {
    const summary = AppState.summaries.find(s => s.id === summaryId);
    if (!summary) return;
    
    const relatedCases = AppState.cases.filter(c => summary.caseIds.includes(c.id));
    
    switch (format) {
        case 'json':
            exportSummaryAsJson(summary, relatedCases);
            break;
        case 'word':
            exportSummaryAsWord(summary, relatedCases);
            break;
        case 'excel':
            exportSummaryAsExcel(summary, relatedCases);
            break;
        default:
            showMessage('不支持的导出格式', 'error');
    }
}

// JSON格式导出总结
function exportSummaryAsJson(summary, relatedCases) {
    const exportData = {
        summary: summary,
        relatedCases: relatedCases,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary-${summary.id}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('总结已导出为JSON格式', 'success');
}

// Word文档导出总结
function exportSummaryAsWord(summary, relatedCases) {
    try {
        // 创建HTML格式的Word文档内容
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>AI案例分析总结报告</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                h3 { color: #555; margin-top: 20px; }
                .case { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .case-info { margin-bottom: 15px; }
                .case-info p { margin: 5px 0; }
                .tag { display: inline-block; background-color: #f0f0f0; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <h1>AI案例分析总结报告</h1>
            
            <div class="case-info">
                <p><strong>分析时间:</strong> ${new Date(summary.timestamp).toLocaleString()}</p>
                <p><strong>分析案例数量:</strong> ${summary.caseCount}</p>
            </div>
            
            <h2>总结分析</h2>
            <p>${summary.summary}</p>
            
            <h2>相关案例</h2>
        `;
        
        // 添加案例数据
        relatedCases.forEach((caseEntry, index) => {
            htmlContent += `
            <div class="case">
                <h3>案例 ${index + 1}</h3>
                <div class="case-info">
                    <p><strong>时间:</strong> ${new Date(caseEntry.timestamp).toLocaleString()}</p>
                    <p><strong>可疑度评分:</strong> ${caseEntry.suspicionScore}%</p>
                    <p><strong>分析类型:</strong> ${getAnalysisTypeLabel(caseEntry.analysisType)}</p>
                    <p><strong>严格程度:</strong> ${getStrictnessLabel(caseEntry.strictness)}</p>
                    <p><strong>总体评级:</strong> ${getRatingLabel(caseEntry.overallRating)}</p>
                </div>
                
                <h4>内容</h4>
                <p>${caseEntry.fullAnswer || '无'}</p>
                
                <h4>分析摘要</h4>
                <p>${caseEntry.summary || '无'}</p>
                
                ${(caseEntry.issues && caseEntry.issues.length > 0) ? `
                    <h4>检测到的问题</h4>
                    ${caseEntry.issues.map(issue => `
                        <div style="margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #f39c12;">
                            <strong>${getIssueTypeLabel(issue.type)} (${getSeverityLabel(issue.severity)}):</strong> ${issue.description}
                            ${issue.suggestion ? `<br><em>建议: ${issue.suggestion}</em>` : ''}
                        </div>
                    `).join('')}
                ` : ''}
                
                <h4>标签</h4>
                <div>
                    ${caseEntry.tags.map(tag => `<span class="tag">${getTagLabel(tag)}</span>`).join(' ')}
                </div>
            </div>
            `;
        });
        
        htmlContent += `
        </body>
        </html>
        `;
        
        // 创建Blob对象
        const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `summary-${summary.id}.doc`;
        link.click();
        URL.revokeObjectURL(url);
        
        showMessage('总结已导出为Word文档', 'success');
        
    } catch (error) {
        console.error('Word导出失败:', error);
        showMessage('Word导出失败，请稍后重试', 'error');
    }
}

// Excel表格导出总结
function exportSummaryAsExcel(summary, relatedCases) {
    try {
        // 准备Excel数据
        const wsData = [
            ["AI案例分析总结报告"],
            [],
            ["分析时间", new Date(summary.timestamp).toLocaleString()],
            ["分析案例数量", summary.caseCount],
            [],
            ["总结分析"],
            [summary.summary],
            [],
            ["相关案例详情"],
            ["序号", "时间", "可疑度评分", "分析类型", "严格程度", "内容", "分析摘要"]
        ];
        
        // 添加案例数据
        relatedCases.forEach((caseEntry, index) => {
            wsData.push([
                index + 1,
                new Date(caseEntry.timestamp).toLocaleString(),
                `${caseEntry.suspicionScore}%`,
                getAnalysisTypeLabel(caseEntry.analysisType),
                getStrictnessLabel(caseEntry.strictness),
                caseEntry.fullAnswer,
                caseEntry.summary
            ]);
        });
        
        // 创建工作簿
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "案例分析总结");
        
        // 保存文件
        XLSX.writeFile(wb, `summary-${summary.id}.xlsx`);
        showMessage('总结已导出为Excel表格', 'success');
        
    } catch (error) {
        console.error('Excel导出失败:', error);
        showMessage('Excel导出失败，请检查xlsx库是否正确加载', 'error');
    }
}

// 删除总结
function deleteSummary(summaryId) {
    if (!confirm('确定要删除这个总结吗？')) return;
    
    const index = AppState.summaries.findIndex(s => s.id === summaryId);
    if (index !== -1) {
        AppState.summaries.splice(index, 1);
        saveSummaries();
        updateSummariesDisplay();
        showMessage('总结已删除', 'success');
        
        // 关闭模态框
        Elements.summaryModal.style.display = 'none';
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
    
    Elements.summariesContainer.innerHTML = AppState.summaries.map(summary => {
        const relatedCases = AppState.cases.filter(c => summary.caseIds.includes(c.id));
        const avgSuspicion = relatedCases.length > 0 
            ? Math.round(relatedCases.reduce((sum, c) => sum + c.suspicionScore, 0) / relatedCases.length)
            : 0;
            
        return `
            <div class="summary-card">
                <div class="summary-header">
                    <h4 class="summary-title">${getSummaryTypeLabel(summary.summaryType)}</h4>
                    <div class="summary-date">${new Date(summary.timestamp).toLocaleDateString()}</div>
                </div>
                
                <div class="summary-content">
                    ${summary.summary.length > 200 
                        ? summary.summary.substring(0, 200) + '...' 
                        : summary.summary}
                </div>
                
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${summary.caseCount}</div>
                        <div class="stat-label">案例数量</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${avgSuspicion}%</div>
                        <div class="stat-label">平均可疑度</div>
                    </div>
                </div>
                
                <div class="summary-actions">
                    <button class="secondary-btn" onclick="showSummaryDetails('${summary.id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                    <div class="export-dropdown">
                        <button class="secondary-btn" onclick="toggleExportOptions('summary-card-${summary.id}')">
                            <i class="fas fa-download"></i> <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="export-options-summary-card-${summary.id}" class="export-options" style="display: none;">
                            <button onclick="exportSummary('${summary.id}', 'json')">
                                <i class="fas fa-file-code"></i> JSON
                            </button>
                            <button onclick="exportSummary('${summary.id}', 'word')">
                                <i class="fas fa-file-word"></i> Word
                            </button>
                            <button onclick="exportSummary('${summary.id}', 'excel')">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>
                    <button class="danger-btn" onclick="deleteSummary('${summary.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 导出所有总结
function exportAllSummaries() {
    if (AppState.summaries.length === 0) {
        showMessage('总结分析库为空，没有可导出的数据', 'error');
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
function clearAllSummaries() {
    if (AppState.summaries.length === 0) {
        showMessage('总结分析库已经是空的', 'info');
        return;
    }
    
    if (!confirm(`确定要清空所有总结分析吗？这将删除${AppState.summaries.length}个总结，此操作不可恢复！`)) {
        return;
    }
    
    if (confirm('再次确认：您将丢失所有总结分析数据！')) {
        AppState.summaries = [];
        saveSummaries();
        updateSummariesDisplay();
        showMessage('所有总结已清空', 'success');
    }
}

// 切换导出选项显示
function toggleExportOptions(id) {
    const optionsElement = document.getElementById(`export-options-${id}`);
    if (!optionsElement) return;
    
    // 关闭其他所有导出选项
    document.querySelectorAll('.export-options').forEach(el => {
        if (el.id !== `export-options-${id}`) {
            el.style.display = 'none';
        }
    });
    
    // 切换当前选项
    optionsElement.style.display = optionsElement.style.display === 'none' ? 'block' : 'none';
}

// 获取总结类型标签
function getSummaryTypeLabel(type) {
    const labels = {
        'batch-analysis': '批量分析',
        'custom-summary': '自定义总结',
        'trend-analysis': '趋势分析'
    };
    return labels[type] || type;
}

// 保存总结
function saveSummaries() {
    localStorage.setItem('ai-analyzer-summaries', JSON.stringify(AppState.summaries));
}

// 加载总结
function loadSummaries() {
    const savedSummaries = localStorage.getItem('ai-analyzer-summaries');
    if (savedSummaries) {
        try {
            AppState.summaries = JSON.parse(savedSummaries);
        } catch (error) {
            console.error('加载总结失败:', error);
            AppState.summaries = [];
        }
    } else {
        AppState.summaries = [];
    }
}

// 清除所有数据
function clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    
    if (confirm('再次确认：您将丢失所有案例、总结和设置数据！')) {
        AppState.cases = [];
        AppState.summaries = [];
        saveCases();
        saveSummaries();
        
        // 重置设置为默认值
        AppState.settings = {
            apiKey: 'ollama',
            apiModel: 'qwen3.5:latest',
            apiEndpoint: 'http://localhost:11434',
            storageLocation: 'local',
            maxEntries: 1000
        };
        saveSettings();
        loadSettings();
        
        filterAndSearchCases();
        updateSummariesDisplay();
        showMessage('所有数据已清除', 'success');
    }
}

// 工具函数
function showLoading(show) {
    Elements.loadingOverlay.style.display = show ? 'flex' : 'none';
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

// 本地存储函数
function saveSettings() {
    localStorage.setItem('ai-analyzer-settings', JSON.stringify(AppState.settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('ai-analyzer-settings');
    if (savedSettings) {
        try {
            AppState.settings = {...AppState.settings, ...JSON.parse(savedSettings)};
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    // 更新UI元素
    Elements.apiKey.value = AppState.settings.apiKey || '';
    Elements.apiModel.value = AppState.settings.apiModel || 'zai-org/GLM-4.5';
    Elements.apiEndpoint.value = AppState.settings.apiEndpoint || 'http://localhost:11434';
    Elements.storageLocation.value = AppState.settings.storageLocation || 'local';
    Elements.maxEntries.value = AppState.settings.maxEntries || 1000;
}

function saveCases() {
    localStorage.setItem('ai-analyzer-cases', JSON.stringify(AppState.cases));
}

function loadCases() {
    const savedCases = localStorage.getItem('ai-analyzer-cases');
    if (savedCases) {
        try {
            AppState.cases = JSON.parse(savedCases);
        } catch (error) {
            console.error('加载案例失败:', error);
            AppState.cases = [];
        }
    } else {
        AppState.cases = [];
    }
    
    AppState.filteredCases = [...AppState.cases];
}