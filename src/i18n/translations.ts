export const translations = {
  en: {
    // Medicine
    medicineDailyTracker: "Daily Medicine Tracker",
    morning: "Morning",
    afternoon: "Afternoon",
    night: "Night",
    takeMedicine: "Take Medicine",
    medicineHistory: "Medicine History",
    medicineTaken: "Medicine Taken",
    
    // Readings
    bloodSugarReadings: "Blood Sugar Readings",
    fasting: "Fasting",
    postPrandial: "Post Prandial",
    hba1c: "HbA1c",
    addReading: "Add Reading",
    
    // Food
    foodIntakeTracker: "Food Intake Tracker",
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
    addFood: "Add Food",
    calories: "Calories",
    
    // Fitness
    fitnessTracker: "Fitness Tracker",
    addActivity: "Add Activity",
    duration: "Duration",
    caloriesBurned: "Calories Burned",
    
    // Prescriptions
    prescriptions: "Prescriptions",
    uploadPrescription: "Upload Prescription",
    
    // Common
    signOut: "Sign Out",
    medicine: "Medicine",
    readings: "Readings",
    scripts: "Scripts",
    food: "Food",
    fitness: "Fitness",
    language: "Language"
  },
  hi: {
    // Medicine
    medicineDailyTracker: "दैनिक दवा ट्रैकर",
    morning: "सुबह",
    afternoon: "दोपहर",
    night: "रात",
    takeMedicine: "दवा लें",
    medicineHistory: "दवा का इतिहास",
    medicineTaken: "दवा ली गई",
    
    // Readings
    bloodSugarReadings: "रक्त शर्करा रीडिंग",
    fasting: "उपवास",
    postPrandial: "भोजन के बाद",
    hba1c: "HbA1c",
    addReading: "रीडिंग जोड़ें",
    
    // Food
    foodIntakeTracker: "खाना ट्रैकर",
    breakfast: "नाश्ता",
    lunch: "दोपहर का भोजन",
    snacks: "नाश्ता",
    dinner: "रात का खाना",
    addFood: "भोजन जोड़ें",
    calories: "कैलोरी",
    
    // Fitness
    fitnessTracker: "फिटनेस ट्रैकर",
    addActivity: "गतिविधि जोड़ें",
    duration: "अवधि",
    caloriesBurned: "जली हुई कैलोरी",
    
    // Prescriptions
    prescriptions: "नुस्खे",
    uploadPrescription: "नुस्खा अपलोड करें",
    
    // Common
    signOut: "साइन आउट",
    medicine: "दवा",
    readings: "रीडिंग",
    scripts: "नुस्खे",
    food: "भोजन",
    fitness: "फिटनेस",
    language: "भाषा"
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;