import React from 'react';

type View = 'countries' | 'emdn';

interface ViewSwitcherProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const commonClasses = "flex-1 text-center px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 flex items-center justify-center gap-2";
  const activeClasses = "bg-sky-500 text-white shadow-lg transform scale-105";
  const inactiveClasses = "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white";
  
  return (
    <div className="flex flex-wrap gap-2 bg-slate-800 p-2 rounded-lg shadow-lg">
      <button 
        onClick={() => onViewChange('countries')}
        className={`${commonClasses} ${currentView === 'countries' ? activeClasses : inactiveClasses}`}
        aria-pressed={currentView === 'countries'}
        title="Browse countries and HTA agencies"
      >
        <span>🌍</span>
        <div className="flex flex-col items-center">
          <span>Countries</span>
          <span className="text-xs opacity-75">HTA Agencies</span>
        </div>
      </button>
      <button 
        onClick={() => onViewChange('emdn')}
        className={`${commonClasses} ${currentView === 'emdn' ? activeClasses : inactiveClasses}`}
        aria-pressed={currentView === 'emdn'}
        title="European Medical Device Nomenclature"
      >
        <span>🏥</span>
        <div className="flex flex-col items-center">
          <span>EMDN</span>
          <span className="text-xs opacity-75">European Devices</span>
        </div>
      </button>
    </div>
  );
};

export default ViewSwitcher;