import axios, { AxiosResponse } from 'axios'

const rest = axios.create({
	baseURL: 'http://localhost:8080',
	withCredentials: false
})

const getAxiosRequest = async (
	endpoint: string
): Promise<AxiosResponse | null> => {
	try {
		const resp = await rest.get(endpoint)
		return resp.data
	} catch (err) {
		return null
	}
}

export { getAxiosRequest }
