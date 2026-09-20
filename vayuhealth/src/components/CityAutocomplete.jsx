import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronRight, Compass } from 'lucide-react';
import { indiaLocations } from '../data/indiaLocations';

export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter city or location in India...",
  className = "",
  onSubmit,
  autoFocus = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Extract unique locations from dataset
  const allLocations = useMemo(() => {
    const map = new Map();
    indiaLocations.forEach(loc => {
      const key = `${loc.name.toLowerCase().trim()}_${loc.state?.toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, {
          name: loc.name,
          state: loc.state || 'India',
          lat: loc.lat,
          lng: loc.lng
        });
      }
    });
    return Array.from(map.values());
  }, []);

  // Filter recommendations based on input
  const suggestions = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    if (!query) {
      // Return popular Indian metros as default suggestions
      return allLocations
        .filter(l => ['delhi', 'anand vihar', 'noida', 'gurugram', 'mumbai', 'bengaluru', 'pune', 'chennai', 'kolkata'].some(m => l.name.toLowerCase().includes(m)))
        .slice(0, 6);
    }

    return allLocations
      .filter(loc => 
        loc.name.toLowerCase().includes(query) || 
        loc.state.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [value, allLocations]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (item) => {
    onChange(item.name);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else if (onSubmit) {
        onSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`city-autocomplete-wrap ${className}`} ref={wrapperRef}>
      <div className="city-autocomplete-input-box">
        <MapPin size={15} className="city-autocomplete-pin" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="city-autocomplete-input"
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="city-autocomplete-dropdown">
          <div className="city-autocomplete-dropdown-header">
            <Compass size={12} />
            <span>Locations in India</span>
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={`${item.name}-${item.state}-${idx}`}
              type="button"
              className={`city-autocomplete-item ${idx === highlightedIndex ? 'city-autocomplete-item--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <div className="city-autocomplete-item-left">
                <MapPin size={14} className="city-autocomplete-item-icon" />
                <span className="city-autocomplete-item-name">{item.name}</span>
                <span className="city-autocomplete-item-state">({item.state})</span>
              </div>
              <ChevronRight size={13} className="city-autocomplete-item-arrow" />
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .city-autocomplete-wrap {
          position: relative;
          width: 100%;
        }

        .city-autocomplete-input-box {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .city-autocomplete-pin {
          color: var(--color-text-secondary, #64748b);
          flex-shrink: 0;
        }

        .city-autocomplete-input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--color-text-primary, #1e293b);
          font-size: 14px;
          outline: none;
        }

        .city-autocomplete-input::placeholder {
          color: var(--color-text-secondary, #94a3b8);
        }

        .city-autocomplete-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          min-width: 260px;
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          z-index: 9999;
          padding: 4px;
        }

        .city-autocomplete-dropdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-secondary, #64748b);
          border-bottom: 1px solid var(--color-border, #f1f5f9);
          margin-bottom: 2px;
        }

        .city-autocomplete-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
        }

        .city-autocomplete-item:hover,
        .city-autocomplete-item--active {
          background: var(--color-bg-hover, #f1f5f9);
        }

        .city-autocomplete-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .city-autocomplete-item-icon {
          color: var(--color-primary, #3b82f6);
          flex-shrink: 0;
        }

        .city-autocomplete-item-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary, #1e293b);
        }

        .city-autocomplete-item-state {
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
          white-space: nowrap;
        }

        .city-autocomplete-item-arrow {
          color: var(--color-text-secondary, #94a3b8);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
