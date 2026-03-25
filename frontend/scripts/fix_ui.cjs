const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/reimbursement/ReimbursementApply.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Container
content = content.replace(
    '<div className="bg-white p-8 max-w-[1400px] mx-auto min-h-screen font-sans text-gray-900">',
    '<div className="bg-white p-8 max-w-[1300px] mx-auto font-sans text-[13px] text-gray-900 border border-gray-300 shadow-md my-8 rounded-sm">'
);

// Header
content = content.replace(
    '<div className="text-center mb-6 pb-2 border-b-2 border-gray-200">',
    '<div className="mb-6 flex flex-col items-start border-b-2 border-gray-200 pb-2">'
);
content = content.replace(
    '<h1 className="text-3xl font-bold" style={{ color: \'#D84315\' }}>Elintsys</h1>',
    '<h1 className="text-2xl font-bold tracking-tight" style={{ color: \'#D84315\' }}>Elintsys</h1>'
);
content = content.replace(
    '<h2 className="text-sm font-semibold tracking-widest text-gray-800 mt-1">REIMBURSEMENT FORM</h2>',
    '<h2 className="text-lg font-bold tracking-widest text-gray-800 mt-1 uppercase">REIMBURSEMENT FORM</h2>'
);

// Form grid layout for top master info
const oldMasterInfo = `<div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Reason for Travel</label>
                        <input type="text" className="w-full border-b border-gray-400 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.reasonForTravel} onChange={e => setFormData({...formData, reasonForTravel: e.target.value})} placeholder="e.g. RNAIPL PLANT VISIT" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Travel Date (From - To)</label>
                        <div className="flex gap-2 items-center">
                            <input type="date" className="border-b border-gray-400 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.travelStartDate} onChange={e => setFormData({...formData, travelStartDate: e.target.value})} />
                            <span className="text-xs font-medium text-gray-500">to</span>
                            <input type="date" className="border-b border-gray-400 bg-transparent px-1 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.travelEndDate} onChange={e => setFormData({...formData, travelEndDate: e.target.value})} />
                        </div>
                    </div>
                </div>`;

const newMasterInfo = `<div className="mb-8 space-y-4 max-w-2xl">
                    <div className="flex items-center">
                        <label className="w-48 text-sm font-semibold text-gray-700">Reason for Travel</label>
                        <input type="text" className="flex-1 border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.reasonForTravel} onChange={e => setFormData({...formData, reasonForTravel: e.target.value})} placeholder="e.g. RNAIPL PLANT VISIT" />
                    </div>
                    <div className="flex items-center">
                        <label className="w-48 text-sm font-semibold text-gray-700">Travel Date (From - To)</label>
                        <div className="flex items-center gap-2 flex-1">
                            <input type="date" className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.travelStartDate} onChange={e => setFormData({...formData, travelStartDate: e.target.value})} />
                            <span className="text-sm font-medium text-gray-600">to</span>
                            <input type="date" className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#D84315]" required value={formData.travelEndDate} onChange={e => setFormData({...formData, travelEndDate: e.target.value})} />
                        </div>
                    </div>
                </div>`;

content = content.replace(oldMasterInfo, newMasterInfo);

// Replace transparent inputs with subtle bordered inputs globally
content = content.replace(/className="w-full bg-transparent px-1 py-1 focus:outline-none focus:bg-white"/g, 'className="w-full bg-white px-2 py-1 border border-gray-300 focus:outline-none focus:border-[#D84315] focus:shadow-sm"');
content = content.replace(/border-r border-gray-200/g, 'border border-gray-300'); // Full grid lines for body td
content = content.replace(/border-r border-gray-300/g, 'border-r border-gray-300 border-b'); // Update th to have borders
content = content.replace(/ className="bg-\[#fcfcfc\] border-b border-gray-300"/g, ' className="bg-gray-50 border-y border-gray-300"'); // thead borders

// Change section headers to not look like they are floating
content = content.replace(/<h3 className="text-xs font-bold text-gray-700 uppercase mb-2">([^<]+)<\/h3>/g, '<h3 className="text-sm font-bold text-black uppercase mb-1">$1</h3>');

// Final block total amounts
content = content.replace(/className="w-full text-center bg-transparent py-2 border-none focus:outline-none font-bold"/g, 'className="w-24 text-center bg-white border border-gray-300 py-1 focus:outline-none font-bold mx-auto block"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('UI fix complete!');
