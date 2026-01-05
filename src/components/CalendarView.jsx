import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, MapPin, User, Tag } from 'lucide-react';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

/**
 * CustomToolbar Component
 * Memoized to prevent re-renders that break calendar interactions.
 * Receives standard big-calendar toolbar props: date, view, onNavigate, onView
 */
const CustomToolbar = ({ date, view, onNavigate, onView }) => {

    const handleNavigate = (action) => {
        onNavigate(action);
    };

    const handleViewChange = (newView) => {
        onView(newView);
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleNavigate('TODAY')}
                    className="px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
                >
                    Today
                </button>
                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => handleNavigate('PREV')}
                        className="p-2 hover:bg-slate-50 text-slate-600 rounded-l-lg"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => handleNavigate('NEXT')}
                        className="p-2 hover:bg-slate-50 text-slate-600 rounded-r-lg border-l border-slate-100"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <span className="text-xl font-bold text-slate-800 ml-2">
                    {format(date, 'MMMM yyyy')}
                </span>
            </div>

            <div className="flex bg-slate-200 p-1 rounded-lg">
                {['month', 'week', 'day', 'agenda'].map((v) => (
                    <button
                        key={v}
                        onClick={() => handleViewChange(v)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${view === v
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Custom Event Component
const CustomEvent = ({ event, view }) => {
    return (
        <div className="flex flex-col h-full bg-brand-500 text-white rounded p-1 text-xs overflow-hidden"
            title={event.title}
        >
            <div className="font-bold truncate">{event.title}</div>
            {view !== 'month' && (
                <div className="flex flex-col gap-0.5 mt-1 opacity-90">
                    {event.resource?.storeName && (
                        <div className="flex items-center gap-1 truncate">
                            <MapPin size={8} /> {event.resource.storeName}
                        </div>
                    )}
                    {event.resource?.repName && (
                        <div className="flex items-center gap-1 truncate">
                            <User size={8} /> {event.resource.repName}
                        </div>
                    )}
                    {event.resource?.brandName && (
                        <div className="flex items-center gap-1 truncate">
                            <Tag size={8} /> {event.resource.brandName}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CalendarView = ({ events = [], onEventClick, height = '75vh', className = '' }) => {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
    const onView = useCallback((newView) => setView(newView), [setView]);

    // Helper to pass view prop to CustomEvent
    const components = {
        toolbar: CustomToolbar,
        event: (props) => <CustomEvent {...props} view={view} />
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#10B981'; // Default Brand Green

        if (event.resource?.status === 'pending') backgroundColor = '#F59E0B';
        if (event.resource?.status === 'completed') backgroundColor = '#3B82F6';
        if (event.resource?.inStock === false) backgroundColor = '#EF4444';

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
            <div className="h-full w-full" style={{ height }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={onView}
                    date={date}
                    onNavigate={onNavigate}
                    components={components}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={onEventClick}
                    popup
                />
            </div>
        </div>
    );
};

export default CalendarView;
