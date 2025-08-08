import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-foreground">
                <h3 className="text-lg font-medium">Medical and Health Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Blood sugar readings and glucose monitoring data</li>
                  <li>Medication schedules, dosages, and adherence records</li>
                  <li>Food intake, nutritional information, and dietary preferences</li>
                  <li>Physical activity data, exercise logs, and fitness metrics</li>
                  <li>Health goals, medical conditions, and treatment plans</li>
                  <li>Prescription information and medication history</li>
                  <li>Device integration data from glucose monitors and fitness trackers</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. How We Use Your Medical Data</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Provide personalized health tracking and monitoring services</li>
                <li>Generate insights and trends about your health metrics</li>
                <li>Send medication reminders and health notifications</li>
                <li>Improve our health tracking algorithms and recommendations</li>
                <li>Ensure proper functioning of medical device integrations</li>
                <li>Provide customer support and troubleshooting assistance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Medical Data Protection</h2>
              <div className="space-y-4 text-foreground">
                <p>We implement industry-standard security measures to protect your sensitive health information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>End-to-end encryption for all medical data transmission</li>
                  <li>Secure cloud storage with HIPAA-compliant infrastructure</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Data backup and disaster recovery procedures</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Data Sharing and Disclosure</h2>
              <div className="space-y-4 text-foreground">
                <p><strong>We do NOT sell your medical data to third parties.</strong></p>
                <p>Your health information may only be shared in these limited circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With your explicit consent for healthcare provider integration</li>
                  <li>When required by law or legal process</li>
                  <li>To prevent serious harm to health or safety</li>
                  <li>With trusted service providers under strict confidentiality agreements</li>
                  <li>In anonymized, aggregated form for research purposes (no personal identification)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Your Rights and Controls</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Access and download all your health data</li>
                <li>Correct or update your medical information</li>
                <li>Delete your account and all associated health data</li>
                <li>Opt-out of data processing for research purposes</li>
                <li>Control sharing permissions with healthcare providers</li>
                <li>Receive notifications about data breaches or security incidents</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Data Retention</h2>
              <p className="text-foreground">
                We retain your medical data for as long as your account is active or as needed to provide services. 
                Upon account deletion, all personal health information is permanently removed within 30 days, 
                except where retention is required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. International Data Transfers</h2>
              <p className="text-foreground">
                Your health data may be processed in countries other than your residence. We ensure adequate 
                protection through appropriate safeguards, including data processing agreements and 
                privacy frameworks compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Contact Us</h2>
              <p className="text-foreground">
                For privacy concerns or data protection requests, contact us at:
                <br />
                Email: privacy@diabeticks.com
                <br />
                Address: [Your Company Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;