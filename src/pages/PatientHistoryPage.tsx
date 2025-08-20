import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock,
  Stethoscope,
  Pill,
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Printer,
  ArrowLeft,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';
import { Patient, MedicalHistory, Visit, Doctor } from '../types';

export const PatientHistoryPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<MedicalHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (doctorsError) throw doctorsError;

      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patient: Patient) => {
    try {
      setSelectedPatient(patient);
      
      // Fetch medical history
      const { data: historyData, error: historyError } = await supabase
        .from('medical_history')
        .select(`
          *,
          doctor:doctors(*),
          visit:visits(*)
        `)
        .eq('patient_uid', patient.uid)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Fetch visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          doctor:doctors(*),
          payment_transactions(*)
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      setMedicalHistory(historyData || []);
      setVisits(visitsData || []);
      setShowPatientModal(true);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setError('Failed to load patient history');
    }
  };

  const generatePatientReport = (patient: Patient) => {
    const patientVisits = visits.filter(v => v.patient_id === patient.id);
    const patientHistory = medicalHistory.filter(h => h.patient_uid === patient.uid);

    const reportContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">Sancura Hospital</h1>
          <p style="margin: 5px 0;">Patient Medical History Report</p>
          <p style="margin: 5px 0;">Generated on: ${formatDate(new Date().toISOString())}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Patient Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div>
              <p><strong>Name:</strong> ${patient.name}</p>
              <p><strong>Age:</strong> ${patient.age} years</p>
              <p><strong>Phone:</strong> ${patient.phone}</p>
              <p><strong>Patient ID:</strong> ${patient.uid}</p>
            </div>
            <div>
              ${patient.email ? `<p><strong>Email:</strong> ${patient.email}</p>` : ''}
              ${patient.blood_group ? `<p><strong>Blood Group:</strong> ${patient.blood_group}</p>` : ''}
              ${patient.emergency_contact ? `<p><strong>Emergency Contact:</strong> ${patient.emergency_contact}</p>` : ''}
              <p><strong>Registered:</strong> ${formatDate(patient.created_at)}</p>
            </div>
          </div>
          
          ${patient.allergies && patient.allergies.length > 0 ? `
            <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <h4 style="color: #dc2626; margin: 0 0 5px 0;">⚠️ Allergies:</h4>
              <p style="margin: 0; color: #991b1b;">${patient.allergies.join(', ')}</p>
            </div>
          ` : ''}
          
          ${patient.medical_conditions && patient.medical_conditions.length > 0 ? `
            <div style="margin-top: 15px; padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <h4 style="color: #d97706; margin: 0 0 5px 0;">🏥 Medical Conditions:</h4>
              <p style="margin: 0; color: #92400e;">${patient.medical_conditions.join(', ')}</p>
            </div>
          ` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Visit Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px;">
            <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <h3 style="margin: 0; color: #2563eb; font-size: 24px;">${patientVisits.length}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Total Visits</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <h3 style="margin: 0; color: #10b981; font-size: 24px;">${patientVisits.filter(v => v.status === 'completed').length}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Completed</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <h3 style="margin: 0; color: #f59e0b; font-size: 24px;">${patientHistory.length}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Medical Records</p>
            </div>
            <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <h3 style="margin: 0; color: #8b5cf6; font-size: 24px;">${new Set(patientVisits.map(v => v.department)).size}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Departments</p>
            </div>
          </div>
        </div>

        ${patientHistory.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Medical History</h2>
            ${patientHistory.map(record => `
              <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #fafafa;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <h3 style="margin: 0; color: #1f2937;">${formatDate(record.created_at)}</h3>
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${record.doctor?.name || 'Unknown Doctor'}
                  </span>
                </div>
                
                ${record.diagnosis ? `
                  <div style="margin-bottom: 15px;">
                    <h4 style="color: #374151; margin: 0 0 5px 0;">🔍 Diagnosis:</h4>
                    <p style="margin: 0; padding: 10px; background-color: #eff6ff; border-radius: 4px; color: #1e40af;">${record.diagnosis}</p>
                  </div>
                ` : ''}
                
                ${record.prescription ? `
                  <div style="margin-bottom: 15px;">
                    <h4 style="color: #374151; margin: 0 0 5px 0;">💊 Prescription:</h4>
                    <div style="margin: 0; padding: 10px; background-color: #f0fdf4; border-radius: 4px; color: #166534; white-space: pre-line;">${record.prescription}</div>
                  </div>
                ` : ''}
                
                ${record.notes ? `
                  <div>
                    <h4 style="color: #374151; margin: 0 0 5px 0;">📝 Notes:</h4>
                    <p style="margin: 0; padding: 10px; background-color: #fefce8; border-radius: 4px; color: #a16207;">${record.notes}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Visit History</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151;">Date</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151;">Token</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151;">Department</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151;">Doctor</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${patientVisits.map(visit => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatDate(visit.visit_date)}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">#${visit.stn}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; text-transform: capitalize;">${visit.department}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${visit.doctor?.name || 'N/A'}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;
                      ${visit.status === 'completed' ? 'background-color: #dcfce7; color: #166534;' :
                        visit.status === 'in_service' ? 'background-color: #dbeafe; color: #1e40af;' :
                        'background-color: #fef3c7; color: #92400e;'}">
                      ${visit.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">This report was generated by Sancura Hospital Management System</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">For any queries, please contact the hospital administration</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Medical History - ${patient.name}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${reportContent}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print Report</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchQuery || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.uid.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
                <p className="text-sm text-gray-600">Comprehensive medical records and visit history</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <Heart className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Input
                placeholder="Search by patient name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Patients ({filteredPatients.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                          <span className="text-sm text-gray-500">({patient.age} years)</span>
                          {patient.blood_group && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                              <Heart className="h-3 w-3 mr-1" />
                              {patient.blood_group}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {patient.phone}
                          </div>
                          {patient.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {patient.email}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Registered: {formatDate(patient.created_at)}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Patient ID: {patient.uid}
                        </div>
                        
                        {/* Health Alerts */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {patient.allergies && patient.allergies.length > 0 && (
                            <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Allergies: {patient.allergies.slice(0, 2).join(', ')}
                              {patient.allergies.length > 2 && ` +${patient.allergies.length - 2} more`}
                            </div>
                          )}
                          {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                            <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              Conditions: {patient.medical_conditions.slice(0, 2).join(', ')}
                              {patient.medical_conditions.length > 2 && ` +${patient.medical_conditions.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchPatientHistory(patient)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePatientReport(patient)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No patients found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Patient History Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title={`Medical History - ${selectedPatient?.name}`}
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Patient Information</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Name:</strong> {selectedPatient.name}</p>
                    <p><strong>Age:</strong> {selectedPatient.age} years</p>
                    <p><strong>Phone:</strong> {selectedPatient.phone}</p>
                    <p><strong>Patient ID:</strong> {selectedPatient.uid}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Statistics</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Total Visits:</strong> {visits.length}</p>
                    <p><strong>Completed:</strong> {visits.filter(v => v.status === 'completed').length}</p>
                    <p><strong>Medical Records:</strong> {medicalHistory.length}</p>
                    <p><strong>Departments:</strong> {new Set(visits.map(v => v.department)).size}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Medical Records ({medicalHistory.length})</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {medicalHistory.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {formatDate(record.created_at)}
                          </h5>
                          {record.doctor && (
                            <p className="text-sm text-gray-600">Dr. {record.doctor.name}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedHistory(record);
                            setShowHistoryModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {record.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                          <span className="text-sm text-gray-900">{record.diagnosis}</span>
                        </div>
                      )}

                      {record.prescription && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Prescription: </span>
                          <span className="text-sm text-gray-900">
                            {record.prescription.length > 100 
                              ? `${record.prescription.substring(0, 100)}...` 
                              : record.prescription}
                          </span>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Notes: </span>
                          <span className="text-sm text-gray-900">
                            {record.notes.length > 100 
                              ? `${record.notes.substring(0, 100)}...` 
                              : record.notes}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {medicalHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No medical records found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visit History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Visit History ({visits.length})</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Token #{visit.stn} - {visit.department.charAt(0).toUpperCase() + visit.department.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(visit.visit_date)} • {visit.doctor?.name || 'No doctor assigned'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                      visit.status === 'in_service' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}

                {visits.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No visits found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPatientModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => generatePatientReport(selectedPatient)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Medical Record Detail Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Medical Record Details"
        size="lg"
      >
        {selectedHistory && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Record Information</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Date:</strong> {formatDate(selectedHistory.created_at)}</p>
                    <p><strong>Time:</strong> {formatTime(selectedHistory.created_at)}</p>
                    <p><strong>Doctor:</strong> {selectedHistory.doctor?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Patient</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Name:</strong> {selectedPatient?.name}</p>
                    <p><strong>Patient ID:</strong> {selectedHistory.patient_uid}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedHistory.diagnosis && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Diagnosis
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900">{selectedHistory.diagnosis}</p>
                </div>
              </div>
            )}

            {selectedHistory.prescription && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Pill className="h-4 w-4 mr-2" />
                  Prescription
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <pre className="text-green-900 whitespace-pre-wrap font-sans">{selectedHistory.prescription}</pre>
                </div>
              </div>
            )}

            {selectedHistory.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Additional Notes
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900">{selectedHistory.notes}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowHistoryModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Print individual record
                  const printContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1>Medical Record</h1>
                      <p><strong>Date:</strong> ${formatDate(selectedHistory.created_at)}</p>
                      <p><strong>Doctor:</strong> ${selectedHistory.doctor?.name || 'Unknown'}</p>
                      <p><strong>Patient:</strong> ${selectedPatient?.name}</p>
                      ${selectedHistory.diagnosis ? `<h3>Diagnosis:</h3><p>${selectedHistory.diagnosis}</p>` : ''}
                      ${selectedHistory.prescription ? `<h3>Prescription:</h3><pre>${selectedHistory.prescription}</pre>` : ''}
                      ${selectedHistory.notes ? `<h3>Notes:</h3><p>${selectedHistory.notes}</p>` : ''}
                    </div>
                  `;
                  
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`<html><head><title>Medical Record</title></head><body>${printContent}</body></html>`);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong>Sancura</strong> - Patient History & Medical Records | 
              Developed by{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Aftab Alam
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};