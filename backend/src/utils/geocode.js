import axios from "axios";

export const getCoordinates = async (locationString) => {
  try {
    const response = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          q: locationString,
          key: process.env.OPENCAGE_API_KEY,
          limit: 1,
        },
      }
    );

    const results = response.data.results;

    if (results && results.length > 0) {
      const { lat, lng } = results[0].geometry;
      return { lat, lng };
    }

    return null; // location not found
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};