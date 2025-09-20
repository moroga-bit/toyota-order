// 発注書管理システム
class OrderManagementSystem {
    constructor() {
        this.orders = this.loadOrders();
        this.filteredOrders = [...this.orders];
        this.currentMonth = new Date(2025, 8); // 2025年9月（月は0ベースなので8）
        this.selectedMonth = new Date(2025, 8); // 2025年9月を設定
        this.initializeEventListeners();
        this.updateStats();
        this.updateMonthDisplay();
        this.updateMonthStats(); // 月統計を更新
        this.renderOrders();
    }

    // LocalStorageから発注書データを読み込み
    loadOrders() {
        try {
            const saved = localStorage.getItem('purchaseOrders');
            console.log('=== loadOrders ===');
            console.log('LocalStorageの生データ:', saved);
            
            const orders = saved ? JSON.parse(saved) : [];
            console.log('LocalStorageから読み込んだ発注書数:', orders.length);
            console.log('発注書データ:', orders);
            
            // 各発注書の詳細を表示
            orders.forEach((order, index) => {
                console.log(`発注書 ${index + 1}:`, {
                    id: order.id,
                    orderDate: order.orderDate,
                    companyName: order.companyName,
                    supplierName: order.supplierName,
                    total: order.total,
                    itemsCount: order.items ? order.items.length : 0
                });
            });
            
            return orders;
        } catch (error) {
            console.error('発注書データの読み込みエラー:', error);
            return [];
        }
    }

