// 初始化管理员脚本
// 使用方法: node init-admin.js <username> <password>

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

async function initAdmin(username, password) {
    if (!username || !password) {
        console.log('使用方法: node init-admin.js <username> <password>');
        process.exit(1);
    }

    try {
        // 检查用户是否已存在
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (user) {
            console.log(`用户 "${username}" 已存在`);
            
            // 检查是否已经是管理员
            const admin = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM admins WHERE user_id = ?', [user.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (admin) {
                console.log(`用户 "${username}" 已经是管理员`);
            } else {
                // 添加为管理员
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO admins (user_id) VALUES (?)', [user.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`用户 "${username}" 已成功添加为管理员`);
            }
        } else {
            // 创建新用户
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, `${username}@example.com`, hashedPassword],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            console.log(`用户 "${username}" 创建成功`);
            
            // 添加为管理员
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO admins (user_id) VALUES (?)', [this.lastID], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`用户 "${username}" 已成功添加为管理员`);
        }
    } catch (error) {
        console.error('初始化管理员失败:', error);
    } finally {
        db.close();
    }
}

// 运行初始化
initAdmin(process.argv[2], process.argv[3]);