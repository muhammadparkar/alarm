import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// Default alarm sound path
const DEFAULT_ALARM_SOUND = '/sounds/default-alarm.mp3';

// Clock Component
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="clock-container">
      <div className="clock-outer">
        <div className="clock-inner">
          <div className="clock-face">
            <div className="marking marking-12"></div>
            <div className="marking marking-3"></div>
            <div className="marking marking-6"></div>
            <div className="marking marking-9"></div>

            <div
              className="hand hour-hand"
              style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
            ></div>
            <div
              className="hand minute-hand"
              style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
            ></div>
            <div
              className="hand second-hand"
              style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
            ></div>

            <div className="clock-center">
              <div className="clock-center-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="toggle-track">
        <span className="toggle-thumb"></span>
      </span>
    </label>
  );
}

// Alarm Card Component
function AlarmCard({ alarm, onToggle, onDelete, onClick }) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getDaysDisplay = (days) => {
    if (!days || days.length === 0) return '';
    if (days.length === 7) return 'Every day';

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days.map(d => dayLabels[d]).join(' ');
  };

  const getDateDisplay = (alarm) => {
    if (alarm.days && alarm.days.length > 0) {
      return getDaysDisplay(alarm.days);
    }
    const today = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <div
      className={`alarm-card ${!alarm.enabled ? 'disabled' : ''}`}
      onClick={onClick}
    >
      <button
        className="alarm-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Delete alarm"
      >
        ×
      </button>
      <div className="alarm-info">
        <span className="alarm-time">{formatTime(alarm.time)}</span>
        {alarm.label && <span className="alarm-label-text">{alarm.label}</span>}
      </div>
      <div className="alarm-meta">
        <span className={`alarm-days ${alarm.days?.length > 0 ? 'active-days' : ''}`}>
          {getDateDisplay(alarm)}
        </span>
        <ToggleSwitch
          checked={alarm.enabled}
          onChange={() => onToggle(alarm.id)}
        />
      </div>
    </div>
  );
}

