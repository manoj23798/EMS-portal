import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Calculator, Paperclip, FileText, X } from "lucide-react";
import api from '../../services/api';

export default function ReimbursementApply() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Master Form Data
    const [formData, setFormData] = useState({
        reasonForTravel: '',
        travelStartDate: '',
        travelEndDate: '',
        advanceAmount: 0
    });

    // Dynamic Lists
    const [tickets, setTickets] = useState([{ date: '', travelFrom: '', travelTo: '', mode: '', amountExpression: '', amount: 0, person: '', ticketAvailable: false }]);
    const [lodgings, setLodgings] = useState([{ dateRange: '', location: '', days: 0, persons: 0, ratePerPerson: 0, amount: 0, billAvailable: false }]);
    const [conveyances, setConveyances] = useState([{ date: '', locationFrom: '', locationTo: '', modeOfTravel: '', amount: 0, ticketAvailable: false }]);
    const [foods, setFoods] = useState([{ date: '', morning: 0, afternoon: 0, evening: 0, night: 0, total: 0, gst: 0, sgst: 0, billAvailable: false }]);
    const [others, setOthers] = useState([{ date: '', description: '', amount: 0, billAvailable: false }]);
    const [wages, setWages] = useState([{ name: '', fromDate: '', toDate: '', daysWorked: 0, perDaySalary: 0, totalAmount: 0 }]);

    // Evaluates a string math expression like "25+715" securely
    const evaluateExpression = (expr) => {
        try {
            // Remove all non-math characters
            const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
            if (!sanitized) return 0;
            // eslint-disable-next-line
            const val = Function(`'use strict'; return (${sanitized})`)();
            return isNaN(val) ? 0 : Number(val);
        } catch (e) {
            return 0;
        }
    };

    // Generic Handlers
    const handleAddRow = (setter, emptyObj) => setter(prev => [...prev, emptyObj]);
    const handleRemoveRow = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

    const calculateTotals = () => {
        const ticketTotal = tickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const lodgingTotal = lodgings.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
        const conveyTotal = conveyances.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        const foodTotal = foods.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
        const otherTotal = others.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const wageTotal = wages.reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);
        
        const totalClaimed = ticketTotal + lodgingTotal + conveyTotal + foodTotal + otherTotal + wageTotal;
        const advance = Number(formData.advanceAmount) || 0;
        const amountToReturn = advance - totalClaimed;

        return { ticketTotal, lodgingTotal, conveyTotal, foodTotal, otherTotal, wageTotal, totalClaimed, advance, amountToReturn };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = {
            ...formData,
            tickets: tickets.filter(t => t.date || t.amountExpression), // Simple filter for non-empty
            lodgings: lodgings.filter(l => l.location || l.amount),
            conveyances: conveyances.filter(c => c.locationFrom || c.amount),
            foods: foods.filter(f => f.date || f.total),
            others: others.filter(o => o.description || o.amount),
            wages: wages.filter(w => w.name || w.totalAmount)
        };

        try {
            await api.post('/reimbursement/create', payload);
            setSuccess('Reimbursement form submitted successfully!');
            // Reset form could go here
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit reimbursement form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reimbursement-form page-content">
            <div className="mb-6 flex flex-col items-start border-b-2 border-gray-200 pb-2">
                <h2 className="text-lg font-bold tracking-widest text-gray-800 mt-1 uppercase">REIMBURSEMENT FORM</h2>
            </div>

            {error && <div className="bg-red-50 border border-red-200 p-3 mb-4 text-red-600 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 p-3 mb-4 text-green-600 text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Master Info Section */}
                {/* MASTER INFO (Reason & Travel Period) */}
            <div className="card mb-6" style={{ marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="card-body">
                    <div className="form-grid" style={{ gap: '16px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>Reason for Travel</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g. RNAIPL PLANT VISIT"
                                value={formData.reasonForTravel} 
                                onChange={e => setFormData({...formData, reasonForTravel: e.target.value})} 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>Travel Start Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={formData.travelStartDate} 
                                onChange={e => setFormData({...formData, travelStartDate: e.target.value})} 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>Travel End Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={formData.travelEndDate} 
                                onChange={e => setFormData({...formData, travelEndDate: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
            </div>

                {/* 2. TICKET DETAILS */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">TICKET DETAILS</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.ticketTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28">DATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">TRAVEL FROM</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">TRAVEL TO</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-24">MODE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-32 text-center">EXPRESSION</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-24 text-center">AMOUNT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-20 text-center">PERSON</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">BILL</th>
                                    <th className="border border-gray-300 p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {tickets.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.date} onChange={e => { const n = [...tickets]; n[i].date = e.target.value; setTickets(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.travelFrom} onChange={e => { const n = [...tickets]; n[i].travelFrom = e.target.value; setTickets(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.travelTo} onChange={e => { const n = [...tickets]; n[i].travelTo = e.target.value; setTickets(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none text-center" placeholder="e.g. BUS" value={row.mode} onChange={e => { const n = [...tickets]; n[i].mode = e.target.value.toUpperCase(); setTickets(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none text-center bg-yellow-50/30" placeholder="25+715" value={row.amountExpression} 
                                            onChange={e => { 
                                                const n = [...tickets]; 
                                                n[i].amountExpression = e.target.value; 
                                                n[i].amount = evaluateExpression(e.target.value);
                                                setTickets(n); 
                                            }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-2">₹{row.amount.toFixed(2)}</td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-1 py-1 focus:outline-none text-center" value={row.person} onChange={e => { const n = [...tickets]; n[i].person = e.target.value; setTickets(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-3.5 h-3.5" checked={row.ticketAvailable} onChange={e => { const n = [...tickets]; n[i].ticketAvailable = e.target.checked; setTickets(n); }} />
                                                    <label className="cursor-pointer text-gray-400 hover:text-[#D84315] transition-colors">
                                                        <input type="file" className="hidden" onChange={e => { const n = [...tickets]; n[i].file = e.target.files[0]; setTickets(n); }} />
                                                        <Paperclip size={12} className={row.file ? "text-[#D84315] fill-[#D84315]/10" : ""} />
                                                    </label>
                                                </div>
                                                {row.file && <span className="text-[8px] text-gray-500 truncate max-w-[50px]">{row.file.name}</span>}
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setTickets, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setTickets, { date: '', travelFrom: '', travelTo: '', mode: '', amountExpression: '', amount: 0, person: '', ticketAvailable: false })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 3. LODGING & BOARDING */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">LODGING AND BOARDING DETAILS</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.lodgingTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">DATE RANGE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">LOCATION</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-20 text-center">DAYS</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-20 text-center">PERSONS</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">RATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">AMOUNT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">BILL</th>
                                    <th className="border border-gray-300 p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {lodgings.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none text-center" placeholder="09-02 to 13-02" value={row.dateRange} onChange={e => { const n = [...lodgings]; n[i].dateRange = e.target.value; setLodgings(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.location} onChange={e => { const n = [...lodgings]; n[i].location = e.target.value; setLodgings(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.days} onChange={e => { const n = [...lodgings]; n[i].days = Number(e.target.value); n[i].amount = n[i].days * n[i].persons * n[i].ratePerPerson; setLodgings(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.persons} onChange={e => { const n = [...lodgings]; n[i].persons = Number(e.target.value); n[i].amount = n[i].days * n[i].persons * n[i].ratePerPerson; setLodgings(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-2 py-1 focus:outline-none text-right" value={row.ratePerPerson} onChange={e => { const n = [...lodgings]; n[i].ratePerPerson = Number(e.target.value); n[i].amount = n[i].days * n[i].persons * n[i].ratePerPerson; setLodgings(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-2">₹{row.amount.toFixed(2)}</td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input type="checkbox" className="w-3.5 h-3.5" checked={row.billAvailable} onChange={e => { const n = [...lodgings]; n[i].billAvailable = e.target.checked; setLodgings(n); }} />
                                                <label className="cursor-pointer text-gray-400 hover:text-[#D84315] transition-colors">
                                                    <input type="file" className="hidden" onChange={e => { const n = [...lodgings]; n[i].file = e.target.files[0]; setLodgings(n); }} />
                                                    <Paperclip size={12} className={row.file ? "text-[#D84315]" : ""} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setLodgings, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setLodgings, { dateRange: '', location: '', days: 0, persons: 0, ratePerPerson: 0, amount: 0, billAvailable: false })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 4. LOCAL CONVEYANCE */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">LOCAL CONVEYANCE</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.conveyTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">DATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">LOCATION FROM</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">LOCATION TO</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-32 text-center">MODE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">AMOUNT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">BILL</th>
                                    <th className="border border-gray-300 p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {conveyances.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.date} onChange={e => { const n = [...conveyances]; n[i].date = e.target.value; setConveyances(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.locationFrom} onChange={e => { const n = [...conveyances]; n[i].locationFrom = e.target.value; setConveyances(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.locationTo} onChange={e => { const n = [...conveyances]; n[i].locationTo = e.target.value; setConveyances(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none text-center" value={row.modeOfTravel} onChange={e => { const n = [...conveyances]; n[i].modeOfTravel = e.target.value; setConveyances(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-2">
                                            <input type="number" className="w-full bg-transparent text-right focus:outline-none" value={row.amount} onChange={e => { const n = [...conveyances]; n[i].amount = Number(e.target.value); setConveyances(n); }} />
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input type="checkbox" className="w-3.5 h-3.5" checked={row.ticketAvailable} onChange={e => { const n = [...conveyances]; n[i].ticketAvailable = e.target.checked; setConveyances(n); }} />
                                                <label className="cursor-pointer text-gray-400 hover:text-[#D84315] transition-colors">
                                                    <input type="file" className="hidden" onChange={e => { const n = [...conveyances]; n[i].file = e.target.files[0]; setConveyances(n); }} />
                                                    <Paperclip size={12} className={row.file ? "text-[#D84315]" : ""} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setConveyances, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setConveyances, { date: '', locationFrom: '', locationTo: '', modeOfTravel: '', amount: 0, ticketAvailable: false })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 5. FOOD/PARKING */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">FOOD/PARKING</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.foodTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">DATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">MORN</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">AFT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">EVE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">NIGHT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-24 text-center">TOTAL</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">GST</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">SGST</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-12 text-center">BILL</th>
                                    <th className="border border-gray-300 p-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {foods.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.date} onChange={e => { const n = [...foods]; n[i].date = e.target.value; setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.morning} onChange={e => { const n = [...foods]; n[i].morning = Number(e.target.value); n[i].total = n[i].morning + n[i].afternoon + n[i].evening + n[i].night; setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.afternoon} onChange={e => { const n = [...foods]; n[i].afternoon = Number(e.target.value); n[i].total = n[i].morning + n[i].afternoon + n[i].evening + n[i].night; setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.evening} onChange={e => { const n = [...foods]; n[i].evening = Number(e.target.value); n[i].total = n[i].morning + n[i].afternoon + n[i].evening + n[i].night; setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.night} onChange={e => { const n = [...foods]; n[i].night = Number(e.target.value); n[i].total = n[i].morning + n[i].afternoon + n[i].evening + n[i].night; setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-1">₹{row.total.toFixed(2)}</td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.gst} onChange={e => { const n = [...foods]; n[i].gst = Number(e.target.value); setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.sgst} onChange={e => { const n = [...foods]; n[i].sgst = Number(e.target.value); setFoods(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input type="checkbox" className="w-3.5 h-3.5" checked={row.billAvailable} onChange={e => { const n = [...foods]; n[i].billAvailable = e.target.checked; setFoods(n); }} />
                                                <label className="cursor-pointer text-gray-400 hover:text-[#D84315] transition-colors">
                                                    <input type="file" className="hidden" onChange={e => { const n = [...foods]; n[i].file = e.target.files[0]; setFoods(n); }} />
                                                    <Paperclip size={12} className={row.file ? "text-[#D84315]" : ""} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setFoods, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setFoods, { date: '', morning: 0, afternoon: 0, evening: 0, night: 0, total: 0, gst: 0, sgst: 0, billAvailable: false })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 6. OTHERS */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">OTHERS</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.otherTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">DATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">DESCRIPTION</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-32 text-center">AMOUNT</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-16 text-center">BILL</th>
                                    <th className="border border-gray-300 p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {others.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.date} onChange={e => { const n = [...others]; n[i].date = e.target.value; setOthers(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.description} onChange={e => { const n = [...others]; n[i].description = e.target.value; setOthers(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-2">
                                            <input type="number" className="w-full bg-transparent text-right focus:outline-none" value={row.amount} onChange={e => { const n = [...others]; n[i].amount = Number(e.target.value); setOthers(n); }} />
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input type="checkbox" className="w-3.5 h-3.5" checked={row.billAvailable} onChange={e => { const n = [...others]; n[i].billAvailable = e.target.checked; setOthers(n); }} />
                                                <label className="cursor-pointer text-gray-400 hover:text-[#D84315] transition-colors">
                                                    <input type="file" className="hidden" onChange={e => { const n = [...others]; n[i].file = e.target.files[0]; setOthers(n); }} />
                                                    <Paperclip size={12} className={row.file ? "text-[#D84315]" : ""} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setOthers, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setOthers, { date: '', description: '', amount: 0, billAvailable: false })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 7. WAGES */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wide">WAGES</h3>
                        <div className="text-[11px] text-gray-500 font-medium">Sub-total: ₹{totals.wageTotal.toFixed(2)}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-12 text-center text-[10px]">S.NO</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315]">NAME</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">FROM</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">TO</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-20 text-center">DAYS</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">RATE</th>
                                    <th className="border border-gray-300 p-2 font-bold text-[#D84315] w-28 text-center">AMOUNT</th>
                                    <th className="border border-gray-300 p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {wages.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="border border-gray-300 p-1 text-center text-gray-500">{i + 1}</td>
                                        <td className="border border-gray-300 p-1"><input type="text" className="w-full px-2 py-1 focus:outline-none" value={row.name} onChange={e => { const n = [...wages]; n[i].name = e.target.value; setWages(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.fromDate} onChange={e => { const n = [...wages]; n[i].fromDate = e.target.value; setWages(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="date" className="w-full px-1 py-1 focus:outline-none text-center" value={row.toDate} onChange={e => { const n = [...wages]; n[i].toDate = e.target.value; setWages(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.daysWorked} onChange={e => { const n = [...wages]; n[i].daysWorked = Number(e.target.value); n[i].totalAmount = n[i].daysWorked * n[i].perDaySalary; setWages(n); }} /></td>
                                        <td className="border border-gray-300 p-1"><input type="number" className="w-full px-1 py-1 focus:outline-none text-center" value={row.perDaySalary} onChange={e => { const n = [...wages]; n[i].perDaySalary = Number(e.target.value); n[i].totalAmount = n[i].daysWorked * n[i].perDaySalary; setWages(n); }} /></td>
                                        <td className="border border-gray-300 p-1 text-right font-semibold bg-gray-50 px-2">₹{row.totalAmount.toFixed(2)}</td>
                                        <td className="border border-gray-300 p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveRow(setWages, i)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => handleAddRow(setWages, { name: '', fromDate: '', toDate: '', daysWorked: 0, perDaySalary: 0, totalAmount: 0 })} className="add-line-btn">
                            <Plus size={12} className="mr-1" /> ADD NEW LINE
                        </button>
                    </div>
                </section>

                {/* 8. TOTAL AMOUNT CLAIMED (FINAL SUBMISSION SUMMARY) */}
                <section className="mt-8 mb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px] border-collapse" style={{ border: '2px solid #000' }}>
                            <thead>
                                <tr>
                                    <th colSpan="10" className="p-2 text-center text-[14px] font-black uppercase text-black border-2 border-black" style={{ backgroundColor: '#FFBF00' }}>
                                        TOTAL AMOUNT CLAIMED
                                    </th>
                                </tr>
                                <tr className="bg-white text-black text-center">
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Date</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Ticket<br/>Details</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap lg:w-32">Lodging &<br/>Boarding Details</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Local<br/>Con</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Food</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Others</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Wages</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap">Amount</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap w-24">Advance<br/>Amount</th>
                                    <th className="border border-black p-2 font-bold whitespace-nowrap w-24">Amount to<br/>be return</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-center font-semibold text-black">
                                <tr>
                                    <td className="border border-black p-2 text-xs">
                                        {formData.fromDate ? `${formData.fromDate.split('-').reverse().join('-')} to\n${formData.toDate.split('-').reverse().join('-')}` : '-'}
                                    </td>
                                    <td className="border border-black p-2">{totals.ticketTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.lodgingTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.conveyTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.foodTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.othersTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.wageTotal.toFixed(0)}</td>
                                    <td className="border border-black p-2">{totals.totalClaimed.toFixed(0)}</td>
                                    <td className="border border-black p-0 bg-white align-top relative h-full">
                                        <input 
                                            type="number" 
                                            className="w-full h-full min-h-[40px] px-1 py-2 text-center font-bold bg-white focus:outline-none focus:bg-gray-50" 
                                            value={formData.advanceAmount || ''} 
                                            onChange={e => setFormData({...formData, advanceAmount: Number(e.target.value)})} 
                                            placeholder="0"
                                            style={{ color: '#000' }}
                                        />
                                    </td>
                                    <td className="border border-black p-2">
                                        {totals.amountToReturn.toFixed(0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={() => window.location.reload()} className="px-6 py-2.5 text-black font-bold uppercase tracking-wider text-[11px] border-2 border-black hover:bg-gray-100 transition-all bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none" style={{ borderRadius: '0' }}>
                            RESET
                        </button>
                        <button type="submit" disabled={loading} className="px-8 py-2.5 text-white font-bold uppercase tracking-wider text-[11px] border-2 border-black flex items-center hover:bg-[#b03612] transition-all disabled:bg-gray-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none" style={{ backgroundColor: '#D84315', borderRadius: '0' }}>
                            {loading ? <span className="animate-spin mr-3 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Send size={14} className="mr-2" />}
                            SUBMIT CLAIM
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}
