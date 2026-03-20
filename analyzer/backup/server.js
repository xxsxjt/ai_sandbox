// 服务器端API
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据库
const db = new sqlite3.Database('./database.sqlite');

// 创建数据表
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 分析结果表
    db.run(`CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        analysis_type TEXT NOT NULL,
        strictness TEXT NOT NULL,
        suspicion_score INTEGER,
        summary TEXT,
        issues TEXT,  // JSON格式
        strengths TEXT, // JSON格式
        overall_rating TEXT,
        tags TEXT, // JSON格式
        is_public INTEGER DEFAULT 0,  // 0=私有，1=公开
        deleted_by_user INTEGER DEFAULT 0,  // 0=未删除，1=被用户删除
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // 总结分析表
    db.run(`CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        analysis_ids TEXT, // JSON格式，关联的分析ID数组
        is_public INTEGER DEFAULT 0,  // 0=私有，1=公开
        deleted_by_user INTEGER DEFAULT 0,  // 0=未删除，1=被用户删除
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // 管理员表
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'admin',  // 可扩展不同角色
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// JWT认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        req.user = user;
        next();
    });
}

// 管理员认证中间件
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        
        // 检查用户是否是管理员
        db.get(
            'SELECT * FROM admins WHERE user_id = ?',
            [user.id],
            (err, admin) => {
                if (err) {
                    return res.status(500).json({ error: '服务器错误' });
                }
                
                if (!admin) {
                    return res.status(403).json({ error: '需要管理员权限' });
                }
                
                req.user = user;
                req.admin = admin;
                next();
            }
        );
    });
}

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ error: '用户名、邮箱和密码都是必填项' });
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入用户
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: '用户名或邮箱已存在' });
                    }
                    return res.status(500).json({ error: '注册失败' });
                }

                res.status(201).json({ 
                    message: '注册成功',
                    userId: this.lastID 
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码都是必填项' });
        }

        // 查找用户
        db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username],
            async (err, user) => {
                if (err) {
                    return res.status(500).json({ error: '服务器错误' });
                }

                if (!user) {
                    return res.status(401).json({ error: '用户名或密码错误' });
                }

                // 验证密码
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: '用户名或密码错误' });
                }

                // 生成JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.json({
                    message: '登录成功',
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        apiKey: user.api_key
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新用户API密钥
app.put('/api/user/apikey', authenticateToken, (req, res) => {
    const { apiKey } = req.body;
    
    db.run(
        'UPDATE users SET api_key = ? WHERE id = ?',
        [apiKey, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '更新失败' });
            }
            res.json({ message: 'API密钥更新成功' });
        }
    );
});

// 保存分析结果
app.post('/api/analyses', authenticateToken, (req, res) => {
    const { 
        content, 
        context, 
        analysisType, 
        strictness, 
        suspicionScore, 
        summary, 
        issues, 
        strengths, 
        overallRating, 
        tags 
    } = req.body;

    db.run(
        `INSERT INTO analyses 
        (user_id, content, context, analysis_type, strictness, suspicion_score, summary, issues, strengths, overall_rating, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            req.user.id, 
            content, 
            context, 
            analysisType, 
            strictness, 
            suspicionScore, 
            summary, 
            JSON.stringify(issues), 
            JSON.stringify(strengths), 
            overallRating, 
            JSON.stringify(tags)
        ],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '保存分析失败' });
            }
            res.status(201).json({ 
                message: '分析结果保存成功',
                id: this.lastID 
            });
        }
    );
});

// 获取用户的分析列表
app.get('/api/analyses', authenticateToken, (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT * FROM analyses 
        WHERE user_id = ? 
        AND (content LIKE ? OR summary LIKE ?)
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${search}%`;
    
    db.all(
        query,
        [req.user.id, searchPattern, searchPattern, limit, offset],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: '获取分析列表失败' });
            }

            // 解析JSON字段
            const analyses = rows.map(row => ({
                ...row,
                issues: JSON.parse(row.issues || '[]'),
                strengths: JSON.parse(row.strengths || '[]'),
                tags: JSON.parse(row.tags || '[]')
            }));

            res.json(analyses);
        }
    );
});

// 获取分析详情
app.get('/api/analyses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM analyses WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: '获取分析详情失败' });
            }

            if (!row) {
                return res.status(404).json({ error: '分析不存在' });
            }

            // 解析JSON字段
            const analysis = {
                ...row,
                issues: JSON.parse(row.issues || '[]'),
                strengths: JSON.parse(row.strengths || '[]'),
                tags: JSON.parse(row.tags || '[]')
            };

            res.json(analysis);
        }
    );
});

// 删除分析（软删除 - 标记为已删除）
app.delete('/api/analyses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE analyses SET deleted_by_user = 1 WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '删除分析失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '分析不存在' });
            }

            res.json({ message: '分析删除成功' });
        }
    );
});

