import axios from 'axios';
import { resolveApiBaseUrl } from '@/api/apiBaseUrl';

const client = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
});

export async function fetchHealth() {
    const { data } = await client.get('/health');
    return data;
}

export default client;
