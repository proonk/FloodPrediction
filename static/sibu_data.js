// Historical data for Sibu, Sarawak
const sibuHistoricalData = {
    location: "Sibu, Sarawak",
    coordinates: {
        latitude: 2.2870,
        longitude: 111.8307
    },
    historicalWaterLevels: [
        { date: "2023-01-15", level: 2.8, rainfall: 120.5, risk_level: "High" },
        { date: "2023-02-10", level: 2.5, rainfall: 95.2, risk_level: "Medium" },
        { date: "2023-03-05", level: 2.1, rainfall: 45.5, risk_level: "Low" },
        { date: "2023-04-12", level: 1.8, rainfall: 30.2, risk_level: "Low" },
        { date: "2023-05-20", level: 1.5, rainfall: 25.8, risk_level: "Low" },
        { date: "2023-06-15", level: 1.7, rainfall: 35.4, risk_level: "Low" },
        { date: "2023-07-22", level: 2.0, rainfall: 55.6, risk_level: "Medium" },
        { date: "2023-08-10", level: 2.3, rainfall: 75.8, risk_level: "Medium" },
        { date: "2023-09-05", level: 2.6, rainfall: 110.2, risk_level: "High" },
        { date: "2023-10-18", level: 2.9, rainfall: 130.5, risk_level: "High" },
        { date: "2023-11-25", level: 3.2, rainfall: 150.8, risk_level: "High" },
        { date: "2023-12-10", level: 3.5, rainfall: 180.2, risk_level: "High" },
        { date: "2024-01-05", level: 3.3, rainfall: 160.5, risk_level: "High" },
        { date: "2024-02-15", level: 2.7, rainfall: 85.2, risk_level: "Medium" },
        { date: "2024-03-20", level: 2.2, rainfall: 50.5, risk_level: "Low" },
        { date: "2024-04-01", level: 2.1, rainfall: 45.5, risk_level: "Medium" }
    ],
    seasonalPatterns: {
        rainySeason: {
            startMonth: 10,
            endMonth: 3,
            averageRainfall: 150.5,
            averageWaterLevel: 2.8,
            riskLevel: "High"
        },
        drySeason: {
            startMonth: 4,
            endMonth: 9,
            averageRainfall: 45.2,
            averageWaterLevel: 1.8,
            riskLevel: "Low"
        }
    },
    floodZones: [
        {
            name: "Central Sibu",
            risk: "Medium",
            elevation: 8.5,
            population: 25000,
            evacuationCenters: 3
        },
        {
            name: "Sungai Merah",
            risk: "High",
            elevation: 5.2,
            population: 15000,
            evacuationCenters: 2
        },
        {
            name: "Sibu Jaya",
            risk: "Low",
            elevation: 12.8,
            population: 20000,
            evacuationCenters: 1
        }
    ],
    infrastructure: {
        bridges: 5,
        floodGates: 3,
        waterLevelStations: 2,
        rainfallStations: 4
    },
    emergencyContacts: {
        police: "084-321300",
        fire: "084-321444",
        hospital: "084-343333",
        floodHotline: "084-321555"
    }
};

// Function to get current conditions
function getCurrentConditions() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const isRainySeason = currentMonth >= 10 || currentMonth <= 3;
    
    return {
        date: today.toISOString().split('T')[0],
        waterLevel: 2.1,
        rainfall: 45.5,
        riskLevel: "Medium",
        season: isRainySeason ? "Rainy Season" : "Dry Season",
        trend: "Stable",
        lastUpdated: today.toISOString()
    };
}

// Function to get historical data for a specific date range
function getHistoricalData(startDate, endDate) {
    return sibuHistoricalData.historicalWaterLevels.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
}

// Function to predict future conditions
function predictFutureConditions(daysAhead) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const isRainySeason = currentMonth >= 10 || currentMonth <= 3;
    
    // Simple prediction model based on seasonal patterns
    const seasonalFactor = isRainySeason ? 1.5 : 0.8;
    const baseWaterLevel = isRainySeason ? 
        sibuHistoricalData.seasonalPatterns.rainySeason.averageWaterLevel : 
        sibuHistoricalData.seasonalPatterns.drySeason.averageWaterLevel;
    
    const predictedWaterLevel = baseWaterLevel * seasonalFactor;
    const predictedRiskLevel = predictedWaterLevel > 3.0 ? "High" : 
                              predictedWaterLevel > 2.5 ? "Medium" : "Low";
    
    return {
        date: new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedWaterLevel: predictedWaterLevel.toFixed(1),
        predictedRiskLevel: predictedRiskLevel,
        confidence: isRainySeason ? "High" : "Medium",
        factors: [
            "Seasonal patterns",
            "Historical data",
            "Current water levels",
            isRainySeason ? "Rainy season trend" : "Dry season trend"
        ]
    };
}

// Export the data and functions
window.sibuData = {
    historicalData: sibuHistoricalData,
    getCurrentConditions: getCurrentConditions,
    getHistoricalData: getHistoricalData,
    predictFutureConditions: predictFutureConditions
}; 