// 更新分析（编辑）
app.put('/api/analyses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { content, context, is_public } = req.body;

    db.run(
        'UPDATE analyses SET content = ?, context = ?, is_public = ? WHERE id = ? AND user_id = ?',
        [content, context, is_public ? 1 : 0, id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '更新分析失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '分析不存在' });
            }

            res.json({ message: '分析更新成功' });
        }
    );
});

// 获取公开的分析列表
app.get('/api/public/analyses', (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT a.*, u.username 
        FROM analyses a 
        JOIN users u ON a.user_id = u.id
        WHERE a.is_public = 1 
        AND a.deleted_by_user = 0
        AND (a.content LIKE ? OR a.summary LIKE ?)
        ORDER BY a.created_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${search}%`;
    
    db.all(
        query,
        [searchPattern, searchPattern, limit, offset],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: '获取公开分析列表失败' });
            }

            // 解析JSON字段
            const analyses = rows.map(row => ({
                ...row,
                issues: JSON.parse(row.issues || '[]'),
                strengths: JSON.parse(row.strengths || '[]'),
                tags: JSON.parse(row.tags || '[]')
            }));

            res.json(analyses);
        }
    );
});

// 获取公开的总结列表
app.get('/api/public/summaries', (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT s.*, u.username 
        FROM summaries s 
        JOIN users u ON s.user_id = u.id
        WHERE s.is_public = 1 
        AND s.deleted_by_user = 0
        AND (s.title LIKE ? OR s.content LIKE ?)
        ORDER BY s.created_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${search}%`;
    
    db.all(
        query,
        [searchPattern, searchPattern, limit, offset],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: '获取公开总结列表失败' });
            }

            const summaries = rows.map(row => ({
                ...row,
                analysisIds: JSON.parse(row.analysis_ids || '[]')
            }));

            res.json(summaries);
        }
    );
});

// 保存总结分析
app.post('/api/summaries', authenticateToken, (req, res) => {
    const { title, content, analysisIds } = req.body;

    db.run(
        'INSERT INTO summaries (user_id, title, content, analysis_ids) VALUES (?, ?, ?, ?)',
        [req.user.id, title, content, JSON.stringify(analysisIds)],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '保存总结失败' });
            }
            res.status(201).json({ 
                message: '总结保存成功',
                id: this.lastID 
            });
        }
    );
});

// 获取用户的总结列表
app.get('/api/summaries', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM summaries WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: '获取总结列表失败' });
            }

            const summaries = rows.map(row => ({
                ...row,
                analysisIds: JSON.parse(row.analysis_ids || '[]')
            }));

            res.json(summaries);
        }
    );
});

// 删除总结（软删除 - 标记为已删除）
app.delete('/api/summaries/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE summaries SET deleted_by_user = 1 WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '删除总结失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '总结不存在' });
            }

            res.json({ message: '总结删除成功' });
        }
    );
});

// 更新总结（编辑）
app.put('/api/summaries/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, content, is_public } = req.body;

    db.run(
        'UPDATE summaries SET title = ?, content = ?, is_public = ? WHERE id = ? AND user_id = ?',
        [title, content, is_public ? 1 : 0, id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '更新总结失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '总结不存在' });
            }

            res.json({ message: '总结更新成功' });
        }
    );
});

// 调用AI分析的代理接口
app.post('/api/analyze', authenticateToken, async (req, res) => {
    try {
        const { prompt, apiKey, model, apiEndpoint } = req.body;

        // 首先尝试使用用户保存的API密钥
        db.get(
            'SELECT api_key FROM users WHERE id = ?',
            [req.user.id],
            async (err, user) => {
                if (err) {
                    return res.status(500).json({ error: '获取用户信息失败' });
                }

                const effectiveApiKey = apiKey || user.api_key;
                
                if (!effectiveApiKey) {
                    return res.status(400).json({ error: '未配置API密钥' });
                }

                const effectiveEndpoint = apiEndpoint || 'https://api.suanli.cn/v1';
                const effectiveModel = model || 'zai-org/GLM-4.5';

                // 调用外部API
                const response = await fetch(`${effectiveEndpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${effectiveApiKey}`
                    },
                    body: JSON.stringify({
                        model: effectiveModel,
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
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    return res.status(response.status).json({ 
                        error: errorData.error?.message || `API请求失败 (${response.status})` 
                    });
                }

                const data = await response.json();
                const analysis = data.choices[0].message.content;

                res.json({ analysis });
            }
        );
    } catch (error) {
        console.error('分析失败:', error);
        res.status(500).json({ error: '分析失败' });
    }
});

// 管理员API - 获取所有用户列表
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    db.all(
        'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: '获取用户列表失败' });
            }
            res.json(rows);
        }
    );
});

