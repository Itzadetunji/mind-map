import axios, { type AxiosError, type AxiosInstance } from "axios";

const baseURL = "/api/v1";

const $http: AxiosInstance = axios.create({
	baseURL,
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "max-age=604800, must-revalidate",
	},
	withCredentials: true,
});

$http.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		const data = error.response?.data as
			| { success?: boolean; message?: string; errors?: string[] }
			| undefined;
		const firstError =
			data?.errors?.[0] ?? data?.message ?? error.message ?? "Request failed";
		return Promise.reject(
			Object.assign(new Error(firstError), { response: error.response }),
		);
	},
);

export default $http;
