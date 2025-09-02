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
    let segments = [];
    let segmentCount = 0;
    let segmentAngle = 0;
    
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
                // 检查LeanCloud是否初始化
                if (!window.AV) {
                    console.warn('LeanCloud SDK未加载，使用localStorage');
                    // 如果LeanCloud不可用，回退到localStorage
                    const savedFoods = localStorage.getItem('foodItems');
                    if (savedFoods) {
                        resolve(JSON.parse(savedFoods));
                    } else {
                        const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                        saveFoodData(defaultFoods);
                        resolve(defaultFoods);
                    }
                    return;
                }
                
                // 添加连接状态检查
                checkLeanCloudConnection().then(isConnected => {
                    if (!isConnected) {
                        console.warn('LeanCloud连接失败，使用localStorage');
                        const savedFoods = localStorage.getItem('foodItems');
                        if (savedFoods) {
                            resolve(JSON.parse(savedFoods));
                        } else {
                            const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                            saveFoodData(defaultFoods);
                            resolve(defaultFoods);
                        }
                        return;
                    }
                    
                    // 创建数据查询
                    const FoodList = AV.Object.extend('FoodList');
                    const query = new AV.Query(FoodList);
                    query.descending('updatedAt'); // 按更新时间排序，获取最新数据
                    query.limit(1);
                    
                    console.log('开始从LeanCloud加载数据...');
                    // 从LeanCloud查询数据
                    query.find().then(results => {
                        console.log('LeanCloud查询结果:', results);
                        if (results.length > 0) {
                            const foodList = results[0];
                            const foodItems = foodList.get('items');
                            if (foodItems && Array.isArray(foodItems)) {
                                console.log('成功加载到食物数据:', foodItems);
                                resolve(foodItems);
                            } else {
                                console.log('LeanCloud中没有有效数据，使用默认数据');
                                const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                                saveFoodData(defaultFoods);
                                resolve(defaultFoods);
                            }
                        } else {
                            console.log('LeanCloud中没有数据，创建默认数据');
                            // 如果没有数据，创建默认数据
                            const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                            saveFoodData(defaultFoods);
                            resolve(defaultFoods);
                        }
                    }).catch(error => {
                        console.error('加载数据失败:', error);
                        // 发生错误时回退到localStorage
                        const savedFoods = localStorage.getItem('foodItems');
                        if (savedFoods) {
                            resolve(JSON.parse(savedFoods));
                        } else {
                            const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                            saveFoodData(defaultFoods);
                            resolve(defaultFoods);
                        }
                    });
                });
            } catch (error) {
                console.error('加载数据异常:', error);
                // 发生异常时回退到localStorage
                const savedFoods = localStorage.getItem('foodItems');
                if (savedFoods) {
                    resolve(JSON.parse(savedFoods));
                } else {
                    const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
                    saveFoodData(defaultFoods);
                    resolve(defaultFoods);
                }
            }
        });
    }
    
    // 保存食物数据到LeanCloud
    function saveFoodData(foods) {
        try {
            // 同时保存到localStorage作为备份
            localStorage.setItem('foodItems', JSON.stringify(foods));
            console.log('数据已保存到localStorage');
            
            // 检查LeanCloud是否初始化
            if (window.AV) {
                // 添加连接状态检查
                checkLeanCloudConnection().then(isConnected => {
                    if (!isConnected) {
                        console.warn('LeanCloud连接失败，无法保存到云端');
                        return;
                    }
                    
                    // 创建或更新食物列表
                    const FoodList = AV.Object.extend('FoodList');
                    const query = new AV.Query(FoodList);
                    query.limit(1);
                    
                    console.log('准备保存数据到LeanCloud...');
                    query.find().then(results => {
                        let foodList;
                        if (results.length > 0) {
                            // 如果已存在数据，更新它
                            foodList = results[0];
                            console.log('找到现有数据，准备更新');
                        } else {
                            // 如果不存在数据，创建新的
                            foodList = new FoodList();
                            console.log('没有找到现有数据，创建新数据');
                        }
                        
                        // 设置食物列表数据
                        foodList.set('items', foods);
                        
                        // 保存到LeanCloud
                        foodList.save().then(savedObject => {
                            console.log('数据成功保存到LeanCloud:', savedObject);
                        }).catch(error => {
                            console.error('保存数据失败:', error);
                        });
                    }).catch(error => {
                        console.error('查询数据失败:', error);
                    });
                });
            }
        } catch (error) {
            console.error('保存数据异常:', error);
        }
    }
    
    // 添加数据变更监听器，实时同步云端数据
    function setupDataSync() {
        try {
            if (!window.AV) return;
            
            // 记录上次同步的时间戳
            let lastSyncTimestamp = new Date().getTime();
            
            console.log('设置数据同步机制');
            // 轮询检查云端数据变更（每5秒检查一次）
            setInterval(() => {
                // 先检查连接状态
                checkLeanCloudConnection().then(isConnected => {
                    if (!isConnected) {
                        console.warn('LeanCloud连接已断开，跳过同步');
                        return;
                    }
                    
                    const FoodList = AV.Object.extend('FoodList');
                    const query = new AV.Query(FoodList);
                    query.descending('updatedAt');
                    query.limit(1);
                    
                    query.find().then(results => {
                        if (results.length > 0) {
                            const foodList = results[0];
                            const updatedAt = foodList.get('updatedAt').getTime();
                            
                            // 只有当数据有更新时才同步
                            if (updatedAt > lastSyncTimestamp) {
                                lastSyncTimestamp = updatedAt;
                                
                                const foodItems = foodList.get('items');
                                if (foodItems && Array.isArray(foodItems)) {
                                    // 比较本地数据与云端数据是否不同
                                    const currentFoods = Array.from(document.querySelectorAll('.wheel-segment')).map(segment => {
                                        return segment.querySelector('span').textContent;
                                    });
                                    
                                    // 检查数组内容是否相同
                                    if (foodItems.length !== currentFoods.length || 
                                        !foodItems.every((food, index) => food === currentFoods[index])) {
                                        console.log('检测到云端数据更新，同步本地数据');
                                        // 如果数据不同，更新转盘
                                        recreateWheelSegments(foodItems);
                                        initWheel();
                                        // 也更新localStorage
                                        localStorage.setItem('foodItems', JSON.stringify(foodItems));
                                    }
                                }
                            }
                        }
                    }).catch(error => {
                        console.error('同步数据失败:', error);
                    });
                });
            }, 5000); // 每5秒检查一次
        } catch (error) {
            console.error('设置数据同步异常:', error);
        }
    }
    
    // 检查LeanCloud连接状态
    function checkLeanCloudConnection() {
        return new Promise((resolve) => {
            if (!window.AV) {
                resolve(false);
                return;
            }
            
            try {
                // 使用简单的查询来测试连接
                const TestObject = AV.Object.extend('TestObject');
                const testQuery = new AV.Query(TestObject);
                testQuery.limit(1);
                
                testQuery.find().then(() => {
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                });
            } catch (error) {
                console.error('检查连接状态失败:', error);
                resolve(false);
            }
        });
    }
    
    // 初始化应用函数
    function initApp() {
      try {
        console.log('开始初始化应用...');
        if (window.AV) {
          console.log('检测到LeanCloud SDK，尝试连接...');
          loadFoodData()
            .then(savedFoods => {
              console.log('初始化数据加载完成，开始创建转盘');
              // 清除现有的扇形
              const wheelCenter = document.querySelector('.wheel-center');
              const existingSegments = document.querySelectorAll('.wheel-segment');
              existingSegments.forEach(segment => segment.remove());
              
              // 重新创建转盘
              recreateWheelSegments(savedFoods);
              initWheel();
              setupDataSync(); // 设置数据同步
            })
            .catch(error => {
              console.error('加载数据失败:', error);
              // 回退到默认数据
              const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
              recreateWheelSegments(defaultFoods);
              initWheel();
            });
        } else {
          console.log('未检测到LeanCloud SDK，使用localStorage');
          // 如果LeanCloud未初始化，使用localStorage
          setTimeout(() => {
            const savedFoods = localStorage.getItem('foodItems');
            if (savedFoods) {
              recreateWheelSegments(JSON.parse(savedFoods));
            } else {
              const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
              recreateWheelSegments(defaultFoods);
              localStorage.setItem('foodItems', JSON.stringify(defaultFoods));
            }
            initWheel();
          }, 0);
        }
      } catch (error) {
        console.error('应用初始化异常:', error);
        const defaultFoods = ['火锅', '烧烤', '炒菜', '汉堡', '寿司', '麻辣烫', '串', '方便面'];
        recreateWheelSegments(defaultFoods);
        initWheel();
      }
    }
    
    // 添加食物函数 - 保持不变
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
      
      // 保存食物数据到LeanCloud
      const foodTexts = Array.from(document.querySelectorAll('.wheel-segment')).map(segment => {
        return segment.querySelector('span').textContent;
      });
      
      // 添加保存结果的反馈
      try {
        saveFoodData(foodTexts);
        console.log('食物数据保存成功:', foodTexts);
      } catch (error) {
        console.error('保存食物数据失败:', error);
        alert('食物已添加到本地，但保存到云端失败，请稍后再试');
      }
      
      // 关闭模态框并清空输入
      modal.style.display = 'none';
      foodInput.value = '';
      
      // 显示添加成功信息
      resultText.textContent = `成功添加：${trimmedFoodName}`;
    }
    
    // 保留其他函数不变...
    function deleteFood(index) {
        // 原函数内容保持不变
        if (index < 0) return;
        
        const existingSegments = document.querySelectorAll('.wheel-segment');
        if (index >= existingSegments.length) return;
        
        // 获取要删除的食物名称
        const foodName = existingSegments[index].querySelector('span') ? 
                        existingSegments[index].querySelector('span').textContent : 
                        existingSegments[index].textContent;
        
        // 删除该扇形元素
        existingSegments[index].remove();
        
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
    
    // 其他函数（showFoodList, spinWheel, initWheel, recreateWheelSegments）保持不变...
    function showFoodList() {
        // 原函数内容保持不变
        foodList.innerHTML = '';
        const existingSegments = document.querySelectorAll('.wheel-segment');
        
        existingSegments.forEach((segment, index) => {
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
    
    function spinWheel() {
        // 原函数内容保持不变
        if (spinning || segments.length === 0) return;
        
        spinning = true;
        const randomSpin = Math.floor(Math.random() * 360) + 1080; // 至少旋转3圈
        
        // 添加旋转动画
        wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        wheel.style.transform = `rotate(${randomSpin}deg)`;
        
        // 计算最终结果
        setTimeout(() => {
            const normalizedRotation = (randomSpin % 360 + 360) % 360;
            const adjustedRotation = (360 - normalizedRotation) % 360; // 调整为逆时针角度
            let winningIndex = Math.floor(adjustedRotation / segmentAngle);
            
            // 确保索引在有效范围内
            winningIndex = winningIndex % segments.length;
            
            // 获取获胜的食物名称
            const winningFood = segments[winningIndex].querySelector('span').textContent;
            resultText.textContent = `恭喜您抽到了：${winningFood}`;
            
            spinning = false;
        }, 4000);
    }
    
    function initWheel() {
        // 原函数内容保持不变
        segments = Array.from(document.querySelectorAll('.wheel-segment'));
        segmentCount = segments.length;
        
        if (segmentCount === 0) {
            return { segments: [], segmentCount: 0, segmentAngle: 0 };
        }
        
        segmentAngle = 360 / segmentCount;
        
        // 计算每个扇形的角度和应用颜色
        segments.forEach((segment, index) => {
            const startAngle = index * segmentAngle;
            const colorIndex = index % colors.length;
            const color = colors[colorIndex];
            
            // 设置扇形样式
            segment.style.position = 'absolute';
            segment.style.width = '50%';
            segment.style.height = '100%';
            segment.style.transformOrigin = '100% 50%';
            segment.style.transform = `rotate(${startAngle}deg)`;
            segment.style.backgroundColor = color;
            segment.style.clipPath = `polygon(0 0, 100% 50%, 0 100%)`;
            
            // 设置文字样式
            const textSpan = segment.querySelector('span');
            if (textSpan) {
                textSpan.style.position = 'absolute';
                textSpan.style.top = '50%';
                textSpan.style.left = '50%';
                textSpan.style.transform = `translate(-50%, -50%) rotate(${segmentAngle / 2 + startAngle}deg)`;
                textSpan.style.fontSize = '14px';
                textSpan.style.fontWeight = 'bold';
                textSpan.style.color = 'white';
                textSpan.style.whiteSpace = 'nowrap';
                textSpan.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
            }
        });
        
        return { segments, segmentCount, segmentAngle };
    }
    
    function recreateWheelSegments(foods) {
        // 原函数内容保持不变
        const wheelCenter = document.querySelector('.wheel-center');
        
        // 清除现有扇形
        const existingSegments = document.querySelectorAll('.wheel-segment');
        existingSegments.forEach(segment => segment.remove());
        
        // 创建新的扇形
        foods.forEach((food, index) => {
            const segment = document.createElement('div');
            segment.classList.add('wheel-segment');
            
            const textSpan = document.createElement('span');
            textSpan.textContent = food;
            segment.appendChild(textSpan);
            
            // 插入到转盘中心元素之前
            wheel.insertBefore(segment, wheelCenter);
        });
    }
    
    // 事件监听器保持不变
    spinBtn.addEventListener('click', spinWheel);
    
    addFoodBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });
    
    deleteFoodBtn.addEventListener('click', function() {
        showFoodList();
        deleteModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
        foodInput.value = '';
    });
    
    closeDeleteModal.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            foodInput.value = '';
        } else if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    confirmAddBtn.addEventListener('click', function() {
        addFood(foodInput.value);
    });
    
    confirmDeleteBtn.addEventListener('click', function() {
        deleteFood(selectedFoodIndex);
    });
    
    foodInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addFood(foodInput.value);
        }
    });
    
    // 初始化数据和转盘
    initApp();
});

// 确保在页面和LeanCloud SDK完全加载后初始化应用
if (window.AV) {
  // 如果AV对象已存在，立即初始化
  initializeApp();
} else {
  // 否则监听window对象的变化，等待AV对象加载完成
  const intervalId = setInterval(() => {
    if (window.AV) {
      clearInterval(intervalId);
      initializeApp();
    }
  }, 100);
  
  // 设置超时保护
  setTimeout(() => {
    clearInterval(intervalId);
    console.warn('LeanCloud SDK加载超时，使用本地模式');
    initializeApp();
  }, 5000);
}