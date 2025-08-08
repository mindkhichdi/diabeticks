import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfUse = () => {
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
          <h1 className="text-3xl font-bold text-primary mb-6">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Acceptance of Terms</h2>
              <p className="text-foreground">
                By accessing and using Diabeticks, you accept and agree to be bound by these Terms of Use 
                and our Privacy Policy. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Medical Disclaimer</h2>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-foreground font-semibold">
                  IMPORTANT: Diabeticks is NOT a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Always consult your healthcare provider before making medical decisions</li>
                <li>Do not ignore professional medical advice or delay seeking it because of information from our app</li>
                <li>In case of medical emergencies, contact emergency services immediately</li>
                <li>Our app provides tracking and monitoring tools only, not medical advice</li>
                <li>Individual health data may not be accurate due to device limitations or user error</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. User Responsibilities for Medical Data</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Data Accuracy</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>You are responsible for entering accurate health information</li>
                  <li>Verify all blood glucose readings and medication data</li>
                  <li>Report any technical issues that may affect data accuracy</li>
                  <li>Regularly review and update your health profile</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground">Safe Usage</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>Do not rely solely on app notifications for critical medication reminders</li>
                  <li>Maintain backup systems for important health monitoring</li>
                  <li>Ensure your devices are properly calibrated and maintained</li>
                  <li>Keep your account secure with strong passwords and regular updates</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Permitted Use of Health Data</h2>
              <div className="space-y-4 text-foreground">
                <p>You grant us permission to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process your health data to provide tracking and monitoring services</li>
                  <li>Generate personalized insights and recommendations</li>
                  <li>Integrate with your approved medical devices and healthcare systems</li>
                  <li>Use anonymized, aggregated data for service improvement and research</li>
                  <li>Store your data securely in our HIPAA-compliant systems</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Sharing your account credentials with others</li>
                <li>Using the service for illegal or unauthorized purposes</li>
                <li>Attempting to reverse engineer or compromise our security systems</li>
                <li>Uploading false or misleading health information</li>
                <li>Using the service to provide medical advice to others</li>
                <li>Interfering with other users' access to the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Data Ownership and Portability</h2>
              <div className="space-y-4 text-foreground">
                <p><strong>You retain ownership of your health data.</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You can export your data at any time in standard formats</li>
                  <li>You can delete your account and data upon request</li>
                  <li>We provide tools for data portability to other healthcare systems</li>
                  <li>Your data remains yours even while using our services</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Service Availability</h2>
              <p className="text-foreground">
                While we strive for high availability, we cannot guarantee uninterrupted service. 
                Medical emergencies should never rely solely on our app. We may temporarily suspend 
                service for maintenance, updates, or technical issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Limitation of Liability</h2>
              <p className="text-foreground">
                We are not liable for any health consequences resulting from the use of our service. 
                Our liability is limited to the extent permitted by law. Users assume full responsibility 
                for their healthcare decisions and should always consult healthcare professionals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Termination</h2>
              <p className="text-foreground">
                Either party may terminate this agreement at any time. Upon termination, your access 
                to the service will cease, but you may export your data within 30 days. 
                We reserve the right to terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Changes to Terms</h2>
              <p className="text-foreground">
                We may update these terms periodically. Significant changes will be communicated 
                via email or app notification. Continued use of the service after changes 
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">11. Contact Information</h2>
              <p className="text-foreground">
                For questions about these terms or our service:
                <br />
                Email: support@diabeticks.com
                <br />
                Legal: legal@diabeticks.com
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

export default TermsOfUse;