/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  outputFileTracingIncludes: {
    "app/api/search/route": [
      "./node_modules/onnxruntime-node/bin/**/*",
      "./node_modules/@huggingface/transformers/**/*.wasm",
    ],
  },
};
export default nextConfig;
