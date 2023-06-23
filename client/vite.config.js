import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import {config} from "dotenv";

config();

export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: process.env.BACKEND_IP_PORT,
				changeOrigin: true,
				secure: false,
			}
		}
	},
	plugins: [sveltekit()]
});
