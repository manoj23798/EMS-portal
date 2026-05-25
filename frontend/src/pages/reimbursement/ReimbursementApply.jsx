import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, FileText, ArrowLeft, Upload, CheckCircle, Plane, Hotel, Car, Coffee, MoreHorizontal, Users, Maximize, X, ChevronLeft, ChevronRight, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ReimbursementApply() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [verificationFile, setVerificationFile] = useState(null);



    const [visibleSections, setVisibleSections] = useState({
        tickets: true,
        lodgings: true,
        conveyances: false,
        foods: false,
        others: false,
        wages: false
    });

    const toggleSection = (sec) => {
        setVisibleSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const [formData, setFormData] = useState({
        reasonForTravel: '',
        travelStartDate: '',
        travelEndDate: '',
        advanceAmount: 0
    });

    const [tickets, setTickets] = useState([{ date: '', travelFrom: '', travelTo: '', mode: '', amount: 0, person: '', ticketAvailable: false }]);
    const [lodgings, setLodgings] = useState([{ fromDate: '', toDate: '', location: '', days: 0, persons: 0, ratePerPerson: 0, amount: 0, billAvailable: false }]);
    const [conveyances, setConveyances] = useState([{ date: '', locationFrom: '', locationTo: '', modeOfTravel: '', amount: 0, ticketAvailable: false }]);
    const [foods, setFoods] = useState([{ date: '', morning: 0, afternoon: 0, evening: 0, night: 0, total: 0, gst: 0, sgst: 0, billAvailable: false }]);
    const [others, setOthers] = useState([{ date: '', description: '', amount: 0, billAvailable: false }]);
    const [wages, setWages] = useState([{ name: '', fromDate: '', toDate: '', daysWorked: 0, perDaySalary: 0, totalAmount: 0 }]);
    const [activePod, setActivePod] = useState('summary');
    const [isPodVisible, setIsPodVisible] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleSummaryCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // Gallery / Preview State (Must be after array state declarations)
    const [previewCategory, setPreviewCategory] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Derived Gallery Data
    const galleryData = React.useMemo(() => ({
        tickets: tickets.filter(t => t.file).map(t => ({ ...t, globalIndex: tickets.indexOf(t) })),
        lodgings: lodgings.filter(l => l.file).map(l => ({ ...l, globalIndex: lodgings.indexOf(l) })),
        conveyances: conveyances.filter(c => c.file).map(c => ({ ...c, globalIndex: conveyances.indexOf(c) })),
        foods: foods.filter(f => f.file).map(f => ({ ...f, globalIndex: foods.indexOf(f) })),
        others: others.filter(o => o.file).map(o => ({ ...o, globalIndex: others.indexOf(o) }))
    }), [tickets, lodgings, conveyances, foods, others]);

    const activeGalleryList = previewCategory ? galleryData[previewCategory] : [];
    const activeGalleryItem = activeGalleryList[previewIndex] || activeGalleryList[0];
    
    // Sync verificationFile state with gallery selection for FullScreen & Legacy support
    useEffect(() => {
        if (activeGalleryItem?.file) {
            setVerificationFile(activeGalleryItem.file);
        } else {
            setVerificationFile(null);
        }
    }, [activeGalleryItem, previewIndex, previewCategory]);

    const handleFileUpload = async (file, category, index, setter) => {
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            setter(prev => {
                const updated = [...prev];
                updated[index] = { 
                    ...updated[index], 
                    file: base64, 
                    fileName: file.name,
                    fileType: file.type,
                    ticketAvailable: category === 'tickets' || category === 'conveyances',
                    billAvailable: category !== 'tickets' && category !== 'conveyances'
                };
                return updated;
            });
            setPreviewCategory(category);
            setPreviewIndex(0); // The gallery filters for items with .file
            setActivePod('preview');
        } catch (err) {
            console.error("File conversion failed", err);
        }
    };

    const handleAddRow = (setter, emptyObj) => setter(prev => [...prev, emptyObj]);
    const handleRemoveRow = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

    const DRAFT_KEY = 'reimbursement_draft';

    const base64ToFile = (base64String, filename, mimeType) => {
        if (!base64String) return null;
        try {
            const arr = base64String.split(',');
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, {type: mimeType});
        } catch (e) {
            console.error("Failed to restore file from draft", e);
            return null;
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                const restoreFiles = (list) => {
                    if (!list) return [];
                    return list.map(item => {
                        if (item.file && typeof item.file === 'string' && item.file.startsWith('data:')) {
                            const restored = base64ToFile(item.file, item.fileName || 'draft_upload', item.fileType || 'image/jpeg');
                            return { ...item, file: restored };
                        }
                        return item;
                    });
                };

                if (parsed.formData) setFormData(parsed.formData);
                if (parsed.sections) setVisibleSections(parsed.sections);
                if (parsed.tickets) setTickets(restoreFiles(parsed.tickets));
                if (parsed.lodgings) setLodgings(restoreFiles(parsed.lodgings));
                if (parsed.conveyances) setConveyances(restoreFiles(parsed.conveyances));
                if (parsed.foods) setFoods(restoreFiles(parsed.foods));
                if (parsed.others) setOthers(restoreFiles(parsed.others));
                if (parsed.wages) setWages(parsed.wages);
            }
        } catch (err) {
            console.error("Failed to load draft", err);
        }
    }, []);

    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            const toBase64List = async (list) => {
                return await Promise.all(list.map(async item => {
                    if (item.file && item.file instanceof File) {
                        return { ...item, file: await fileToBase64(item.file), fileName: item.file.name, fileType: item.file.type };
                    }
                    return item;
                }));
            };

            const draftData = {
                formData,
                sections: visibleSections,
                tickets: await toBase64List(tickets),
                lodgings: await toBase64List(lodgings),
                conveyances: await toBase64List(conveyances),
                foods: await toBase64List(foods),
                others: await toBase64List(others),
                wages
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
            setSuccess('Draft successfully saved.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            if (err.name === 'QuotaExceededError') {
                setError('Failed to save draft: Storage full (Receipts too large).');
            } else {
                setError('Failed to save draft.');
            }
            setTimeout(() => setError(''), 4000);
        }
        setLoading(false);
    };

    const handleReset = () => {
        if (!window.confirm("Are you sure you want to reset all data?")) return;
        localStorage.removeItem(DRAFT_KEY);
        setFormData({ reasonForTravel: '', travelStartDate: '', travelEndDate: '', advanceAmount: '' });
        setVisibleSections({ tickets: true, lodgings: true, conveyances: false, foods: false, others: false, wages: false });
        setTickets([{ date: '', travelFrom: '', travelTo: '', mode: '', amount: 0, person: '', ticketAvailable: false }]);
        setLodgings([{ fromDate: '', toDate: '', location: '', days: 0, persons: 0, ratePerPerson: 0, amount: 0, billAvailable: false }]);
        setConveyances([{ date: '', locationFrom: '', locationTo: '', modeOfTravel: '', amount: 0, ticketAvailable: false }]);
        setFoods([{ date: '', morning: 0, afternoon: 0, evening: 0, night: 0, total: 0, gst: 0, sgst: 0, billAvailable: false }]);
        setOthers([{ date: '', description: '', amount: 0, billAvailable: false }]);
        setWages([{ name: '', fromDate: '', toDate: '', daysWorked: 0, perDaySalary: 0, totalAmount: 0 }]);
        setVerificationFile(null);
        setActivePod('summary');
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
        setSuccess('Form has been completely reset.');
        setTimeout(() => setSuccess(''), 3000);
    };

    const calculateTotals = () => {
        const ticketList = tickets.filter(t => t.date || t.amount);
        const lodgingList = lodgings.filter(l => l.location || l.amount);
        const conveyList = conveyances.filter(c => c.locationFrom || c.amount);
        const foodList = foods.filter(f => f.date || f.total);
        const otherList = others.filter(o => o.description || o.amount);
        const wageList = wages.filter(w => w.name || w.totalAmount);

        const ticketTotal = ticketList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const lodgingTotal = lodgingList.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
        const conveyTotal = conveyList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        const foodTotal = foodList.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
        const otherTotal = otherList.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const wageTotal = wageList.reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);
        
        const grossTotal = ticketTotal + lodgingTotal + conveyTotal + foodTotal + otherTotal + wageTotal;
        const advance = Number(formData.advanceAmount) || 0;
        
        const amountToReturn = Math.max(0, advance - grossTotal);
        const companyOwed = Math.max(0, grossTotal - advance);

        return { 
            grossTotal, 
            advance, 
            amountToReturn, 
            companyOwed,
            categories: {
                tickets: { total: ticketTotal, items: ticketList },
                lodgings: { total: lodgingTotal, items: lodgingList },
                conveyances: { total: conveyTotal, items: conveyList },
                foods: { total: foodTotal, items: foodList },
                others: { total: otherTotal, items: otherList },
                wages: { total: wageTotal, items: wageList }
            },
            itemCount: ticketList.length + lodgingList.length + conveyList.length + foodList.length + otherList.length + wageList.length
        };
    };

    const totals = calculateTotals();

    const handleFilePreview = (fileObj, explicitlyKnownCategory = null) => {
        if (!fileObj) return;
        
        let foundCat = explicitlyKnownCategory;
        let foundIdx = 999; // Ensures we snap to the newly uploaded queue entry

        if (!foundCat) {
            const maps = [
                { id: 'tickets', arr: tickets },
                { id: 'lodgings', arr: lodgings },
                { id: 'conveyances', arr: conveyances },
                { id: 'foods', arr: foods },
                { id: 'others', arr: others }
            ];

            for (const map of maps) {
                let fileCount = 0;
                let found = false;
                for (let i = 0; i < map.arr.length; i++) {
                    if (map.arr[i].file === fileObj) {
                        foundCat = map.id;
                        foundIdx = fileCount;
                        found = true;
                        break;
                    }
                    if (map.arr[i].file) {
                        fileCount++;
                    }
                }
                if (found) break;
            }
        }

        if (foundCat) {
            setPreviewCategory(foundCat);
            setPreviewIndex(foundIdx);
        }
        
        setActivePod('preview');
    };

    const handleRemovePreviewFile = () => {
        if (!verificationFile || !previewCategory) return;
        
        const activeItem = activeGalleryItem;
        if (!activeItem) return;

        const gIdx = activeItem.globalIndex;
        
        const updateArray = (arr, setArr, isTicketProp) => {
            const n = [...arr];
            n[gIdx].file = null;
            if (isTicketProp) n[gIdx].ticketAvailable = false;
            else n[gIdx].billAvailable = false;
            setArr(n);
        };

        if (previewCategory === 'tickets') updateArray(tickets, setTickets, true);
        else if (previewCategory === 'lodgings') updateArray(lodgings, setLodgings, false);
        else if (previewCategory === 'conveyances') updateArray(conveyances, setConveyances, true);
        else if (previewCategory === 'foods') updateArray(foods, setFoods, false);
        else if (previewCategory === 'others') updateArray(others, setOthers, false);

        document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) resolve(null);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        if(e) e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            const processListWithFiles = async (list) => {
                return list.map(item => ({
                    ...item,
                    billImage: item.file // item.file is now a base64 string from handleFileUpload or draft restore
                }));
            };

            const payload = {
                ...formData,
                tickets: await processListWithFiles(tickets.filter(t => t.date || t.amount)),
                lodgings: await processListWithFiles(lodgings.filter(l => l.location || l.amount)),
                conveyances: await processListWithFiles(conveyances.filter(c => c.locationFrom || c.amount)),
                foods: await processListWithFiles(foods.filter(f => f.date || f.total)),
                others: await processListWithFiles(others.filter(o => o.description || o.amount)),
                wages: await processListWithFiles(wages.filter(w => w.name || w.totalAmount))
            };

            await api.post('/reimbursement/create', payload);
            setSuccess('Batch Submitted Successfully!');
            setTimeout(() => navigate('/reimbursement/history'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Apply batch failed.');
            setLoading(false);
        }
    };

    const NavPill = ({ label, id, icon }) => {
        const isActive = visibleSections[id];
        return (
            <button type="button" onClick={() => toggleSection(id)} className={`pill-btn ${isActive ? 'active' : ''}`}>
                <span className="pill-icon">{icon}</span>
                {label}
            </button>
        );
    };

    return (
        <div className="apply-container">
            <style>{`
                /* Master CSS Reset & Layout for UI */
                .apply-container { background: white; height: calc(100vh - 70px); padding: 0; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; }
                .apply-container::-webkit-scrollbar { display: none; }
                .apply-container * { box-sizing: border-box; }
                .apply-grid { display: grid; gap: 0; width: 100%; height: 100%; grid-template-columns: 1fr; flex: 1; min-height: 0; overflow: hidden; background: #fdf8f5; }
                @media(min-width: 1100px) {
                    .apply-grid { grid-template-columns: ${isPodVisible ? '1fr 340px' : '1fr'}; }
                }
                .scroll-col { padding: 24px 32px !important; border-radius: 0 !important; border: none !important; border-right: 1px solid #fed7aa !important; overflow-y: auto; }
                .scroll-col::-webkit-scrollbar { width: 5px; display: block !important; }
                .scroll-col::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
                .pods-col { background: #fffaf5; padding: 12px; height: 100%; display: flex; flexDirection: column; }
                .inner-scroll { flex: 1; overflow-y: scroll !important; padding-right: 8px; margin-bottom: 12px; }
                .inner-scroll::-webkit-scrollbar { width: 5px; display: block !important; }
                .inner-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .inner-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 1px solid #f1f5f9; }
                .inner-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                /* Typography */
                .page-title { font-size: 28px; font-weight: 900; color: #431407; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: -0.5px; }
                .page-sub { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 24px 0; }
                
                /* Cards */
                .node-card { background: white; border-radius: 24px; box-shadow: 0 10px 30px -15px rgba(249,115,22,0.1); padding: 32px; border: 1px solid #ffedd5; margin-bottom: 24px; }
                
                /* Header Actions */
                .back-btn { background: #fff; border: 2px solid #f3f4f6; color: #6b7280; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; font-size: 10px; text-transform: uppercase; margin-bottom: 12px; }
                .back-btn:hover { border-color: #f97316; color: #f97316; }

                /* Subject Context */
                .subject-box { background: #fffaf5; border: 2px solid #fed7aa; border-radius: 10px; padding: 10px 16px; display: flex; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .sb-label { font-size: 10px; font-weight: 900; color: #f97316; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
                .sb-input { border: none; background: transparent; font-size: 14px; font-weight: 700; color: #1f2937; flex-grow: 1; min-width: 200px; outline: none; }
                .sb-date { display: flex; align-items: center; gap: 8px; border-left: 2px solid #fed7aa; padding-left: 16px; }
                .sb-date input { border: 1px solid #e5e7eb; background: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #6b7280; outline: none; text-transform: uppercase; }

                /* Pills */
                .pill-row { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; padding-bottom: 4px; }
                .pill-btn { background: white; border: 1.5px solid #e5e7eb; padding: 10px 20px; border-radius: 999px; font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
                .pill-btn:hover { border-color: #f97316; color: #f97316; }
                .pill-btn.active { background: #f97316; color: white; border-color: #f97316; box-shadow: 0 4px 12px rgba(249,115,22,0.25); }
                .pill-icon { display: flex; opacity: 0.8; }

                /* Data Tables */
                .section-container { margin-bottom: 16px; animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .sec-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; color: #431407; margin-bottom: 12px; letter-spacing: 0.5px; }
                .sec-title svg { color: #f97316; }
                .data-wrapper { border: 1.5px solid #d1d5db; border-radius: 12px; overflow-x: auto; overflow-y: hidden; }
                .data-table { width: 100%; border-collapse: collapse; text-align: left; }
                .data-table th { background: #f3f4f6; font-size: 11px; font-weight: 900; color: #606060ff; text-transform: uppercase; letter-spacing: 1px; padding: 12px; border-bottom: 1.5px solid #d1d5db; border-right: 1.5px solid #e5e7eb; }
                .data-table td { background: white; padding: 0; border-bottom: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb; }
                .data-table th:last-child, .data-table td:last-child { border-right: none; }
                
                /* In-table inputs */
                .tbl-input { width: 100%; height: 100%; padding: 14px 12px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #374151; outline: none; transition: 0.1s; }
                .tbl-input:focus { background: #fffaf5; box-shadow: inset 0 0 0 2px #fed7aa; }
                .tbl-input[type="date"] { font-size: 13px; font-family: monospace; }
                .center { text-align: center; } .right { text-align: right; }
                
                /* Cell Utils */
                .cell-flex { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; height: 100%; }
                .custom-select { appearance: none; border: 1px solid #d1d5db; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; color: #4b5563; cursor: pointer; outline: none; background: #f9fafb; text-transform: uppercase; }
                .custom-select:focus { border-color: #f97316; }
                .add-row-btn { width: 100%; padding: 12px; background: white; border: none; font-size: 10px; font-weight: 900; color: #6b7280; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; gap: 8px; justify-content: flex-start; transition: 0.2s; }
                .add-row-btn:hover { color: #f97316; background: #fffaf5; }
                .del-btn { color: #9ca3af; cursor: pointer; transition: 0.2s; background: none; border: none; display: flex; align-items: center; justify-content: center; padding: 4px; }
                .del-btn:hover { color: #ef4444; }

                .del-btn:hover { color: #ef4444; }

                /* Pods & Tabs */
                .pod-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
                .pod-tab { flex: 1; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; cursor: pointer; text-align: center; border: 2px solid transparent; transition: 0.2s; letter-spacing: 1px; }
                .pod-tab.active { background: #ea580c; color: white; box-shadow: 0 4px 12px rgba(234,88,12,0.3); border-color: #c2410c; }
                .pod-tab.inactive { background: white; color: #6b7280; border: 2px solid #e5e7eb; }
                .pod-tab.inactive:hover { border-color: #ea580c; color: #ea580c; }
                
                .pod-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 900; color: #1f2937; text-transform: uppercase; margin-bottom: 4px; }
                .pod-sub { font-size: 9px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
                .calc-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #6b7280; margin-bottom: 12px; }
                .calc-val { color: #1f2937; font-weight: 900; }
                .divider { height: 1.5px; background: #f3f4f6; margin: 16px 0; }
                
                .adv-input { width: 100%; font-size: 24px; font-weight: 900; color: #1f2937; border: none; border-bottom: 2px solid #e5e7eb; padding: 8px 0; margin-bottom: 24px; outline: none; font-family: monospace; transition: 0.2s; background: transparent; }
                .adv-input:focus { border-color: #f97316; }
                .adv-label { font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }

                .total-owed { font-size: 36px; font-weight: 900; color: #f97316; font-family: monospace; margin: 8px 0 24px 0; line-height: 1; }
                
                .btn-submit { display: flex; width: 100%; justify-content: center; align-items: center; gap: 8px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; padding: 12px; border-radius: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; box-shadow: 0 4px 14px rgba(249,115,22,0.3); transition: 0.2s; }
                .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249,115,22,0.4); }
                .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

                /* Verification Area */
                .verify-zone { background: #0f172a; border-radius: 16px; flex: 1; min-height: 180px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: white; position: relative; overflow: hidden; box-shadow: inset 0 4px 20px rgba(0,0,0,0.5); }
                .vz-content { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #f97316; }
                .vz-text { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                .vz-image { width: 100%; height: 100%; object-fit: contain; background: rgba(0,0,0,0.8); }
                .vz-close { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .vz-close:hover { background: #ef4444; border-color: #ef4444; }
                .nd-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #1f2937; margin: 0; }
                .nd-sub { font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 8px 0; }
                
                .msg-box { padding: 12px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
                .msg-err { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
                .msg-suc { background: #f0fdf4; color: #10b981; border: 1px solid #dcfce3; }
            `}</style>
            
            <form onSubmit={handleSubmit} className="apply-grid">
                
                {/* LEFT COLUMN: MAIN NODE */}
                <div className="node-card scroll-col" style={{ padding: '24px 32px', overflowY: 'auto', overflowX: 'hidden', height: '100%', marginBottom: 0, position: 'relative' }} onClick={() => { if (activePod !== 'summary') setActivePod('summary'); }}>
                    <div style={{ paddingBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button type="button" onClick={() => navigate(-1)} className="back-btn" style={{ margin: 0 }}>
                                    <ArrowLeft size={16}/>
                                </button>
                                <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>REIMBURSEMENT FORM</h1>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setIsPodVisible(!isPodVisible)} className="pill-btn" style={{ borderStyle: 'dashed', color: '#6366f1', borderColor: '#6366f1' }}>
                                    {isPodVisible ? <><EyeOff size={14}/> Hide Pod</> : <><Eye size={14}/> Show Pod</>}
                                </button>
                                <button type="button" onClick={handleReset} className="pill-btn" style={{ borderStyle: 'dashed' }}>
                                    Reset
                                </button>
                                <button type="button" onClick={handleSaveDraft} className="pill-btn" style={{ borderStyle: 'dashed', color: '#10b981', borderColor: '#10b981' }}>
                                    {loading ? 'Saving...' : 'Save Draft'}
                                </button>
                            </div>
                        </div>

                    {error && <div className="msg-box msg-err"><CheckCircle size={16}/> {error}</div>}
                    {success && <div className="msg-box msg-suc"><CheckCircle size={16}/> {success}</div>}

                    {/* Subject Context */}
                    <div className="subject-box">
                        <span className="sb-label">Project</span>
                        <input 
                            type="text" 
                            className="sb-input" 
                            placeholder="Type Project/Reason..." 
                            value={formData.reasonForTravel}
                            onChange={e => setFormData({...formData, reasonForTravel: e.target.value})}
                            required
                        />
                        <div className="sb-date">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>FROM</span>
                                <input type="date" required value={formData.travelStartDate} onChange={e => setFormData({...formData, travelStartDate: e.target.value})} />
                            </div>
                            <span style={{ color: '#fed7aa', fontWeight: 'bold' }}>-</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>TO</span>
                                <input type="date" required value={formData.travelEndDate} onChange={e => setFormData({...formData, travelEndDate: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Pills */}
                    <div className="pill-row lg:overflow-visible">
                        <NavPill label="TICKETS" id="tickets" icon={<Plane size={14}/>} />
                        <NavPill label="LODGING" id="lodgings" icon={<Hotel size={14}/>} />
                        <NavPill label="LOCAL" id="conveyances" icon={<Car size={14}/>} />
                        <NavPill label="FOOD/PARKING" id="foods" icon={<Coffee size={14}/>} />
                        <NavPill label="OTHERS" id="others" icon={<MoreHorizontal size={14}/>} />
                    </div>

                    {/* SECTIONS */}
                    {visibleSections.tickets && (
                        <div className="section-container">
                            <div className="sec-title">TICKETS DETAILS<FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th className="center">DATE</th><th>FROM</th><th>TO</th><th className="center">MODE</th><th className="right">AMOUNT</th><th className="center">NO OF PERSON</th><th className="center">BILL SELECTION</th><th></th></tr></thead>
                                    <tbody>
                                        {tickets.map((r, i) => (
                                            <tr key={i}>
                                                <td><input type="date" className="tbl-input center" value={r.date} onChange={e => { const n=[...tickets]; n[i].date=e.target.value; setTickets(n); }}/></td>
                                                <td><input type="text" className="tbl-input" placeholder="Origin" value={r.travelFrom} onChange={e => { const n=[...tickets]; n[i].travelFrom=e.target.value; setTickets(n); }}/></td>
                                                <td><input type="text" className="tbl-input" placeholder="Dest" value={r.travelTo} onChange={e => { const n=[...tickets]; n[i].travelTo=e.target.value; setTickets(n); }}/></td>
                                                <td><input type="text" className="tbl-input center" placeholder="e.g BUS" value={r.mode} onChange={e => { const n=[...tickets]; n[i].mode=e.target.value; setTickets(n); }}/></td>
                                                <td><input type="number" className="tbl-input right" placeholder="0" value={r.amount || ''} onChange={e => { const n=[...tickets]; n[i].amount=Number(e.target.value); setTickets(n); }}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.person || ''} onChange={e => { const n=[...tickets]; n[i].person=Number(e.target.value); setTickets(n); }}/></td>
                                                <td>
                                                    <div className="cell-flex">
                                                        <select className="custom-select" value={r.ticketAvailable ? 'Yes' : 'No'} onChange={e => { const n=[...tickets]; n[i].ticketAvailable=(e.target.value==='Yes'); if (!n[i].ticketAvailable) n[i].file=null; setTickets(n); }}>
                                                            <option>No</option><option>Yes</option>
                                                        </select>
                                                        <input type="file" id={`t-f-${i}`} className="hidden" style={{display:'none'}} onChange={e => handleFileUpload(e.target.files[0], 'tickets', i, setTickets)}/>
                                                        {r.file ? (
                                                            <div onClick={(ev) => { ev.stopPropagation(); handleFilePreview(r.file, 'tickets'); }} style={{cursor:'pointer', color:'#10b981'}} title="View Uploaded File"><CheckCircle size={14}/></div>
                                                        ) : (
                                                            <label htmlFor={`t-f-${i}`} style={{cursor:'pointer', color:'#f97316'}} title="Upload File"><Upload size={14}/></label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><div className="cell-flex"><button type="button" className="del-btn" onClick={()=>handleRemoveRow(setTickets, i)}><Trash2 size={14}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="add-row-btn" onClick={() => handleAddRow(setTickets, { date: '', travelFrom: '', travelTo: '', mode: '', amount: 0, person: '', ticketAvailable: false })}>
                                    <Plus size={12}/>New row
                                </button>
                            </div>
                        </div>
                    )}

                    {visibleSections.lodgings && (
                        <div className="section-container">
                            <div className="sec-title">LODGIND & BOARDING DETAILS<FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th className="center">PERIOD (FROM-TO)</th><th>LOCATION</th><th className="center">DAYS</th><th className="center">NO OF PERSON</th><th className="right">RATE</th><th className="right">TOTAL</th><th className="center">BILL SELECTION</th><th></th></tr></thead>
                                    <tbody>
                                        {lodgings.map((r, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div style={{display:'flex', flexDirection:'column', padding:'8px'}}>
                                                        <input type="date" className="tbl-input center" style={{padding:'4px'}} value={r.fromDate} onChange={e=>{const n=[...lodgings]; n[i].fromDate=e.target.value; setLodgings(n)}}/>
                                                        <input type="date" className="tbl-input center" style={{padding:'4px'}} value={r.toDate} onChange={e=>{const n=[...lodgings]; n[i].toDate=e.target.value; setLodgings(n)}}/>
                                                    </div>
                                                </td>
                                                <td><input type="text" className="tbl-input" placeholder="City" value={r.location} onChange={e=>{const n=[...lodgings]; n[i].location=e.target.value; setLodgings(n);}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.days||''} onChange={e=>{const n=[...lodgings]; n[i].days=Number(e.target.value); n[i].amount=(n[i].days||0)*(n[i].persons||0)*(n[i].ratePerPerson||0); setLodgings(n);}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.persons||''} onChange={e=>{const n=[...lodgings]; n[i].persons=Number(e.target.value); n[i].amount=(n[i].days||0)*(n[i].persons||0)*(n[i].ratePerPerson||0); setLodgings(n);}}/></td>
                                                <td><input type="number" className="tbl-input right" placeholder="₹0" value={r.ratePerPerson||''} onChange={e=>{const n=[...lodgings]; n[i].ratePerPerson=Number(e.target.value); n[i].amount=(n[i].days||0)*(n[i].persons||0)*(n[i].ratePerPerson||0); setLodgings(n);}}/></td>
                                                <td><input type="text" className="tbl-input right" style={{background:'#f9fafb'}} readOnly value={`₹${r.amount}`}/></td>
                                                <td>
                                                    <div className="cell-flex">
                                                        <select className="custom-select" value={r.billAvailable?'Yes':'No'} onChange={e=>{const n=[...lodgings]; n[i].billAvailable=(e.target.value==='Yes'); if (!n[i].billAvailable) n[i].file=null; setLodgings(n)}}>
                                                            <option>No</option><option>Yes</option>
                                                        </select>
                                                        <input type="file" id={`h-f-${i}`} style={{display:'none'}} onChange={e => handleFileUpload(e.target.files[0], 'lodgings', i, setLodgings)}/>
                                                        {r.file ? (
                                                            <div onClick={(ev) => { ev.stopPropagation(); handleFilePreview(r.file, 'lodgings'); }} style={{cursor:'pointer', color:'#10b981'}} title="View Uploaded File"><CheckCircle size={14}/></div>
                                                        ) : (
                                                            <label htmlFor={`h-f-${i}`} style={{cursor:'pointer', color:'#f97316'}} title="Upload File"><Upload size={14}/></label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><div className="cell-flex"><button type="button" className="del-btn" onClick={()=>handleRemoveRow(setLodgings,i)}><Trash2 size={14}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="add-row-btn" onClick={() => handleAddRow(setLodgings, { fromDate:'', toDate:'', location:'', days:0, persons:0, ratePerPerson:0, amount:0, billAvailable:false })}>
                                    <Plus size={12}/> New row
                                </button>
                            </div>
                        </div>
                    )}

                    {visibleSections.conveyances && (
                        <div className="section-container">
                            <div className="sec-title">LOCAL CONVEYANCE  <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th className="center">DATE</th><th>FROM</th><th>TO</th><th className="center">MODE</th><th className="right">AMOUNT</th><th className="center">BILL</th><th></th></tr></thead>
                                    <tbody>
                                        {conveyances.map((r,i)=>(
                                            <tr key={i}>
                                                <td><input type="date" className="tbl-input center" value={r.date} onChange={e=>{const n=[...conveyances]; n[i].date=e.target.value; setConveyances(n)}}/></td>
                                                <td><input type="text" className="tbl-input" placeholder="Start" value={r.locationFrom} onChange={e=>{const n=[...conveyances]; n[i].locationFrom=e.target.value; setConveyances(n)}}/></td>
                                                <td><input type="text" className="tbl-input" placeholder="End" value={r.locationTo} onChange={e=>{const n=[...conveyances]; n[i].locationTo=e.target.value; setConveyances(n)}}/></td>
                                                <td><input type="text" className="tbl-input center" placeholder="Taxi" value={r.modeOfTravel} onChange={e=>{const n=[...conveyances]; n[i].modeOfTravel=e.target.value; setConveyances(n)}}/></td>
                                                <td><input type="number" className="tbl-input right" placeholder="0" value={r.amount||''} onChange={e=>{const n=[...conveyances]; n[i].amount=Number(e.target.value); setConveyances(n)}}/></td>
                                                <td>
                                                    <div className="cell-flex">
                                                        <select className="custom-select" value={r.ticketAvailable?'Yes':'No'} onChange={e=>{const n=[...conveyances]; n[i].ticketAvailable=(e.target.value==='Yes'); if (!n[i].ticketAvailable) n[i].file=null; setConveyances(n)}}>
                                                            <option>No</option><option>Yes</option>
                                                        </select>
                                                        <input type="file" id={`c-f-${i}`} style={{display:'none'}} onChange={e => handleFileUpload(e.target.files[0], 'conveyances', i, setConveyances)}/>
                                                        {r.file ? (
                                                            <div onClick={(ev) => { ev.stopPropagation(); handleFilePreview(r.file, 'conveyances'); }} style={{cursor:'pointer', color:'#10b981'}} title="View Uploaded File"><CheckCircle size={14}/></div>
                                                        ) : (
                                                            <label htmlFor={`c-f-${i}`} style={{cursor:'pointer', color:'#f97316'}} title="Upload File"><Upload size={14}/></label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><div className="cell-flex"><button type="button" className="del-btn" onClick={()=>handleRemoveRow(setConveyances,i)}><Trash2 size={14}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="add-row-btn" onClick={() => handleAddRow(setConveyances, { date:'', locationFrom:'', locationTo:'', modeOfTravel:'', amount:0, ticketAvailable:false })}>
                                    <Plus size={12}/> New row
                                </button>
                            </div>
                        </div>
                    )}

                    {visibleSections.foods && (
                        <div className="section-container">
                            <div className="sec-title">FOOD/PARKING  <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th className="center">DATE</th><th className="center">MORN</th><th className="center">AFT</th><th className="center">EVE</th><th className="center">NIGHT</th><th className="center">GST</th><th className="right">TOTAL</th><th className="center">BILL</th><th></th></tr></thead>
                                    <tbody>
                                        {foods.map((r,i)=>(
                                            <tr key={i}>
                                                <td><input type="date" className="tbl-input center" value={r.date} onChange={e=>{const n=[...foods]; n[i].date=e.target.value; setFoods(n)}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.morning||''} onChange={e=>{const n=[...foods]; n[i].morning=Number(e.target.value); n[i].total=(n[i].morning||0)+(n[i].afternoon||0)+(n[i].evening||0)+(n[i].night||0); setFoods(n)}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.afternoon||''} onChange={e=>{const n=[...foods]; n[i].afternoon=Number(e.target.value); n[i].total=(n[i].morning||0)+(n[i].afternoon||0)+(n[i].evening||0)+(n[i].night||0); setFoods(n)}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.evening||''} onChange={e=>{const n=[...foods]; n[i].evening=Number(e.target.value); n[i].total=(n[i].morning||0)+(n[i].afternoon||0)+(n[i].evening||0)+(n[i].night||0); setFoods(n)}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.night||''} onChange={e=>{const n=[...foods]; n[i].night=Number(e.target.value); n[i].total=(n[i].morning||0)+(n[i].afternoon||0)+(n[i].evening||0)+(n[i].night||0); setFoods(n)}}/></td>
                                                <td><input type="number" className="tbl-input center" placeholder="0" value={r.gst||''} onChange={e=>{const n=[...foods]; n[i].gst=Number(e.target.value); setFoods(n)}}/></td>
                                                <td><input type="text" className="tbl-input right" style={{background:'#f9fafb'}} readOnly value={`₹${r.total}`}/></td>
                                                <td>
                                                    <div className="cell-flex">
                                                        <select className="custom-select" value={r.billAvailable?'Yes':'No'} onChange={e=>{const n=[...foods]; n[i].billAvailable=(e.target.value==='Yes'); if (!n[i].billAvailable) n[i].file=null; setFoods(n)}}>
                                                            <option>No</option><option>Yes</option>
                                                        </select>
                                                        <input type="file" id={`f-f-${i}`} style={{display:'none'}} onChange={e => handleFileUpload(e.target.files[0], 'foods', i, setFoods)}/>
                                                        {r.file ? (
                                                            <div onClick={(ev) => { ev.stopPropagation(); handleFilePreview(r.file, 'foods'); }} style={{cursor:'pointer', color:'#10b981'}} title="View Uploaded File"><CheckCircle size={14}/></div>
                                                        ) : (
                                                            <label htmlFor={`f-f-${i}`} style={{cursor:'pointer', color:'#f97316'}} title="Upload File"><Upload size={14}/></label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><div className="cell-flex"><button type="button" className="del-btn" onClick={()=>handleRemoveRow(setFoods,i)}><Trash2 size={14}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="add-row-btn" onClick={() => handleAddRow(setFoods, { date:'', morning:0, afternoon:0, evening:0, night:0, gst:0, sgst:0, total:0, billAvailable:false })}>
                                    <Plus size={12}/> New row
                                </button>
                            </div>
                        </div>
                    )}

                    {visibleSections.others && (
                        <div className="section-container">
                            <div className="sec-title">OTHERS DETAILS <FileText size={14}/></div>
                            <div className="data-wrapper">
                                <table className="data-table">
                                    <thead><tr><th className="center">DATE</th><th>DESCRIPTION</th><th className="right">AMOUNT</th><th className="center">BILL</th><th></th></tr></thead>
                                    <tbody>
                                        {others.map((r,i)=>(
                                            <tr key={i}>
                                                <td><input type="date" className="tbl-input center" value={r.date} onChange={e=>{const n=[...others]; n[i].date=e.target.value; setOthers(n)}}/></td>
                                                <td><input type="text" className="tbl-input" placeholder="Details" value={r.description} onChange={e=>{const n=[...others]; n[i].description=e.target.value; setOthers(n)}}/></td>
                                                <td><input type="number" className="tbl-input right" placeholder="0" value={r.amount||''} onChange={e=>{const n=[...others]; n[i].amount=Number(e.target.value); setOthers(n)}}/></td>
                                                <td>
                                                    <div className="cell-flex">
                                                        <select className="custom-select" value={r.billAvailable?'Yes':'No'} onChange={e=>{const n=[...others]; n[i].billAvailable=(e.target.value==='Yes'); if (!n[i].billAvailable) n[i].file=null; setOthers(n)}}>
                                                            <option>No</option><option>Yes</option>
                                                        </select>
                                                        <input type="file" id={`o-f-${i}`} style={{display:'none'}} onChange={e => handleFileUpload(e.target.files[0], 'others', i, setOthers)}/>
                                                        {r.file ? (
                                                            <div onClick={(ev) => { ev.stopPropagation(); handleFilePreview(r.file, 'others'); }} style={{cursor:'pointer', color:'#10b981'}} title="View Uploaded File"><CheckCircle size={14}/></div>
                                                        ) : (
                                                            <label htmlFor={`o-f-${i}`} style={{cursor:'pointer', color:'#f97316'}} title="Upload File"><Upload size={14}/></label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td><div className="cell-flex"><button type="button" className="del-btn" onClick={()=>handleRemoveRow(setOthers,i)}><Trash2 size={14}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="add-row-btn" onClick={() => handleAddRow(setOthers, { date:'', description:'', amount:0, billAvailable:false })}>
                                    <Plus size={12}/> New row
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* RIGHT COLUMN: PODS */}
                {isPodVisible && (
                    <div className="pods-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Tab Switcher */}
                        <div className="pod-tabs">
                            <div className={`pod-tab ${activePod === 'summary' ? 'active' : 'inactive'}`} onClick={() => setActivePod('summary')}>
                                Summary
                            </div>
                            <div className={`pod-tab ${activePod === 'preview' ? 'active' : 'inactive'}`} onClick={() => setActivePod('preview')}>
                                Preview
                            </div>
                        </div>

                        {/* Active Pod Container */}
                        <div className="node-card" style={{ flex: 1, marginBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px' }}>
                            
                            {activePod === 'summary' && (
                                <div className="pod-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                    <div style={{ flexShrink: 0 }}>
                                        <h2 className="pod-header" style={{ fontSize: '14px', marginBottom: '0' }}><FileText size={15}/> Summary </h2>
                                    </div>

                                    <div className="inner-scroll" style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', paddingRight: '12px', minHeight: 0 }}>
                                        {Object.entries(totals.categories).map(([key, data]) => {
                                            if (data.total === 0 && data.items.length === 0) return null;
                                            
                                            const labels = {
                                                tickets: 'Tickets Total',
                                                lodgings: 'Lodging Total',
                                                conveyances: 'Local Total',
                                                foods: 'Food Total',
                                                others: 'Others Total',
                                                wages: 'Staff Wages Total'
                                            };
                                            const isExpanded = expandedCategories[key];

                                            return (
                                                <div key={key} style={{ marginBottom: '8px' }}>
                                                    <div 
                                                        onClick={() => toggleSummaryCategory(key)}
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', transition: '0.2s' }}
                                                    >
                                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{labels[key]}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>₹{data.total.toLocaleString()}</span>
                                                            {isExpanded ? <ChevronUp size={12} color="#f97316"/> : <ChevronDown size={12} color="#94a3b8"/>}
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div style={{ padding: '8px 12px', borderLeft: '2px solid #fed7aa', marginLeft: '10px', marginTop: '2px', animation: 'fadeIn 0.2s ease-out' }}>
                                                            {data.items.map((item, idx) => (
                                                                <div key={idx} style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <span style={{ flex: 1, paddingRight: '8px' }}>
                                                                        • {key === 'tickets' && `${item.mode || 'Travel'} (${item.travelFrom || '?'} → ${item.travelTo || '?'})`}
                                                                        {key === 'lodgings' && `${item.location || 'Stay'} (${item.days || 0} Nights)`}
                                                                        {key === 'conveyances' && `${item.modeOfTravel || 'Local'} (${item.locationFrom || '?'} → ${item.locationTo || '?'})`}
                                                                        {key === 'foods' && `Food Bill (${item.date || 'No Date'})`}
                                                                        {key === 'others' && `${item.description || 'Other Item'}`}
                                                                        {key === 'wages' && `Wage: ${item.name || 'Worker'}`}
                                                                    </span>
                                                                    <span style={{ fontWeight: 900, color: '#475569', whiteSpace: 'nowrap' }}>₹{(item.amount || item.total || item.totalAmount || 0).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="divider" style={{ margin: '0 0 12px 0', flexShrink: 0 }}></div>

                                    <div style={{ background: '#fdfcfb', border: '2px solid #fed7aa', borderRadius: '16px', padding: '12px 16px', marginBottom: '12px', flexShrink: 0 }}>
                                        <div className="calc-row" style={{ marginBottom: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#f97316', textTransform: 'uppercase' }}>Gross Total</span>
                                            <span style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>₹{totals.grossTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row" style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #fed7aa' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Counts ({totals.itemCount})</span>
                                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#64748b' }}>Nodes</span>
                                        </div>
                                        <div style={{ height: '32px', position: 'relative', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid #fed7aa' }}>
                                            <label className="adv-label" style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', fontStyle: 'italic', textTransform: 'uppercase' }}>ADVANCE (-)</label>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '16px', fontWeight: 900, color: '#cbd5e1' }}>₹</span>
                                                <input 
                                                    type="number" 
                                                    className="adv-input"
                                                    style={{ paddingLeft: '14px', marginBottom: 0, fontSize: '22px', border: 'none', height: '30px' }}
                                                    value={formData.advanceAmount || ''} 
                                                    onChange={e => setFormData({...formData, advanceAmount: e.target.value})} 
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        {totals.advance > totals.grossTotal ? (
                                            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="adv-label" style={{ color: '#ef4444', fontSize: '13px', fontWeight: 900, marginBottom: 0, fontStyle: 'normal' }}>AMOUNT TO RETURN</div>
                                                <div className="total-owed" style={{ color: '#ef4444', marginBottom: 0, fontSize: '26px' }}>₹{(totals.advance - totals.grossTotal).toLocaleString()}</div>
                                            </div>
                                        ) : (
                                            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce3', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="adv-label" style={{ color: '#16a34a', fontSize: '13px', fontWeight: 900, marginBottom: 0, fontStyle: 'normal' }}>TOTAL CLAIMS</div>
                                                <div className="total-owed" style={{ color: '#16a34a', marginBottom: 0, fontSize: '26px' }}>₹{(totals.grossTotal - totals.advance).toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>

                                    <button type="button" onClick={handleSubmit} disabled={loading} className="btn-submit" style={{ flexShrink: 0, padding: '12px' }}>
                                        {loading ? 'Processing...' : <><Send size={14}/> Submit Form</>}
                                    </button>
                                </div>
                            )}

                            {activePod === 'preview' && (
                                <div className="pod-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h2 className="pod-header"><FileText size={18}/> Bill PREVIEW</h2>
                                    
                                    {/* Dynamic Category Tabs */}
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                                        {Object.entries(galleryData).map(([cat, list]) => {
                                            if (list.length === 0) return null;
                                            const labels = { tickets: 'Tickets', lodgings: 'Lodging', conveyances: 'Local', foods: 'Food', others: 'Others' };
                                            const isActive = previewCategory === cat;
                                            return (
                                                <button 
                                                    key={cat} 
                                                    type="button" 
                                                    onClick={() => { setPreviewCategory(cat); setPreviewIndex(0); }}
                                                    style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 900, borderRadius: '8px', textTransform: 'uppercase', cursor: 'pointer', border: '1px solid',
                                                            background: isActive ? '#f97316' : '#f3f4f6', color: isActive ? 'white' : '#6b7280', borderColor: isActive ? '#ea580c' : '#e5e7eb', transition: '0.2s' }}>
                                                    {labels[cat]} ({list.length})
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="verify-zone" style={{ marginTop: '0', flex: 1 }}>
                                        {activeGalleryItem && verificationFile ? (
                                            <>
                                                {/* Slider Arrows */}
                                                {activeGalleryList.length > 1 && (
                                                    <>
                                                        <button type="button" onClick={() => setPreviewIndex(prev => prev > 0 ? prev - 1 : activeGalleryList.length - 1)} style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex: 10 }}>
                                                            <ChevronLeft size={20}/>
                                                        </button>
                                                        <button type="button" onClick={() => setPreviewIndex(prev => prev < activeGalleryList.length - 1 ? prev + 1 : 0)} style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex: 10 }}>
                                                            <ChevronRight size={20}/>
                                                        </button>
                                                    </>
                                                )}

                                                {/* File-Type dependent display logic */}
                                                {(typeof verificationFile === 'string' && verificationFile.startsWith('data:image/')) ? (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img 
                                                            src={verificationFile} 
                                                            className="vz-image" 
                                                            alt="Verify Node" 
                                                            style={{ objectFit: 'contain' }} 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsFullscreen(true)} 
                                                            style={{ position:'absolute', top:'12px', left:'12px', background:'rgba(0,0,0,0.6)', color:'white', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex: 10 }} 
                                                            title="Full View"
                                                        >
                                                            <Maximize size={12}/>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="vz-content">
                                                        <FileText size={48} style={{ opacity: 0.5 }}/>
                                                        <span style={{ fontSize: '11px', fontWeight: 800 }}>{activeGalleryItem?.fileName || 'File Document'}</span>
                                                    </div>
                                                )}
                                                <button type="button" onClick={handleRemovePreviewFile} className="vz-close" style={{ zIndex: 10 }} title="Delete File"><Trash2 size={12}/></button>
                                            </>
                                        ) : (
                                            <div className="vz-content">
                                                <Upload strokeWidth={1.5} size={32} style={{ opacity: 0.6 }} />
                                                <span className="vz-text">No Images Available</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Context Details */}
                                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <h4 className="nd-title">Details</h4>
                                        <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px' }}>
                                            {activeGalleryItem ? (
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {previewCategory === 'tickets' && <><span style={{color: '#ea580c'}}>{activeGalleryItem.date || 'No Date'}</span> | {activeGalleryItem.travelFrom || '?'} <span style={{margin:'0 4px'}}>→</span> {activeGalleryItem.travelTo || '?'} | ₹{activeGalleryItem.amount || 0}</>}
                                                    {previewCategory === 'lodgings' && <><span style={{color: '#ea580c'}}>{activeGalleryItem.location || 'No Location'}</span> | {activeGalleryItem.days || 0} Nights | ₹{activeGalleryItem.amount || 0}</>}
                                                    {previewCategory === 'conveyances' && <><span style={{color: '#ea580c'}}>{activeGalleryItem.date || 'No Date'}</span> | {activeGalleryItem.locationFrom || '?'} <span style={{margin:'0 4px'}}>→</span> {activeGalleryItem.locationTo || '?'} | ₹{activeGalleryItem.amount || 0}</>}
                                                    {previewCategory === 'foods' && <><span style={{color: '#ea580c'}}>{activeGalleryItem.date || 'No Date'}</span> | Total ₹{activeGalleryItem.total || 0}</>}
                                                    {previewCategory === 'others' && <><span style={{color: '#ea580c'}}>{activeGalleryItem.date || 'No Date'}</span> | {activeGalleryItem.description || 'No Desc'} | ₹{activeGalleryItem.amount || 0}</>}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Select an active bill to view its contextual data.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </form>

            {isFullscreen && verificationFile && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Maximize size={20} color="#f97316"/> FULL VIEW MODE
                        </h3>
                        <button type="button" onClick={() => setIsFullscreen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                            <X size={16}/> CLOSE
                        </button>
                    </div>
                    
                    <div style={{ padding: '24px', borderRadius: '16px', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxWidth: '1200px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={verificationFile} alt="Full View Receipt" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', userSelect: 'none' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
