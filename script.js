// 全新优化的转盘逻辑，确保颜色正确显示、分布均匀和指针指向准确
document.addEventListener('DOMContentLoaded', function() {
    const wheel = document.querySelector('.wheel');
    const spinBtn = document.getElementById('spin-btn');
    const addFoodBtn = document.getElementById('add-food-btn');
    const deleteFoodBtn = document.getElementById('delete-food-btn');
    const resultText = document.getElementById('result-text');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const foodInput = document.getElementById('food-input');
    const confirmAddBtn = document.getElementById('confirm-add');
    const colorTextContainer = document.getElementById('color-text-container');
    
    // 删除食物相关元素
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModal = document.getElementsByClassName('delete-close')[0];
    const foodList = document.getElementById('food-list');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    let spinning = false;
    let selectedFoodIndex = -1;
    
    // 优化的颜色数组，确保色彩鲜明且视觉效果好
    const colors = [
        '#ff6b6b', // 红色
        '#4ecdc4', // 青色
        '#45b7d1', // 蓝色
        '#96ceb4', // 浅绿色
        '#feca57', // 黄色
        '#ff9ff3', // 粉色
        '#54a0ff', // 深蓝色
        '#5f27cd', // 紫色
        '#ff7675', // 浅红色
        '#74b9ff', // 浅蓝色
        '#a29bfe', // 淡紫色
        '#00b894', // 深绿色
        '#fdcb6e', // 金色
        '#e84393', // 玫红色
        '#0984e3', // 靛蓝色
        '#6c5ce7'  // 紫罗兰色
    ];
    
    // 从LeanCloud加载食物数据
    function loadFoodData() {
        return new Promise((resolve, reject) => {
            try {
                // 定义FoodList类（如果尚未定义）
                const FoodList = AV.Object.extend('FoodList');
                const query = new AV.Query(FoodList);
                
                // 按更新时间排序，获取最新的一条数据
                query.descending('updatedAt');
                query.limit(1);
                
                query.find().then(results => {
                    if (results.length > 0) {
                        const foodData = results[0];
                        const foods = foodData.get('foods') || [];
                        console.log('数据已从LeanCloud加载:', foods);
                        
                        // 同时保存到localStorage作为备份
                        localStorage.setItem('foodItems', JSON.stringify(foods));
                        resolve(foods);
                    } else {
                        // 如果云端没有数据，尝试从localStorage加载
                        console.log('云端无数据，尝试从本地加载');
                        const savedFoods = localStorage.getItem('foodItems');
                        if (savedFoods) {
                            try {
                                const foods = JSON.parse(savedFoods);
                                console.log('数据已从本地加载:', foods);
                                resolve(foods);
                            } catch (e) {
                                console.error('解析本地数据失败:', e);
                                // 如果解析失败，使用默认数据
                                const defaultFoods = getDefaultFoods();
                                resolve(defaultFoods);
                            }
                        } else {
                            // 如果本地也没有数据，使用默认数据
                            const defaultFoods = getDefaultFoods();
                            resolve(defaultFoods);
                        }
                    }
                }).catch(error => {
                    console.error('从LeanCloud加载数据失败:', error);
                    // 加载失败时，尝试从localStorage加载
                    const savedFoods = localStorage.getItem('foodItems');
                    if (savedFoods) {
                        try {
                            const foods = JSON.parse(savedFoods);
                            console.log('数据已从本地加载(LeanCloud失败回退):', foods);
                            resolve(foods);
                        } catch (e) {
                            console.error('解析本地数据失败:', e);
                            // 如果解析失败，使用默认数据
                            const defaultFoods = getDefaultFoods();
                            resolve(defaultFoods);
                        }
                    } else {
                        // 如果本地也没有数据，使用默认数据
                        const defaultFoods = getDefaultFoods();
                        resolve(defaultFoods);
                    }
                });
            } catch (error) {
                console.error('加载数据异常:', error);
                
                // 加载失败时，尝试从localStorage加载
                const savedFoods = localStorage.getItem('foodItems');
                if (savedFoods) {
                    try {
                        const foods = JSON.parse(savedFoods);
                        console.log('数据已从本地加载(异常回退):', foods);
                        resolve(foods);
                    } catch (e) {
                        console.error('解析本地数据失败:', e);
                        // 如果解析失败，使用默认数据
                        const defaultFoods = getDefaultFoods();
                        resolve(defaultFoods);
                    }
                } else {
                    // 如果本地也没有数据，使用默认数据
                    const defaultFoods = getDefaultFoods();
                    resolve(defaultFoods);
                }
            }
        });
    }
    
    // 获取默认食物数据
    function getDefaultFoods() {
        return ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
    }
    
    // 保存食物数据到localStorage和LeanCloud
    // 在saveFoodData函数中添加UI错误显示
    function saveFoodData(foods) {
        try {
            // 保存到localStorage
            localStorage.setItem('foodItems', JSON.stringify(foods));
            console.log('数据已保存到localStorage:', foods);
            
            // 尝试保存到LeanCloud
            try {
                const FoodList = AV.Object.extend('FoodList');
                
                // 先查询是否已存在数据
                const query = new AV.Query(FoodList);
                query.descending('updatedAt');
                query.limit(1);
                
                query.find().then(results => {
                    if (results.length > 0) {
                        // 如果存在数据，更新现有数据
                        const foodData = results[0];
                        foodData.set('foods', foods);
                        foodData.save().then(() => {
                            console.log('数据已成功更新到LeanCloud');
                            resultText.textContent = '数据已成功保存';
                        }).catch(error => {
                            console.error('更新LeanCloud数据失败:', error);
                            // 在UI上显示错误信息
                            resultText.textContent = '云存储更新失败: ' + error.message;
                            // 这里不抛出异常，确保即使云端保存失败也不影响本地功能
                        });
                    } else {
                        // 如果不存在数据，创建新数据
                        const foodData = new FoodList();
                        foodData.set('foods', foods);
                        // 确保设置正确的权限
                        const acl = new AV.ACL();
                        acl.setPublicReadAccess(true);
                        acl.setPublicWriteAccess(true);
                        foodData.setACL(acl);
                        foodData.save().then(() => {
                            console.log('数据已成功保存到LeanCloud');
                            resultText.textContent = '数据已成功保存';
                        }).catch(error => {
                            console.error('保存LeanCloud数据失败:', error);
                            // 在UI上显示错误信息
                            resultText.textContent = '云存储保存失败: ' + error.message;
                            // 这里不抛出异常，确保即使云端保存失败也不影响本地功能
                        });
                    }
                }).catch(error => {
                    console.error('查询LeanCloud数据失败:', error);
                    // 尝试直接创建新数据
                    const foodData = new FoodList();
                    foodData.set('foods', foods);
                    // 确保设置正确的权限
                    const acl = new AV.ACL();
                    acl.setPublicReadAccess(true);
                    acl.setPublicWriteAccess(true);
                    foodData.setACL(acl);
                    foodData.save().then(() => {
                        console.log('数据已成功保存到LeanCloud');
                        resultText.textContent = '数据已成功保存';
                    }).catch(error => {
                        console.error('保存LeanCloud数据失败:', error);
                        // 在UI上显示错误信息
                        resultText.textContent = '云存储保存失败: ' + error.message;
                        // 这里不抛出异常，确保即使云端保存失败也不影响本地功能
                    });
                });
            } catch (cloudError) {
                console.error('LeanCloud保存异常:', cloudError);
                // 在UI上显示错误信息
                resultText.textContent = '云存储异常: ' + cloudError.message;
                // 这里不抛出异常，确保即使云端保存失败也不影响本地功能
            }
        } catch (error) {
            console.error('保存数据异常:', error);
            alert('保存数据失败，请检查浏览器存储权限');
            throw error; // 本地存储失败时抛出异常
        }
    }
    
    // 重新创建转盘的所有扇形
    function recreateWheelSegments(foods) {
        // 先清除现有的扇形（除了中心元素）
        const wheelCenter = document.querySelector('.wheel-center');
        const segments = document.querySelectorAll('.wheel-segment');
        segments.forEach(segment => segment.remove());
        
        // 重新创建所有扇形
        foods.forEach(food => {
            const newSegment = document.createElement('div');
            newSegment.classList.add('wheel-segment');
            const textSpan = document.createElement('span');
            textSpan.textContent = food;
            newSegment.appendChild(textSpan);
            wheel.insertBefore(newSegment, wheelCenter);
        });
    }
    
    // 更新右侧颜色-文字对应显示
    function updateColorTextDisplay() {
        // 清空容器
        colorTextContainer.innerHTML = '';
        
        // 获取所有扇形
        const segments = document.querySelectorAll('.wheel-segment');
        const segmentCount = segments.length;
        
        // 为每个扇形创建一个对应的颜色-文字显示项
        segments.forEach((segment, index) => {
            const text = segment.querySelector('span') ? 
                         segment.querySelector('span').textContent : 
                         segment.textContent;
            
            // 使用与initWheel相同的颜色分配算法
            const step = Math.max(1, Math.floor(colors.length / segmentCount));
            const colorIndex = (index * step) % colors.length;
            const color = colors[colorIndex];
            
            // 创建颜色-文字显示项
            const item = document.createElement('div');
            item.className = 'color-text-item';
            item.style.background = color;
            
            // 创建颜色指示器
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.background = color;
            colorIndicator.style.width = '20px';
            colorIndicator.style.height = '20px';
            colorIndicator.style.display = 'inline-block';
            colorIndicator.style.marginRight = '10px';
            
            // 创建文字显示
            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            
            // 组装并添加到容器
            item.appendChild(colorIndicator);
            item.appendChild(textSpan);
            colorTextContainer.appendChild(item);
        });
    }
    
    // 初始化转盘 - 确保颜色正确应用和扇形完全正常显示
    function initWheel() {
        const segments = document.querySelectorAll('.wheel-segment');
        const segmentCount = segments.length;
        const segmentAngle = 360 / segmentCount;
        const wheelRadius = 200; // 转盘半径，与CSS中的400px宽度对应
        
        // 防止转盘条目过少
        if (segmentCount < 2) {
            resultText.textContent = '至少需要保留2个食物选项';
            return;
        }
        
        // 设置每个扇形的角度和样式
        segments.forEach((segment, index) => {
            // 重置样式，移除CSS中可能冲突的设置
            segment.style.cssText = '';
            
            // 计算扇形的起始和结束角度
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            
            // 将角度转换为弧度
            const startRad = startAngle * Math.PI / 180;
            const endRad = endAngle * Math.PI / 180;
            
            // 计算扇形的四个顶点坐标
            const centerX = 50;
            const centerY = 50;
            
            // 计算扇形外边缘的两个点坐标
            const startX = centerX + 50 * Math.cos(startRad);
            const startY = centerY + 50 * Math.sin(startRad);
            const endX = centerX + 50 * Math.cos(endRad);
            const endY = centerY + 50 * Math.sin(endRad);
            
            // 创建精确的扇形路径
            let arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
            const clipPath = `polygon(
                ${centerX}% ${centerY}%,
                ${startX}% ${startY}%,
                ${endX}% ${endY}%
            )`;
            
            // 设置扇形样式 - 使用精确的多边形路径创建扇形
            segment.style.position = 'absolute';
            segment.style.width = '100%';
            segment.style.height = '100%';
            segment.style.clipPath = clipPath;
            segment.style.transformOrigin = 'center';
            
            // 优化的颜色分配算法
            const step = Math.max(1, Math.floor(colors.length / segmentCount));
            const colorIndex = (index * step) % colors.length;
            segment.style.backgroundColor = colors[colorIndex];
            
            // 调整文字样式，确保文字在扇形内部正确显示
            const text = segment.querySelector('span');
            if (text) {
                // 计算文字的放置角度（扇形的中间角度）
                const textAngle = startAngle + segmentAngle / 2;
                const textRad = textAngle * Math.PI / 180;
                
                // 计算文字距离中心的位置
                const textRadius = 0.6; // 文字距离中心的比例（0-1之间）
                const textX = centerX + 50 * textRadius * Math.cos(textRad);
                const textY = centerY + 50 * textRadius * Math.sin(textRad);
                
                // 设置文字样式和位置
                text.style.position = 'absolute';
                text.style.width = 'auto';
                text.style.textAlign = 'center';
                text.style.fontSize = '14px';
                text.style.fontWeight = 'bold';
                text.style.color = 'white';
                text.style.textShadow = '0 0 2px rgba(0,0,0,0.5)';
                text.style.left = `${textX}%`;
                text.style.top = `${textY}%`;
                text.style.transform = 'translate(-50%, -50%)';
            }
        });
        
        // 更新右侧颜色-文字对应显示
        updateColorTextDisplay();
    }
    
    // 旋转转盘
    function spinWheel() {
        if (spinning) return;
        
        spinning = true;
        const segments = document.querySelectorAll('.wheel-segment');
        const segmentCount = segments.length;
        
        // 防止转盘条目过少
        if (segmentCount < 2) {
            resultText.textContent = '至少需要保留2个食物选项';
            spinning = false;
            return;
        }
        
        // 计算旋转角度（多圈+随机角度）
        const spins = 5 + Math.floor(Math.random() * 5); // 5-9圈
        const randomSegment = Math.floor(Math.random() * segmentCount);
        const segmentAngle = 360 / segmentCount;
        const targetAngle = spins * 360 + randomSegment * segmentAngle;
        
        // 添加过渡效果
        wheel.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        wheel.style.transform = `rotate(${targetAngle}deg)`;
        
        // 等待旋转结束后显示结果
        setTimeout(() => {
            spinning = false;
            
            // 重置过渡效果，避免影响后续操作
            wheel.style.transition = 'none';
            
            // 获取选中的食物 - 确保索引计算正确
            const selectedFood = segments[randomSegment].querySelector('span').textContent;
            resultText.textContent = `恭喜你，今天吃${selectedFood}！`;
        }, 5000);
    }
    
    // 添加食物
    function addFood(foodName) {
        // 验证输入
        if (!foodName || foodName.trim() === '') {
            alert('请输入食物名称');
            return false;
        }
        
        foodName = foodName.trim();
        
        // 检查是否已存在该食物
        const segments = document.querySelectorAll('.wheel-segment');
        for (let i = 0; i < segments.length; i++) {
            const text = segments[i].querySelector('span').textContent;
            if (text === foodName) {
                alert('该食物已存在');
                return false;
            }
        }
        
        // 创建新的扇形
        const wheelCenter = document.querySelector('.wheel-center');
        const newSegment = document.createElement('div');
        newSegment.classList.add('wheel-segment');
        const textSpan = document.createElement('span');
        textSpan.textContent = foodName;
        newSegment.appendChild(textSpan);
        wheel.insertBefore(newSegment, wheelCenter);
        
        // 重新初始化转盘
        initWheel();
        
        // 保存更新后的数据
        const foods = Array.from(document.querySelectorAll('.wheel-segment span')).map(span => span.textContent);
        saveFoodData(foods);
        
        // 清空输入框并关闭模态框
        foodInput.value = '';
        modal.style.display = 'none';
        
        return true;
    }
    
    // 删除食物
    function deleteFood() {
        if (selectedFoodIndex === -1) {
            alert('请选择要删除的食物');
            return;
        }
        
        const segments = document.querySelectorAll('.wheel-segment');
        
        // 确保至少保留2个食物
        if (segments.length <= 2) {
            alert('至少需要保留2个食物选项');
            deleteModal.style.display = 'none';
            return;
        }
        
        // 删除选中的扇形
        segments[selectedFoodIndex].remove();
        
        // 重新初始化转盘
        initWheel();
        
        // 保存更新后的数据
        const foods = Array.from(document.querySelectorAll('.wheel-segment span')).map(span => span.textContent);
        saveFoodData(foods);
        
        // 关闭模态框并重置选择
        deleteModal.style.display = 'none';
        selectedFoodIndex = -1;
        
        // 显示操作成功消息
        resultText.textContent = '食物已成功删除';
    }
    
    // 显示食物列表（用于删除操作）
    function showFoodList() {
        // 清空列表
        foodList.innerHTML = '';
        
        // 获取所有食物和颜色
        const segments = document.querySelectorAll('.wheel-segment');
        const segmentColors = Array.from(segments).map(segment => {
            // 获取扇形的背景色
            return window.getComputedStyle(segment).backgroundColor;
        });
        
        // 创建食物列表项
        segments.forEach((segment, index) => {
            const text = segment.querySelector('span').textContent;
            const listItem = document.createElement('div');
            listItem.className = 'food-list-item';
            
            // 创建颜色指示器
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'food-color-indicator';
            colorIndicator.style.backgroundColor = segmentColors[index];
            
            // 创建文本容器
            const textContainer = document.createElement('div');
            textContainer.textContent = text;
            
            // 组装列表项
            listItem.appendChild(colorIndicator);
            listItem.appendChild(textContainer);
            
            listItem.addEventListener('click', function() {
                // 移除其他项的选中状态
                document.querySelectorAll('.food-list-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 设置当前项为选中状态
                this.classList.add('selected');
                selectedFoodIndex = index;
                
                // 启用确认删除按钮
                confirmDeleteBtn.disabled = false;
            });
            foodList.appendChild(listItem);
        });
        
        // 重置选中状态和禁用按钮
        selectedFoodIndex = -1;
        confirmDeleteBtn.disabled = true;
    }
    
    // 设置数据同步（定时检查云端数据更新）
    function setupDataSync() {
        // 每30秒检查一次云端数据
        setInterval(() => {
            // 仅在非旋转状态下检查数据更新
            if (!spinning) {
                const FoodList = AV.Object.extend('FoodList');
                const query = new AV.Query(FoodList);
                query.descending('updatedAt');
                query.limit(1);
                
                query.find().then(results => {
                    if (results.length > 0) {
                        const cloudFoods = results[0].get('foods') || [];
                        const localFoods = Array.from(document.querySelectorAll('.wheel-segment span')).map(span => span.textContent);
                        
                        // 比较云端数据和本地数据是否相同
                        if (JSON.stringify(cloudFoods) !== JSON.stringify(localFoods)) {
                            console.log('检测到云端数据更新，正在同步...');
                            recreateWheelSegments(cloudFoods);
                            initWheel();
                            localStorage.setItem('foodItems', JSON.stringify(cloudFoods));
                            resultText.textContent = '数据已从云端同步';
                        }
                    }
                }).catch(error => {
                    console.error('同步数据失败:', error);
                });
            }
        }, 30000); // 30秒
    }
    
    // 事件监听器
    spinBtn.addEventListener('click', spinWheel);
    
    // 添加食物按钮
    addFoodBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        foodInput.focus();
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 确认添加食物
    confirmAddBtn.addEventListener('click', function() {
        addFood(foodInput.value);
    });
    
    // 删除食物按钮
    deleteFoodBtn.addEventListener('click', function() {
        showFoodList();
        deleteModal.style.display = 'block';
    });
    
    // 关闭删除模态框
    closeDeleteModal.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // 确认删除食物
    confirmDeleteBtn.addEventListener('click', deleteFood);
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // 按Enter键添加食物
    foodInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addFood(foodInput.value);
        }
    });
    
    // 初始化应用
    function initApp() {
        try {
            loadFoodData().then(savedFoods => {
                recreateWheelSegments(savedFoods);
                initWheel();
                resultText.textContent = '数据已成功加载';
                
                // 设置数据同步
                setupDataSync();
            }).catch(error => {
                console.error('加载数据失败:', error);
                alert('加载数据失败: ' + error.message);
                
                // 使用默认数据初始化
                const defaultFoods = getDefaultFoods();
                recreateWheelSegments(defaultFoods);
                initWheel();
                saveFoodData(defaultFoods);
            });
        } catch (error) {
            console.error('应用初始化异常:', error);
            alert('初始化失败: ' + error.message);
        }
    }
    
    // 调用初始化函数
    initApp();
});