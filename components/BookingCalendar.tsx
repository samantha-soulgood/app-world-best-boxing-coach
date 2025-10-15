import React, { useState, useMemo } from 'react';
import type { ScheduledClass, ClassBooking, User } from '../types';

interface BookingCalendarProps {
  classes: ScheduledClass[];
  userBookings: ClassBooking[];
  currentUser: User;
  onBook: (classId: string) => void;
  onCancel: (bookingId: string) => void;
  onClose: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  classes,
  userBookings,
  currentUser,
  onBook,
  onCancel,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Get the start of the week (Sunday)
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Get days for the week view
  const getWeekDays = useMemo(() => {
    const start = getStartOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  // Get month calendar grid
  const getMonthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [selectedDate]);

  // Get classes for a specific date
  const getClassesForDate = (date: Date): ScheduledClass[] => {
    const dateStr = date.toDateString();
    return classes.filter(cls => {
      const classDate = new Date(cls.startTime);
      return classDate.toDateString() === dateStr;
    }).sort((a, b) => a.startTime - b.startTime);
  };

  // Check if user has booked a class
  const isBooked = (classId: string): ClassBooking | undefined => {
    return userBookings.find(booking => booking.classId === classId);
  };

  // Check if class is full
  const isFull = (cls: ScheduledClass): boolean => {
    return cls.bookedCount >= cls.capacity;
  };

  // Navigate dates
  const goToPrevious = () => {
    if (viewMode === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get class type color
  const getClassTypeColor = (type: string): string => {
    const colors = {
      boxing: 'from-red-500 to-orange-500',
      strength: 'from-blue-500 to-indigo-500',
      cardio: 'from-green-500 to-teal-500',
      yoga: 'from-purple-500 to-pink-500',
      nutrition: 'from-yellow-500 to-amber-500',
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  // Render class card
  const renderClassCard = (cls: ScheduledClass) => {
    const booking = isBooked(cls.id);
    const full = isFull(cls);
    const spotsLeft = cls.capacity - cls.bookedCount;
    
    // Determine the card styling
    let cardClassName = 'p-3 rounded-lg mb-2 border-2 transition-all ';
    if (booking) {
      cardClassName += 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400';
    } else if (full) {
      cardClassName += 'bg-gray-100 border-gray-300 opacity-60';
    } else {
      cardClassName += 'bg-white border-orange-200 hover:border-orange-400 hover:shadow-md';
    }

    return (
      <div
        key={cls.id}
        className={cardClassName}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getClassTypeColor(
                  cls.type
                )}`}
              >
                {cls.type.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
              </span>
            </div>
            <h4 className="font-bold text-gray-800 mb-1">{cls.title}</h4>
            <p className="text-sm text-gray-600 mb-1">{cls.description}</p>
            <p className="text-xs text-gray-500">
              👤 {cls.instructor} • {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </p>
          </div>
          <div className="ml-2">
            {booking && (
              <button
                onClick={() => onCancel(booking.id)}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            {!booking && full && (
              <button
                disabled
                className="px-3 py-1.5 bg-gray-400 text-white text-sm font-semibold rounded-lg cursor-not-allowed"
              >
                Full
              </button>
            )}
            {!booking && !full && (
              <button
                onClick={() => onBook(cls.id)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Book
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📅 Book a Class</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold transition-all"
              >
                Today
              </button>
              <button
                onClick={goToNext}
                className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                Next →
              </button>
            </div>
            
            <h3 className="text-xl font-bold">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-orange-600'
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-orange-600'
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'week' ? (
            // Week View
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {getWeekDays.map((date) => {
                const dayClasses = getClassesForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const dateKey = date.toISOString();
                
                return (
                  <div
                    key={dateKey}
                    className={`border-2 rounded-xl p-3 min-h-[200px] ${
                      isToday
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="text-center mb-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isToday ? 'text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayClasses.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center mt-4">No classes</p>
                      ) : (
                        dayClasses.map(renderClassCard)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Month View
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {getMonthDays.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${selectedDate.getMonth()}-${idx}`} className="aspect-square" />;
                  }
                  
                  const dayClasses = getClassesForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const hasClasses = dayClasses.length > 0;
                  const dateKey = date.toISOString();
                  
                  // Determine the day cell styling
                  let dayCellClassName = 'aspect-square border-2 rounded-lg p-2 cursor-pointer transition-all ';
                  if (isToday) {
                    dayCellClassName += 'border-orange-400 bg-orange-50';
                  } else if (hasClasses) {
                    dayCellClassName += 'border-gray-300 bg-white hover:border-orange-300 hover:bg-orange-50';
                  } else {
                    dayCellClassName += 'border-gray-200 bg-gray-50';
                  }
                  
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={dayCellClassName}
                      onClick={() => {
                        setSelectedDate(date);
                        setViewMode('week');
                      }}
                      aria-label={`View classes for ${date.toLocaleDateString()}`}
                    >
                      <div
                        className={`text-sm font-bold mb-1 ${
                          isToday ? 'text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {hasClasses && (
                        <div className="space-y-0.5">
                          {dayClasses.slice(0, 2).map(cls => (
                            <div
                              key={cls.id}
                              className={`text-xs px-1 py-0.5 rounded text-white bg-gradient-to-r ${getClassTypeColor(
                                cls.type
                              )} truncate`}
                            >
                              {cls.title}
                            </div>
                          ))}
                          {dayClasses.length > 2 && (
                            <div className="text-xs text-gray-500 font-semibold">
                              +{dayClasses.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with legend */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-orange-500"></div>
              <span>Boxing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <span>Strength</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-teal-500"></div>
              <span>Cardio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span>Yoga</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-500 to-amber-500"></div>
              <span>Nutrition</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;