// Modal Component
function AlarmModal({ isOpen, onClose, onSave, editAlarm }) {
  const [time, setTime] = useState('07:30');
  const [days, setDays] = useState([]);
  const [label, setLabel] = useState('');
  const [toneFile, setToneFile] = useState(null);
  const [toneName, setToneName] = useState('');
  const [toneData, setToneData] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (editAlarm) {
      setTime(editAlarm.time);
      setDays(editAlarm.days || []);
      setLabel(editAlarm.label || '');
      setToneName(editAlarm.toneName || '');
      setToneData(editAlarm.toneData || null);
    } else {
      setTime('07:30');
      setDays([]);
      setLabel('');
      setToneName('');
      setToneData(null);
    }
    setToneFile(null);
  }, [editAlarm, isOpen]);

  const toggleDay = (day) => {
    setDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setToneFile(file);
      setToneName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        setToneData(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
    if (toneData && audioRef.current) {
      audioRef.current.src = toneData;
      audioRef.current.play();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editAlarm?.id || Date.now(),
      time,
      days,
      label,
      toneName,
      toneData: toneData || editAlarm?.toneData,
      enabled: editAlarm?.enabled ?? true
    });
    onClose();
  };

  if (!isOpen) return null;

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editAlarm ? 'Edit Alarm' : 'Add Alarm'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="alarmTime">Time</label>
            <input
              type="time"
              id="alarmTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Repeat</label>
            <div className="days-selector">
              {dayLabels.map((dayLabel, index) => (
                <button
                  key={index}
                  type="button"
                  className={`day-btn ${days.includes(index) ? 'active' : ''}`}
                  onClick={() => toggleDay(index)}
                >
                  {dayLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="alarmLabel">Label (optional)</label>
            <input
              type="text"
              id="alarmLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Wake up"
            />
          </div>

          <div className="form-group">
            <label>Custom Tone</label>
            <div className="tone-upload">
              <input
                type="file"
                id="alarmTone"
                accept="audio/*"
                className="tone-input"
                onChange={handleFileChange}
              />
              <label htmlFor="alarmTone" className="tone-label">
                <span className="tone-icon">🔔</span>
                <span className="tone-text">
                  {toneName || 'Choose audio file...'}
                </span>
              </label>
              <button
                type="button"
                className="preview-btn"
                onClick={handlePreview}
                disabled={!toneData}
              >
                ▶
              </button>
            </div>
            <p className="tone-hint">MP3, WAV, OGG supported</p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-save">
              Save
            </button>
          </div>
        </form>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

// Alert Modal Component
function AlertModal({ isOpen, alarm, onDismiss }) {
  if (!isOpen || !alarm) return null;

  return (
    <div className={`alert-overlay ${isOpen ? 'active' : ''}`}>
      <div className="alert-modal">
        <div className="alert-time">{alarm.time}</div>
        <div className="alert-label">{alarm.label || 'Alarm'}</div>
        <button className="btn btn-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('alarms');
    return saved ? JSON.parse(saved) : [
      { id: 1, time: '07:30', days: [], label: '', enabled: true },
      { id: 2, time: '08:00', days: [1, 2, 3, 4, 5, 6, 0], label: '', enabled: false },
      { id: 3, time: '09:45', days: [1, 2, 3, 4, 5, 6, 0], label: '', enabled: true }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [triggeredAlarms, setTriggeredAlarms] = useState(new Set());
  const audioRef = useRef(null);

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Check alarms every second
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();
      const currentSecond = now.getSeconds();

      // Only check at the start of each minute
      if (currentSecond !== 0) return;

      alarms.forEach(alarm => {
        if (!alarm.enabled) return;
        if (triggeredAlarms.has(`${alarm.id}-${currentTime}`)) return;

        if (alarm.time === currentTime) {
          // Check if alarm should ring today
          const shouldRing = alarm.days.length === 0 || alarm.days.includes(currentDay);

          if (shouldRing) {
            setTriggeredAlarms(prev => new Set([...prev, `${alarm.id}-${currentTime}`]));
            triggerAlarm(alarm);
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, triggeredAlarms]);

  // Clear triggered alarms after a minute
  useEffect(() => {
    const clearTriggered = setInterval(() => {
      setTriggeredAlarms(new Set());
    }, 60000);
    return () => clearInterval(clearTriggered);
  }, []);

  const triggerAlarm = useCallback((alarm) => {
    setActiveAlert(alarm);

    if (audioRef.current) {
      // Use custom tone if available, otherwise use default MP3
      audioRef.current.src = alarm.toneData || DEFAULT_ALARM_SOUND;
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const dismissAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveAlert(null);
  };

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ));
  };

  const saveAlarm = (alarmData) => {
    setAlarms(prev => {
      const exists = prev.find(a => a.id === alarmData.id);
      if (exists) {
        return prev.map(a => a.id === alarmData.id ? alarmData : a);
      }
      return [...prev, alarmData];
    });
    setEditingAlarm(null);
  };

  const deleteAlarm = (id) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const openEditModal = (alarm) => {
    setEditingAlarm(alarm);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAlarm(null);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      <Clock />

      <div className="alarms-panel">
        <div className="alarms-header">
          <h2>Alarms</h2>
          <button className="more-options-btn" aria-label="More options">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </button>
        </div>

        <div className="alarms-list">
          {alarms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏰</div>
              <p className="empty-state-text">No alarms yet. Tap + to add one.</p>
            </div>
          ) : (
            alarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={toggleAlarm}
                onDelete={() => deleteAlarm(alarm.id)}
                onClick={() => openEditModal(alarm)}
              />
            ))
          )}
        </div>

        <button className="add-btn" onClick={openAddModal} aria-label="Add alarm">
          <div className="add-btn-outer">
            <div className="add-btn-middle">
              <div className="add-btn-inner">
                <span className="plus-icon"></span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <AlarmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveAlarm}
        editAlarm={editingAlarm}
      />

      <AlertModal
        isOpen={!!activeAlert}
        alarm={activeAlert}
        onDismiss={dismissAlarm}
      />

      <audio ref={audioRef} />
    </div>
  );
}

export default App;
