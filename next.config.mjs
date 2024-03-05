/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // ag-grid CSSを正しく扱うための設定を追加
       // config.module.rules.push({
        //  test: /\.css$/,
          //use: ['style-loader', 'css-loader'],
        //});
      }
  
      return config;
    },
  };
  
  export default nextConfig;
  