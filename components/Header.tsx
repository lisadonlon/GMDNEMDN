import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <span className="text-4xl">🏥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                European Medical Device Nomenclature
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Navigate EMDN and country-specific medical device classifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
