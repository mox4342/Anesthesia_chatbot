import React from 'react';
import { CaseUploader } from '../components/KnowledgeBase/CaseUploader';
import MedicalDisclaimer from '../components/common/MedicalDisclaimer';

const KnowledgeBase: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Knowledge Base</h1>
        <p className="text-gray-600">
          Upload and manage your anesthesia case database to enhance AI responses with real clinical experience.
        </p>
      </div>

      <CaseUploader />
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. <strong>Upload Your Cases:</strong> Import your anonymized case collection in JSON format</p>
          <p>2. <strong>Local Storage:</strong> All data stays in your browser - never sent to external servers</p>
          <p>3. <strong>Enhanced AI Responses:</strong> The chat assistant will reference relevant cases when answering questions</p>
          <p>4. <strong>Pattern Recognition:</strong> Identify trends and best practices from your accumulated experience</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy & Security</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>All case data is stored locally in your browser's IndexedDB</li>
          <li>No patient identifiers should be included in uploaded cases</li>
          <li>Cases are never transmitted to Claude or any external API</li>
          <li>Only case summaries are used as context for AI responses</li>
          <li>You maintain full control over your data</li>
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeBase;