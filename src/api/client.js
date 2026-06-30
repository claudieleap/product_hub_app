import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
});

export async function fetchHealth() {
    const { data } = await client.get('/v1/health');
    return data;
}

export default client;
