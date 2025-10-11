
import React from 'react';
import { Country } from '../types';

interface CountryListProps {
  countries: Country[];
  selectedCountryId: string | null;
  onSelectCountry: (id: string) => void;
}

const CountryList: React.FC<CountryListProps> = ({ countries, selectedCountryId, onSelectCountry }) => {
  const regions = [...new Set(countries.map(c => c.region))];

  return (
    <nav>
      {regions.map(region => (
        <div key={region} className="mb-4">
          <h2 className="text-xs font-bold uppercase text-slate-500 tracking-wider px-2 mb-2">{region}</h2>
          <ul>
            {countries.filter(c => c.region === region).map(country => (
              <li key={country.id}>
                <button
                  onClick={() => onSelectCountry(country.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                    selectedCountryId === country.id
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
                  }`}
                >
                  {country.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default CountryList;
