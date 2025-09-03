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
    
    // 从localStorage加载食物数据
    function loadFoodData() {
        try {
            const savedFoods = localStorage.getItem('foodItems');
            if (savedFoods) {
                try {
                    const foods = JSON.parse(savedFoods);
                    console.log('数据已从本地加载:', foods);
                    return foods;
                } catch (e) {
                    console.error('解析本地数据失败:', e);
                    // 如果解析失败，使用默认数据
                    return getDefaultFoods();
                }
            } else {
                // 如果本地没有数据，使用默认数据
                const defaultFoods = getDefaultFoods();
                saveFoodData(defaultFoods);
                return defaultFoods;
            }
        } catch (error) {
            console.error('加载数据异常:', error);
            alert('加载数据失败，请检查浏览器存储权限');
            return getDefaultFoods();
        }
    }
    
    // 获取默认食物数据
    function getDefaultFoods() {
        return ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
    }
    
    // 保存食物数据到localStorage
    function saveFoodData(foods) {
        try {
            localStorage.setItem('foodItems', JSON.stringify(foods));
            console.log('数据已保存到localStorage:', foods);
        } catch (error) {
            console.error('保存数据异常:', error);
            alert('保存数据失败，请检查浏览器存储权限');
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
        
        // 为每个扇形创建一个对应的颜色-文字显示项
        segments.forEach((segment, index) => {
            const text = segment.querySelector('span') ? 
                         segment.querySelector('span').textContent : 
                         segment.textContent;
            
            const colorIndex = index % colors.length;
            const color = colors[colorIndex];
            
            // 创建颜色-文字显示项
            const item = document.createElement('div');
            item.className = 'color-text-item';
            item.style.background = color;
            
            // 创建颜色指示器
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.background = color;
            
            // 创建文字显示
            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            
            // 组装并添加到容器
            item.appendChild(colorIndicator);
            item.appendChild(textSpan);
            colorTextContainer.appendChild(item);
        });
    }
    
    // 初始化转盘 - 确保颜色正确应用和分布均匀
    function initWheel() {
        const segments = document.querySelectorAll('.wheel-segment');
        const segmentCount = segments.length;
        const segmentAngle = 360 / segmentCount;
        
        // 防止转盘条目过少
        if (segmentCount < 2) {
            resultText.textContent = '至少需要保留2个食物选项';
            deleteFoodBtn.disabled = true;
        } else {
            deleteFoodBtn.disabled = false;
        }
        
        // 清空之前的样式
        segments.forEach(segment => {
            segment.style.transform = '';
            segment.style.background = '';
            segment.style.clipPath = '';
        });
        
        // 正确设置每个扇形的角质和位置和颜色
        segments.forEach((segment, index) => {
            // 计算每个扇形的起始角度
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colorIndex = index % colors.length;
            
            // 设置扇形的背景颜色
            segment.style.background = colors[colorIndex];
            segment.style.position = 'absolute';
            segment.style.width = '100%';
            segment.style.height = '100%';
            segment.style.borderRadius = '50%';
            segment.style.transformOrigin = 'center';
            segment.style.overflow = 'hidden';
            
            // 使用clip-path创建扇形
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // 计算扇形的路径
            let clipPath = '';
            clipPath += 'polygon(';
            clipPath += '50% 50%,'; // 中心
            
            // 为了确保扇形边缘平滑，我们使用多个点来绘制弧线
            const arcPoints = 10;
            for (let i = 0; i <= arcPoints; i++) {
                const angle = startAngle + (endAngle - startAngle) * (i / arcPoints);
                const rad = (angle - 90) * Math.PI / 180;
                const x = 50 + 50 * Math.cos(rad);
                const y = 50 + 50 * Math.sin(rad);
                clipPath += `${x}% ${y}%,`;
            }
            
            clipPath = clipPath.slice(0, -1); // 移除最后一个逗号
            clipPath += ')';
            
            // 应用clip-path
            segment.style.clipPath = clipPath;
            
            // 处理文字元素
            const textElement = segment.querySelector('span') || document.createElement('span');
            if (!segment.querySelector('span')) {
                textElement.textContent = segment.textContent.trim();
                segment.textContent = '';
                segment.appendChild(textElement);
            }
            
            // 确保文字正确显示在扇形中心
            const textAngle = startAngle + segmentAngle / 2;
            
            // 设置文字样式
            textElement.style.position = 'absolute';
            textElement.style.top = '50%';
            textElement.style.left = '50%';
            textElement.style.transform = `translate(-50%, -50%) rotate(${textAngle}deg)`;
            textElement.style.width = '70%';
            textElement.style.textAlign = 'center';
            textElement.style.color = 'white';
            textElement.style.fontWeight = 'bold';
            textElement.style.fontSize = '1rem';
            textElement.style.whiteSpace = 'nowrap';
            textElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.3)';
        });
        
        // 更新右侧颜色-文字对应显示
        updateColorTextDisplay();
        
        return { segments, segmentCount, segmentAngle };
    }
    
    // 旋转转盘函数 - 确保指针指向与结果完全匹配
    function spinWheel() {
        if (spinning) return;
        
        spinning = true;
        spinBtn.disabled = true;
        resultText.textContent = '转盘旋转中...';
        
        // 重新获取最新的扇形信息
        const currentSegments = document.querySelectorAll('.wheel-segment');
        const currentSegmentCount = currentSegments.length;
        const currentSegmentAngle = 360 / currentSegmentCount;
        
        // 随机选择一个扇形作为最终结果（确保概率均等）
        const randomIndex = Math.floor(Math.random() * currentSegmentCount);
        
        // 计算需要旋转的总角度（5-10圈 + 目标位置）
        const fullSpins = Math.floor(Math.random() * 6) + 5; // 5-10圈
        
        // 计算目标角度，确保指针精确指向所选扇形的中心位置
        const targetAngle = 360 * fullSpins - (randomIndex * currentSegmentAngle + currentSegmentAngle / 2);
        
        // 设置过渡效果
        const spinDuration = fullSpins * 0.6; // 根据圈数调整时间
        wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
        wheel.style.transform = `rotate(${targetAngle}deg)`;
        
        // 显示结果
        setTimeout(() => {
            const selectedFood = currentSegments[randomIndex].querySelector('span') ? 
                               currentSegments[randomIndex].querySelector('span').textContent : 
                               currentSegments[randomIndex].textContent;
            
            resultText.textContent = `恭喜！今天吃：${selectedFood}`;
            
            spinning = false;
            spinBtn.disabled = false;
        }, spinDuration * 1000);
    }
    
    // 添加食物函数
    function addFood(foodName) {
        if (!foodName.trim()) {
            alert('请输入有效的食物名称');
            return;
        }
        
        // 检测是否存在重复食物（不区分大小写）
        const existingSegments = document.querySelectorAll('.wheel-segment');
        const trimmedFoodName = foodName.trim();
        
        for (const segment of existingSegments) {
            const segmentText = segment.querySelector('span') ? 
                          segment.querySelector('span').textContent.trim() : 
                          segment.textContent.trim();
            
            if (segmentText.toLowerCase() === trimmedFoodName.toLowerCase()) {
                alert(`"${trimmedFoodName}" 已经存在于转盘中了！`);
                return;
            }
        }
        
        // 创建新的扇形元素并添加文字容器
        const newSegment = document.createElement('div');
        newSegment.classList.add('wheel-segment');
        const textSpan = document.createElement('span');
        textSpan.textContent = trimmedFoodName;
        newSegment.appendChild(textSpan);
        
        // 插入到转盘中心元素之前
        const wheelCenter = document.querySelector('.wheel-center');
        wheel.insertBefore(newSegment, wheelCenter);
        
        // 重新初始化转盘，确保所有扇形均匀分布并正确应用颜色
        ({ segments, segmentCount, segmentAngle } = initWheel());
        
        // 保存食物数据到localStorage
        const foodTexts = Array.from(document.querySelectorAll('.wheel-segment')).map(segment => {
            return segment.querySelector('span').textContent;
        });
        saveFoodData(foodTexts);
        
        // 关闭模态框并清空输入
        modal.style.display = 'none';
        foodInput.value = '';
        
        // 显示添加成功信息
        resultText.textContent = `成功添加：${trimmedFoodName}`;
    }
    
    // 删除食物函数
    function deleteFood(index) {
        if (index < 0) return;
        
        const segments = document.querySelectorAll('.wheel-segment');
        if (index >= segments.length) return;
        
        // 获取要删除的食物名称
        const foodName = segments[index].querySelector('span') ? 
                        segments[index].querySelector('span').textContent : 
                        segments[index].textContent;
        
        // 删除该扇形元素
        segments[index].remove();
        
        // 重新初始化转盘
        ({ segments, segmentCount, segmentAngle } = initWheel());
        
        // 保存更新后的食物数据到localStorage
        const foodTexts = Array.from(document.querySelectorAll('.wheel-segment')).map(segment => {
            return segment.querySelector('span').textContent;
        });
        saveFoodData(foodTexts);
        
        // 关闭模态框
        deleteModal.style.display = 'none';
        
        // 显示删除成功信息
        resultText.textContent = `成功删除：${foodName}`;
        
        // 重置选中状态
        selectedFoodIndex = -1;
    }
    
    // 显示食物列表
    function showFoodList() {
        foodList.innerHTML = '';
        const segments = document.querySelectorAll('.wheel-segment');
        
        segments.forEach((segment, index) => {
            const text = segment.querySelector('span') ? 
                        segment.querySelector('span').textContent : 
                        segment.textContent;
            
            const colorIndex = index % colors.length;
            const color = colors[colorIndex];
            
            const foodItem = document.createElement('div');
            foodItem.className = 'food-item';
            foodItem.dataset.index = index;
            
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'food-color-indicator';
            colorIndicator.style.backgroundColor = color;
            
            const foodText = document.createElement('span');
            foodText.textContent = text;
            
            foodItem.appendChild(colorIndicator);
            foodItem.appendChild(foodText);
            foodList.appendChild(foodItem);
            
            // 添加点击事件
            foodItem.addEventListener('click', function() {
                // 移除其他项的选中状态
                document.querySelectorAll('.food-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加当前项的选中状态
                this.classList.add('selected');
                selectedFoodIndex = parseInt(this.dataset.index);
                confirmDeleteBtn.disabled = false;
            });
        });
        
        // 重置选中状态
        selectedFoodIndex = -1;
        confirmDeleteBtn.disabled = true;
    }
    
    // 事件监听器
    spinBtn.addEventListener('click', spinWheel);
    
    // 添加食物按钮事件
    addFoodBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });
    
    // 删除食物按钮事件
    deleteFoodBtn.addEventListener('click', function() {
        showFoodList();
        deleteModal.style.display = 'block';
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
        foodInput.value = '';
    });
    
    // 关闭删除模态框
    closeDeleteModal.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            foodInput.value = '';
        } else if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    // 确认添加食物
    confirmAddBtn.addEventListener('click', function() {
        addFood(foodInput.value);
    });
    
    // 确认删除食物
    confirmDeleteBtn.addEventListener('click', function() {
        deleteFood(selectedFoodIndex);
    });
    
    // 按Enter键添加食物
    foodInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addFood(foodInput.value);
        }
    });
    
    // 初始化数据和转盘
    function initApp() {
        try {
            const savedFoods = loadFoodData();
            recreateWheelSegments(savedFoods);
            initWheel();
            resultText.textContent = '数据已成功加载';
        } catch (error) {
            console.error('应用初始化异常:', error);
            alert('初始化失败: ' + error.message);
        }
    }
    
    // 调用初始化函数
    initApp();
});