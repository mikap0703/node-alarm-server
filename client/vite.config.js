import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import {config} from "dotenv";

config();

export default defineConfig({
	server: {
		proxy: {
			"/api": process.env.BACKEND_IP_PORT,
		},
	},
	plugins: [sveltekit()]
});