    // LocalStorageに発注書データを保存
    saveOrders() {
        try {
            localStorage.setItem('purchaseOrders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('発注書データの保存エラー:', error);
            alert('データの保存に失敗しました。');
        }
    }

    // イベントリスナーを初期化
    initializeEventListeners() {
        // 検索機能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterOrders();
            });
        }

        // フィルタ機能
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterOrders();
            });
        }

        // 更新ボタン
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // エクスポートボタン
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 全削除ボタン
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllOrders();
            });
        }

        // 月別ナビゲーション
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateMonth(-1);
            });
        }

        const nextMonthBtn = document.getElementById('nextMonthBtn');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateMonth(1);
            });
        }
    }

    // 発注書をフィルタリング
    filterOrders() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterValue = document.getElementById('filterSelect').value;

        this.filteredOrders = this.orders.filter(order => {
            // 検索条件（より詳細な検索）
            const matchesSearch = !searchTerm || 
                (order.supplierName && order.supplierName.toLowerCase().includes(searchTerm)) ||
                (order.id && order.id.toLowerCase().includes(searchTerm)) ||
                (order.companyName && order.companyName.toLowerCase().includes(searchTerm)) ||
                (order.contactPerson && order.contactPerson.toLowerCase().includes(searchTerm)) ||
                (order.staffMember && order.staffMember.toLowerCase().includes(searchTerm)) ||
                (order.remarks && order.remarks.toLowerCase().includes(searchTerm)) ||
                (order.items && order.items.some(item => 
                    item.name && item.name.toLowerCase().includes(searchTerm) ||
                    item.projectName && item.projectName.toLowerCase().includes(searchTerm)
                ));

            // フィルタ条件
            let matchesFilter = true;
            if (filterValue !== 'all') {
                const orderDate = new Date(order.orderDate);
                const now = new Date();
                
                switch (filterValue) {
                    case 'thisMonth':
                        matchesFilter = orderDate.getMonth() === now.getMonth() && 
                                       orderDate.getFullYear() === now.getFullYear();
                        break;
                    case 'lastMonth':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                        matchesFilter = orderDate.getMonth() === lastMonth.getMonth() && 
                                       orderDate.getFullYear() === lastMonth.getFullYear();
                        break;
                    case 'thisYear':
                        matchesFilter = orderDate.getFullYear() === now.getFullYear();
                        break;
                    case 'selectedMonth':
                        matchesFilter = orderDate.getMonth() === this.selectedMonth.getMonth() && 
                                       orderDate.getFullYear() === this.selectedMonth.getFullYear();
                        break;
                }
            } else {
                // デフォルトで選択月のデータを表示
                const orderDate = new Date(order.orderDate);
                matchesFilter = orderDate.getMonth() === this.selectedMonth.getMonth() && 
                               orderDate.getFullYear() === this.selectedMonth.getFullYear();
            }

            return matchesSearch && matchesFilter;
        });

        // 検索結果のハイライト表示を更新
        this.updateSearchHighlight(searchTerm);
        this.renderOrders();
    }

    // 検索結果のハイライト表示を更新
    updateSearchHighlight(searchTerm) {
        if (!searchTerm) return;
        
        // 検索結果数を表示
        const resultCount = this.filteredOrders.length;
        const totalCount = this.orders.length;
        
        // 検索結果表示エリアを更新
        let statusElement = document.getElementById('searchStatus');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'searchStatus';
            statusElement.className = 'filter-status';
            document.querySelector('.search-box').appendChild(statusElement);
        }
        
        statusElement.textContent = `検索結果: ${resultCount}件 / 全${totalCount}件`;
        statusElement.style.display = resultCount > 0 ? 'inline-block' : 'none';
    }

    // 発注書一覧をレンダリング
    renderOrders() {
        console.log('=== renderOrders 開始 ===');
        console.log('フィルタ済み発注書数:', this.filteredOrders.length);
        console.log('フィルタ済み発注書:', this.filteredOrders);
        
        const ordersGrid = document.getElementById('ordersGrid');
        const emptyState = document.getElementById('emptyState');

        if (!ordersGrid) {
            console.error('ordersGrid が見つかりません');
            return;
        }

        if (this.filteredOrders.length === 0) {
            console.log('発注書が0件のため、空の状態を表示');
            ordersGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        console.log('発注書カードを生成中...');
        ordersGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        ordersGrid.innerHTML = this.filteredOrders.map(order => this.createOrderCard(order)).join('');
        
        // 各カードのイベントリスナーを設定
        this.attachCardEventListeners();
        console.log('=== renderOrders 完了 ===');
    }

    // 発注書カードを作成
    createOrderCard(order) {
        const totalAmount = order.total || 0;
        const orderDate = new Date(order.orderDate).toLocaleDateString('ja-JP');
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div class="order-number">${order.id}</div>
                    <div class="order-date">${orderDate}</div>
                </div>
                
                <div class="order-info">
                    <div class="info-row">
                        <span class="info-label">発注先:</span>
                        <span class="info-value">${order.supplierName || '未設定'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">担当:</span>
                        <span class="info-value">${order.staffMember || '未設定'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">会社名:</span>
                        <span class="info-value">${order.companyName || '未設定'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">商品数:</span>
                        <span class="info-value">${order.items ? order.items.length : 0}件</span>
                    </div>
                </div>

                <div class="order-total">
                    <div class="total-amount">¥${totalAmount.toLocaleString()}</div>
                </div>

                <div class="order-actions">
                    <button class="btn btn-primary view-btn" data-order-id="${order.id}">
                        👁️ 詳細表示
                    </button>
                    <button class="btn btn-success edit-btn" data-order-id="${order.id}">
                        ✏️ 編集
                    </button>
                    <button class="btn btn-warning pdf-btn" data-order-id="${order.id}">
                        📄 PDF
                    </button>
                    <button class="btn btn-danger delete-btn" data-order-id="${order.id}">
                        🗑️ 削除
                    </button>
                </div>
            </div>
        `;
    }

    // カードのイベントリスナーを設定
    attachCardEventListeners() {
        // 詳細表示
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.viewOrder(orderId);
            });
        });

        // 編集
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.editOrder(orderId);
            });
        });

        // PDF生成
        document.querySelectorAll('.pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.generatePDF(orderId);
            });
        });

        // 削除
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                this.deleteOrder(orderId);
            });
        });
    }

    // 合計金額を計算
    calculateTotal(items) {
        return items.reduce((total, item) => {
            const subtotal = item.quantity * item.unitPrice;
            return total + subtotal;
        }, 0);
    }

    // 統計情報を更新
    updateStats() {
        const totalOrders = this.orders.length;
        const totalAmount = this.orders.reduce((sum, order) => sum + this.calculateTotal(order.items), 0);
        
        const now = new Date(2025, 8); // 2025年9月
        const thisMonthOrders = this.orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
        }).length;

        // 選択月の統計
        const selectedMonthOrders = this.orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === this.selectedMonth.getMonth() && 
                   orderDate.getFullYear() === this.selectedMonth.getFullYear();
        }).length;

        // 統計カードを更新
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalAmountEl = document.getElementById('totalAmount');
        const thisMonthOrdersEl = document.getElementById('thisMonthOrders');
        const selectedMonthOrdersEl = document.getElementById('selectedMonthOrders');

        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (totalAmountEl) totalAmountEl.textContent = `¥${totalAmount.toLocaleString()}`;
        if (thisMonthOrdersEl) thisMonthOrdersEl.textContent = thisMonthOrders;
        if (selectedMonthOrdersEl) selectedMonthOrdersEl.textContent = selectedMonthOrders;
    }

    // 月別ナビゲーション
    navigateMonth(direction) {
        this.selectedMonth.setMonth(this.selectedMonth.getMonth() + direction);
        this.updateMonthDisplay();
        this.filterOrders();
    }

    // 月表示を更新
    updateMonthDisplay() {
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];

        const year = this.selectedMonth.getFullYear();
        const month = monthNames[this.selectedMonth.getMonth()];
        
        // 月表示を更新
        const monthDisplay = document.getElementById('currentMonthDisplay');
        if (monthDisplay) {
            monthDisplay.textContent = `${year}年${month}`;
        }

        // 選択月の統計を更新
        this.updateMonthStats();
    }

    // 選択月の統計を更新
    updateMonthStats() {
        const selectedMonthOrders = this.orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === this.selectedMonth.getMonth() && 
                   orderDate.getFullYear() === this.selectedMonth.getFullYear();
        });

        const selectedMonthAmount = selectedMonthOrders.reduce((sum, order) => sum + this.calculateTotal(order.items), 0);
        const orderCount = selectedMonthOrders.length;

        // 月統計表示を更新
        const monthStats = document.getElementById('monthStats');
        if (monthStats) {
            monthStats.textContent = `発注書: ${orderCount}件 | 金額: ¥${selectedMonthAmount.toLocaleString()}`;
        }
    }

    // 発注書の詳細表示
    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // 詳細表示用のモーダルまたはページを作成
        const orderDetails = this.createOrderDetailsHTML(order);
        
        // 新しいウィンドウで詳細を表示
        const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>発注書詳細 - ${order.orderNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
                    .info-section { margin-bottom: 25px; }
                    .info-section h3 { color: #333; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
                    .info-row { display: flex; margin-bottom: 8px; }
                    .info-label { font-weight: bold; width: 120px; color: #666; }
                    .info-value { flex: 1; color: #333; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .items-table th { background: #f8f9fa; font-weight: bold; }
                    .total-section { text-align: right; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px; }
                    .total-row { display: flex; justify-content: flex-end; margin-bottom: 5px; }
                    .total-label { width: 150px; text-align: right; margin-right: 20px; }
                    .total-amount { font-size: 1.2em; font-weight: bold; color: #2c3e50; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${orderDetails}
                </div>
            </body>
            </html>
        `);
        newWindow.document.close();
    }

    // 発注書詳細HTMLを作成
    createOrderDetailsHTML(order) {
        const totalAmount = this.calculateTotal(order.items);
        const tax = Math.floor(totalAmount * 0.1);
        const subtotal = totalAmount - tax;

        const itemsHTML = order.items.map(item => `
            <tr>
                <td>${item.projectName || ''}</td>
                <td>${item.name}</td>
                <td>${item.quantity} ${item.unit || ''}</td>
                <td>¥${item.unitPrice.toLocaleString()}</td>
                <td>¥${(item.quantity * item.unitPrice).toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <div class="header">
                <h1>発注書詳細</h1>
                <h2>${order.id}</h2>
                <p>発注日: ${new Date(order.orderDate).toLocaleDateString('ja-JP')}</p>
            </div>

            <div class="info-section">
                <h3>発注元情報</h3>
                <div class="info-row"><span class="info-label">会社名:</span><span class="info-value">${order.companyName}</span></div>
                <div class="info-row"><span class="info-label">住所:</span><span class="info-value">${order.companyAddress}</span></div>
                <div class="info-row"><span class="info-label">電話:</span><span class="info-value">${order.companyPhone}</span></div>
                <div class="info-row"><span class="info-label">メール:</span><span class="info-value">${order.companyEmail}</span></div>
                <div class="info-row"><span class="info-label">担当:</span><span class="info-value">${order.staffMember || '未設定'}</span></div>
            </div>

            <div class="info-section">
                <h3>発注先情報</h3>
                <div class="info-row"><span class="info-label">会社名:</span><span class="info-value">${order.supplierName}</span></div>
                <div class="info-row"><span class="info-label">住所:</span><span class="info-value">${order.supplierAddress}</span></div>
                ${order.contactPerson ? `<div class="info-row"><span class="info-label">担当者:</span><span class="info-value">${order.contactPerson}</span></div>` : ''}
            </div>

            <div class="info-section">
                <h3>その他情報</h3>
                <div class="info-row"><span class="info-label">備考:</span><span class="info-value">${order.remarks || 'なし'}</span></div>
            </div>

            <div class="info-section">
                <h3>商品・サービス一覧</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>工事名</th>
                            <th>商品名</th>
                            <th>数量</th>
                            <th>単価</th>
                            <th>小計</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>

            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">小計:</span>
                    <span class="total-amount">¥${subtotal.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">消費税 (10%):</span>
                    <span class="total-amount">¥${tax.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">合計金額:</span>
                    <span class="total-amount">¥${totalAmount.toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    // 発注書の編集
    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // メインページに移動して編集モードで開く
        const orderData = encodeURIComponent(JSON.stringify(order));
        window.location.href = `index.html?edit=${orderId}&data=${orderData}`;
    }

    // PDF生成
    async generatePDF(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        try {
            // 既存のPDF生成機能を使用
            if (typeof window.PurchaseOrderForm !== 'undefined') {
                const form = new window.PurchaseOrderForm();
                // フォームにデータを設定
                this.populateFormWithOrderData(order);
                // PDF生成
                await form.generateHighQualityPDFFromPreview();
            } else {
                alert('PDF生成機能が利用できません。メインページからPDFを生成してください。');
            }
        } catch (error) {
            console.error('PDF生成エラー:', error);
            alert('PDF生成に失敗しました。');
        }
    }

    // フォームに発注書データを設定
    populateFormWithOrderData(order) {
        // この関数はメインページのフォームにデータを設定するために使用
        // 実際の実装では、メインページのフォーム要素に値を設定
        console.log('発注書データをフォームに設定:', order);
    }

    // 発注書の削除
    deleteOrder(orderId) {
        if (!confirm('この発注書を削除してもよろしいですか？')) return;

        this.orders = this.orders.filter(o => o.id !== orderId);
        this.saveOrders();
        this.refreshData();
    }

    // データを更新
    refreshData() {
        this.orders = this.loadOrders();
        this.filteredOrders = [...this.orders];
        this.updateStats();
        this.renderOrders();
    }

    // データをエクスポート
    exportData() {
        // エクスポートオプションを表示
        this.showExportOptions();
    }

    // エクスポートオプションを表示
    showExportOptions() {
        const exportBtn = document.getElementById('exportBtn');
        const rect = exportBtn.getBoundingClientRect();
        
        // 既存のドロップダウンを削除
        const existingDropdown = document.querySelector('.export-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // ドロップダウンを作成
        const dropdown = document.createElement('div');
        dropdown.className = 'export-dropdown show';
        dropdown.innerHTML = `
            <button class="export-option" data-format="json">📄 JSON形式でエクスポート</button>
            <button class="export-option" data-format="csv">📊 CSV形式でエクスポート</button>
            <button class="export-option" data-format="excel">📈 Excel形式でエクスポート</button>
            <button class="export-option" data-format="pdf">📋 PDF一覧でエクスポート</button>
        `;
        
        // 位置を設定
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);
        
        // オプションクリックイベント
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('export-option')) {
                const format = e.target.dataset.format;
                this.performExport(format);
                dropdown.remove();
            }
        });
        
        // 外部クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(event) {
                if (!dropdown.contains(event.target) && event.target !== exportBtn) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }

    // 実際のエクスポート処理
    performExport(format) {
        try {
            const exportData = this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;
            const year = this.selectedMonth.getFullYear();
            const month = String(this.selectedMonth.getMonth() + 1).padStart(2, '0');
            const filterValue = document.getElementById('filterSelect').value;
            
            let baseFileName = `発注書データ_${year}年${month}月`;
            if (filterValue === 'all') {
                baseFileName = `発注書データ_全期間`;
            } else if (filterValue === 'thisMonth') {
                baseFileName = `発注書データ_今月`;
            } else if (filterValue === 'lastMonth') {
                baseFileName = `発注書データ_先月`;
            } else if (filterValue === 'thisYear') {
                baseFileName = `発注書データ_${year}年`;
            }
            
            switch (format) {
                case 'json':
                    this.exportJSON(exportData, baseFileName);
                    break;
                case 'csv':
                    this.exportCSV(exportData, baseFileName);
                    break;
                case 'excel':
                    this.exportExcel(exportData, baseFileName);
                    break;
                case 'pdf':
                    this.exportPDF(exportData, baseFileName);
                    break;
            }
        } catch (error) {
            console.error('エクスポートエラー:', error);
            alert('データのエクスポートに失敗しました。');
        }
    }

    // JSON形式でエクスポート
    exportJSON(data, fileName) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        this.downloadFile(dataBlob, `${fileName}.json`);
    }

    // CSV形式でエクスポート
    exportCSV(data, fileName) {
        if (data.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }
        
        const headers = [
            '発注書ID', '発注日', '発注先会社名', '発注先住所', '担当者名', 
            '会社名', '担当', '商品数', '小計', '消費税', '合計金額', '備考'
        ];
        
        const csvContent = [
            headers.join(','),
            ...data.map(order => [
                order.id || '',
                order.orderDate || '',
                `"${(order.supplierName || '').replace(/"/g, '""')}"`,
                `"${(order.supplierAddress || '').replace(/"/g, '""')}"`,
                `"${(order.contactPerson || '').replace(/"/g, '""')}"`,
                `"${(order.companyName || '').replace(/"/g, '""')}"`,
                `"${(order.staffMember || '').replace(/"/g, '""')}"`,
                order.items ? order.items.length : 0,
                order.subtotal || 0,
                order.tax || 0,
                order.total || 0,
                `"${(order.remarks || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(dataBlob, `${fileName}.csv`);
    }

    // Excel形式でエクスポート（簡易版）
    exportExcel(data, fileName) {
        // HTMLテーブルとして出力（Excelで開ける）
        const table = this.createExportTable(data);
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${fileName}</title>
            </head>
            <body>
                ${table}
            </body>
            </html>
        `;
        
        const dataBlob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        this.downloadFile(dataBlob, `${fileName}.xls`);
    }

    // PDF一覧でエクスポート
    async exportPDF(data, fileName) {
        if (data.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }
        
        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDFライブラリが読み込まれていません');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 日本語フォントの設定（簡易版）
            pdf.setFont('helvetica', 'normal');
            
            let y = 20;
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            
            // タイトル
            pdf.setFontSize(16);
            pdf.text(fileName, margin, y);
            y += 20;
            
            // 各発注書の情報を追加
            data.forEach((order, index) => {
                if (y > pageHeight - 40) {
                    pdf.addPage();
                    y = 20;
                }
                
                pdf.setFontSize(12);
                pdf.text(`発注書ID: ${order.id}`, margin, y);
                y += 8;
                pdf.text(`発注日: ${order.orderDate}`, margin, y);
                y += 8;
                pdf.text(`発注先: ${order.supplierName || ''}`, margin, y);
                y += 8;
                pdf.text(`合計金額: ¥${(order.total || 0).toLocaleString()}`, margin, y);
                y += 15;
                
                if (index < data.length - 1) {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(margin, y, pdf.internal.pageSize.getWidth() - margin, y);
                    y += 10;
                }
            });
            
            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error('PDFエクスポートエラー:', error);
            alert('PDFエクスポートに失敗しました。');
        }
    }

    // エクスポート用テーブルを作成
    createExportTable(data) {
        const headers = [
            '発注書ID', '発注日', '発注先会社名', '発注先住所', '担当者名', 
            '会社名', '担当', '商品数', '小計', '消費税', '合計金額', '備考'
        ];
        
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        // ヘッダー行
        tableHTML += '<tr style="background-color: #f0f0f0;">';
        headers.forEach(header => {
            tableHTML += `<th style="padding: 8px; text-align: left;">${header}</th>`;
        });
        tableHTML += '</tr>';
        
        // データ行
        data.forEach(order => {
            tableHTML += '<tr>';
            tableHTML += `<td>${order.id || ''}</td>`;
            tableHTML += `<td>${order.orderDate || ''}</td>`;
            tableHTML += `<td>${order.supplierName || ''}</td>`;
            tableHTML += `<td>${order.supplierAddress || ''}</td>`;
            tableHTML += `<td>${order.contactPerson || ''}</td>`;
            tableHTML += `<td>${order.companyName || ''}</td>`;
            tableHTML += `<td>${order.staffMember || ''}</td>`;
            tableHTML += `<td>${order.items ? order.items.length : 0}</td>`;
            tableHTML += `<td>¥${(order.subtotal || 0).toLocaleString()}</td>`;
            tableHTML += `<td>¥${(order.tax || 0).toLocaleString()}</td>`;
            tableHTML += `<td>¥${(order.total || 0).toLocaleString()}</td>`;
            tableHTML += `<td>${order.remarks || ''}</td>`;
            tableHTML += '</tr>';
        });
        
        tableHTML += '</table>';
        return tableHTML;
    }

    // ファイルダウンロードの共通処理
    downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    }

    // 商品配列から合計金額を計算
    calculateTotal(items) {
        if (!items || !Array.isArray(items)) {
            return 0;
        }
        
        return items.reduce((total, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            return total + (quantity * unitPrice);
        }, 0);
    }

    // 全発注書を削除
    clearAllOrders() {
        if (!confirm('すべての発注書を削除してもよろしいですか？この操作は元に戻せません。')) return;

        this.orders = [];
        this.saveOrders();
        this.refreshData();
        alert('すべての発注書が削除されました。');
    }
}

// ページ読み込み時に管理システムを初期化
document.addEventListener('DOMContentLoaded', () => {
    new OrderManagementSystem();
});
