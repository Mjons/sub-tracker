import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { addMonths, addYears, differenceInDays, startOfDay, isBefore, isAfter } from 'date-fns';
import { Trash2, Plus, DollarSign, Download, Upload, Pencil, Check, X, Ban } from 'lucide-react';

// CSS for the calendar library
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup Calendar Localizer
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Colors for the color picker
const PRESET_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

function App() {
  const [subs, setSubs] = useState(() => {
    const saved = localStorage.getItem('my-subs');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    cycle: 'monthly' // or 'yearly'
  });

  const [editingColor, setEditingColor] = useState(null); // Track which sub color is being edited
  const [editingItem, setEditingItem] = useState(null); // Track which sub is being edited
  const [editForm, setEditForm] = useState({ name: '', price: '', cycle: '', startDate: '' }); // Temporary edit values

  // Save to local storage whenever subs change
  useEffect(() => {
    localStorage.setItem('my-subs', JSON.stringify(subs));
  }, [subs]);

  // Get a random color from the preset colors
  const getRandomColor = () => {
    return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
  };

  // --- LOGIC: Transform Subscriptions into Calendar Events ---
  const generateEvents = () => {
    const events = [];
    // We only want to generate events for the current viewing window roughly
    // For simplicity, let's generate events for the current year +/- 1 year
    const today = new Date();
    
    subs.forEach(sub => {
      let currentCycleStart = startOfDay(new Date(sub.startDate));
      const loopLimit = addYears(today, 1); // Generate up to next year

      // Prevent infinite loops if dates are weird
      let safeGuard = 0; 

      while (isBefore(currentCycleStart, loopLimit) && safeGuard < 100) {
        let nextCycleStart;
        if (sub.cycle === 'monthly') {
          nextCycleStart = addMonths(currentCycleStart, 1);
        } else {
          nextCycleStart = addYears(currentCycleStart, 1);
        }

        // Create the event bar (Visual representation)
        // It starts at the cycle start and ends right before the renewal
        events.push({
          title: `${sub.name} ($${sub.price})`,
          start: currentCycleStart,
          end: nextCycleStart, // Visual bar ends here
          resource: sub,
        });

        currentCycleStart = nextCycleStart;
        safeGuard++;
      }
    });
    return events;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const newSub = {
      id: Date.now(),
      ...formData,
      price: parseFloat(formData.price),
      color: getRandomColor() // Assign random color
    };

    setSubs([...subs, newSub]);
    // Reset form
    setFormData({ ...formData, name: '', price: '' });
  };

  const handleColorChange = (id, newColor) => {
    setSubs(subs.map(sub => sub.id === id ? { ...sub, color: newColor } : sub));
    setEditingColor(null); // Close the color picker after selection
  };

  const handleDelete = (id) => {
    setSubs(subs.filter(s => s.id !== id));
  };

  // Toggle cancelled status
  const handleToggleCancelled = (id) => {
    setSubs(subs.map(sub =>
      sub.id === id
        ? { ...sub, cancelled: !sub.cancelled }
        : sub
    ));
  };

  // Start editing a subscription
  const handleStartEdit = (sub) => {
    setEditingItem(sub.id);
    setEditForm({ name: sub.name, price: sub.price, cycle: sub.cycle, startDate: sub.startDate });
    setEditingColor(null); // Close color picker if open
  };

  // Save edited subscription
  const handleSaveEdit = (id) => {
    if (!editForm.name || !editForm.price || !editForm.startDate) return;

    setSubs(subs.map(sub =>
      sub.id === id
        ? { ...sub, name: editForm.name, price: parseFloat(editForm.price), cycle: editForm.cycle, startDate: editForm.startDate }
        : sub
    ));
    setEditingItem(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({ name: '', price: '', cycle: '', startDate: '' });
  };

  // Export subscriptions to JSON file
  const handleExport = () => {
    const dataStr = JSON.stringify(subs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscriptions-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import subscriptions from JSON file
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSubs = JSON.parse(event.target.result);
        if (Array.isArray(importedSubs)) {
          setSubs(importedSubs);
        } else {
          alert('Invalid file format. Please upload a valid JSON file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be imported again if needed
    e.target.value = '';
  };

  // Style the events on the calendar based on user color
  const eventStyleGetter = (event) => {
    const isCancelled = event.resource.cancelled;
    return {
      style: {
        backgroundColor: isCancelled ? '#9CA3AF' : event.resource.color,
        opacity: isCancelled ? 0.5 : 0.8,
        color: 'white',
        borderRadius: '4px',
        display: 'block',
        textDecoration: isCancelled ? 'line-through' : 'none'
      }
    };
  };

  // Calculate Total Monthly Cost (excluding cancelled subscriptions)
  const totalMonthly = subs.reduce((acc, sub) => {
    if (sub.cancelled) return acc; // Skip cancelled subscriptions
    let monthlyPrice = sub.price;
    if (sub.cycle === 'yearly') monthlyPrice = sub.price / 12;
    return acc + monthlyPrice;
  }, 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* --- SIDEBAR: Input & List --- */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">SubTracker</h1>
              <p className="text-sm text-gray-500">Visualize your expenses</p>
            </div>
            <div className="flex gap-2">
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                title="Export to JSON"
              >
                <Download size={18} />
              </button>
              {/* Import Button */}
              <label className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer" title="Import from JSON">
                <Upload size={18} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAdd} className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Service Name</label>
            <input 
              type="text" 
              placeholder="e.g. Netflix" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full p-2 pl-7 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cycle</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.cycle}
              onChange={e => setFormData({...formData, cycle: e.target.value})}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium">
            <Plus size={18} /> Add Subscription
          </button>
        </form>

        {/* Stats */}
        <div className="px-6 py-4 bg-blue-50 border-y border-blue-100 flex justify-between items-center">
          <span className="text-blue-800 font-semibold">Total / Month</span>
          <span className="text-blue-900 font-bold text-lg">${totalMonthly.toFixed(2)}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {subs.length === 0 && <p className="text-center text-gray-400 mt-10 text-sm">No subscriptions yet.</p>}

          {subs.map(sub => (
            <div key={sub.id} className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition">
              {/* View Mode */}
              {editingItem !== sub.id ? (
                <div className={`flex items-center justify-between p-3 ${sub.cancelled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => setEditingColor(editingColor === sub.id ? null : sub.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: sub.cancelled ? '#9CA3AF' : sub.color }}
                      title="Click to change color"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-gray-800 ${sub.cancelled ? 'line-through' : ''}`}>{sub.name}</p>
                        {sub.cancelled && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Cancelled</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{sub.cycle} • ${sub.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleCancelled(sub.id)}
                      className={`p-1 transition ${sub.cancelled ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-orange-500'}`}
                      title={sub.cancelled ? "Mark as active" : "Mark as cancelled"}
                    >
                      <Ban size={14} />
                    </button>
                    <button
                      onClick={() => handleStartEdit(sub)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingColor(editingColor === sub.id ? null : sub.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: sub.color }}
                      title="Click to change color"
                    />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Service name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <select
                      value={editForm.cycle}
                      onChange={(e) => setEditForm({ ...editForm, cycle: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(sub.id)}
                      className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded transition flex items-center gap-1"
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>
              )}

              {/* Color Picker (appears when editing color) */}
              {editingColor === sub.id && (
                <div className="px-3 pb-3 flex gap-2 flex-wrap border-t border-gray-100 pt-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => handleColorChange(sub.id, c)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${sub.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN: Calendar Area --- */}
      <div className="flex-1 p-8 flex flex-col h-full">
        <Calendar
          localizer={localizer}
          events={generateEvents()}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'agenda']}
          defaultView="month"
          popup
        />
      </div>
    </div>
  );
}

export default App;