import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Stethoscope,
  Heart
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime, getStatusColor } from '../lib/utils';
import { Appointment, Doctor, Department, Patient } from '../types';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    patient_age: '',
    department: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    duration_minutes: 30
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch appointments with related data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*),
          visit:visits(*)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (doctorsError) throw doctorsError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (departmentsError) throw departmentsError;

      setAppointments(appointmentsData || []);
      setDoctors(doctorsData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load appointments data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    try {
      setError('');
      
      // Validate form
      if (!bookingForm.patient_name || !bookingForm.patient_phone || !bookingForm.appointment_date || !bookingForm.appointment_time) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if patient exists
      let { data: existingPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', bookingForm.patient_phone)
        .limit(1);

      let patient = existingPatients?.[0];

      // Create patient if doesn't exist
      if (!patient) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            uid: `PAT-${Date.now()}`,
            name: bookingForm.patient_name,
            age: parseInt(bookingForm.patient_age) || 25,
            phone: bookingForm.patient_phone,
            email: bookingForm.patient_email || null
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patient = newPatient;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          doctor_id: bookingForm.doctor_id || null,
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          duration_minutes: bookingForm.duration_minutes,
          status: 'scheduled',
          notes: bookingForm.notes || null
        });

      if (appointmentError) throw appointmentError;

      setSuccess('Appointment booked successfully!');
      setShowBookingModal(false);
      setBookingForm({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        patient_age: '',
        department: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
        duration_minutes: 30
      });
      
      fetchData();
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      setSuccess(`Appointment ${status} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment status');
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setSuccess('Appointment deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setError('Failed to delete appointment');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchQuery || 
      appointment.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.patient?.phone.includes(searchQuery) ||
      appointment.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    const matchesDepartment = !departmentFilter || appointment.doctor?.specialization === departmentFilter;
    const matchesDate = !dateFilter || appointment.appointment_date === dateFilter;

    return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' }
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept.name, label: dept.display_name }))
  ];

  const doctorOptions = [
    { value: '', label: 'Any Available Doctor' },
    ...doctors.filter(doc => !bookingForm.department || doc.specialization === bookingForm.department)
      .map(doctor => ({ value: doctor.id, label: `${doctor.name} - ${doctor.specialization}` }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
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
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sancura Appointments</h1>
                <p className="text-sm text-gray-600">Advanced appointment scheduling system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button onClick={() => setShowBookingModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <Heart className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess('')} className="ml-auto">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => ['cancelled', 'no_show'].includes(a.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search by patient name, phone, or doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Select
                options={departmentOptions}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Appointments ({filteredAppointments.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.patient?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.doctor?.name || 'Any Available'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.doctor?.specialization}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.appointment_time} ({appointment.duration_minutes}min)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {appointment.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          
                          {appointment.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                          
                          {appointment.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          
                          {!['completed', 'cancelled'].includes(appointment.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAppointment(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book New Appointment"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Patient Name"
              value={bookingForm.patient_name}
              onChange={(e) => setBookingForm(prev => ({ ...prev, patient_name: e.target.value }))}
              placeholder="Enter patient name"
              required
            />
            <Input
              label="Phone Number"
              value={bookingForm.patient_phone}
              onChange={(e) => setBookingForm(prev => ({ ...prev, patient_phone: e.target.value }))}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Email (Optional)"
              type="email"
              value={bookingForm.patient_email}
              onChange={(e) => setBookingForm(prev => ({ ...prev, patient_email: e.target.value }))}
              placeholder="Enter email"
            />
            <Input
              label="Age"
              type="number"
              value={bookingForm.patient_age}
              onChange={(e) => setBookingForm(prev => ({ ...prev, patient_age: e.target.value }))}
              placeholder="Enter age"
              min="1"
              max="120"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={bookingForm.department}
              onChange={(e) => setBookingForm(prev => ({ ...prev, department: e.target.value, doctor_id: '' }))}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map(dept => ({ value: dept.name, label: dept.display_name }))
              ]}
            />
            <Select
              label="Doctor (Optional)"
              value={bookingForm.doctor_id}
              onChange={(e) => setBookingForm(prev => ({ ...prev, doctor_id: e.target.value }))}
              options={doctorOptions}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Appointment Date"
              type="date"
              value={bookingForm.appointment_date}
              onChange={(e) => setBookingForm(prev => ({ ...prev, appointment_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Input
              label="Appointment Time"
              type="time"
              value={bookingForm.appointment_time}
              onChange={(e) => setBookingForm(prev => ({ ...prev, appointment_time: e.target.value }))}
              required
            />
            <Select
              label="Duration"
              value={bookingForm.duration_minutes.toString()}
              onChange={(e) => setBookingForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '1 hour' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={bookingForm.notes}
              onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special requirements or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBookingModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              className="flex-1"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong>Sancura</strong> - Advanced Hospital OPD Platform | 
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