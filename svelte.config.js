import preprocess from 'svelte-preprocess';
import { optimizeImports } from "carbon-preprocess-svelte";

const config = {
	preprocess: [preprocess(), optimizeImports()],
};

export default config;
