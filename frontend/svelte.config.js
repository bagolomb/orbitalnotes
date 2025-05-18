import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html' // for client-side routing
    }),
    paths: {
      base: '' // ensure this is empty if hosting at root
    },
  }
};
