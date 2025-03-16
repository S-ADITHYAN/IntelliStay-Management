import axios from 'axios';

export const getRecommendations = async (userId, searchCriteria) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API}/user/recommendations`, {
            params: {
                userId,
                adults: searchCriteria.adults,
                children: searchCriteria.children,
                checkIn: searchCriteria.checkIn,
                checkOut: searchCriteria.checkOut
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return null;
    }
}; 