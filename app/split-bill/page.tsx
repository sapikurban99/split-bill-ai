'use client';

import React, { useState, useMemo } from 'react';

interface Item {
    name: string;
    price: number;
    qty?: number;
}

interface BillData {
    items: Item[];
    tax: number;
    service_charge: number;
    subtotal: number;
    total: number;
}

type Step = 'home' | 'verify' | 'assign' | 'summary';

export default function SplitBillPage() {
    const [step, setStep] = useState<Step>('home');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [billData, setBillData] = useState<BillData | null>(null);
    const [participants, setParticipants] = useState<string[]>([]);
    const [newName, setNewName] = useState('');
    const [assignments, setAssignments] = useState<Record<number, string[]>>({});
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editQty, setEditQty] = useState('1');
    const [taxMode, setTaxMode] = useState<'amount' | 'percent'>('amount');
    const [scMode, setScMode] = useState<'amount' | 'percent'>('amount');
    const [taxPercent, setTaxPercent] = useState('0');
    const [scPercent, setScPercent] = useState('0');

    // Helper: extract JSON from AI markdown response (```json ... ```)
    const parseAiResponse = (rawInput: string | object) => {
        if (!rawInput) return null;

        // If already an object, return it directly
        if (typeof rawInput === 'object') {
            console.log('parseAiResponse: input is already an object, returning directly');
            return rawInput;
        }

        try {
            const rawString = rawInput as string;
            const backticks = '```';
            const regexString = backticks + '(?:json)?\\s*([\\s\\S]*?)\\s*' + backticks;
            const jsonRegex = new RegExp(regexString, 'i');
            const match = rawString.match(jsonRegex);

            let jsonString = match ? match[1].trim() : rawString.trim();
            jsonString = jsonString.replace(/<br\s*\/?\s*>/gi, '');

            const firstBracket = jsonString.indexOf('{');
            const lastBracket = jsonString.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1) {
                jsonString = jsonString.substring(firstBracket, lastBracket + 1);
            }

            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Gagal parse JSON:', e, 'Raw Content:', rawInput);
            return null;
        }
    };

    // Upload + send to GAS → n8n, with progress
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so user can re-upload same file
        e.target.value = '';

        setLoading(true);
        setProgress(0);
        setError('');

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.floor(Math.random() * 10);
            });
        }, 600);

        try {
            // Step 1: Convert HEIC if needed
            let blob: Blob = file;
            const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name);
            if (isHeic) {
                try {
                    console.log('Converting HEIC to JPEG...');
                    const heic2any = (await import('heic2any')).default;
                    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
                    blob = Array.isArray(converted) ? converted[0] : converted;
                    console.log('HEIC conversion done');
                } catch (heicErr) {
                    console.warn('HEIC conversion failed, using original:', heicErr);
                }
            }

            // Step 2: Compress image via Canvas (iPhone photos can be 10MB+)
            const base64 = await new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const MAX_SIZE = 1600;
                    let { width, height } = img;
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    console.log(`Compressed: ${(dataUrl.length / 1024).toFixed(0)}KB`);
                    resolve(dataUrl);
                };
                img.onerror = () => reject(new Error('Gagal memuat gambar'));
                img.src = URL.createObjectURL(blob);
            });

            // Step 3: Send to API
            const res = await fetch('/api/scan-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, action: 'process_only' }),
            });

            const result = await res.json();

            console.log('=== FULL API RESPONSE ===');
            console.log(JSON.stringify(result, null, 2));
            console.log('=== END API RESPONSE ===');

            // n8n can return data in many different structures
            // Try to find the AI output in common response shapes
            let rawAiContent: string | object | null = null;

            // Check if the response itself is already the parsed bill data
            if (result.items && Array.isArray(result.items)) {
                rawAiContent = JSON.stringify(result);
            }
            // result.data[0].output (array response)
            else if (result.data?.[0]?.output) {
                rawAiContent = result.data[0].output;
            }
            // result.data.output
            else if (result.data?.output) {
                rawAiContent = result.data.output;
            }
            // result.output
            else if (result?.output) {
                rawAiContent = result.output;
            }
            // result.data[0].text (some n8n AI nodes use 'text')
            else if (result.data?.[0]?.text) {
                rawAiContent = result.data[0].text;
            }
            // result.data.text
            else if (result.data?.text) {
                rawAiContent = result.data.text;
            }
            // result.text
            else if (result?.text) {
                rawAiContent = result.text;
            }
            // result.message
            else if (result?.message && typeof result.message === 'string') {
                rawAiContent = result.message;
            }
            // result.data[0].message.content (OpenAI style)
            else if (result.data?.[0]?.message?.content) {
                rawAiContent = result.data[0].message.content;
            }
            // result.data[0].json (n8n raw json output)
            else if (result.data?.[0]?.json) {
                rawAiContent = typeof result.data[0].json === 'string'
                    ? result.data[0].json
                    : JSON.stringify(result.data[0].json);
            }
            // result.data (if data itself is the content string)
            else if (typeof result.data === 'string') {
                rawAiContent = result.data;
            }
            // result.result
            else if (result?.result) {
                rawAiContent = typeof result.result === 'string'
                    ? result.result
                    : JSON.stringify(result.result);
            }
            // result.response
            else if (result?.response) {
                rawAiContent = typeof result.response === 'string'
                    ? result.response
                    : JSON.stringify(result.response);
            }

            console.log('Extracted rawAiContent type:', typeof rawAiContent);
            console.log('Extracted rawAiContent:', typeof rawAiContent === 'string' ? rawAiContent?.slice(0, 500) : rawAiContent);

            if (!rawAiContent) {
                console.error('Could not find AI content in response. Full response keys:', Object.keys(result));
                if (result.data) console.error('result.data keys:', typeof result.data === 'object' ? Object.keys(result.data) : typeof result.data);
                throw new Error(
                    `Tidak dapat menemukan data dari respon n8n. Keys: [${Object.keys(result).join(', ')}]. ` +
                    `Cek console untuk detail lengkap.`
                );
            }

            const parsedData = parseAiResponse(rawAiContent);

            if (parsedData) {
                // Force all numeric fields to actual numbers (AI sometimes returns objects or strings)
                const toNum = (val: unknown): number => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') return parseFloat(val) || 0;
                    return 0;
                };

                // Auto-detect item array (AI might not use "items")
                const rawItems = parsedData.items ?? parsedData.item ?? parsedData.products ?? parsedData.produk ?? parsedData.barang ?? parsedData.menu ?? parsedData.order ?? parsedData.list ?? [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.log('=== RAW AI ITEMS (first) ===', JSON.stringify(Array.isArray(rawItems) ? rawItems[0] : rawItems, null, 2));
                console.log('=== RAW AI ITEMS (all keys) ===', Array.isArray(rawItems) && rawItems[0] ? Object.keys(rawItems[0]) : 'no items');

                // Known field names
                const PRICE_KEYS = ['price', 'harga', 'amount', 'unit_price', 'total_price', 'total', 'subtotal', 'cost', 'nilai', 'harga_satuan', 'harga_total'];
                const NAME_KEYS = ['name', 'nama', 'item', 'product', 'item_name', 'description', 'produk', 'menu', 'barang', 'keterangan', 'desc'];
                const QTY_KEYS = ['qty', 'quantity', 'jumlah', 'qyt', 'count', 'pcs', 'unit'];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => {
                    // Try known price keys
                    let rawPrice = 0;
                    for (const k of PRICE_KEYS) {
                        if (it[k] !== undefined && it[k] !== null) { rawPrice = toNum(it[k]); break; }
                    }
                    // If still 0, auto-detect: find largest numeric value that's not qty
                    if (rawPrice === 0) {
                        const qtyKeySet = new Set(QTY_KEYS);
                        for (const [k, v] of Object.entries(it)) {
                            if (qtyKeySet.has(k.toLowerCase())) continue;
                            const num = toNum(v);
                            if (num > rawPrice) rawPrice = num;
                        }
                    }

                    // Try known name keys
                    let rawName = '';
                    for (const k of NAME_KEYS) {
                        if (it[k] !== undefined && it[k] !== null && String(it[k]).trim()) { rawName = String(it[k]); break; }
                    }
                    // If still empty, find first string value
                    if (!rawName) {
                        for (const v of Object.values(it)) {
                            if (typeof v === 'string' && v.trim().length > 1) { rawName = v; break; }
                        }
                    }

                    // Try known qty keys
                    let rawQty = 0;
                    for (const k of QTY_KEYS) {
                        if (it[k] !== undefined && it[k] !== null) { rawQty = toNum(it[k]); break; }
                    }

                    return {
                        name: rawName || 'Item',
                        price: rawPrice,
                        qty: rawQty || 1,
                    };
                });
                const itemsSubtotal = items.reduce((s: number, it: Item) => s + it.price, 0);
                // Tax: handle all possible field names
                const tax = toNum(parsedData.tax ?? parsedData.pajak ?? parsedData.ppn ?? parsedData.pb1 ?? parsedData.vat ?? parsedData.tax_amount ?? 0);
                // Service charge: handle all possible field names
                const serviceCharge = toNum(parsedData.service_charge ?? parsedData.serviceCharge ?? parsedData.service ?? parsedData.biaya_layanan ?? parsedData.service_fee ?? parsedData.layanan ?? 0);
                // Subtotal
                const subtotal = toNum(parsedData.subtotal ?? parsedData.sub_total ?? parsedData.subtotal_amount ?? 0) || itemsSubtotal;
                // Total
                const total = toNum(parsedData.total ?? parsedData.grand_total ?? parsedData.total_amount ?? parsedData.total_bayar ?? 0) || (subtotal + tax + serviceCharge);

                const normalized: BillData = {
                    items,
                    tax,
                    service_charge: serviceCharge,
                    subtotal,
                    total,
                };

                console.log('=== NORMALIZED BILL DATA ===', JSON.stringify(normalized, null, 2));

                setProgress(100);
                setTimeout(() => {
                    setBillData(normalized);
                    setLoading(false);
                    setStep('verify');
                }, 500);
            } else {
                throw new Error('Format data salah');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Gagal memproses struk. Coba foto yang lebih jelas atau cek koneksi.');
            setLoading(false);
        } finally {
            clearInterval(progressInterval);
        };

        // Participants
        const addParticipant = () => {
            const trimmed = newName.trim();
            if (trimmed && !participants.includes(trimmed)) {
                setParticipants([...participants, trimmed]);
                setNewName('');
            }
        };

        const removeParticipant = (name: string) => {
            setParticipants(participants.filter(p => p !== name));
            const newAssignments = { ...assignments };
            Object.keys(newAssignments).forEach(key => {
                newAssignments[Number(key)] = newAssignments[Number(key)].filter(p => p !== name);
            });
            setAssignments(newAssignments);
        };

        // Toggle item assignment (limited by qty)
        const toggleAssignment = (itemIndex: number, personName: string) => {
            const current = assignments[itemIndex] || [];
            const maxSlots = billData?.items[itemIndex]?.qty ?? 1;

            if (current.includes(personName)) {
                // Always allow deselect
                setAssignments({ ...assignments, [itemIndex]: current.filter(p => p !== personName) });
            } else {
                // Only allow select if under the qty limit
                if (current.length < maxSlots) {
                    setAssignments({ ...assignments, [itemIndex]: [...current, personName] });
                }
            }
        };

        // Proportional calculation
        const finalCalculation = useMemo(() => {
            if (!billData) return null;
            const memberTotals: Record<string, { subtotal: number; items: { name: string; price: number }[] }> = {};
            participants.forEach(p => (memberTotals[p] = { subtotal: 0, items: [] }));

            billData.items.forEach((item, idx) => {
                const assignedPeople = assignments[idx] || [];
                if (assignedPeople.length > 0) {
                    const share = item.price / assignedPeople.length;
                    assignedPeople.forEach(p => {
                        if (memberTotals[p]) {
                            memberTotals[p].subtotal += share;
                            memberTotals[p].items.push({ name: item.name + ((item.qty ?? 1) > 1 ? ` (x${item.qty})` : ''), price: Math.round(share) });
                        }
                    });
                }
            });

            // Safely compute tax+service ratio
            const extraCharges = (billData.tax || 0) + (billData.service_charge || 0);
            const subtotalCalc = billData.subtotal || billData.items.reduce((s, it) => s + it.price, 0);
            const ratio = subtotalCalc > 0 ? (subtotalCalc + extraCharges) / subtotalCalc : 1;

            return Object.entries(memberTotals).map(([name, data]) => ({
                name,
                subtotal: Math.round(data.subtotal),
                tax: Math.round(data.subtotal * (ratio - 1)),
                total: Math.round(data.subtotal * ratio),
                items: data.items,
            }));
        }, [billData, participants, assignments]);

        const totalAssigned = billData
            ? billData.items.reduce((sum, _, idx) => {
                return sum + ((assignments[idx]?.length ?? 0) > 0 ? billData.items[idx].price : 0);
            }, 0)
            : 0;
        const totalUnassigned = billData ? billData.subtotal - totalAssigned : 0;

        // Edit item handlers
        const startEditItem = (idx: number) => {
            if (!billData) return;
            setEditingItem(idx);
            setEditName(billData.items[idx].name);
            const qty = billData.items[idx].qty || 1;
            setEditQty(String(qty));
            // Show unit price in edit mode
            setEditPrice(String(Math.round(billData.items[idx].price / qty)));
        };

        const saveEditItem = () => {
            if (editingItem === null || !billData) return;
            const updatedItems = [...billData.items];
            const unitPrice = Number(editPrice) || 0;
            const qty = Math.max(1, Number(editQty) || 1);
            updatedItems[editingItem] = {
                ...updatedItems[editingItem],
                name: editName,
                price: unitPrice * qty,
                qty: qty,
            };
            const newSubtotal = updatedItems.reduce((s, it) => s + it.price, 0);
            setBillData({
                ...billData,
                items: updatedItems,
                subtotal: newSubtotal,
                total: newSubtotal + billData.tax + billData.service_charge,
            });
            setEditingItem(null);
        };

        const deleteItem = (idx: number) => {
            if (!billData) return;
            const updatedItems = billData.items.filter((_, i) => i !== idx);
            const newSubtotal = updatedItems.reduce((s, it) => s + it.price, 0);
            setBillData({
                ...billData,
                items: updatedItems,
                subtotal: newSubtotal,
                total: newSubtotal + billData.tax + billData.service_charge,
            });
            // Clean up assignments
            const newAssignments: Record<number, string[]> = {};
            updatedItems.forEach((_, i) => {
                const oldIdx = i >= idx ? i + 1 : i;
                if (assignments[oldIdx]) {
                    newAssignments[i] = assignments[oldIdx];
                }
            });
            setAssignments(newAssignments);
        };

        const addManualItem = () => {
            if (!billData) return;
            const newItem: Item = { name: 'Item Baru', price: 0, qty: 1 };
            const updatedItems = [...billData.items, newItem];
            setBillData({ ...billData, items: updatedItems });
            startEditItem(updatedItems.length - 1);
        };

        const resetAll = () => {
            setBillData(null);
            setAssignments({});
            setParticipants([]);
            setStep('home');
        };

        // ── Header with back button ──
        const renderHeader = (title: string, showBack: boolean = true) => (
            <header className="sticky top-0 z-20 bg-background-dark/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
                {showBack ? (
                    <button
                        onClick={() => {
                            if (step === 'verify') setStep('home');
                            else if (step === 'assign') setStep('verify');
                            else if (step === 'summary') setStep('assign');
                        }}
                        className="flex items-center justify-center p-2 rounded-full text-slate-100 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                ) : (
                    <div className="w-10" />
                )}
                <h1 className="text-lg font-bold text-slate-100">{title}</h1>
                {step !== 'home' ? (
                    <button onClick={resetAll} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors px-2">
                        Batal
                    </button>
                ) : (
                    <button className="h-10 w-10 rounded-full bg-surface-dark flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                )}
            </header>
        );

        // ══════════════════════════════════════════════
        // STEP 1: HOME
        // ══════════════════════════════════════════════
        const renderHome = () => (
            <div className="animate-fade-in flex flex-col min-h-screen bg-background-dark">
                {renderHeader('Split Bill', false)}
                <main className="flex-1 flex flex-col gap-6 p-4 pb-24">
                    {/* Welcome */}
                    <section className="mt-2">
                        <h2 className="text-3xl font-extrabold text-white leading-tight">
                            Halo! 👋<br />
                            <span className="text-primary">Mau bagi tagihan</span> apa hari ini?
                        </h2>
                    </section>

                    {/* Upload Receipt */}
                    <section>
                        <div className="relative overflow-hidden rounded-2xl bg-surface-dark border border-white/5 p-1">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-1/2 h-48 md:h-auto relative rounded-xl overflow-hidden order-1 md:order-2">
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/90 to-transparent z-10 md:hidden" />
                                    <img
                                        src="/receipt-dummy.png"
                                        alt="Contoh struk belanja"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 p-5 flex flex-col justify-center gap-4 relative z-20 order-2 md:order-1">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-white">Upload Struk</h3>
                                        <p className="text-text-secondary text-sm">
                                            Scan struk belanjamu, AI kami akan otomatis membagi item ke teman-temanmu.
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-4 py-4">
                                            {/* Status message */}
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-xl animate-pulse">auto_awesome</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-semibold">
                                                        {progress < 30 ? 'Mengupload gambar...' : progress < 60 ? 'AI sedang membaca struk...' : progress < 90 ? 'Mengekstrak item & harga...' : 'Hampir selesai!'}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">Tunggu sebentar ya</p>
                                                </div>
                                                <span className="text-primary font-bold text-sm tabular-nums">{progress}%</span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="relative w-full bg-white/5 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                                {/* Shimmer overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                id="upload"
                                                hidden
                                                onChange={handleFileUpload}
                                                accept="image/*,.heic,.heif"
                                            />
                                            <label
                                                htmlFor="upload"
                                                className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 px-6 text-background-dark font-bold transition-transform active:scale-95 hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined">add_a_photo</span>
                                                <span>Upload Foto</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Manual Input */}
                    <section>
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-dark p-1 border border-white/5">
                            <div className="flex-1 p-5 flex flex-col gap-3">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white">Input Manual</h3>
                                    <p className="text-text-secondary text-sm">
                                        Masukkan item belanja satu per satu.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setBillData({ items: [], tax: 0, service_charge: 0, subtotal: 0, total: 0 });
                                        setStep('verify');
                                    }}
                                    className="w-fit flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    <span>Mulai Tulis</span>
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                            <div className="w-24 h-24 mr-4 rounded-xl bg-surface-dark flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                                <span className="material-symbols-outlined text-4xl text-primary z-10">edit_note</span>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        );

        // ══════════════════════════════════════════════
        // STEP 2: VERIFY ITEMS
        // ══════════════════════════════════════════════
        const renderVerify = () => (
            <div className="animate-fade-in flex flex-col min-h-screen bg-background-dark">
                {renderHeader('Verifikasi Resi')}
                <main className="flex-1 flex flex-col p-4 w-full max-w-md mx-auto">
                    {/* Header text */}
                    <div className="mb-6 mt-2">
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Periksa item Anda</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Pastikan semua item dan harga sudah benar sebelum melanjutkan.
                        </p>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-col gap-3">
                        {billData?.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="group flex items-center gap-4 bg-surface-dark p-4 rounded-xl border border-white/5 hover:border-primary/50 transition-all"
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">restaurant</span>
                                </div>
                                {editingItem === idx ? (
                                    <div className="flex-1 flex flex-col gap-2">
                                        <input
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            placeholder="Nama item"
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 block">Harga Satuan</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary"
                                                    type="number"
                                                    value={editPrice}
                                                    onChange={e => setEditPrice(e.target.value)}
                                                    placeholder="Harga"
                                                />
                                            </div>
                                            <div className="w-20">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 block">Qty</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary text-center"
                                                    type="number"
                                                    min="1"
                                                    value={editQty}
                                                    onChange={e => setEditQty(e.target.value)}
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                        {(Number(editQty) || 1) > 1 && (
                                            <p className="text-xs text-primary/70">
                                                Total: Rp {((Number(editPrice) || 0) * (Number(editQty) || 1)).toLocaleString()}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={saveEditItem} className="text-xs bg-primary text-background-dark px-3 py-1 rounded-lg font-bold">
                                                Simpan
                                            </button>
                                            <button onClick={() => setEditingItem(null)} className="text-xs text-slate-400 px-3 py-1">
                                                Batal
                                            </button>
                                            <button onClick={() => { deleteItem(idx); setEditingItem(null); }} className="text-xs text-red-400 px-3 py-1 ml-auto">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-1 flex-col justify-center">
                                            <p className="text-slate-100 text-base font-semibold leading-tight mb-1">
                                                {item.name}{(item.qty ?? 1) > 1 ? ` (x${item.qty})` : ''}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-primary font-medium">Rp {item.price.toLocaleString()}</span>
                                                {(item.qty ?? 1) > 1 && (
                                                    <>
                                                        <span className="text-slate-500 text-xs">•</span>
                                                        <span className="text-slate-400 text-xs">{item.qty} x Rp {Math.round(item.price / (item.qty ?? 1)).toLocaleString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => startEditItem(idx)}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-slate-300 group-hover:bg-primary group-hover:text-background-dark transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Add item button */}
                        <button
                            onClick={addManualItem}
                            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-primary hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            <span className="font-semibold text-sm">Tambah Item Manual</span>
                        </button>
                    </div>
                </main>

                {/* Bottom Action Bar */}
                {billData && billData.items.length > 0 && (
                    <div className="sticky bottom-0 bg-background-dark border-t border-white/5 p-4 pb-8 w-full max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-slate-400 text-sm font-medium">Subtotal ({billData.items.length} Item)</span>
                            <span className="text-slate-100 text-lg font-bold">Rp {billData.subtotal.toLocaleString()}</span>
                        </div>

                        {/* Editable Tax & Service */}
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Pajak (Tax)</label>
                                    <button
                                        onClick={() => {
                                            if (taxMode === 'amount') {
                                                setTaxMode('percent');
                                                setTaxPercent(billData.subtotal > 0 ? String(Math.round((billData.tax / billData.subtotal) * 100)) : '0');
                                            } else {
                                                setTaxMode('amount');
                                            }
                                        }}
                                        className="text-[10px] text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                                    >
                                        {taxMode === 'amount' ? 'Rp' : '%'}
                                    </button>
                                </div>
                                {taxMode === 'amount' ? (
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                                        value={billData.tax}
                                        onChange={e => {
                                            const tax = Number(e.target.value) || 0;
                                            setBillData({ ...billData, tax, total: billData.subtotal + tax + billData.service_charge });
                                        }}
                                        placeholder="0"
                                    />
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-primary"
                                            value={taxPercent}
                                            onChange={e => {
                                                const pct = e.target.value;
                                                setTaxPercent(pct);
                                                const tax = Math.round(billData.subtotal * (Number(pct) || 0) / 100);
                                                setBillData({ ...billData, tax, total: billData.subtotal + tax + billData.service_charge });
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                                    </div>
                                )}
                                {taxMode === 'percent' && (
                                    <p className="text-[10px] text-slate-500 mt-1">= Rp {billData.tax.toLocaleString()}</p>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Service</label>
                                    <button
                                        onClick={() => {
                                            if (scMode === 'amount') {
                                                setScMode('percent');
                                                setScPercent(billData.subtotal > 0 ? String(Math.round((billData.service_charge / billData.subtotal) * 100)) : '0');
                                            } else {
                                                setScMode('amount');
                                            }
                                        }}
                                        className="text-[10px] text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                                    >
                                        {scMode === 'amount' ? 'Rp' : '%'}
                                    </button>
                                </div>
                                {scMode === 'amount' ? (
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                                        value={billData.service_charge}
                                        onChange={e => {
                                            const sc = Number(e.target.value) || 0;
                                            setBillData({ ...billData, service_charge: sc, total: billData.subtotal + billData.tax + sc });
                                        }}
                                        placeholder="0"
                                    />
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-primary"
                                            value={scPercent}
                                            onChange={e => {
                                                const pct = e.target.value;
                                                setScPercent(pct);
                                                const sc = Math.round(billData.subtotal * (Number(pct) || 0) / 100);
                                                setBillData({ ...billData, service_charge: sc, total: billData.subtotal + billData.tax + sc });
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                                    </div>
                                )}
                                {scMode === 'percent' && (
                                    <p className="text-[10px] text-slate-500 mt-1">= Rp {billData.service_charge.toLocaleString()}</p>
                                )}
                            </div>
                        </div>

                        {(billData.tax + billData.service_charge) > 0 && (
                            <div className="flex justify-between items-center mb-3 px-1">
                                <span className="text-primary/70 text-xs font-medium">Total (termasuk pajak & layanan)</span>
                                <span className="text-primary text-sm font-bold">Rp {billData.total.toLocaleString()}</span>
                            </div>
                        )}

                        <button
                            onClick={() => setStep('assign')}
                            className="w-full bg-primary hover:bg-primary/90 text-background-dark text-base font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                            <span>Lanjut ke Pembagian</span>
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                    </div>
                )}
            </div>
        );

        // ══════════════════════════════════════════════
        // STEP 3: ASSIGN ITEMS
        // ══════════════════════════════════════════════
        const renderAssign = () => (
            <div className="animate-fade-in flex flex-col min-h-screen bg-background-dark">
                {renderHeader('Tetapkan Item')}

                {/* Add Participants */}
                <div className="px-4 py-3 sticky top-[57px] z-10 bg-background-dark">
                    <div className="flex flex-col pb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white tracking-tight text-lg font-bold leading-tight">Teman</h3>
                        </div>

                        {/* Input for adding participant */}
                        <div className="flex gap-2 mb-3">
                            <div className="flex w-full flex-1 items-stretch rounded-xl h-12 bg-surface-dark">
                                <div className="text-text-secondary flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined">person_add</span>
                                </div>
                                <input
                                    className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder:text-text-secondary/70 px-3 text-base font-normal"
                                    placeholder="Ketik nama teman..."
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addParticipant()}
                                />
                            </div>
                            <button
                                onClick={addParticipant}
                                className="h-12 px-4 rounded-xl bg-primary text-background-dark font-bold flex items-center gap-1 transition-transform active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>

                        {/* Participants chips */}
                        {participants.length > 0 && (
                            <div className="flex items-center overflow-x-auto gap-3 no-scrollbar pb-2">
                                {participants.map(p => (
                                    <div key={p} className="flex flex-col items-center gap-1.5 shrink-0">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary font-bold text-lg">
                                                {p.charAt(0).toUpperCase()}
                                            </div>
                                            <button
                                                onClick={() => removeParticipant(p)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-400"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 max-w-[60px] truncate">{p}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Header */}
                <div className="px-4 pt-2 pb-2 flex justify-between items-end border-b border-white/5 mx-4 mb-2">
                    <h3 className="text-white tracking-tight text-xl font-bold leading-tight">Item Bon</h3>
                    <span className="text-sm text-slate-400">{billData?.items.length} Item • Rp {billData?.subtotal.toLocaleString()}</span>
                </div>

                {/* Receipt Items List */}
                <div className="flex flex-col px-4 pb-32 gap-3">
                    {billData?.items.map((item, idx) => {
                        const assignedPeople = assignments[idx] || [];
                        const isAssigned = assignedPeople.length > 0;

                        const maxSlots = item.qty ?? 1;
                        const isFull = assignedPeople.length >= maxSlots;

                        return (
                            <div
                                key={idx}
                                className={`group relative flex flex-col gap-3 p-4 rounded-xl bg-surface-dark transition-all duration-200 ${isAssigned
                                    ? 'border border-primary/30 ring-1 ring-primary/20'
                                    : 'border border-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex flex-col gap-1 pr-4">
                                        <h4 className="text-white text-base font-semibold">
                                            {item.name}{maxSlots > 1 ? ` (x${maxSlots})` : ''}
                                        </h4>
                                        {isAssigned ? (
                                            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-lg w-fit">
                                                {assignedPeople.length}/{maxSlots} orang
                                            </span>
                                        ) : (
                                            <span className="text-xs text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded-lg w-fit">
                                                Belum ditetapkan • {maxSlots} slot
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-white font-bold text-base whitespace-nowrap">
                                        Rp {item.price.toLocaleString()}
                                    </div>
                                </div>

                                <div className="w-full h-px bg-white/5" />

                                {/* Participant assignment buttons */}
                                <div className="flex items-center justify-between">
                                    {participants.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {participants.map(p => {
                                                const isSelected = assignedPeople.includes(p);
                                                const isDisabled = !isSelected && isFull;
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => !isDisabled && toggleAssignment(idx, p)}
                                                        disabled={isDisabled}
                                                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${isSelected
                                                            ? 'bg-primary text-background-dark border-primary'
                                                            : isDisabled
                                                                ? 'bg-white/[0.02] text-slate-600 border-white/5 cursor-not-allowed opacity-50'
                                                                : 'bg-white/5 text-slate-400 border-white/10 hover:border-primary/50'
                                                            }`}
                                                    >
                                                        {isSelected && '✓ '}{p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500">Tambahkan teman dulu di atas</span>
                                    )}
                                    {isFull && (
                                        <div className="size-6 rounded-full bg-primary flex items-center justify-center text-background-dark shrink-0 ml-2">
                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Floating Action Bar */}
                {billData && participants.length > 0 && (
                    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
                        <button
                            onClick={() => setStep('summary')}
                            className="w-full bg-primary text-background-dark p-4 rounded-xl shadow-lg shadow-primary/20 flex justify-between items-center hover:bg-primary/90 transition-colors active:scale-[0.98]"
                        >
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-bold opacity-80 uppercase tracking-wider">
                                    {totalUnassigned > 0 ? 'Sisa Belum Ditetapkan' : 'Semua Item Ditetapkan ✓'}
                                </span>
                                <span className="text-lg font-bold">
                                    {totalUnassigned > 0 ? `Rp ${totalUnassigned.toLocaleString()}` : `Rp ${billData.subtotal.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg">
                                <span className="text-sm font-bold">Lanjut</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        );

        // ══════════════════════════════════════════════
        // STEP 4: SUMMARY
        // ══════════════════════════════════════════════
        const renderSummary = () => (
            <div className="animate-fade-in flex flex-col min-h-screen bg-background-dark">
                {renderHeader('Ringkasan Tagihan')}
                <main className="flex-1 flex flex-col px-4 pb-40 no-scrollbar">
                    {/* Total Summary */}
                    <div className="mt-6 mb-8 text-center">
                        <p className="text-sm font-medium text-text-secondary mb-1">Total Keseluruhan</p>
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">
                            Rp {(billData?.total ?? 0).toLocaleString()}
                        </h2>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                            {participants.length} Orang • {billData?.items.length} Item
                        </div>
                    </div>

                    {/* Per Person Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary px-1">
                            Detail Per Orang
                        </h3>

                        {finalCalculation?.map((person, pIdx) => (
                            <div
                                key={person.name}
                                className="bg-surface-dark rounded-2xl p-4 shadow-sm border border-[#234833] transition-all active:scale-[0.99]"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${pIdx === 0
                                            ? 'bg-primary/20 text-primary border-2 border-primary'
                                            : 'bg-white/5 text-text-secondary border-2 border-[#2d4a3b]'
                                            }`}>
                                            {person.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-base font-bold text-white truncate pr-2">{person.name}</h4>
                                            <span className={`text-base font-bold whitespace-nowrap ${pIdx === 0 ? 'text-primary' : 'text-white'
                                                }`}>
                                                Rp {person.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {person.items.map((it, iIdx) => (
                                                <div key={iIdx} className="flex justify-between text-xs text-text-secondary">
                                                    <span className="truncate">{it.name}</span>
                                                    <span>Rp {it.price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {person.tax > 0 && (
                                                <div className="flex justify-between text-xs text-primary/80 font-medium pt-1 border-t border-dashed border-[#2d4a3b]">
                                                    <span>Pajak & Layanan</span>
                                                    <span>Rp {person.tax.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Share Button */}
                <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto flex flex-col gap-3">
                    <button
                        onClick={() => {
                            if (!finalCalculation || !billData) return;
                            let text = `💰 Split Bill\nTotal: Rp ${billData.total.toLocaleString()}\n\n`;
                            finalCalculation.forEach(p => {
                                text += `👤 ${p.name}: Rp ${p.total.toLocaleString()}\n`;
                            });
                            if (navigator.share) {
                                navigator.share({ title: 'Split Bill', text }).catch(() => {
                                    // User cancelled share — ignore
                                });
                            } else {
                                navigator.clipboard.writeText(text);
                                alert('Ringkasan disalin ke clipboard!');
                            }
                        }}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl py-3.5 px-6 font-bold shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">share</span>
                        Bagikan Tagihan
                    </button>
                    <button
                        onClick={resetAll}
                        className="w-full bg-surface-dark text-slate-300 rounded-xl py-3 px-6 font-semibold border border-white/10 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Buat Baru
                    </button>
                </div>
            </div>
        );

        // ── Route by step ──
        return (
            <>
                {step === 'home' && renderHome()}
                {step === 'verify' && renderVerify()}
                {step === 'assign' && renderAssign()}
                {step === 'summary' && renderSummary()}
            </>
        );
    }
}