// 管理员API - 获取用户的所有分析（包括已删除的）
app.get('/api/admin/users/:userId/analyses', authenticateAdmin, (req, res) => {
    const { userId } = req.params;
    const { includeDeleted = false } = req.query;

    let query = 'SELECT * FROM analyses WHERE user_id = ?';
    const params = [userId];

    if (includeDeleted !== 'true') {
        query += ' AND deleted_by_user = 0';
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: '获取用户分析失败' });
        }

        const analyses = rows.map(row => ({
            ...row,
            issues: JSON.parse(row.issues || '[]'),
            strengths: JSON.parse(row.strengths || '[]'),
            tags: JSON.parse(row.tags || '[]')
        }));

        res.json(analyses);
    });
});

// 管理员API - 获取用户的所有总结（包括已删除的）
app.get('/api/admin/users/:userId/summaries', authenticateAdmin, (req, res) => {
    const { userId } = req.params;
    const { includeDeleted = false } = req.query;

    let query = 'SELECT * FROM summaries WHERE user_id = ?';
    const params = [userId];

    if (includeDeleted !== 'true') {
        query += ' AND deleted_by_user = 0';
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: '获取用户总结失败' });
        }

        const summaries = rows.map(row => ({
            ...row,
            analysisIds: JSON.parse(row.analysis_ids || '[]')
        }));

        res.json(summaries);
    });
});

// 管理员API - 获取服务器所有分析（总记录库）
app.get('/api/admin/analyses', authenticateAdmin, (req, res) => {
    const { page = 1, limit = 50, search = '', includeDeleted = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT a.*, u.username 
        FROM analyses a 
        JOIN users u ON a.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    if (includeDeleted !== 'true') {
        conditions.push('a.deleted_by_user = 0');
    }

    if (search) {
        conditions.push('(a.content LIKE ? OR a.summary LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: '获取分析列表失败' });
        }

        const analyses = rows.map(row => ({
            ...row,
            issues: JSON.parse(row.issues || '[]'),
            strengths: JSON.parse(row.strengths || '[]'),
            tags: JSON.parse(row.tags || '[]')
        }));

        res.json(analyses);
    });
});

// 管理员API - 获取服务器所有总结（总记录库）
app.get('/api/admin/summaries', authenticateAdmin, (req, res) => {
    const { page = 1, limit = 50, search = '', includeDeleted = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT s.*, u.username 
        FROM summaries s 
        JOIN users u ON s.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    if (includeDeleted !== 'true') {
        conditions.push('s.deleted_by_user = 0');
    }

    if (search) {
        conditions.push('(s.title LIKE ? OR s.content LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: '获取总结列表失败' });
        }

        const summaries = rows.map(row => ({
            ...row,
            analysisIds: JSON.parse(row.analysis_ids || '[]')
        }));

        res.json(summaries);
    });
});

// 管理员API - 获取统计信息
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    // 用户总数
    db.get('SELECT COUNT(*) as totalUsers FROM users', (err, userCount) => {
        if (err) {
            return res.status(500).json({ error: '获取统计信息失败' });
        }

        // 分析总数（包括已删除的）
        db.get('SELECT COUNT(*) as totalAnalyses FROM analyses', (err, analysisCount) => {
            if (err) {
                return res.status(500).json({ error: '获取统计信息失败' });
            }

            // 公开分析数
            db.get('SELECT COUNT(*) as publicAnalyses FROM analyses WHERE is_public = 1 AND deleted_by_user = 0', (err, publicAnalysisCount) => {
                if (err) {
                    return res.status(500).json({ error: '获取统计信息失败' });
                }

                // 总结总数（包括已删除的）
                db.get('SELECT COUNT(*) as totalSummaries FROM summaries', (err, summaryCount) => {
                    if (err) {
                        return res.status(500).json({ error: '获取统计信息失败' });
                    }

                    // 公开总结数
                    db.get('SELECT COUNT(*) as publicSummaries FROM summaries WHERE is_public = 1 AND deleted_by_user = 0', (err, publicSummaryCount) => {
                        if (err) {
                            return res.status(500).json({ error: '获取统计信息失败' });
                        }

                        res.json({
                            totalUsers: userCount.totalUsers,
                            totalAnalyses: analysisCount.totalAnalyses,
                            publicAnalyses: publicAnalysisCount.publicAnalyses,
                            totalSummaries: summaryCount.totalSummaries,
                            publicSummaries: publicSummaryCount.publicSummaries
                        });
                    });
                });
            });
        });
    });
});

// 管理员API - 添加管理员
app.post('/api/admin/add', authenticateAdmin, (req, res) => {
    const { userId } = req.body;

    db.run(
        'INSERT INTO admins (user_id) VALUES (?)',
        [userId],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: '用户已经是管理员' });
                }
                return res.status(500).json({ error: '添加管理员失败' });
            }

            res.status(201).json({ 
                message: '管理员添加成功',
                adminId: this.lastID 
            });
        }
    );
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

// 确保数据库目录存在
const dbDir = path.dirname('./database.sqlite');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}