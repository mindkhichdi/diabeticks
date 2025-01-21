import Lottie from "lottie-react";
import { useEffect, useState } from "react";

interface ConfettiAnimationProps {
  onComplete?: () => void;
}

const ConfettiAnimation = ({ onComplete }: ConfettiAnimationProps) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetch the Lottie animation data from a public URL
    fetch("https://assets5.lottiefiles.com/packages/lf20_u4yrau.json")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setAnimationData(data))
      .catch(error => {
        console.error("Error loading animation:", error);
        // Use a simple confetti animation as fallback
        setAnimationData({
          v: "5.5.7",
          fr: 30,
          ip: 0,
          op: 60,
          w: 512,
          h: 512,
          nm: "Simple Confetti",
          ddd: 0,
          assets: [],
          layers: [{
            ty: 4,
            sr: 1,
            st: 0,
            op: 60,
            ip: 0,
            hd: false,
            ddd: 0,
            bm: 0,
            hasMask: false,
            ao: 0,
            ks: {
              o: { a: 1, k: [{ t: 0, s: [100], e: [0] }, { t: 60 }] },
              p: { a: 1, k: [{ t: 0, s: [256, 256], e: [256, 512] }, { t: 60 }] }
            },
            shapes: [{
              ty: "el",
              d: 1,
              s: { a: 0, k: [20, 20] },
              p: { a: 0, k: [0, 0] },
              nm: "Confetti Particle",
              c: { a: 0, k: [1, 0.5, 0] }
            }]
          }]
        });
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