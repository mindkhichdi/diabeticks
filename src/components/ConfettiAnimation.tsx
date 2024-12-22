import Lottie from "lottie-react";
import { useEffect, useState } from "react";

interface ConfettiAnimationProps {
  onComplete?: () => void;
}

const ConfettiAnimation = ({ onComplete }: ConfettiAnimationProps) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetch the Lottie animation data
    fetch("https://lottie.host/55f199c6-5788-4699-947b-24c33ff0c462/gCvMieluW7.json")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Check if we've already read the response body
        if (response.bodyUsed) {
          throw new Error('Response body has already been consumed');
        }
        return response.json();
      })
      .then(data => setAnimationData(data))
      .catch(error => {
        console.error("Error loading animation:", error);
        // Fallback to a default animation or handle the error gracefully
        fetch("/confetti-fallback.json")
          .then(response => response.json())
          .then(data => setAnimationData(data))
          .catch(err => console.error("Error loading fallback animation:", err));
      });
  }, []);

  if (!animationData) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Lottie
        animationData={animationData}
        loop={false}
        onComplete={onComplete}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ConfettiAnimation;