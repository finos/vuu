// vite.config.js
import { defineConfig } from "file:///Users/steve/github/finos/vuu/vuu-ui/node_modules/vite/dist/node/index.js";

// ../tools/vite-plugin-inline-css/src/index.ts
import { createFilter } from "file:///Users/steve/github/finos/vuu/vuu-ui/node_modules/vite/dist/node/index.js";
import MagicString from "file:///Users/steve/github/finos/vuu/vuu-ui/node_modules/magic-string/dist/magic-string.es.mjs";
function cssInline(options = {}) {
  const {
    exclude = ["**/**.stories.tsx"],
    include = [
      "**/packages/vuu-datatable/**/*.{tsx,jsx}",
      "**/packages/vuu-data-react/**/*.{tsx,jsx}",
      "**/packages/vuu-filters/**/*.{tsx,jsx}",
      "**/packages/vuu-layout/**/*.{tsx,jsx}",
      "**/packages/vuu-popups/**/*.{tsx,jsx}",
      "**/packages/vuu-shell/**/*.{tsx,jsx}",
      "**/packages/vuu-table/**/*.{tsx,jsx}",
      "**/packages/vuu-table-extras/**/*.{tsx,jsx}",
      "**/packages/vuu-ui-controls/**/*.{tsx,jsx}"
    ]
  } = options;
  const filter = createFilter(include, exclude);
  return {
    name: "css-inline-plugin",
    enforce: "pre",
    transform(src, id) {
      if (filter(id)) {
        const s = new MagicString(src);
        s.replaceAll('.css";', '.css?inline";');
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id })
        };
      }
    }
  };
}

