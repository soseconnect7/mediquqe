import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Calendar, 
  QrCode, 
  Users, 
  Clock,
  CheckCircle,
  ArrowRight,
  Smartphone,
  CreditCard,
  FileText
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  tips: string[];
}

interface InteractiveGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveGuide: React.FC<InteractiveGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Welcome to MediQueue",
      description: "Skip the waiting room! Book your appointment token online and track your queue position in real-time.",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      visual: (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">MediQueue Clinic</h3>
          <p className="text-gray-600">Smart Queue Management System</p>
        </div>
      ),
      tips: [
        "No more waiting in long queues",
        "Book from anywhere, anytime",
        "Real-time queue updates"
      ]
    },
    {
      id: 2,
      title: "Book Your Token",
      description: "Fill out a simple form with your details and select your preferred department. No account creation required!",
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      visual: (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="flex-1 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="flex-1 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="flex-1 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-blue-600 text-white text-center py-2 rounded font-medium">
              Book Token Now
            </div>
          </div>
        </div>
      ),
      tips: [
        "Just name, age, phone & department needed",
        "Choose to pay now or at clinic",
        "Takes less than 2 minutes"
      ]
    },
    {
      id: 3,
      title: "Get Your QR Code",
      description: "Instantly receive your unique QR code and token number. Save it to your phone for quick check-in at the clinic.",
      icon: <QrCode className="h-8 w-8 text-purple-600" />,
      visual: (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 inline-block">
            <div className="w-32 h-32 bg-black rounded grid grid-cols-8 gap-1 p-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'} rounded-sm`}></div>
              ))}
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-2">Token #42</div>
          <div className="text-sm text-gray-600">CLN1-ABC123XYZ</div>
        </div>
      ),
      tips: [
        "Download QR code to your phone",
        "Screenshot for backup",
        "Each QR code is unique and secure"
      ]
    },
    {
      id: 4,
      title: "Track Queue Status",
      description: "Monitor your position in the queue and estimated wait time in real-time. No need to arrive early!",
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      visual: (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">38</div>
              <div className="text-sm text-gray-600">Now Serving</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">15m</div>
              <div className="text-sm text-gray-600">Your Wait</div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span>Your Token: #42</span>
              <span>Position: #4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Updates every 30 seconds",
        "Arrive when your turn is close",
        "Get notifications on your phone"
      ]
    },
    {
      id: 5,
      title: "Quick Check-in",
      description: "Show your QR code at the reception for instant check-in. No paperwork, no waiting in line!",
      icon: <Smartphone className="h-8 w-8 text-green-600" />,
      visual: (
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="bg-white border-2 border-green-300 rounded-lg p-3 mb-2">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto" />
              </div>
              <div className="text-sm text-gray-600">Your Phone</div>
            </div>
            <ArrowRight className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <div className="bg-white border-2 border-green-300 rounded-lg p-3 mb-2">
                <div className="text-2xl">🏥</div>
              </div>
              <div className="text-sm text-gray-600">Reception</div>
            </div>
          </div>
          <div className="mt-4 bg-green-100 rounded-lg p-3 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-green-800">Checked In Successfully!</div>
          </div>
        </div>
      ),
      tips: [
        "Just show your QR code",
        "Instant check-in process",
        "No need to fill forms again"
      ]
    },
    {
      id: 6,
      title: "Payment Options",
      description: "Choose to pay online during booking or pay at the clinic. Both options are secure and convenient.",
      icon: <CreditCard className="h-8 w-8 text-blue-600" />,
      visual: (
        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Pay Online</div>
                <div className="text-sm text-blue-700">Secure payment with Stripe</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏥</div>
              <div>
                <div className="font-medium text-gray-900">Pay at Clinic</div>
                <div className="text-sm text-gray-700">Cash, Card, or UPI accepted</div>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Online payment saves time",
        "All payment methods accepted",
        "Secure and encrypted transactions"
      ]
    },
    {
      id: 7,
      title: "Download Prescriptions",
      description: "After your consultation, download your prescriptions anytime using your Patient UID. Keep your medical records safe!",
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      visual: (
        <div className="bg-purple-50 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="bg-white border-2 border-purple-200 rounded-lg p-4 inline-block">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Prescription.pdf</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-2">Enter Patient UID:</div>
            <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm mb-3">
              CLN1-ABC123XYZ
            </div>
            <div className="bg-purple-600 text-white text-center py-2 rounded font-medium">
              Download All Prescriptions
            </div>
          </div>
        </div>
      ),
      tips: [
        "Use your Patient UID to search",
        "Download individual or all prescriptions",
        "Includes complete doctor information"
      ]
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (currentStep < steps.length - 1) {
              setCurrentStep(prev => prev + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, steps.length]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(0);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setProgress(0);
    setIsPlaying(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How MediQueue Works" size="xl">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep * 100) + progress) / steps.length}%` }}
          ></div>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Current Step Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Step Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {currentStepData.icon}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {currentStepData.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-lg leading-relaxed">
                  {currentStepData.description}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
                  <ul className="space-y-1">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Visual Demo */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                  {currentStepData.visual}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
            >
              <SkipBack className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button onClick={handlePlay} variant="outline">
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {currentStep === 0 ? 'Start Tour' : 'Resume'}
                </>
              )}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              variant="outline"
            >
              Next
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex space-x-2">
            {currentStep === steps.length - 1 && (
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Started!
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        {currentStep === steps.length - 1 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Ready to get started?</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <Button 
                  onClick={() => {
                    onClose();
                    // Trigger booking modal
                    setTimeout(() => {
                      const bookButton = document.querySelector('[data-action="book-token"]') as HTMLButtonElement;
                      if (bookButton) bookButton.click();
                    }, 100);
                  }}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Token Now
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    onClose();
                    // Trigger prescription download
                    setTimeout(() => {
                      const prescriptionButton = document.querySelector('[data-action="download-prescriptions"]') as HTMLButtonElement;
                      if (prescriptionButton) prescriptionButton.click();
                    }, 100);
                  }}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Get Prescriptions
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    onClose();
                    // Trigger patient lookup
                    setTimeout(() => {
                      const lookupButton = document.querySelector('[data-action="track-uid"]') as HTMLButtonElement;
                      if (lookupButton) lookupButton.click();
                    }, 100);
                  }}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Track by UID
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Modal>
  );
};