// Helper to convert degrees to radians
const deg2rad = (deg) => deg * (Math.PI / 180);

// Haversine formula to calculate real distance between two coordinate points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

function findMatches(resource, options) {
  // FORCE TYPE CONVERSION: Ensure the target resource coordinates are absolute numbers
  const rLat = parseFloat(resource.latitude);
  const rLon = parseFloat(resource.longitude);
  
  const MAX_DISTANCE = 10; // 10 kilometers max radius
  
  return options
    .map(option => {
      // FORCE TYPE CONVERSION: Ensure candidate option coordinates are absolute numbers
      const oLat = parseFloat(option.latitude);
      const oLon = parseFloat(option.longitude);
      
      // 1. Calculate Distance Matrix
      const distance = calculateDistance(rLat, rLon, oLat, oLat);
      
      // 2. Calculate Distance Score (Closer = Higher Score)
      let distanceScore = 0;
      if (distance <= MAX_DISTANCE) {
        distanceScore = 1 - (distance / MAX_DISTANCE); 
      }
      
      // 3. Calculate Temporal Urgency Score (Closer to expiry = Higher Score)
      const now = Date.now();
      const rExpiry = new Date(resource.expiry_at).getTime();
      const oExpiry = new Date(option.expiry_at).getTime();
      
      const timeRemaining = oExpiry - now;
      
      let timeScore = 0;
      if (timeRemaining > 0) {
        // Normalize against a standard 48-hour window for degradation scoring
        const maxWindow = 48 * 60 * 60 * 1000; 
        timeScore = 1 - Math.min(timeRemaining / maxWindow, 1);
      }

      // 4. Multi-Objective Weighted Scoring Matrix (50% Location Proximity, 50% Time Urgency)
      const matchScore = (0.5 * distanceScore) + (0.5 * timeScore);

      return {
        ...option,
        distanceKm: distance.toFixed(2),
        matchScore: parseFloat(matchScore.toFixed(4))
      };
    })
    // Sort dynamically from highest matching percentage to lowest matching percentage
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { findMatches };