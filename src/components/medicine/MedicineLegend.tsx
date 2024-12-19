import React from 'react';

const MedicineLegend = () => {
  return (
    <div className="mt-4 flex justify-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-diabetic-morning"></div>
        <span>Morning</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-diabetic-afternoon"></div>
        <span>Afternoon</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-diabetic-night"></div>
        <span>Night</span>
      </div>
    </div>
  );
};

export default MedicineLegend;