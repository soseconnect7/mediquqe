import React, { useState } from 'react';
import { Search, Download, FileText, User, Calendar, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { supabase, safeQuery } from '../lib/supabase';
import { formatDate, formatTime, downloadFile } from '../lib/utils';
import { Patient, MedicalHistory, Visit, Doctor } from '../types';

interface PrescriptionDownloadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrescriptionData extends MedicalHistory {
  doctor?: Doctor;
  visit?: Visit & { patient?: Patient };
}

export const PrescriptionDownload: React.FC<PrescriptionDownloadProps> = ({ isOpen, onClose }) => {
  const [searchUID, setSearchUID] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchPrescriptions = async () => {
    if (!searchUID.trim()) {
      setError('Please enter a valid Patient UID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setPatient(null);
    setPrescriptions([]);
    setSearchPerformed(true);

    try {
      // First, find the patient by UID
      const { data: patientData, error: patientError } = await safeQuery(() =>
        supabase!
          .from('patients')
          .select('*')
          .eq('uid', searchUID.trim().toUpperCase())
          .single()
      );

      if (patientError || !patientData) {
        setError('Patient not found. Please check the UID and try again.');
        return;
      }

      setPatient(patientData);

      // Get all medical history for this patient
      const { data: medicalData, error: medicalError } = await safeQuery(() =>
        supabase!
          .from('medical_history')
          .select(`
            *,
            doctor:doctors(*),
            visit:visits(
              *,
              patient:patients(*)
            )
          `)
          .eq('patient_uid', patientData.uid)
          .order('created_at', { ascending: false })
      );

      if (medicalError) {
        console.error('Medical history error:', medicalError);
        setError('Error fetching medical records. Please try again.');
        return;
      }

      const prescriptionsData = medicalData || [];
      setPrescriptions(prescriptionsData);

      if (prescriptionsData.length === 0) {
        setError('No prescriptions found for this patient.');
      } else {
        setSuccess(`Found ${prescriptionsData.length} prescription(s) for ${patientData.name}`);
      }

    } catch (error: any) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePrescriptionText = (prescription: PrescriptionData): string => {
    const patient = prescription.visit?.patient || null;
    const doctor = prescription.doctor;
    const visit = prescription.visit;

    return `
═══════════════════════════════════════════════════════════════
                        MEDICAL PRESCRIPTION
═══════════════════════════════════════════════════════════════

CLINIC INFORMATION:
Clinic Name: MediQueue Clinic
Date: ${formatDate(prescription.created_at)}
Time: ${formatTime(prescription.created_at)}

PATIENT INFORMATION:
Patient ID: ${patient?.uid || 'N/A'}
Name: ${patient?.name || 'N/A'}
Age: ${patient?.age || 'N/A'} years
Phone: ${patient?.phone || 'N/A'}
${patient?.email ? `Email: ${patient.email}` : ''}
${patient?.blood_group ? `Blood Group: ${patient.blood_group}` : ''}

${patient?.allergies && patient.allergies.length > 0 ? `
⚠️  ALLERGIES: ${patient.allergies.join(', ')}
` : ''}

${patient?.medical_conditions && patient.medical_conditions.length > 0 ? `
📋 MEDICAL CONDITIONS: ${patient.medical_conditions.join(', ')}
` : ''}

DOCTOR INFORMATION:
Doctor: ${doctor?.name || 'N/A'}
${doctor?.qualification ? `Qualification: ${doctor.qualification}` : ''}
Specialization: ${doctor?.specialization || 'N/A'}
${doctor?.experience_years ? `Experience: ${doctor.experience_years} years` : ''}

VISIT INFORMATION:
${visit ? `Token Number: #${visit.stn}` : ''}
${visit ? `Department: ${visit.department.charAt(0).toUpperCase() + visit.department.slice(1)}` : ''}
${visit ? `Visit Date: ${formatDate(visit.visit_date)}` : ''}

═══════════════════════════════════════════════════════════════
                           PRESCRIPTION
═══════════════════════════════════════════════════════════════

${prescription.diagnosis ? `
🔍 DIAGNOSIS:
${prescription.diagnosis}
` : ''}

${prescription.prescription ? `
💊 PRESCRIPTION:
${prescription.prescription}
` : ''}

${prescription.notes ? `
📝 ADDITIONAL NOTES:
${prescription.notes}
` : ''}

═══════════════════════════════════════════════════════════════

⚠️  IMPORTANT INSTRUCTIONS:
• Take medicines as prescribed by the doctor
• Complete the full course of medication
• Do not share medicines with others
• Consult doctor if you experience any side effects
• Keep medicines away from children
• Store medicines in a cool, dry place

📞 For any queries, contact the clinic:
   Phone: +91-XXXXXXXXXX
   Email: info@mediqueueclinic.com

═══════════════════════════════════════════════════════════════
This is a digitally generated prescription.
Generated on: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
    `.trim();
  };

  const downloadSinglePrescription = (prescription: PrescriptionData) => {
    try {
      const prescriptionText = generatePrescriptionText(prescription);
      const fileName = `prescription_${patient?.name?.replace(/\s+/g, '_')}_${formatDate(prescription.created_at).replace(/\s+/g, '_')}.txt`;
      
      downloadFile(prescriptionText, fileName, 'text/plain');
      setSuccess('Prescription downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download prescription. Please try again.');
    }
  };

  const downloadAllPrescriptions = () => {
    if (prescriptions.length === 0) {
      setError('No prescriptions to download.');
      return;
    }

    try {
      const allPrescriptionsText = `
═══════════════════════════════════════════════════════════════
                    COMPLETE MEDICAL HISTORY
═══════════════════════════════════════════════════════════════

PATIENT: ${patient?.name || 'N/A'}
PATIENT ID: ${patient?.uid || 'N/A'}
TOTAL PRESCRIPTIONS: ${prescriptions.length}
GENERATED ON: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════

${prescriptions.map((prescription, index) => `
PRESCRIPTION #${index + 1}
${generatePrescriptionText(prescription)}

${'═'.repeat(67)}

`).join('')}

END OF MEDICAL HISTORY
═══════════════════════════════════════════════════════════════
      `.trim();

      const fileName = `complete_medical_history_${patient?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      
      downloadFile(allPrescriptionsText, fileName, 'text/plain');
      setSuccess(`All ${prescriptions.length} prescriptions downloaded successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download prescriptions. Please try again.');
    }
  };

  const handleClose = () => {
    setSearchUID('');
    setPatient(null);
    setPrescriptions([]);
    setError('');
    setSuccess('');
    setSearchPerformed(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPrescriptions();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Download Prescriptions" size="xl">
      <div className="space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              Search Patient Prescriptions
            </h3>
            <p className="text-sm text-gray-600">
              Enter your Patient UID to view and download all your prescriptions
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Input
                placeholder="Enter Patient UID (e.g., CLN1-XXXXXXXXXX)"
                value={searchUID}
                onChange={(e) => {
                  setSearchUID(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                onKeyPress={handleKeyPress}
                className="flex-1 font-mono"
                disabled={loading}
              />
              <Button 
                onClick={searchPrescriptions} 
                loading={loading}
                disabled={!searchUID.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-green-800">{success}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Searching prescriptions...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Information */}
        {patient && !loading && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Patient Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-mono font-medium">{patient.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{patient.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {patient.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{patient.email}</span>
                    </div>
                  )}
                  {patient.blood_group && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blood Group:</span>
                      <span className="font-medium text-red-600">{patient.blood_group}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered:</span>
                    <span className="font-medium">{formatDate(patient.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Prescriptions:</span>
                    <span className="font-bold text-blue-600">{prescriptions.length}</span>
                  </div>
                </div>
              </div>

              {/* Health Alerts */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Allergies:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Medical Conditions:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.medical_conditions.map((condition, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prescriptions List */}
        {prescriptions.length > 0 && !loading && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Prescriptions ({prescriptions.length})
                </h3>
                <Button
                  onClick={downloadAllPrescriptions}
                  variant="secondary"
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {prescriptions.map((prescription, index) => (
                  <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            #{index + 1}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatDate(prescription.created_at)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTime(prescription.created_at)}
                          </span>
                        </div>

                        {prescription.doctor && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Stethoscope className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              Dr. {prescription.doctor.name}
                              {prescription.doctor.qualification && ` (${prescription.doctor.qualification})`}
                            </span>
                          </div>
                        )}

                        {prescription.visit && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              Token #{prescription.visit.stn} - {prescription.visit.department.charAt(0).toUpperCase() + prescription.visit.department.slice(1)}
                            </span>
                          </div>
                        )}

                        {prescription.diagnosis && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-900">Diagnosis: </span>
                            <span className="text-sm text-gray-700">{prescription.diagnosis}</span>
                          </div>
                        )}

                        {prescription.prescription && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-900">Prescription: </span>
                            <span className="text-sm text-gray-700">
                              {prescription.prescription.length > 100 
                                ? `${prescription.prescription.substring(0, 100)}...` 
                                : prescription.prescription}
                            </span>
                          </div>
                        )}

                        {prescription.notes && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-900">Notes: </span>
                            <span className="text-sm text-gray-700">
                              {prescription.notes.length > 100 
                                ? `${prescription.notes.substring(0, 100)}...` 
                                : prescription.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => downloadSinglePrescription(prescription)}
                        variant="outline"
                        size="sm"
                        className="ml-4 flex-shrink-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results Message */}
        {searchPerformed && prescriptions.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
              <p className="text-gray-500 mb-4">
                No prescriptions were found for the entered Patient UID.
              </p>
              <p className="text-sm text-gray-400">
                Make sure you have visited the clinic and received treatment from a doctor.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter your Patient UID (found on your booking confirmation or QR code)</li>
              <li>• Click "Search" to find all your prescriptions</li>
              <li>• Download individual prescriptions or all at once</li>
              <li>• Prescriptions include complete doctor information and treatment details</li>
              <li>• Keep downloaded prescriptions safe for future reference</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};