// vite.config.js
var vite_config_default = defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: "esnext"
  },
  define: {
    "process.env.NODE_DEBUG": false,
    "process.env.LOCAL": true,
    "process.env.LAYOUT_BASE_URL": `"http://127.0.0.1:8081/api"`
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext"
  },
  plugins: [cssInline()],
  server: {
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        secure: false
      }
    }
  },
  preview: {
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        secure: false
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiLi4vdG9vbHMvdml0ZS1wbHVnaW4taW5saW5lLWNzcy9zcmMvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc3RldmUvZ2l0aHViL2Zpbm9zL3Z1dS92dXUtdWkvc2hvd2Nhc2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zdGV2ZS9naXRodWIvZmlub3MvdnV1L3Z1dS11aS9zaG93Y2FzZS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc3RldmUvZ2l0aHViL2Zpbm9zL3Z1dS92dXUtdWkvc2hvd2Nhc2Uvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgY3NzSW5saW5lIH0gZnJvbSBcIi4uL3Rvb2xzL3ZpdGUtcGx1Z2luLWlubGluZS1jc3Mvc3JjXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgbWluaWZ5OiBmYWxzZSxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgdGFyZ2V0OiBcImVzbmV4dFwiLFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICBcInByb2Nlc3MuZW52Lk5PREVfREVCVUdcIjogZmFsc2UsXG4gICAgXCJwcm9jZXNzLmVudi5MT0NBTFwiOiB0cnVlLFxuICAgIFwicHJvY2Vzcy5lbnYuTEFZT1VUX0JBU0VfVVJMXCI6IGBcImh0dHA6Ly8xMjcuMC4wLjE6ODA4MS9hcGlcImAsXG4gIH0sXG4gIGVzYnVpbGQ6IHtcbiAgICBqc3g6IGBhdXRvbWF0aWNgLFxuICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgfSxcbiAgcGx1Z2luczogW2Nzc0lubGluZSgpXSxcbiAgc2VydmVyOiB7XG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaS9hdXRoblwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwczovL2xvY2FsaG9zdDo4NDQzXCIsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBwcm94eToge1xuICAgICAgXCIvYXBpL2F1dGhuXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vbG9jYWxob3N0Ojg0NDNcIixcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc3RldmUvZ2l0aHViL2Zpbm9zL3Z1dS92dXUtdWkvdG9vbHMvdml0ZS1wbHVnaW4taW5saW5lLWNzcy9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zdGV2ZS9naXRodWIvZmlub3MvdnV1L3Z1dS11aS90b29scy92aXRlLXBsdWdpbi1pbmxpbmUtY3NzL3NyYy9pbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc3RldmUvZ2l0aHViL2Zpbm9zL3Z1dS92dXUtdWkvdG9vbHMvdml0ZS1wbHVnaW4taW5saW5lLWNzcy9zcmMvaW5kZXgudHNcIjtpbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyBjcmVhdGVGaWx0ZXIgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IE1hZ2ljU3RyaW5nIGZyb20gXCJtYWdpYy1zdHJpbmdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIEdsb2IgcGF0dGVybnMgdG8gaWdub3JlICovXG4gIGV4Y2x1ZGU/OiBzdHJpbmdbXTtcbiAgLyoqIEdsb2IgcGF0dGVybnMgdG8gaW5jbHVkZS4gZGVmYXVsdHMgdG8gdHN8dHN4ICovXG4gIGluY2x1ZGU/OiBzdHJpbmdbXTtcbn1cblxuLy8gVGhpcyBwbHVnaW4gYWRkcyBcIj9pbmxpbmVcIiB0byBlYWNoIGNzcyBpbXBvcnQgd2l0aGluIG91ciBjb21wb25lbnRzIHRvIGRpc2FibGVcbi8vIHZpdGUncyBvd24gc3R5bGUgaW5qZWN0aW9uIHVzZWQgaW4gc3Rvcnlib29rXG5leHBvcnQgZnVuY3Rpb24gY3NzSW5saW5lKG9wdGlvbnM6IE9wdGlvbnMgPSB7fSk6IFBsdWdpbiB7XG4gIGNvbnN0IHtcbiAgICBleGNsdWRlID0gW1wiKiovKiouc3Rvcmllcy50c3hcIl0sXG4gICAgaW5jbHVkZSA9IFtcbiAgICAgIFwiKiovcGFja2FnZXMvdnV1LWRhdGF0YWJsZS8qKi8qLnt0c3gsanN4fVwiLFxuICAgICAgXCIqKi9wYWNrYWdlcy92dXUtZGF0YS1yZWFjdC8qKi8qLnt0c3gsanN4fVwiLFxuICAgICAgXCIqKi9wYWNrYWdlcy92dXUtZmlsdGVycy8qKi8qLnt0c3gsanN4fVwiLFxuICAgICAgXCIqKi9wYWNrYWdlcy92dXUtbGF5b3V0LyoqLyoue3RzeCxqc3h9XCIsXG4gICAgICBcIioqL3BhY2thZ2VzL3Z1dS1wb3B1cHMvKiovKi57dHN4LGpzeH1cIixcbiAgICAgIFwiKiovcGFja2FnZXMvdnV1LXNoZWxsLyoqLyoue3RzeCxqc3h9XCIsXG4gICAgICBcIioqL3BhY2thZ2VzL3Z1dS10YWJsZS8qKi8qLnt0c3gsanN4fVwiLFxuICAgICAgXCIqKi9wYWNrYWdlcy92dXUtdGFibGUtZXh0cmFzLyoqLyoue3RzeCxqc3h9XCIsXG4gICAgICBcIioqL3BhY2thZ2VzL3Z1dS11aS1jb250cm9scy8qKi8qLnt0c3gsanN4fVwiLFxuICAgIF0sXG4gIH0gPSBvcHRpb25zO1xuICBjb25zdCBmaWx0ZXIgPSBjcmVhdGVGaWx0ZXIoaW5jbHVkZSwgZXhjbHVkZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImNzcy1pbmxpbmUtcGx1Z2luXCIsXG4gICAgZW5mb3JjZTogXCJwcmVcIixcbiAgICB0cmFuc2Zvcm0oc3JjLCBpZCkge1xuICAgICAgaWYgKGZpbHRlcihpZCkpIHtcbiAgICAgICAgY29uc3QgcyA9IG5ldyBNYWdpY1N0cmluZyhzcmMpO1xuICAgICAgICBzLnJlcGxhY2VBbGwoJy5jc3NcIjsnLCAnLmNzcz9pbmxpbmVcIjsnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBzLnRvU3RyaW5nKCksXG4gICAgICAgICAgbWFwOiBzLmdlbmVyYXRlTWFwKHsgaGlyZXM6IHRydWUsIHNvdXJjZTogaWQgfSksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVQsU0FBUyxvQkFBb0I7OztBQ0N0VixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLGlCQUFpQjtBQVdqQixTQUFTLFVBQVUsVUFBbUIsQ0FBQyxHQUFXO0FBQ3ZELFFBQU07QUFBQSxJQUNKLFVBQVUsQ0FBQyxtQkFBbUI7QUFBQSxJQUM5QixVQUFVO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0YsSUFBSTtBQUNKLFFBQU0sU0FBUyxhQUFhLFNBQVMsT0FBTztBQUU1QyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsSUFDVCxVQUFVLEtBQUssSUFBSTtBQUNqQixVQUFJLE9BQU8sRUFBRSxHQUFHO0FBQ2QsY0FBTSxJQUFJLElBQUksWUFBWSxHQUFHO0FBQzdCLFVBQUUsV0FBVyxVQUFVLGVBQWU7QUFDdEMsZUFBTztBQUFBLFVBQ0wsTUFBTSxFQUFFLFNBQVM7QUFBQSxVQUNqQixLQUFLLEVBQUUsWUFBWSxFQUFFLE9BQU8sTUFBTSxRQUFRLEdBQUcsQ0FBQztBQUFBLFFBQ2hEO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7OztBRHpDQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sMEJBQTBCO0FBQUEsSUFDMUIscUJBQXFCO0FBQUEsSUFDckIsK0JBQStCO0FBQUEsRUFDakM7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLEtBQUs7QUFBQSxJQUNMLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsRUFDckIsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
