import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { config } from "dotenv";

config();

console.log(process.env["BACKEND_IP_PORT"])

export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: process.env["BACKEND_IP_PORT"],
				changeOrigin: true
			},
		}
	},
	plugins: [sveltekit()]
});
