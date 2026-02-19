// vite.config.ts
import { defineConfig } from "file:///Users/galois/Desktop/promo-tools-standalone/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import { svelte } from "file:///Users/galois/Desktop/promo-tools-standalone/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import dts from "file:///Users/galois/Desktop/promo-tools-standalone/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/galois/Desktop/promo-tools-standalone";
var vite_config_default = defineConfig({
  plugins: [
    svelte(),
    dts({
      insertTypesEntry: true
    })
  ],
  server: {
    port: 4001,
    host: true,
    cors: true
  },
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "PromoTools",
      formats: ["es", "umd"],
      fileName: (format) => `promo-tools.${format}.js`
    },
    rollupOptions: {
      external: [],
      // Don't externalize dependencies for UMD
      output: {
        globals: {},
        inlineDynamicImports: false
        // Allow code splitting
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZ2Fsb2lzL0Rlc2t0b3AvcHJvbW8tdG9vbHMtc3RhbmRhbG9uZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2dhbG9pcy9EZXNrdG9wL3Byb21vLXRvb2xzLXN0YW5kYWxvbmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2dhbG9pcy9EZXNrdG9wL3Byb21vLXRvb2xzLXN0YW5kYWxvbmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBzdmVsdGUgfSBmcm9tICdAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlJ1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGUoKSxcbiAgICBkdHMoe1xuICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbiAgICB9KVxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA0MDAxLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgY29yczogdHJ1ZVxuICB9LFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXG4gICAgICBuYW1lOiAnUHJvbW9Ub29scycsXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ3VtZCddLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGBwcm9tby10b29scy4ke2Zvcm1hdH0uanNgXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW10sIC8vIERvbid0IGV4dGVybmFsaXplIGRlcGVuZGVuY2llcyBmb3IgVU1EXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge30sXG4gICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiBmYWxzZSwgLy8gQWxsb3cgY29kZSBzcGxpdHRpbmdcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJylcbiAgICB9XG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzVCxTQUFTLG9CQUFvQjtBQUNuVixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjO0FBQ3ZCLE9BQU8sU0FBUztBQUhoQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixrQkFBa0I7QUFBQSxJQUNwQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDeEMsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLE1BQU0sS0FBSztBQUFBLE1BQ3JCLFVBQVUsQ0FBQyxXQUFXLGVBQWUsTUFBTTtBQUFBLElBQzdDO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUM7QUFBQTtBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ04sU0FBUyxDQUFDO0FBQUEsUUFDVixzQkFBc0I7QUFBQTtBQUFBLE1BQ3hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
