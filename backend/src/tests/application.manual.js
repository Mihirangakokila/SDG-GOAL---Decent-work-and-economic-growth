// Test script to verify application functionality
import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test applying to an internship
async function testApplyToInternship() {
    try {
        const response = await axios.post(`${BASE_URL}/api/applications/apply`, {
            internshipId: 'intern-123' // This would come from seed data
        }, {
            headers: {
                'Authorization': 'Bearer mock-token' // Auth token will be handled by auth team
            }
        });
        
        console.log('Apply Response:', response.data);
    } catch (error) {
        console.error('Apply Error:', error.response?.data || error.message);
    }
}

// Test fetching applications
async function testGetMyApplications() {
    try {
        const response = await axios.get(`${BASE_URL}/api/applications/my-applications`, {
            headers: {
                'Authorization': 'Bearer mock-token'
            }
        });
        
        console.log('My Applications:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error.response?.data || error.message);
    }
}

// Run tests
// testApplyToInternship();
// testGetMyApplications();