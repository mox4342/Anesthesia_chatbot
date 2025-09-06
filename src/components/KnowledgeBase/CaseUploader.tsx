import React, { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle, Database, Download } from 'lucide-react';
import { CaseService, type AnesthesiaCase } from '../../services/knowledge/caseDatabase';

export const CaseUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load database statistics
  React.useEffect(() => {
    loadStats();
  }, [uploadResult]);

  const loadStats = async () => {
    const dbStats = await CaseService.getStatistics();
    setStats(dbStats);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const cases = JSON.parse(text) as AnesthesiaCase[];
      
      if (!Array.isArray(cases)) {
        throw new Error('File must contain an array of cases');
      }

      const count = await CaseService.importCases(cases);
      setUploadResult({
        success: true,
        message: `Successfully imported ${count} cases`
      });
    } catch (error) {
      setUploadResult({
        success: false,
        message: `Error importing cases: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download sample template
  const downloadTemplate = () => {
    const template: Partial<AnesthesiaCase>[] = [{
      caseDate: new Date(),
      patient: {
        age: 45,
        ageUnit: 'years',
        weight: 70,
        height: 170,
        sex: 'M',
        asa: 2,
        comorbidities: ['HTN', 'DM2'],
        allergies: ['Penicillin'],
        medications: ['Metformin', 'Lisinopril']
      },
      procedure: {
        name: 'Laparoscopic Cholecystectomy',
        specialty: 'General Surgery',
        urgency: 'elective',
        duration: 45,
        position: 'Reverse Trendelenburg',
        bloodLoss: 50,
        fluidsGiven: {
          crystalloid: 1000,
          colloid: 0,
          bloodProducts: []
        }
      },
      anesthetic: {
        technique: 'general',
        airway: 'ETT #7.5',
        induction: [
          { drug: 'Propofol', dose: 140, unit: 'mg' },
          { drug: 'Fentanyl', dose: 100, unit: 'mcg' },
          { drug: 'Rocuronium', dose: 50, unit: 'mg' }
        ],
        maintenance: ['Sevoflurane 1.5-2%', 'Fentanyl boluses'],
        emergence: 'Smooth, reversed with sugammadex',
        extubation: 'awake'
      },
      medications: [
        { name: 'Dexamethasone', dose: 4, unit: 'mg', timing: 'Induction', indication: 'PONV prophylaxis' },
        { name: 'Ondansetron', dose: 4, unit: 'mg', timing: 'End of case', indication: 'PONV prophylaxis' },
        { name: 'Sugammadex', dose: 200, unit: 'mg', timing: 'Emergence', indication: 'Reversal' }
      ],
      complications: [],
      clinicalPearls: [
        'Consider deep extubation for smoother emergence in lap choles',
        'Prophylactic antiemetics essential due to laparoscopy'
      ],
      keyTakeaways: [
        'Adequate muscle relaxation crucial for surgeon satisfaction',
        'Multimodal PONV prophylaxis effective'
      ],
      wouldDoAgain: 'Same anesthetic plan worked well',
      wouldChangePerspective: 'Consider TAP blocks for better postop analgesia',
      outcome: {
        pacuDuration: 45,
        complications: false,
        admission: 'home',
        patientSatisfaction: 9,
        qualityScore: 8
      },
      keywords: ['laparoscopy', 'cholecystectomy', 'general surgery']
    }];

    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'anesthesia_case_template.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Case Knowledge Base</h2>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>

        {/* Database Statistics */}
        {stats && stats.totalCases > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Cases</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCases}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Complication Rate</div>
              <div className="text-2xl font-bold text-gray-900">{stats.complicationRate.toFixed(1)}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Avg Quality Score</div>
              <div className="text-2xl font-bold text-gray-900">{stats.averageQualityScore.toFixed(1)}/10</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Specialties</div>
              <div className="text-2xl font-bold text-gray-900">{Object.keys(stats.bySpecialty).length}</div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="case-upload"
          />
          
          <label
            htmlFor="case-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <span className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Uploading cases...' : 'Upload Case Database'}
            </span>
            <span className="text-sm text-gray-500 text-center">
              Drop your JSON file here or click to browse<br />
              Your cases will be stored locally and used to enhance AI responses
            </span>
          </label>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            uploadResult.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {uploadResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
              {uploadResult.message}
            </span>
          </div>
        )}

        {/* Format Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileJson className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">File Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>JSON array of case objects</li>
                <li>Each case should follow the template structure</li>
                <li>Patient identifiers will be automatically anonymized</li>
                <li>All data is stored locally in your browser</li>
                <li>Cases are never sent to external servers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technique Distribution */}
        {stats && stats.totalCases > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Technique Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.byTechnique).map(([technique, count]) => (
                <div key={technique} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 capitalize">{technique}</div>
                  <div className="text-xl font-bold text-gray-900">{count as number}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};