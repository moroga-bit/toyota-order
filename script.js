// 発注書作成システムのメインスクリプト

class OrderFormManager {
    constructor() {
        this.initializeEventListeners();
        this.setDefaultDate();
        this.setupExistingItemRows();
        this.calculateTotals();
        this.checkForEditMode();
    }

    initializeEventListeners() {
        console.log('イベントリスナー初期化開始');
        
        // 商品追加ボタン
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                console.log('商品追加ボタンがクリックされました');
                this.addItemRow();
            });
            console.log('商品追加ボタンのイベントリスナーを設定しました');
        } else {
            console.warn('addItemBtn が見つかりません - 後で再試行します');
            // 少し遅延して再試行
            setTimeout(() => {
                const retryAddItemBtn = document.getElementById('addItemBtn');
                if (retryAddItemBtn) {
                    retryAddItemBtn.addEventListener('click', () => {
                        console.log('商品追加ボタンがクリックされました（再試行後）');
                        this.addItemRow();
                    });
                    console.log('商品追加ボタンのイベントリスナーを再設定しました');
                }
            }, 100);
        }

        // 工事種別ボタン
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('work-type-btn')) {
                this.handleWorkTypeClick(e.target);
            }
        });

        // 商品削除ボタン（動的に追加される）
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item-btn')) {
                this.removeItemRow(e.target);
            }
        });

        // 数量・単価変更時の計算
        document.addEventListener('input', (e) => {
            if (e.target.name === 'itemQuantity[]' || e.target.name === 'itemPrice[]') {
                this.calculateItemSubtotal(e.target);
                this.calculateTotals();
            }
        });

        // プレビューボタン
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                console.log('プレビューボタンがクリックされました');
                this.showPreview();
            });
        } else {
            console.error('previewBtn が見つかりません');
        }

        // プレビュー閉じるボタン
        const closePreviewBtn = document.getElementById('closePreviewBtn');
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => {
                console.log('プレビュー閉じるボタンがクリックされました');
                this.hidePreview();
            });
        } else {
            console.error('closePreviewBtn が見つかりません');
        }

        // プレビュー内のPDF生成ボタン（高品質版）
        const generatePdfFromPreviewBtn = document.getElementById('generatePdfFromPreviewBtn');
        console.log('PDF生成ボタン要素:', generatePdfFromPreviewBtn);
        if (generatePdfFromPreviewBtn) {
            generatePdfFromPreviewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('プレビュー内PDF生成ボタンがクリックされました');
                this.generateHighQualityPDFFromPreview();
            });
            console.log('PDF生成ボタンのイベントリスナーを設定しました');
        } else {
            console.error('generatePdfFromPreviewBtn が見つかりません');
        }

        // プレビューエリア内のボタンは動的に生成されるため、イベント委譲を使用
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'registerToManagementBtn') {
                e.preventDefault();
                console.log('発注書管理登録ボタンがクリックされました');
                this.registerToManagement();
        }
        });



        // リセットボタン
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('リセットボタンがクリックされました');
                this.resetForm();
            });
        } else {
            console.error('resetBtn が見つかりません');
        }

        // 保存して管理に登録ボタン
        const saveAndRegisterBtn = document.getElementById('saveAndRegisterBtn');
        if (saveAndRegisterBtn) {
            saveAndRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault(); // フォームのデフォルト動作を防ぐ
                console.log('保存して管理に登録ボタンがクリックされました');
                this.registerToManagement();
            });
            console.log('保存して管理に登録ボタンのイベントリスナーを設定しました');
        } else {
            console.warn('saveAndRegisterBtn が見つかりません');
        }
        
        // フォームのリセットイベントを防ぐ
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('reset', (e) => {
                console.log('フォームリセットイベントが発生しました');
                // リセットイベントを防ぐ（確認ダイアログを表示しない）
                e.preventDefault();
            });
        }
        
        console.log('イベントリスナー初期化完了');
    }

    // 日本語フォントをjsPDFに埋め込む（複数のCDNから試行）
    async embedJapaneseFont(pdf) {
        // まずローカル同梱フォントを試行（オフラインでも安定）
        const fontUrls = [
            './fonts/NotoSansJP-Regular.ttf',
            './NotoSansJP-Regular.ttf',
            'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansJP/NotoSansJP-Regular.ttf',
            'https://fonts.gstatic.com/s/notosansjp/v52/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.ttf'
        ];
        
        for (const fontUrl of fontUrls) {
            try {
                console.log('フォント読み込み開始:', fontUrl);
                const res = await fetch(fontUrl, { cache: 'no-store', mode: 'cors' }).catch(() => null);
                if (!res || !res.ok) throw new Error(`HTTP ${res ? res.status : 'ERR'} ${res ? res.statusText : ''}`);
                const buf = await res.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buf);
                const chunkSize = 0x8000;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    const chunk = bytes.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, chunk);
                }
                const base64 = btoa(binary);
                pdf.addFileToVFS('NotoSansJP-Regular.ttf', base64);
                pdf.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
                pdf.setFont('NotoSansJP', 'normal');
                console.log('フォント読み込み成功:', fontUrl);
                return true;
            } catch (err) {
                console.warn(`フォント読み込み失敗: ${fontUrl}`, err);
            }
        }
        console.warn('すべてのフォント読み込み失敗');
        pdf.setFont('helvetica', 'normal');
        return false;
    }

    // 現在のフォームDOMから商品行を順序通りに取得
    getItemsFromDOM() {
        const rows = Array.from(document.querySelectorAll('#itemsContainer .item-row'));
        return rows.map(row => {
            const get = (selector) => {
                const el = row.querySelector(selector);
                return el ? el.value : '';
            };
            const quantity = parseFloat(get('input[name="itemQuantity[]"]') || '0') || 0;
            const price = parseFloat(get('input[name="itemPrice[]"]') || '0') || 0;
            return {
                projectName: get('input[name="itemProjectName[]"]'),
                name: get('input[name="itemName[]"]'),
                unit: get('input[name="itemUnit[]"]'),
                quantity,
                price,
                subtotal: quantity * price
            };
        });
    }

    // ベクター（テキスト）でPDFを生成（A4/自動改ページ）
    async generateVectorPDF(openInNewTab = false) {
        try {
            // ライブラリ確認
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDFライブラリが読み込まれていません');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // 日本語フォント埋め込み（失敗時は英語フォントで継続）
            try {
                await this.embedJapaneseFont(pdf);
            } catch (fontError) {
                console.warn('日本語フォント読み込み失敗、英語フォントで継続:', fontError);
                pdf.setFont('helvetica', 'normal');
            }

            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            const margin = 15; // mm
            let y = margin;

            const formData = this.getFormData();
            const items = this.getItemsFromDOM(); // DOM順で取得（プレビューと一致）

            // シンプルヘッダー（プレビューに合わせる）
            pdf.setTextColor(17, 24, 39);
            pdf.setFontSize(20);
            const headerTitle = `発注書${formData.projectTitle ? ' - ' + formData.projectTitle : ''}`;
            pdf.text(headerTitle, margin, y + 6);
            // 発注書番号（右上）
            const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
            pdf.setFontSize(10);
            pdf.setTextColor(107, 114, 128);
            pdf.text(`発注書番号: ${orderNumber}`, pageWidth - margin, y + 6, { align: 'right' });
            y += 16;
            pdf.setDrawColor(229, 231, 235);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 8;

            // （ヘッダーで出力済み）
            y += 0;

            // 会社情報セクション（現代的デザイン）
            const colLeft = margin;
            const colRight = pageWidth / 2 + 5;
            
            // 発注元セクション
            pdf.setFillColor(248, 250, 252); // 薄いグレー背景
            pdf.rect(colLeft - 5, y - 5, pageWidth / 2 - 10, 45, 'F');
            pdf.setLineWidth(1);
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(colLeft - 5, y - 5, pageWidth / 2 - 10, 45);
            
            pdf.setFontSize(12);
            pdf.setTextColor(99, 102, 241); // モダンブルー
            pdf.text('発注元', colLeft, y);
            y += 8;
            
            pdf.setFontSize(10);
            pdf.setTextColor(55, 65, 81); // ダークグレー
            const leftLines = [
                `${formData.companyName}`,
                `${formData.companyAddress}`,
                `TEL: ${formData.companyPhone}`,
                `Email: ${formData.companyEmail}`
            ];
            leftLines.forEach((t, i) => {
                pdf.text(t, colLeft, y + i * 4);
            });
            
            // 発注先セクション
            pdf.setFillColor(248, 250, 252); // 薄いグレー背景
            pdf.rect(colRight - 5, y - 8, pageWidth / 2 - 10, 45, 'F');
            pdf.setLineWidth(1);
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(colRight - 5, y - 8, pageWidth / 2 - 10, 45);
            
            pdf.setFontSize(12);
            pdf.setTextColor(99, 102, 241); // モダンブルー
            pdf.text('発注先', colRight, y - 8);
            
            pdf.setFontSize(10);
            pdf.setTextColor(55, 65, 81); // ダークグレー
            const rightLines = [
                `${formData.supplierName || ''}`,
                formData.contactPerson ? `担当者: ${formData.contactPerson}` : ''
            ].filter(Boolean);
            
            rightLines.forEach((t, i) => {
                pdf.text(t, colRight, y + i * 4);
            });
            
            y += 15;

            // 発注詳細（現代的デザイン）
            pdf.setFillColor(99, 102, 241); // モダンブルー背景
            pdf.rect(margin, y - 5, pageWidth - margin * 2, 20, 'F');
            
            pdf.setFontSize(11);
            pdf.setTextColor(255, 255, 255); // 白
            const detailLines = [
                `発注日: ${formData.orderDate}`,
                formData.completionMonth ? `工事完了月: ${formData.completionMonth}` : null,
                `支払条件: ${formData.paymentTerms}`
            ].filter(Boolean);
            
            detailLines.forEach((t, i) => {
                pdf.text(t, margin + 5, y + 5 + i * 4);
            });
            y += 25;

            // テーブル設定（プレビューと同じ比率 + 装飾）
            const innerWidth = pageWidth - margin * 2;
            pdf.setFontSize(11);
            const cols = [
                { title: '工事件名', ratio: 0.35 },
                { title: '商品名',     ratio: 0.30 },
                { title: '数量',       ratio: 0.15 },
                { title: '単価',       ratio: 0.10 },
                { title: '小計',       ratio: 0.10 }
            ].map(c => ({ title: c.title, width: Math.floor(innerWidth * c.ratio) }));

            const drawTableHeader = () => {
                // テーブルヘッダーの背景色（現代的グラデーション風）
                pdf.setFillColor(99, 102, 241); // モダンブルー
                pdf.rect(margin, y - 3, innerWidth, 10, 'F');
                
                // テーブルヘッダーの枠線
                pdf.setLineWidth(0.5);
                pdf.setDrawColor(99, 102, 241);
                pdf.rect(margin, y - 3, innerWidth, 10);
                
                let x = margin;
                pdf.setFontSize(10);
                pdf.setTextColor(255, 255, 255); // 白
                cols.forEach(c => {
                    pdf.text(c.title, x + 3, y + 3);
                    x += c.width;
                });
                y += 10;
            };

            drawTableHeader();

            let subtotal = 0;
            for (let i = 0; i < items.length; i++) {
                const { projectName, name, quantity, unit, price, subtotal: rowSubtotal } = items[i];
                subtotal += rowSubtotal;

                // 各セル用テキストと揃え（プレビューと同じスタイル）
                const cells = [
                    { text: projectName || '', align: 'left' },
                    { text: name, align: 'left' },
                    { text: `${quantity} ${unit}`, align: 'left' },
                    { text: `¥${price.toLocaleString()}`, align: 'right' },
                    { text: `¥${rowSubtotal.toLocaleString()}`, align: 'right' }
                ];

                // 折返し計算と行高算出
                const wraps = cells.map((c, idx) => pdf.splitTextToSize(c.text, cols[idx].width - 4));
                const rowHeight = Math.max(5, ...wraps.map(w => w.length * 4)) + 2;

                // 改ページ（次行分のスペースを確保）
                if (y + rowHeight > pageHeight - margin - 30) {
                    pdf.addPage();
                    y = margin;
                    drawTableHeader();
                }

                // 行の描画（現代的デザイン）
                let cx = margin;
                pdf.setFontSize(10);
                
                // 行の背景色（現代的な交互色）
                if (i % 2 === 0) {
                    pdf.setFillColor(248, 250, 252); // 薄いグレー
                } else {
                    pdf.setFillColor(255, 255, 255); // 白
                }
                pdf.rect(margin, y - 2, innerWidth, rowHeight, 'F');
                
                // 行の枠線（現代的）
                pdf.setLineWidth(0.3);
                pdf.setDrawColor(226, 232, 240);
                pdf.rect(margin, y - 2, innerWidth, rowHeight);
                
                // テキスト色を設定
                pdf.setTextColor(55, 65, 81); // ダークグレー
                
                for (let idx = 0; idx < cells.length; idx++) {
                    const width = cols[idx].width;
                    const wrapped = wraps[idx];
                    if (cells[idx].align === 'right') {
                        // 右寄せは各行を右端基準で描画
                        wrapped.forEach((line, li) => {
                            pdf.text(line, cx + width - 3, y + (li + 1) * 4, { align: 'right' });
                        });
                    } else {
                        pdf.text(wrapped, cx + 3, y + 4);
                    }
                    cx += width;
                }

                y += rowHeight;
            }

            y += 10;

            // 合計（現代的デザイン）
            const tax = Math.ceil(subtotal * 0.1); // 10%の消費税（小数点切り上げ）
            const total = subtotal + tax;

            // 合計セクションの背景（現代的）
            pdf.setFillColor(99, 102, 241); // モダンブルー
            pdf.rect(pageWidth - margin - 100, y - 5, 100, 25, 'F');
            
            // 合計セクションの枠線
            pdf.setLineWidth(1);
            pdf.setDrawColor(99, 102, 241);
            pdf.rect(pageWidth - margin - 100, y - 5, 100, 25);

            pdf.setFontSize(11);
            pdf.setTextColor(255, 255, 255); // 白
            pdf.text(`小計: ¥${subtotal.toLocaleString()}`, pageWidth - margin - 5, y + 2, { align: 'right' });
            y += 6;
            pdf.text(`消費税(10%): ¥${tax.toLocaleString()}`, pageWidth - margin - 5, y + 2, { align: 'right' });
            y += 6;
            pdf.setFontSize(13);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`合計金額: ¥${total.toLocaleString()}`, pageWidth - margin - 5, y + 2, { align: 'right' });

            // 備考（現代的デザイン）
            if (formData.remarks) {
                y += 20;
                
                // 備考セクションの背景
                pdf.setFillColor(248, 250, 252); // 薄いグレー背景
                pdf.rect(margin, y - 5, pageWidth - margin * 2, 20, 'F');
                pdf.setLineWidth(1);
                pdf.setDrawColor(226, 232, 240);
                pdf.rect(margin, y - 5, pageWidth - margin * 2, 20);
                
                pdf.setFontSize(11);
                pdf.setTextColor(99, 102, 241); // モダンブルー
                pdf.text('備考:', margin + 5, y + 3);
                
                y += 8;
                pdf.setTextColor(55, 65, 81); // ダークグレー
                const remarksWrapped = pdf.splitTextToSize(formData.remarks, pageWidth - margin * 2 - 10);
                pdf.text(remarksWrapped, margin + 5, y);
            }

            // フッター（ハンコ表示）
            y = pageHeight - 40;
            pdf.setFontSize(10);
            pdf.setTextColor(102, 102, 102); // グレー
            pdf.text('この度はお取引いただき、誠にありがとうございます。', pageWidth - 20, y, { align: 'right' });
            
            // 担当者に応じたハンコ表示
            const staffMember = formData.staffMember ? formData.staffMember.trim() : '';
            if (staffMember === '諸鹿大介') {
                y += 15;
                // ハンコの円形背景（赤）
                pdf.setFillColor(220, 38, 38); // 赤色
                pdf.circle(pageWidth - 20, y, 8, 'F');
                
                // ハンコの文字（白）
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(8);
                pdf.text('諸鹿', pageWidth - 20, y - 2, { align: 'center' });
                pdf.text('大介', pageWidth - 20, y + 2, { align: 'center' });
            } else if (staffMember === '奥山竜矢') {
                y += 15;
                // ハンコの円形背景（赤）
                pdf.setFillColor(220, 38, 38); // 赤色
                pdf.circle(pageWidth - 20, y, 8, 'F');
                
                // ハンコの文字（白）
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(8);
                pdf.text('奥山', pageWidth - 20, y - 2, { align: 'center' });
                pdf.text('竜矢', pageWidth - 20, y + 2, { align: 'center' });
            }

            // 保存 or 新規タブで開く
            const fileName = `発注書_ベクター_${new Date().toISOString().split('T')[0]}.pdf`;
            if (openInNewTab) {
                const blobUrl = pdf.output('bloburl');
                const w = window.open(blobUrl, '_blank');
                if (w && typeof w.focus === 'function') w.focus();
            } else {
                pdf.save(fileName);
            }
        } catch (e) {
            console.error(e);
            alert('ベクターPDF生成で問題が発生しました: ' + e.message);
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('orderDate').value = today;
    }

    handleWorkTypeClick(button) {
        // すべてのボタンからactiveクラスを削除
        document.querySelectorAll('.work-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        button.classList.add('active');
        
        // 工事種別を取得
        const workType = button.getAttribute('data-type');
        console.log('選択された工事種別:', workType);

        // プリセット適用（足場工事）
        if (workType === '足場工事') {
            this.applyScaffoldingPreset();
            return;
        }

        // プリセット適用（コーキング工事）
        if (workType === 'コーキング工事') {
            this.applyCaulkingPreset();
            return;
        }

        // プリセット適用（塗装工事）
        if (workType === '塗装工事') {
            this.applyPaintingPreset();
            return;
        }

        // デフォルト動作: 現在の商品行の工事名フィールドに設定
        const projectNameInputs = document.querySelectorAll('input[name="itemProjectName[]"]');
        projectNameInputs.forEach(input => {
            if (!input.value.trim()) {
                input.value = workType;
            }
        });
    }

    addItemRow() {
        const container = document.getElementById('itemsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'item-row';
        newRow.innerHTML = `
            <div class="form-group">
                <label>工事名</label>
                <input type="text" name="itemProjectName[]">
            </div>
            <div class="form-group">
                <label>商品名</label>
                <input type="text" name="itemName[]">
            </div>
            <div class="form-group">
                <label>数量</label>
                <input type="number" name="itemQuantity[]" min="1">
            </div>
            <div class="form-group">
                <label>単位</label>
                <input type="text" name="itemUnit[]" placeholder="単位を入力">
            </div>
            <div class="form-group">
                <label>単価（円）</label>
                <input type="number" name="itemPrice[]" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>小計（円）</label>
                <input type="number" name="itemSubtotal[]" readonly>
            </div>
            <div class="form-group">
                <button type="button" class="remove-item-btn" onclick="removeItem(this)">削除</button>
            </div>
        `;
        container.appendChild(newRow);
        
        // 新しく追加された行の計算機能を設定
        this.setupItemRowCalculation(newRow);
    }
    
    // 既存の商品行に計算機能を設定
    setupExistingItemRows() {
        const itemRows = document.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            this.setupItemRowCalculation(row);
        });
    }
    
    // 商品行の計算機能を設定
    setupItemRowCalculation(row) {
        const quantityInput = row.querySelector('input[name="itemQuantity[]"]');
        const priceInput = row.querySelector('input[name="itemPrice[]"]');
        
        if (quantityInput && priceInput) {
            quantityInput.addEventListener('input', () => {
                this.calculateItemSubtotal(quantityInput);
                this.calculateTotals();
            });
            
            priceInput.addEventListener('input', () => {
                this.calculateItemSubtotal(priceInput);
                this.calculateTotals();
            });
        }
    }

    removeItemRow(button) {
        const container = document.getElementById('itemsContainer');
        const itemRows = container.querySelectorAll('.item-row');
        
        // 最低1行は残す
        if (itemRows.length > 1) {
            const itemRow = button.closest('.item-row');
            itemRow.remove();
            this.calculateTotals();
        } else {
            alert('最低1行の商品情報が必要です。');
        }
    }

    // 足場工事プリセットを適用
    applyScaffoldingPreset() {
        const container = document.getElementById('itemsContainer');

        // 確認（既存入力がある場合）
        const hasAnyInput = Array.from(container.querySelectorAll('input'))
            .some(el => el.value && el.value.toString().trim() !== '');
        if (hasAnyInput && !confirm('現在の入力を置き換えて\n足場工事の定型明細を挿入しますか？')) {
            return;
        }

        // プリセット定義（最新仕様）
        const presetItems = [
            { projectName: '足場工事(本足場内手摺仕様)', name: '飛散防止養生共 / 昇降設備共', quantity: '', unit: '㎡', unitPrice: 760 },
            { projectName: 'アクリル板脱着',               name: '設置必要範囲脱着',           quantity: '', unit: '式', unitPrice: 0 },
            { projectName: '屋根足場K',                   name: '勾配6寸以上9寸未満',        quantity: '', unit: '㎡', unitPrice: 0 }
        ];

        // 既存行をクリア
        container.innerHTML = '';

        // 行を挿入
        presetItems.forEach(item => {
            this.addItemRow();
            const row = container.lastElementChild;
            row.querySelector('input[name="itemProjectName[]"]').value = item.projectName;
            row.querySelector('input[name="itemName[]"]').value = item.name;
            row.querySelector('input[name="itemQuantity[]"]').value = item.quantity;
            row.querySelector('input[name="itemUnit[]"]').value = item.unit;
            row.querySelector('input[name="itemPrice[]"]').value = item.unitPrice;
            // 数量未入力のため小計は0固定
            const subtotalInput = row.querySelector('input[name="itemSubtotal[]"]');
            if (subtotalInput) subtotalInput.value = 0;
        });

        // 合計更新・プレビューを上にスクロール
        this.calculateTotals();
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // コーキング工事プリセットを適用
    applyCaulkingPreset() {
        const container = document.getElementById('itemsContainer');

        // 既存入力がある場合は確認
        const hasAnyInput = Array.from(container.querySelectorAll('input'))
            .some(el => el.value && el.value.toString().trim() !== '');
        if (hasAnyInput && !confirm('現在の入力を置き換えて\nコーキング工事の定型明細を挿入しますか？')) {
            return;
        }

        const presetItems = [
            { projectName: 'シーリング工事',           name: '目地等シール撤去打ち替え',               quantity: '', unit: 'M', unitPrice: 435 },
            { projectName: 'シーリング工事',           name: '開口部廻り / 入隅 / 軒裏　打ち増し',     quantity: '', unit: 'M', unitPrice: 230 },
            { projectName: 'シーリング工事, 設備廻り', name: '設備廻り',                               quantity: '', unit: '式', unitPrice: 7250 }
        ];

        // 既存行をクリア
        container.innerHTML = '';

        // 行を挿入
        presetItems.forEach(item => {
            this.addItemRow();
            const row = container.lastElementChild;
            row.querySelector('input[name="itemProjectName[]"]').value = item.projectName;
            row.querySelector('input[name="itemName[]"]').value = item.name;
            row.querySelector('input[name="itemQuantity[]"]').value = item.quantity;
            row.querySelector('input[name="itemUnit[]"]').value = item.unit;
            row.querySelector('input[name="itemPrice[]"]').value = item.unitPrice;
            // 数量が空のため小計は0をセット
            const subtotalInput = row.querySelector('input[name="itemSubtotal[]"]');
            if (subtotalInput) subtotalInput.value = 0;
        });

        this.calculateTotals();
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 塗装工事プリセットを適用（数量は未入力 → 入力が無い行は保存/プレビューに反映しない）
    applyPaintingPreset() {
        const container = document.getElementById('itemsContainer');

        const hasAnyInput = Array.from(container.querySelectorAll('input'))
            .some(el => el.value && el.value.toString().trim() !== '');
        if (hasAnyInput && !confirm('現在の入力を置き換えて\n塗装工事の定型明細を挿入しますか？')) {
            return;
        }

        const presetItems = [
            // 洗浄
            { projectName: '屋根洗浄', name: '水洗浄', unit: '㎡', unitPrice: 90 },
            { projectName: '外壁洗浄', name: '水洗浄', unit: '㎡', unitPrice: 90 },

            // 外壁・屋根（下塗り＋上塗り）
            { projectName: '外壁塗装(サイディング下地)', name: '下塗り＋上塗り2回', unit: '㎡', unitPrice: 820 },
            { projectName: '外壁塗装(モルタル下地)',     name: '下塗り＋上塗り2回　微弾性フィラー　ローラー塗装', unit: '㎡', unitPrice: 820 },
            { projectName: '屋根塗装(スレート屋根)',     name: '下塗り＋上塗り2回', unit: '㎡', unitPrice: 820 },
            { projectName: '屋根塗装(セメント瓦)',       name: '下塗り2回＋上塗り2回', unit: '㎡', unitPrice: 1000 },

            // 付帯
            { projectName: '軒裏',           name: '上塗り仕上げ', unit: '㎡', unitPrice: 640 },
            { projectName: '雨樋',           name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: 'シャッターボックス', name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '雨戸',           name: '上塗り仕上げ', unit: '㎡', unitPrice: 270 },
            { projectName: '棟包・隅棟包',     name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '壁際水切',       name: '上塗り仕上げ(コーナー鉄部共)', unit: 'M', unitPrice: 270 },
            { projectName: '破風・鼻隠し',     name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '胴差',           name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: 'モール',         name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '腰壁',           name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '土台水切',       name: '上塗り仕上げ', unit: 'M',  unitPrice: 270 },
            { projectName: '玄関庇',         name: '上塗り仕上げ', unit: 'ヶ所', unitPrice: 3030 },
            { projectName: '勝手口庇',       name: '上塗り仕上げ', unit: 'ヶ所', unitPrice: 1850 },
            { projectName: '雑塗装',         name: '上塗り仕上げ', unit: '式', unitPrice: 5000 }
        ];

        container.innerHTML = '';
        presetItems.forEach(item => {
            this.addItemRow();
            const row = container.lastElementChild;
            row.querySelector('input[name="itemProjectName[]"]').value = item.projectName;
            row.querySelector('input[name="itemName[]"]').value = item.name;
            row.querySelector('input[name="itemQuantity[]"]').value = '';
            row.querySelector('input[name="itemUnit[]"]').value = item.unit;
            row.querySelector('input[name="itemPrice[]"]').value = item.unitPrice;
            const subtotalInput = row.querySelector('input[name="itemSubtotal[]"]');
            if (subtotalInput) subtotalInput.value = 0;
        });

        this.calculateTotals();
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    calculateItemSubtotal(input) {
        const row = input.closest('.item-row');
        const quantity = parseFloat(row.querySelector('input[name="itemQuantity[]"]').value) || 0;
        const price = parseFloat(row.querySelector('input[name="itemPrice[]"]').value) || 0;
        const subtotal = quantity * price;
        
        console.log('小計計算:', { quantity, price, subtotal });
        row.querySelector('input[name="itemSubtotal[]"]').value = Math.floor(subtotal);
    }

    calculateTotals() {
        const subtotalInputs = document.querySelectorAll('input[name="itemSubtotal[]"]');
        let subtotal = 0;
        
        subtotalInputs.forEach(input => {
            subtotal += parseFloat(input.value) || 0;
        });
        
        const tax = Math.ceil(subtotal * 0.1); // 10%の消費税（小数点切り上げ）
        const total = subtotal + tax;
        
        console.log('合計計算:', { subtotal, tax, total });
        
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');
        
        if (subtotalElement) subtotalElement.textContent = `¥${subtotal.toLocaleString()}`;
        if (taxElement) taxElement.textContent = `¥${tax.toLocaleString()}`;
        if (totalElement) totalElement.textContent = `¥${total.toLocaleString()}`;
        
        // 商品合計を表示
        this.updateItemsTotal(subtotal);
    }
    
    // 商品合計を更新
    updateItemsTotal(total) {
        const itemsTotalElement = document.getElementById('itemsTotal');
        if (itemsTotalElement) {
            itemsTotalElement.textContent = `¥${total.toLocaleString()}`;
        }
    }

    showPreview() {
        const formData = this.getFormData();
        
        // 発注書データを保存
        const orderId = this.saveOrderToStorage(formData);
        if (orderId) {
            console.log('発注書データを保存しました。ID:', orderId);
        }
        
        const previewContent = this.generatePreviewHTML(formData);
        
        const previewContentEl = document.getElementById('previewContent');
        previewContentEl.innerHTML = previewContent;
        
        // アクションボタン（PDF/登録）を下部に常設
        const actionsBar = document.querySelector('.preview-actions');
        if (actionsBar) {
            actionsBar.innerHTML = `
                <button id="generatePdfFromPreviewBtn" class="btn btn-primary">📄 PDF生成</button>
                <button id="registerToManagementBtn" class="btn btn-success">📋 管理に登録</button>
            `;
        }
        
        document.getElementById('previewArea').style.display = 'block';
        
        // プレビューエリアにスクロール
        document.getElementById('previewArea').scrollIntoView({ behavior: 'smooth' });
        
        // PDF生成ボタンのイベントリスナーを再設定
        this.setupPreviewButtons();
    }
    
    setupPreviewButtons() {
        const generatePdfFromPreviewBtn = document.getElementById('generatePdfFromPreviewBtn');
        console.log('プレビュー表示後のPDF生成ボタン要素:', generatePdfFromPreviewBtn);
        if (generatePdfFromPreviewBtn) {
            // 既存のイベントリスナーを削除
            generatePdfFromPreviewBtn.replaceWith(generatePdfFromPreviewBtn.cloneNode(true));
            const newBtn = document.getElementById('generatePdfFromPreviewBtn');
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('プレビュー内PDF生成ボタンがクリックされました');
                this.generateHighQualityPDFFromPreview();
            });
            console.log('プレビュー表示後のPDF生成ボタンのイベントリスナーを設定しました');
        } else {
            console.error('プレビュー表示後のgeneratePdfFromPreviewBtn が見つかりません');
        }
    }

    hidePreview() {
        document.getElementById('previewArea').style.display = 'none';
    }

    getFormData() {
        const form = document.getElementById('orderForm');
        console.log('=== フォームデータ取得デバッグ ===');
        console.log('フォーム要素:', form);
        
        if (!form) {
            console.error('フォーム要素が見つかりません');
            return {};
        }
        
        const formData = new FormData(form);
        const data = {};
        
        console.log('FormData作成完了');
        
        // 基本情報
        for (let [key, value] of formData.entries()) {
            console.log(`フォームデータ: ${key} = ${value}`);
            if (key.endsWith('[]')) {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
            if (key === 'staffMember') {
                console.log('担当者データ取得:', JSON.stringify(value));
                console.log('担当者データの型:', typeof value);
                console.log('担当者データの長さ:', value ? value.length : 'undefined');
            }
        }
        
        console.log('取得されたデータ:', data);
        
        // バリデーションは任意入力に変更（強制しない）
        // const validationResult = this.validateFormData(data);
        // if (!validationResult.isValid) {
        //     this.showValidationErrors(validationResult.errors);
        //     return null;
        // }
        
        // 商品情報の空行/未入力行を除外（数量・単価いずれかが未入力の場合は小計0のまま保存せず）
        if (data['itemName[]']) {
            const validItems = [];
            const validProjectNames = [];
            const validQuantities = [];
            const validUnits = [];
            const validPrices = [];
            
            for (let i = 0; i < data['itemName[]'].length; i++) {
                const name = data['itemName[]'][i];
                const projectName = data['itemProjectName[]'] ? data['itemProjectName[]'][i] : '';
                const quantity = data['itemQuantity[]'][i];
                const unit = data['itemUnit[]'] ? data['itemUnit[]'][i] : '';
                const price = data['itemPrice[]'][i];
                
                // 名称か工事名があり、かつ数量と単価が双方入力されている行のみ採用
                if ((name && name.trim()) || (projectName && projectName.trim())) {
                    const q = parseFloat(quantity);
                    const p = parseFloat(price);
                    if (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) {
                    validItems.push(name);
                    validProjectNames.push(projectName);
                    validQuantities.push(quantity);
                    validUnits.push(unit);
                    validPrices.push(price);
                    }
                }
            }
            
            data['itemName[]'] = validItems;
            data['itemProjectName[]'] = validProjectNames;
            data['itemQuantity[]'] = validQuantities;
            data['itemUnit[]'] = validUnits;
            data['itemPrice[]'] = validPrices;
        }
        
        return data;
    }

    // フォームデータのバリデーション
    validateFormData(data) {
        const errors = [];
        
        // 必須フィールドのチェック
        const requiredFields = {
            'companyName': '会社名',
            'companyCode': 'Invoice',
            'companyAddress': '住所',
            'companyPhone': 'TEL/FAX',
            'companyEmail': 'Email',
            'orderDate': '発注日',
            'staffMember': '担当',
            'supplierName': '発注先会社名',
            'supplierAddress': '発注先住所',
            'paymentTerms': '支払条件'
        };
        
        for (const [field, label] of Object.entries(requiredFields)) {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`${label}は必須項目です。`);
            }
        }
        
        // メールアドレスの形式チェック
        if (data.companyEmail && !this.isValidEmail(data.companyEmail)) {
            errors.push('会社のメールアドレスの形式が正しくありません。');
        }
        
        if (data.supplierEmail && !this.isValidEmail(data.supplierEmail)) {
            errors.push('発注先のメールアドレスの形式が正しくありません。');
        }
        
        // 商品情報のチェック
        if (data['itemName[]'] && data['itemName[]'].length > 0) {
            let hasValidItem = false;
            for (let i = 0; i < data['itemName[]'].length; i++) {
                const name = data['itemName[]'][i];
                const quantity = parseFloat(data['itemQuantity[]'][i]) || 0;
                const price = parseFloat(data['itemPrice[]'][i]) || 0;
                
                if (name.trim()) {
                    hasValidItem = true;
                    
                    if (quantity <= 0) {
                        errors.push(`商品「${name}」の数量は0より大きい値を入力してください。`);
                    }
                    
                    if (price < 0) {
                        errors.push(`商品「${name}」の単価は0以上の値を入力してください。`);
                    }
                }
            }
            
            if (!hasValidItem) {
                errors.push('最低1つの商品を入力してください。');
            }
        } else {
            errors.push('商品情報を入力してください。');
        }
        
        // 発注日の妥当性チェック
        if (data.orderDate) {
            const orderDate = new Date(data.orderDate);
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            
            if (orderDate > today) {
                errors.push('発注日は今日以前の日付を入力してください。');
            }
            
            if (orderDate < oneYearAgo) {
                errors.push('発注日は1年以内の日付を入力してください。');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // メールアドレスの妥当性チェック
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // バリデーションエラーの表示
    showValidationErrors(errors) {
        // 既存のエラーメッセージを削除
        const existingErrors = document.querySelectorAll('.validation-error');
        existingErrors.forEach(error => error.remove());
        
        // エラーメッセージを表示
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-error';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            max-width: 500px;
            text-align: center;
        `;
        
        errorContainer.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 1.2rem;">⚠️ 入力エラー</h3>
            <ul style="margin: 0; padding-left: 20px; text-align: left;">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 15px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
            ">閉じる</button>
        `;
        
        document.body.appendChild(errorContainer);
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
    }

    generatePreviewHTML(data) {
        const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        
        let itemsHTML = '';
        let subtotal = 0;
        
        if (data['itemName[]']) {
            for (let i = 0; i < data['itemName[]'].length; i++) {
                const name = data['itemName[]'][i];
                const projectName = data['itemProjectName[]'] ? data['itemProjectName[]'][i] : '';
                
                // 空行をスキップ
                if (!name.trim() && !projectName.trim()) {
                    continue;
                }
                
                const quantity = parseFloat(data['itemQuantity[]'][i]) || 0;
                const unit = data['itemUnit[]'] ? data['itemUnit[]'][i] : '';
                const price = parseFloat(data['itemPrice[]'][i]) || 0;
                const itemSubtotal = quantity * price;
                subtotal += itemSubtotal;
                
                itemsHTML += `
                    <tr>
                        <td>${projectName}</td>
                        <td>${name}</td>
                        <td>${quantity} ${unit}</td>
                        <td>¥${price.toLocaleString()}</td>
                        <td>¥${itemSubtotal.toLocaleString()}</td>
                    </tr>
                `;
            }
        }
        
        const tax = Math.ceil(subtotal * 0.1); // 10%の消費税（小数点切り上げ）
        const total = subtotal + tax;
        
        return `
            <div class="order-preview">
                <div class="order-header">
                    <div class="order-logo">
                        <img src="logo.png" alt="株式会社諸鹿彩色" class="preview-logo" onload="this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="logo-fallback">
                            <div class="logo-text">MOROGA</div>
                            <div class="logo-subtitle">株式会社諸鹿彩色</div>
                        </div>
                    </div>
                    <div class="order-title-section">
                        <div class="order-title">発注書${data.projectTitle ? ` - ${data.projectTitle}` : ''}</div>
                        <div class="order-number">発注書番号: ${orderNumber}</div>
                    </div>
                </div>
                
                <div class="company-info">
                    <div class="company-section">
                        <h3>発注元</h3>
                        <p><strong>${data.companyName}</p>
                        <p>Invoice: ${data.companyCode}</p>
                        <p>${data.companyAddress}</p>
                        <p>${data.companyPhone}</p>
                        <p>Email: ${data.companyEmail}</p>
                            ${data.staffMember ? `<p><strong>担当:</strong> ${data.staffMember}</p>` : ''}
                    </div>
                    <div class="company-section">
                        <h3>発注先</h3>
                        <p><strong>${data.supplierName || ''}</strong></p>
                        ${data.contactPerson ? `<p>担当者: ${data.contactPerson}</p>` : ''}
                    </div>
                </div>
                
                <div class="order-details">
                    <p><strong>発注日:</strong> ${data.orderDate}</p>
                    ${data.completionMonth ? `<p><strong>工事完了月:</strong> ${data.completionMonth}</p>` : ''}
                    <p><strong>支払条件:</strong> ${data.paymentTerms}</p>
                </div>
                
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
                
                <div class="total-section-preview">
                    <div class="total-row-preview">
                        <span>小計:</span>
                        <span>¥${subtotal.toLocaleString()}</span>
                    </div>
                    <div class="total-row-preview">
                        <span>消費税 (10%):</span>
                        <span>¥${tax.toLocaleString()}</span>
                    </div>
                    <div class="total-row-preview total-final-preview">
                        <span>合計金額:</span>
                        <span>¥${total.toLocaleString()}</span>
                    </div>
                </div>
                
                ${data.remarks ? `
                    <div class="remarks-section">
                        <h3>備考</h3>
                        <p>${data.remarks}</p>
                    </div>
                ` : ''}
                
                <div class="order-footer">
                    <div class="footer-logo">
                        <img src="logo.png" alt="株式会社諸鹿彩色" class="footer-logo-img" onload="this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="logo-fallback">
                            <div class="logo-text">MOROGA</div>
                            <div class="logo-subtitle">株式会社諸鹿彩色</div>
                        </div>
                    </div>
                    <div class="footer-info">
                        <div class="footer-contact">
                            <p>〒321-0111 栃木県宇都宮市川田町1048-5</p>
                            <p>TEL: 028-688-8618  FAX: 028-688-0668 | Email: info@moroga.info</p>
                        </div>
                        <div class="footer-signature">
                            <p>この度はお取引いただき、誠にありがとうございます。</p>
                            ${(() => {
                                // 担当者データを正規化（前後の空白を除去）
                                const staffMember = data.staffMember ? data.staffMember.trim() : '';
                                
                                console.log('=== ハンコ表示デバッグ ===');
                                console.log('元の担当者データ:', JSON.stringify(data.staffMember));
                                console.log('正規化後の担当者データ:', JSON.stringify(staffMember));
                                console.log('諸鹿大介との比較:', staffMember === '諸鹿大介');
                                console.log('奥山竜矢との比較:', staffMember === '奥山竜矢');
                                
                                if (staffMember === '諸鹿大介') {
                                    console.log('→ 諸鹿大介のハンコを表示');
                                    return `
                                        <div class="signature-stamp">
                                            <img src="stamp_moroga.png" alt="諸鹿大介印" class="stamp-image" onload="this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                            <div class="stamp-fallback">
                                                <div class="stamp-text">諸鹿大介</div>
                                            </div>
                                        </div>
                                    `;
                                } else if (staffMember === '奥山竜矢') {
                                    console.log('→ 奥山竜矢のハンコを表示');
                                    return `
                                        <div class="signature-stamp">
                                            <img src="stamp_okuyama.png" alt="奥山竜矢印" class="stamp-image" onload="this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                            <div class="stamp-fallback">
                                                <div class="stamp-text">奥山竜矢</div>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    console.log('→ 担当者が選択されていません:', staffMember);
                                    return '';
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generatePDF() {
        const generateBtn = document.getElementById('generatePdfBtn');
        const originalText = generateBtn.textContent;
        
        try {
            generateBtn.textContent = 'PDF生成中...';
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            
            // プレビューを表示してからPDF生成
            this.showPreview();
            await new Promise(resolve => setTimeout(resolve, 1000)); // プレビュー表示を待つ
            
            const previewElement = document.getElementById('previewContent');
            const contentElement = previewElement.querySelector('.order-preview') || previewElement;
            
            // jsPDFライブラリの確認
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDFライブラリが読み込まれていません');
            }
            
            // html2canvasライブラリの確認
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvasライブラリが読み込まれていません');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // プレビュー要素（発注書本体）のみをキャプチャ
            const canvas = await html2canvas(contentElement, {
                scale: 2, // 高解像度でキャプチャ
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: contentElement.scrollWidth,
                height: contentElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1200,
                windowHeight: 800
            });
            
            console.log('Canvas size:', canvas.width, 'x', canvas.height);
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // 余白ゼロでA4に最大化（アスペクト比維持、ページ内に収まる）
            let imgWidth = pageWidth;
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
            if (imgHeight > pageHeight) {
                imgHeight = pageHeight;
                imgWidth = (canvas.width * imgHeight) / canvas.height;
            }

            const xPosition = (pageWidth - imgWidth) / 2;
            const yPosition = (pageHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
            
            // PDF保存
            const fileName = `発注書_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            console.log('PDF生成完了:', fileName);
            
        } catch (error) {
            console.error('PDF生成エラー:', error);
            alert('PDF生成中にエラーが発生しました: ' + error.message + '\n\n詳細はコンソールを確認してください。');
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    }

    // 高品質PDF生成（最高品質設定）
    async generateHighQualityPDF() {
        const generateBtn = document.getElementById('generateHighQualityPdfBtn');
        const originalText = generateBtn.textContent;
        
        try {
            generateBtn.textContent = '高品質PDF生成中...';
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            
            // プレビューを表示してからPDF生成
            this.showPreview();
            await new Promise(resolve => setTimeout(resolve, 1500)); // より長く待つ
            
            const previewElement = document.getElementById('previewContent');
            const contentElement = previewElement.querySelector('.order-preview') || previewElement;
            
            // ライブラリの確認
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDFライブラリが読み込まれていません');
            }
            
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvasライブラリが読み込まれていません');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 最高品質設定でhtml2canvasを実行
            const canvas = await html2canvas(contentElement, {
                scale: 4, // 4倍スケールで超高解像度化
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: contentElement.scrollWidth,
                height: contentElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1600,
                windowHeight: 1200,
                logging: true,
                imageTimeout: 20000,
                removeContainer: true,
                foreignObjectRendering: true // より高品質なレンダリング
            });
            
            console.log('高品質Canvas size:', canvas.width, 'x', canvas.height);
            
            // 最高品質で画像データを取得
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            
            // 画像サイズをA4に最適化
            const margin = 8; // 最小マージン
            let imgWidth = pageWidth - margin * 2;
            let imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (imgHeight > pageHeight - margin * 2) {
                imgHeight = pageHeight - margin * 2;
                imgWidth = (canvas.width * imgHeight) / canvas.height;
            }
            
            console.log('高品質PDF image size:', imgWidth, 'x', imgHeight);
            
            // 中央配置
            const xPosition = (pageWidth - imgWidth) / 2;
            const yPosition = (pageHeight - imgHeight) / 2;

            // 複数ページ対応（高品質）
            if (imgHeight > pageHeight - margin * 2) {
                const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
                for (let i = 0; i < totalPages; i++) {
                    if (i > 0) pdf.addPage();
                    const yOffset = yPosition - (i * (pageHeight - margin * 2));
                    pdf.addImage(imgData, 'PNG', xPosition, yOffset, imgWidth, imgHeight);
                }
            } else {
                pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
            }
            
            // PDF保存
            const fileName = `発注書_最高品質_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            console.log('高品質PDF生成完了:', fileName);
            
        } catch (error) {
            console.error('高品質PDF生成エラー:', error);
            alert('高品質PDF生成中にエラーが発生しました: ' + error.message + '\n\n詳細はコンソールを確認してください。');
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    }

    // ブラウザ印刷PDF（最高品質）
    printPDF() {
        try {
            // プレビューを表示
            this.showPreview();
            
            // 少し待ってから印刷ダイアログを開く
            setTimeout(() => {
                // 印刷用のスタイルを一時的に適用
                const printStyle = document.createElement('style');
                printStyle.textContent = `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #previewArea, #previewArea * {
                            visibility: visible;
                        }
                        #previewArea {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .order-preview {
                            width: 100% !important;
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 20px !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }
                `;
                document.head.appendChild(printStyle);
                
                // 印刷ダイアログを開く
                window.print();
                
                // 印刷後、スタイルを削除
                setTimeout(() => {
                    document.head.removeChild(printStyle);
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error('印刷エラー:', error);
            alert('印刷中にエラーが発生しました: ' + error.message);
        }
    }


    // 発注書データを保存
    saveOrderToStorage(formData) {
        console.log('=== saveOrderToStorage 開始 ===');
        console.log('入力フォームデータ:', formData);
        
        try {
            const orders = this.loadOrdersFromStorage();
            console.log('既存の発注書数:', orders.length);
            
            const orderId = formData.orderId || this.generateOrderId();
            console.log('生成されたorderId:', orderId);
            
            const orderData = {
                id: orderId,
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            console.log('保存する発注書データ:', orderData);

            // 既存の注文を更新または新規追加
            const existingIndex = orders.findIndex(order => order.id === orderId);
            console.log('既存発注書のインデックス:', existingIndex);
            
            if (existingIndex >= 0) {
                orders[existingIndex] = orderData;
                console.log('既存発注書を更新');
            } else {
                orders.push(orderData);
                console.log('新規発注書を追加');
            }

            localStorage.setItem('purchaseOrders', JSON.stringify(orders));
            console.log('LocalStorageに保存完了');
            console.log('保存後の発注書数:', orders.length);
            console.log('=== saveOrderToStorage 完了 ===');
            return orderId;
        } catch (error) {
            console.error('発注書データの保存エラー:', error);
            return null;
        }
    }

    // 発注書データを読み込み
    loadOrdersFromStorage() {
        try {
            const saved = localStorage.getItem('purchaseOrders');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('発注書データの読み込みエラー:', error);
            return [];
        }
    }

    // 発注書IDを生成
    generateOrderId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PO-${year}${month}${day}-${random}`;
    }

    // 編集モードをチェック
    checkForEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        const orderData = urlParams.get('data');

        if (editId && orderData) {
            try {
                const order = JSON.parse(decodeURIComponent(orderData));
                this.populateFormWithOrderData(order);
                console.log('編集モードで発注書データを読み込みました:', order);
            } catch (error) {
                console.error('編集データの読み込みエラー:', error);
            }
        }
    }

    // フォームに発注書データを設定
    populateFormWithOrderData(order) {
        // 発注元情報
        document.getElementById('companyName').value = order.companyName || '';
        document.getElementById('companyCode').value = order.companyCode || '';
        document.getElementById('companyAddress').value = order.companyAddress || '';
        document.getElementById('companyPhone').value = order.companyPhone || '';
        document.getElementById('companyEmail').value = order.companyEmail || '';
        document.getElementById('staffMember').value = order.staffMember || '';

        // 発注先情報
        document.getElementById('supplierName').value = order.supplierName || '';
        document.getElementById('supplierAddress').value = order.supplierAddress || '';
        document.getElementById('contactPerson').value = order.contactPerson || '';

        // その他情報
        document.getElementById('orderDate').value = order.orderDate || '';
        document.getElementById('completionMonth').value = order.completionMonth || '';
        document.getElementById('paymentTerms').value = order.paymentTerms || '';
        document.getElementById('remarks').value = order.remarks || '';
        if (document.getElementById('projectTitle')) {
            document.getElementById('projectTitle').value = order.projectTitle || '';
        }

        // 商品情報
        if (order.items && order.items.length > 0) {
            // 既存の商品行をクリア
            const itemsContainer = document.getElementById('itemsContainer');
            itemsContainer.innerHTML = '';

            // 新しい商品行を追加
            order.items.forEach((item, index) => {
                this.addItemRow();
                const row = itemsContainer.children[index];
                row.querySelector('input[name="itemProjectName[]"]').value = item.projectName || '';
                row.querySelector('input[name="itemName[]"]').value = item.name || '';
                row.querySelector('input[name="itemQuantity[]"]').value = item.quantity || '';
                row.querySelector('input[name="itemUnit[]"]').value = item.unit || '';
                row.querySelector('input[name="itemPrice[]"]').value = item.unitPrice || '';
            });
        }

        this.calculateTotals();
    }

    // プレビューからPDF生成（確実版）
    async generateHighQualityPDFFromPreview() {
        console.log('PDF生成開始');
        
        try {
            // ライブラリの確認
            if (typeof window.jspdf === 'undefined') {
                console.error('jsPDFライブラリが読み込まれていません');
                alert('jsPDFライブラリが読み込まれていません。ページを再読み込みしてください。');
                return;
            }
            
            if (typeof html2canvas === 'undefined') {
                console.error('html2canvasライブラリが読み込まれていません');
                alert('html2canvasライブラリが読み込まれていません。ページを再読み込みしてください。');
                return;
            }
            
            const previewElement = document.getElementById('previewContent');
            if (!previewElement) {
                console.error('プレビュー要素が見つかりません');
                alert('プレビューが表示されていません。先にプレビューを表示してください。');
                return;
            }
            
            const contentElement = previewElement.querySelector('.order-preview');
            if (!contentElement) {
                console.error('発注書プレビュー要素が見つかりません');
                alert('発注書プレビューが見つかりません。');
                return;
            }
            
            console.log('プレビュー要素を発見:', contentElement);
            
            // ボタンの状態を更新
            const generateBtn = document.getElementById('generatePdfFromPreviewBtn');
            if (generateBtn) {
                generateBtn.textContent = 'PDF生成中...';
                generateBtn.disabled = true;
            }
            
            // html2canvasでキャプチャ
            console.log('html2canvas実行開始');
            const canvas = await html2canvas(contentElement, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                imageTimeout: 5000
            });
            
            console.log('Canvas生成完了:', canvas.width, 'x', canvas.height);
            
            // PDF作成
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            
            // 画像サイズ計算
            const margin = 15;
            let imgWidth = pageWidth - margin * 2;
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // 高さ調整
            if (imgHeight > pageHeight - margin * 2) {
                imgHeight = pageHeight - margin * 2;
                imgWidth = (canvas.width * imgHeight) / canvas.height;
            }
            
            // 中央配置
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            console.log('PDF画像サイズ:', imgWidth, 'x', imgHeight);
            console.log('PDF配置位置:', x, y);
            
            // 画像をPDFに追加
            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            
            // PDF保存
            const fileName = `発注書_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            console.log('PDF生成完了:', fileName);
            alert('PDF生成が完了しました！');
            
        } catch (error) {
            console.error('PDF生成エラー:', error);
            alert('PDF生成エラー: ' + error.message);
        } finally {
            const generateBtn = document.getElementById('generatePdfFromPreviewBtn');
            if (generateBtn) {
                generateBtn.textContent = 'PDF生成';
                generateBtn.disabled = false;
            }
        }
    }


    resetForm() {
        if (confirm('フォームをリセットしますか？入力したデータは失われます。')) {
            document.getElementById('orderForm').reset();
            this.setDefaultDate();
            
            // 商品行を1つだけ残す
            const container = document.getElementById('itemsContainer');
            container.innerHTML = `
                <div class="item-row">
                    <div class="form-group">
                        <label>工事名</label>
                        <input type="text" name="itemProjectName[]" required>
                    </div>
                    <div class="form-group">
                        <label>商品名</label>
                        <input type="text" name="itemName[]" required>
                    </div>
                    <div class="form-group">
                        <label>数量</label>
                        <input type="number" name="itemQuantity[]" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>単位</label>
                        <input type="text" name="itemUnit[]" placeholder="個、台、kg等">
                    </div>
                    <div class="form-group">
                        <label>単価（円）</label>
                        <input type="number" name="itemPrice[]" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>小計（円）</label>
                        <input type="number" name="itemSubtotal[]" readonly>
                    </div>
                    <div class="form-group">
                        <button type="button" class="remove-item-btn" onclick="removeItem(this)">削除</button>
                    </div>
                </div>
            `;
            
            this.calculateTotals();
            this.hidePreview();
        }
    }

    // 発注書管理に登録
    registerToManagement() {
        console.log('=== 発注書管理登録開始 ===');
        
        try {
            const formData = this.getFormData();
            console.log('フォームデータ取得:', formData);
            
            // 発注書データを保存
            const orderId = this.saveOrderToStorage(formData);
            console.log('保存結果 - orderId:', orderId);
            
            if (orderId) {
                console.log('発注書登録成功');
                
                // 成功メッセージを表示
                this.showSuccessMessage('発注書を管理システムに登録しました！');
                
                // プレビューを閉じる
                this.hidePreview();
                
                // 発注書管理ページに移動するか確認
                setTimeout(() => {
                    this.showManagementPageModal();
                }, 1000);
            } else {
                console.error('発注書登録失敗 - orderIdがnull');
                this.showErrorMessage('発注書の登録に失敗しました。\nもう一度お試しください。');
            }
        } catch (error) {
            console.error('発注書登録エラー:', error);
            this.showErrorMessage('発注書の登録中にエラーが発生しました。\n' + error.message);
        }
    }


    // 成功メッセージ表示
    showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                z-index: 10000;
                font-weight: 600;
                animation: slideInRight 0.3s ease;
            ">
                ✅ ${message}
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    // エラーメッセージ表示
    showErrorMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #dc3545, #c82333);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                z-index: 10000;
                font-weight: 600;
                animation: slideInRight 0.3s ease;
            ">
                ❌ ${message}
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    // 発注書データをLocalStorageに保存
    saveOrderToStorage(formData) {
        try {
            console.log('=== saveOrderToStorage ===');
            console.log('保存するフォームデータ:', formData);
            console.log('フォームデータの型:', typeof formData);
            console.log('フォームデータのキー:', Object.keys(formData));
            
            // 既存の発注書データを取得
            const existingOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
            console.log('既存の発注書数:', existingOrders.length);
            console.log('既存の発注書データ:', existingOrders);
            
            // 新しい発注書IDを生成
            const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 発注書データを構築
            const orderData = {
                id: orderId,
                orderDate: formData.orderDate || new Date().toISOString().split('T')[0],
                companyName: formData.companyName || '',
                companyAddress: formData.companyAddress || '',
                companyPhone: formData.companyPhone || '',
                companyEmail: formData.companyEmail || '',
                staffMember: formData.staffMember || '',
                supplierName: formData.supplierName || '',
                supplierAddress: formData.supplierAddress || '',
                contactPerson: formData.contactPerson || '',
            projectTitle: formData.projectTitle || '',
                items: this.buildItemsArray(formData),
                subtotal: this.calculateSubtotal(formData),
                tax: this.calculateTax(formData),
                total: this.calculateTotal(formData),
                remarks: formData.remarks || '',
                createdAt: new Date().toISOString()
            };
            
            console.log('構築された発注書データ:', orderData);
            
            // 発注書を追加
            existingOrders.push(orderData);
            
            // LocalStorageに保存
            localStorage.setItem('purchaseOrders', JSON.stringify(existingOrders));
            
            console.log('発注書保存完了 - ID:', orderId);
            console.log('保存後の発注書数:', existingOrders.length);
            
            // 保存後のデータを確認
            const savedData = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
            console.log('保存後の全データ:', savedData);
            
            return orderId;
            
        } catch (error) {
            console.error('発注書保存エラー:', error);
            return null;
        }
    }
    
    // 商品配列を構築
    buildItemsArray(formData) {
        console.log('=== buildItemsArray ===');
        console.log('フォームデータ:', formData);
        
        const items = [];
        const projectNames = formData['itemProjectName[]'] || [];
        const itemNames = formData['itemName[]'] || [];
        const quantities = formData['itemQuantity[]'] || [];
        const units = formData['itemUnit[]'] || [];
        const prices = formData['itemPrice[]'] || [];
        
        console.log('商品データ:');
        console.log('- 工事件名:', projectNames);
        console.log('- 商品名:', itemNames);
        console.log('- 数量:', quantities);
        console.log('- 単位:', units);
        console.log('- 単価:', prices);
        
        const maxLength = Math.max(
            projectNames.length,
            itemNames.length,
            quantities.length,
            units.length,
            prices.length
        );
        
        for (let i = 0; i < maxLength; i++) {
            const projectName = projectNames[i] || '';
            const itemName = itemNames[i] || '';
            const quantity = parseFloat(quantities[i]) || 0;
            const unit = units[i] || '';
            const price = parseFloat(prices[i]) || 0;
            
            // 空の行はスキップ
            if (itemName.trim() || quantity > 0 || price > 0) {
                items.push({
                    projectName: projectName,
                    name: itemName,
                    quantity: quantity,
                    unit: unit,
                    unitPrice: price,
                    subtotal: quantity * price
                });
            }
        }
        
        return items;
    }
    
    // 小計を計算
    calculateSubtotal(formData) {
        const items = this.buildItemsArray(formData);
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }
    
    // 消費税を計算
    calculateTax(formData) {
        const subtotal = this.calculateSubtotal(formData);
        return Math.ceil(subtotal * 0.1); // 10%の消費税（小数点切り上げ）
    }
    
    // 合計を計算
    calculateTotal(formData) {
        const subtotal = this.calculateSubtotal(formData);
        const tax = this.calculateTax(formData);
        return subtotal + tax;
    }

    // 管理ページモーダル表示
    showManagementPageModal() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'management-modal';
        modalDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 1.5rem;">
                        ✅ 発注書を登録しました！
                    </h3>
                    <p style="margin: 0 0 25px 0; color: #666; font-size: 1.1rem;">
                        発注書管理ページで確認しますか？
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="openManagementBtn" style="
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 25px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">📋 管理ページを開く</button>
                        <button id="closeModalBtn" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 25px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">閉じる</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        // ボタンのイベントリスナーを設定
        const openBtn = modalDiv.querySelector('#openManagementBtn');
        const closeBtn = modalDiv.querySelector('#closeModalBtn');
        
        openBtn.addEventListener('click', () => {
            window.open('management.html', '_blank');
            document.body.removeChild(modalDiv);
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalDiv);
        });
        
        // 背景クリックで閉じる
        modalDiv.addEventListener('click', (e) => {
            if (e.target === modalDiv.querySelector('div')) {
                document.body.removeChild(modalDiv);
            }
        });
    }
}

// グローバル関数（HTMLから呼び出される）
function removeItem(button) {
    const manager = window.orderFormManager;
    if (manager) {
        manager.removeItemRow(button);
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - 初期化開始');
    try {
        window.orderFormManager = new OrderFormManager();
        console.log('OrderFormManager 初期化完了');
    } catch (error) {
        console.error('OrderFormManager 初期化エラー:', error);
    }
});

// フォールバック: ページ読み込み完了後にも初期化を試行
window.addEventListener('load', () => {
    console.log('window.load - フォールバック初期化');
    if (!window.orderFormManager) {
        try {
            window.orderFormManager = new OrderFormManager();
            console.log('フォールバック初期化完了');
        } catch (error) {
            console.error('フォールバック初期化エラー:', error);
        }
    }
});

// フォームバリデーション
document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('プレビューまたはPDF生成ボタンを使用してください。');
});

// エクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderFormManager;
}
