import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
    Calendar as CalendarIcon, Filter, 
    ArrowLeft, Info, Search, MapPin, 
    Globe, Users, Clock, AlertCircle
} from 'lucide-react';
import { LeaveStatsAPI } from "../../services/api";
import { useNavigate } from 'react-router-dom';

const LeaveCalendarView = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        fetchCalendarEvents();
    }, [viewDate]);

    const fetchCalendarEvents = async () => {
        try {
            setLoading(true);
            const startStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString().split('T')[0];
            const endStr = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).toISOString().split('T')[0];
            
            const res = await LeaveStatsAPI.getCalendar({ start: startStr, end: endStr });
            const formatted = (res.data || []).map(item => ({
                id: Math.random().toString(),
                title: item.title,
                start: item.start,
                end: item.end,
                backgroundColor: item.color || '#3b82f6',
                borderColor: item.color || '#3b82f6',
                extendedProps: {
                    type: item.type,
                    category: item.category,
                    employeeName: item.employeeName,
                    isLop: item.isLop,
                    status: item.status
                }
            }));
            setEvents(formatted);
        } catch (err) {
            console.error("Failed to load calendar", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info) => {
        const { extendedProps, title } = info.event;
        alert(`${title}\nType: ${extendedProps.type}\nStatus: ${extendedProps.status || 'N/A'}`);
    };

    return (
        <div className="registry-page-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .registry-page-wrapper {
                    padding: 40px;
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                }

                .registry-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .header-left-zone {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .btn-back-square {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 16px;
                    color: #1e293b;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-back-square:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    transform: translateX(-4px);
                    box-shadow: 0 10px 20px rgba(234, 88, 12, 0.1);
                }

                .title-main {
                    font-size: 32px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -1px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .subtitle-enterprise {
                    font-size: 11px;
                    font-weight: 800;
                    color: #ea580c;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-top: 4px;
                }

                .legend-ribbon {
                    display: flex;
                    gap: 12px;
                    background: #ffffff;
                    padding: 12px 24px;
                    border-radius: 20px;
                    border: 1.5px solid #e2e8f0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #64748b;
                }

                .legend-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .calendar-container-premium {
                    background: white;
                    border-radius: 32px;
                    border: 1.5px solid #e2e8f0;
                    padding: 35px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.03);
                    position: relative;
                }

                /* FullCalendar Customizations */
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-button-bg-color: #ffffff;
                    --fc-button-border-color: #e2e8f0;
                    --fc-button-hover-bg-color: #ea580c;
                    --fc-button-hover-border-color: #ea580c;
                    --fc-button-active-bg-color: #1e293b;
                    --fc-button-active-border-color: #1e293b;
                }

                .fc-toolbar-title {
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    font-size: 20px !important;
                    letter-spacing: -0.5px !important;
                }

                .fc-button {
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                    letter-spacing: 1px !important;
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                }

                .fc-col-header-cell {
                    padding: 15px 0 !important;
                    background: #f8fafc;
                }

                .fc-col-header-cell-cushion {
                    font-size: 10px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    color: #64748b !important;
                    letter-spacing: 1.5px !important;
                }

                .fc-daygrid-day-number {
                    font-weight: 800 !important;
                    font-size: 13px !important;
                    color: #64748b !important;
                    padding: 12px !important;
                }

                .fc-event {
                    border: none !important;
                    padding: 6px 10px !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    font-size: 11px !important;
                    margin: 2px 4px !important;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.08) !important;
                    transition: transform 0.2s !important;
                }

                .fc-event:hover {
                    transform: scale(1.05) translateY(-2px) !important;
                    z-index: 10 !important;
                }

                .stats-bar-bottom {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 25px;
                    margin-top: 40px;
                }

                .stat-card-mini {
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    padding: 24px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    transition: all 0.3s ease;
                }

                .stat-card-mini:hover {
                    transform: translateY(-5px);
                    border-color: #ea580c;
                    box-shadow: 0 15px 35px rgba(234, 88, 12, 0.08);
                }

                .stat-icon-wrap {
                    width: 54px;
                    height: 54px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-info-label {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #64748b;
                    margin-bottom: 4px;
                }

                .stat-info-value {
                    font-size: 18px;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .loader-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.8);
                    backdrop-filter: blur(8px);
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 32px;
                }
            `}</style>

            <header className="registry-header">
                <div className="header-left-zone">
                    <button onClick={() => navigate(-1)} className="btn-back-square">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="title-main">
                            LEAVE CALENDAR <CalendarIcon size={30} style={{ color: '#ea580c' }} />
                        </h1>
                        <div className="subtitle-enterprise">View holidays and team leaves</div>
                    </div>
                </div>

                <div className="legend-ribbon">
                    <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }}></div> Holiday</div>
                    <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }}></div> Event</div>
                    <div className="legend-item"><div className="legend-dot" style={{ background: '#10b981' }}></div> Leave</div>
                    <div className="legend-item"><div className="legend-dot" style={{ background: '#f97316' }}></div> Pending</div>
                </div>
            </header>

            <main className="calendar-container-premium">
                {loading && (
                    <div className="loader-overlay">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '45px', height: '45px', border: '5px solid #f1f5f9', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                            <div style={{ fontSize: '12px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px' }}>Loading calendar...</div>
                        </div>
                    </div>
                )}
                
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={events}
                    eventClick={handleEventClick}
                    datesSet={(arg) => setViewDate(arg.view.currentStart)}
                    height="650px"
                    dayMaxEvents={3}
                />
            </main>

            <footer className="stats-bar-bottom">
                <div className="stat-card-mini">
                    <div className="stat-icon-wrap" style={{ background: '#fff7ed', color: '#ea580c' }}><MapPin /></div>
                    <div>
                        <div className="stat-info-label">Current Location</div>
                        <h4 className="stat-info-value">Headquarters</h4>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon-wrap" style={{ background: '#f0f9ff', color: '#0284c7' }}><Globe /></div>
                    <div>
                        <div className="stat-info-label">Active Users</div>
                        <h4 className="stat-info-value">24 Employees</h4>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}><Users /></div>
                    <div>
                        <div className="stat-info-label">Availability</div>
                        <h4 className="stat-info-value">88.5% Today</h4>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon-wrap" style={{ background: '#faf5ff', color: '#9333ea' }}><Clock /></div>
                    <div>
                        <div className="stat-info-label">Last Sync</div>
                        <h4 className="stat-info-value">Just Now</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LeaveCalendarView;
