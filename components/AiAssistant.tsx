import React, { useState } from 'react';
// import { GoogleGenAI } from '@google/genai';
import { Country, EmdnCode, SecondaryCode } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface AiAssistantProps {
  countryData: Country[];
  emdnData: EmdnCode[];
  gmdnData: SecondaryCode[];
  opsData: SecondaryCode[];
  lpprData: SecondaryCode[];
  ccamData: SecondaryCode[];
  icd10cyData: SecondaryCode[];
}

// A simple component to render the response with basic markdown support
const FormattedResponse: React.FC<{ text: string }> = ({ text }) => {
  const createMarkup = (text: string) => {
    let html = text
      // Sanitize basic HTML to prevent injection
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Markdown-like formatting
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded-md text-sm">$1</code>')
      .replace(/^\* (.*$)/gm, '<li class="list-disc ml-5">$1</li>');
      
    // Wrap lists in a <ul>
    if (html.includes('<li')) {
      html = `<ul>${html}</ul>`.replace(/<\/li><br \/>/g, '</li>');
    }

    return { __html: html };
  };

  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4"
      dangerouslySetInnerHTML={createMarkup(text)}
    />
  );
};


const AiAssistant: React.FC<AiAssistantProps> = ({
  countryData: _countryData,
  emdnData: _emdnData,
  gmdnData: _gmdnData,
  opsData: _opsData,
  lpprData: _lpprData,
  ccamData: _ccamData,
  icd10cyData: _icd10cyData
}) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Pre-flight check for the API key
    if (!process.env.API_KEY) {
      setError('Configuration Error: The Google AI API key is not available. Please ensure the API_KEY environment variable is set correctly when running the application.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // TODO: Implement AI functionality
      setError('AI functionality temporarily disabled');
      return;

      // TODO: Implement AI functionality
      setError('AI functionality temporarily disabled');
      return;

      /*
      const dataContext = JSON.stringify({
        countries: countryData,
        emdnCodes: emdnData,
        gmdnCodes: gmdnData,
        opsCodes: opsData,
        lpprCodes: lpprData,
        ccamCodes: ccamData,
        icd10cyCodes: icd10cyData,
      });

      // TODO: Implement AI functionality
      setError('AI functionality temporarily disabled');
      return;

      /*
      const fullPrompt = `You are an expert AI assistant specializing in European medical device nomenclature and reimbursement. Your name is the 'Nomenclature Navigator Assistant'. Analyze the provided JSON data context to answer the user's question. Your answer must be based exclusively on the information within the provided data. Do not use any external knowledge. If the data does not contain the answer, state that the information is not available in the provided context. Format your response using Markdown for clarity, including bold text for emphasis (**text**) and bullet points (using '*') for lists.

      Here is the data context:
      ${dataContext}

      User's question: "${query}"`;

      const genAIResponse = await ai.models.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      });

      const result = await genAIResponse.response.text();
      setResponse(result);
      */

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while contacting the AI assistant. This could be due to an invalid API key, network issues, or a problem with the service. Please check the console for more details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-yellow-300" />
        <div>
          <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
          <p className="text-slate-400">Ask a question about the data in this application.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Compare the HTA process in Germany and the UK..."
          className="w-full h-24 p-3 text-slate-200 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow resize-none"
          disabled={isLoading}
          aria-label="Your question for the AI assistant"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="mt-3 w-full sm:w-auto px-5 py-2.5 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Thinking...</span>
            </>
          ) : (
            'Ask Assistant'
          )}
        </button>
      </form>

      <div className="mt-8 min-h-[100px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <LoadingSpinner className="h-8 w-8" />
            <p className="mt-2">Generating response...</p>
          </div>
        )}
        {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">
                <h4 className="font-bold">Error</h4>
                <p>{error}</p>
            </div>
        )}
        {response && (
           <div className="p-4 border border-slate-700 bg-slate-900/50 rounded-lg">
             <FormattedResponse text={response} />
           </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;